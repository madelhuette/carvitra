"use client";

import { Header } from "@/components/marketing/header-navigation/components/header";
import { HeroSectionNew } from "@/components/marketing/hero-section-new";
import { LogoCloudSection } from "@/components/marketing/logo-cloud-section";
import { FeaturesSection } from "@/components/marketing/features-section";
import { StatsSection } from "@/components/marketing/stats-section";
import { HowItWorksSection } from "@/components/marketing/how-it-works-section";
import { BenefitsSection } from "@/components/marketing/benefits-section";
import { TestimonialSection } from "@/components/marketing/testimonial-section";
import { PricingSection } from "@/components/marketing/pricing-section";
import { FooterSection } from "@/components/marketing/footer-section";

export const HomeScreen = () => {
    return (
        <div className="min-h-screen bg-primary">
            {/* Header with Navigation */}
            <Header />
            
            {/* Main Content */}
            <main>
                {/* Hero Section - New improved version */}
                <HeroSectionNew />
                
                {/* Logo Cloud - Social Proof */}
                <LogoCloudSection />
                
                {/* Features Section */}
                <FeaturesSection />
                
                {/* Stats Section - Impressive Numbers */}
                <StatsSection />
                
                {/* How it Works Section */}
                <HowItWorksSection />
                
                {/* Benefits Section */}
                <BenefitsSection />
                
                {/* Testimonials - Customer Success */}
                <TestimonialSection />
                
                {/* Pricing Section */}
                <PricingSection />
            </main>
            
            {/* Footer */}
            <FooterSection />
        </div>
    );
};
