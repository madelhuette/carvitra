import { AuthLayout } from "@/components/auth/auth-layout";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
    return (
        <AuthLayout
            title="Konto erstellen"
            subtitle="Erstellen Sie Ihr kostenloses carvitra Konto und starten Sie in wenigen Minuten"
        >
            <RegisterForm />
        </AuthLayout>
    );
}