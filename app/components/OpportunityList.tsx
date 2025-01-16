import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

interface Opportunity {
  id: string
  title: string
  organization: string
  description: string
  category: string
  commitment: string
  image: string
  time: string
  day: string
  max_participants: number
  current_participants: number
}

interface OpportunityListProps {
  opportunities: Opportunity[]
  onRegistrationComplete: () => void
}

export default function OpportunityList({ opportunities, onRegistrationComplete }: OpportunityListProps) {
  if (!opportunities || !Array.isArray(opportunities)) {
    return <div>No opportunities available</div>
  }

  const handleRegister = async (opportunityId: string) => {
    try {
      console.log('Attempting to register for event:', opportunityId)
      const response = await fetch(`/api/events/${opportunityId}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      const data = await response.json()
      console.log('Registration response:', data)
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to register')
      }

      // Refresh the opportunities data after successful registration
      onRegistrationComplete()
    } catch (error: any) {
      console.error('Registration error:', error)
      alert(error.message || 'Failed to register for event')
    }
  }

  return (
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
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium">
                      {opportunity.current_participants}/{opportunity.max_participants} spots filled
                    </span>
                    <Button
                      onClick={() => handleRegister(opportunity.id.toString())}
                      disabled={opportunity.current_participants >= opportunity.max_participants}
                      variant={opportunity.current_participants >= opportunity.max_participants ? "secondary" : "default"}
                    >
                      {opportunity.current_participants >= opportunity.max_participants 
                        ? 'Event Full' 
                        : 'Register'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

