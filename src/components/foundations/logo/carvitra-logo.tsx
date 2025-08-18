"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { cx } from "@/utils/cx";

interface CarvtraLogoProps {
    className?: string;
    showText?: boolean;
    variant?: "default" | "minimal";
    size?: "sm" | "md" | "lg" | "xl";
    href?: string;
    disableLink?: boolean;
}

const getLogoSize = (size: string = "md") => {
    switch (size) {
        case "sm":
            return { width: 95, height: 30 };
        case "md":
            return { width: 127, height: 40 };
        case "lg":
            return { width: 190, height: 60 };
        case "xl":
            return { width: 253, height: 80 };
        default:
            return { width: 127, height: 40 };
    }
};

export const CarvtraLogo = ({ 
    className, 
    showText = true, 
    variant = "default",
    size = "md",
    href = "/",
    disableLink = false
}: CarvtraLogoProps) => {
    const [mounted, setMounted] = useState(false);
    const { theme } = useTheme();
    const dimensions = getLogoSize(size);
    
    useEffect(() => {
        setMounted(true);
    }, []);
    
    const logoContent = (
        <div className={cx("flex items-center", !disableLink && "hover:opacity-80 transition-opacity", className)}>
            <Image
                src={mounted && theme === "dark" ? "/carvitra_white.svg" : "/carvitra_colored.svg"}
                alt="Carvitra Logo"
                width={dimensions.width}
                height={dimensions.height}
                className="transition-opacity duration-200"
                priority
            />
        </div>
    );

    if (disableLink) {
        return logoContent;
    }

    return (
        <Link href={href} className="inline-flex">
            {logoContent}
        </Link>
    );
};

export const CarvtraLogoMinimal = ({ className, size = "md" }: { className?: string; size?: "sm" | "md" | "lg" | "xl" }) => {
    return <CarvtraLogo className={className} variant="minimal" showText={false} size={size} />;
};