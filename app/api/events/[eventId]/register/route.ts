import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(
  req: Request,
  { params }: { params: { eventId: string } }
) {
  try {
    const { eventId } = params
    const { user_id } = await req.json()

    // For testing: Create a test user if it doesn't exist
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select()
      .eq('id', user_id)
      .single()

    if (!existingUser) {
      const { error: createError } = await supabase
        .from('users')
        .insert([
          {
            id: user_id,
            email: 'test@example.com',
            full_name: 'Test User'
          }
        ])

      if (createError) throw createError
    }

    // Check if event is full
    const { data: event } = await supabase
      .from('events')
      .select('current_participants, max_participants')
      .eq('id', eventId)
      .single()

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    if (event.current_participants >= event.max_participants) {
      return NextResponse.json(
        { error: 'Event is full' },
        { status: 400 }
      )
    }

    // Check if user is already registered
    const { data: existingRegistration } = await supabase
      .from('registrations')
      .select()
      .eq('user_id', user_id)
      .eq('event_id', eventId)
      .single()

    if (existingRegistration) {
      return NextResponse.json(
        { error: 'Already registered for this event' },
        { status: 400 }
      )
    }

    // Register user for event
    const { data, error } = await supabase
      .from('registrations')
      .insert([
        { user_id, event_id: eventId }
      ])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error registering for event:', error)
    return NextResponse.json(
      { error: 'Error registering for event' },
      { status: 500 }
    )
  }
} 