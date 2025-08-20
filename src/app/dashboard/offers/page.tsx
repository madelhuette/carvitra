import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { PdfLibrary } from '@/components/pdf/pdf-library'

export default async function OffersPage() {
  const supabase = await createClient()

  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin')
  }

  // Get user profile data
  const { data: profile } = await supabase
    .from('users')
    .select('first_name, last_name, organization:organizations(name)')
    .eq('id', user.id)
    .single()

  const userData = {
    email: user.email || '',
    firstName: profile?.first_name || '',
    lastName: profile?.last_name || '',
    companyName: profile?.organization?.name || 'Unbekannte Organisation'
  }

  return (
    <DashboardLayout user={userData}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">Angebotsverwaltung</h1>
          <p className="mt-1 text-secondary">
            Verwalten Sie Ihre PDF-Angebote und erstellen Sie daraus professionelle Landingpages.
          </p>
        </div>
        <PdfLibrary />
      </div>
    </DashboardLayout>
  )
}