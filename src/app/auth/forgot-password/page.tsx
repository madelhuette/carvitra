"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthLayout } from "@/components/auth/auth-layout";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [submittedEmail, setSubmittedEmail] = useState("");
    const router = useRouter();

    const handleForgotPassword = async (email: string) => {
        setIsLoading(true);
        setError("");
        
        try {
            // Hier wird später die Supabase Auth Integration implementiert
            console.log("Forgot password for email:", email);
            
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Set success state
            setSubmittedEmail(email);
            setSuccess(true);
            
        } catch (err) {
            setError("E-Mail konnte nicht gesendet werden. Bitte versuchen Sie es erneut.");
            console.error("Forgot password error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleBackToLogin = () => {
        router.push("/auth/login");
    };

    return (
        <AuthLayout
            title="Passwort zurücksetzen"
            subtitle="Geben Sie Ihre E-Mail Adresse ein, um Ihr Passwort zurückzusetzen"
        >
            <ForgotPasswordForm 
                onSubmit={handleForgotPassword}
                onBack={handleBackToLogin}
                isLoading={isLoading}
                error={error}
                success={success}
            />
        </AuthLayout>
    );
}