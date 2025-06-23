"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { usePollContext } from "@/context/poll-context"
import { Textarea } from "./ui/textarea"

export default function PollForm() {
  const { addPoll } = usePollContext()
  const [question, setQuestion] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate input
    if (!question.trim()) {
      setError("Please enter a question")
      return
    }

    // Add the poll and reset form
    addPoll(question.trim())
    setQuestion("")
    setError("")
  }

  return (
    <Card className="border-purple-200">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Textarea
              placeholder="Enter your question..."
              value={question}
              onChange={(e) => {
                setQuestion(e.target.value)
                if (e.target.value.trim()) setError("")
              }}
              className={`${error ? "border-red-500" : ""} text-xl font-semibold leading-loose`}
              rows={3}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
          <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700">
            Add Question
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
