import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

interface Event {
  id: string
  title: string
  organization: string
  description: string
  image: string
  date: string
  time: string
  day: string
  category: string
  participant_count: number
  max_participants: number
}

interface Registration {
  id: string
  created_at: string
  name: string
  email: string
  phone: string | null
  status: string
  event: Event
}

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Get the current user's session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) {
      console.error('Session error:', sessionError)
      throw sessionError
    }
    
    if (!session) {
      console.log('No session found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's registered events with event details
    const { data: registrations, error: registrationsError } = await supabase
      .from('registrations')
      .select(`
        id,
        created_at,
        name,
        email,
        phone,
        status,
        event:events_with_counts (
          id,
          title,
          organization,
          description,
          image,
          date,
          time,
          day,
          category,
          participant_count,
          max_participants
        )
      `)
      .eq('user_id', session.user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (registrationsError) {
      console.error('Error fetching registrations:', registrationsError)
      throw registrationsError
    }

    // Transform the data to match the dashboard format
    const transformedEvents = (registrations as Registration[])?.map(registration => ({
      id: registration.event.id,
      title: registration.event.title,
      organization: registration.event.organization,
      description: registration.event.description,
      image: registration.event.image,
      date: registration.event.date,
      time: registration.event.time,
      day: registration.event.day,
      category: registration.event.category,
      participant_count: registration.event.participant_count,
      max_participants: registration.event.max_participants,
      registration_date: registration.created_at,
      registered_name: registration.name,
      registered_email: registration.email,
      registered_phone: registration.phone,
      registration_status: registration.status
    }))

    // Sort by event date
    transformedEvents?.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    return NextResponse.json(transformedEvents)
  } catch (error: any) {
    console.error('Error in upcoming-events route:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch upcoming events' },
      { status: 500 }
    )
  }
} 