"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { supabase, getUserId, isOfflineMode } from "@/lib/supabase"

// Define the Poll type
export type Poll = {
  id: string
  question: string
  votes: number
  timestamp: number
  answer?: string
}

// Define the context type
type PollContextType = {
  polls: Poll[]
  votedPolls: Set<string>
  addPoll: (question: string) => Promise<void>
  votePoll: (id: string) => Promise<void>
  removePoll: (id: string) => Promise<void>
  answerPoll: (id: string, answer: string) => Promise<void>
  isLoading: boolean
  error: string | null
  refreshPolls: () => Promise<void>
  isOfflineMode: boolean
}

// Create the context with default values
const PollContext = createContext<PollContextType>({
  polls: [],
  votedPolls: new Set(),
  addPoll: async () => {},
  votePoll: async () => {},
  removePoll: async () => {},
  answerPoll: async () => {},
  isLoading: true,
  error: null,
  refreshPolls: async () => {},
  isOfflineMode: false,
})

// Custom hook to use the poll context
export const usePollContext = () => useContext(PollContext)

// Provider component
export function PollProvider({ children }: { children: ReactNode }) {
  const [polls, setPolls] = useState<Poll[]>([])
  const [votedPolls, setVotedPolls] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Function to fetch polls from Supabase or localStorage
  const fetchPolls = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // --- SEEDING COMMENTED OUT - START WITH CLEAN DB ---
      // if (!isOfflineMode && supabase && !sessionStorage.getItem("poll-seeded")) {
      //   seedInitialData()
      //     .catch((e) => console.warn("Seed skipped – offline/error:", e?.message ?? e))
      //     .finally(() => sessionStorage.setItem("poll-seeded", "true"))
      // }

      if (isOfflineMode || !supabase) {
        // If offline mode, use localStorage
        console.log("Using offline mode (localStorage) for polls")
        const savedPolls = localStorage.getItem("polls")
        if (savedPolls) {
          setPolls(JSON.parse(savedPolls))
        }

        const savedVotes = localStorage.getItem("votedPolls")
        if (savedVotes) {
          setVotedPolls(new Set(JSON.parse(savedVotes)))
        }
      } else {
        // Try to fetch from Supabase with timeout
        try {
          console.log("Attempting to fetch from Supabase...")

          // Add a timeout to prevent hanging
          const fetchWithTimeout = async () => {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

            try {
              const { data: pollsData, error: pollsError } = await supabase
                .from("polls")
                .select("*")
                .order("votes", { ascending: false })
                .order("timestamp", { ascending: false })
                .abortSignal(controller.signal)

              clearTimeout(timeoutId)

              if (pollsError) {
                throw new Error(pollsError.message)
              }

              return pollsData
            } catch (error) {
              clearTimeout(timeoutId)
              throw error
            }
          }

          const pollsData = await fetchWithTimeout()

          if (pollsData) {
            console.log("Polls fetched successfully:", pollsData.length)
            setPolls(pollsData as Poll[])
            localStorage.setItem("polls", JSON.stringify(pollsData))
          }

          // Fetch user's votes with timeout
          const userId = getUserId()
          const { data: votesData, error: votesError } = await supabase
            .from("votes")
            .select("poll_id")
            .eq("user_id", userId)

          if (votesError) {
            throw new Error(votesError.message)
          }

          if (votesData) {
            const userVotedPolls = new Set(votesData.map((vote) => vote.poll_id))
            setVotedPolls(userVotedPolls)
            localStorage.setItem("votedPolls", JSON.stringify([...userVotedPolls]))
          }
        } catch (fetchError) {
          console.error("Supabase fetch failed, using localStorage:", fetchError)

          // Fall back to localStorage
          const savedPolls = localStorage.getItem("polls")
          if (savedPolls) {
            setPolls(JSON.parse(savedPolls))
          }

          const savedVotes = localStorage.getItem("votedPolls")
          if (savedVotes) {
            setVotedPolls(new Set(JSON.parse(savedVotes)))
          }

          // Don't throw the error - just continue with localStorage
        }
      }
    } catch (err) {
      console.error("Error fetching data:", err)
      setError("Failed to load polls. Using offline mode with local data.")
    } finally {
      setIsLoading(false)
    }
  }

  // Load polls on mount
  useEffect(() => {
    fetchPolls()

    // Set up real-time subscription for polls if not in offline mode
    if (!isOfflineMode && supabase) {
      try {
        console.log("Setting up real-time subscription for polls")
        const pollsSubscription = supabase
          .channel("polls-channel")
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "polls",
            },
            (payload) => {
              console.log("Real-time update received:", payload)
              // Refresh polls when changes occur
              fetchPolls().catch(console.error)
            },
          )
          .subscribe()

        return () => {
          // Clean up subscription
          console.log("Cleaning up real-time subscription")
          supabase.removeChannel(pollsSubscription)
        }
      } catch (subError) {
        console.error("Error setting up real-time subscription:", subError)
        // Continue without real-time updates
      }
    }
  }, [])

  // Save to localStorage as backup
  useEffect(() => {
    if (polls.length > 0) {
      localStorage.setItem("polls", JSON.stringify(polls))
    }
  }, [polls])

  // Add a new poll
  const addPoll = async (question: string) => {
    try {
      const newPoll: Poll = {
        id: crypto.randomUUID(),
        question,
        votes: 0,
        timestamp: Date.now(),
      }

      // Update local state first for immediate feedback
      setPolls((prev) => [...prev, newPoll])

      // Try to add to Supabase if not in offline mode
      if (!isOfflineMode && supabase) {
        try {
          console.log("Adding poll to Supabase:", newPoll)
          const { data, error: insertError } = await supabase.from("polls").insert([newPoll]).select()

          if (insertError) {
            console.error("Error adding poll to Supabase:", insertError)
            throw insertError
          }

          console.log("Poll added to Supabase successfully:", data)
        } catch (dbError) {
          console.error("Error adding poll to database:", dbError)
          // Revert local state if database operation failed
          setPolls((prev) => prev.filter((poll) => poll.id !== newPoll.id))
          throw dbError
        }
      }
    } catch (err) {
      console.error("Error adding poll:", err)
      setError("Failed to add poll. Please try again.")
      throw err
    }
  }

  // Vote for a poll
  const votePoll = async (id: string) => {
    // Check if already voted
    if (votedPolls.has(id)) {
      return
    }

    try {
      // Get current poll
      const poll = polls.find((p) => p.id === id)
      if (!poll) return

      const newVoteCount = poll.votes + 1

      // Update local state first for immediate feedback
      setPolls((prev) => prev.map((poll) => (poll.id === id ? { ...poll, votes: newVoteCount } : poll)))

      // Track that this poll has been voted on
      const newVotedPolls = new Set(votedPolls)
      newVotedPolls.add(id)
      setVotedPolls(newVotedPolls)

      // Save to localStorage
      localStorage.setItem("votedPolls", JSON.stringify([...newVotedPolls]))

      // Try to update in Supabase if not in offline mode
      if (!isOfflineMode && supabase) {
        try {
          const userId = getUserId()
          console.log("Voting on poll in Supabase:", id)

          // Update poll votes in Supabase
          const { error: updateError } = await supabase.from("polls").update({ votes: newVoteCount }).eq("id", id)

          if (updateError) {
            console.error("Error updating poll votes in Supabase:", updateError)
            throw updateError
          }

          // Record the vote
          const voteRecord = {
            id: crypto.randomUUID(),
            poll_id: id,
            user_id: userId,
            created_at: new Date().toISOString(),
          }

          const { error: voteError } = await supabase.from("votes").insert([voteRecord])

          if (voteError) {
            console.error("Error recording vote in Supabase:", voteError)
            throw voteError
          }

          console.log("Vote recorded in Supabase successfully")
        } catch (dbError) {
          console.error("Error updating vote in database:", dbError)
          // Revert local state if database operation failed
          setPolls((prev) => prev.map((poll) => (poll.id === id ? { ...poll, votes: poll.votes - 1 } : poll)))
          const revertedVotedPolls = new Set(votedPolls)
          revertedVotedPolls.delete(id)
          setVotedPolls(revertedVotedPolls)
          localStorage.setItem("votedPolls", JSON.stringify([...revertedVotedPolls]))
          throw dbError
        }
      }
    } catch (err) {
      console.error("Error voting on poll:", err)
      setError("Failed to register vote. Please try again.")
    }
  }

  // Remove a poll
  const removePoll = async (id: string) => {
    try {
      // Store the poll for potential rollback
      const pollToRemove = polls.find((poll) => poll.id === id)

      // Update local state first for immediate feedback
      setPolls((prev) => prev.filter((poll) => poll.id !== id))

      // Try to remove from Supabase if not in offline mode
      if (!isOfflineMode && supabase) {
        try {
          console.log("Removing poll from Supabase:", id)
          const { error } = await supabase.from("polls").delete().eq("id", id)

          if (error) {
            console.error("Error removing poll from Supabase:", error)
            throw error
          }

          console.log("Poll removed from Supabase successfully")
        } catch (dbError) {
          console.error("Error removing poll from database:", dbError)
          // Revert local state if database operation failed
          if (pollToRemove) {
            setPolls((prev) => [...prev, pollToRemove])
          }
          throw dbError
        }
      }
    } catch (err) {
      console.error("Error removing poll:", err)
      setError("Failed to remove poll. Please try again.")
    }
  }

  // Answer a poll
  const answerPoll = async (id: string, answer: string) => {
    try {
      // Store the original answer for potential rollback
      const originalPoll = polls.find((poll) => poll.id === id)
      const originalAnswer = originalPoll?.answer

      // Update local state first for immediate feedback
      setPolls((prev) => prev.map((poll) => (poll.id === id ? { ...poll, answer } : poll)))

      // Try to update in Supabase if not in offline mode
      if (!isOfflineMode && supabase) {
        try {
          console.log("Updating poll answer in Supabase:", id)
          const { error } = await supabase.from("polls").update({ answer }).eq("id", id)

          if (error) {
            console.error("Error updating poll answer in Supabase:", error)
            throw error
          }

          console.log("Poll answer updated in Supabase successfully")
        } catch (dbError) {
          console.error("Error updating answer in database:", dbError)
          // Revert local state if database operation failed
          setPolls((prev) => prev.map((poll) => (poll.id === id ? { ...poll, answer: originalAnswer } : poll)))
          throw dbError
        }
      }
    } catch (err) {
      console.error("Error answering poll:", err)
      setError("Failed to save answer. Please try again.")
    }
  }

  // Function to manually refresh polls
  const refreshPolls = async () => {
    await fetchPolls()
  }

  return (
    <PollContext.Provider
      value={{
        polls,
        votedPolls,
        addPoll,
        votePoll,
        removePoll,
        answerPoll,
        isLoading,
        error,
        refreshPolls,
        isOfflineMode,
      }}
    >
      {children}
    </PollContext.Provider>
  )
}
