"use client";

import { PlayCircle, ArrowRight, Zap, Clock, TrendUp01, CheckCircle, Shield01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { BadgeWithIcon } from "@/components/base/badges/badges";
import Image from "next/image";
import { useState, useEffect } from "react";

export const HeroSectionNew = () => {
    const [currentMetric, setCurrentMetric] = useState(0);
    const metrics = [
        { value: "500+", label: "Landing Pages erstellt" },
        { value: "3 Min", label: "bis zur fertigen Seite" },
        { value: "45%", label: "höhere Conversion" }
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentMetric((prev) => (prev + 1) % metrics.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="relative overflow-hidden py-24 lg:py-32">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
                    {/* Text Content */}
                    <div className="relative z-10">
                        {/* Success Badge */}
                        <div className="mb-6 inline-flex">
                            <BadgeWithIcon 
                                type="pill-color"
                                size="lg" 
                                color="success"
                                iconLeading={Zap}
                            >
                                Neu: KI-gestützte PDF-Analyse
                            </BadgeWithIcon>
                        </div>

                        {/* Main Headline */}
                        <h1 className="text-display-lg font-semibold tracking-tight text-primary lg:text-display-xl">
                            Von PDF zu professioneller{" "}
                            <span className="relative">
                                <span className="bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text text-transparent">
                                    Landing Page
                                </span>
                                <svg
                                    className="absolute -bottom-2 left-0 w-full"
                                    viewBox="0 0 300 12"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M2 9C2 9 75 3 150 5C225 7 298 3 298 3"
                                        stroke="url(#gradient)"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                    />
                                    <defs>
                                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="#7F56D9" />
                                            <stop offset="100%" stopColor="#9E77ED" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                            </span>{" "}
                            in Minuten
                        </h1>
                        
                        <p className="mt-6 text-xl text-tertiary lg:text-2xl">
                            Die führende KI-Plattform für Autohändler. Verwandeln Sie Ihre Fahrzeug-PDFs 
                            automatisch in conversion-optimierte Landing Pages – ohne technische Kenntnisse.
                        </p>

                        {/* CTA Buttons */}
                        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                            <Button 
                                size="xl" 
                                color="primary" 
                                iconTrailing={ArrowRight}
                                className="w-full sm:w-auto"
                            >
                                Kostenlos starten
                            </Button>
                            <Button 
                                size="xl" 
                                color="secondary" 
                                iconLeading={PlayCircle}
                                className="w-full sm:w-auto"
                            >
                                Live-Demo (2 Min)
                            </Button>
                        </div>

                        {/* Trust Indicators */}
                        <div className="mt-8 flex flex-wrap items-center gap-6 text-sm text-quaternary">
                            <div className="flex items-center gap-1.5">
                                <CheckCircle className="size-4 text-success-500" />
                                <span>Keine Kreditkarte</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <CheckCircle className="size-4 text-success-500" />
                                <span>5 kostenlose Seiten</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Shield01 className="size-4 text-success-500" />
                                <span>100% DSGVO-konform</span>
                            </div>
                        </div>

                        {/* Animated Metrics */}
                        <div className="mt-8 rounded-xl bg-primary-50 dark:bg-gray-800/50 p-4 backdrop-blur-sm">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <TrendUp01 className="size-5 text-brand-600" />
                                    <span className="text-sm font-medium text-primary">Live-Statistik:</span>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-semibold text-brand-600">
                                        {metrics[currentMetric].value}
                                    </div>
                                    <div className="text-xs text-tertiary">
                                        {metrics[currentMetric].label}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Visual Content */}
                    <div className="relative lg:ml-8">
                        {/* Main Product Showcase */}
                        <div className="relative">
                            {/* Browser Frame */}
                            <div className="rounded-xl bg-gray-900 p-3 shadow-2xl">
                                <div className="flex gap-1.5 mb-3">
                                    <div className="size-3 rounded-full bg-red-500" />
                                    <div className="size-3 rounded-full bg-yellow-500" />
                                    <div className="size-3 rounded-full bg-green-500" />
                                </div>
                                
                                {/* Wizard Screenshot */}
                                <div className="rounded-lg bg-white dark:bg-gray-950 overflow-hidden">
                                    <div className="relative aspect-[4/3] bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-900/20 dark:to-brand-800/20">
                                        {/* Placeholder für Wizard Screenshot */}
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-full max-w-md p-6">
                                                {/* Mock Wizard UI */}
                                                <div className="space-y-4">
                                                    {/* Progress Bar */}
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-2 flex-1 rounded-full bg-brand-600" style={{ width: "40%" }} />
                                                        <div className="h-2 flex-1 rounded-full bg-gray-200 dark:bg-gray-700" />
                                                    </div>
                                                    
                                                    {/* Form Fields Mock */}
                                                    <div className="space-y-3">
                                                        <div className="h-10 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700" />
                                                        <div className="h-10 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700" />
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div className="h-10 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700" />
                                                            <div className="h-10 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700" />
                                                        </div>
                                                    </div>
                                                    
                                                    {/* AI Analysis Badge */}
                                                    <div className="flex justify-center">
                                                        <div className="inline-flex items-center gap-2 rounded-full bg-brand-100 dark:bg-brand-900/30 px-3 py-1.5">
                                                            <div className="size-2 rounded-full bg-brand-600 animate-pulse" />
                                                            <span className="text-xs font-medium text-brand-700 dark:text-brand-400">
                                                                KI analysiert Ihre Daten...
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Floating Cards */}
                            <div className="absolute -left-8 top-8 z-20 animate-float">
                                <div className="rounded-lg bg-white dark:bg-gray-900 p-3 shadow-xl">
                                    <div className="flex items-center gap-2">
                                        <Clock className="size-4 text-brand-600" />
                                        <span className="text-xs font-medium text-primary">3 Min Setup</span>
                                    </div>
                                </div>
                            </div>

                            <div className="absolute -right-8 bottom-8 z-20 animate-float-delayed">
                                <div className="rounded-lg bg-white dark:bg-gray-900 p-3 shadow-xl">
                                    <div className="flex items-center gap-2">
                                        <TrendUp01 className="size-4 text-success-600" />
                                        <span className="text-xs font-medium text-primary">45% mehr Leads</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Background decorations */}
            <div className="absolute inset-0 -z-10 overflow-hidden">
                <div className="absolute -top-1/2 left-1/2 ml-[-50rem] h-[50rem] w-[100rem]">
                    <div className="absolute inset-0 bg-gradient-to-r from-brand-100 to-brand-50 opacity-20 blur-3xl dark:from-brand-400/10 dark:to-brand-100/10" />
                </div>
                <div className="absolute -bottom-1/2 right-1/2 mr-[-50rem] h-[50rem] w-[100rem]">
                    <div className="absolute inset-0 bg-gradient-to-l from-brand-100 to-brand-50 opacity-20 blur-3xl dark:from-brand-400/10 dark:to-brand-100/10" />
                </div>
            </div>

            {/* Add animation styles */}
            <style jsx>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                }
                
                @keyframes float-delayed {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                }
                
                .animate-float {
                    animation: float 3s ease-in-out infinite;
                }
                
                .animate-float-delayed {
                    animation: float-delayed 3s ease-in-out infinite;
                    animation-delay: 1.5s;
                }
            `}</style>
        </div>
    );
};