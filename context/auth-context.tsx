"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { ADMIN_CREDENTIALS } from "@/lib/supabase"
import { useRouter } from "next/navigation"

type AuthContextType = {
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  login: async () => false,
  logout: () => {},
  isLoading: true,
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Check if user is already authenticated on mount
  useEffect(() => {
    const checkAuth = () => {
      try {
        const auth = localStorage.getItem("auth")
        if (auth === "true") {
          setIsAuthenticated(true)
          // Ensure cookie is set for middleware
          document.cookie = "auth=true; path=/; max-age=86400"
        }
      } catch (error) {
        console.error("Error checking auth:", error)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (username: string, password: string) => {
    try {
      // In a real app, this would be a server request
      if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        setIsAuthenticated(true)
        localStorage.setItem("auth", "true")

        // Also set cookie for middleware
        document.cookie = "auth=true; path=/; max-age=86400" // 24 hours

        // Add a small delay to ensure state is updated before redirect
        await new Promise((resolve) => setTimeout(resolve, 100))

        return true
      }
      return false
    } catch (error) {
      console.error("Login error:", error)
      return false
    }
  }

  const logout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem("auth")
    // Clear cookie
    document.cookie = "auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
    router.push("/login")
  }

  return <AuthContext.Provider value={{ isAuthenticated, login, logout, isLoading }}>{children}</AuthContext.Provider>
}
