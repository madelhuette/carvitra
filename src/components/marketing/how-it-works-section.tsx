import { Upload01, Lightbulb04, Settings01, Users01 } from "@untitledui/icons";

const steps = [
    {
        step: "01",
        icon: Upload01,
        title: "PDF-Angebot hochladen",
        description: "Laden Sie einfach Ihr Fahrzeug-PDF mit allen Angebotsdaten in unsere sichere Plattform hoch.",
    },
    {
        step: "02", 
        icon: Lightbulb04,
        title: "KI-Datenextraktion",
        description: "Unsere KI analysiert das PDF und extrahiert automatisch alle Fahrzeug-, Preis- und Finanzierungsdaten.",
    },
    {
        step: "03",
        icon: Settings01,
        title: "Landing Page anpassen",
        description: "Überprüfen Sie die extrahierten Daten, laden Sie Bilder hoch und passen Sie die Seite nach Ihren Wünschen an.",
    },
    {
        step: "04",
        icon: Users01,
        title: "Leads empfangen",
        description: "Ihre professionelle Landing Page ist live und qualifizierte Interessenten werden direkt an Sie weitergeleitet.",
    },
];

export const HowItWorksSection = () => {
    return (
        <div className="bg-secondary py-24 lg:py-32">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-2xl text-center">
                    <h2 className="text-display-md font-semibold tracking-tight text-primary lg:text-display-lg">
                        So einfach funktioniert es
                    </h2>
                    <p className="mt-4 text-xl text-tertiary">
                        In nur 4 Schritten von Ihrem PDF-Angebot zur professionellen Landing Page
                    </p>
                </div>
                
                <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 lg:max-w-none lg:grid-cols-4">
                    {steps.map((step, index) => {
                        const Icon = step.icon;
                        return (
                            <div key={step.step} className="relative flex flex-col items-center text-center">
                                {/* Step number */}
                                <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-brand-50 text-lg font-semibold text-brand-600 ring-4 ring-brand-100">
                                    {step.step}
                                </div>
                                
                                {/* Icon */}
                                <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary shadow-sm ring-1 ring-secondary_alt">
                                    <Icon className="size-7 text-brand-600" />
                                </div>
                                
                                {/* Content */}
                                <h3 className="text-lg font-semibold text-primary">
                                    {step.title}
                                </h3>
                                
                                <p className="mt-2 text-sm text-tertiary">
                                    {step.description}
                                </p>
                                
                                {/* Connecting line (except for last item) */}
                                {index < steps.length - 1 && (
                                    <div className="absolute left-1/2 top-6 hidden h-px w-full translate-x-1/2 bg-brand-200 lg:block" 
                                         style={{ zIndex: -1 }} />
                                )}
                            </div>
                        );
                    })}
                </div>
                
                <div className="mt-16 text-center">
                    <p className="text-sm text-quaternary">
                        ⏱️ Durchschnittliche Erstellungszeit: <span className="font-semibold text-brand-600">3-5 Minuten</span>
                    </p>
                </div>
            </div>
        </div>
    );
};