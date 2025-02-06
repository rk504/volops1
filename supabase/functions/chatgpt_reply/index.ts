import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { Configuration, OpenAIApi } from 'https://esm.sh/openai@3.2.1'
import { corsHeaders } from '../_shared/cors.ts'

console.log("=== CHATBOT FUNCTION STARTUP ===")
console.log("Environment check:", {
  hasOpenAIKey: !!Deno.env.get('OPENAI_API_KEY'),
  denoVersion: Deno.version,
  env: Deno.env.toObject()
})

serve(async (req) => {
  const requestId = crypto.randomUUID()
  console.log(`=== REQUEST START ${requestId} ===`)
  
  try {
    // Log complete request details
    const headers = Object.fromEntries(req.headers.entries())
    console.log('Request details:', {
      id: requestId,
      method: req.method,
      url: req.url,
      headers: {
        ...headers,
        authorization: headers.authorization ? '[REDACTED]' : undefined
      },
      hasBody: req.body !== null
    })

    // Authorization check
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      console.error('Missing authorization header')
      return new Response(
        JSON.stringify({ 
          error: 'Missing authorization header',
          requestId,
          code: 401
        }),
        { 
          status: 401,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      )
    }

    // Validate authorization format
    if (!authHeader.startsWith('Bearer ')) {
      console.error('Invalid authorization format')
      return new Response(
        JSON.stringify({ 
          error: 'Invalid authorization format. Expected "Bearer <token>"',
          requestId,
          code: 401
        }),
        { 
          status: 401,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      )
    }

    // CORS check
    if (req.method === 'OPTIONS') {
      console.log('Handling CORS preflight')
      return new Response('ok', { 
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      })
    }

    // Method validation
    if (req.method !== 'POST') {
      console.error(`Invalid method: ${req.method}`)
      return new Response(
        JSON.stringify({ 
          error: `Method ${req.method} not allowed`,
          requestId
        }),
        { 
          status: 405,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      )
    }

    // Content-Type check
    const contentType = req.headers.get('content-type')
    console.log('Content-Type:', contentType)
    if (!contentType?.includes('application/json')) {
      console.warn('Invalid Content-Type:', contentType)
    }

    // Parse request body with detailed error handling
    let body
    let rawBody = ''
    try {
      rawBody = await req.text()
      console.log('Raw request body:', rawBody)
      
      try {
        body = JSON.parse(rawBody)
        console.log('Parsed request body:', body)
      } catch (parseError) {
        console.error('JSON parse error:', {
          error: parseError,
          rawBody
        })
        return new Response(
          JSON.stringify({ 
            error: 'Invalid JSON in request body',
            details: parseError.message,
            rawBody,
            requestId
          }),
          { 
            status: 400,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            }
          }
        )
      }
    } catch (readError) {
      console.error('Body read error:', readError)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to read request body',
          details: readError.message,
          requestId
        }),
        { 
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      )
    }

    // Validate message field
    const { user_message } = body
    if (!user_message) {
      console.error('Missing user_message in request body:', body)
      return new Response(
        JSON.stringify({ 
          error: 'user_message is required',
          received: body,
          requestId
        }),
        { 
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      )
    }

    // OpenAI API key validation
    const apiKey = Deno.env.get('OPENAI_API_KEY')
    console.log('OpenAI API key check:', {
      exists: !!apiKey,
      length: apiKey?.length,
      prefix: apiKey?.substring(0, 3)
    })
    
    if (!apiKey) {
      console.error('OpenAI API key not found')
      return new Response(
        JSON.stringify({ 
          error: 'OpenAI API key not configured',
          requestId
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

    // Initialize OpenAI with error boundary
    let openai
    try {
      const configuration = new Configuration({ apiKey })
      openai = new OpenAIApi(configuration)
      console.log('OpenAI client initialized')
    } catch (initError) {
      console.error('OpenAI initialization error:', initError)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to initialize OpenAI client',
          details: initError.message,
          requestId
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

    try {
      console.log('Sending request to OpenAI:', {
        model: "gpt-4o-mini-2024-07-18",
        message: user_message
      })

      const completion = await openai.createChatCompletion({
        model: "gpt-4o-mini-2024-07-18",
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

      console.log('OpenAI response:', {
        status: completion.status,
        statusText: completion.statusText,
        headers: completion.headers,
        data: completion.data
      })

      if (!completion.data.choices?.[0]?.message?.content) {
        throw new Error('Invalid response format from OpenAI')
      }

      const response = {
        content: completion.data.choices[0].message.content,
        requestId
      }

      console.log('Sending success response:', response)
      console.log(`=== REQUEST END ${requestId} ===`)

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
    } catch (error: any) {
      // Detailed OpenAI error logging
      console.error('OpenAI API error:', {
        name: error.name,
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers,
        stack: error.stack
      })

      // Check for specific OpenAI error types
      const errorResponse = {
        error: 'Failed to generate response',
        type: error.name,
        details: error.message,
        apiError: error.response?.data?.error,
        requestId
      }

      const statusCode = error.response?.status || 500
      console.log(`Sending error response (${statusCode}):`, errorResponse)
      console.log(`=== REQUEST END ${requestId} ===`)

      return new Response(
        JSON.stringify(errorResponse),
        { 
          status: statusCode,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      )
    }
  } catch (error: any) {
    // Global error handler with maximum detail
    console.error('Unexpected error:', {
      requestId,
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause,
      raw: error
    })

    console.log(`=== REQUEST END ${requestId} (ERROR) ===`)

    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        type: error.name,
        details: error.message,
        requestId,
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