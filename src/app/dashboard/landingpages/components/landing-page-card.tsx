'use client'

import { useState } from 'react'
import { Eye, Users01, TrendUp01, Edit01, Copy01, Archive, Trash02, DotsHorizontal } from '@untitledui/icons'
import { Badge } from '@/components/base/badges/badges'
import { Skeleton } from '@/components/base/skeleton/skeleton'
import { formatDistanceToNow } from 'date-fns'
import { de } from 'date-fns/locale'

export interface LandingPageData {
  id: string
  title: string
  slug: string
  status: 'draft' | 'published' | 'archived'
  views_count: number
  leads_count: number
  conversion_rate: number
  thumbnail_url?: string
  updated_at: string
}

interface LandingPageCardProps {
  landingPage: LandingPageData
  onEdit: (id: string) => void
  onPreview: (id: string) => void
  onDuplicate: (id: string) => void
  onArchive: (id: string) => void
  onDelete: (id: string) => void
}

export function LandingPageCard({
  landingPage,
  onEdit,
  onPreview,
  onDuplicate,
  onArchive,
  onDelete
}: LandingPageCardProps) {
  const [showActions, setShowActions] = useState(false)

  const statusConfig = {
    draft: { label: 'Entwurf', color: 'gray' as const },
    published: { label: 'Veröffentlicht', color: 'success' as const },
    archived: { label: 'Archiviert', color: 'warning' as const }
  }

  const handleAction = (action: () => void) => {
    action()
    setShowActions(false)
  }

  return (
    <div className="bg-primary border border-secondary rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
      {/* Thumbnail */}
      <div className="aspect-video bg-gray-100 relative">
        {landingPage.thumbnail_url ? (
          <img 
            src={landingPage.thumbnail_url} 
            alt={landingPage.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <Skeleton className="w-full h-full" />
        )}
        
        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          <Badge 
            color={statusConfig[landingPage.status].color}
            type="pill"
          >
            {statusConfig[landingPage.status].label}
          </Badge>
        </div>

        {/* Actions Dropdown */}
        <div className="absolute top-3 right-3">
          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="w-8 h-8 rounded-lg bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors"
            >
              <DotsHorizontal className="w-4 h-4 text-gray-700" />
            </button>
            
            {showActions && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowActions(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                  <button
                    onClick={() => handleAction(() => onEdit(landingPage.id))}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Edit01 className="w-4 h-4" />
                    Bearbeiten
                  </button>
                  <button
                    onClick={() => handleAction(() => onPreview(landingPage.id))}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Vorschau
                  </button>
                  <button
                    onClick={() => handleAction(() => onDuplicate(landingPage.id))}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Copy01 className="w-4 h-4" />
                    Duplizieren
                  </button>
                  <button
                    onClick={() => handleAction(() => onArchive(landingPage.id))}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Archive className="w-4 h-4" />
                    Archivieren
                  </button>
                  <div className="border-t border-gray-200 my-1" />
                  <button
                    onClick={() => handleAction(() => onDelete(landingPage.id))}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                  >
                    <Trash02 className="w-4 h-4" />
                    Löschen
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title & URL */}
        <h3 className="text-md font-semibold text-primary mb-1 line-clamp-1">
          {landingPage.title}
        </h3>
        <p className="text-sm text-secondary mb-4">
          /{landingPage.slug}
        </p>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="flex items-center gap-1.5">
            <Eye className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-primary font-medium">
              {landingPage.views_count.toLocaleString('de-DE')}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users01 className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-primary font-medium">
              {landingPage.leads_count}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <TrendUp01 className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-primary font-medium">
              {landingPage.conversion_rate.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Last Updated */}
        <p className="text-xs text-secondary">
          Aktualisiert {formatDistanceToNow(new Date(landingPage.updated_at), {
            addSuffix: true,
            locale: de
          })}
        </p>
      </div>
    </div>
  )
}