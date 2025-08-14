"use client";

import { useState } from "react";
import { Mail01, ArrowLeft, AlertCircle, CheckCircle2 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Label } from "@/components/base/input/label";

interface ForgotPasswordFormProps {
    onSubmit?: (email: string) => void;
    onBack?: () => void;
    isLoading?: boolean;
    error?: string;
    success?: boolean;
}

export const ForgotPasswordForm = ({ 
    onSubmit, 
    onBack,
    isLoading = false, 
    error,
    success = false
}: ForgotPasswordFormProps) => {
    const [email, setEmail] = useState("");
    const [validationError, setValidationError] = useState("");

    const validateEmail = (email: string) => {
        if (!email.trim()) {
            return "E-Mail Adresse ist erforderlich";
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return "Bitte geben Sie eine gültige E-Mail Adresse ein";
        }
        return "";
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const emailError = validateEmail(email);
        if (emailError) {
            setValidationError(emailError);
            return;
        }

        setValidationError("");
        onSubmit?.(email);
    };

    if (success) {
        return (
            <div className="space-y-6">
                <div className="text-center">
                    <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-success-100">
                        <CheckCircle2 className="size-6 text-success-600" />
                    </div>
                    <div className="mt-4">
                        <h3 className="text-lg font-semibold text-primary">
                            E-Mail gesendet!
                        </h3>
                        <p className="mt-2 text-sm text-secondary">
                            Wir haben Ihnen einen Link zum Zurücksetzen Ihres Passworts an{" "}
                            <span className="font-medium text-primary">{email}</span> gesendet.
                        </p>
                    </div>
                </div>

                <div className="rounded-lg bg-gray-50 p-4">
                    <h4 className="text-sm font-medium text-primary mb-2">
                        Nächste Schritte:
                    </h4>
                    <ul className="space-y-1 text-sm text-secondary">
                        <li>• Überprüfen Sie Ihr E-Mail Postfach</li>
                        <li>• Schauen Sie auch im Spam-Ordner nach</li>
                        <li>• Klicken Sie auf den Link in der E-Mail</li>
                        <li>• Wählen Sie ein neues, sicheres Passwort</li>
                    </ul>
                </div>

                <div className="text-center">
                    <p className="text-sm text-secondary mb-4">
                        Keine E-Mail erhalten?
                    </p>
                    <Button
                        color="secondary"
                        size="lg"
                        onClick={() => onSubmit?.(email)}
                        disabled={isLoading}
                        loading={isLoading}
                        className="mb-3"
                    >
                        E-Mail erneut senden
                    </Button>
                    <br />
                    <Button
                        color="tertiary"
                        size="lg"
                        onClick={onBack}
                    >
                        <ArrowLeft className="size-4" />
                        Zurück zum Login
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="text-center">
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-brand-100">
                    <Mail01 className="size-6 text-brand-600" />
                </div>
                <div className="mt-4">
                    <h3 className="text-lg font-semibold text-primary">
                        Passwort vergessen?
                    </h3>
                    <p className="mt-2 text-sm text-secondary">
                        Kein Problem! Geben Sie Ihre E-Mail Adresse ein und wir senden Ihnen einen Link zum Zurücksetzen.
                    </p>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="flex items-center gap-2 rounded-lg bg-error-25 border border-error-300 px-3 py-2">
                    <AlertCircle className="size-4 text-error-600" />
                    <span className="text-sm text-error-700">{error}</span>
                </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                    <Label htmlFor="email">E-Mail Adresse</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="name@firma.de"
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            setValidationError("");
                        }}
                        error={validationError}
                        disabled={isLoading}
                        className="mt-1"
                        autoFocus
                    />
                    <p className="mt-1 text-sm text-tertiary">
                        Wir senden Ihnen einen sicheren Link zum Zurücksetzen Ihres Passworts.
                    </p>
                </div>

                <div className="space-y-3">
                    <Button
                        type="submit"
                        size="lg"
                        className="w-full"
                        disabled={isLoading}
                        loading={isLoading}
                    >
                        <Mail01 className="size-4" />
                        Link senden
                    </Button>

                    <Button
                        type="button"
                        color="secondary"
                        size="lg"
                        className="w-full"
                        onClick={onBack}
                        disabled={isLoading}
                    >
                        <ArrowLeft className="size-4" />
                        Zurück zum Login
                    </Button>
                </div>
            </form>

            <div className="text-center">
                <span className="text-sm text-secondary">
                    Noch kein Konto?{" "}
                    <a 
                        href="/auth/register"
                        className="text-brand-600 hover:text-brand-700 font-medium"
                    >
                        Jetzt registrieren
                    </a>
                </span>
            </div>
        </div>
    );
};