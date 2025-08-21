"use client";

import { Building07, Building08, Building05, ShoppingBag01, Home04 } from "@untitledui/icons";

const partners = [
    { name: "Mercedes-Benz Partner", icon: Building07 },
    { name: "BMW Autohaus", icon: Building08 },
    { name: "Audi Zentrum", icon: Building07 },
    { name: "VW Partner", icon: Building05 },
    { name: "Porsche Center", icon: ShoppingBag01 },
    { name: "Toyota Händler", icon: Home04 },
];

export const LogoCloudSection = () => {
    return (
        <div className="py-16 lg:py-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <p className="text-base font-medium text-tertiary">
                        Vertraut von über 100+ führenden Autohäusern in Deutschland
                    </p>
                </div>
                
                <div className="mt-8">
                    <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-6 lg:gap-x-12">
                        {partners.map((partner) => {
                            const Icon = partner.icon;
                            return (
                                <div
                                    key={partner.name}
                                    className="flex items-center gap-2 text-quaternary transition-colors hover:text-secondary"
                                >
                                    <Icon className="size-8 lg:size-10" />
                                    <span className="text-sm font-medium lg:text-base">
                                        {partner.name}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Trust metrics */}
                <div className="mt-12 grid grid-cols-2 gap-4 border-t border-secondary pt-8 lg:grid-cols-4">
                    <div className="text-center">
                        <div className="text-2xl font-semibold text-primary lg:text-3xl">500+</div>
                        <div className="mt-1 text-sm text-tertiary">Landing Pages erstellt</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-semibold text-primary lg:text-3xl">98%</div>
                        <div className="mt-1 text-sm text-tertiary">Kundenzufriedenheit</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-semibold text-primary lg:text-3xl">3 Min</div>
                        <div className="mt-1 text-sm text-tertiary">Durchschnittliche Setup-Zeit</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-semibold text-primary lg:text-3xl">24/7</div>
                        <div className="mt-1 text-sm text-tertiary">Lead-Erfassung</div>
                    </div>
                </div>
            </div>
        </div>
    );
};