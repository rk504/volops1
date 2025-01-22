'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'
import dynamic from 'next/dynamic'
import type { ChangeEvent } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface DynamicMapProps {
  center: [number, number]
  marker: [number, number]
}

interface LocationSearchProps {
  onLocationSelect: (location: {
    zipCode: string
    latitude: number
    longitude: number
  }) => void
  initialLocation?: {
    zipCode: string
    latitude: number
    longitude: number
  }
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
  const [zipCode, setZipCode] = useState(initialLocation?.zipCode || '')
  const [error, setError] = useState('')
  const [selectedLocation, setSelectedLocation] = useState(initialLocation || {
    zipCode: '',
    latitude: 40.7128,
    longitude: -74.0060
  })

  const handleZipCodeSearch = async () => {
    if (!zipCode.match(/^\d{5}$/)) {
      setError('Please enter a valid 5-digit ZIP code')
      return
    }

    try {
      const response = await fetch(
        `https://api.zippopotam.us/us/${zipCode}`
      )
      
      if (!response.ok) {
        throw new Error('Invalid ZIP code')
      }

      const data = await response.json()
      const location = {
        zipCode,
        latitude: parseFloat(data.places[0].latitude),
        longitude: parseFloat(data.places[0].longitude)
      }
      
      setSelectedLocation(location)
      setError('')
      onLocationSelect(location)
    } catch (error) {
      console.error('Error searching ZIP code:', error)
      setError('Invalid ZIP code. Please try again.')
    }
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Enter ZIP code..."
            value={zipCode}
            maxLength={5}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              const value = e.target.value.replace(/\D/g, '').slice(0, 5)
              setZipCode(value)
              setError('')
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleZipCodeSearch()
              }
            }}
          />
          <Button 
            onClick={handleZipCodeSearch}
            disabled={zipCode.length !== 5}
          >
            <Search className="h-4 w-4 mr-2" />
            Find
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mt-2">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
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