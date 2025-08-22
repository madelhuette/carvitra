'use client'

import { useState } from 'react'
import { Eye, Users01, TrendUp01, Edit01, Copy01, Archive, Trash02, DotsHorizontal } from '@untitledui/icons'
import { Badge } from '@/components/base/badges/badges'
import { Checkbox } from '@/components/base/checkbox/checkbox'
import { Skeleton } from '@/components/base/skeleton/skeleton'
import { formatDistanceToNow } from 'date-fns'
import { de } from 'date-fns/locale'
import type { LandingPageData } from './landing-page-card'

interface LandingPagesTableProps {
  landingPages: LandingPageData[]
  selectedIds: string[]
  onSelectionChange: (ids: string[]) => void
  onEdit: (id: string) => void
  onPreview: (id: string) => void
  onDuplicate: (id: string) => void
  onArchive: (id: string) => void
  onDelete: (id: string) => void
}

export function LandingPagesTable({
  landingPages,
  selectedIds,
  onSelectionChange,
  onEdit,
  onPreview,
  onDuplicate,
  onArchive,
  onDelete
}: LandingPagesTableProps) {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)

  const statusConfig = {
    draft: { label: 'Entwurf', color: 'gray' as const },
    published: { label: 'Veröffentlicht', color: 'success' as const },
    archived: { label: 'Archiviert', color: 'warning' as const }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(landingPages.map(lp => lp.id))
    } else {
      onSelectionChange([])
    }
  }

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedIds, id])
    } else {
      onSelectionChange(selectedIds.filter(selectedId => selectedId !== id))
    }
  }

  const handleAction = (action: () => void, id: string) => {
    action()
    setActiveDropdown(null)
  }

  return (
    <div className="bg-primary border border-secondary rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-secondary">
            <tr>
              <th className="w-12 px-4 py-3">
                <Checkbox
                  checked={selectedIds.length === landingPages.length && landingPages.length > 0}
                  onChange={handleSelectAll}
                  aria-label="Alle auswählen"
                />
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-secondary">
                Titel
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-secondary">
                Status
              </th>
              <th className="text-center px-4 py-3 text-sm font-medium text-secondary">
                Views
              </th>
              <th className="text-center px-4 py-3 text-sm font-medium text-secondary">
                Leads
              </th>
              <th className="text-center px-4 py-3 text-sm font-medium text-secondary">
                Conversion
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-secondary">
                Aktualisiert
              </th>
              <th className="w-12 px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {landingPages.map((landingPage) => (
              <tr 
                key={landingPage.id}
                className="border-b border-secondary hover:bg-gray-50 transition-colors"
              >
                <td className="px-4 py-4">
                  <Checkbox
                    checked={selectedIds.includes(landingPage.id)}
                    onChange={(checked) => handleSelectOne(landingPage.id, checked)}
                    aria-label={`${landingPage.title} auswählen`}
                  />
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-10 rounded overflow-hidden flex-shrink-0">
                      {landingPage.thumbnail_url ? (
                        <img 
                          src={landingPage.thumbnail_url} 
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Skeleton className="w-full h-full" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-primary line-clamp-1">
                        {landingPage.title}
                      </p>
                      <p className="text-xs text-secondary">
                        /{landingPage.slug}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <Badge 
                    color={statusConfig[landingPage.status].color}
                    type="pill"
                    size="sm"
                  >
                    {statusConfig[landingPage.status].label}
                  </Badge>
                </td>
                <td className="px-4 py-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Eye className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-primary">
                      {landingPage.views_count.toLocaleString('de-DE')}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Users01 className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-primary">
                      {landingPage.leads_count}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <TrendUp01 className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-primary">
                      {landingPage.conversion_rate.toFixed(1)}%
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className="text-sm text-secondary">
                    {formatDistanceToNow(new Date(landingPage.updated_at), {
                      addSuffix: true,
                      locale: de
                    })}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <div className="relative">
                    <button
                      onClick={() => setActiveDropdown(activeDropdown === landingPage.id ? null : landingPage.id)}
                      className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
                    >
                      <DotsHorizontal className="w-4 h-4 text-gray-600" />
                    </button>
                    
                    {activeDropdown === landingPage.id && (
                      <>
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={() => setActiveDropdown(null)}
                        />
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                          <button
                            onClick={() => handleAction(() => onEdit(landingPage.id), landingPage.id)}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Edit01 className="w-4 h-4" />
                            Bearbeiten
                          </button>
                          <button
                            onClick={() => handleAction(() => onPreview(landingPage.id), landingPage.id)}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            Vorschau
                          </button>
                          <button
                            onClick={() => handleAction(() => onDuplicate(landingPage.id), landingPage.id)}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Copy01 className="w-4 h-4" />
                            Duplizieren
                          </button>
                          <button
                            onClick={() => handleAction(() => onArchive(landingPage.id), landingPage.id)}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Archive className="w-4 h-4" />
                            Archivieren
                          </button>
                          <div className="border-t border-gray-200 my-1" />
                          <button
                            onClick={() => handleAction(() => onDelete(landingPage.id), landingPage.id)}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                          >
                            <Trash02 className="w-4 h-4" />
                            Löschen
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}