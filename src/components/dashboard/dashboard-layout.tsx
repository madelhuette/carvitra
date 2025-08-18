"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  LayoutGrid, 
  FileText02, 
  Users03, 
  Settings01, 
  HelpCircle,
  LogOut01,
  Menu,
  X,
  User01
} from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { logout } from "@/app/actions/auth";

interface DashboardLayoutProps {
  children: React.ReactNode;
  user: {
    email: string;
    firstName: string;
    lastName: string;
    companyName: string;
  };
}

export const DashboardLayout = ({ children, user }: DashboardLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
  };

  const navigation = [
    { name: 'Übersicht', href: '/dashboard', icon: LayoutGrid, current: true },
    { name: 'Angebote', href: '/dashboard/offers', icon: FileText02, current: false },
    { name: 'Leads', href: '/dashboard/leads', icon: Users03, current: false },
    { name: 'Einstellungen', href: '/dashboard/settings', icon: Settings01, current: false },
  ];

  return (
    <div className="min-h-screen bg-primary">
      {/* Mobile Sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${isSidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
        <div className="fixed left-0 top-0 h-full w-72 bg-primary border-r border-secondary">
          <div className="flex h-16 items-center justify-between px-6">
            <h2 className="text-lg font-semibold text-primary">CARVITRA</h2>
            <Button
              iconOnly
              variant="ghost"
              size="sm"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X className="size-5" />
            </Button>
          </div>
          <nav className="mt-6 px-3">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  item.current 
                    ? 'bg-secondary text-primary' 
                    : 'text-secondary hover:bg-secondary hover:text-primary'
                }`}
              >
                <item.icon className="size-5" />
                {item.name}
              </a>
            ))}
          </nav>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
        <div className="flex flex-1 flex-col border-r border-secondary bg-primary">
          <div className="flex h-16 items-center px-6">
            <h2 className="text-lg font-semibold text-primary">CARVITRA Dashboard</h2>
          </div>
          <nav className="mt-6 flex-1 px-3">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  item.current 
                    ? 'bg-secondary text-primary' 
                    : 'text-secondary hover:bg-secondary hover:text-primary'
                }`}
              >
                <item.icon className="size-5" />
                {item.name}
              </a>
            ))}
          </nav>
          <div className="border-t border-secondary p-4">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              iconLeading={HelpCircle}
            >
              Hilfe & Support
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-72">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-secondary bg-primary px-4 sm:px-6 lg:px-8">
          <Button
            iconOnly
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="size-5" />
          </Button>
          
          <div className="flex-1 px-4 lg:px-0">
            <h1 className="text-lg font-semibold text-primary">
              Willkommen zurück, {user.firstName || 'Nutzer'}!
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600">
                  <User01 className="size-4 text-white" />
                </div>
                <div className="text-sm">
                  <div className="font-medium text-primary">{user.firstName} {user.lastName}</div>
                  <div className="text-tertiary">{user.companyName}</div>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              iconLeading={LogOut01}
              onClick={handleLogout}
              loading={isLoggingOut}
              disabled={isLoggingOut}
            >
              Abmelden
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
};