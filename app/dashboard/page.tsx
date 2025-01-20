'use client'

import { useAuth } from '@/lib/auth/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Header from '../components/Header'

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth')
    }
  }, [user, loading, router])

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return null // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <div className="mt-6">
            <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
              <div className="space-y-4">
                <p>Welcome, {user.email}!</p>
                <h2 className="text-lg font-medium">Your Upcoming Events</h2>
                {/* Add event list here */}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 