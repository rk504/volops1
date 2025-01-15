'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Event } from '@/lib/types'

export default function TestEventPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [userRegistrations, setUserRegistrations] = useState<Set<string>>(new Set())
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    fetchEvents()
    fetchUserRegistrations()
  }, [])

  async function fetchEvents() {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true })

      if (error) {
        console.error('Error details:', error)
        return
      }

      setEvents(data || [])
    } catch (e) {
      console.error('Fetch error:', e)
    } finally {
      setLoading(false)
    }
  }

  async function fetchUserRegistrations() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('registrations')
      .select('event_id')
      .eq('user_id', user.id)

    if (error) {
      console.error('Error fetching registrations:', error)
      return
    }

    setUserRegistrations(new Set(data.map((r: { event_id: string }) => r.event_id)))
  }

  async function handleRegistration(eventId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      alert('Please sign in to register')
      return
    }

    if (userRegistrations.has(eventId)) {
      // Unregister
      const { error } = await supabase
        .from('registrations')
        .delete()
        .match({ user_id: user.id, event_id: eventId })

      if (error) {
        console.error('Error unregistering:', error)
        alert('Failed to unregister')
        return
      }

      setUserRegistrations(prev => {
        const next = new Set(prev)
        next.delete(eventId)
        return next
      })
    } else {
      // Register
      const { error } = await supabase
        .from('registrations')
        .insert([{ user_id: user.id, event_id: eventId }])

      if (error) {
        console.error('Error registering:', error)
        if (error.message.includes('Event is full')) {
          alert('This event is full')
        } else {
          alert('Failed to register')
        }
        return
      }

      setUserRegistrations(prev => {
        const next = new Set(prev)
        next.add(eventId)
        return next
      })
    }

    // Refresh events to update participant count
    fetchEvents()
  }

  if (loading) {
    return <div className="p-8">Loading events...</div>
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Test Event Registration</h1>
      <div className="space-y-4">
        {events.map((event) => (
          <Card key={event.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold mb-2">{event.title}</h2>
                  <p className="text-gray-600 mb-2">{event.description}</p>
                  <p className="text-sm text-gray-500 mb-2">
                    Location: {event.location}
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    Date: {new Date(event.date).toLocaleDateString()}
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {event.current_participants} / {event.max_participants} spots filled
                    </Badge>
                    {event.current_participants >= event.max_participants && (
                      <Badge variant="destructive">Full</Badge>
                    )}
                  </div>
                </div>
                <Button
                  variant={userRegistrations.has(event.id) ? "destructive" : "default"}
                  onClick={() => handleRegistration(event.id)}
                  disabled={
                    !userRegistrations.has(event.id) && 
                    event.current_participants >= event.max_participants
                  }
                >
                  {userRegistrations.has(event.id) ? 'Unregister' : 'Register'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
} 