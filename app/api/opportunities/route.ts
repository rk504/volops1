import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Get the current user's session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) throw sessionError

    // Get all active events with their registration info
    const { data: events, error: eventsError } = await supabase
      .from('event_registrations')
      .select('*')
      .is('user_id', null) // Get base event info without user registrations
      .order('date', { ascending: true })

    if (eventsError) throw eventsError

    // If user is logged in, check their registrations
    if (session) {
      // Get user's registrations for these events
      const { data: userEvents, error: userEventsError } = await supabase
        .from('event_registrations')
        .select('event_id, registration_status')
        .eq('user_id', session.user.id)
        .eq('registration_status', 'active')

      if (userEventsError) throw userEventsError

      // Create set of registered event IDs
      const registeredEventIds = new Set(userEvents.map(e => e.event_id))
      
      // Add registration status to events
      const eventsWithStatus = events.map(event => ({
        ...event,
        is_registered: registeredEventIds.has(event.event_id)
      }))
      
      return NextResponse.json(eventsWithStatus)
    }

    return NextResponse.json(events)
  } catch (error: any) {
    console.error('Error fetching opportunities:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch opportunities' },
      { status: 500 }
    )
  }
} 