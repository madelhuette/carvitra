"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Tabs } from "@/components/application/tabs/tabs";
import { 
  User01, 
  Building07, 
  Users03, 
  Lock01,
  Settings01 
} from "@untitledui/icons";

interface SettingsLayoutProps {
  children: ReactNode;
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  const pathname = usePathname();
  
  // Determine active tab based on pathname
  const getActiveTab = () => {
    if (pathname.includes('/settings/organization')) return 'organization';
    if (pathname.includes('/settings/team')) return 'team';
    if (pathname.includes('/settings/security')) return 'security';
    return 'profile';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-secondary pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand/10">
            <Settings01 className="size-6 text-brand" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-primary">Einstellungen</h1>
            <p className="text-sm text-tertiary mt-1">
              Verwalten Sie Ihre persönlichen Daten, Organisation und Team
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <Tabs selectedKey={getActiveTab()} className="w-full">
        <Tabs.List 
          type="button-gray"
          size="md"
          fullWidth={false}
          className="mb-6"
        >
          <Tabs.Item 
            key="profile" 
            label="Persönliche Daten"
            onClick={() => window.location.href = '/dashboard/settings'}
          >
            <User01 className="size-5 mr-2" />
            Persönliche Daten
          </Tabs.Item>
          
          <Tabs.Item 
            key="organization" 
            label="Organisation"
            onClick={() => window.location.href = '/dashboard/settings/organization'}
          >
            <Building07 className="size-5 mr-2" />
            Organisation
          </Tabs.Item>
          
          <Tabs.Item 
            key="team" 
            label="Team"
            onClick={() => window.location.href = '/dashboard/settings/team'}
          >
            <Users03 className="size-5 mr-2" />
            Team
          </Tabs.Item>
          
          <Tabs.Item 
            key="security" 
            label="Sicherheit"
            onClick={() => window.location.href = '/dashboard/settings/security'}
          >
            <Lock01 className="size-5 mr-2" />
            Sicherheit
          </Tabs.Item>
        </Tabs.List>
      </Tabs>

      {/* Tab Content */}
      <div className="bg-primary rounded-lg border border-secondary">
        {children}
      </div>
    </div>
  );
}