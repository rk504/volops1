'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import RegistrationForm from './RegistrationForm'
import ConfirmDialog from './ConfirmDialog'
import { useAuth } from '@/lib/auth/AuthContext'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface Opportunity {
  id: string
  title: string
  organization: string
  description: string
  category: string
  commitment: string
  distance: number
  latitude: number
  longitude: number
  image: string
  date: string
  time: string
  day: string
  recurring: boolean
  max_participants: number
  participant_count: number
  is_registered?: boolean
}

interface OpportunityListProps {
  opportunities: Opportunity[]
  onRegistrationComplete: () => void
}

export default function OpportunityList({ opportunities, onRegistrationComplete }: OpportunityListProps) {
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null)
  const [deregisterOpportunity, setDeregisterOpportunity] = useState<Opportunity | null>(null)
  const [userRegistrations, setUserRegistrations] = useState<Set<string>>(new Set())
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  // Fetch user's registrations when component mounts or user changes
  useEffect(() => {
    async function fetchUserRegistrations() {
      if (!user) {
        console.log('No user logged in')
        return
      }

      console.log('=== DEBUG: User Details ===')
      console.log('Current authenticated user:', {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        raw: user // Log the entire user object
      })

      // Get the session to verify the auth state
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      console.log('Current session:', {
        session_user_id: session?.user?.id,
        session_user_email: session?.user?.email,
        error: sessionError
      })
      
      console.log('Query parameters:', {
        table: 'registrations',
        user_id: user.id
      })

      try {
        // First get all registrations
        const { data: registrations, error } = await supabase
          .from('registrations')
          .select('*')
          .eq('user_id', user.id)

        if (error) {
          console.error('Error details:', error)
          throw error
        }

        console.log('All registrations for user:', registrations)

        // Then get active registrations
        const { data: activeRegistrations, error: activeError } = await supabase
          .from('registrations')
          .select('event_id, status')
          .eq('user_id', user.id)
          .eq('status', 'active')

        if (activeError) {
          console.error('Active registrations error:', activeError)
          throw activeError
        }

        console.log('Active registrations:', activeRegistrations)
        
        const activeEventIds = new Set(activeRegistrations.map(r => r.event_id))
        console.log('Active event IDs:', Array.from(activeEventIds))
        
        setUserRegistrations(activeEventIds)
      } catch (error) {
        console.error('Error fetching user registrations:', error)
      }
      console.log('=== DEBUG END ===')
    }

    fetchUserRegistrations()
  }, [user])

  if (!opportunities || !Array.isArray(opportunities)) {
    return <div>No opportunities available</div>
  }

  const handleRegister = async (opportunityId: string, title: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to register for events",
        variant: "destructive"
      })
      router.push('/auth')
      return
    }
    
    // If already registered, show toast and return
    if (userRegistrations.has(opportunityId)) {
      toast({
        title: "Already Registered",
        description: "You are already registered for this event",
        variant: "default"
      })
      return
    }
    
    setSelectedOpportunity(opportunities.find(opp => opp.id === opportunityId) || null)
  }

  const handleDeregister = async (opportunityId: string, title: string) => {
    const opportunity = opportunities.find(opp => opp.id === opportunityId)
    if (opportunity) {
      setDeregisterOpportunity(opportunity)
    }
  }

  const confirmDeregister = async () => {
    if (!deregisterOpportunity) return

    try {
      const response = await fetch(`/api/events/${deregisterOpportunity.id}/deregister`, {
        method: 'POST',
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to deregister')
      }

      // Update local state
      setUserRegistrations(prev => {
        const next = new Set(prev)
        next.delete(deregisterOpportunity.id)
        return next
      })

      toast({
        title: 'Success',
        description: `You have been deregistered from ${deregisterOpportunity.title}`,
        variant: 'default',
      })

      setDeregisterOpportunity(null)
      onRegistrationComplete()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to deregister from event',
        variant: 'destructive',
      })
    }
  }

  const handleRegistrationSubmit = async (data: { name: string; email: string; phone?: string }) => {
    if (!selectedOpportunity) return

    try {
      console.log('Attempting registration for event:', {
        eventId: selectedOpportunity.id,
        formData: data
      })

      const response = await fetch(`/api/events/${selectedOpportunity.id}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data)
      })
      
      const responseData = await response.json()
      
      if (!response.ok) {
        console.error('Registration failed:', responseData)
        throw new Error(responseData.error || 'Failed to register')
      }

      // Update local state
      setUserRegistrations(prev => {
        const next = new Set(prev)
        next.add(selectedOpportunity.id)
        return next
      })

      toast({
        title: "You're registered! 🎉",
        description: "Expect an email with event details 48 hours before your event. Check your dashboard to see your upcoming events.",
        variant: "default"
      })

      // Close the form and refresh the opportunities data
      setSelectedOpportunity(null)
      onRegistrationComplete()
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message || 'Failed to register for event',
        variant: "destructive"
      })
    }
  }

  return (
    <>
      <div className="space-y-4">
        {opportunities.map((opportunity) => (
          <Card key={opportunity.id}>
            <CardContent className="p-6">
              <div className="flex gap-4">
                <div className="w-32 h-32 relative flex-shrink-0">
                  <Image
                    src={opportunity.image}
                    alt={opportunity.title}
                    fill
                    className="object-cover rounded-lg"
                    priority={opportunities.indexOf(opportunity) === 0}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-semibold">{opportunity.title}</h3>
                      <p className="text-sm text-gray-600">{opportunity.organization}</p>
                    </div>
                    <Badge variant="outline">
                      {opportunity.day}s at {opportunity.time}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">{opportunity.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Badge variant="secondary">
                        {opportunity.participant_count} / {opportunity.max_participants} spots filled
                      </Badge>
                      {opportunity.participant_count >= opportunity.max_participants && (
                        <Badge variant="destructive">Full</Badge>
                      )}
                      {userRegistrations.has(opportunity.id) ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleDeregister(opportunity.id, opportunity.title)}
                        >
                          Registered
                        </Button>
                      ) : (
                        <Button
                          variant={opportunity.participant_count >= opportunity.max_participants ? "secondary" : "default"}
                          onClick={() => handleRegister(opportunity.id, opportunity.title)}
                          disabled={opportunity.participant_count >= opportunity.max_participants}
                        >
                          {opportunity.participant_count >= opportunity.max_participants ? 'Full' : 'Register'}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <RegistrationForm
        isOpen={!!selectedOpportunity}
        onClose={() => setSelectedOpportunity(null)}
        onSubmit={handleRegistrationSubmit}
        title={selectedOpportunity?.title || ''}
      />

      <ConfirmDialog
        isOpen={!!deregisterOpportunity}
        onClose={() => setDeregisterOpportunity(null)}
        onConfirm={confirmDeregister}
        title="Confirm Deregistration"
        description={`Are you sure you want to deregister from ${deregisterOpportunity?.title}? This action cannot be undone.`}
      />
    </>
  )
}

