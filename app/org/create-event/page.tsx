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
    dayOfWeek: '',
    startTime: '',
    location: '',
    latitude: 40.7128,
    longitude: -74.0060,
    category: ''
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

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('events')
        .insert([{
          title: formData.title,
          organization: formData.organization,
          description: formData.description,
          max_participants: parseInt(formData.maxParticipants),
          day: formData.dayOfWeek,
          time: formData.startTime,
          location: formData.location,
          latitude: formData.latitude,
          longitude: formData.longitude,
          category: formData.category,
          organizer_id: user.id
        }])
        .select()

      if (error) throw error

      setShowSuccess(true)
    } catch (error) {
      console.error('Error creating event:', error)
      toast({
        title: "Error",
        description: "Failed to create event. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLocationSelect = (location: { address: string; latitude: number; longitude: number }) => {
    setFormData(prev => ({
      ...prev,
      location: location.address,
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
                <SelectItem value="education">Education</SelectItem>
                <SelectItem value="environment">Environment</SelectItem>
                <SelectItem value="health">Health</SelectItem>
                <SelectItem value="community">Community</SelectItem>
                <SelectItem value="other">Other</SelectItem>
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
            <Label htmlFor="dayOfWeek">Day of Week</Label>
            <Select
              value={formData.dayOfWeek}
              onValueChange={(value) => setFormData(prev => ({ ...prev, dayOfWeek: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a day" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Monday">Monday</SelectItem>
                <SelectItem value="Tuesday">Tuesday</SelectItem>
                <SelectItem value="Wednesday">Wednesday</SelectItem>
                <SelectItem value="Thursday">Thursday</SelectItem>
                <SelectItem value="Friday">Friday</SelectItem>
                <SelectItem value="Saturday">Saturday</SelectItem>
                <SelectItem value="Sunday">Sunday</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="startTime">Start Time</Label>
            <Input
              id="startTime"
              type="time"
              value={formData.startTime}
              onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Location</Label>
            <LocationSearch
              onLocationSelect={handleLocationSelect}
              initialLocation={
                formData.location
                  ? {
                      address: formData.location,
                      latitude: formData.latitude,
                      longitude: formData.longitude,
                    }
                  : undefined
              }
            />
          </div>

          <Button type="submit" disabled={loading}>
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
                dayOfWeek: '',
                startTime: '',
                location: '',
                latitude: 40.7128,
                longitude: -74.0060,
                category: ''
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