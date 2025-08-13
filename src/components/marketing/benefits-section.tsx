import { Clock, TrendUp02, Target03 } from "@untitledui/icons";

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

export const BenefitsSection = () => {
    return (
        <div id="dealers" className="py-24 lg:py-32">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-2xl text-center">
                    <h2 className="text-display-md font-semibold tracking-tight text-primary lg:text-display-lg">
                        Vorteile für Ihr gesamtes Team
                    </h2>
                    <p className="mt-4 text-xl text-tertiary">
                        CARVITRA optimiert den Arbeitsablauf für alle Beteiligten in Ihrem Autohaus
                    </p>
                </div>
                
                <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 lg:max-w-none lg:grid-cols-3">
                    {benefits.map((benefit) => {
                        const Icon = benefit.icon;
                        return (
                            <div key={benefit.title} className="relative overflow-hidden rounded-3xl border border-secondary bg-primary p-8 shadow-sm">
                                <div className="mb-6">
                                    <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-secondary ring-1 ring-secondary_alt">
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
                        );
                    })}
                </div>
                
                <div className="mt-16 rounded-3xl bg-secondary p-8 text-center">
                    <h3 className="text-xl font-semibold text-primary">
                        Bereit für den nächsten Schritt?
                    </h3>
                    <p className="mt-2 text-base text-tertiary">
                        Testen Sie CARVITRA 14 Tage kostenlos und erstellen Sie Ihre erste Landing Page in wenigen Minuten.
                    </p>
                </div>
            </div>
        </div>
    );
};