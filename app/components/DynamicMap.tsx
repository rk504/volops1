'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import 'leaflet/dist/leaflet.css'
import type { MapContainer as MapContainerType, TileLayer, Marker } from 'react-leaflet'
import type { LatLngExpression } from 'leaflet'

// Only import Leaflet on the client side
let L: any
if (typeof window !== 'undefined') {
  L = require('leaflet')
}

interface DynamicMapProps {
  center: [number, number]
  marker: [number, number]
  onMapClick?: (lat: number, lng: number) => void
}

// Dynamically import react-leaflet components
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
)

const TileLayerComponent = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
)

const MarkerComponent = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
)

const MapEvents = dynamic(
  () => import('react-leaflet').then((mod) => {
    const { useMapEvents } = mod
    return function MapEvents({ onClick }: { onClick?: (lat: number, lng: number) => void }) {
      useMapEvents({
        click: (e) => {
          if (onClick) {
            onClick(e.latlng.lat, e.latlng.lng)
          }
        }
      })
      return null
    }
  }),
  { ssr: false }
)

function Map({ center, marker, onMapClick }: DynamicMapProps) {
  const [icon, setIcon] = useState<any>(null)

  useEffect(() => {
    // Initialize the icon only on the client side
    if (typeof window !== 'undefined' && L) {
      setIcon(
        L.icon({
          iconUrl: '/marker-icon.png',
          iconRetinaUrl: '/marker-icon-2x.png',
          shadowUrl: '/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          tooltipAnchor: [16, -28],
          shadowSize: [41, 41]
        })
      )
    }
  }, [])

  if (typeof window === 'undefined') {
    return (
      <div className="h-full w-full bg-gray-100 rounded-lg flex items-center justify-center">
        <p>Loading map...</p>
      </div>
    )
  }

  return (
    <MapContainer
      center={center}
      zoom={13}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={false}
    >
      <TileLayerComponent
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {icon && <MarkerComponent position={marker} icon={icon} />}
      <MapEvents onClick={onMapClick} />
    </MapContainer>
  )
}

// Export the map component with no SSR
export default dynamic(() => Promise.resolve(Map), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-gray-100 rounded-lg flex items-center justify-center">
      <p>Loading map...</p>
    </div>
  )
}) 