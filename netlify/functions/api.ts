import { Handler } from '@netlify/functions'
import { createServerClient } from '@supabase/ssr'

export const handler: Handler = async (event, context) => {
  // Extract the event ID from the path
  const path = event.path.replace('/.netlify/functions/api/', '')
  console.log('Path:', path)
  const match = path.match(/^events\/([^\/]+)\/toggle$/)
  if (!match) {
    console.log('Path does not match expected pattern:', path)
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid request path' })
    }
  }
  const [, eventId] = match

  // Create Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return event.headers.cookie?.split(';')
            .find(c => c.trim().startsWith(`${name}=`))
            ?.split('=')[1]
        },
        set(name: string, value: string, options: any) {},
        remove(name: string, options: any) {},
      },
    }
  )

  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Unauthorized - Invalid session' })
      }
    }

    // Check for existing registration
    const { data: existingReg, error: checkError } = await supabase
      .from('registrations')
      .select('*')
      .eq('event_id', eventId)
      .eq('user_id', session.user.id)
      .single()

    if (existingReg) {
      // Toggle existing registration between active and cancelled
      const newStatus = existingReg.status === 'active' ? 'cancelled' : 'active'
      const { data: updatedReg, error: updateError } = await supabase
        .from('registrations')
        .update({ status: newStatus })
        .eq('id', existingReg.id)
        .select()
        .single()

      if (updateError) {
        return {
          statusCode: 500,
          body: JSON.stringify({ error: updateError.message })
        }
      }

      return {
        statusCode: 200,
        body: JSON.stringify({ 
          message: newStatus === 'active' ? 'Successfully registered' : 'Successfully deregistered',
          status: newStatus
        })
      }
    } else {
      // Create new registration
      const { data: newReg, error: createError } = await supabase
        .from('registrations')
        .insert([{
          user_id: session.user.id,
          event_id: eventId,
          name: session.user.email?.split('@')[0] || '',
          email: session.user.email || '',
          status: 'active'
        }])
        .select()
        .single()

      if (createError) {
        return {
          statusCode: 500,
          body: JSON.stringify({ error: createError.message })
        }
      }

      return {
        statusCode: 200,
        body: JSON.stringify({ 
          message: 'Successfully registered',
          status: 'active'
        })
      }
    }

  } catch (error) {
    console.error('Error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    }
  }
} 