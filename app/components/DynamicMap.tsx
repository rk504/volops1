'use client'

import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix for default marker icon in Leaflet
const icon = L.divIcon({
  className: 'custom-icon',
  html: `<div class="marker-pin"></div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30]
})

interface DynamicMapProps {
  center: [number, number]
  marker: [number, number]
}

export default function DynamicMap({ center, marker }: DynamicMapProps) {
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
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <Marker position={marker} icon={icon} />
      </MapContainer>
    </>
  )
} 