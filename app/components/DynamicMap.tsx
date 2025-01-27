'use client'

import { useEffect } from 'react'
import dynamic from 'next/dynamic'
import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'

// Fix Leaflet marker icon issue
const icon = L.icon({
  iconUrl: '/marker-icon.png',
  iconRetinaUrl: '/marker-icon-2x.png',
  shadowUrl: '/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
})

interface DynamicMapProps {
  center: [number, number]
  marker: [number, number]
  onMapClick?: (lat: number, lng: number) => void
}

function MapEvents({ onClick }: { onClick?: (lat: number, lng: number) => void }) {
  const map = useMapEvents({
    click: (e) => {
      if (onClick) {
        onClick(e.latlng.lat, e.latlng.lng)
      }
    }
  })
  return null
}

function MapComponent({ center, marker, onMapClick }: DynamicMapProps) {
  const map = useMap()

  useEffect(() => {
    map.setView(center, map.getZoom())
  }, [center, map])

  return (
    <>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={marker} icon={icon} />
      <MapEvents onClick={onMapClick} />
    </>
  )
}

function Map({ center, marker, onMapClick }: DynamicMapProps) {
  return (
    <MapContainer
      center={center}
      zoom={13}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={false}
    >
      <MapComponent center={center} marker={marker} onMapClick={onMapClick} />
    </MapContainer>
  )
}

// Export as dynamic component with no SSR
export default dynamic(() => Promise.resolve(Map), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-gray-100 rounded-lg flex items-center justify-center">
      <p>Loading map...</p>
    </div>
  )
}) 