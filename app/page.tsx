'use client'

import { Suspense } from 'react'
import { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import OpportunityList from './components/OpportunityList'
import EmailSignup from './components/EmailSignup'
import { getOpportunities } from '../lib/data'

// Dynamically import the Map component with no SSR
const Map = dynamic(() => import('./components/Map'), { 
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center">Loading map...</div>
})

export default function Home() {
  const allOpportunities = getOpportunities()
  const [filters, setFilters] = useState({
    categories: new Set<string>(),
    availability: new Set<string>(),
    maxDistance: 100
  })

  // Filter opportunities based on current filters
  const filteredOpportunities = allOpportunities.filter(opp => {
    // Distance filter
    if (opp.distance > filters.maxDistance) return false

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

  const updateDistanceFilter = useCallback((value: number) => {
    setFilters(prev => ({ ...prev, maxDistance: value }))
  }, [])

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          filters={filters}
          onCategoryChange={(category, checked) => updateFilters('categories', category, checked)}
          onAvailabilityChange={(time, checked) => updateFilters('availability', time, checked)}
          onDistanceChange={updateDistanceFilter}
        />
        <main className="flex-1 flex">
          <div className="flex-1 flex flex-col overflow-y-auto">
            <OpportunityList opportunities={filteredOpportunities} />
            <EmailSignup />
          </div>
          <div className="w-1/4 h-[calc(100vh-8rem)] sticky top-8">
            <Suspense fallback={<div className="w-full h-full flex items-center justify-center">Loading map...</div>}>
              <Map opportunities={filteredOpportunities} />
            </Suspense>
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

