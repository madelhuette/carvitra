'use client'

import { LandingPageCard, type LandingPageData } from './landing-page-card'

interface LandingPagesGridProps {
  landingPages: LandingPageData[]
  onEdit: (id: string) => void
  onPreview: (id: string) => void
  onDuplicate: (id: string) => void
  onArchive: (id: string) => void
  onDelete: (id: string) => void
}

export function LandingPagesGrid({
  landingPages,
  onEdit,
  onPreview,
  onDuplicate,
  onArchive,
  onDelete
}: LandingPagesGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {landingPages.map((landingPage) => (
        <LandingPageCard
          key={landingPage.id}
          landingPage={landingPage}
          onEdit={onEdit}
          onPreview={onPreview}
          onDuplicate={onDuplicate}
          onArchive={onArchive}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}