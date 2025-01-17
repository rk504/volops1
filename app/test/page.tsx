'use client'

import { Suspense } from 'react'
import { useState, useCallback, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Header from '../components/Header'
import Sidebar from '../components/Sidebar'
import OpportunityList from '../components/OpportunityList'
import EmailSignup from '../components/EmailSignup'
import { fetchOpportunities, getMockOpportunities } from '../../lib/data'
import { supabase } from '@/lib/supabase'

// Dynamically import the Map component with no SSR
const Map = dynamic(() => import('../components/Map'), { 
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center">Loading map...</div>
})

export default function TestPage() {
  const [opportunities, setOpportunities] = useState(getMockOpportunities())
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    categories: new Set<string>(),
    availability: new Set<string>()
  })

  // Function to fetch opportunities data
  const refreshOpportunities = useCallback(async () => {
    try {
      const data = await fetchOpportunities()
      setOpportunities(data)
    } catch (error) {
      console.error('Error fetching opportunities:', error)
    }
  }, [])

  // Initial fetch and setup real-time subscription
  useEffect(() => {
    // Initial fetch
    refreshOpportunities()

    // Set up real-time subscription
    const channel = supabase
      .channel('events-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events'
        },
        (payload) => {
          console.log('Real-time update:', payload)
          refreshOpportunities()
        }
      )
      .subscribe()

    // Cleanup subscription
    return () => {
      supabase.removeChannel(channel)
    }
  }, [refreshOpportunities])

  // Filter opportunities based on current filters
  const filteredOpportunities = opportunities.filter(opp => {
    // Category filter
    if (filters.categories.size > 0 && !filters.categories.has(opp.category)) return false

    // Availability filter
    if (filters.availability.size > 0) {
      const isWeekend = opp.day === 'Saturday' || opp.day === 'Sunday'
      const timeOfDay = getTimeOfDay(opp.time)
      
      const matchesAvailability = Array.from(filters.availability).some(filter => {
        if (filter === 'Weekdays') return !isWeekend
        if (filter === 'Weekends') return isWeekend
        if (['Morning', 'Afternoon', 'Evening'].includes(filter)) return timeOfDay === filter
        return false
      })

      if (!matchesAvailability) return false
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
          <h1 className="text-2xl font-bold text-yellow-800">Test Environment</h1>
          <p className="text-yellow-700">
            This is a test page using live Supabase data. Changes here will affect the real database.
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
              onRegistrationComplete={refreshOpportunities}
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