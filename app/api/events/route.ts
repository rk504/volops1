import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const { data: events, error } = await supabase
      .from('events_with_counts')
      .select('*')
      .eq('status', 'active')
      .order('date', { ascending: true })

    if (error) throw error

    // Detailed debugging
    console.log('=== DEBUG START ===')
    events?.forEach(event => {
      console.log(`Event: ${event.title}`)
      console.log('Location:', event.location)
      console.log('Coordinates:', { lat: event.latitude, lng: event.longitude })
      console.log('Raw event data:', JSON.stringify(event, null, 2))
    })
    console.log('=== DEBUG END ===')

    return NextResponse.json(events)
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json(
      { error: 'Error fetching events' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { data: event, error } = await supabase
      .from('events')
      .insert([body])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    console.error('Error creating event:', error)
    return NextResponse.json(
      { error: 'Error creating event' },
      { status: 500 }
    )
  }
} 