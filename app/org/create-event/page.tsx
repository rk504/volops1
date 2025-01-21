'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/auth/AuthContext'
import { supabase } from '@/lib/supabase'
import Header from '@/components/Header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'

export default function CreateEventPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    maxParticipants: '',
    dayOfWeek: '',
    startTime: '',
    location: '',
    category: ''
  })

  const daysOfWeek = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ]

  const timeSlots = Array.from({ length: 24 }, (_, i) => {
    const hour = i % 12 || 12
    const ampm = i < 12 ? 'AM' : 'PM'
    return `${hour}:00 ${ampm}`
  })

  const categories = [
    'Education', 'Environment', 'Health', 'Community Service', 'Animal Welfare'
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create an event",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      // Convert day and time to a Date object
      const now = new Date()
      const dayIndex = daysOfWeek.indexOf(formData.dayOfWeek)
      const [hourStr, ampm] = formData.startTime.split(' ')
      let hour = parseInt(hourStr.split(':')[0])
      if (ampm === 'PM' && hour !== 12) hour += 12
      if (ampm === 'AM' && hour === 12) hour = 0

      // Find the next occurrence of the selected day
      const date = new Date(now)
      date.setHours(hour, 0, 0, 0)
      while (date.getDay() !== dayIndex) {
        date.setDate(date.getDate() + 1)
      }

      const { error } = await supabase
        .from('events')
        .insert({
          title: formData.title,
          description: formData.description,
          max_participants: parseInt(formData.maxParticipants),
          date: date.toISOString(),
          location: formData.location,
          category: formData.category,
          organizer_id: user.id
        })

      if (error) throw error

      toast({
        title: "Success",
        description: "Event created successfully",
      })

      // Reset form
      setFormData({
        title: '',
        description: '',
        maxParticipants: '',
        dayOfWeek: '',
        startTime: '',
        location: '',
        category: ''
      })
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

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg">Please sign in to create events</p>
      </div>
    )
  }

  return (
    <div>
      <Header />
      <div className="container mx-auto py-8 max-w-2xl">
        <h1 className="text-3xl font-bold mb-8">Create New Event</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
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
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              className="w-full min-h-[100px] p-2 border rounded-md"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              required
            />
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dayOfWeek">Day of Week</Label>
              <select
                id="dayOfWeek"
                className="w-full p-2 border rounded-md"
                value={formData.dayOfWeek}
                onChange={(e) => setFormData(prev => ({ ...prev, dayOfWeek: e.target.value }))}
                required
              >
                <option value="">Select a day</option>
                {daysOfWeek.map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <select
                id="startTime"
                className="w-full p-2 border rounded-md"
                value={formData.startTime}
                onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                required
              >
                <option value="">Select a time</option>
                {timeSlots.map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              className="w-full p-2 border rounded-md"
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              required
            >
              <option value="">Select a category</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Creating...' : 'Create Event'}
          </Button>
        </form>
      </div>
    </div>
  )
} 