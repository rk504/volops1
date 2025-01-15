'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/components/ui/use-toast'

const CATEGORIES = ['Education', 'Environment', 'Health', 'Community Service', 'Animal Welfare']

export default function EmailSignup() {
  const [email, setEmail] = useState('')
  const [interests, setInterests] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/email-signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email,
          interests 
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error)
      }

      toast({
        title: "Success!",
        description: "You've been registered for NYC volunteer opportunity updates.",
      })
      
      setSubmitted(true)
      setEmail('')
      setInterests([])
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message === 'Email already registered' 
          ? "This email is already registered for updates."
          : "Failed to register. Please try again.",
        variant: "destructive",
      })
      setSubmitted(false)
    } finally {
      setLoading(false)
    }
  }

  const toggleInterest = (category: string) => {
    setInterests(prev => 
      prev.includes(category)
        ? prev.filter(i => i !== category)
        : [...prev, category]
    )
  }

  const getButtonText = () => {
    if (loading) return 'Registering...'
    if (submitted) return '✓ Registration Complete'
    return 'Register'
  }

  return (
    <div className="bg-white py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Get NYC Volunteering Updates</h2>
          <p className="text-gray-600 mb-6">
            Get personalized volunteer opportunities in your inbox<br />
            (in a weekly newsletter, no spam).
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setSubmitted(false) // Reset submitted state when email changes
              }}
              required
              className="w-full"
              disabled={loading || submitted}
            />
            <div className="text-left">
              <p className="text-sm font-medium text-gray-700 mb-2">I'm interested in: (optional)</p>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map((category) => (
                  <div key={category} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`interest-${category}`}
                      checked={interests.includes(category)}
                      onCheckedChange={() => toggleInterest(category)}
                      disabled={loading || submitted}
                    />
                    <label 
                      htmlFor={`interest-${category}`}
                      className="text-sm text-gray-600"
                    >
                      {category}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <Button 
              type="submit" 
              className={`w-full ${submitted ? 'bg-green-600 hover:bg-green-700' : ''}`}
              disabled={loading || submitted}
            >
              {getButtonText()}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

