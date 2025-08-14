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

interface LoginFormProps {
    onSubmit?: (data: LoginFormData) => void;
    isLoading?: boolean;
    error?: string;
}

export const LoginForm = ({ onSubmit, isLoading = false, error }: LoginFormProps) => {
    const [formData, setFormData] = useState<LoginFormData>({
        email: "",
        password: "",
        rememberMe: false,
    });
    const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

    const validateForm = () => {
        const errors: ValidationErrors = {};

        const emailError = validateEmail(formData.email);
        if (emailError) errors.email = emailError;

        const passwordError = validatePassword(formData.password);
        if (passwordError) errors.password = passwordError;

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        onSubmit?.(formData);
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
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        error={validationErrors.email}
                        disabled={isLoading}
                        className="mt-1"
                        autoComplete="email"
                    />
                </div>

                <PasswordInput
                    id="password"
                    label="Passwort"
                    value={formData.password}
                    onChange={(value) => setFormData({ ...formData, password: value })}
                    error={validationErrors.password}
                    disabled={isLoading}
                    placeholder="Ihr Passwort"
                    autoComplete="current-password"
                />

                <div className="flex items-center justify-between">
                    <Checkbox
                        id="remember-me"
                        checked={formData.rememberMe}
                        onChange={(checked) => setFormData({ ...formData, rememberMe: checked })}
                        disabled={isLoading}
                    >
                        Angemeldet bleiben
                    </Checkbox>
                    
                    <a 
                        href={AUTH_ROUTES.FORGOT_PASSWORD}
                        className="text-sm text-brand-600 hover:text-brand-700 font-medium"
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
                >
                    <LogIn01 className="size-4" />
                    Anmelden
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