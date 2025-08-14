import type { PasswordStrengthInfo, PasswordRequirement } from "@/types/auth";

/**
 * Berechnet die Passwort-Stärke basierend auf verschiedenen Kriterien
 * @param password Das zu prüfende Passwort
 * @returns Score von 0-5
 */
export const getPasswordStrength = (password: string): number => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
};

/**
 * Gibt Text und Farbe für die Passwort-Stärke zurück
 * @param score Der Passwort-Stärke Score (0-5)
 * @returns Objekt mit Text und Farbe
 */
export const getPasswordStrengthText = (score: number): PasswordStrengthInfo => {
    switch (score) {
        case 0:
        case 1:
            return { text: "Sehr schwach", color: "text-error-600" };
        case 2:
            return { text: "Schwach", color: "text-warning-600" };
        case 3:
            return { text: "Mittel", color: "text-warning-600" };
        case 4:
            return { text: "Stark", color: "text-success-600" };
        case 5:
            return { text: "Sehr stark", color: "text-success-700" };
        default:
            return { text: "", color: "" };
    }
};

/**
 * Gibt die Passwort-Anforderungen mit Status zurück
 * @param password Das zu prüfende Passwort
 * @returns Array mit Anforderungen und deren Erfüllungsstatus
 */
export const getPasswordRequirements = (password: string): PasswordRequirement[] => {
    return [
        { 
            text: "Mindestens 8 Zeichen", 
            met: password.length >= 8,
            id: "length" 
        },
        { 
            text: "Ein Großbuchstabe", 
            met: /[A-Z]/.test(password),
            id: "uppercase"
        },
        { 
            text: "Ein Kleinbuchstabe", 
            met: /[a-z]/.test(password),
            id: "lowercase"
        },
        { 
            text: "Eine Zahl", 
            met: /[0-9]/.test(password),
            id: "number"
        },
        { 
            text: "Ein Sonderzeichen", 
            met: /[^A-Za-z0-9]/.test(password),
            id: "special"
        },
    ];
};

/**
 * Validiert ob ein Passwort stark genug ist
 * @param password Das zu validierende Passwort
 * @returns true wenn das Passwort stark genug ist (Score >= 3)
 */
export const validatePasswordStrength = (password: string): boolean => {
    return getPasswordStrength(password) >= 3;
};

/**
 * Gibt die CSS-Klasse für die Passwort-Stärke-Anzeige zurück
 * @param strength Die Passwort-Stärke (0-5)
 * @returns Tailwind CSS Klassen für die Anzeige
 */
export const getPasswordStrengthBarClass = (strength: number): string => {
    if (strength <= 1) return 'bg-error-500 w-1/5';
    if (strength === 2) return 'bg-warning-500 w-2/5';
    if (strength === 3) return 'bg-warning-500 w-3/5';
    if (strength === 4) return 'bg-success-500 w-4/5';
    return 'bg-success-600 w-full';
};