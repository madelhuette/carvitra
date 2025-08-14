"use client";

import { useState } from "react";
import { Lock01, AlertCircle, CheckCircle2 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { PasswordInput } from "./password-input";
import { 
    getPasswordStrength, 
    validatePasswordStrength 
} from "@/utils/password";
import { validatePasswordMatch } from "@/utils/validation";
import { AUTH_ROUTES, MIN_PASSWORD_STRENGTH } from "@/constants/auth";
import type { ResetPasswordFormData, ValidationErrors } from "@/types/auth";

interface ResetPasswordFormProps {
    onSubmit?: (data: ResetPasswordFormData) => void;
    isLoading?: boolean;
    error?: string;
    success?: boolean;
    token?: string;
}

export const ResetPasswordForm = ({ 
    onSubmit, 
    isLoading = false, 
    error,
    success = false,
    token = ""
}: ResetPasswordFormProps) => {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});


    const validateForm = () => {
        const errors: ValidationErrors = {};

        if (!password) {
            errors.password = "Neues Passwort ist erforderlich";
        } else if (!validatePasswordStrength(password)) {
            errors.password = "Passwort ist zu schwach";
        }

        const confirmError = validatePasswordMatch(password, confirmPassword);
        if (confirmError) errors.confirmPassword = confirmError;

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        onSubmit?.({ password, confirmPassword, token });
    };

    const passwordStrength = getPasswordStrength(password);

    if (success) {
        return (
            <div className="space-y-6">
                <div className="text-center">
                    <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-success-100">
                        <CheckCircle2 className="size-6 text-success-600" />
                    </div>
                    <div className="mt-4">
                        <h3 className="text-lg font-semibold text-primary">
                            Passwort erfolgreich zurückgesetzt!
                        </h3>
                        <p className="mt-2 text-sm text-secondary">
                            Ihr Passwort wurde erfolgreich geändert. Sie können sich nun mit Ihrem neuen Passwort anmelden.
                        </p>
                    </div>
                </div>

                <Button
                    size="lg"
                    className="w-full"
                    href={AUTH_ROUTES.LOGIN}
                >
                    Zur Anmeldung
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="text-center">
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-brand-100">
                    <Lock01 className="size-6 text-brand-600" />
                </div>
                <div className="mt-4">
                    <h3 className="text-lg font-semibold text-primary">
                        Neues Passwort festlegen
                    </h3>
                    <p className="mt-2 text-sm text-secondary">
                        Wählen Sie ein sicheres neues Passwort für Ihr Konto.
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

            <form className="space-y-6" onSubmit={handleSubmit}>
                <PasswordInput
                    id="password"
                    label="Neues Passwort"
                    value={password}
                    onChange={setPassword}
                    error={validationErrors.password}
                    disabled={isLoading}
                    placeholder="Geben Sie Ihr neues Passwort ein"
                    showStrengthIndicator={true}
                    showRequirements={true}
                    autoComplete="new-password"
                />

                <div>
                    <PasswordInput
                        id="confirmPassword"
                        label="Passwort bestätigen"
                        value={confirmPassword}
                        onChange={setConfirmPassword}
                        error={validationErrors.confirmPassword}
                        disabled={isLoading}
                        placeholder="Passwort wiederholen"
                        autoComplete="new-password"
                    />
                    {confirmPassword && password === confirmPassword && (
                        <div className="mt-1 flex items-center gap-2">
                            <CheckCircle2 className="size-4 text-success-600" />
                            <span className="text-sm text-success-700">Passwörter stimmen überein</span>
                        </div>
                    )}
                </div>

                <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    disabled={isLoading || passwordStrength < MIN_PASSWORD_STRENGTH}
                    loading={isLoading}
                >
                    <Lock01 className="size-4" />
                    Passwort zurücksetzen
                </Button>
            </form>

            <div className="text-center">
                <span className="text-sm text-secondary">
                    Zurück zur{" "}
                    <a 
                        href={AUTH_ROUTES.LOGIN}
                        className="text-brand-600 hover:text-brand-700 font-medium"
                    >
                        Anmeldung
                    </a>
                </span>
            </div>
        </div>
    );
};