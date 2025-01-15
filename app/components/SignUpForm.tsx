'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'

export default function SignUpForm() {
  const [email, setEmail] = useState('')
  const { toast } = useToast()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Here you would typically send the email to your backend
    console.log('Submitted email:', email)
    toast({
      title: "Thanks for signing up!",
      description: "We'll send you additional information soon.",
    })
    setEmail('')
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
      <h2 className="text-2xl font-bold text-center">Get More Information</h2>
      <p className="text-center text-gray-600">Sign up to receive updates about volunteer opportunities in your area.</p>
      <div className="flex space-x-2">
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="flex-grow"
        />
        <Button type="submit">Sign Up</Button>
      </div>
    </form>
  )
}

