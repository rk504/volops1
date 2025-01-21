'use client'

import { Suspense } from 'react'
import { useState, useCallback, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import OpportunityList from './components/OpportunityList'
import EmailSignup from './components/EmailSignup'
import { fetchOpportunities, Opportunity } from '../lib/data'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'
import Link from 'next/link'

// Dynamically import the Map component with no SSR
const Map = dynamic(() => import('./components/Map'), { 
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center">Loading map...</div>
})

export default function Home() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
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
    } finally {
      setLoading(false)
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
      
      // Split filters into day types and times
      const dayTypeFilters = Array.from(filters.availability).filter(f => ['Weekdays', 'Weekends'].includes(f))
      const timeFilters = Array.from(filters.availability).filter(f => ['Morning', 'Afternoon', 'Evening'].includes(f))
      
      // Check day type (if any selected)
      if (dayTypeFilters.length > 0) {
        const matchesDayType = dayTypeFilters.some(filter => {
          if (filter === 'Weekdays') return !isWeekend
          if (filter === 'Weekends') return isWeekend
          return false
        })
        if (!matchesDayType) return false
      }
      
      // Check time of day (if any selected)
      if (timeFilters.length > 0) {
        const matchesTime = timeFilters.some(filter => timeOfDay === filter)
        if (!matchesTime) return false
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

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading opportunities...</div>
  }

  return (
    <div>
      <div className="flex flex-col min-h-screen">
        <Header />
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
            <div className="w-1/4 h-[calc(100vh-8rem)] mt-8 mr-6 pl-12">
              <div className="relative h-full">
                <Suspense fallback={<div className="w-full h-full flex items-center justify-center">Loading map...</div>}>
                  <Map opportunities={filteredOpportunities} />
                </Suspense>
              </div>
            </div>
          </main>
        </div>
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

