import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { Configuration, OpenAIApi } from 'https://esm.sh/openai@3.2.1'
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

    // Check for OpenAI API key
    const apiKey = Deno.env.get('OPENAI_API_KEY')
    if (!apiKey) {
      console.error('OpenAI API key not found')
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { 
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      )
    }

    // Initialize OpenAI
    const configuration = new Configuration({ apiKey })
    const openai = new OpenAIApi(configuration)

    try {
      const completion = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that helps users find volunteer opportunities. You should focus on understanding their interests and suggesting relevant volunteer categories and activities. Keep responses concise and friendly."
          },
          {
            role: "user",
            content: user_message
          }
        ],
        max_tokens: 150,
        temperature: 0.7,
      })

      const response = {
        content: completion.data.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response."
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
      console.error('OpenAI API error:', error)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to generate response',
          details: error.message
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