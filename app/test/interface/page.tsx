'use client'

import { Suspense } from 'react'
import { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import Header from '../../components/Header'
import Sidebar from '../../components/Sidebar'
import OpportunityList from '../../components/OpportunityList'
import EmailSignup from '../../components/EmailSignup'

// Mock data for testing the interface
const mockOpportunities = [
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
    participant_count: 5
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
    participant_count: 10
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
    participant_count: 5
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
    participant_count: 7
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
    participant_count: 8
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
    participant_count: 4
  }
]

// Dynamically import the Map component with no SSR
const Map = dynamic(() => import('../../components/Map'), { 
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center">Loading map...</div>
})

export default function TestInterface() {
  const [opportunities] = useState(mockOpportunities)
  const [filters, setFilters] = useState({
    categories: new Set<string>(),
    availability: new Set<string>()
  })

  // Filter opportunities based on current filters
  const filteredOpportunities = opportunities.filter(opp => {
    // Category filter
    if (filters.categories.size > 0 && !filters.categories.has(opp.category)) return false

    // Availability filter
    if (filters.availability.size > 0) {
      const isWeekend = opp.day === 'Saturday' || opp.day === 'Sunday'
      const timeOfDay = getTimeOfDay(opp.time)
      
      // Check each selected filter - ALL must match
      const selectedFilters = Array.from(filters.availability)
      for (const filter of selectedFilters) {
        // Day type checks
        if (filter === 'Weekdays' && isWeekend) return false
        if (filter === 'Weekends' && !isWeekend) return false
        
        // Time of day checks
        if (['Morning', 'Afternoon', 'Evening'].includes(filter) && timeOfDay !== filter) return false
      }
    }

    return true
  })

  const updateFilters = useCallback((type: 'categories' | 'availability', value: string, checked: boolean) => {
    setFilters(prev => {
      const newSet = new Set(prev[type])
      if (checked) {
        newSet.add(value)
      } else {
        newSet.delete(value)
      }
      return { ...prev, [type]: newSet }
    })
  }, [])

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="bg-yellow-50 p-4 border-b border-yellow-200">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-yellow-800">Test Interface</h1>
          <p className="text-yellow-700">
            This is a test page using mock data. No changes will be saved to the database.
          </p>
        </div>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          filters={filters}
          onCategoryChange={(category, checked) => updateFilters('categories', category, checked)}
          onAvailabilityChange={(time, checked) => updateFilters('availability', time, checked)}
        />
        <main className="flex-1 flex overflow-y-auto">
          <div className="flex-1 flex flex-col">
            <OpportunityList 
              opportunities={filteredOpportunities} 
              onRegistrationComplete={() => {}}
            />
            <EmailSignup />
          </div>
          <div className="w-1/4 h-[calc(100vh-8rem)] mt-8 mr-6">
            <div className="relative h-full">
              <Suspense fallback={<div className="w-full h-full flex items-center justify-center">Loading map...</div>}>
                <Map opportunities={filteredOpportunities} />
              </Suspense>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

function getTimeOfDay(time: string): string {
  const [timeStr, period] = time.split(' ')
  const [hours, minutes] = timeStr.split(':')
  let hour = parseInt(hours)
  
  // Convert to 24-hour format if PM
  if (period === 'PM' && hour !== 12) {
    hour += 12
  }
  // Handle 12 AM (midnight)
  if (period === 'AM' && hour === 12) {
    hour = 0
  }

  if (hour < 12) return 'Morning'
  if (hour < 16) return 'Afternoon'
  return 'Evening'
} 