import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { z } from 'zod'

const emailSchema = z.object({
  email: z.string().email(),
  interests: z.array(z.string()).optional()
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, interests = [] } = emailSchema.parse(body)

    // Validate interests against allowed categories
    const validCategories = ['Education', 'Environment', 'Health', 'Community Service', 'Animal Welfare']
    const validatedInterests = interests.filter(interest => validCategories.includes(interest))

    // Check if email already exists
    const { data: existingEmail, error: lookupError } = await supabase
      .from('emailsubmissions')
      .select('id, email, status')
      .eq('email', email)
      .single()

    if (lookupError && lookupError.code !== 'PGRST116') { // PGRST116 is "not found" error
      throw lookupError
    }

    if (existingEmail) {
      if (existingEmail.status === 'inactive') {
        // Reactivate the subscription
        const { data, error: updateError } = await supabase
          .from('emailsubmissions')
          .update({ 
            status: 'active',
            interests: validatedInterests,
            notification_preferences: {
              frequency: 'weekly',
              categories: validatedInterests
            }
          })
          .eq('id', existingEmail.id)
          .select()
          .single()

        if (updateError) throw updateError

        return NextResponse.json({
          message: 'Subscription reactivated',
          id: data.id,
        }, { status: 200 })
      }

      return NextResponse.json({ 
        error: 'Email already registered' 
      }, { status: 409 })
    }

    // Insert new email submission
    const { data, error: insertError } = await supabase
      .from('emailsubmissions')
      .insert([{
        email,
        interests: validatedInterests,
        status: 'active',
        notification_preferences: {
          frequency: 'weekly',
          categories: validatedInterests
        }
      }])
      .select()
      .single()

    if (insertError) {
      console.error('Database error:', {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details
      })
      throw insertError
    }

    return NextResponse.json({
      message: 'Subscription successful',
      id: data.id,
    }, { status: 201 })

  } catch (error) {
    console.error('Email signup error:', {
      name: error.name,
      message: error.message,
      code: error.code
    })
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Invalid email format',
        details: error.errors 
      }, { status: 400 })
    }

    // Handle specific database errors
    if (error.code === '23505') { // unique_violation
      return NextResponse.json({ 
        error: 'Email already registered'
      }, { status: 409 })
    }

    return NextResponse.json({
      error: 'Failed to process subscription',
      details: error.message
    }, { status: 500 })
  }
} 