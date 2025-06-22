"use client"

import { useState } from "react"
import PollForm from "@/components/poll-form"
import Pagination from "@/components/pagination"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LockIcon, RefreshCwIcon, WifiOffIcon } from "lucide-react"
import { usePollContext } from "@/context/poll-context"

// Number of questions per page
const ITEMS_PER_PAGE = 5

export default function PollApp() {
  const { polls, votedPolls, votePoll, isLoading, error, refreshPolls, isOfflineMode } = usePollContext()
  const [currentPage, setCurrentPage] = useState(1)
  const [refreshing, setRefreshing] = useState(false)

  // Handle manual refresh
  const handleRefresh = async () => {
    setRefreshing(true)
    await refreshPolls()
    setRefreshing(false)
  }

  // Sort polls by votes (descending) and then by timestamp (newest first)
  const sortedPolls = [...polls].sort((a, b) => {
    if (a.votes !== b.votes) {
      return b.votes - a.votes
    }
    return b.timestamp - a.timestamp
  })

  // Calculate total pages
  const totalPages = Math.ceil(sortedPolls.length / ITEMS_PER_PAGE)

  // Get current page items
  const currentPolls = sortedPolls.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-2xl mx-auto border-purple-200">
        <CardHeader className="border-b border-purple-100">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl text-purple-800">Community Poll</CardTitle>
              <CardDescription className="mr-4">
                Add your questions and vote on others. You can only vote once per question.
              </CardDescription>
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
              <Link href="/login">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <LockIcon size={16} />
                  Admin
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <PollForm />
          <div className="space-y-4">
            {error && (
              <div className="bg-amber-50 border border-amber-200 text-amber-700 p-3 rounded-md flex items-center gap-2">
                <WifiOffIcon size={16} />
                <span>{error}</span>
              </div>
            )}

            <h2 className="text-xl font-semibold text-purple-800">Questions</h2>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading questions...</div>
            ) : sortedPolls.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No questions yet. Be the first to add one!</div>
            ) : (
              <div className="space-y-3">
                {currentPolls.map((poll, index) => (
                  <div
                    key={poll.id}
                    className={`border border-purple-200 rounded-md p-4 hover:shadow-md transition-shadow ${
                      index === 0 ? "shadow-md" : ""
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex flex-col items-center min-w-[60px]">
                        <button
                          onClick={() => votePoll(poll.id)}
                          className={`h-8 w-8 rounded-md flex items-center justify-center ${
                            votedPolls.has(poll.id) ? "bg-purple-100 cursor-not-allowed" : "hover:bg-purple-50"
                          }`}
                          disabled={votedPolls.has(poll.id)}
                          title={votedPolls.has(poll.id) ? "You've already voted" : "Vote for this question"}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke={votedPolls.has(poll.id) ? "#9333ea" : "currentColor"}
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="m5 12 7-7 7 7" />
                            <path d="M12 19V5" />
                          </svg>
                        </button>
                        <span className="font-bold text-lg text-purple-700 mt-1">{poll.votes}</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-lg text-purple-900">{poll.question}</p>
                        {poll.answer && (
                          <div className="mt-2 p-2 bg-purple-50 rounded-md border border-purple-100">
                            <p className="text-sm text-purple-800">
                              <span className="font-semibold">Answer:</span> {poll.answer}
                            </p>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          Added {new Date(poll.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
