import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: { eventId: string } }
) {
  try {
    const cookieStore = cookies()
    
    // Create server client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            try {
              cookieStore.set({ name, value, ...options })
            } catch (error) {
              // Handle cookie setting error
            }
          },
          remove(name: string, options: any) {
            try {
              cookieStore.set({ name, value: '', ...options })
            } catch (error) {
              // Handle cookie removal error
            }
          },
        },
      }
    )

    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      console.error('Session error:', sessionError)
      return NextResponse.json({ error: 'Unauthorized - Please sign in' }, { status: 401 })
    }

    const { eventId } = params
    console.log('Looking up event:', eventId)

    // Check if event exists and get its details
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single()

    console.log('Event lookup details:', {
      eventId,
      found: !!event,
      error: eventError ? {
        code: eventError.code,
        message: eventError.message,
        details: eventError.details
      } : null,
      event: event
    })

    if (eventError || !event) {
      console.error('Event lookup error:', { eventError, eventId })
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    console.log('Found event:', event)

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

    // Check if event is full
    if (event.max_participants && event.participant_count >= event.max_participants) {
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