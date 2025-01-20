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
    console.log('=== DEREGISTRATION DEBUG START ===')
    console.log('Event ID:', eventId)
    console.log('User ID:', session.user.id)

    // Update registration status directly
    try {
      const { data: updatedReg, error: updateError } = await supabase
        .from('registrations')
        .update({ status: 'cancelled' })
        .eq('event_id', eventId)
        .eq('user_id', session.user.id)
        .eq('status', 'active')
        .select()
        .single()

      console.log('Raw Supabase Response:', {
        data: updatedReg,
        error: updateError ? {
          message: updateError.message,
          code: updateError.code,
          details: updateError.details,
          hint: updateError.hint
        } : null
      })
      console.log('=== DEREGISTRATION DEBUG END ===')

      if (updateError) {
        console.error('Error deregistering:', updateError)
        return NextResponse.json(
          { error: updateError.message || 'Failed to deregister from event' },
          { status: 500 }
        )
      }

      if (!updatedReg) {
        return NextResponse.json(
          { error: 'No active registration found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        message: 'Successfully deregistered from event',
        registration: updatedReg
      })

    } catch (error) {
      console.error('Error deregistering:', error)
      return NextResponse.json(
        { 
          error: 'Internal server error',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      )
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