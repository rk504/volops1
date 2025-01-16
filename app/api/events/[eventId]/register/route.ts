import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(
  request: Request,
  { params }: { params: { eventId: string } }
) {
  try {
    const eventId = params.eventId
    console.log('Received registration request for event:', eventId)

    // TODO: In production, get this from auth
    const TEST_USER_ID = '123e4567-e89b-12d3-a456-426614174000'

    // Check if already registered
    const { data: existingReg, error: checkError } = await supabase
      .from('registrations')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', TEST_USER_ID)
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
      .from('events_with_counts')
      .select('*')
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      console.error('Error fetching event:', eventError)
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }
/* 
    // Check if event is full
    if (event.participant_count == event.max_participants) {
      return NextResponse.json(
        { error: 'Event is full' },
        { status: 400 }
      )
    } */

    // Create registration
    const { error: regError } = await supabase
      .from('registrations')
      .insert([{ 
        user_id: TEST_USER_ID, 
        event_id: eventId,
        name: 'Test User',
        email: 'test@example.com'
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

    // Get updated count
    const { data: updatedEvent } = await supabase
      .from('events_with_counts')
      .select('*')
      .eq('id', eventId)
      .single()

    return NextResponse.json(
      {
        message: 'Successfully registered for event',
        event: updatedEvent,
        previousCount: event.participant_count,
        newCount: updatedEvent?.participant_count || event.participant_count + 1
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