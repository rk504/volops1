import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      )
    }

    const { data: subscriber, error: findError } = await supabase
      .from('email_subscribers')
      .select()
      .eq('verification_token', token)
      .single()

    if (findError || !subscriber) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 400 }
      )
    }

    const { error: updateError } = await supabase
      .from('email_subscribers')
      .update({
        verified: true,
        verification_token: null,
      })
      .eq('id', subscriber.id)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({
      message: 'Email verified successfully',
    })

  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 