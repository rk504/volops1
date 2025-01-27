'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth/AuthContext'
import { supabase } from '@/lib/supabase'
import Header from '../../components/Header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CheckCircle2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import LocationSearch from '../../components/LocationSearch'

export default function CreateEventPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    organization: '',
    description: '',
    maxParticipants: '',
    date: '',
    time: '',
    location: '',
    zipCode: '',
    latitude: 40.7128, // Default to NYC
    longitude: -74.0060,
    category: '',
    commitment: '',
    duration: '120', // Default to 2 hours in minutes
    recurring: true,
    image: 'https://images.unsplash.com/photo-1593113630400-ea4288922497?q=80&w=800&h=800&fit=crop' // Default image
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to create an event.",
        variant: "destructive"
      })
      return
    }

    // Validate coordinates
    if (!formData.latitude || !formData.longitude || !formData.zipCode) {
      toast({
        title: "Location required",
        description: "Please select a valid location using the map.",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      // Combine date and time
      const dateTime = new Date(formData.date + 'T' + formData.time)

      // Log the data being sent
      console.log('Creating event with data:', {
        title: formData.title,
        organization: formData.organization,
        description: formData.description,
        max_participants: parseInt(formData.maxParticipants),
        date: dateTime.toISOString(),
        location: formData.location || formData.zipCode,
        latitude: formData.latitude,
        longitude: formData.longitude,
        category: formData.category,
        commitment: formData.commitment,
        duration: parseInt(formData.duration),
        recurring: formData.recurring,
        image: formData.image,
        organizer_id: user.id,
        status: 'active',
        created_at: new Date().toISOString()
      })

      const { data, error } = await supabase
        .from('events')
        .insert([{
          title: formData.title,
          organization: formData.organization,
          description: formData.description,
          max_participants: parseInt(formData.maxParticipants),
          date: dateTime.toISOString(),
          location: formData.location || formData.zipCode,
          latitude: formData.latitude,
          longitude: formData.longitude,
          category: formData.category,
          commitment: formData.commitment,
          duration: parseInt(formData.duration),
          recurring: formData.recurring,
          image: formData.image,
          organizer_id: user.id,
          status: 'active',
          created_at: new Date().toISOString()
        }])
        .select()

      if (error) {
        console.error('Supabase error:', error)
        throw new Error(error.message)
      }

      console.log('Event created successfully:', data)
      setShowSuccess(true)
    } catch (error) {
      console.error('Error creating event:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create event. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLocationSelect = (location: { zipCode: string; latitude: number; longitude: number }) => {
    console.log('Location selected:', location)
    setFormData(prev => ({
      ...prev,
      zipCode: location.zipCode,
      latitude: location.latitude,
      longitude: location.longitude
    }))
  }

  if (!user) {
    return (
      <div className="container mx-auto p-4">
        <Header />
        <Card className="p-6 mt-8">
          <h1 className="text-2xl font-bold mb-4">Create Event</h1>
          <p>Please sign in to create an event.</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <Header />
      <Card className="p-6 mt-8">
        <h1 className="text-2xl font-bold mb-4">Create Event</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Event Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="organization">Organization Name</Label>
            <Input
              id="organization"
              value={formData.organization}
              onChange={(e) => setFormData(prev => ({ ...prev, organization: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
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
              value={formData.maxParticipants}
              onChange={(e) => setFormData(prev => ({ ...prev, maxParticipants: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Event Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="time">Start Time</Label>
            <Input
              id="time"
              type="time"
              value={formData.time}
              onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
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
              value={formData.duration}
              onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="commitment">Time Commitment</Label>
            <Select
              value={formData.commitment}
              onValueChange={(value) => setFormData(prev => ({ ...prev, commitment: value }))}
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
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="e.g., City Community Center"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Map Location</Label>
            <LocationSearch
              onLocationSelect={handleLocationSelect}
              initialLocation={
                formData.zipCode
                  ? {
                      zipCode: formData.zipCode,
                      latitude: formData.latitude,
                      longitude: formData.longitude,
                    }
                  : undefined
              }
            />
          </div>

          <Button type="submit" disabled={loading || !formData.zipCode}>
            {loading ? 'Creating...' : 'Create Event'}
          </Button>
        </form>
      </Card>

      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-center">Event Created Successfully! 🎉</DialogTitle>
          </DialogHeader>
          <div className="py-6 flex flex-col items-center space-y-4">
            <CheckCircle2 className="w-20 h-20 text-green-500" />
            <p className="text-center">
              Your event has been created and is now visible to volunteers.
            </p>
          </div>
          <div className="flex justify-center space-x-4">
            <Button onClick={() => router.push('/org/dashboard')}>
              Go to Dashboard
            </Button>
            <Button variant="outline" onClick={() => {
              setShowSuccess(false)
              setFormData({
                title: '',
                organization: '',
                description: '',
                maxParticipants: '',
                date: '',
                time: '',
                location: '',
                zipCode: '',
                latitude: 40.7128,
                longitude: -74.0060,
                category: '',
                commitment: '',
                duration: '120',
                recurring: true,
                image: 'https://images.unsplash.com/photo-1593113630400-ea4288922497?q=80&w=800&h=800&fit=crop'
              })
            }}>
              Create Another Event
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 