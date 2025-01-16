'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import dynamic from 'next/dynamic'
import L from 'leaflet'
import { LatLngExpression, LatLngTuple } from 'leaflet'
import 'leaflet/dist/leaflet.css'

const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false })

interface Opportunity {
  id: string
  title: string
  organization: string
  latitude: number
  longitude: number
  time: string
  day: string
  max_participants: number
  current_participants: number
}

interface MapProps {
  opportunities: Opportunity[]
}

// Custom marker icon
const customIcon = L.divIcon({
  className: 'custom-icon',
  html: `<div class="marker-pin"></div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30]
})

export default function Map({ opportunities }: MapProps) {
  const [isClient, setIsClient] = useState(false)
  const mapRef = useRef<L.Map | null>(null)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Calculate map bounds and center
  const { bounds, center, zoom } = useMemo(() => {
    if (!opportunities || opportunities.length === 0) {
      return {
        bounds: undefined,
        center: [40.7128, -74.0060] as LatLngTuple, // Default to NYC
        zoom: 11
      }
    }

    const points = opportunities.map(opp => [opp.latitude, opp.longitude] as LatLngTuple)
    const bounds = L.latLngBounds(points)
    
    // Calculate center
    const center = bounds.getCenter()
    
    // Calculate appropriate zoom level
    const zoom = Math.min(13, getBoundsZoom(bounds))

    return { bounds, center, zoom }
  }, [opportunities])

  // Update map bounds when opportunities change
  useEffect(() => {
    if (mapRef.current && bounds) {
      mapRef.current.fitBounds(bounds)
    }
  }, [bounds])

  if (!isClient) return null
  if (!opportunities || !Array.isArray(opportunities)) return null

  return (
    <>
      <style jsx global>{`
        .custom-icon {
          background-color: #3b82f6;
          border-radius: 50%;
          width: 30px !important;
          height: 30px !important;
          display: flex;
          justify-content: center;
          align-items: center;
          color: white;
          font-weight: bold;
        }
        .marker-pin {
          width: 30px;
          height: 30px;
          border-radius: 50% 50% 50% 0;
          background: #3b82f6;
          position: absolute;
          transform: rotate(-45deg);
          left: 50%;
          top: 50%;
          margin: -15px 0 0 -15px;
        }
        .marker-pin::after {
          content: '';
          width: 24px;
          height: 24px;
          margin: 3px 0 0 3px;
          background: #fff;
          position: absolute;
          border-radius: 50%;
        }
      `}</style>
      <MapContainer
        ref={(map) => { mapRef.current = map }}
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {opportunities.map((opportunity) => (
          <Marker
            key={opportunity.id}
            position={[opportunity.latitude, opportunity.longitude]}
            icon={customIcon}
          >
            <Popup>
              <div className="space-y-2">
                <h3 className="font-semibold">{opportunity.title}</h3>
                <p className="text-sm">{opportunity.organization}</p>
                <p className="text-sm text-gray-600">{opportunity.day}s at {opportunity.time}</p>
                <p className="text-sm font-medium">
                  {opportunity.current_participants}/{opportunity.max_participants} spots filled
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </>
  )
}

// Helper function to calculate appropriate zoom level
function getBoundsZoom(bounds: L.LatLngBounds): number {
  const PADDING = 0.1 // 10% padding
  const latDiff = Math.abs(bounds.getNorth() - bounds.getSouth())
  const lngDiff = Math.abs(bounds.getEast() - bounds.getWest())
  
  // The larger the difference, the smaller the zoom number should be
  const maxDiff = Math.max(latDiff, lngDiff) * (1 + PADDING)
  
  // This is a rough approximation - you might need to adjust these values
  if (maxDiff > 1) return 10
  if (maxDiff > 0.5) return 11
  if (maxDiff > 0.1) return 12
  return 13
}

