import { Check, ArrowRight } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";

const plans = [
    {
        name: "Starter",
        description: "Ideal für kleine Autohäuser und Einzelverkäufer",
        price: "49",
        period: "pro Monat",
        tokens: "20 Token",
        features: [
            "20 Landing Pages pro Monat",
            "KI-PDF-Extraktion",
            "Standard-Templates",
            "Basic Lead-Formular",
            "E-Mail Support"
        ],
        cta: "Kostenlos testen",
        highlight: false
    },
    {
        name: "Professional",
        description: "Für mittlere Autohäuser mit mehreren Verkäufern",
        price: "149",
        period: "pro Monat",
        tokens: "75 Token",
        features: [
            "75 Landing Pages pro Monat",
            "KI-PDF-Extraktion",
            "Premium-Templates",
            "Erweiterte Lead-Formulare",
            "CRM-Integration",
            "Google Ads Grundpaket",
            "Prioritäts-Support"
        ],
        cta: "Demo starten",
        highlight: true
    },
    {
        name: "Enterprise",
        description: "Für große Autohaus-Gruppen und Konzerne",
        price: "449",
        period: "pro Monat",
        tokens: "300 Token",
        features: [
            "300 Landing Pages pro Monat",
            "KI-PDF-Extraktion",
            "Custom Templates & Branding",
            "Erweiterte Lead-Formulare",
            "Multi-CRM Integration",
            "Google Ads Professional",
            "Dedicated Account Manager",
            "SLA-Garantie"
        ],
        cta: "Kontakt aufnehmen",
        highlight: false
    }
];

const additionalOptions = [
    { name: "Zusätzliche Token", price: "2,50", unit: "pro Token" },
    { name: "Google Ads Budget", price: "15%", unit: "Management-Fee" },
    { name: "Custom Integration", price: "Auf Anfrage", unit: "" },
];

export const PricingSection = () => {
    return (
        <div id="pricing" className="bg-secondary py-24 lg:py-32">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-2xl text-center">
                    <h2 className="text-display-md font-semibold tracking-tight text-primary lg:text-display-lg">
                        Transparente Token-Preise
                    </h2>
                    <p className="mt-4 text-xl text-tertiary">
                        Bezahlen Sie nur für das, was Sie nutzen. Keine versteckten Kosten, keine Überraschungen.
                    </p>
                </div>
                
                <div className="mx-auto mt-16 grid max-w-lg grid-cols-1 gap-8 lg:max-w-none lg:grid-cols-3">
                    {plans.map((plan) => (
                        <div 
                            key={plan.name}
                            className={`relative rounded-3xl p-8 shadow-sm ring-1 ${
                                plan.highlight 
                                    ? 'bg-primary ring-brand-200 shadow-lg' 
                                    : 'bg-primary ring-secondary_alt'
                            }`}
                        >
                            {plan.highlight && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                    <span className="rounded-full bg-brand-500 px-4 py-1 text-sm font-medium text-white">
                                        Beliebteste Option
                                    </span>
                                </div>
                            )}
                            
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-semibold text-primary">{plan.name}</h3>
                                <div className="text-right">
                                    <div className="flex items-baseline">
                                        <span className="text-4xl font-bold text-primary">€{plan.price}</span>
                                        <span className="ml-1 text-sm text-quaternary">/{plan.period}</span>
                                    </div>
                                    <div className="text-sm text-brand-600 font-medium">{plan.tokens}</div>
                                </div>
                            </div>
                            
                            <p className="mt-4 text-sm text-tertiary">{plan.description}</p>
                            
                            <ul className="mt-8 space-y-3">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex items-start">
                                        <Check className="mr-3 size-5 flex-shrink-0 text-success-500" />
                                        <span className="text-sm text-secondary">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                            
                            <Button
                                className="mt-8 w-full"
                                size="lg"
                                color={plan.highlight ? "primary" : "secondary"}
                                iconTrailing={ArrowRight}
                            >
                                {plan.cta}
                            </Button>
                        </div>
                    ))}
                </div>
                
                {/* Additional Options */}
                <div className="mx-auto mt-16 max-w-2xl">
                    <h3 className="text-center text-lg font-semibold text-primary">
                        Zusätzliche Optionen
                    </h3>
                    <div className="mt-8 divide-y divide-secondary_alt overflow-hidden rounded-2xl bg-primary ring-1 ring-secondary_alt">
                        {additionalOptions.map((option) => (
                            <div key={option.name} className="flex items-center justify-between px-6 py-4">
                                <span className="text-sm text-secondary">{option.name}</span>
                                <div className="text-right">
                                    <span className="text-lg font-semibold text-primary">{option.price}</span>
                                    {option.unit && <span className="ml-1 text-sm text-quaternary">{option.unit}</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                
                {/* ROI Calculator teaser */}
                <div className="mx-auto mt-16 max-w-2xl rounded-3xl bg-secondary p-8 text-center">
                    <h3 className="text-xl font-semibold text-primary">💰 ROI-Rechner</h3>
                    <p className="mt-2 text-base text-tertiary">
                        Ein Verkäufer spart durchschnittlich <span className="font-semibold text-brand-600">2 Stunden</span> pro Landing Page.
                        Bei einem Stundensatz von 35€ entspricht das <span className="font-semibold text-brand-600">70€ Ersparnis pro Angebot</span>.
                    </p>
                </div>
            </div>
        </div>
    );
};