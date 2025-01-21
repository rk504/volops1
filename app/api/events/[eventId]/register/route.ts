import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'edge'

export async function POST(
  request: Request,
  { params }: { params: { eventId: string } }
) {
  try {
    console.log('=== REGISTRATION DEBUG START ===')
    console.log('Event ID from params:', params.eventId)
    
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
              console.error('Cookie set error:', error)
            }
          },
          remove(name: string, options: any) {
            try {
              cookieStore.set({ name, value: '', ...options })
            } catch (error) {
              console.error('Cookie remove error:', error)
            }
          },
        },
      }
    )

    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    console.log('Session check:', {
      hasSession: !!session,
      userId: session?.user?.id,
      error: sessionError
    })
    
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

    // Get user data from request body
    const body = await request.json()
    console.log('Request body:', body)
    const { name, email, phone } = body

    if (!name || !email) {
      console.log('Missing required fields:', { name, email })
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      )
    }

    // Check if already registered
    console.log('Checking existing registration for:', {
      userId: session.user.id,
      eventId: eventId
    })
    
    const { data: existingReg, error: checkError } = await supabase
      .from('registrations')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', session.user.id)
      .eq('status', 'active')
      .single()

    console.log('Existing registration check:', {
      exists: !!existingReg,
      error: checkError ? {
        code: checkError.code,
        message: checkError.message
      } : null
    })

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error('Error checking registration:', checkError)
      return NextResponse.json(
        { error: 'Failed to verify registration status' },
        { status: 500 }
      )
    }

    if (existingReg) {
      console.log('User already registered:', existingReg)
      return NextResponse.json(
        { error: 'Already registered for this event' },
        { status: 400 }
      )
    }

    // Check if event is full
    console.log('Checking event capacity:', {
      current: event.participant_count,
      max: event.max_participants
    })
    
    if (event.max_participants && event.participant_count >= event.max_participants) {
      console.log('Event is full')
      return NextResponse.json(
        { error: 'Event is full' },
        { status: 400 }
      )
    }

    // Create registration
    console.log('Attempting to create registration:', {
      userId: session.user.id,
      eventId: eventId,
      name,
      email
    })
    
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

    console.log('Registration successful')
    console.log('=== REGISTRATION DEBUG END ===')

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