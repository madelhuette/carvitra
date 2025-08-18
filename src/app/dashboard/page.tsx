import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { DashboardContent } from '@/components/dashboard/dashboard-content'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  // Hole zusätzliche User-Daten aus dem Metadata
  const userData = {
    email: user.email || '',
    firstName: user.user_metadata?.first_name || '',
    lastName: user.user_metadata?.last_name || '',
    companyName: user.user_metadata?.company_name || '',
    phone: user.user_metadata?.phone || '',
  }

  return (
    <DashboardLayout user={userData}>
      <DashboardContent user={userData} />
    </DashboardLayout>
  )
}