"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthLayout } from "@/components/auth/auth-layout";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default function ResetPasswordPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [token, setToken] = useState("");
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        // Get token from URL parameters
        const tokenFromUrl = searchParams.get("token");
        if (tokenFromUrl) {
            setToken(tokenFromUrl);
        } else {
            // If no token, redirect to forgot password page
            setError("Ungültiger oder fehlender Reset-Token. Bitte fordern Sie einen neuen Link an.");
        }
    }, [searchParams]);

    const handleResetPassword = async (data: { password: string; confirmPassword: string; token: string }) => {
        setIsLoading(true);
        setError("");
        
        try {
            // Hier wird später die Supabase Auth Integration implementiert
            console.log("Reset password attempt:", { 
                token: data.token,
                passwordLength: data.password.length 
            });
            
            // Validate token (dummy validation)
            if (!data.token) {
                throw new Error("Token ist erforderlich");
            }
            
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Set success state
            setSuccess(true);
            
        } catch (err) {
            setError("Passwort konnte nicht zurückgesetzt werden. Bitte versuchen Sie es erneut oder fordern Sie einen neuen Link an.");
            console.error("Reset password error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Passwort zurücksetzen"
            subtitle="Wählen Sie ein sicheres neues Passwort für Ihr Konto"
        >
            <ResetPasswordForm 
                onSubmit={handleResetPassword}
                isLoading={isLoading}
                error={error}
                success={success}
                token={token}
            />
        </AuthLayout>
    );
}