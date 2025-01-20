'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import Image from 'next/image'
import { useState } from 'react'
import RegistrationForm from './RegistrationForm'
import { useAuth } from '@/lib/auth/AuthContext'
import { useRouter } from 'next/navigation'

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
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

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
    setSelectedOpportunity(opportunities.find(opp => opp.id === opportunityId) || null)
  }

  const handleDeregister = async (opportunityId: string, title: string) => {
    try {
      const response = await fetch(`/api/events/${opportunityId}/deregister`, {
        method: 'POST',
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to deregister')
      }

      toast({
        title: 'Success',
        description: `You have been deregistered from ${title}`,
        variant: 'default',
      })

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
      const response = await fetch(`/api/events/${selectedOpportunity.id}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })
      
      const responseData = await response.json()
      
      if (!response.ok) {
        if (responseData.error === 'Already registered for this event') {
          toast({
            title: "Already Registered",
            description: "You are already registered for this event",
            variant: "default"
          })
        } else {
          throw new Error(responseData.error || 'Failed to register')
        }
        return
      }

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
      <div className="p-6 space-y-6">
        {opportunities.map((opportunity) => (
          <Card key={opportunity.id} className="hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <Image
                  src={opportunity.image}
                  alt={opportunity.title}
                  width={100}
                  height={100}
                  className="rounded-lg object-cover"
                />
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold">{opportunity.title}</h3>
                    <Badge variant="outline">
                      {opportunity.day}s at {opportunity.time}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{opportunity.organization}</p>
                  <p className="text-sm mb-4">{opportunity.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-2">
                      <Badge variant="secondary">{opportunity.category}</Badge>
                      <Badge variant="outline">{opportunity.commitment}</Badge>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="secondary">
                        {opportunity.participant_count} / {opportunity.max_participants} spots filled
                      </Badge>
                      {opportunity.participant_count >= opportunity.max_participants && (
                        <Badge variant="destructive">Full</Badge>
                      )}
                      {opportunity.is_registered ? (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeregister(opportunity.id, opportunity.title)}
                        >
                          Deregister
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
    </>
  )
}

