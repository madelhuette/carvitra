'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { EmptyState } from '@/components/application/empty-state/empty-state'
import { Users03, Download01, FilterLines } from '@untitledui/icons'
import { Button } from '@/components/base/buttons/button'

export default function LeadsPage() {
  const [userData, setUserData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    companyName: 'Lade...'
  })
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function loadUserData() {
      const {
        data: { user }
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/signin')
        return
      }

      // Get user profile data
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('first_name, last_name, organization:organizations(name)')
        .eq('user_id', user.id)
        .single()

      setUserData({
        email: user.email || '',
        firstName: profile?.first_name || '',
        lastName: profile?.last_name || '',
        companyName: profile?.organization?.name || 'Unbekannte Organisation'
      })
      setLoading(false)
    }
    
    loadUserData()
  }, [router, supabase])

  return (
    <DashboardLayout user={userData}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary">Lead-Verwaltung</h1>
            <p className="mt-1 text-secondary">
              Verwalten Sie alle Anfragen und Interessenten aus Ihren Landingpages.
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              size="md"
              variant="secondary"
              iconLeading={FilterLines}
              disabled
            >
              Filtern
            </Button>
            <Button
              size="md"
              variant="secondary"
              iconLeading={Download01}
              disabled
            >
              Exportieren
            </Button>
          </div>
        </div>
        
        <EmptyState size="lg">
          <EmptyState.FeaturedIcon icon={Users03} />
          <EmptyState.Content>
            <EmptyState.Title>Noch keine Leads</EmptyState.Title>
            <EmptyState.Description>
              Sobald Interessenten über Ihre Landingpages Anfragen stellen, erscheinen diese hier.
            </EmptyState.Description>
          </EmptyState.Content>
          <EmptyState.Footer>
            <Button
              size="lg"
              onClick={() => window.location.href = '/dashboard/landingpages'}
            >
              Landingpages verwalten
            </Button>
          </EmptyState.Footer>
        </EmptyState>
      </div>
    </DashboardLayout>
  )
}