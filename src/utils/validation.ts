/**
 * E-Mail Regex Pattern
 */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Telefonnummer Regex Pattern (flexibel für verschiedene Formate)
 */
export const PHONE_REGEX = /^[\d\s\-\+\(\)]+$/;

/**
 * Validiert eine E-Mail Adresse
 * @param email Die zu validierende E-Mail
 * @returns Fehlermeldung oder null wenn valide
 */
export const validateEmail = (email: string): string | null => {
    if (!email || !email.trim()) {
        return "E-Mail Adresse ist erforderlich";
    }
    if (!EMAIL_REGEX.test(email)) {
        return "Bitte geben Sie eine gültige E-Mail Adresse ein";
    }
    return null;
};

/**
 * Validiert eine Telefonnummer
 * @param phone Die zu validierende Telefonnummer
 * @returns Fehlermeldung oder null wenn valide
 */
export const validatePhone = (phone: string): string | null => {
    if (!phone || !phone.trim()) {
        return "Telefonnummer ist erforderlich";
    }
    if (!PHONE_REGEX.test(phone)) {
        return "Bitte geben Sie eine gültige Telefonnummer ein";
    }
    if (phone.replace(/\D/g, '').length < 7) {
        return "Telefonnummer ist zu kurz";
    }
    return null;
};

/**
 * Validiert ein Pflichtfeld
 * @param value Der zu validierende Wert
 * @param fieldName Der Name des Feldes für die Fehlermeldung
 * @returns Fehlermeldung oder null wenn valide
 */
export const validateRequired = (value: string | boolean, fieldName: string): string | null => {
    if (typeof value === 'string' && (!value || !value.trim())) {
        return `${fieldName} ist erforderlich`;
    }
    if (typeof value === 'boolean' && !value) {
        return `${fieldName} muss akzeptiert werden`;
    }
    return null;
};

/**
 * Validiert ein Passwort
 * @param password Das zu validierende Passwort
 * @returns Fehlermeldung oder null wenn valide
 */
export const validatePassword = (password: string): string | null => {
    if (!password) {
        return "Passwort ist erforderlich";
    }
    if (password.length < 8) {
        return "Passwort muss mindestens 8 Zeichen lang sein";
    }
    return null;
};

/**
 * Validiert Passwort-Übereinstimmung
 * @param password Das Passwort
 * @param confirmPassword Das Bestätigungs-Passwort
 * @returns Fehlermeldung oder null wenn übereinstimmend
 */
export const validatePasswordMatch = (password: string, confirmPassword: string): string | null => {
    if (!confirmPassword) {
        return "Passwort bestätigen ist erforderlich";
    }
    if (password !== confirmPassword) {
        return "Passwörter stimmen nicht überein";
    }
    return null;
};

/**
 * Formatiert eine Telefonnummer für die Anzeige
 * @param phone Die Telefonnummer
 * @returns Formatierte Telefonnummer
 */
export const formatPhoneNumber = (phone: string): string => {
    // Entferne alle nicht-numerischen Zeichen
    const cleaned = phone.replace(/\D/g, '');
    
    // Formatiere deutsche Nummern
    if (cleaned.startsWith('49')) {
        const match = cleaned.match(/^(\d{2})(\d{2,4})(\d{3,8})$/);
        if (match) {
            return `+${match[1]} ${match[2]} ${match[3]}`;
        }
    }
    
    // Formatiere Nummern mit führender 0
    if (cleaned.startsWith('0')) {
        const match = cleaned.match(/^(0\d{2,4})(\d{3,8})$/);
        if (match) {
            return `${match[1]} ${match[2]}`;
        }
    }
    
    return phone;
};