'use client'

import { useEffect, useState } from 'react'
import type { LatLngExpression } from 'leaflet'

interface MapProps {
  center: LatLngExpression
  marker: LatLngExpression
}

export default function Map({ center, marker }: MapProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    // Import Leaflet dynamically on the client side
    Promise.all([
      import('react-leaflet').then(mod => ({
        MapContainer: mod.MapContainer,
        TileLayer: mod.TileLayer,
        Marker: mod.Marker
      })),
      import('leaflet').then(L => L.default),
      import('leaflet/dist/leaflet.css')
    ]).then(([{ MapContainer, TileLayer, Marker }, L]) => {
      // Set up the icon
      const icon = L.icon({
        iconUrl: '/marker-icon.png',
        iconRetinaUrl: '/marker-icon-2x.png',
        shadowUrl: '/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      })

      // Set the client-side flag
      setIsClient(true)

      // Set the default icon globally
      L.Marker.prototype.options.icon = icon
    })
  }, [])

  if (!isClient) {
    return (
      <div className="h-[300px] bg-gray-100 rounded-lg flex items-center justify-center">
        <p>Loading map...</p>
      </div>
    )
  }

  // We need to dynamically import these components to avoid SSR issues
  const { MapContainer, TileLayer, Marker } = require('react-leaflet')

  return (
    <MapContainer
      center={center}
      zoom={13}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <Marker position={marker} />
    </MapContainer>
  )
}

