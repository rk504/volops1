import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { z } from 'zod'
import crypto from 'crypto'

const emailSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, name } = emailSchema.parse(body)
    
    // Generate verification token
    const token = crypto.randomBytes(32).toString('hex')

    const { data, error } = await supabase
      .from('email_subscribers')
      .insert([
        {
          email,
          name,
          verification_token: token,
          verified: false,
        }
      ])
      .select()
      .single()

    if (error) {
      if (error.code === '23505') { // Unique violation
        return NextResponse.json({ error: 'Email already exists' }, { status: 409 })
      }
      throw error
    }

    return NextResponse.json({
      message: 'Subscription successful',
      id: data.id,
    }, { status: 201 })

  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    console.error('Email signup error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 