import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(
  request: Request,
  { params }: { params: { eventId: string } }
) {
  try {
    const eventId = params.eventId
    console.log('Received registration request for event:', eventId)

    // First check if the event exists and has available spots
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single()

    if (eventError) {
      console.error('Event lookup error:', eventError)
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    console.log('Found event:', JSON.stringify(event, null, 2))

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    if (event.current_participants >= event.max_participants) {
      return NextResponse.json({ error: 'Event is full' }, { status: 400 })
    }

    const newParticipantCount = event.current_participants + 1
    console.log('Attempting to update participants from', event.current_participants, 'to', newParticipantCount)

    // First do the update
    const { error: updateError } = await supabase
      .from('events')
      .update({ 
        current_participants: newParticipantCount,
        updated_at: new Date().toISOString()
      })
      .eq('id', eventId)

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to register for event' }, 
        { status: 500 }
      )
    }

    // Then fetch the updated event
    const { data: updatedEvent, error: fetchError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single()

    if (fetchError || !updatedEvent) {
      console.error('Fetch error:', fetchError)
      return NextResponse.json(
        { error: 'Failed to verify registration' },
        { status: 500 }
      )
    }

    console.log('Successfully updated event:', JSON.stringify(updatedEvent, null, 2))

    return NextResponse.json(
      { 
        message: 'Successfully registered for event',
        event: updatedEvent,
        previousCount: event.current_participants,
        newCount: updatedEvent.current_participants
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 