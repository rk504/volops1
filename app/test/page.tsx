'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Event } from '@/lib/types'
import { Button } from '@/components/ui/button'

export default function TestPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch events
  useEffect(() => {
    async function fetchEvents() {
      try {
        const response = await fetch('/api/events')
        if (!response.ok) throw new Error('Failed to fetch events')
        const data = await response.json()
        setEvents(data)
      } catch (err) {
        setError('Error fetching events')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [])

  // Create a test event
  const createTestEvent = async () => {
    // Create an array of mock events with different dates in February 2025
    const mockEvents = [
      {
        title: 'Weekend Morning Workshop',
        description: 'Join us for a morning workshop on sustainable living',
        location: 'Community Center',
        date: '2025-02-01T10:00:00Z', // Saturday morning
        max_participants: 15
      },
      {
        title: 'Weekday Evening Seminar',
        description: 'Professional development seminar for volunteers',
        location: 'Library Conference Room',
        date: '2025-02-04T18:30:00Z', // Tuesday evening
        max_participants: 20
      },
      {
        title: 'Afternoon Training Session',
        description: 'Volunteer training and orientation',
        location: 'Training Center',
        date: '2025-02-12T14:00:00Z', // Wednesday afternoon
        max_participants: 12
      },
      {
        title: 'Weekend Community Event',
        description: 'Community cleanup and social gathering',
        location: 'City Park',
        date: '2025-02-16T13:00:00Z', // Sunday afternoon
        max_participants: 30
      },
      {
        title: 'Early Morning Meeting',
        description: 'Planning meeting for upcoming projects',
        location: 'Virtual Meeting Room',
        date: '2025-02-20T08:00:00Z', // Thursday morning
        max_participants: 10
      },
      {
        title: 'Late Night Fundraiser',
        description: 'Evening fundraising gala',
        location: 'Grand Hall',
        date: '2025-02-28T19:00:00Z', // Friday evening
        max_participants: 50
      }
    ];

    try {
      // Create each mock event
      for (const eventData of mockEvents) {
        const response = await fetch('/api/events', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventData)
        });

        if (!response.ok) throw new Error('Failed to create event');
      }

      // Refresh the events list
      const response = await fetch('/api/events');
      if (!response.ok) throw new Error('Failed to fetch events');
      const data = await response.json();
      setEvents(data);
    } catch (error) {
      console.error('Error:', error);
      setError('Error creating events');
    }
  };

  // Register for an event
  const registerForEvent = async (eventId: string) => {
    try {
      const response = await fetch(`/api/events/${eventId}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: 'test-user-123' // Use a consistent test user ID
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to register for event')
      }
      
      // Refresh events list
      const updatedResponse = await fetch('/api/events')
      const updatedData = await updatedResponse.json()
      setEvents(updatedData)
    } catch (err: any) {
      setError(err.message || 'Error registering for event')
      console.error('Registration error:', err)
    }
  }

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Events System</h1>
      
      <Button onClick={createTestEvent} className="mb-4">
        Create Test Event
      </Button>

      <div className="space-y-4">
        {events.map((event) => (
          <div key={event.id} className="border p-4 rounded-lg">
            <h2 className="text-xl font-semibold">{event.title}</h2>
            <p>{event.description}</p>
            <p>Location: {event.location}</p>
            <p>Date: {new Date(event.date).toLocaleDateString()}</p>
            <p>Participants: {event.current_participants}/{event.max_participants}</p>
            <Button 
              onClick={() => registerForEvent(event.id)}
              disabled={event.current_participants >= event.max_participants}
              className="mt-2"
            >
              Register
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
} 