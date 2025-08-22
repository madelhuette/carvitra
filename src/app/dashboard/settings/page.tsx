import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { SettingsTabs } from './settings-tabs';
import { ProfileContent } from './profile-content';

export default async function ProfileSettingsPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/auth/login');
  }

  // Hole zusätzliche User-Daten
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('first_name, last_name')
    .eq('user_id', user.id)
    .single();

  const userData = {
    email: user.email || '',
    firstName: profile?.first_name || user.user_metadata?.first_name || '',
    lastName: profile?.last_name || user.user_metadata?.last_name || '',
    companyName: user.user_metadata?.company_name || '',
  };

  return (
    <DashboardLayout user={userData}>
      <div className="space-y-6">
        {/* Header */}
        <div className="border-b border-secondary pb-5">
          <h1 className="text-2xl font-semibold text-primary">Einstellungen</h1>
          <p className="text-sm text-tertiary mt-1">
            Verwalten Sie Ihre persönlichen Daten, Organisation und Team
          </p>
        </div>

        {/* Tab Navigation */}
        <SettingsTabs activeTab="profile" />

        {/* Tab Content */}
        <div className="bg-primary rounded-lg border border-secondary">
          <ProfileContent />
        </div>
      </div>
    </DashboardLayout>
  );
}