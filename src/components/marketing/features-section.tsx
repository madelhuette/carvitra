import { Lightbulb04, Globe01, Users01, CheckCircle, ArrowRight, FileX02, Target05, BarChart07, File02, Star01, Tool01, Rocket01, Mail01 } from "@untitledui/icons";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icons";
import { Badge } from "@/components/base/badges/badges";

const features = [
    {
        icon: Lightbulb04,
        title: "KI-PDF-Extraktion",
        description: "Laden Sie einfach Ihr Fahrzeug-PDF hoch und unsere KI extrahiert automatisch alle relevanten Daten – von Fahrzeugdetails bis hin zu Finanzierungskonditionen.",
        benefits: ["Automatische Erkennung", "100% Genauigkeit", "Sekundenschnell"],
        badge: "Powered by Claude AI",
        highlight: true,
        preview: {
            before: "Unstrukturiertes PDF",
            after: "Strukturierte Daten",
            beforeIcon: File02,
            afterIcon: Star01
        }
    },
    {
        icon: Globe01,
        title: "Landing Page Generator", 
        description: "Professionelle, SEO-optimierte Landing Pages werden automatisch aus Ihren Fahrzeugdaten generiert. Keine Programmierkenntnisse erforderlich.",
        benefits: ["SEO-optimiert", "Mobile-responsive", "Sofort live"],
        badge: "Automatisch",
        preview: {
            before: "Manuelle Erstellung",
            after: "Fertige Landing Page",
            beforeIcon: Tool01,
            afterIcon: Rocket01
        }
    },
    {
        icon: Users01,
        title: "Lead-Management",
        description: "Qualifizierte Interessenten werden strukturiert erfasst und direkt an Ihre Verkäufer oder Ihr CRM-System weitergeleitet.",
        benefits: ["Strukturierte Leads", "CRM-Integration", "Automatische Weiterleitung"],
        badge: "24/7 Aktiv",
        preview: {
            before: "Unorganisierte E-Mails",
            after: "Strukturierte Leads",
            beforeIcon: Mail01,
            afterIcon: BarChart07
        }
    },
];

const additionalFeatures = [
    { icon: Target05, title: "Google Ads Integration", description: "Automatisierte Kampagnen" },
    { icon: BarChart07, title: "Analytics Dashboard", description: "Echtzeit-Statistiken" },
    { icon: FileX02, title: "DSGVO-konform", description: "100% Datenschutz" },
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
                        <div 
                            key={feature.title} 
                            className={`group relative flex flex-col rounded-2xl border ${
                                feature.highlight 
                                    ? 'border-brand-300 bg-brand-50 dark:border-brand-700 dark:bg-brand-900/10' 
                                    : 'border-secondary bg-primary'
                            } p-8 transition-all hover:shadow-lg hover:border-brand-400`}
                        >
                            {/* Badge */}
                            {feature.badge && (
                                <div className="absolute -top-3 right-6">
                                    <Badge size="sm" color={feature.highlight ? "brand" : "gray"}>
                                        {feature.badge}
                                    </Badge>
                                </div>
                            )}
                            
                            <div className="mb-6">
                                <FeaturedIcon 
                                    icon={feature.icon} 
                                    size="lg" 
                                    theme="light"
                                    color={feature.highlight ? "brand" : "gray"}
                                />
                            </div>
                            
                            <h3 className="text-lg font-semibold text-primary">
                                {feature.title}
                            </h3>
                            
                            <p className="mt-2 text-base text-tertiary">
                                {feature.description}
                            </p>
                            
                            {/* Preview Box */}
                            <div className="mt-4 rounded-lg bg-secondary p-3">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="flex items-center gap-1 text-quaternary">
                                        <feature.preview.beforeIcon className="size-3" />
                                        {feature.preview.before}
                                    </span>
                                    <ArrowRight className="size-4 text-brand-600" />
                                    <span className="flex items-center gap-1 font-medium text-brand-600">
                                        <feature.preview.afterIcon className="size-3" />
                                        {feature.preview.after}
                                    </span>
                                </div>
                            </div>
                            
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
                
                {/* Additional Features Grid */}
                <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {additionalFeatures.map((feature) => {
                        const Icon = feature.icon;
                        return (
                            <div key={feature.title} className="flex items-center gap-3 rounded-xl bg-secondary p-4">
                                <Icon className="size-5 text-brand-600" />
                                <div>
                                    <div className="text-sm font-medium text-primary">{feature.title}</div>
                                    <div className="text-xs text-tertiary">{feature.description}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};