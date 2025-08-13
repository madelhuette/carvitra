import { 
    Lightbulb04, 
    File02, 
    Globe01, 
    Users01, 
    LifeBuoy01,
    BookOpen01,
    CreditCard01,
    Settings01
} from "@untitledui/icons";
import { NavMenuItemLink } from "./base-components/nav-menu-item";

const platformItems = [
    {
        title: "KI-PDF-Extraktion",
        subtitle: "Automatische Erkennung aller Fahrzeugdaten aus PDF-Angeboten",
        href: "#features",
        Icon: Lightbulb04,
    },
    {
        title: "Landing Page Generator",
        subtitle: "Professionelle Fahrzeug-Seiten ohne technisches Wissen erstellen",
        href: "#features",
        Icon: Globe01,
    },
    {
        title: "Lead-Management",
        subtitle: "Qualifizierte Anfragen direkt an Verkäufer oder CRM weiterleiten",
        href: "#features",
        Icon: Users01,
    },
    {
        title: "Google Ads Integration",
        subtitle: "Automatische Werbekampagnen für maximale Sichtbarkeit",
        href: "#features",
        Icon: Settings01,
    },
];

const resourceItems = [
    {
        title: "Dokumentation",
        subtitle: "Komplette Anleitung zur CARVITRA Plattform",
        href: "#docs",
        Icon: File02,
    },
    {
        title: "Blog",
        subtitle: "Neueste Tipps für erfolgreiches Automotive Marketing",
        href: "#blog",
        Icon: BookOpen01,
    },
    {
        title: "Support",
        subtitle: "Unser Expertenteam hilft bei allen Fragen",
        href: "#support",
        Icon: LifeBuoy01,
    },
];

const pricingItems = [
    {
        title: "Token-Preise",
        subtitle: "Transparente Kosten pro Landing Page",
        href: "#pricing",
        Icon: CreditCard01,
    },
];

export const PlatformDropdown = () => {
    return (
        <div className="px-3 pb-2 md:max-w-96 md:p-0">
            <nav className="overflow-hidden rounded-2xl bg-primary py-2 shadow-xs ring-1 ring-secondary_alt md:p-2 md:shadow-lg">
                <ul className="flex flex-col gap-0.5">
                    {platformItems.map(({ title, subtitle, href, Icon }) => (
                        <li key={title}>
                            <NavMenuItemLink icon={Icon} title={title} subtitle={subtitle} href={href} />
                        </li>
                    ))}
                </ul>
            </nav>
        </div>
    );
};

export const ResourceDropdown = () => {
    return (
        <div className="px-3 pb-2 md:max-w-84 md:p-0">
            <nav className="overflow-hidden rounded-2xl bg-primary py-2 shadow-xs ring-1 ring-secondary_alt md:p-2 md:shadow-lg">
                <ul className="flex flex-col gap-0.5">
                    {resourceItems.map(({ title, subtitle, href, Icon }) => (
                        <li key={title}>
                            <NavMenuItemLink icon={Icon} title={title} subtitle={subtitle} href={href} />
                        </li>
                    ))}
                </ul>
            </nav>
        </div>
    );
};

export const PricingDropdown = () => {
    return (
        <div className="px-3 pb-2 md:max-w-72 md:p-0">
            <nav className="overflow-hidden rounded-2xl bg-primary py-2 shadow-xs ring-1 ring-secondary_alt md:p-2 md:shadow-lg">
                <ul className="flex flex-col gap-0.5">
                    {pricingItems.map(({ title, subtitle, href, Icon }) => (
                        <li key={title}>
                            <NavMenuItemLink icon={Icon} title={title} subtitle={subtitle} href={href} />
                        </li>
                    ))}
                </ul>
            </nav>
        </div>
    );
};