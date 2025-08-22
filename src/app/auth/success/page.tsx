"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { AuthLayout } from "@/components/auth/auth-layout";
import { SuccessMessage } from "@/components/auth/success-message";

export default function SuccessPage() {
    const [isResendLoading, setIsResendLoading] = useState(false);
    const [successType, setSuccessType] = useState<"registration" | "verification" | "password-reset">("registration");
    const [email, setEmail] = useState("");
    const [userName, setUserName] = useState("");
    const searchParams = useSearchParams();

    useEffect(() => {
        // Get parameters from URL
        const type = searchParams.get("type") as "registration" | "verification" | "password-reset" || "registration";
        const emailParam = searchParams.get("email") || "";
        const nameParam = searchParams.get("name") || "";

        setSuccessType(type);
        setEmail(emailParam);
        setUserName(nameParam);
    }, [searchParams]);

    const handleResendEmail = async () => {
        if (!email) return;
        
        setIsResendLoading(true);
        
        try {
            const { resendConfirmationEmail } = await import("@/app/actions/auth");
            const result = await resendConfirmationEmail(email);
            
            if (result?.error) {
                alert(result.error);
            } else {
                alert("Bestätigungs-E-Mail wurde erneut gesendet!");
            }
        } catch (err) {
            console.error("Resend email error:", err);
            alert("E-Mail konnte nicht gesendet werden. Bitte versuchen Sie es später erneut.");
        } finally {
            setIsResendLoading(false);
        }
    };

    const handleContinue = () => {
        // Navigate to dashboard after verification
        window.location.href = "/dashboard";
    };

    const getLayoutProps = () => {
        switch (successType) {
            case "registration":
                return {
                    title: "Erfolgreich registriert!",
                    subtitle: "Ihr carvitra Konto wurde erstellt"
                };
            case "verification":
                return {
                    title: "E-Mail bestätigt!",
                    subtitle: "Ihr Konto ist nun vollständig aktiviert"
                };
            case "password-reset":
                return {
                    title: "Passwort geändert!",
                    subtitle: "Ihr neues Passwort ist jetzt aktiv"
                };
            default:
                return {
                    title: "Erfolgreich!",
                    subtitle: "Die Aktion wurde erfolgreich ausgeführt"
                };
        }
    };

    const layoutProps = getLayoutProps();

    return (
        <AuthLayout
            title={layoutProps.title}
            subtitle={layoutProps.subtitle}
            showBackgroundPattern={true}
        >
            <SuccessMessage 
                type={successType}
                email={email}
                userName={userName}
                onContinue={handleContinue}
                onResendEmail={handleResendEmail}
                isResendLoading={isResendLoading}
            />
        </AuthLayout>
    );
}