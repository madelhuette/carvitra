import { Truck02 } from "@untitledui/icons";
import { cx } from "@/utils/cx";

interface CarvtraLogoProps {
    className?: string;
    showText?: boolean;
    variant?: "default" | "minimal";
}

export const CarvtraLogo = ({ className, showText = true, variant = "default" }: CarvtraLogoProps) => {
    return (
        <div className={cx("flex items-center gap-2", className)}>
            <div className="flex size-8 items-center justify-center rounded-lg bg-brand-solid">
                <Truck02 className="size-5 text-primary-inverted" />
            </div>
            {showText && variant !== "minimal" && (
                <span className="text-xl font-bold text-primary">CARVITRA</span>
            )}
        </div>
    );
};

export const CarvtraLogoMinimal = ({ className }: { className?: string }) => {
    return <CarvtraLogo className={className} variant="minimal" showText={false} />;
};