import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import { useState, useEffect } from 'react'

interface SidebarProps {
  filters: {
    categories: Set<string>
    availability: Set<string>
    maxDistance: number
  }
  onCategoryChange: (category: string, checked: boolean) => void
  onAvailabilityChange: (time: string, checked: boolean) => void
  onDistanceChange: (value: number) => void
}

export default function Sidebar({ 
  filters, 
  onCategoryChange, 
  onAvailabilityChange, 
  onDistanceChange 
}: SidebarProps) {
  const [sliderValue, setSliderValue] = useState(filters.maxDistance)

  useEffect(() => {
    setSliderValue(filters.maxDistance)
  }, [filters.maxDistance])

  const handleSliderChange = (value: number[]) => {
    const newValue = value[0]
    setSliderValue(newValue)
    onDistanceChange(newValue)
  }

  return (
    <aside className="w-64 bg-white border-r border-gray-200 p-6 overflow-y-auto">
      <h2 className="text-lg font-semibold mb-4">Filters</h2>
      
      <div className="mb-6">
        <h3 className="text-sm font-medium mb-2">Distance</h3>
        <Slider 
          value={[sliderValue]}
          max={100} 
          step={1} 
          onValueChange={handleSliderChange}
        />
        <div className="flex justify-between text-sm text-gray-500 mt-1">
          <span>0 miles</span>
          <span>100 miles</span>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-medium mb-2">Categories</h3>
        <div className="space-y-2">
          {['Education', 'Environment', 'Health', 'Community Service', 'Animal Welfare'].map((category) => (
            <div key={category} className="flex items-center">
              <Checkbox 
                id={category}
                checked={filters.categories.has(category)}
                onCheckedChange={(checked) => onCategoryChange(category, checked === true)}
              />
              <label htmlFor={category} className="ml-2 text-sm text-gray-700">{category}</label>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-sm font-medium mb-2">Availability</h3>
        <div className="space-y-2">
          {['Weekdays', 'Weekends', 'Morning', 'Afternoon', 'Evening'].map((time) => (
            <div key={time} className="flex items-center">
              <Checkbox 
                id={time}
                checked={filters.availability.has(time)}
                onCheckedChange={(checked) => onAvailabilityChange(time, checked === true)}
              />
              <label htmlFor={time} className="ml-2 text-sm text-gray-700">{time}</label>
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}

