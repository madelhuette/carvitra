"use client";

import type { ReactNode } from "react";
import { CarvtraLogo } from "@/components/foundations/logo/carvitra-logo";

interface AuthLayoutProps {
    children: ReactNode;
    title: string;
    subtitle: string;
    showBackgroundPattern?: boolean;
}

export const AuthLayout = ({ 
    children, 
    title, 
    subtitle, 
    showBackgroundPattern = true 
}: AuthLayoutProps) => {
    return (
        <div className="min-h-screen bg-primary">
            <div className="flex min-h-screen">
                {/* Left Column - Branding */}
                <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-between lg:bg-secondary lg:px-12 lg:py-16">
                    <div>
                        <CarvtraLogo className="h-8" />
                        <div className="mt-16 max-w-sm">
                            <h1 className="text-2xl font-bold text-primary">
                                Professionelle Fahrzeug-Landing Pages in wenigen Minuten
                            </h1>
                            <p className="mt-4 text-lg text-secondary">
                                Von PDF zur verkaufsfähigen Landing Page - KI-gestützt und vollautomatisch.
                            </p>
                        </div>
                    </div>
                    
                    {/* Background Pattern - Optional */}
                    {showBackgroundPattern && (
                        <div className="relative">
                            <div className="absolute -bottom-8 -right-8 size-64 rounded-full bg-gradient-to-br from-brand-500/20 to-brand-700/10 blur-3xl" />
                            <div className="absolute -bottom-4 -right-4 size-48 rounded-full bg-gradient-to-br from-brand-400/30 to-brand-600/20 blur-2xl" />
                        </div>
                    )}
                </div>

                {/* Right Column - Form */}
                <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
                    <div className="mx-auto w-full max-w-sm lg:w-96">
                        {/* Mobile Logo */}
                        <div className="lg:hidden">
                            <CarvtraLogo className="h-8" />
                        </div>

                        {/* Form Header */}
                        <div className="mt-8 lg:mt-0">
                            <h2 className="text-2xl font-bold text-primary">
                                {title}
                            </h2>
                            <p className="mt-2 text-sm text-secondary">
                                {subtitle}
                            </p>
                        </div>

                        {/* Form Content */}
                        <div className="mt-8">
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};