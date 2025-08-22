import { CarvtraLogo } from "@/components/foundations/logo/carvitra-logo";
import { Button } from "@/components/base/buttons/button";

const footerSections = [
    {
        title: "Produkt",
        links: [
            { name: "Features", href: "#features" },
            { name: "Preise", href: "#pricing" },
            { name: "API", href: "#api" },
            { name: "Integrationen", href: "#integrations" },
            { name: "Changelog", href: "#changelog" }
        ]
    },
    {
        title: "Unternehmen",
        links: [
            { name: "Über uns", href: "#about" },
            { name: "Karriere", href: "#careers" },
            { name: "Presse", href: "#press" },
            { name: "Partner werden", href: "#partners" },
            { name: "Investoren", href: "#investors" }
        ]
    },
    {
        title: "Support",
        links: [
            { name: "Hilfe-Center", href: "#help" },
            { name: "Dokumentation", href: "#docs" },
            { name: "API-Docs", href: "#api-docs" },
            { name: "Status", href: "#status" },
            { name: "Community", href: "#community" }
        ]
    },
    {
        title: "Legal",
        links: [
            { name: "Datenschutz", href: "#privacy" },
            { name: "AGB", href: "#terms" },
            { name: "Impressum", href: "#imprint" },
            { name: "Cookie-Richtlinien", href: "#cookies" },
            { name: "DSGVO", href: "#gdpr" }
        ]
    }
];

export const FooterSection = () => {
    return (
        <footer className="bg-primary border-t border-secondary_alt">
            <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                {/* Main footer content */}
                <div className="grid grid-cols-2 gap-8 lg:grid-cols-6">
                    {/* Company info */}
                    <div className="col-span-2 lg:col-span-2">
                        <CarvtraLogo className="h-8" />
                        <p className="mt-4 text-sm text-tertiary lg:max-w-xs">
                            Die KI-gestützte Plattform für Autohändler. Von PDF-Angeboten zu professionellen Landing Pages in Minuten.
                        </p>
                        <div className="mt-6">
                            <Button size="sm" color="primary">
                                Kostenlos testen
                            </Button>
                        </div>
                    </div>
                    
                    {/* Footer sections */}
                    {footerSections.map((section) => (
                        <div key={section.title} className="col-span-1">
                            <h3 className="text-sm font-semibold text-primary">
                                {section.title}
                            </h3>
                            <ul className="mt-4 space-y-3">
                                {section.links.map((link) => (
                                    <li key={link.name}>
                                        <a 
                                            href={link.href}
                                            className="text-sm text-tertiary hover:text-secondary transition-colors duration-200"
                                        >
                                            {link.name}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
                
                {/* Newsletter signup */}
                <div className="mt-16 border-t border-secondary_alt pt-8">
                    <div className="flex flex-col items-center justify-between space-y-4 lg:flex-row lg:space-y-0">
                        <div className="flex flex-col items-center space-y-2 lg:flex-row lg:space-x-4 lg:space-y-0">
                            <h3 className="text-sm font-semibold text-primary">
                                carvitra Newsletter
                            </h3>
                            <p className="text-sm text-tertiary">
                                Bleiben Sie über neue Features und Automotive-Marketing-Tipps informiert
                            </p>
                        </div>
                        <div className="flex w-full max-w-md space-x-2 lg:w-auto">
                            <input
                                type="email"
                                placeholder="Ihre E-Mail-Adresse"
                                className="flex-1 rounded-lg border border-secondary_alt bg-secondary px-3 py-2 text-sm text-primary placeholder-quaternary focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 lg:w-64"
                            />
                            <Button size="sm" color="primary">
                                Abonnieren
                            </Button>
                        </div>
                    </div>
                </div>
                
                {/* Bottom footer */}
                <div className="mt-8 border-t border-secondary_alt pt-8">
                    <div className="flex flex-col items-center justify-between space-y-4 lg:flex-row lg:space-y-0">
                        <p className="text-xs text-quaternary">
                            © {new Date().getFullYear()} carvitra. Alle Rechte vorbehalten.
                        </p>
                        <div className="flex space-x-6">
                            <a href="#privacy" className="text-xs text-quaternary hover:text-tertiary">
                                Datenschutz
                            </a>
                            <a href="#terms" className="text-xs text-quaternary hover:text-tertiary">
                                Nutzungsbedingungen
                            </a>
                            <a href="#imprint" className="text-xs text-quaternary hover:text-tertiary">
                                Impressum
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};