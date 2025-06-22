import { createClient } from "@supabase/supabase-js"

// Use the environment variables provided by the Supabase integration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

// Create a single supabase client for the entire app
let supabaseClient: ReturnType<typeof createClient> | null = null

try {
  if (supabaseUrl && supabaseAnonKey) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
    console.log("Supabase client initialized successfully")
  } else {
    console.warn("Supabase URL or Anon Key is missing. Using offline mode.")
  }
} catch (error) {
  console.error("Error initializing Supabase client:", error)
}

// Export the Supabase client directly
export const supabase = supabaseClient

// Types for our database tables
export type DbPoll = {
  id: string
  question: string
  votes: number
  timestamp: number
  answer?: string | null
}

export type DbVote = {
  id: string
  poll_id: string
  user_id: string
  created_at: string
}

// Admin credentials - in a real app, these would be stored securely in the database
export const ADMIN_CREDENTIALS = {
  username: "sandy.lewis",
  password: "Admin123!",
}

// Generate a unique user ID for anonymous users
export const getUserId = () => {
  if (typeof window === "undefined") return "server-side"

  let userId = localStorage.getItem("userId")
  if (!userId) {
    userId = crypto.randomUUID()
    localStorage.setItem("userId", userId)
  }
  return userId
}

// Check if we're in offline mode
export const isOfflineMode = !supabaseClient

// Helper function to seed initial data if needed
export const seedInitialData = async () => {
  if (isOfflineMode || !supabase) {
    console.log("Skipping seed - offline mode")
    return false
  }

  try {
    // Add timeout to prevent hanging
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000) // 3 second timeout

    try {
      // Check if we already have data
      const { data: existingPolls, error: checkError } = await supabase
        .from("polls")
        .select("id")
        .limit(1)
        .abortSignal(controller.signal)

      clearTimeout(timeoutId)

      if (checkError) {
        console.error("Error checking for existing polls:", checkError)
        return false
      }

      // If we already have data, don't seed
      if (existingPolls && existingPolls.length > 0) {
        console.log("Database already has polls, skipping seed")
        return true
      }

      // Seed some initial polls
      const initialPolls = [
        {
          id: crypto.randomUUID(),
          question: "What feature would you like to see next in our app?",
          votes: 5,
          timestamp: Date.now() - 86400000, // 1 day ago
          answer: null,
        },
        {
          id: crypto.randomUUID(),
          question: "How often do you use our application?",
          votes: 3,
          timestamp: Date.now() - 172800000, // 2 days ago
          answer: "Thanks for your feedback! Most users are using the app 2-3 times per week.",
        },
        {
          id: crypto.randomUUID(),
          question: "Would you recommend this app to a friend?",
          votes: 8,
          timestamp: Date.now() - 259200000, // 3 days ago
          answer: null,
        },
      ]

      const { error: seedError } = await supabase.from("polls").insert(initialPolls)

      if (seedError) {
        console.error("Error seeding initial polls:", seedError)
        return false
      }

      console.log("Successfully seeded initial polls")
      return true
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  } catch (error) {
    console.warn("Seed operation failed (network issue):", error.message)
    return false
  }
}
