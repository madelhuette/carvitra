'use client'

import { Plus } from '@untitledui/icons'
import { Button } from '@/components/base/buttons/button'
import { Badge } from '@/components/base/badges/badges'

interface LandingPagesHeaderProps {
  totalCount: number
  onCreateClick: () => void
}

export function LandingPagesHeader({ 
  totalCount, 
  onCreateClick 
}: LandingPagesHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-display-sm font-semibold text-primary">
            Landing Pages
          </h1>
          {totalCount > 0 && (
            <Badge color="gray" type="pill">
              {totalCount}
            </Badge>
          )}
        </div>
        <p className="text-md text-secondary mt-1">
          Verwalten Sie Ihre Landing Pages und verfolgen Sie deren Performance
        </p>
      </div>
      
      <Button 
        size="lg"
        iconLeading={Plus}
        onClick={onCreateClick}
      >
        Landing Page erstellen
      </Button>
    </div>
  )
}