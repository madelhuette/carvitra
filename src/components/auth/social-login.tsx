"use client";

import { Button } from "@/components/base/buttons/button";
import { Google, Facebook, LinkedIn } from "@/components/foundations/social-icons";

interface SocialLoginProps {
    onGoogleLogin?: () => void;
    onFacebookLogin?: () => void;
    onLinkedinLogin?: () => void;
    isLoading?: boolean;
    showText?: boolean;
}

export const SocialLogin = ({ 
    onGoogleLogin, 
    onFacebookLogin, 
    onLinkedinLogin,
    isLoading = false,
    showText = true
}: SocialLoginProps) => {
    return (
        <div className="space-y-3">
            {showText && (
                <p className="text-sm text-center text-secondary mb-4">
                    Schnell anmelden mit
                </p>
            )}
            
            <div className="grid grid-cols-1 gap-3">
                <Button
                    color="secondary"
                    size="lg"
                    className="w-full"
                    onClick={onGoogleLogin}
                    disabled={isLoading}
                >
                    <Google className="size-4" />
                    Mit Google anmelden
                </Button>
                
                <Button
                    color="secondary"
                    size="lg"
                    className="w-full"
                    onClick={onFacebookLogin}
                    disabled={isLoading}
                >
                    <Facebook className="size-4" />
                    Mit Facebook anmelden
                </Button>
                
                <Button
                    color="secondary"
                    size="lg"
                    className="w-full"
                    onClick={onLinkedinLogin}
                    disabled={isLoading}
                >
                    <LinkedIn className="size-4" />
                    Mit LinkedIn anmelden
                </Button>
            </div>
        </div>
    );
};