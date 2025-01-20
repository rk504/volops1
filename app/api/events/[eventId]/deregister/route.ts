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

    // Call the deregister function
    const { data, error } = await supabase
      .rpc('deregister_from_event', {
        p_event_id: eventId,
        p_user_id: session.user.id
      })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error deregistering from event:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to deregister from event' },
      { status: 500 }
    )
  }
} 