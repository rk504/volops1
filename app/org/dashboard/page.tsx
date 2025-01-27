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
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import LocationSearch from '../../components/LocationSearch'

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

interface EditEventFormData {
  title: string
  organization: string
  description: string
  max_participants: string
  date: string
  time: string
  location: string
  category: string
  commitment: string
  duration: string
  latitude: number
  longitude: number
  zipCode: string
}

export default function OrgDashboardPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [events, setEvents] = useState<EventWithRegistrations[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteEventId, setDeleteEventId] = useState<string | null>(null)
  const [confirmText, setConfirmText] = useState('')
  const [showRegistrations, setShowRegistrations] = useState<string | null>(null)
  const [editingEvent, setEditingEvent] = useState<EventWithRegistrations | null>(null)
  const [editFormData, setEditFormData] = useState<EditEventFormData>({
    title: '',
    organization: '',
    description: '',
    max_participants: '',
    date: '',
    time: '',
    location: '',
    category: '',
    commitment: '',
    duration: '',
    latitude: 40.7128,
    longitude: -74.0060,
    zipCode: ''
  })

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

  const handleEditClick = (event: EventWithRegistrations) => {
    // Convert date string to date and time
    const eventDate = new Date(event.date)
    const dateStr = eventDate.toISOString().split('T')[0]
    const timeStr = eventDate.toTimeString().slice(0, 5)

    setEditFormData({
      title: event.title,
      organization: event.organization,
      description: event.description,
      max_participants: event.max_participants.toString(),
      date: dateStr,
      time: timeStr,
      location: event.location,
      category: event.category,
      commitment: event.commitment,
      duration: event.duration.toString(),
      latitude: event.latitude,
      longitude: event.longitude,
      zipCode: event.location.match(/\d{5}/)?.at(0) || ''
    })
    setEditingEvent(event)
  }

  const handleLocationSelect = (location: { zipCode: string; latitude: number; longitude: number }) => {
    setEditFormData(prev => ({
      ...prev,
      zipCode: location.zipCode,
      latitude: location.latitude,
      longitude: location.longitude
    }))
  }

  const handleUpdateEvent = async () => {
    if (!editingEvent) return

    try {
      setLoading(true)
      // Combine date and time
      const dateTime = new Date(editFormData.date + 'T' + editFormData.time)

      const { error } = await supabase
        .from('events')
        .update({
          title: editFormData.title,
          organization: editFormData.organization,
          description: editFormData.description,
          max_participants: parseInt(editFormData.max_participants),
          date: dateTime.toISOString(),
          location: editFormData.location,
          latitude: editFormData.latitude,
          longitude: editFormData.longitude,
          category: editFormData.category,
          commitment: editFormData.commitment,
          duration: parseInt(editFormData.duration)
        })
        .eq('id', editingEvent.id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Event updated successfully",
      })

      setEditingEvent(null)
      fetchEvents()
    } catch (error) {
      console.error('Error updating event:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update event",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [user])

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4 p-4 text-center">
        <h1 className="text-2xl font-bold">Organization Dashboard</h1>
        <p className="text-lg text-gray-600">Sign in to view and manage your volunteer events</p>
        <p className="text-sm text-gray-500">Create, edit, and track your organization's volunteer opportunities</p>
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
                      variant="outline"
                      onClick={() => handleEditClick(event)}
                    >
                      Edit
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

                {/* Edit Event Dialog */}
                <Dialog open={editingEvent !== null} onOpenChange={(open) => !open && setEditingEvent(null)}>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Edit Event</DialogTitle>
                      <DialogDescription>
                        Make changes to your event details below.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Event Title</Label>
                        <Input
                          id="title"
                          value={editFormData.title}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, title: e.target.value }))}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="organization">Organization Name</Label>
                        <Input
                          id="organization"
                          value={editFormData.organization}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, organization: e.target.value }))}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Input
                          id="description"
                          value={editFormData.description}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select
                          value={editFormData.category}
                          onValueChange={(value) => setEditFormData(prev => ({ ...prev, category: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Education">Education</SelectItem>
                            <SelectItem value="Environment">Environment</SelectItem>
                            <SelectItem value="Health">Health</SelectItem>
                            <SelectItem value="Community Service">Community Service</SelectItem>
                            <SelectItem value="Animal Welfare">Animal Welfare</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="maxParticipants">Maximum Participants</Label>
                        <Input
                          id="maxParticipants"
                          type="number"
                          min="1"
                          value={editFormData.max_participants}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, max_participants: e.target.value }))}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="date">Event Date</Label>
                        <Input
                          id="date"
                          type="date"
                          value={editFormData.date}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, date: e.target.value }))}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="time">Start Time</Label>
                        <Input
                          id="time"
                          type="time"
                          value={editFormData.time}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, time: e.target.value }))}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="duration">Duration (minutes)</Label>
                        <Input
                          id="duration"
                          type="number"
                          min="30"
                          step="30"
                          value={editFormData.duration}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, duration: e.target.value }))}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="commitment">Time Commitment</Label>
                        <Select
                          value={editFormData.commitment}
                          onValueChange={(value) => setEditFormData(prev => ({ ...prev, commitment: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select time commitment" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="2 hours/week">2 hours/week</SelectItem>
                            <SelectItem value="3 hours/week">3 hours/week</SelectItem>
                            <SelectItem value="4 hours/week">4 hours/week</SelectItem>
                            <SelectItem value="Flexible">Flexible</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="location">Location Name</Label>
                        <Input
                          id="location"
                          value={editFormData.location}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, location: e.target.value }))}
                          placeholder="e.g., City Community Center"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Map Location</Label>
                        <LocationSearch
                          onLocationSelect={handleLocationSelect}
                          initialLocation={{
                            zipCode: editFormData.zipCode,
                            latitude: editFormData.latitude,
                            longitude: editFormData.longitude,
                          }}
                        />
                      </div>

                      <div className="flex justify-end space-x-2 pt-4">
                        <Button
                          variant="outline"
                          onClick={() => setEditingEvent(null)}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleUpdateEvent}
                          disabled={loading}
                        >
                          {loading ? 'Updating...' : 'Update Event'}
                        </Button>
                      </div>
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