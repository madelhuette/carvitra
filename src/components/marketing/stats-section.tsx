"use client";

import { TrendUp01, Clock, Target05, CurrencyEuro } from "@untitledui/icons";
import { useEffect, useState } from "react";

const stats = [
    {
        icon: TrendUp01,
        value: 45,
        suffix: "%",
        label: "Höhere Conversion-Rate",
        description: "Im Vergleich zu herkömmlichen Methoden",
        color: "text-success-600",
        bgColor: "bg-success-50 dark:bg-success-900/20",
    },
    {
        icon: Clock,
        value: 3,
        suffix: " Min",
        label: "Von PDF zu Landing Page",
        description: "Vollautomatischer Prozess mit KI",
        color: "text-brand-600",
        bgColor: "bg-brand-50 dark:bg-brand-900/20",
    },
    {
        icon: Target05,
        value: 87,
        suffix: "%",
        label: "Qualifizierte Leads",
        description: "Durch strukturierte Erfassung",
        color: "text-warning-600",
        bgColor: "bg-warning-50 dark:bg-warning-900/20",
    },
    {
        icon: CurrencyEuro,
        value: 5000,
        prefix: "€",
        suffix: "+",
        label: "Ersparnis pro Monat",
        description: "Keine Agentur-Kosten mehr",
        color: "text-error-600",
        bgColor: "bg-error-50 dark:bg-error-900/20",
    },
];

export const StatsSection = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [counters, setCounters] = useState(stats.map(() => 0));

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                }
            },
            { threshold: 0.1 }
        );

        const element = document.getElementById("stats-section");
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

        const intervals = stats.map((stat, index) => {
            const increment = stat.value / 50; // 50 steps
            let current = 0;

            return setInterval(() => {
                current += increment;
                if (current >= stat.value) {
                    current = stat.value;
                    clearInterval(intervals[index]);
                }
                setCounters((prev) => {
                    const newCounters = [...prev];
                    newCounters[index] = Math.floor(current);
                    return newCounters;
                });
            }, 30);
        });

        return () => {
            intervals.forEach(clearInterval);
        };
    }, [isVisible]);

    return (
        <div id="stats-section" className="py-24 lg:py-32">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-2xl text-center">
                    <h2 className="text-display-md font-semibold tracking-tight text-primary lg:text-display-lg">
                        Zahlen, die für sich sprechen
                    </h2>
                    <p className="mt-4 text-xl text-tertiary">
                        carvitra revolutioniert das Automotive-Marketing mit messbaren Ergebnissen
                    </p>
                </div>

                <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                    {stats.map((stat, index) => {
                        const Icon = stat.icon;
                        return (
                            <div key={stat.label} className="relative">
                                <div className="rounded-2xl border border-secondary bg-primary p-6 shadow-sm transition-all hover:shadow-lg">
                                    <div className={`inline-flex rounded-lg ${stat.bgColor} p-3`}>
                                        <Icon className={`size-6 ${stat.color}`} />
                                    </div>
                                    
                                    <div className="mt-4">
                                        <div className="flex items-baseline">
                                            <span className={`text-4xl font-bold tracking-tight ${stat.color}`}>
                                                {stat.prefix}
                                                {isVisible ? counters[index] : 0}
                                                {stat.suffix}
                                            </span>
                                        </div>
                                        <div className="mt-2 text-base font-medium text-primary">
                                            {stat.label}
                                        </div>
                                        <div className="mt-1 text-sm text-tertiary">
                                            {stat.description}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Additional context */}
                <div className="mt-12 rounded-2xl bg-gradient-to-r from-brand-50 to-brand-100 dark:from-brand-900/20 dark:to-brand-800/20 p-8 text-center">
                    <h3 className="text-lg font-semibold text-primary">
                        Basierend auf Daten von über 100+ Autohäusern
                    </h3>
                    <p className="mt-2 text-base text-tertiary">
                        Alle Zahlen sind Durchschnittswerte unserer Kunden aus den letzten 12 Monaten
                    </p>
                </div>
            </div>
        </div>
    );
};