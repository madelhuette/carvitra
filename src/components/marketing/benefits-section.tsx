"use client";

import { Clock, TrendUp02, Target03, X, CheckCircle, ArrowRight } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { useState } from "react";

const benefits = [
    {
        icon: Clock,
        title: "Für Verkäufer",
        subtitle: "Mehr Zeit für das Wesentliche",
        description: "Keine manuellen Landing Pages mehr erstellen. Konzentrieren Sie sich auf Kundengespräche und Verkaufsabschlüsse.",
        stats: [
            { value: "80%", label: "weniger Zeitaufwand" },
            { value: "5 Min", label: "pro Landing Page" }
        ]
    },
    {
        icon: TrendUp02,
        title: "Für Autohaus-Geschäftsführer",
        subtitle: "Professionelle Markenpräsenz",
        description: "Einheitliche, professionelle Darstellung aller Angebote. Keine externen Agenturen oder technische Abhängigkeiten.",
        stats: [
            { value: "100%", label: "Marken-Konsistenz" },
            { value: "24/7", label: "verfügbar" }
        ]
    },
    {
        icon: Target03,
        title: "Für Marketing-Verantwortliche", 
        subtitle: "Messbare Kampagnenerfolge",
        description: "Integrierte Google Ads, detaillierte Analytics und qualifizierte Leads für maximum ROI bei Werbeausgaben.",
        stats: [
            { value: "+45%", label: "mehr qualifizierte Leads" },
            { value: "3x", label: "bessere Conversion" }
        ]
    },
];

const comparisonData = {
    traditional: {
        title: "Traditionelle Methode",
        color: "text-error-600",
        bgColor: "bg-error-50 dark:bg-error-900/20",
        features: [
            { text: "Manuelle PDF-Bearbeitung", available: false },
            { text: "Tage bis zur Veröffentlichung", available: false },
            { text: "Externe Agentur-Kosten (€500-2000)", available: false },
            { text: "Inkonsistente Darstellung", available: false },
            { text: "Keine Lead-Nachverfolgung", available: false },
            { text: "Manuelle Datenübertragung", available: false },
            { text: "Hohe Fehlerquote", available: false },
            { text: "Keine Analytics", available: false }
        ]
    },
    carvitra: {
        title: "Mit carvitra",
        color: "text-success-600",
        bgColor: "bg-success-50 dark:bg-success-900/20",
        highlight: true,
        features: [
            { text: "Automatische KI-Extraktion", available: true },
            { text: "3 Minuten bis zur Veröffentlichung", available: true },
            { text: "Keine Agentur-Kosten", available: true },
            { text: "100% Marken-konsistent", available: true },
            { text: "Integriertes Lead-Management", available: true },
            { text: "Automatische Datenübertragung", available: true },
            { text: "99% Genauigkeit", available: true },
            { text: "Echtzeit-Analytics", available: true }
        ]
    }
};

export const BenefitsSection = () => {
    const [showComparison, setShowComparison] = useState(false);

    return (
        <div id="dealers" className="py-24 lg:py-32">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-2xl text-center">
                    <h2 className="text-display-md font-semibold tracking-tight text-primary lg:text-display-lg">
                        Vorteile für Ihr gesamtes Team
                    </h2>
                    <p className="mt-4 text-xl text-tertiary">
                        carvitra optimiert den Arbeitsablauf für alle Beteiligten in Ihrem Autohaus
                    </p>
                </div>
                
                <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 lg:max-w-none lg:grid-cols-3">
                    {benefits.map((benefit) => {
                        const Icon = benefit.icon;
                        return (
                            <div key={benefit.title} className="group relative overflow-hidden rounded-3xl border border-secondary bg-primary p-8 shadow-sm transition-all hover:shadow-lg">
                                {/* Hover Gradient */}
                                <div className="absolute inset-0 bg-gradient-to-br from-brand-50 to-transparent opacity-0 transition-opacity group-hover:opacity-100 dark:from-brand-900/10" />
                                
                                <div className="relative">
                                    <div className="mb-6">
                                        <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-secondary ring-1 ring-secondary_alt transition-transform group-hover:scale-110">
                                            <Icon className="size-6 text-brand-600" />
                                        </div>
                                    </div>
                                    
                                    <h3 className="text-xl font-semibold text-primary">
                                        {benefit.title}
                                    </h3>
                                    
                                    <p className="mt-1 text-sm font-medium text-brand-600">
                                        {benefit.subtitle}
                                    </p>
                                    
                                    <p className="mt-4 text-base text-tertiary">
                                        {benefit.description}
                                    </p>
                                    
                                    <div className="mt-6 flex gap-6">
                                        {benefit.stats.map((stat) => (
                                            <div key={stat.label}>
                                                <div className="text-2xl font-bold text-primary">
                                                    {stat.value}
                                                </div>
                                                <div className="text-xs text-quaternary">
                                                    {stat.label}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Comparison Toggle Button */}
                <div className="mt-16 text-center">
                    <Button
                        color="secondary"
                        size="lg"
                        onClick={() => setShowComparison(!showComparison)}
                        iconTrailing={ArrowRight}
                    >
                        {showComparison ? "Vergleich ausblenden" : "Vergleich ansehen: Traditionell vs. carvitra"}
                    </Button>
                </div>

                {/* Comparison Table */}
                {showComparison && (
                    <div className="mt-12 animate-in slide-in-from-top duration-500">
                        <div className="rounded-2xl border border-secondary bg-primary p-2">
                            <div className="grid gap-2 lg:grid-cols-2">
                                {/* Traditional Method */}
                                <div className={`rounded-xl p-6 ${comparisonData.traditional.bgColor}`}>
                                    <h4 className={`text-lg font-semibold ${comparisonData.traditional.color}`}>
                                        {comparisonData.traditional.title}
                                    </h4>
                                    <ul className="mt-6 space-y-3">
                                        {comparisonData.traditional.features.map((feature, index) => (
                                            <li key={index} className="flex items-start gap-2">
                                                <X className="mt-0.5 size-5 shrink-0 text-error-500" />
                                                <span className="text-sm text-secondary line-through">
                                                    {feature.text}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* CARVITRA Method */}
                                <div className={`rounded-xl p-6 ${comparisonData.carvitra.bgColor} ring-2 ring-success-200 dark:ring-success-800`}>
                                    <div className="flex items-center justify-between">
                                        <h4 className={`text-lg font-semibold ${comparisonData.carvitra.color}`}>
                                            Mit carvitra
                                        </h4>
                                        <span className="rounded-full bg-success-600 px-2 py-0.5 text-xs font-medium text-white">
                                            Empfohlen
                                        </span>
                                    </div>
                                    <ul className="mt-6 space-y-3">
                                        {comparisonData.carvitra.features.map((feature, index) => (
                                            <li key={index} className="flex items-start gap-2">
                                                <CheckCircle className="mt-0.5 size-5 shrink-0 text-success-500" />
                                                <span className="text-sm font-medium text-primary">
                                                    {feature.text}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {/* Summary */}
                            <div className="mt-6 rounded-xl bg-gradient-to-r from-brand-50 to-brand-100 dark:from-brand-900/20 dark:to-brand-800/20 p-6 text-center">
                                <h5 className="text-lg font-semibold text-primary">
                                    Das Ergebnis spricht für sich
                                </h5>
                                <div className="mt-4 grid grid-cols-3 gap-4">
                                    <div>
                                        <div className="text-3xl font-bold text-brand-600">95%</div>
                                        <div className="text-sm text-tertiary">Zeitersparnis</div>
                                    </div>
                                    <div>
                                        <div className="text-3xl font-bold text-brand-600">€5000+</div>
                                        <div className="text-sm text-tertiary">Ersparnis/Monat</div>
                                    </div>
                                    <div>
                                        <div className="text-3xl font-bold text-brand-600">10x</div>
                                        <div className="text-sm text-tertiary">Schneller</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                <div className="mt-16 rounded-3xl bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-900/20 dark:to-brand-800/20 p-8 text-center">
                    <h3 className="text-2xl font-semibold text-primary">
                        Bereit für den nächsten Schritt?
                    </h3>
                    <p className="mt-3 text-lg text-tertiary">
                        Testen Sie carvitra 14 Tage kostenlos und erstellen Sie Ihre erste Landing Page in wenigen Minuten.
                    </p>
                    <div className="mt-6">
                        <Button size="xl" color="primary" iconTrailing={ArrowRight}>
                            Jetzt kostenlos starten
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};