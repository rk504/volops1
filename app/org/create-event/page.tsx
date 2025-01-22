'use client'

import { useState, useEffect } from 'react'
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
import { CheckCircle2, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import debounce from 'lodash/debounce'

// Create a dynamic map component to handle all Leaflet-related code
const DynamicMap = dynamic(() => import('../../components/DynamicMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] bg-gray-100 rounded-lg flex items-center justify-center">
      <p>Loading map...</p>
    </div>
  ),
})

export default function CreateEventPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [searchResults, setSearchResults] = useState<Array<{
    display_name: string
    lat: number
    lon: number
  }>>([])
  const [showResults, setShowResults] = useState(false)
  const [mounted, setMounted] = useState(false)
  
  const [formData, setFormData] = useState({
    title: '',
    organization: '',
    description: '',
    maxParticipants: '',
    dayOfWeek: '',
    startTime: '',
    duration: '2', // Default 2 hours
    location: '',
    latitude: 40.7128,
    longitude: -74.0060,
    category: ''
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  const searchAddress = debounce(async (query: string) => {
    if (query.length < 3) {
      setSearchResults([])
      setShowResults(false)
      return
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`
      )
      const data = await response.json()
      setSearchResults(data)
      setShowResults(true)
    } catch (error) {
      console.error('Error searching address:', error)
      toast({
        title: "Error",
        description: "Failed to search address",
        variant: "destructive"
      })
    }
  }, 500)

  const handleLocationSelect = (result: any) => {
    setFormData(prev => ({
      ...prev,
      location: result.display_name,
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon)
    }))
    setShowResults(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to create events",
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
          duration: parseInt(formData.duration) * 60, // Convert hours to minutes
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
        description: error instanceof Error ? error.message : "Failed to create event",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div>
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">Please sign in</h2>
            <p>You need to be signed in to create events.</p>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div>
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Create New Event</h1>
        
        <Card className="p-6">
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
                  <SelectValue placeholder="Select day" />
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
              <Label htmlFor="duration">Duration (hours)</Label>
              <Input
                id="duration"
                type="number"
                min="0.5"
                step="0.5"
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <div className="relative">
                <div className="flex gap-2">
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, location: e.target.value }))
                      searchAddress(e.target.value)
                    }}
                    placeholder="Start typing an address..."
                    required
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="icon"
                    onClick={() => setShowResults(prev => !prev)}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
                {showResults && searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg max-h-60 overflow-auto">
                    {searchResults.map((result, index) => (
                      <button
                        key={index}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                        onClick={() => handleLocationSelect(result)}
                        type="button"
                      >
                        {result.display_name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="h-[300px] mt-4 rounded-lg overflow-hidden">
                {mounted && (
                  <DynamicMap
                    center={[formData.latitude, formData.longitude]}
                    marker={[formData.latitude, formData.longitude]}
                  />
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Education">Education</SelectItem>
                  <SelectItem value="Environment">Environment</SelectItem>
                  <SelectItem value="Health">Health</SelectItem>
                  <SelectItem value="Community">Community</SelectItem>
                  <SelectItem value="Technology">Technology</SelectItem>
                  <SelectItem value="Arts">Arts</SelectItem>
                  <SelectItem value="Sports">Sports</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Event'}
            </Button>
          </form>
        </Card>

        <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
          <DialogContent className="sm:max-w-[425px] text-center">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Event Created! 🎉</DialogTitle>
            </DialogHeader>
            <div className="py-6 flex flex-col items-center space-y-4">
              <CheckCircle2 className="w-20 h-20 text-green-500" />
              <p className="text-lg">
                Your event has been successfully created
              </p>
              <p className="text-sm text-gray-500">
                You can view and manage it from your organization dashboard
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
                  duration: '2',
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
      </main>
    </div>
  )
} 