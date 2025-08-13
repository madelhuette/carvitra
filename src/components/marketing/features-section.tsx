import { Lightbulb04, Globe01, Users01, CheckCircle } from "@untitledui/icons";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icons";

const features = [
    {
        icon: Lightbulb04,
        title: "KI-PDF-Extraktion",
        description: "Laden Sie einfach Ihr Fahrzeug-PDF hoch und unsere KI extrahiert automatisch alle relevanten Daten – von Fahrzeugdetails bis hin zu Finanzierungskonditionen.",
        benefits: ["Automatische Erkennung", "100% Genauigkeit", "Sekundenschnell"]
    },
    {
        icon: Globe01,
        title: "Landing Page Generator", 
        description: "Professionelle, SEO-optimierte Landing Pages werden automatisch aus Ihren Fahrzeugdaten generiert. Keine Programmierkenntnisse erforderlich.",
        benefits: ["SEO-optimiert", "Mobile-responsive", "Sofort live"]
    },
    {
        icon: Users01,
        title: "Lead-Management",
        description: "Qualifizierte Interessenten werden strukturiert erfasst und direkt an Ihre Verkäufer oder Ihr CRM-System weitergeleitet.",
        benefits: ["Strukturierte Leads", "CRM-Integration", "Automatische Weiterleitung"]
    },
];

export const FeaturesSection = () => {
    return (
        <div id="features" className="py-24 lg:py-32">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-2xl text-center">
                    <h2 className="text-display-md font-semibold tracking-tight text-primary lg:text-display-lg">
                        Alles was Sie für erfolgreiches Automotive-Marketing brauchen
                    </h2>
                    <p className="mt-4 text-xl text-tertiary">
                        Von der PDF-Analyse bis zur Lead-Generierung – unsere KI-Plattform automatisiert Ihren gesamten Marketing-Prozess.
                    </p>
                </div>
                
                <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 lg:max-w-none lg:grid-cols-3">
                    {features.map((feature) => (
                        <div key={feature.title} className="relative flex flex-col items-start">
                            <div className="mb-6">
                                <FeaturedIcon 
                                    icon={feature.icon} 
                                    size="lg" 
                                    theme="light"
                                    color="brand"
                                />
                            </div>
                            
                            <h3 className="text-lg font-semibold text-primary">
                                {feature.title}
                            </h3>
                            
                            <p className="mt-2 text-base text-tertiary">
                                {feature.description}
                            </p>
                            
                            <ul className="mt-4 space-y-2">
                                {feature.benefits.map((benefit) => (
                                    <li key={benefit} className="flex items-center text-sm text-secondary">
                                        <CheckCircle className="mr-2 size-4 text-success-500" />
                                        {benefit}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};