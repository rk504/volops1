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
      .select('id, max_participants, current_participants')
      .eq('id', eventId)
      .single()

    if (eventError) {
      console.error('Event lookup error:', eventError)
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    console.log('Found event:', event)

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    if (event.current_participants >= event.max_participants) {
      return NextResponse.json({ error: 'Event is full' }, { status: 400 })
    }

    // Update the event's participant count directly
    const { data: updatedEvent, error: updateError } = await supabase
      .from('events')
      .update({ 
        current_participants: event.current_participants + 1 
      })
      .eq('id', eventId)
      .select()

    console.log('Update result:', { updatedEvent, updateError })

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to register for event' }, 
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        message: 'Successfully registered for event',
        event: updatedEvent
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