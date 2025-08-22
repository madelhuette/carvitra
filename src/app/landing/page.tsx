"use client";

import { Header } from "@/components/marketing/header-navigation/components/header";

const landingNavItems = [
  { label: "So funktioniert's", href: "#how-it-works" },
  { label: "Für Händler", href: "#dealers" },
  { label: "Preise", href: "#pricing" },
  { label: "Beispiele", href: "#examples" },
  { label: "Partner", href: "#partners" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-primary">
      <Header items={landingNavItems} />
      
      {/* Hier werden später weitere Komponenten hinzugefügt */}
      <main className="flex flex-col items-center justify-center px-4 py-20">
        <div className="max-w-container text-center">
          <h1 className="text-4xl font-bold text-primary">
            Willkommen bei carvitra
          </h1>
          <p className="mt-4 text-lg text-secondary">
            Die Plattform für digitale Fahrzeugvermarktung
          </p>
        </div>
      </main>
    </div>
  );
}