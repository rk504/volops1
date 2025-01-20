import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

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

    // Get user's registered events
    const { data: events, error: eventsError } = await supabase
      .from('event_registrations')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('registration_status', 'active')
      .order('date', { ascending: true })

    if (eventsError) {
      console.error('Error fetching events:', eventsError)
      throw eventsError
    }

    return NextResponse.json(events)
  } catch (error: any) {
    console.error('Error in upcoming-events route:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch upcoming events' },
      { status: 500 }
    )
  }
} 