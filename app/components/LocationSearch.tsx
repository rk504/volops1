'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import DynamicMap from './DynamicMap'

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

  const defaultCenter: [number, number] = [40.7128, -74.0060] // Default to NYC

  const handleZipCodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newZipCode = e.target.value
    setZipCode(newZipCode)
    setError('')

    if (newZipCode.length === 5) {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?postalcode=${newZipCode}&country=USA&format=json`
        )
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
        setError('Error fetching location data')
        setCoordinates(null)
      }
    } else {
      setCoordinates(null)
    }
  }

  const handleMapClick = (lat: number, lng: number) => {
    setCoordinates([lat, lng])
    // When map is clicked, we'll reverse geocode to get the ZIP code
    fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
    )
      .then(response => response.json())
      .then(data => {
        if (data.address && data.address.postcode) {
          const newZipCode = data.address.postcode
          setZipCode(newZipCode)
          onLocationSelect({
            zipCode: newZipCode,
            latitude: lat,
            longitude: lng
          })
        }
      })
      .catch(error => {
        console.error('Error reverse geocoding:', error)
        setError('Error getting ZIP code for location')
      })
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