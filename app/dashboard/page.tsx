'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth/AuthContext'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import Image from 'next/image'
import { Button } from '@/components/ui/button'

interface Event {
  id: string
  title: string
  organization: string
  description: string
  image: string
  date: string
  time: string
  day: string
  category: string
  registration_date: string
  registered_name: string
  registered_email: string
  registered_phone: string | null
  registration_status: string
}

export default function DashboardPage() {
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([])
  const { user } = useAuth()
  const { toast } = useToast()

  const fetchUpcomingEvents = async () => {
    if (!user) return

    try {
      const response = await fetch('/api/dashboard/upcoming-events')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch upcoming events')
      }

      setUpcomingEvents(data)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load upcoming events',
        variant: 'destructive',
      })
    }
  }

  useEffect(() => {
    fetchUpcomingEvents()
  }, [user, toast])

  const handleDeregister = async (eventId: string, eventTitle: string) => {
    try {
      const response = await fetch(`/api/events/${eventId}/deregister`, {
        method: 'POST',
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to deregister')
      }

      toast({
        title: 'Success',
        description: `You have been deregistered from ${eventTitle}`,
        variant: 'default',
      })

      // Refresh the events list
      fetchUpcomingEvents()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to deregister from event',
        variant: 'destructive',
      })
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg">Please sign in to view your dashboard</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Your Upcoming Events</h1>
      
      {upcomingEvents.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg text-gray-600 mb-4">You haven't registered for any events yet.</p>
          <p className="text-gray-500">
            Check out our <a href="/" className="text-blue-500 hover:underline">opportunities page</a> to find events!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {upcomingEvents.map((event) => (
            <Card key={event.id} className="hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <Image
                    src={event.image}
                    alt={event.title}
                    width={100}
                    height={100}
                    className="rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold">{event.title}</h3>
                      <Badge variant="outline">
                        {event.day}s at {event.time}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{event.organization}</p>
                    <p className="text-sm mb-4">{event.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">{event.category}</Badge>
                        <Badge variant="outline" className="text-xs">
                          Registered on {new Date(event.registration_date).toLocaleDateString()}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-sm text-gray-500">
                          Registered as: {event.registered_name}
                        </div>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDeregister(event.id, event.title)}
                        >
                          Deregister
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 