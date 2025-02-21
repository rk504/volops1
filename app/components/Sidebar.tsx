import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import { Filter } from 'lucide-react'

interface SidebarProps {
  filters: {
    categories: Set<string>
    availability: Set<string>
  }
  onCategoryChange: (category: string, checked: boolean) => void
  onAvailabilityChange: (time: string, checked: boolean) => void
}

export default function Sidebar({ 
  filters, 
  onCategoryChange, 
  onAvailabilityChange
}: SidebarProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const FilterContent = () => (
    <>
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
    </>
  )

  if (isMobile) {
    return (
      <>
        <Button
          variant="outline"
          className="fixed bottom-4 left-4 z-50 flex items-center gap-2"
          onClick={() => setIsOpen(true)}
        >
          <Filter className="w-4 h-4" />
          Filters
        </Button>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Filters</DialogTitle>
            </DialogHeader>
            <FilterContent />
          </DialogContent>
        </Dialog>
      </>
    )
  }

  return (
    <aside className="hidden md:block w-64 bg-white border-r border-gray-200 p-6 overflow-y-auto">
      <h2 className="text-lg font-semibold mb-4">Filters</h2>
      <FilterContent />
    </aside>
  )
}

