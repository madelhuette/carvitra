"use client";

import { PlayCircle, ArrowRight } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";

export const HeroSection = () => {
    return (
        <div className="relative py-24 lg:py-32">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-4xl text-center">
                    <h1 className="text-display-lg font-semibold tracking-tight text-primary lg:text-display-xl">
                        Von PDF zu professioneller{" "}
                        <span className="bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text text-transparent">
                            Landing Page
                        </span>{" "}
                        in Minuten
                    </h1>
                    
                    <p className="mt-6 text-xl text-tertiary lg:text-2xl">
                        KI-gestützte Fahrzeug-Angebotserstellung für Autohändler. 
                        Keine technischen Kenntnisse erforderlich – einfach PDF hochladen und professionelle Landing Pages automatisch generieren lassen.
                    </p>
                    
                    <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                        <Button 
                            size="xl" 
                            color="primary" 
                            iconTrailing={ArrowRight}
                            className="w-full sm:w-auto"
                        >
                            Kostenlos testen
                        </Button>
                        <Button 
                            size="xl" 
                            color="secondary" 
                            iconLeading={PlayCircle}
                            className="w-full sm:w-auto"
                        >
                            Demo ansehen
                        </Button>
                    </div>
                    
                    <p className="mt-6 text-sm text-quaternary">
                        ✓ Keine Kreditkarte erforderlich  ✓ 5 kostenlose Landing Pages  ✓ Sofort einsatzbereit
                    </p>
                </div>
            </div>
            
            {/* Background decoration */}
            <div className="absolute inset-0 -z-10 overflow-hidden">
                <div className="absolute left-1/2 top-0 ml-[-38rem] h-[25rem] w-[81.25rem] dark:[mask-image:linear-gradient(white,transparent)]">
                    <div className="absolute inset-0 bg-gradient-to-r from-brand-100 to-brand-50 opacity-40 [mask-image:radial-gradient(farthest-side_at_top,white,transparent)] dark:from-brand-400/30 dark:to-brand-100/30 dark:opacity-100"></div>
                </div>
            </div>
        </div>
    );
};