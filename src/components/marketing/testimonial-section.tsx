"use client";

import { Star01 } from "@untitledui/icons";
import { Avatar } from "@/components/base/avatar/avatar";

const testimonials = [
    {
        content: "Carvitra hat unseren Vertriebsprozess revolutioniert. Was früher Tage dauerte, erledigen wir jetzt in Minuten. Die KI-Analyse ist beeindruckend genau.",
        author: "Michael Schmidt",
        role: "Verkaufsleiter",
        company: "Mercedes-Benz Autohaus Schmidt",
        rating: 5,
        avatar: "MS",
    },
    {
        content: "Die Qualität der generierten Landing Pages ist hervorragend. Unsere Conversion-Rate hat sich seit der Einführung fast verdoppelt. Absolut empfehlenswert!",
        author: "Sandra Weber",
        role: "Marketing Managerin",
        company: "BMW Weber & Partner",
        rating: 5,
        avatar: "SW",
    },
    {
        content: "Endlich eine Lösung, die wirklich funktioniert! Die automatische PDF-Extraktion spart uns unglaublich viel Zeit. Der ROI war bereits nach 2 Monaten positiv.",
        author: "Thomas Müller",
        role: "Geschäftsführer",
        company: "Audi Zentrum München",
        rating: 5,
        avatar: "TM",
    },
];

export const TestimonialSection = () => {
    return (
        <div className="py-24 lg:py-32 bg-secondary">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-2xl text-center">
                    <h2 className="text-display-md font-semibold tracking-tight text-primary lg:text-display-lg">
                        Was unsere Kunden sagen
                    </h2>
                    <p className="mt-4 text-xl text-tertiary">
                        Über 100+ Autohäuser vertrauen bereits auf carvitra
                    </p>
                </div>

                <div className="mt-16 grid gap-8 lg:grid-cols-3">
                    {testimonials.map((testimonial, index) => (
                        <div
                            key={index}
                            className="relative rounded-2xl bg-primary p-8 shadow-sm transition-all hover:shadow-lg"
                        >
                            {/* Quote Icon */}
                            <div className="absolute right-6 top-6 text-4xl text-brand-200 dark:text-brand-800">"</div>
                            
                            {/* Rating */}
                            <div className="flex gap-1">
                                {[...Array(testimonial.rating)].map((_, i) => (
                                    <Star01 key={i} className="size-5 fill-warning-500 text-warning-500" />
                                ))}
                            </div>

                            {/* Content */}
                            <blockquote className="mt-4">
                                <p className="text-base text-secondary leading-relaxed">
                                    "{testimonial.content}"
                                </p>
                            </blockquote>

                            {/* Author */}
                            <div className="mt-6 flex items-center gap-4 border-t border-secondary pt-6">
                                <Avatar size="md" placeholder={testimonial.avatar} />
                                <div>
                                    <div className="text-sm font-semibold text-primary">
                                        {testimonial.author}
                                    </div>
                                    <div className="text-sm text-tertiary">
                                        {testimonial.role}
                                    </div>
                                    <div className="text-xs text-quaternary">
                                        {testimonial.company}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* CTA */}
                <div className="mt-12 text-center">
                    <p className="text-base text-tertiary">
                        Möchten Sie auch Teil unserer Erfolgsgeschichte werden?
                    </p>
                    <a
                        href="#"
                        className="mt-2 inline-flex items-center text-base font-medium text-brand-600 hover:text-brand-700"
                    >
                        Jetzt kostenlos testen →
                    </a>
                </div>
            </div>
        </div>
    );
};