"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthLayout } from "@/components/auth/auth-layout";
import { RegisterForm } from "@/components/auth/register-form";

interface RegisterFormData {
    userType: "dealer" | "salesperson";
    firstName: string;
    lastName: string;
    email: string;
    companyName: string;
    phone: string;
    password: string;
    confirmPassword: string;
    acceptTerms: boolean;
    acceptPrivacy: boolean;
    acceptMarketing: boolean;
}

export default function RegisterPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleRegister = async (data: RegisterFormData) => {
        setIsLoading(true);
        setError("");
        
        try {
            // Hier wird später die Supabase Auth Integration implementiert
            console.log("Registration attempt:", data);
            
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Temporary: Show success message and redirect
            console.log("Registration successful!");
            
            // Redirect to success page
            router.push("/auth/success?type=registration&email=" + encodeURIComponent(data.email) + "&name=" + encodeURIComponent(data.firstName));
            
        } catch (err) {
            setError("Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.");
            console.error("Registration error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Konto erstellen"
            subtitle="Erstellen Sie Ihr kostenloses CARVITRA Konto und starten Sie in wenigen Minuten"
        >
            <RegisterForm 
                onSubmit={handleRegister}
                isLoading={isLoading}
                error={error}
            />
        </AuthLayout>
    );
}