'use client'

import { useState } from 'react'
import { SearchLg, Grid01, List, Archive, Trash02 } from '@untitledui/icons'
import { Input } from '@/components/base/input/input'
import { Select } from '@/components/base/select/select'
import { Button } from '@/components/base/buttons/button'

interface LandingPagesToolbarProps {
  viewMode: 'grid' | 'list'
  onViewModeChange: (mode: 'grid' | 'list') => void
  searchQuery: string
  onSearchChange: (query: string) => void
  statusFilter: string
  onStatusFilterChange: (status: string) => void
  sortBy: string
  onSortByChange: (sort: string) => void
  selectedCount: number
  onBulkArchive?: () => void
  onBulkDelete?: () => void
}

export function LandingPagesToolbar({
  viewMode,
  onViewModeChange,
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortBy,
  onSortByChange,
  selectedCount,
  onBulkArchive,
  onBulkDelete
}: LandingPagesToolbarProps) {
  const statusOptions = [
    { value: 'all', label: 'Alle Status' },
    { value: 'draft', label: 'Entwurf' },
    { value: 'published', label: 'Veröffentlicht' },
    { value: 'archived', label: 'Archiviert' }
  ]

  const sortOptions = [
    { value: 'newest', label: 'Neueste zuerst' },
    { value: 'oldest', label: 'Älteste zuerst' },
    { value: 'most_views', label: 'Meiste Views' },
    { value: 'most_leads', label: 'Meiste Leads' },
    { value: 'best_conversion', label: 'Beste Conversion' },
    { value: 'alphabetical', label: 'Alphabetisch' }
  ]

  return (
    <div className="space-y-4 mb-6">
      {/* Bulk Actions Bar */}
      {selectedCount > 0 && (
        <div className="bg-brand-primary_alt/10 border border-brand-600/20 rounded-lg p-3 flex items-center justify-between">
          <span className="text-sm font-medium text-primary">
            {selectedCount} {selectedCount === 1 ? 'Landing Page' : 'Landing Pages'} ausgewählt
          </span>
          
          <div className="flex gap-2">
            {onBulkArchive && (
              <Button 
                size="sm" 
                color="secondary" 
                iconLeading={Archive}
                onClick={onBulkArchive}
              >
                Archivieren
              </Button>
            )}
            {onBulkDelete && (
              <Button 
                size="sm" 
                color="secondary-destructive" 
                iconLeading={Trash02}
                onClick={onBulkDelete}
              >
                Löschen
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Main Toolbar */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Landing Pages durchsuchen..."
            value={searchQuery}
            onChange={onSearchChange}
            iconLeading={SearchLg}
          />
        </div>

        {/* Filters and View Toggle */}
        <div className="flex flex-wrap gap-3">
          {/* Status Filter */}
          <Select
            value={statusFilter}
            onChange={onStatusFilterChange}
            options={statusOptions}
            placeholder="Status"
          />

          {/* Sort */}
          <Select
            value={sortBy}
            onChange={onSortByChange}
            options={sortOptions}
            placeholder="Sortierung"
          />

          {/* View Mode Toggle */}
          <div className="inline-flex rounded-lg border border-secondary bg-primary">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`px-3 py-2 rounded-l-lg transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-brand-primary_alt text-white' 
                  : 'text-secondary hover:bg-gray-50'
              }`}
              aria-label="Kachelansicht"
            >
              <Grid01 className="w-5 h-5" />
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={`px-3 py-2 rounded-r-lg transition-colors ${
                viewMode === 'list' 
                  ? 'bg-brand-primary_alt text-white' 
                  : 'text-secondary hover:bg-gray-50'
              }`}
              aria-label="Listenansicht"
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}