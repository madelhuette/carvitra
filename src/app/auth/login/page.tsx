"use client";

import { useState } from "react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async (data: { email: string; password: string; rememberMe: boolean }) => {
        setIsLoading(true);
        setError("");
        
        try {
            // Hier wird später die Supabase Auth Integration implementiert
            console.log("Login attempt:", data);
            
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Temporary: Show success message
            alert("Login erfolgreich! (Dummy-Implementation)");
            
            // Redirect to dashboard (later)
            // window.location.href = "/dashboard";
            
        } catch (err) {
            setError("Anmeldung fehlgeschlagen. Bitte überprüfen Sie Ihre Eingaben.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Willkommen zurück"
            subtitle="Melden Sie sich in Ihrem CARVITRA Konto an"
        >
            <LoginForm 
                onSubmit={handleLogin}
                isLoading={isLoading}
                error={error}
            />
        </AuthLayout>
    );
}