'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth/AuthContext'
import { supabase } from '@/lib/supabase'
import OpportunityList from '../components/OpportunityList'
import { Opportunity } from '@/lib/data'
import Image from 'next/image'
import Link from 'next/link'

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

        // Transform events to include proper time formatting
        const transformedEvents = (events || []).map(event => {
          // Create a date object from the UTC timestamp
          const date = new Date(event.date)
          const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
          
          // Format the time in ET
          const etTime = date.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true,
            timeZone: 'America/New_York'
          })
          
          // Get the day of week in ET
          const etDate = new Date(date.toLocaleString('en-US', { timeZone: 'America/New_York' }))
          
          return {
            ...event,
            time: `${etTime} ET`,
            day: days[etDate.getDay()]
          }
        })

        setOpportunities(transformedEvents)
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
    <div>
      <div className="border-b">
        <div className="container mx-auto py-4">
          <Link href="/" className="inline-block">
            <Image
              src="/easyvol-logo.png"
              alt="EasyVol Logo"
              width={120}
              height={40}
              className="object-contain"
            />
          </Link>
        </div>
      </div>
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
    </div>
  )
} 