import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

console.log("Hello from Chatbot Function!")

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Log incoming request details
    console.log('Received request:', {
      method: req.method,
      headers: Object.fromEntries(req.headers.entries())
    })

    // Validate request method
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: `Method ${req.method} not allowed` }),
        { 
          status: 405,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      )
    }

    // Parse request body
    let body
    try {
      body = await req.json()
      console.log('Received message:', body)
    } catch (e) {
      console.error('Error parsing request body:', e)
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { 
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      )
    }

    // Validate required fields
    const { user_message } = body
    if (!user_message) {
      return new Response(
        JSON.stringify({ error: 'user_message is required' }),
        { 
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      )
    }

    // Your OpenAI API call would go here
    // For now, let's return a test response
    const response = {
      content: `Test response to: ${user_message}. This confirms the Edge Function is working.`
    }

    console.log('Sending response:', response)

    return new Response(
      JSON.stringify(response),
      { 
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  } catch (error) {
    // Log the full error
    console.error('Unexpected error:', {
      message: error.message,
      stack: error.stack,
      cause: error.cause
    })

    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  }
}) 