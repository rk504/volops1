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
    console.log('=== REGISTRATION TOGGLE DEBUG START ===')
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

    if (eventError || !event) {
      console.error('Event lookup error:', { eventError, eventId })
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Get user data from request body
    const body = await request.json()
    console.log('Request body:', body)
    const { name, email } = body

    if (!name || !email) {
      console.log('Missing required fields:', { name, email })
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      )
    }

    // Check for existing registration
    const { data: existingReg, error: checkError } = await supabase
      .from('registrations')
      .select('*')
      .eq('event_id', eventId)
      .eq('user_id', session.user.id)
      .single()

    console.log('Existing registration check:', {
      exists: !!existingReg,
      status: existingReg?.status,
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
      // Toggle existing registration
      const newStatus = existingReg.status === 'active' ? 'cancelled' : 'active'
      
      // If reactivating, check capacity
      if (newStatus === 'active') {
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
      }

      const { error: updateError } = await supabase
        .from('registrations')
        .update({ status: newStatus })
        .eq('id', existingReg.id)

      if (updateError) {
        console.error('Update error:', updateError)
        return NextResponse.json(
          { error: 'Failed to update registration' },
          { status: 500 }
        )
      }

      console.log(`Registration ${newStatus} successfully`)
      return NextResponse.json({
        message: `Registration ${newStatus} successfully`,
        status: newStatus
      })

    } else {
      // Create new registration
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

      const { error: regError } = await supabase
        .from('registrations')
        .insert([{ 
          user_id: session.user.id,
          event_id: eventId,
          name,
          email,
          status: 'active'
        }])

      if (regError) {
        console.error('Registration error:', regError)
        return NextResponse.json(
          { error: 'Failed to create registration' },
          { status: 500 }
        )
      }

      console.log('New registration created successfully')
      return NextResponse.json({
        message: 'Registration created successfully',
        status: 'active'
      })
    }

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