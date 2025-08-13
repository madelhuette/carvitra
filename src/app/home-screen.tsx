"use client";

import { Header } from "@/components/marketing/header-navigation/components/header";
import { HeroSection } from "@/components/marketing/hero-section";
import { FeaturesSection } from "@/components/marketing/features-section";
import { HowItWorksSection } from "@/components/marketing/how-it-works-section";
import { BenefitsSection } from "@/components/marketing/benefits-section";
import { PricingSection } from "@/components/marketing/pricing-section";
import { FooterSection } from "@/components/marketing/footer-section";

export const HomeScreen = () => {
    return (
        <div className="min-h-screen bg-primary">
            {/* Header with Navigation */}
            <Header />
            
            {/* Main Content */}
            <main>
                {/* Hero Section */}
                <HeroSection />
                
                {/* Features Section */}
                <FeaturesSection />
                
                {/* How it Works Section */}
                <HowItWorksSection />
                
                {/* Benefits Section */}
                <BenefitsSection />
                
                {/* Pricing Section */}
                <PricingSection />
            </main>
            
            {/* Footer */}
            <FooterSection />
        </div>
    );
};
