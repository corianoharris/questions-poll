"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { TrashIcon, MessageSquareIcon, ArrowLeftIcon, LogOutIcon, RefreshCwIcon, WifiOffIcon } from "lucide-react"
import Link from "next/link"
import { usePollContext } from "@/context/poll-context"
import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"

export default function AdminPage() {
  const { polls, removePoll, answerPoll, isLoading, refreshPolls, error, isOfflineMode } = usePollContext()
  const { isAuthenticated, logout, isLoading: authLoading } = useAuth()
  const [answerState, setAnswerState] = useState<Record<string, string>>({})
  const [editingId, setEditingId] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const router = useRouter()

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, authLoading, router])

  // If still loading or not authenticated, show loading state
  if (authLoading || !isAuthenticated) {
    return (
      <div className="container mx-auto py-16 px-4 flex items-center justify-center min-h-screen">
        <p className="text-purple-800">Loading...</p>
      </div>
    )
  }

  // Handle manual refresh
  const handleRefresh = async () => {
    setRefreshing(true)
    await refreshPolls()
    setRefreshing(false)
  }

  // Start answering a poll
  const startAnswering = (id: string) => {
    const poll = polls.find((p) => p.id === id)
    if (poll) {
      setAnswerState({
        ...answerState,
        [id]: poll.answer || "",
      })
      setEditingId(id)
    }
  }

  // Update answer text
  const updateAnswer = (id: string, text: string) => {
    setAnswerState({
      ...answerState,
      [id]: text,
    })
  }

  // Save answer
  const saveAnswer = async (id: string) => {
    await answerPoll(id, answerState[id])
    setEditingId(null)
  }

  // Cancel answering
  const cancelAnswering = () => {
    setEditingId(null)
  }

  // Sort polls by votes (descending) and then by timestamp (newest first)
  const sortedPolls = [...polls].sort((a, b) => {
    if (a.votes !== b.votes) {
      return b.votes - a.votes
    }
    return b.timestamp - a.timestamp
  })

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-3xl mx-auto border-purple-200">
        <CardHeader className="border-b border-purple-100">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl text-purple-800">Admin Dashboard</CardTitle>
              <CardDescription>Manage questions and provide answers</CardDescription>
              {isOfflineMode && (
                <div className="flex items-center gap-2 mt-2 text-amber-600 text-sm">
                  <WifiOffIcon size={16} />
                  <span>Offline Mode - Changes will be saved locally only</span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2"
              >
                <RefreshCwIcon size={16} className={refreshing ? "animate-spin" : ""} />
                Refresh
              </Button>
              <Link href="/">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <ArrowLeftIcon size={16} />
                  Back to Polls
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="flex items-center gap-2 text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <LogOutIcon size={16} />
                Logout
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {error && (
              <div className="bg-amber-50 border border-amber-200 text-amber-700 p-3 rounded-md flex items-center gap-2">
                <WifiOffIcon size={16} />
                <span>{error}</span>
              </div>
            )}

            <h2 className="text-xl font-semibold text-purple-800">All Questions</h2>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading questions...</div>
            ) : sortedPolls.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No questions available.</div>
            ) : (
              <div className="space-y-4">
                {sortedPolls.map((poll) => (
                  <Card key={poll.id} className="border-purple-200">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                              {poll.votes} votes
                            </span>
                            <p className="text-xs text-muted-foreground">{new Date(poll.timestamp).toLocaleString()}</p>
                          </div>
                          <p className="font-medium text-lg text-purple-900 mt-2">{poll.question}</p>

                          {editingId === poll.id ? (
                            <div className="mt-4 space-y-3">
                              <Textarea
                                placeholder="Write your answer here..."
                                value={answerState[poll.id] || ""}
                                onChange={(e) => updateAnswer(poll.id, e.target.value)}
                                className="min-h-[100px]"
                              />
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => saveAnswer(poll.id)}
                                  className="bg-purple-600 hover:bg-purple-700"
                                >
                                  Save Answer
                                </Button>
                                <Button variant="outline" onClick={cancelAnswering}>
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              {poll.answer && (
                                <div className="mt-3 p-3 bg-purple-50 rounded-md border border-purple-100">
                                  <p className="text-sm text-purple-800">
                                    <span className="font-semibold">Answer:</span> {poll.answer}
                                  </p>
                                </div>
                              )}
                              <div className="mt-4 flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => startAnswering(poll.id)}
                                  className="flex items-center gap-1"
                                >
                                  <MessageSquareIcon size={16} />
                                  {poll.answer ? "Edit Answer" : "Answer"}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removePoll(poll.id)}
                                  className="flex items-center gap-1 text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  <TrashIcon size={16} />
                                  Remove
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
