"use client";

import { useState } from "react";
import { 
  TrendUp02, 
  Users03, 
  File02, 
  CurrencyEuroCircle,
  ArrowRight,
  Home01,
  FileSearch01,
  Link03,
  Upload01
} from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { PdfLibrary } from "@/components/pdf/pdf-library";

interface DashboardContentProps {
  user: {
    email: string;
    firstName: string;
    lastName: string;
    companyName: string;
  };
}

type TabType = 'overview' | 'pdf-library' | 'offers' | 'landingpages';

export const DashboardContent = ({ user }: DashboardContentProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  
  const stats = [
    { name: 'Aktive Angebote', value: '0', icon: File02, change: '+0%', changeType: 'positive' },
    { name: 'Leads diese Woche', value: '0', icon: Users03, change: '+0%', changeType: 'neutral' },
    { name: 'Conversion Rate', value: '0%', icon: TrendUp02, change: '+0%', changeType: 'neutral' },
    { name: 'Umsatz diesen Monat', value: '€0', icon: CurrencyEuroCircle, change: '+0%', changeType: 'neutral' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'pdf-library':
        return <PdfLibrary />;
      
      case 'overview':
      default:
        return (
          <>
            {/* Welcome Section */}
            <div>
              <h2 className="text-2xl font-bold text-primary">Dashboard</h2>
              <p className="mt-1 text-secondary">
                Verwalten Sie Ihre Fahrzeugangebote und Leads an einem Ort.
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.name} className="rounded-lg border border-secondary bg-primary p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 dark:bg-brand-900/20">
                      <stat.icon className="size-5 text-brand-600 dark:text-brand-500" />
                    </div>
                    <span className={`text-sm font-medium ${
                      stat.changeType === 'positive' ? 'text-success-700 dark:text-success-500' : 
                      stat.changeType === 'negative' ? 'text-error-700 dark:text-error-500' : 
                      'text-tertiary'
                    }`}>
                      {stat.change}
                    </span>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-tertiary">{stat.name}</h3>
                    <p className="mt-1 text-2xl font-semibold text-primary">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="rounded-lg border border-secondary bg-primary p-6">
              <h3 className="text-lg font-semibold text-primary">Schnellaktionen</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-lg border border-secondary bg-primary p-4">
                  <h4 className="font-medium text-primary">PDF hochladen</h4>
                  <p className="mt-1 text-sm text-secondary">
                    Laden Sie ein Angebots-PDF hoch, um Landingpages zu erstellen.
                  </p>
                  <Button 
                    size="sm" 
                    className="mt-4"
                    iconTrailing={Upload01}
                    onClick={() => setActiveTab('pdf-library')}
                  >
                    PDF hochladen
                  </Button>
                </div>

                <div className="rounded-lg border border-secondary bg-primary p-4">
                  <h4 className="font-medium text-primary">Neues Angebot erstellen</h4>
                  <p className="mt-1 text-sm text-secondary">
                    Erstellen Sie in wenigen Minuten eine neue Landing Page für Ihr Fahrzeugangebot.
                  </p>
                  <Button 
                    size="sm" 
                    variant="secondary"
                    className="mt-4"
                    iconTrailing={ArrowRight}
                  >
                    Angebot erstellen
                  </Button>
                </div>
                
                <div className="rounded-lg border border-secondary bg-primary p-4">
                  <h4 className="font-medium text-primary">Leads verwalten</h4>
                  <p className="mt-1 text-sm text-secondary">
                    Sehen Sie alle Ihre Leads und kontaktieren Sie Interessenten.
                  </p>
                  <Button 
                    size="sm" 
                    variant="secondary"
                    className="mt-4"
                    iconTrailing={ArrowRight}
                  >
                    Zu den Leads
                  </Button>
                </div>
              </div>
            </div>

            {/* Recent Activity - Placeholder */}
            <div className="rounded-lg border border-secondary bg-primary p-6">
              <h3 className="text-lg font-semibold text-primary">Letzte Aktivitäten</h3>
              <div className="mt-4 flex items-center justify-center py-12 text-center">
                <div>
                  <File02 className="mx-auto size-12 text-tertiary" />
                  <p className="mt-2 text-sm text-secondary">Noch keine Aktivitäten vorhanden</p>
                  <p className="mt-1 text-sm text-tertiary">
                    Erstellen Sie Ihr erstes Angebot, um loszulegen.
                  </p>
                </div>
              </div>
            </div>
          </>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <Button
          size="sm"
          variant={activeTab === 'overview' ? 'primary' : 'ghost'}
          iconLeading={Home01}
          onClick={() => setActiveTab('overview')}
        >
          Übersicht
        </Button>
        <Button
          size="sm"
          variant={activeTab === 'pdf-library' ? 'primary' : 'ghost'}
          iconLeading={File02}
          onClick={() => setActiveTab('pdf-library')}
        >
          PDF-Bibliothek
        </Button>
        <Button
          size="sm"
          variant={activeTab === 'offers' ? 'primary' : 'ghost'}
          iconLeading={FileSearch01}
          onClick={() => setActiveTab('offers')}
          disabled
        >
          Angebote
        </Button>
        <Button
          size="sm"
          variant={activeTab === 'landingpages' ? 'primary' : 'ghost'}
          iconLeading={Link03}
          onClick={() => setActiveTab('landingpages')}
          disabled
        >
          Landingpages
        </Button>
      </div>

      {/* Content Area */}
      {renderContent()}
    </div>
  );
};