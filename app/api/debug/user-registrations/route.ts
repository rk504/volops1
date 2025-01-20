import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Get current session
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get user details
    const userDetails = {
      id: session.user.id,
      email: session.user.email,
      lastSignIn: session.user.last_sign_in_at
    }

    // Get registrations
    const { data: registrations, error: regError } = await supabase
      .from('registrations')
      .select(`
        *,
        event:events_with_counts (*)
      `)
      .eq('user_id', session.user.id)
      .eq('status', 'active')

    if (regError) {
      return NextResponse.json({ error: regError.message }, { status: 500 })
    }

    return NextResponse.json({
      user: userDetails,
      registrationCount: registrations?.length || 0,
      registrations: registrations
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Unknown error occurred' },
      { status: 500 }
    )
  }
} 