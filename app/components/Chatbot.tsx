'use client'

import { useState, useRef, useEffect } from "react"
import { useAuth } from "@/lib/auth/AuthContext"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"

interface Message {
  text: string
  sender: 'user' | 'bot'
  timestamp: Date
}

export default function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([
    { 
      text: "Hi! I can help you find volunteer opportunities. What causes are you passionate about? (e.g. education, environment, health)", 
      sender: "bot",
      timestamp: new Date()
    },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()
  const { toast } = useToast()

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim()) return

    const userMessage: Message = { 
      text: input, 
      sender: "user",
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    setInput("")
    setLoading(true)
  
    try {
      console.log('Sending message to Supabase function:', { user_message: input })

      // Call the Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('chatgpt_reply', {
        body: { user_message: input },
        headers: {
          'Content-Type': 'application/json'
        }
      })

      // Log the complete response for debugging
      console.log('Supabase Edge Function response:', {
        data: data ? JSON.stringify(data, null, 2) : null,
        error: error ? {
          message: error.message,
          name: error.name,
          details: error.details,
          context: error
        } : null
      })

      if (error) {
        // Extract error details from the Edge Function response
        const errorDetails = error.message || error.details || 'Unknown error'
        console.error('Edge function error:', {
          message: error.message,
          details: error.details,
          context: error
        })
        throw new Error(errorDetails)
      }

      if (!data) {
        console.error('No data received from edge function')
        throw new Error('No response received from the chatbot')
      }

      // Log the parsed data
      console.log('Parsed response data:', data)

      // Try to handle different possible response formats
      let botMessage: string
      if (typeof data === 'string') {
        botMessage = data
      } else if (data.content) {
        botMessage = data.content
      } else if (data.choices?.[0]?.message?.content) {
        botMessage = data.choices[0].message.content
      } else {
        console.error('Unexpected response format:', data)
        throw new Error('Received invalid response format from chatbot')
      }

      const botResponse: Message = {
        text: botMessage,
        sender: "bot",
        timestamp: new Date()
      }

      setMessages(prev => [...prev, botResponse])
    } catch (error: any) {
      // Detailed error logging
      console.error('Chat error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        context: error
      })

      // Create a user-friendly error message
      const errorMessage = error.message && !error.message.includes('Failed to send')
        ? error.message
        : 'Unable to connect to the chatbot'

      toast({
        title: "Chatbot Error",
        description: errorMessage,
        variant: "destructive"
      })

      const botErrorMessage: Message = {
        text: `I apologize, but I'm having trouble processing your request. ${errorMessage}`,
        sender: "bot",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, botErrorMessage])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto p-4 border rounded-lg shadow-lg bg-white">
      <div className="h-[400px] overflow-y-auto border-b p-4 space-y-4">
        {messages.map((msg, i) => (
          <div 
            key={i} 
            className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            <div 
              className={`max-w-[80%] break-words rounded-lg p-3 ${
                msg.sender === "user" 
                  ? "bg-blue-500 text-white" 
                  : "bg-gray-100 text-gray-900"
              }`}
            >
              <p>{msg.text}</p>
              <p className="text-xs mt-1 opacity-70">
                {msg.timestamp.toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-3 animate-pulse">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="mt-4">
        <form 
          onSubmit={(e) => {
            e.preventDefault()
            sendMessage()
          }} 
          className="flex gap-2"
        >
          <input
            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={loading}
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            disabled={loading || !input.trim()}
          >
            {loading ? (
              <span className="flex items-center space-x-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              </span>
            ) : (
              "Send"
            )}
          </button>
        </form>
        <p className="text-xs text-gray-500 mt-2">
          {user ? "Signed in as " + user.email : "Sign in to save your chat history"}
        </p>
      </div>
    </div>
  )
}