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
  current_participants: number
}

export async function fetchOpportunities(): Promise<Opportunity[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('date', { ascending: true })

  if (error) {
    console.error('Error fetching opportunities:', error)
    return []
  }

  // Transform the data to match our interface
  return data.map(event => {
    const date = new Date(event.date)
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    
    return {
      id: event.id,
      title: event.title,
      organization: event.organization,
      description: event.description,
      category: event.category,
      commitment: event.commitment || 'Flexible',
      distance: event.distance || 0,
      latitude: event.latitude || 40.7128, // Default to NYC if not set
      longitude: event.longitude || -74.0060,
      image: event.image || '/placeholder-logo.png',
      date: event.date,
      time: date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      }),
      day: days[date.getDay()],
      recurring: event.recurring || false,
      max_participants: event.max_participants || 10,
      current_participants: event.current_participants || 0
    }
  })
}

// Keep the mock data for reference
export function getMockOpportunities(): Opportunity[] {
  return [
    {
      id: "7ece8788-60de-46f2-be9a-cd6fac949cdf",
      title: "Teach English to Refugees",
      organization: "Refugee Support Network",
      description: "Help refugees improve their English language skills through weekly classes.",
      category: "Education",
      commitment: "2 hours/week",
      distance: 2.0,
      latitude: 40.7128,
      longitude: -74.0060,
      image: "/images/teach-english.jpg",
      date: "2025-02-03T15:00:00Z",
      time: "3:00 PM",
      day: "Monday",
      recurring: true,
      max_participants: 10,
      current_participants: 5
    },
    {
      id: "9d1d0ce9-d6fd-4d31-842f-d56e2b6c1bf0",
      title: "Community Garden Volunteer",
      organization: "Green City Initiative",
      description: "Assist in maintaining and growing produce in our community garden.",
      category: "Environment",
      commitment: "Flexible",
      distance: 1.1,
      latitude: 40.7282,
      longitude: -73.9942,
      image: "/images/community-garden.jpg",
      date: "2025-02-08T10:00:00Z",
      time: "10:00 AM",
      day: "Saturday",
      recurring: true,
      max_participants: 20,
      current_participants: 10
    },
    {
      id: "b5e6d3f2-8c7a-4b9d-a1e2-f3c4d5e6f7g8",
      title: "Elder Care Companion",
      organization: "Silver Years Foundation",
      description: "Provide companionship and assistance to elderly individuals in their homes.",
      category: "Health",
      commitment: "3 hours/week",
      distance: 2.8,
      latitude: 40.7589,
      longitude: -73.9851,
      image: "/images/elder-care.jpg",
      date: "2025-02-05T14:00:00Z",
      time: "2:00 PM",
      day: "Wednesday",
      recurring: true,
      max_participants: 8,
      current_participants: 5
    },
    {
      id: "c6f7e4d3-9b8a-5c4d-b2e3-g4h5i6j7k8l9",
      title: "Food Bank Distribution",
      organization: "Community Food Bank",
      description: "Help sort and distribute food to families in need.",
      category: "Community Service",
      commitment: "4 hours/week",
      distance: 1.5,
      latitude: 40.7328,
      longitude: -74.0060,
      image: "/images/food-bank.jpg",
      date: "2025-02-15T09:00:00Z",
      time: "9:00 AM",
      day: "Saturday",
      recurring: true,
      max_participants: 15,
      current_participants: 7
    },
    {
      id: "d7g8f5e4-0c9b-6d5e-c3f4-h5i6j7k8l9m0",
      title: "Youth Mentoring Program",
      organization: "Youth Empowerment Center",
      description: "Mentor young people in academic and life skills.",
      category: "Education",
      commitment: "2 hours/week",
      distance: 3.0,
      latitude: 40.7428,
      longitude: -73.9911,
      image: "/images/youth-mentor.jpg",
      date: "2025-02-11T16:30:00Z",
      time: "4:30 PM",
      day: "Tuesday",
      recurring: true,
      max_participants: 12,
      current_participants: 8
    },
    {
      id: "e8h9g6f5-1d0c-7e6f-d4g5-i6j7k8l9m0n1",
      title: "Animal Shelter Care",
      organization: "City Animal Rescue",
      description: "Help care for rescued animals and assist with shelter operations.",
      category: "Animal Welfare",
      commitment: "3 hours/week",
      distance: 2.2,
      latitude: 40.7489,
      longitude: -73.9680,
      image: "/images/animal-shelter.jpg",
      date: "2025-02-09T11:00:00Z",
      time: "11:00 AM",
      day: "Sunday",
      recurring: true,
      max_participants: 10,
      current_participants: 4
    }
  ]
}

