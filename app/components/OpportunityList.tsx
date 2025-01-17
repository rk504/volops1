import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { useState } from 'react'
import RegistrationForm from './RegistrationForm'

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
}

interface OpportunityListProps {
  opportunities: Opportunity[]
  onRegistrationComplete: () => void
}

export default function OpportunityList({ opportunities, onRegistrationComplete }: OpportunityListProps) {
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null)

  if (!opportunities || !Array.isArray(opportunities)) {
    return <div>No opportunities available</div>
  }

  const handleRegister = async (opportunityId: string, title: string) => {
    setSelectedOpportunity(opportunities.find(opp => opp.id === opportunityId) || null)
  }

  const handleRegistrationSubmit = async (data: { name: string; email: string; phone?: string }) => {
    if (!selectedOpportunity) return

    try {
      console.log('Attempting to register for event:', selectedOpportunity.id)
      const response = await fetch(`/api/events/${selectedOpportunity.id}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })
      
      const responseData = await response.json()
      console.log('Registration response:', responseData)
      
      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to register')
      }

      // Close the form and refresh the opportunities data
      setSelectedOpportunity(null)
      onRegistrationComplete()
    } catch (error: any) {
      console.error('Registration error:', error)
      alert(error.message || 'Failed to register for event')
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
                    <Button variant="outline" size="sm" className="text-xs">
                      {opportunity.day}s at {opportunity.time}
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{opportunity.organization}</p>
                  <p className="text-sm mb-4">{opportunity.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-2">
                      <Badge variant="secondary">{opportunity.category}</Badge>
                      <Badge variant="outline">{opportunity.commitment}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {opportunity.participant_count} / {opportunity.max_participants} spots filled
                      </Badge>
                      {opportunity.participant_count >= opportunity.max_participants && (
                        <Badge variant="destructive">Full</Badge>
                      )}
                    </div>
                    <Button
                      variant={opportunity.participant_count >= opportunity.max_participants ? "secondary" : "default"}
                      onClick={() => handleRegister(opportunity.id, opportunity.title)}
                      disabled={opportunity.participant_count >= opportunity.max_participants}
                    >
                      {opportunity.participant_count >= opportunity.max_participants ? 'Full' : 'Register'}
                    </Button>
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

