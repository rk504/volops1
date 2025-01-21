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
import RegistrationSuccess from './RegistrationSuccess'

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
  const [registrationSuccess, setRegistrationSuccess] = useState<{title: string} | null>(null)
  const [userRegistrations, setUserRegistrations] = useState<Set<string>>(new Set())
  const { user, session } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  // Fetch user's registrations when component mounts or user changes
  useEffect(() => {
    async function fetchUserRegistrations() {
      if (!user) {
        console.log('No user logged in, clearing registrations')
        setUserRegistrations(new Set())
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
    if (!user || !session) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to register for events",
        variant: "destructive"
      })
      router.push('/auth')
      return
    }
    
    try {
      const response = await fetch(`/api/events/${opportunityId}/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
          email: user.email,
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update registration')
      }

      // Update local state based on returned status
      setUserRegistrations(prev => {
        const next = new Set(prev)
        if (data.status === 'active') {
          next.add(opportunityId)
        } else {
          next.delete(opportunityId)
        }
        return next
      })

      // Show success dialog only for new registrations
      if (data.status === 'active' && !userRegistrations.has(opportunityId)) {
        setRegistrationSuccess({ title })
      } else {
        toast({
          title: "Success",
          description: data.message,
          variant: "default"
        })
      }
      
      onRegistrationComplete()
      
    } catch (error: any) {
      toast({
        title: "Action Failed",
        description: error.message || 'Failed to update registration',
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
                          onClick={() => handleRegister(opportunity.id, opportunity.title)}
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

      {registrationSuccess && (
        <RegistrationSuccess
          isOpen={!!registrationSuccess}
          onClose={() => {
            setRegistrationSuccess(null)
            router.push('/dashboard')
          }}
          title={registrationSuccess.title}
        />
      )}
    </>
  )
}

