import { supabase } from './supabase'

export interface Opportunity {
  id: string
  title: string
  organization: string
  description: string
  category: string
  commitment: string
  distance: number
  latitude: number
  longitude: number
  image: string
  date: string
  time: string
  day: string
  recurring: boolean
  max_participants: number
  participant_count: number
}

export async function fetchOpportunities(): Promise<Opportunity[]> {
  // Get events with their registration counts directly from the view
  const { data: events, error } = await supabase
    .from('events_with_counts')
    .select('*')
    .order('date', { ascending: true })

  if (error) {
    console.error('Error fetching opportunities:', error)
    return []
  }

  // Transform the data to match our interface
  return (events || []).map(event => {
    // Create a date object from the UTC timestamp
    const date = new Date(event.date)
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    
    // Format the time in ET
    const etTime = date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true,
      timeZone: 'America/New_York'
    })
    
    // Get the day of week in ET
    const etDate = new Date(date.toLocaleString('en-US', { timeZone: 'America/New_York' }))
    
    return {
      id: event.id,
      title: event.title,
      organization: event.organization || '',
      description: event.description || '',
      category: event.category || 'Community Service',
      commitment: event.commitment || 'Flexible',
      distance: event.distance || 0,
      latitude: event.latitude || 40.7128,
      longitude: event.longitude || -74.0060,
      image: event.image || '/placeholder-logo.png',
      date: event.date,
      time: `${etTime} ET`,
      day: days[etDate.getDay()],
      recurring: event.recurring || false,
      max_participants: event.max_participants || 10,
      participant_count: event.participant_count || 0
    } as Opportunity
  })
}

// SQL script to insert mock data:
/*
INSERT INTO public.events (
  id,
  title,
  organization,
  description,
  category,
  commitment,
  distance,
  latitude,
  longitude,
  image,
  date,
  recurring,
  max_participants
) VALUES 
(
  '7ece8788-60de-46f2-be9a-cd6fac949cdf',
  'Teach English to Refugees',
  'Refugee Support Network',
  'Help refugees improve their English language skills through weekly classes.',
  'Education',
  '2 hours/week',
  2.0,
  40.7128,
  -74.0060,
  '/images/teach-english.jpg',
  '2025-02-03T15:00:00Z',
  true,
  10
),
(
  '9d1d0ce9-d6fd-4d31-842f-d56e2b6c1bf0',
  'Community Garden Volunteer',
  'Green City Initiative',
  'Assist in maintaining and growing produce in our community garden.',
  'Environment',
  'Flexible',
  1.1,
  40.7282,
  -73.9942,
  '/images/community-garden.jpg',
  '2025-02-08T10:00:00Z',
  true,
  20
),
(
  'b5e6d3f2-8c7a-4b9d-a1e2-f3c4d5e6f7g8',
  'Elder Care Companion',
  'Silver Years Foundation',
  'Provide companionship and assistance to elderly individuals in their homes.',
  'Health',
  '3 hours/week',
  2.8,
  40.7589,
  -73.9851,
  '/images/elder-care.jpg',
  '2025-02-05T14:00:00Z',
  true,
  8
),
(
  'c6f7e4d3-9b8a-5c4d-b2e3-g4h5i6j7k8l9',
  'Food Bank Distribution',
  'Community Food Bank',
  'Help sort and distribute food to families in need.',
  'Community Service',
  '4 hours/week',
  1.5,
  40.7328,
  -74.0060,
  '/images/food-bank.jpg',
  '2025-02-15T09:00:00Z',
  true,
  15
),
(
  'd7g8f5e4-0c9b-6d5e-c3f4-h5i6j7k8l9m0',
  'Youth Mentoring Program',
  'Youth Empowerment Center',
  'Mentor young people in academic and life skills.',
  'Education',
  '2 hours/week',
  3.0,
  40.7428,
  -73.9911,
  '/images/youth-mentor.jpg',
  '2025-02-11T16:30:00Z',
  true,
  12
),
(
  'e8h9g6f5-1d0c-7e6f-d4g5-i6j7k8l9m0n1',
  'Animal Shelter Care',
  'City Animal Rescue',
  'Help care for rescued animals and assist with shelter operations.',
  'Animal Welfare',
  '3 hours/week',
  2.2,
  40.7489,
  -73.9680,
  '/images/animal-shelter.jpg',
  '2025-02-09T11:00:00Z',
  true,
  10
);
*/

