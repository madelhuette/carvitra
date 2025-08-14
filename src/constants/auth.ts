/**
 * Auth-bezogene Konstanten
 */

// Fehlermeldungen
export const AUTH_ERRORS = {
    LOGIN_FAILED: "Anmeldung fehlgeschlagen. Bitte überprüfen Sie Ihre Eingaben.",
    REGISTRATION_FAILED: "Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.",
    EMAIL_NOT_SENT: "E-Mail konnte nicht gesendet werden. Bitte versuchen Sie es erneut.",
    RESET_FAILED: "Passwort konnte nicht zurückgesetzt werden. Bitte versuchen Sie es erneut oder fordern Sie einen neuen Link an.",
    INVALID_TOKEN: "Ungültiger oder fehlender Reset-Token. Bitte fordern Sie einen neuen Link an.",
    WEAK_PASSWORD: "Passwort ist zu schwach",
} as const;

// Success Messages
export const AUTH_SUCCESS = {
    REGISTRATION: "Registrierung erfolgreich!",
    LOGIN: "Anmeldung erfolgreich!",
    PASSWORD_RESET: "Passwort erfolgreich zurückgesetzt!",
    EMAIL_SENT: "E-Mail erfolgreich gesendet!",
} as const;

// Passwort-Anforderungen Mindest-Score
export const MIN_PASSWORD_STRENGTH = 3;

// Form Default Values
export const DEFAULT_REGISTER_FORM = {
    userType: "dealer" as const,
    firstName: "",
    lastName: "",
    email: "",
    companyName: "",
    phone: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
    acceptPrivacy: false,
    acceptMarketing: false,
};

// User Type Options für Registrierung
export const USER_TYPE_OPTIONS = [
    {
        value: "dealer",
        label: "Händler",
        description: "Ich bin ein Autohändler/Autohaus",
    },
    {
        value: "salesperson",
        label: "Verkäufer", 
        description: "Ich bin ein Verkäufer in einem Autohaus",
    },
] as const;

// Auth Routes
export const AUTH_ROUTES = {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    FORGOT_PASSWORD: "/auth/forgot-password",
    RESET_PASSWORD: "/auth/reset-password",
    SUCCESS: "/auth/success",
    DASHBOARD: "/dashboard",
} as const;

// LocalStorage Keys
export const AUTH_STORAGE_KEYS = {
    REMEMBER_EMAIL: "carvitra_remember_email",
    THEME_PREFERENCE: "carvitra_theme",
} as const;