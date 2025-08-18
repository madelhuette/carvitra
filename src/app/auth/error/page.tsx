"use client";

import { useSearchParams } from "next/navigation";
import { AuthLayout } from "@/components/auth/auth-layout";
import { Button } from "@/components/base/buttons/button";
import { AlertCircle, ArrowLeft } from "@untitledui/icons";

export default function ErrorPage() {
    const searchParams = useSearchParams();
    const message = searchParams.get("message") || "Ein Fehler ist aufgetreten";

    return (
        <AuthLayout
            title="Fehler aufgetreten"
            subtitle="Etwas ist schiefgelaufen"
        >
            <div className="space-y-6">
                <div className="flex flex-col items-center text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-error-50 dark:bg-error-900/20">
                        <AlertCircle className="size-6 text-error-600 dark:text-error-400" />
                    </div>
                    <h3 className="mt-4 text-lg font-medium text-primary">
                        {message}
                    </h3>
                    <p className="mt-2 text-sm text-secondary">
                        Bitte versuchen Sie es erneut oder kontaktieren Sie unseren Support, wenn das Problem weiterhin besteht.
                    </p>
                </div>

                <div className="space-y-3">
                    <Button
                        size="lg"
                        className="w-full"
                        iconLeading={ArrowLeft}
                        onClick={() => window.history.back()}
                    >
                        Zurück
                    </Button>
                    <Button
                        size="lg"
                        variant="secondary"
                        className="w-full"
                        onClick={() => window.location.href = "/"}
                    >
                        Zur Startseite
                    </Button>
                </div>
            </div>
        </AuthLayout>
    );
}