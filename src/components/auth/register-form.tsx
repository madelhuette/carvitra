"use client";

import { useState } from "react";
import { UserPlus01, AlertCircle } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Label } from "@/components/base/input/label";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { SocialLogin } from "./social-login";
import { PasswordInput } from "./password-input";
import { validateEmail, validatePhone, validateRequired, validatePasswordMatch } from "@/utils/validation";
import { validatePasswordStrength } from "@/utils/password";
import { AUTH_ROUTES, DEFAULT_REGISTER_FORM } from "@/constants/auth";
import type { RegisterFormData, ValidationErrors } from "@/types/auth";

import { signup } from "@/app/actions/auth";
import { useRouter } from "next/navigation";

export const RegisterForm = () => {
    const [formData, setFormData] = useState<RegisterFormData>(DEFAULT_REGISTER_FORM);
    const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();


    const validateForm = () => {
        const errors: ValidationErrors = {};

        // Validate personal data
        const firstNameError = validateRequired(formData.firstName, "Vorname");
        if (firstNameError) errors.firstName = firstNameError;

        const lastNameError = validateRequired(formData.lastName, "Nachname");
        if (lastNameError) errors.lastName = lastNameError;

        const emailError = validateEmail(formData.email);
        if (emailError) errors.email = emailError;

        const companyError = validateRequired(formData.companyName, "Firmenname");
        if (companyError) errors.companyName = companyError;

        const phoneError = validatePhone(formData.phone);
        if (phoneError) errors.phone = phoneError;

        // Validate password
        if (!formData.password) {
            errors.password = "Passwort ist erforderlich";
        } else if (!validatePasswordStrength(formData.password)) {
            errors.password = "Passwort ist zu schwach";
        }

        const confirmError = validatePasswordMatch(formData.password, formData.confirmPassword);
        if (confirmError) errors.confirmPassword = confirmError;

        // Validate terms
        if (!formData.acceptTerms) {
            errors.acceptTerms = "Sie müssen die AGB akzeptieren";
        }

        if (!formData.acceptPrivacy) {
            errors.acceptPrivacy = "Sie müssen die Datenschutzerklärung akzeptieren";
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            const result = await signup(formData);
            
            if (result?.error) {
                setError(result.error);
                setIsLoading(false);
            }
            // Bei Erfolg wird automatisch zur Success-Page weitergeleitet
        } catch (err) {
            setError("Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.");
            setIsLoading(false);
        }
    };

    const updateFormData = (field: keyof RegisterFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };


    return (
        <div className="space-y-6">
            {/* Social Login */}
            <SocialLogin showText={false} />
            
            {/* Divider */}
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-secondary" />
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="bg-primary px-2 text-tertiary">Oder mit E-Mail registrieren</span>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="flex items-center gap-2 rounded-lg bg-error-25 border border-error-300 px-3 py-2">
                    <AlertCircle className="size-4 text-error-600" />
                    <span className="text-sm text-error-700">{error}</span>
                </div>
            )}

            {/* Registration Form */}
            <form className="space-y-6" onSubmit={handleSubmit}>
                {/* Personal Information */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="firstName">Vorname</Label>
                        <Input
                            id="firstName"
                            type="text"
                            placeholder="Max"
                            value={formData.firstName}
                            onChange={(value) => updateFormData("firstName", value)}
                            error={validationErrors.firstName}
                            disabled={isLoading}
                            className="mt-1"
                        />
                    </div>
                    <div>
                        <Label htmlFor="lastName">Nachname</Label>
                        <Input
                            id="lastName"
                            type="text"
                            placeholder="Mustermann"
                            value={formData.lastName}
                            onChange={(value) => updateFormData("lastName", value)}
                            error={validationErrors.lastName}
                            disabled={isLoading}
                            className="mt-1"
                        />
                    </div>
                </div>

                <div>
                    <Label htmlFor="email">E-Mail Adresse</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="max@autohaus-mustermann.de"
                        value={formData.email}
                        onChange={(value) => updateFormData("email", value)}
                        error={validationErrors.email}
                        disabled={isLoading}
                        className="mt-1"
                    />
                </div>

                {/* Company Information */}
                <div>
                    <Label htmlFor="companyName">Firmenname</Label>
                    <Input
                        id="companyName"
                        type="text"
                        placeholder="Autohaus Mustermann GmbH"
                        value={formData.companyName}
                        onChange={(value) => updateFormData("companyName", value)}
                        error={validationErrors.companyName}
                        disabled={isLoading}
                        className="mt-1"
                    />
                </div>

                <div>
                    <Label htmlFor="phone">Telefonnummer</Label>
                    <Input
                        id="phone"
                        type="tel"
                        placeholder="+49 30 12345678"
                        value={formData.phone}
                        onChange={(value) => updateFormData("phone", value)}
                        error={validationErrors.phone}
                        disabled={isLoading}
                        className="mt-1"
                    />
                </div>

                {/* Password */}
                <PasswordInput
                    id="password"
                    label="Passwort"
                    value={formData.password}
                    onChange={(value) => updateFormData("password", value)}
                    error={validationErrors.password}
                    disabled={isLoading}
                    placeholder="Mindestens 8 Zeichen"
                    showStrengthIndicator={true}
                    showRequirements={false}
                    autoComplete="new-password"
                />

                <PasswordInput
                    id="confirmPassword"
                    label="Passwort bestätigen"
                    value={formData.confirmPassword}
                    onChange={(value) => updateFormData("confirmPassword", value)}
                    error={validationErrors.confirmPassword}
                    disabled={isLoading}
                    placeholder="Passwort wiederholen"
                    autoComplete="new-password"
                />

                {/* Terms & Privacy */}
                <div className="space-y-3">
                    <div className="flex items-start gap-2">
                        <Checkbox
                            id="terms"
                            checked={formData.acceptTerms}
                            onChange={(checked: boolean) => updateFormData("acceptTerms", checked)}
                            disabled={isLoading}
                        />
                        <label htmlFor="terms" className="text-sm text-secondary leading-relaxed">
                            Ich akzeptiere die{" "}
                            <a href="/terms" className="text-brand-600 hover:text-brand-700 font-medium">
                                Allgemeinen Geschäftsbedingungen
                            </a>
                        </label>
                    </div>
                    {validationErrors.acceptTerms && (
                        <p className="text-sm text-error-600">
                            Sie müssen die AGB akzeptieren
                        </p>
                    )}

                    <div className="flex items-start gap-2">
                        <Checkbox
                            id="privacy"
                            checked={formData.acceptPrivacy}
                            onChange={(checked: boolean) => updateFormData("acceptPrivacy", checked)}
                            disabled={isLoading}
                        />
                        <label htmlFor="privacy" className="text-sm text-secondary leading-relaxed">
                            Ich akzeptiere die{" "}
                            <a href="/privacy" className="text-brand-600 hover:text-brand-700 font-medium">
                                Datenschutzerklärung
                            </a>
                        </label>
                    </div>
                    {validationErrors.acceptPrivacy && (
                        <p className="text-sm text-error-600">
                            Sie müssen die Datenschutzerklärung akzeptieren
                        </p>
                    )}

                    <div className="flex items-start gap-2">
                        <Checkbox
                            id="marketing"
                            checked={formData.acceptMarketing}
                            onChange={(checked: boolean) => updateFormData("acceptMarketing", checked)}
                            disabled={isLoading}
                        />
                        <label htmlFor="marketing" className="text-sm text-secondary leading-relaxed">
                            Ich möchte über Neuigkeiten und Angebote per E-Mail informiert werden (optional)
                        </label>
                    </div>
                </div>

                <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    disabled={isLoading}
                    loading={isLoading}
                    iconLeading={UserPlus01}
                >
                    Konto erstellen
                </Button>
            </form>

            {/* Login Link */}
            <div className="text-center">
                <span className="text-sm text-secondary">
                    Bereits ein Konto?{" "}
                    <a 
                        href={AUTH_ROUTES.LOGIN}
                        className="text-brand-600 hover:text-brand-700 font-medium"
                    >
                        Jetzt anmelden
                    </a>
                </span>
            </div>
        </div>
    );
};