'use client'

import { useAuth } from '@/lib/auth/AuthContext'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import Header from '@/components/Header'

export default function OrgPage() {
  const { user } = useAuth()
  
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4 p-4 text-center">
        <h1 className="text-2xl font-bold">Organization Portal</h1>
        <p className="text-lg text-gray-600">Sign in to create and manage volunteer opportunities</p>
        <div className="space-x-4">
          <Link href="/">
            <Button variant="outline">Return to Home</Button>
          </Link>
          <Link href="/auth/signin">
            <Button>Sign In</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Header />
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">Organization Portal</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/org/create-event">
            <div className="border rounded-lg p-6 hover:border-primary cursor-pointer transition-colors">
              <h2 className="text-xl font-semibold mb-2">Create Event</h2>
              <p className="text-gray-600">Create a new volunteer opportunity for your organization</p>
            </div>
          </Link>
          <Link href="/org/dashboard">
            <div className="border rounded-lg p-6 hover:border-primary cursor-pointer transition-colors">
              <h2 className="text-xl font-semibold mb-2">Dashboard</h2>
              <p className="text-gray-600">View and manage your organization's events</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
} 
