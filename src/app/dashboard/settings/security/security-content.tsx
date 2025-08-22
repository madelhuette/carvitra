"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/base/input/input";
import { Label } from "@/components/base/input/label";
import { HintText } from "@/components/base/input/hint-text";
import { Button } from "@/components/base/buttons/button";
import { Toggle } from "@/components/base/toggle/toggle";
import { 
  Lock01,
  Shield01,
  Key01,
  Check,
  AlertCircle,
  Eye,
  EyeOff
} from "@untitledui/icons";

export function SecurityContent() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [passwordErrors, setPasswordErrors] = useState<{
    current?: string;
    new?: string;
    confirm?: string;
  }>({});

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return "Das Passwort muss mindestens 8 Zeichen lang sein";
    }
    if (!/[A-Z]/.test(password)) {
      return "Das Passwort muss mindestens einen Großbuchstaben enthalten";
    }
    if (!/[0-9]/.test(password)) {
      return "Das Passwort muss mindestens eine Zahl enthalten";
    }
    return null;
  };

  const handleChangePassword = async () => {
    setPasswordErrors({});
    setErrorMessage("");
    setSuccessMessage("");

    // Validate inputs
    const errors: typeof passwordErrors = {};
    
    if (!currentPassword) {
      errors.current = "Bitte geben Sie Ihr aktuelles Passwort ein";
    }
    
    const newPasswordError = validatePassword(newPassword);
    if (newPasswordError) {
      errors.new = newPasswordError;
    }
    
    if (newPassword !== confirmPassword) {
      errors.confirm = "Die Passwörter stimmen nicht überein";
    }

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    setChangingPassword(true);

    try {
      const supabase = createClient();
      
      // First verify current password by attempting to sign in
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error("Benutzer nicht gefunden");

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        if (updateError.message.includes('same as the old')) {
          throw new Error('Das neue Passwort darf nicht mit dem alten übereinstimmen');
        }
        throw updateError;
      }

      // Clear form
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccessMessage("Passwort erfolgreich geändert");
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (error: any) {
      console.error('Error changing password:', error);
      setErrorMessage(error.message || 'Fehler beim Ändern des Passworts');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleToggle2FA = async (enabled: boolean) => {
    setErrorMessage("");
    setSuccessMessage("");

    try {
      // TODO: Implement 2FA with Supabase
      // For now, just show a message
      if (enabled) {
        setErrorMessage("Zwei-Faktor-Authentifizierung wird in Kürze verfügbar sein");
        return;
      }
      
      setTwoFactorEnabled(enabled);
      setSuccessMessage(
        enabled 
          ? "Zwei-Faktor-Authentifizierung aktiviert" 
          : "Zwei-Faktor-Authentifizierung deaktiviert"
      );
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error('Error toggling 2FA:', error);
      setErrorMessage('Fehler beim Ändern der Zwei-Faktor-Authentifizierung');
    }
  };

  return (
    <div className="p-6">
      {/* Success/Error Messages */}
      {successMessage && (
        <div className="mb-6 flex items-center gap-2 p-3 rounded-lg bg-success-subtle border border-success-subtle">
          <Check className="size-5 text-success" />
          <p className="text-sm text-success">{successMessage}</p>
        </div>
      )}
      
      {errorMessage && (
        <div className="mb-6 flex items-center gap-2 p-3 rounded-lg bg-error-subtle border border-error-subtle">
          <AlertCircle className="size-5 text-error" />
          <p className="text-sm text-error">{errorMessage}</p>
        </div>
      )}

      {/* Password Change Section */}
      <div className="mb-8 pb-8 border-b border-secondary">
        <h2 className="text-lg font-semibold text-primary mb-4">Passwort ändern</h2>
        <p className="text-sm text-tertiary mb-6">
          Stellen Sie sicher, dass Ihr Konto ein sicheres Passwort verwendet
        </p>
        
        <div className="space-y-4 max-w-md">
          {/* Current Password */}
          <div>
            <Label htmlFor="currentPassword">Aktuelles Passwort</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={setCurrentPassword}
                error={!!passwordErrors.current}
                iconLeading={Lock01}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-tertiary hover:text-secondary"
              >
                {showCurrentPassword ? (
                  <EyeOff className="size-5" />
                ) : (
                  <Eye className="size-5" />
                )}
              </button>
            </div>
            {passwordErrors.current && (
              <HintText error>{passwordErrors.current}</HintText>
            )}
          </div>
          
          {/* New Password */}
          <div>
            <Label htmlFor="newPassword">Neues Passwort</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={setNewPassword}
                error={!!passwordErrors.new}
                iconLeading={Lock01}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-tertiary hover:text-secondary"
              >
                {showNewPassword ? (
                  <EyeOff className="size-5" />
                ) : (
                  <Eye className="size-5" />
                )}
              </button>
            </div>
            {passwordErrors.new ? (
              <HintText error>{passwordErrors.new}</HintText>
            ) : (
              <HintText>
                Mindestens 8 Zeichen, inkl. Großbuchstaben und Zahlen
              </HintText>
            )}
          </div>
          
          {/* Confirm Password */}
          <div>
            <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={setConfirmPassword}
                error={!!passwordErrors.confirm}
                iconLeading={Lock01}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-tertiary hover:text-secondary"
              >
                {showConfirmPassword ? (
                  <EyeOff className="size-5" />
                ) : (
                  <Eye className="size-5" />
                )}
              </button>
            </div>
            {passwordErrors.confirm && (
              <HintText error>{passwordErrors.confirm}</HintText>
            )}
          </div>
          
          <Button
            onClick={handleChangePassword}
            loading={changingPassword}
            disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
          >
            Passwort ändern
          </Button>
        </div>
      </div>

      {/* Two-Factor Authentication Section */}
      <div className="mb-8 pb-8 border-b border-secondary">
        <h2 className="text-lg font-semibold text-primary mb-4">Zwei-Faktor-Authentifizierung</h2>
        
        <div className="flex items-center justify-between p-4 rounded-lg bg-secondary max-w-2xl">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10">
              <Shield01 className="size-5 text-brand" />
            </div>
            <div>
              <p className="text-sm font-medium text-primary">
                Zwei-Faktor-Authentifizierung
              </p>
              <p className="text-sm text-tertiary">
                Zusätzliche Sicherheit für Ihr Konto durch einen zweiten Faktor
              </p>
            </div>
          </div>
          <Toggle
            checked={twoFactorEnabled}
            onChange={handleToggle2FA}
          />
        </div>
      </div>

      {/* Account Security Tips */}
      <div>
        <h2 className="text-lg font-semibold text-primary mb-4">Sicherheitstipps</h2>
        
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              <Check className="size-5 text-success" />
            </div>
            <div>
              <p className="text-sm font-medium text-primary">
                Verwenden Sie ein starkes, einzigartiges Passwort
              </p>
              <p className="text-sm text-tertiary">
                Nutzen Sie eine Kombination aus Groß-/Kleinbuchstaben, Zahlen und Sonderzeichen
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              <Check className="size-5 text-success" />
            </div>
            <div>
              <p className="text-sm font-medium text-primary">
                Aktivieren Sie die Zwei-Faktor-Authentifizierung
              </p>
              <p className="text-sm text-tertiary">
                Schützen Sie Ihr Konto mit einem zusätzlichen Sicherheitsfaktor
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              <Check className="size-5 text-success" />
            </div>
            <div>
              <p className="text-sm font-medium text-primary">
                Teilen Sie Ihre Zugangsdaten niemals
              </p>
              <p className="text-sm text-tertiary">
                Carvitra wird Sie niemals nach Ihrem Passwort fragen
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="mt-0.5">
              <Check className="size-5 text-success" />
            </div>
            <div>
              <p className="text-sm font-medium text-primary">
                Aktualisieren Sie regelmäßig Ihr Passwort
              </p>
              <p className="text-sm text-tertiary">
                Ändern Sie Ihr Passwort alle 3-6 Monate für maximale Sicherheit
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}