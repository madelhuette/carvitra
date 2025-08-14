"use client";

import { useState } from "react";
import { Eye, EyeOff, CheckCircle2 } from "@untitledui/icons";
import { Input } from "@/components/base/input/input";
import { Label } from "@/components/base/input/label";
import { 
    getPasswordStrength, 
    getPasswordStrengthText, 
    getPasswordRequirements,
    getPasswordStrengthBarClass 
} from "@/utils/password";

interface PasswordInputProps {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    error?: string;
    placeholder?: string;
    disabled?: boolean;
    showStrengthIndicator?: boolean;
    showRequirements?: boolean;
    autoComplete?: string;
    required?: boolean;
}

export const PasswordInput = ({
    id,
    label,
    value,
    onChange,
    error,
    placeholder = "Ihr Passwort",
    disabled = false,
    showStrengthIndicator = false,
    showRequirements = false,
    autoComplete = "current-password",
    required = true,
}: PasswordInputProps) => {
    const [showPassword, setShowPassword] = useState(false);
    
    const passwordStrength = showStrengthIndicator ? getPasswordStrength(value) : 0;
    const passwordStrengthInfo = showStrengthIndicator ? getPasswordStrengthText(passwordStrength) : null;
    const passwordRequirements = showRequirements ? getPasswordRequirements(value) : [];

    return (
        <div>
            <Label htmlFor={id} required={required}>
                {label}
            </Label>
            <div className="mt-1 relative">
                <Input
                    id={id}
                    type={showPassword ? "text" : "password"}
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    error={error}
                    disabled={disabled}
                    autoComplete={autoComplete}
                />
                <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-tertiary hover:text-secondary transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Passwort verbergen" : "Passwort anzeigen"}
                >
                    {showPassword ? (
                        <EyeOff className="size-4" />
                    ) : (
                        <Eye className="size-4" />
                    )}
                </button>
            </div>
            
            {/* Password Strength Indicator */}
            {showStrengthIndicator && value && (
                <div className="mt-2 space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-1">
                            <div 
                                className={`h-1 rounded-full transition-all ${getPasswordStrengthBarClass(passwordStrength)}`}
                            />
                        </div>
                        {passwordStrengthInfo && (
                            <span className={`text-xs font-medium ${passwordStrengthInfo.color}`}>
                                {passwordStrengthInfo.text}
                            </span>
                        )}
                    </div>
                    
                    {/* Password Requirements */}
                    {showRequirements && (
                        <div className="grid grid-cols-1 gap-1">
                            {passwordRequirements.map((req) => (
                                <div key={req.id} className="flex items-center gap-2">
                                    <div className={`size-4 rounded-full flex items-center justify-center ${
                                        req.met ? 'bg-success-100' : 'bg-gray-100'
                                    }`}>
                                        {req.met && (
                                            <CheckCircle2 className="size-3 text-success-600" />
                                        )}
                                    </div>
                                    <span className={`text-xs ${
                                        req.met ? 'text-success-700' : 'text-gray-500'
                                    }`}>
                                        {req.text}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};