"use client";

import { Upload01, Lightbulb04, Settings01, Users01, ArrowRight, CheckCircle, Zap } from "@untitledui/icons";
import { useEffect, useState } from "react";

const steps = [
    {
        step: "01",
        icon: Upload01,
        title: "PDF-Angebot hochladen",
        description: "Laden Sie einfach Ihr Fahrzeug-PDF mit allen Angebotsdaten in unsere sichere Plattform hoch.",
        duration: "30 Sek",
        features: ["Drag & Drop Upload", "Automatische Validierung", "Sichere Verschlüsselung"]
    },
    {
        step: "02", 
        icon: Lightbulb04,
        title: "KI-Datenextraktion",
        description: "Unsere KI analysiert das PDF und extrahiert automatisch alle Fahrzeug-, Preis- und Finanzierungsdaten.",
        duration: "45 Sek",
        features: ["Claude AI Technology", "45+ Datenfelder", "99% Genauigkeit"]
    },
    {
        step: "03",
        icon: Settings01,
        title: "Landing Page anpassen",
        description: "Überprüfen Sie die extrahierten Daten, laden Sie Bilder hoch und passen Sie die Seite nach Ihren Wünschen an.",
        duration: "2 Min",
        features: ["Wizard-Interface", "Live-Vorschau", "Flexible Anpassung"]
    },
    {
        step: "04",
        icon: Users01,
        title: "Leads empfangen",
        description: "Ihre professionelle Landing Page ist live und qualifizierte Interessenten werden direkt an Sie weitergeleitet.",
        duration: "∞",
        features: ["24/7 Lead-Erfassung", "CRM-Integration", "E-Mail-Benachrichtigung"]
    },
];

export const HowItWorksSection = () => {
    const [activeStep, setActiveStep] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                }
            },
            { threshold: 0.1 }
        );

        const element = document.getElementById("how-it-works");
        if (element) {
            observer.observe(element);
        }

        return () => {
            if (element) {
                observer.unobserve(element);
            }
        };
    }, []);

    useEffect(() => {
        if (!isVisible) return;
        
        const interval = setInterval(() => {
            setActiveStep((prev) => (prev + 1) % steps.length);
        }, 3000);

        return () => clearInterval(interval);
    }, [isVisible]);

    return (
        <div id="how-it-works" className="bg-secondary py-24 lg:py-32 overflow-hidden">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-2xl text-center">
                    <div className="mb-4 inline-flex">
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 dark:bg-brand-900/20 px-3 py-1">
                            <Zap className="size-3.5 text-brand-600" />
                            <span className="text-sm font-medium text-brand-700 dark:text-brand-400">
                                Vollautomatischer Prozess
                            </span>
                        </div>
                    </div>
                    
                    <h2 className="text-display-md font-semibold tracking-tight text-primary lg:text-display-lg">
                        So einfach funktioniert es
                    </h2>
                    <p className="mt-4 text-xl text-tertiary">
                        In nur 4 Schritten von Ihrem PDF-Angebot zur professionellen Landing Page
                    </p>
                </div>
                
                {/* Desktop Timeline */}
                <div className="mx-auto mt-16 hidden lg:block">
                    <div className="relative">
                        {/* Progress Line */}
                        <div className="absolute left-0 right-0 top-6 h-1 bg-gray-200 dark:bg-gray-700">
                            <div 
                                className="h-full bg-gradient-to-r from-brand-600 to-brand-400 transition-all duration-1000"
                                style={{ width: `${((activeStep + 1) / steps.length) * 100}%` }}
                            />
                        </div>
                        
                        <div className="relative grid grid-cols-4 gap-8">
                            {steps.map((step, index) => {
                                const Icon = step.icon;
                                const isActive = index <= activeStep;
                                const isCurrent = index === activeStep;
                                
                                return (
                                    <div 
                                        key={step.step} 
                                        className={`relative flex flex-col items-center text-center transition-all duration-500 ${
                                            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                                        }`}
                                        style={{ transitionDelay: `${index * 100}ms` }}
                                    >
                                        {/* Step number */}
                                        <div className={`
                                            relative z-10 mb-4 flex size-12 items-center justify-center rounded-full 
                                            ${isActive 
                                                ? 'bg-brand-600 text-white ring-4 ring-brand-100 dark:ring-brand-900/30' 
                                                : 'bg-gray-100 text-gray-400 dark:bg-gray-800'}
                                            ${isCurrent ? 'scale-110' : ''}
                                            transition-all duration-300
                                        `}>
                                            {isActive ? (
                                                <CheckCircle className="size-6" />
                                            ) : (
                                                step.step
                                            )}
                                        </div>
                                        
                                        {/* Card */}
                                        <div className={`
                                            group relative w-full rounded-2xl border p-6 transition-all duration-300
                                            ${isCurrent 
                                                ? 'border-brand-300 bg-gradient-to-b from-brand-50 to-transparent shadow-lg dark:border-brand-700 dark:from-brand-900/20' 
                                                : 'border-secondary bg-primary hover:shadow-md'}
                                        `}>
                                            {/* Duration Badge */}
                                            <div className="absolute -top-3 right-4">
                                                <span className={`
                                                    inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium
                                                    ${isCurrent 
                                                        ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400' 
                                                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}
                                                `}>
                                                    {step.duration}
                                                </span>
                                            </div>
                                            
                                            {/* Icon */}
                                            <div className="mb-4 flex justify-center">
                                                <div className={`
                                                    flex size-14 items-center justify-center rounded-2xl
                                                    ${isCurrent 
                                                        ? 'bg-brand-100 dark:bg-brand-900/30' 
                                                        : 'bg-gray-50 dark:bg-gray-800'}
                                                    transition-colors duration-300
                                                `}>
                                                    <Icon className={`size-7 ${isCurrent ? 'text-brand-600' : 'text-gray-500'}`} />
                                                </div>
                                            </div>
                                            
                                            {/* Content */}
                                            <h3 className="text-lg font-semibold text-primary">
                                                {step.title}
                                            </h3>
                                            
                                            <p className="mt-2 text-sm text-tertiary">
                                                {step.description}
                                            </p>
                                            
                                            {/* Features (shown on current) */}
                                            {isCurrent && (
                                                <ul className="mt-4 space-y-1">
                                                    {step.features.map((feature) => (
                                                        <li key={feature} className="flex items-center text-xs text-secondary">
                                                            <CheckCircle className="mr-1.5 size-3 text-success-500" />
                                                            {feature}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
                
                {/* Mobile Vertical Timeline */}
                <div className="mx-auto mt-16 lg:hidden">
                    <div className="relative">
                        {/* Vertical Line */}
                        <div className="absolute left-6 top-0 h-full w-0.5 bg-gray-200 dark:bg-gray-700" />
                        
                        <div className="space-y-8">
                            {steps.map((step, index) => {
                                const Icon = step.icon;
                                const isActive = index <= activeStep;
                                
                                return (
                                    <div key={step.step} className="relative flex gap-4">
                                        {/* Step number */}
                                        <div className={`
                                            relative z-10 flex size-12 shrink-0 items-center justify-center rounded-full
                                            ${isActive 
                                                ? 'bg-brand-600 text-white' 
                                                : 'bg-gray-100 text-gray-400 dark:bg-gray-800'}
                                            transition-colors duration-300
                                        `}>
                                            {isActive ? (
                                                <CheckCircle className="size-6" />
                                            ) : (
                                                step.step
                                            )}
                                        </div>
                                        
                                        {/* Content */}
                                        <div className="flex-1 pb-8">
                                            <div className="rounded-xl border border-secondary bg-primary p-4">
                                                <div className="mb-3 flex items-center gap-2">
                                                    <Icon className="size-5 text-brand-600" />
                                                    <h3 className="font-semibold text-primary">
                                                        {step.title}
                                                    </h3>
                                                </div>
                                                <p className="text-sm text-tertiary">
                                                    {step.description}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
                
                {/* CTA */}
                <div className="mt-16 text-center">
                    <div className="inline-flex items-center gap-2 rounded-full bg-success-50 dark:bg-success-900/20 px-4 py-2">
                        <div className="size-2 rounded-full bg-success-500 animate-pulse" />
                        <p className="text-sm text-success-700 dark:text-success-400">
                            Durchschnittliche Gesamtzeit: <span className="font-semibold">unter 3 Minuten</span>
                        </p>
                    </div>
                    
                    <div className="mt-6">
                        <a href="#" className="inline-flex items-center gap-2 text-base font-medium text-brand-600 hover:text-brand-700">
                            Jetzt selbst ausprobieren
                            <ArrowRight className="size-4" />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};