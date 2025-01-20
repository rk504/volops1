import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: { eventId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const eventId = params.eventId

    // Get the current user's session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError) throw sessionError
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user data from request body
    const { name, email, phone } = await request.json()

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      )
    }

    // Check if already registered
    const { data: existingReg, error: checkError } = await supabase
      .from('registrations')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', session.user.id)
      .eq('status', 'active')
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error('Error checking registration:', checkError)
      return NextResponse.json(
        { error: 'Failed to verify registration status' },
        { status: 500 }
      )
    }

    if (existingReg) {
      return NextResponse.json(
        { error: 'Already registered for this event' },
        { status: 400 }
      )
    }

    // Get event details and current count
    const { data: event, error: eventError } = await supabase
      .from('event_registrations')
      .select('*')
      .is('user_id', null)
      .eq('event_id', eventId)
      .single()

    if (eventError || !event) {
      console.error('Error fetching event:', eventError)
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    // Check if event is full
    if (event.participant_count >= event.max_participants) {
      return NextResponse.json(
        { error: 'Event is full' },
        { status: 400 }
      )
    }

    // Create registration
    const { error: regError } = await supabase
      .from('registrations')
      .insert([{ 
        user_id: session.user.id,
        event_id: eventId,
        name,
        email,
        phone,
        status: 'active'
      }])

    if (regError) {
      console.error('Registration error details:', {
        code: regError.code,
        message: regError.message,
        details: regError.details,
        hint: regError.hint
      })
      return NextResponse.json(
        { 
          error: 'Failed to register for event',
          details: regError.message
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        message: 'Successfully registered for event',
        event: event
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 