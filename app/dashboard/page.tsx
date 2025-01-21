'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth/AuthContext'
import { supabase } from '@/lib/supabase'
import OpportunityList from '../components/OpportunityList'

interface Opportunity {
  id: string
  title: string
  organization: string
  description: string
  category: string
  commitment: string
  distance: number
  latitude: number
  longitude: number
  image: string
  date: string
  time: string
  day: string
  recurring: boolean
  max_participants: number
  participant_count: number
}

export default function DashboardPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [userRegistrations, setUserRegistrations] = useState<Set<string>>(new Set())
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)

  const fetchOpportunities = async () => {
    if (!user) return

    try {
      // First get user's active registrations
      const { data: activeRegistrations, error: regError } = await supabase
        .from('registrations')
        .select('event_id')
        .eq('user_id', user.id)
        .eq('status', 'active')

      if (regError) throw regError

      const activeEventIds = new Set(activeRegistrations.map(r => r.event_id))
      setUserRegistrations(activeEventIds)

      // Then get the full event details for those registrations
      if (activeEventIds.size > 0) {
        const { data: events, error: eventsError } = await supabase
          .from('events_with_counts')
          .select('*')
          .in('id', Array.from(activeEventIds))
          .order('date', { ascending: true })

        if (eventsError) throw eventsError
        setOpportunities(events || [])
      }
    } catch (error) {
      console.error('Error fetching opportunities:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOpportunities()
  }, [user])

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg">Please sign in to view your dashboard</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">Your Upcoming Events</h1>
        <div className="text-center py-12">Loading your events...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Your Upcoming Events</h1>
      
      {opportunities.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg text-gray-600 mb-4">You haven't registered for any events yet.</p>
          <p className="text-gray-500">
            Check out our <a href="/" className="text-blue-500 hover:underline">opportunities page</a> to find events!
          </p>
        </div>
      ) : (
        <OpportunityList 
          opportunities={opportunities} 
          onRegistrationComplete={fetchOpportunities}
        />
      )}
    </div>
  )
} 