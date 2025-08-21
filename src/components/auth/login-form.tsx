"use client";

import { useState } from "react";
import { LogIn01, AlertCircle } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Label } from "@/components/base/input/label";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { SocialLogin } from "./social-login";
import { PasswordInput } from "./password-input";
import { validateEmail, validatePassword } from "@/utils/validation";
import { AUTH_ROUTES } from "@/constants/auth";
import type { LoginFormData, ValidationErrors } from "@/types/auth";
import { login } from "@/app/actions/auth";

export const LoginForm = () => {
    const [formData, setFormData] = useState<LoginFormData>({
        email: "",
        password: "",
        rememberMe: false,
    });
    const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const validateForm = () => {
        const errors: ValidationErrors = {};

        const emailError = validateEmail(formData.email);
        if (emailError) errors.email = emailError;

        const passwordError = validatePassword(formData.password);
        if (passwordError) errors.password = passwordError;

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Clear previous errors
        setError("");
        
        // Validate form on submit
        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        try {
            const result = await login(formData);
            
            if (result?.error) {
                setError(result.error);
                setIsLoading(false);
            }
            // Bei Erfolg wird automatisch zum Dashboard weitergeleitet
        } catch (err) {
            setError("Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut.");
            setIsLoading(false);
        }
    };

    // Real-time validation for email
    const handleEmailChange = (value: string) => {
        setFormData({ ...formData, email: value });
        // Clear email error when user starts typing
        if (validationErrors.email) {
            setValidationErrors({ ...validationErrors, email: undefined });
        }
    };

    // Real-time validation for password
    const handlePasswordChange = (value: string) => {
        setFormData({ ...formData, password: value });
        // Clear password error when user starts typing
        if (validationErrors.password) {
            setValidationErrors({ ...validationErrors, password: undefined });
        }
    };

    return (
        <div className="space-y-6">
            {/* Social Login */}
            <SocialLogin />
            
            {/* Divider */}
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-secondary" />
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="bg-primary px-2 text-tertiary">Oder mit E-Mail</span>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="flex items-center gap-2 rounded-lg bg-error-25 border border-error-300 px-3 py-2">
                    <AlertCircle className="size-4 text-error-600" />
                    <span className="text-sm text-error-700">{error}</span>
                </div>
            )}

            {/* Login Form */}
            <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                    <Label htmlFor="email">E-Mail Adresse</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="name@firma.de"
                        value={formData.email}
                        onChange={handleEmailChange}
                        error={validationErrors.email}
                        disabled={isLoading}
                        className="mt-1"
                        autoComplete="email"
                        required
                    />
                </div>

                <PasswordInput
                    id="password"
                    label="Passwort"
                    value={formData.password}
                    onChange={handlePasswordChange}
                    error={validationErrors.password}
                    disabled={isLoading}
                    placeholder="Ihr Passwort"
                    autoComplete="current-password"
                />

                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <Checkbox
                            id="remember-me"
                            label="Angemeldet bleiben"
                            checked={formData.rememberMe}
                            onChange={(checked) => setFormData({ ...formData, rememberMe: checked })}
                            disabled={isLoading}
                            className="cursor-pointer"
                        />
                    </div>
                    
                    <a 
                        href={AUTH_ROUTES.FORGOT_PASSWORD}
                        className="text-sm text-brand-600 hover:text-brand-700 font-medium transition-colors"
                    >
                        Passwort vergessen?
                    </a>
                </div>

                <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    disabled={isLoading}
                    loading={isLoading}
                    iconLeading={!isLoading ? LogIn01 : undefined}
                >
                    {isLoading ? "Anmeldung läuft..." : "Anmelden"}
                </Button>
            </form>

            {/* Register Link */}
            <div className="text-center">
                <span className="text-sm text-secondary">
                    Noch kein Konto?{" "}
                    <a 
                        href={AUTH_ROUTES.REGISTER}
                        className="text-brand-600 hover:text-brand-700 font-medium"
                    >
                        Jetzt registrieren
                    </a>
                </span>
            </div>
        </div>
    );
};