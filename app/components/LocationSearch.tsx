'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import dynamic from 'next/dynamic'

// Dynamically import the map component
const DynamicMap = dynamic(() => import('./DynamicMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] w-full bg-gray-100 rounded-lg flex items-center justify-center">
      <p>Loading map...</p>
    </div>
  )
})

interface LocationSearchProps {
  onLocationSelect: (location: { zipCode: string; latitude: number; longitude: number }) => void
  initialLocation?: {
    zipCode: string
    latitude: number
    longitude: number
  }
}

export default function LocationSearch({ onLocationSelect, initialLocation }: LocationSearchProps) {
  const [zipCode, setZipCode] = useState(initialLocation?.zipCode || '')
  const [coordinates, setCoordinates] = useState<[number, number] | null>(
    initialLocation ? [initialLocation.latitude, initialLocation.longitude] : null
  )
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const defaultCenter: [number, number] = [40.7128, -74.0060] // Default to NYC

  const handleZipCodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newZipCode = e.target.value.replace(/[^0-9]/g, '').slice(0, 5)
    setZipCode(newZipCode)
    setError('')

    if (newZipCode.length === 5) {
      setIsLoading(true)
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?postalcode=${newZipCode}&country=USA&format=json`,
          { signal: controller.signal }
        )

        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error('Failed to fetch location data')
        }

        const data = await response.json()

        if (data && data[0]) {
          const lat = parseFloat(data[0].lat)
          const lon = parseFloat(data[0].lon)
          setCoordinates([lat, lon])
          onLocationSelect({
            zipCode: newZipCode,
            latitude: lat,
            longitude: lon
          })
        } else {
          setError('Invalid ZIP code')
          setCoordinates(null)
        }
      } catch (error) {
        console.error('Error fetching coordinates:', error)
        setError(error instanceof Error ? error.message : 'Error fetching location data')
        setCoordinates(null)
      } finally {
        setIsLoading(false)
      }
    } else {
      setCoordinates(null)
    }
  }

  const handleMapClick = async (lat: number, lng: number) => {
    setCoordinates([lat, lng])
    setIsLoading(true)
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        { signal: controller.signal }
      )

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error('Failed to fetch ZIP code')
      }

      const data = await response.json()

      if (data.address && data.address.postcode) {
        const newZipCode = data.address.postcode
        setZipCode(newZipCode)
        onLocationSelect({
          zipCode: newZipCode,
          latitude: lat,
          longitude: lng
        })
      } else {
        throw new Error('No ZIP code found for this location')
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error)
      setError(error instanceof Error ? error.message : 'Error getting ZIP code for location')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <Input
          type="text"
          placeholder="Enter ZIP code"
          value={zipCode}
          onChange={handleZipCodeChange}
          maxLength={5}
          pattern="[0-9]*"
          disabled={isLoading}
        />
        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
      </div>
      <div className="h-[300px] w-full">
        <DynamicMap
          center={coordinates || defaultCenter}
          marker={coordinates || defaultCenter}
          onMapClick={handleMapClick}
        />
      </div>
    </div>
  )
} 