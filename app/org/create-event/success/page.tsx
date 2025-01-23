'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2 } from 'lucide-react'
import Header from '../../../components/Header'

export default function CreateEventSuccessPage() {
  const router = useRouter()

  // If user directly navigates to this page, redirect to create event
  useEffect(() => {
    const hasCreatedEvent = sessionStorage.getItem('eventCreated')
    if (!hasCreatedEvent) {
      router.push('/org/create-event')
    }
  }, [router])

  return (
    <div>
      <Header />
      <div className="container mx-auto py-12">
        <Card className="max-w-2xl mx-auto p-8">
          <div className="flex flex-col items-center text-center space-y-6">
            <CheckCircle2 className="w-20 h-20 text-green-500" />
            <h1 className="text-3xl font-bold">Event Created Successfully! 🎉</h1>
            
            <p className="text-lg text-gray-600 max-w-md">
              Your event has been created and is now visible to volunteers. 
              We'll notify you when people register.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <Button 
                variant="default" 
                onClick={() => router.push('/org/dashboard')}
              >
                View All Events
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push('/org/create-event')}
              >
                Create Another Event
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
} 