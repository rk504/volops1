'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'
import debounce from 'lodash/debounce'
import dynamic from 'next/dynamic'
import type { ChangeEvent } from 'react'

interface DynamicMapProps {
  center: [number, number]
  marker: [number, number]
}

interface LocationSearchProps {
  onLocationSelect: (location: {
    address: string
    latitude: number
    longitude: number
  }) => void
  initialLocation?: {
    address: string
    latitude: number
    longitude: number
  }
}

interface SearchResult {
  display_name: string
  lat: string
  lon: string
}

// Dynamically import the map component with no SSR
const DynamicMap = dynamic<DynamicMapProps>(() => import('./DynamicMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] bg-gray-100 rounded-lg flex items-center justify-center">
      <p>Loading map...</p>
    </div>
  ),
})

export default function LocationSearch({ onLocationSelect, initialLocation }: LocationSearchProps) {
  const [searchQuery, setSearchQuery] = useState(initialLocation?.address || '')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [showResults, setShowResults] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState(initialLocation || {
    address: '',
    latitude: 40.7128,
    longitude: -74.0060
  })

  // Debounced search function
  const searchAddress = debounce(async (query: string) => {
    if (!query) {
      setSearchResults([])
      return
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
      )
      const data = await response.json()
      setSearchResults(data)
      setShowResults(true)
    } catch (error) {
      console.error('Error searching address:', error)
      setSearchResults([])
    }
  }, 300)

  const handleSelect = (result: SearchResult) => {
    const location = {
      address: result.display_name,
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon)
    }
    setSelectedLocation(location)
    setSearchQuery(result.display_name)
    setShowResults(false)
    onLocationSelect(location)
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="relative">
          <Input
            type="text"
            placeholder="Search for an address..."
            value={searchQuery}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              setSearchQuery(e.target.value)
              searchAddress(e.target.value)
            }}
          />
          <Button
            size="icon"
            variant="ghost"
            className="absolute right-0 top-0"
            onClick={() => setShowResults(!showResults)}
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>

        {showResults && searchResults.length > 0 && (
          <div className="absolute z-10 w-full bg-white border rounded-md shadow-lg mt-1">
            {searchResults.map((result, index) => (
              <button
                key={index}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                onClick={() => handleSelect(result)}
              >
                {result.display_name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="h-[300px] rounded-lg overflow-hidden border">
        <DynamicMap
          center={[selectedLocation.latitude, selectedLocation.longitude]}
          marker={[selectedLocation.latitude, selectedLocation.longitude]}
        />
      </div>
    </div>
  )
} 