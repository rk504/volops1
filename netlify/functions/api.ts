import { Handler } from '@netlify/functions'
import { createServerClient } from '@supabase/ssr'
import { cookies } from '@netlify/functions'

export const handler: Handler = async (event, context) => {
  // Extract the event ID and action from the path
  const path = event.path.replace('/.netlify/functions/api/', '')
  console.log('Path:', path) // Debug log
  const pathParts = path.split('/')
  const eventId = pathParts[1] // events/[eventId]/register -> [eventId]
  const action = pathParts[2] // events/[eventId]/register -> register

  if (!eventId || !action) {
    console.log('Invalid path parts:', { pathParts, eventId, action }) // Debug log
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid request path' })
    }
  }

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
        set(name: string, value: string, options: any) {
          // Handle cookie setting if needed
        },
        remove(name: string, options: any) {
          // Handle cookie removal if needed
        },
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

    if (action === 'register') {
      // Handle registration
      const body = JSON.parse(event.body || '{}')
      const { name, email } = body

      // Check if already registered
      const { data: existingReg, error: checkError } = await supabase
        .from('registrations')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', session.user.id)
        .eq('status', 'active')
        .single()

      if (existingReg) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Already registered for this event' })
        }
      }

      // Create registration
      const { data: registration, error: regError } = await supabase
        .from('registrations')
        .insert([{
          user_id: session.user.id,
          event_id: eventId,
          name,
          email,
          status: 'active'
        }])
        .select()
        .single()

      if (regError) {
        return {
          statusCode: 500,
          body: JSON.stringify({ error: regError.message })
        }
      }

      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Successfully registered', registration })
      }
    }

    if (action === 'deregister') {
      // Handle deregistration
      const { error: updateError } = await supabase
        .from('registrations')
        .update({ status: 'cancelled' })
        .eq('event_id', eventId)
        .eq('user_id', session.user.id)
        .eq('status', 'active')

      if (updateError) {
        return {
          statusCode: 500,
          body: JSON.stringify({ error: updateError.message })
        }
      }

      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Successfully deregistered' })
      }
    }

    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid action' })
    }

  } catch (error) {
    console.error('Error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    }
  }
} 