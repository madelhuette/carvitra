"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/base/buttons/button";
import { 
  User01, 
  Building07, 
  Users03, 
  Lock01
} from "@untitledui/icons";

interface SettingsTabsProps {
  activeTab: 'profile' | 'organization' | 'team' | 'security';
}

export function SettingsTabs({ activeTab }: SettingsTabsProps) {
  const router = useRouter();

  const tabs = [
    {
      key: 'profile',
      label: 'Persönliche Daten',
      icon: User01,
      href: '/dashboard/settings'
    },
    {
      key: 'organization',
      label: 'Organisation',
      icon: Building07,
      href: '/dashboard/settings/organization'
    },
    {
      key: 'team',
      label: 'Team',
      icon: Users03,
      href: '/dashboard/settings/team'
    },
    {
      key: 'security',
      label: 'Sicherheit',
      icon: Lock01,
      href: '/dashboard/settings/security'
    }
  ];

  return (
    <div className="flex gap-2 border-b border-secondary">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.key === activeTab;
        
        return (
          <button
            key={tab.key}
            onClick={() => router.push(tab.href)}
            className={`
              flex items-center gap-2 px-4 py-2.5 text-sm font-medium
              border-b-2 transition-colors
              ${isActive 
                ? 'border-brand text-brand' 
                : 'border-transparent text-tertiary hover:text-secondary hover:border-secondary'
              }
            `}
          >
            <Icon className="size-5" />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}