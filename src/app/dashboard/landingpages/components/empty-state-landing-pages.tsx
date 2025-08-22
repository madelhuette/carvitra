'use client'

import { Link03, File02, Plus } from '@untitledui/icons'
import { Button } from '@/components/base/buttons/button'

interface EmptyStateLandingPagesProps {
  onCreateClick: () => void
  onSelectOfferClick: () => void
}

export function EmptyStateLandingPages({ 
  onCreateClick, 
  onSelectOfferClick 
}: EmptyStateLandingPagesProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] py-12">
      <div className="w-12 h-12 rounded-xl bg-brand-primary_alt/10 flex items-center justify-center mb-4">
        <Link03 className="w-6 h-6 text-brand-600" />
      </div>
      
      <h3 className="text-display-xs font-semibold text-primary mb-2">
        Noch keine Landing Pages
      </h3>
      
      <p className="text-md text-secondary max-w-sm text-center mb-8">
        Erstellen Sie Ihre erste Landing Page aus einem Ihrer Angebote 
        und beginnen Sie mit der Lead-Generierung.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-3">
        <Button 
          size="lg" 
          iconLeading={Plus}
          onClick={onCreateClick}
        >
          Erste Landing Page erstellen
        </Button>
        
        <Button 
          color="secondary"
          size="lg"
          iconLeading={File02}
          onClick={onSelectOfferClick}
        >
          Angebot auswählen
        </Button>
      </div>
    </div>
  )
}