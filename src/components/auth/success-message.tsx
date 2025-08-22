"use client";

import { CheckCircle, Mail01, Lightbulb04, ArrowRight } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";

interface SuccessMessageProps {
    type: "registration" | "verification" | "password-reset";
    email?: string;
    userName?: string;
    onContinue?: () => void;
    onResendEmail?: () => void;
    isResendLoading?: boolean;
}

export const SuccessMessage = ({ 
    type, 
    email, 
    userName,
    onContinue,
    onResendEmail,
    isResendLoading = false
}: SuccessMessageProps) => {
    const getContent = () => {
        switch (type) {
            case "registration":
                return {
                    icon: <CheckCircle className="size-8 text-success-600" />,
                    bgColor: "bg-success-100",
                    title: `Willkommen bei carvitra${userName ? `, ${userName}` : ""}!`,
                    subtitle: "Ihre Registrierung war erfolgreich.",
                    description: `Wir haben Ihnen eine Bestätigungs-E-Mail an ${email || "Ihre E-Mail Adresse"} gesendet.`,
                    tips: [
                        "Überprüfen Sie Ihr E-Mail Postfach",
                        "Schauen Sie auch im Spam-Ordner nach",
                        "Klicken Sie auf den Bestätigungslink",
                        "Beginnen Sie mit der Erstellung Ihrer ersten Landing Page"
                    ]
                };
            case "verification":
                return {
                    icon: <Mail01 className="size-8 text-brand-600" />,
                    bgColor: "bg-brand-100",
                    title: "E-Mail erfolgreich bestätigt!",
                    subtitle: "Ihr Konto ist nun vollständig aktiviert.",
                    description: "Sie können jetzt alle Funktionen von carvitra nutzen.",
                    tips: [
                        "Laden Sie Ihr erstes PDF-Angebot hoch",
                        "Lassen Sie die KI Ihre Fahrzeugdaten extrahieren",
                        "Erstellen Sie professionelle Landing Pages",
                        "Starten Sie Ihre ersten Werbekampagnen"
                    ]
                };
            case "password-reset":
                return {
                    icon: <CheckCircle className="size-8 text-success-600" />,
                    bgColor: "bg-success-100",
                    title: "Passwort erfolgreich geändert!",
                    subtitle: "Ihr neues Passwort ist jetzt aktiv.",
                    description: "Sie können sich nun mit Ihrem neuen Passwort anmelden.",
                    tips: [
                        "Merken Sie sich Ihr neues Passwort",
                        "Verwenden Sie einen Passwort-Manager",
                        "Loggen Sie sich auf allen Geräten neu ein",
                        "Überprüfen Sie Ihre Kontoeinstellungen"
                    ]
                };
            default:
                return {
                    icon: <CheckCircle className="size-8 text-success-600" />,
                    bgColor: "bg-success-100",
                    title: "Erfolgreich!",
                    subtitle: "Die Aktion wurde erfolgreich ausgeführt.",
                    description: "",
                    tips: []
                };
        }
    };

    const content = getContent();

    return (
        <div className="space-y-8">
            {/* Success Icon & Message */}
            <div className="text-center">
                <div className={`mx-auto flex size-16 items-center justify-center rounded-full ${content.bgColor}`}>
                    {content.icon}
                </div>
                <div className="mt-6">
                    <h1 className="text-2xl font-bold text-primary">
                        {content.title}
                    </h1>
                    <p className="mt-2 text-lg text-secondary">
                        {content.subtitle}
                    </p>
                    {content.description && (
                        <p className="mt-2 text-sm text-tertiary">
                            {content.description}
                        </p>
                    )}
                </div>
            </div>

            {/* Next Steps */}
            {content.tips.length > 0 && (
                <div className="rounded-lg bg-secondary p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Lightbulb04 className="size-5 text-brand-600" />
                        <h3 className="text-lg font-semibold text-primary">
                            Nächste Schritte
                        </h3>
                    </div>
                    <ul className="space-y-2">
                        {content.tips.map((tip, index) => (
                            <li key={index} className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-6 h-6 bg-brand-primary rounded-full flex items-center justify-center mt-0.5">
                                    <span className="text-xs font-medium text-brand-700">
                                        {index + 1}
                                    </span>
                                </div>
                                <span className="text-sm text-secondary">
                                    {tip}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-4">
                {type === "registration" && (
                    <>
                        <Button
                            size="lg"
                            className="w-full"
                            onClick={onContinue}
                            href="/dashboard"
                            iconTrailing={ArrowRight}
                        >
                            Zur Plattform
                        </Button>
                        
                        <div className="text-center">
                            <p className="text-sm text-secondary mb-3">
                                Keine Bestätigungs-E-Mail erhalten?
                            </p>
                            <Button
                                color="secondary"
                                size="md"
                                onClick={onResendEmail}
                                disabled={isResendLoading}
                                loading={isResendLoading}
                                iconLeading={Mail01}
                            >
                                E-Mail erneut senden
                            </Button>
                        </div>
                    </>
                )}

                {type === "verification" && (
                    <Button
                        size="lg"
                        className="w-full"
                        onClick={onContinue}
                        href="/dashboard"
                        iconTrailing={ArrowRight}
                    >
                        Jetzt starten
                    </Button>
                )}

                {type === "password-reset" && (
                    <Button
                        size="lg"
                        className="w-full"
                        href="/auth/login"
                        iconTrailing={ArrowRight}
                    >
                        Zur Anmeldung
                    </Button>
                )}
            </div>

            {/* Support Link */}
            <div className="text-center border-t border-border pt-6">
                <p className="text-sm text-secondary">
                    Haben Sie Fragen oder benötigen Hilfe?{" "}
                    <a 
                        href="/support" 
                        className="text-brand-600 hover:text-brand-700 font-medium"
                    >
                        Kontaktieren Sie unseren Support
                    </a>
                </p>
            </div>
        </div>
    );
};