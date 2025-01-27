'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth/AuthContext'
import { supabase } from '@/lib/supabase'
import Header from '../../components/Header'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import Link from 'next/link'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from '@/components/ui/input'

interface EventRegistration {
  registration_id: string | null
  registration_status: string | null
  user_id: string | null
  user_email: string | null
  user_name: string | null
}

interface EventWithRegistrations {
  id: string
  title: string
  description: string
  location: string
  date: string
  max_participants: number
  created_at: string
  organization: string
  category: string
  commitment: string
  distance: number | null
  latitude: number
  longitude: number
  image: string
  recurring: boolean
  status: string
  organizer_id: string | null
  duration: number
  registration_id: string | null
  registration_status: string | null
  user_id: string | null
  user_email: string | null
  user_name: string | null
}

export default function OrgDashboardPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [events, setEvents] = useState<EventWithRegistrations[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteEventId, setDeleteEventId] = useState<string | null>(null)
  const [confirmText, setConfirmText] = useState('')
  const [showRegistrations, setShowRegistrations] = useState<string | null>(null)

  const fetchEvents = async () => {
    if (!user) return

    try {
      console.log('Fetching events for organizer:', user.id)
      
      // Get events from events_with_registrations view
      const { data: eventsData, error } = await supabase
        .from('events_with_registrations')
        .select('*')
        .eq('organizer_id', user.id)
        .order('date', { ascending: true })

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      console.log('Found events:', eventsData)

      // Group registrations by event
      const eventMap = new Map<string, EventWithRegistrations & { registrations: EventRegistration[] }>()

      eventsData?.forEach((event: EventWithRegistrations) => {
        if (!eventMap.has(event.id)) {
          // Create new event entry
          eventMap.set(event.id, {
            ...event,
            registrations: []
          })
        }

        // Add registration if it exists
        if (event.registration_id) {
          const currentEvent = eventMap.get(event.id)!
          currentEvent.registrations.push({
            registration_id: event.registration_id,
            registration_status: event.registration_status,
            user_id: event.user_id,
            user_email: event.user_email,
            user_name: event.user_name
          })
        }
      })

      // Convert map to array and add participant count
      const transformedEvents = Array.from(eventMap.values()).map(event => ({
        ...event,
        participant_count: event.registrations.filter(r => r.registration_status === 'active').length
      }))

      setEvents(transformedEvents)
    } catch (error) {
      console.error('Error fetching events:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load events",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteEvent = async () => {
    if (!deleteEventId || confirmText !== "Yes, I'm sure") return

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', deleteEventId)

      if (error) throw error

      toast({
        title: "Success",
        description: "Event deleted successfully",
      })

      // Refresh events list
      fetchEvents()
    } catch (error) {
      console.error('Error deleting event:', error)
      toast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive"
      })
    } finally {
      setDeleteEventId(null)
      setConfirmText('')
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [user])

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg">Please sign in to view your organization dashboard</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">Your Events</h1>
        <div className="text-center py-12">Loading your events...</div>
      </div>
    )
  }

  return (
    <div>
      <Header />
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Your Events</h1>
          <Link href="/org/create-event">
            <Button>Create New Event</Button>
          </Link>
        </div>
        
        {events.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-gray-600 mb-4">You haven't created any events yet.</p>
            <Link href="/org/create-event">
              <Button>Create Your First Event</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {events.map(event => (
              <div key={event.id} className="border rounded-lg p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-semibold">{event.title}</h2>
                    <p className="text-gray-600">
                      {new Date(event.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        timeZoneName: 'short'
                      })}
                    </p>
                    <p className="text-gray-600">{event.location}</p>
                    <p className="text-gray-600">
                      Participants: {event.participant_count} / {event.max_participants}
                    </p>
                  </div>
                  <div className="space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowRegistrations(event.id)}
                    >
                      View Registrations
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => setDeleteEventId(event.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>

                {/* Registrations Dialog */}
                <Dialog open={showRegistrations === event.id} onOpenChange={() => setShowRegistrations(null)}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Registered Participants</DialogTitle>
                      <DialogDescription>
                        {event.title} - {event.participant_count} participants
                      </DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[400px] overflow-y-auto">
                      {event.registrations
                        .filter(r => r.registration_status === 'active')
                        .map((registration, index) => (
                          <div key={registration.registration_id || index} className="py-2 border-b last:border-0">
                            <p className="font-medium">{registration.user_name || 'Anonymous'}</p>
                            <p className="text-sm text-gray-600">{registration.user_email || 'No email provided'}</p>
                          </div>
                        ))}
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <Dialog open={deleteEventId === event.id} onOpenChange={() => {
                  setDeleteEventId(null)
                  setConfirmText('')
                }}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete Event</DialogTitle>
                      <DialogDescription>
                        This action cannot be undone. Type "Yes, I'm sure" to confirm.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        placeholder="Yes, I'm sure"
                      />
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setDeleteEventId(null)
                            setConfirmText('')
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={handleDeleteEvent}
                          disabled={confirmText !== "Yes, I'm sure"}
                        >
                          Delete Event
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 