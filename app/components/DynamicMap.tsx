'use client'

import dynamic from 'next/dynamic'
import type { LatLngExpression } from 'leaflet'

interface MapProps {
  center: LatLngExpression
  marker: LatLngExpression
}

const DynamicMap = dynamic(() => import('./Map'), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] bg-gray-100 rounded-lg flex items-center justify-center">
      <p>Loading map...</p>
    </div>
  ),
})

export default function MapWrapper(props: MapProps) {
  return <DynamicMap {...props} />
} 