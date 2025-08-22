'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'

// Import all custom components
import { LandingPagesHeader } from './components/landing-pages-header'
import { LandingPageStats } from './components/landing-page-stats'
import { LandingPagesToolbar } from './components/landing-pages-toolbar'
import { LandingPagesGrid } from './components/landing-pages-grid'
import { LandingPagesTable } from './components/landing-pages-table'
import { EmptyStateLandingPages } from './components/empty-state-landing-pages'
import { OfferSelectionModal } from './components/offer-selection-modal'
import type { LandingPageData } from './components/landing-page-card'

export default function LandingpagesPage() {
  // User Data
  const [userData, setUserData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    companyName: 'Lade...'
  })
  
  // Landing Pages Data
  const [landingPages, setLandingPages] = useState<LandingPageData[]>([])
  const [loading, setLoading] = useState(true)
  
  // UI State
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [showOfferModal, setShowOfferModal] = useState(false)
  
  const router = useRouter()

  // Load user data and landing pages
  useEffect(() => {
    async function loadData() {
      const supabase = await createClient()
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/signin')
        return
      }

      // Get user profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('first_name, last_name, organization_id, organization:organizations(name)')
        .eq('user_id', user.id)
        .single()

      setUserData({
        email: user.email || '',
        firstName: profile?.first_name || '',
        lastName: profile?.last_name || '',
        companyName: profile?.organization?.name || 'Unbekannte Organisation'
      })

      // Load landing pages
      const { data: landingPagesData, error } = await supabase
        .from('landing_pages')
        .select('*')
        .eq('organization_id', profile?.organization_id)
        .order('created_at', { ascending: false })

      if (!error && landingPagesData) {
        // Transform data with mock metrics for now
        const transformedData: LandingPageData[] = landingPagesData.map(lp => ({
          id: lp.id,
          title: lp.title,
          slug: lp.slug,
          status: lp.status || 'draft',
          views_count: lp.views_count || 0,
          leads_count: lp.leads_count || 0,
          conversion_rate: lp.leads_count && lp.views_count 
            ? (lp.leads_count / lp.views_count) * 100 
            : 0,
          thumbnail_url: lp.og_image_url,
          updated_at: lp.updated_at
        }))
        setLandingPages(transformedData)
      }

      setLoading(false)
    }
    
    loadData()
  }, [router])

  // Filter and sort landing pages
  const filteredAndSortedPages = useMemo(() => {
    let filtered = [...landingPages]

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(lp => 
        lp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lp.slug.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(lp => lp.status === statusFilter)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        case 'oldest':
          return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
        case 'most_views':
          return b.views_count - a.views_count
        case 'most_leads':
          return b.leads_count - a.leads_count
        case 'best_conversion':
          return b.conversion_rate - a.conversion_rate
        case 'alphabetical':
          return a.title.localeCompare(b.title)
        default:
          return 0
      }
    })

    return filtered
  }, [landingPages, searchQuery, statusFilter, sortBy])

  // Calculate statistics
  const stats = useMemo(() => {
    const activePages = landingPages.filter(lp => lp.status === 'published')
    const totalViews = landingPages.reduce((sum, lp) => sum + lp.views_count, 0)
    const totalLeads = landingPages.reduce((sum, lp) => sum + lp.leads_count, 0)
    const avgConversion = totalViews > 0 ? (totalLeads / totalViews) * 100 : 0

    return {
      totalViews,
      totalLeads,
      avgConversion,
      activePages: activePages.length
    }
  }, [landingPages])

  // Handlers
  const handleCreateClick = () => {
    setShowOfferModal(true)
  }

  const handleSelectOffer = (offerId: string) => {
    // Navigate to wizard with selected offer
    router.push(`/dashboard/landingpages/wizard?offerId=${offerId}`)
  }

  const handleEdit = (id: string) => {
    router.push(`/dashboard/landingpages/${id}/edit`)
  }

  const handlePreview = (id: string) => {
    const landingPage = landingPages.find(lp => lp.id === id)
    if (landingPage) {
      window.open(`/landing/${landingPage.slug}`, '_blank')
    }
  }

  const handleDuplicate = async (id: string) => {
    // TODO: Implement duplication logic
    console.log('Duplicate:', id)
  }

  const handleArchive = async (id: string) => {
    // TODO: Implement archive logic
    console.log('Archive:', id)
  }

  const handleDelete = async (id: string) => {
    // TODO: Implement delete logic with confirmation
    console.log('Delete:', id)
  }

  const handleBulkArchive = async () => {
    // TODO: Implement bulk archive
    console.log('Bulk archive:', selectedIds)
  }

  const handleBulkDelete = async () => {
    // TODO: Implement bulk delete with confirmation
    console.log('Bulk delete:', selectedIds)
  }

  return (
    <DashboardLayout user={userData}>
      <div className="space-y-6">
        {/* Header */}
        <LandingPagesHeader
          totalCount={landingPages.length}
          onCreateClick={handleCreateClick}
        />

        {/* Stats (only show if landing pages exist) */}
        {landingPages.length > 0 && (
          <LandingPageStats stats={stats} />
        )}

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
          </div>
        ) : landingPages.length === 0 ? (
          <EmptyStateLandingPages
            onCreateClick={handleCreateClick}
            onSelectOfferClick={handleCreateClick}
          />
        ) : (
          <>
            {/* Toolbar */}
            <LandingPagesToolbar
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              sortBy={sortBy}
              onSortByChange={setSortBy}
              selectedCount={selectedIds.length}
              onBulkArchive={handleBulkArchive}
              onBulkDelete={handleBulkDelete}
            />

            {/* Grid or Table View */}
            {viewMode === 'grid' ? (
              <LandingPagesGrid
                landingPages={filteredAndSortedPages}
                onEdit={handleEdit}
                onPreview={handlePreview}
                onDuplicate={handleDuplicate}
                onArchive={handleArchive}
                onDelete={handleDelete}
              />
            ) : (
              <LandingPagesTable
                landingPages={filteredAndSortedPages}
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
                onEdit={handleEdit}
                onPreview={handlePreview}
                onDuplicate={handleDuplicate}
                onArchive={handleArchive}
                onDelete={handleDelete}
              />
            )}
          </>
        )}

        {/* Offer Selection Modal */}
        <OfferSelectionModal
          isOpen={showOfferModal}
          onClose={() => setShowOfferModal(false)}
          onSelectOffer={handleSelectOffer}
        />
      </div>
    </DashboardLayout>
  )
}