'use client'

import { useState, useEffect } from 'react'
import { fetchOpportunities } from '../../lib/data'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function TestPage() {
  const [opportunities, setOpportunities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadOpportunities() {
      const data = await fetchOpportunities()
      setOpportunities(data)
      setLoading(false)
    }
    loadOpportunities()
  }, [])

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Test Page</h1>
      <div className="space-y-4">
        {opportunities.map((opportunity) => (
          <Card key={opportunity.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold mb-2">{opportunity.title}</h2>
                  <p className="text-gray-600 mb-2">{opportunity.description}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {opportunity.participant_count} / {opportunity.max_participants} spots filled
                    </Badge>
                  </div>
                </div>
                <Button>
                  Register
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
} 