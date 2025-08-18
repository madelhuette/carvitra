export interface PasswordStrengthInfo {
    text: string;
    color: string;
}

export interface PasswordRequirement {
    text: string;
    met: boolean;
    id: string;
}

export interface ValidationErrors {
    [key: string]: string | undefined;
}

export interface LoginFormData {
    email: string;
    password: string;
    rememberMe: boolean;
}

export interface RegisterFormData {
    firstName: string;
    lastName: string;
    email: string;
    companyName: string;
    phone: string;
    password: string;
    confirmPassword: string;
    acceptTerms: boolean;
    acceptPrivacy: boolean;
    acceptMarketing: boolean;
    userType?: "dealer" | "salesperson"; // Optional for compatibility
}

export interface ForgotPasswordFormData {
    email: string;
}

export interface ResetPasswordFormData {
    password: string;
    confirmPassword: string;
    token: string;
}

export type AuthSuccessType = "registration" | "verification" | "password-reset";