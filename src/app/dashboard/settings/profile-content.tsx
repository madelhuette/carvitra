"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/base/input/input";
import { Label } from "@/components/base/input/label";
import { HintText } from "@/components/base/input/hint-text";
import { Button } from "@/components/base/buttons/button";
import { AvatarProfilePhoto } from "@/components/base/avatar/avatar-profile-photo";
import { AvatarUploadModal } from "@/components/application/avatar-upload/avatar-upload-modal";
import { 
  Mail01, 
  Phone, 
  Upload01,
  User01
} from "@untitledui/icons";
import { Alert } from "@/components/base/alert/alert";

interface UserProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  mobile: string;
  position: string;
  department: string;
  avatar_url: string;
}

export function ProfileContent() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  // Auto-dismiss success messages after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage("");
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const loadProfile = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Load user profile
      const { data: profileData, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      // Add email from auth user
      setProfile({
        ...profileData,
        email: user.email || ''
      });
    } catch (error) {
      console.error('Error loading profile:', error);
      setErrorMessage('Fehler beim Laden des Profils');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    
    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const supabase = createClient();
      
      const { error } = await supabase
        .from('user_profiles')
        .update({
          first_name: profile.first_name,
          last_name: profile.last_name,
          phone: profile.phone,
          mobile: profile.mobile,
          position: profile.position,
          department: profile.department,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (error) throw error;

      setSuccessMessage("Änderungen erfolgreich gespeichert");
    } catch (error) {
      console.error('Error saving profile:', error);
      setErrorMessage('Fehler beim Speichern der Änderungen');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (blob: Blob) => {
    if (!profile) return;
    
    setErrorMessage("");

    try {
      const supabase = createClient();
      const fileName = `${profile.user_id}/avatar-${Date.now()}.jpg`;

      // Upload to storage
      const { error: uploadError, data } = await supabase.storage
        .from('user-avatars')
        .upload(fileName, blob, {
          upsert: true,
          contentType: 'image/jpeg'
        });

      if (uploadError) throw uploadError;

      // Get public URL with cache busting
      const { data: { publicUrl } } = supabase.storage
        .from('user-avatars')
        .getPublicUrl(fileName);
      
      // Add timestamp for cache busting
      const avatarUrlWithTimestamp = `${publicUrl}?t=${Date.now()}`;

      // Update profile
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ 
          avatar_url: avatarUrlWithTimestamp,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      setProfile({ ...profile, avatar_url: avatarUrlWithTimestamp });
      setSuccessMessage("Profilbild erfolgreich aktualisiert");
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setErrorMessage('Fehler beim Hochladen des Profilbilds');
      throw error; // Re-throw to handle in modal
    }
  };

  const handleRemoveAvatar = async () => {
    if (!profile) return;
    
    try {
      const supabase = createClient();
      
      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          avatar_url: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (error) throw error;

      setProfile({ ...profile, avatar_url: '' });
      setSuccessMessage("Profilbild erfolgreich entfernt");
    } catch (error) {
      console.error('Error removing avatar:', error);
      setErrorMessage('Fehler beim Entfernen des Profilbilds');
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <p className="text-tertiary">Lade Profildaten...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6 text-center">
        <p className="text-tertiary">Profil konnte nicht geladen werden</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Success/Error Messages */}
      {successMessage && (
        <Alert
          variant="success"
          description={successMessage}
          className="mb-6"
          dismissible
          onDismiss={() => setSuccessMessage("")}
        />
      )}
      
      {errorMessage && (
        <Alert
          variant="error"
          description={errorMessage}
          className="mb-6"
          dismissible
          onDismiss={() => setErrorMessage("")}
        />
      )}

      {/* Profile Photo Section */}
      <div className="mb-8 pb-8 border-b border-secondary">
        <h2 className="text-lg font-semibold text-primary mb-4">Profilbild</h2>
        <div className="flex items-center gap-6">
          <AvatarProfilePhoto
            size="lg"
            src={profile.avatar_url}
            initials={`${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`}
            alt={`${profile.first_name} ${profile.last_name}`}
          />
          
          <div className="flex flex-col gap-3">
            <div>
              <h3 className="text-sm font-medium text-primary">Profilfoto</h3>
              <p className="text-sm text-tertiary">
                JPG, PNG oder GIF (max. 1MB)
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                size="sm" 
                color="secondary"
                iconLeading={Upload01}
                onClick={() => setUploadModalOpen(true)}
              >
                Foto hochladen
              </Button>
              {profile.avatar_url && (
                <Button 
                  size="sm" 
                  color="tertiary"
                  onClick={handleRemoveAvatar}
                >
                  Entfernen
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Personal Information Form */}
      <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
        <div>
          <h2 className="text-lg font-semibold text-primary mb-4">Persönliche Informationen</h2>
          
          <div className="grid gap-6">
            {/* Name Fields */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="firstName">Vorname</Label>
                <Input
                  id="firstName"
                  value={profile.first_name || ''}
                  onChange={(value) => setProfile({ ...profile, first_name: value })}
                  placeholder="Max"
                />
              </div>
              
              <div>
                <Label htmlFor="lastName">Nachname</Label>
                <Input
                  id="lastName"
                  value={profile.last_name || ''}
                  onChange={(value) => setProfile({ ...profile, last_name: value })}
                  placeholder="Mustermann"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email">E-Mail-Adresse</Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                disabled
                iconLeading={Mail01}
              />
              <HintText>
                Ihre primäre E-Mail-Adresse für Anmeldung und Benachrichtigungen
              </HintText>
            </div>

            {/* Phone Numbers */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="phone">Telefonnummer</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={profile.phone || ''}
                  onChange={(value) => setProfile({ ...profile, phone: value })}
                  placeholder="+49 123 456789"
                  iconLeading={Phone}
                />
              </div>
              
              <div>
                <Label htmlFor="mobile">Mobilnummer</Label>
                <Input
                  id="mobile"
                  type="tel"
                  value={profile.mobile || ''}
                  onChange={(value) => setProfile({ ...profile, mobile: value })}
                  placeholder="+49 170 1234567"
                  iconLeading={Phone}
                />
              </div>
            </div>

            {/* Position & Department */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="position">Position</Label>
                <Input
                  id="position"
                  value={profile.position || ''}
                  onChange={(value) => setProfile({ ...profile, position: value })}
                  placeholder="Verkaufsberater"
                />
              </div>
              
              <div>
                <Label htmlFor="department">Abteilung</Label>
                <Input
                  id="department"
                  value={profile.department || ''}
                  onChange={(value) => setProfile({ ...profile, department: value })}
                  placeholder="Verkauf"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-6 border-t border-secondary">
          <Button
            color="secondary"
            onClick={() => loadProfile()}
          >
            Abbrechen
          </Button>
          <Button
            type="submit"
            loading={saving}
            disabled={saving}
          >
            Änderungen speichern
          </Button>
        </div>
      </form>

      {/* Avatar Upload Modal */}
      <AvatarUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onUpload={handleAvatarUpload}
        currentAvatar={profile.avatar_url}
      />
    </div>
  );
}