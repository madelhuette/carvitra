import { AuthLayout } from "@/components/auth/auth-layout";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
    return (
        <AuthLayout
            title="Willkommen zurück"
            subtitle="Melden Sie sich in Ihrem carvitra Konto an"
        >
            <LoginForm />
        </AuthLayout>
    );
}