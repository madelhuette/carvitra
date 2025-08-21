"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/base/input/input";
import { TextArea } from "@/components/base/textarea/textarea";
import { Label } from "@/components/base/input/label";
import { HintText } from "@/components/base/input/hint-text";
import { Button } from "@/components/base/buttons/button";
import { FileUpload } from "@/components/application/file-upload/file-upload-base";
import { 
  Building07, 
  Globe01,
  Phone,
  Mail01,
  MapPin,
  Upload01,
  Check,
  AlertCircle,
  Lock01
} from "@untitledui/icons";

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string;
  website: string;
  phone: string;
  street: string;
  street_number: string;
  postal_code: string;
  city: string;
  country: string;
  description: string;
}

interface UserProfile {
  role: string;
  organization_id: string;
}

export default function OrganizationSettingsPage() {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const isAdmin = userProfile?.role === 'admin';

  useEffect(() => {
    loadOrganizationData();
  }, []);

  const loadOrganizationData = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Load user profile to get organization_id and role
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('organization_id, role')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;
      setUserProfile(profileData);

      // Load organization data
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', profileData.organization_id)
        .single();

      if (orgError) throw orgError;
      setOrganization(orgData);
    } catch (error) {
      console.error('Error loading organization:', error);
      setErrorMessage('Fehler beim Laden der Organisationsdaten');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!organization || !isAdmin) return;
    
    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const supabase = createClient();
      
      const { error } = await supabase
        .from('organizations')
        .update({
          name: organization.name,
          website: organization.website,
          phone: organization.phone,
          street: organization.street,
          street_number: organization.street_number,
          postal_code: organization.postal_code,
          city: organization.city,
          country: organization.country,
          description: organization.description,
          updated_at: new Date().toISOString()
        })
        .eq('id', organization.id);

      if (error) throw error;

      setSuccessMessage("Änderungen erfolgreich gespeichert");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error('Error saving organization:', error);
      setErrorMessage('Fehler beim Speichern der Änderungen');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (files: File[]) => {
    if (!files[0] || !organization || !isAdmin) return;
    
    setUploadingLogo(true);
    setErrorMessage("");

    try {
      const supabase = createClient();
      const file = files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${organization.id}/logo-${Date.now()}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('organization-logos')
        .upload(fileName, file, {
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('organization-logos')
        .getPublicUrl(fileName);

      // Update organization
      const { error: updateError } = await supabase
        .from('organizations')
        .update({ 
          logo_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', organization.id);

      if (updateError) throw updateError;

      setOrganization({ ...organization, logo_url: publicUrl });
      setSuccessMessage("Logo erfolgreich aktualisiert");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error('Error uploading logo:', error);
      setErrorMessage('Fehler beim Hochladen des Logos');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!organization || !isAdmin) return;
    
    try {
      const supabase = createClient();
      
      const { error } = await supabase
        .from('organizations')
        .update({ 
          logo_url: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', organization.id);

      if (error) throw error;

      setOrganization({ ...organization, logo_url: '' });
      setSuccessMessage("Logo erfolgreich entfernt");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error('Error removing logo:', error);
      setErrorMessage('Fehler beim Entfernen des Logos');
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <p className="text-tertiary">Lade Organisationsdaten...</p>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="p-6 text-center">
        <p className="text-tertiary">Organisation konnte nicht geladen werden</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Admin Access Notice */}
      {!isAdmin && (
        <div className="mb-6 flex items-center gap-2 p-3 rounded-lg bg-warning-subtle border border-warning-subtle">
          <Lock01 className="size-5 text-warning" />
          <p className="text-sm text-warning">
            Nur Administratoren können Organisationsdaten bearbeiten. Sie haben Lesezugriff.
          </p>
        </div>
      )}

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

      {/* Logo Section */}
      <div className="mb-8 pb-8 border-b border-secondary">
        <h2 className="text-lg font-semibold text-primary mb-4">Organisationslogo</h2>
        <div className="rounded-lg border border-secondary p-6">
          <div className="flex items-start gap-6">
            <div className="size-20 rounded-lg bg-secondary flex items-center justify-center overflow-hidden">
              {organization.logo_url ? (
                <img 
                  src={organization.logo_url} 
                  alt="Logo" 
                  className="max-h-full max-w-full object-contain" 
                />
              ) : (
                <Building07 className="size-8 text-quaternary" />
              )}
            </div>
            
            <div className="flex-1">
              <h3 className="text-sm font-medium text-primary">Organisationslogo</h3>
              <p className="text-sm text-tertiary mt-1">
                SVG, PNG oder JPG (max. 2MB). Empfohlen: 200x200px
              </p>
              {isAdmin && (
                <div className="flex gap-3 mt-3">
                  <FileUpload.Trigger
                    accept="image/*"
                    maxSize={2097152}
                    onFile={(file) => handleLogoUpload([file])}
                  >
                    <Button 
                      size="sm" 
                      variant="secondary"
                      iconLeading={Upload01}
                      loading={uploadingLogo}
                      disabled={uploadingLogo}
                    >
                      Logo hochladen
                    </Button>
                  </FileUpload.Trigger>
                  {organization.logo_url && (
                    <Button 
                      size="sm" 
                      variant="ghost"
                      color="destructive"
                      onClick={handleRemoveLogo}
                    >
                      Entfernen
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Organization Information Form */}
      <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
        <div>
          <h2 className="text-lg font-semibold text-primary mb-4">Organisationsdaten</h2>
          
          <div className="grid gap-6">
            {/* Company Name */}
            <div>
              <Label htmlFor="name">Firmenname</Label>
              <Input
                id="name"
                value={organization.name || ''}
                onChange={(value) => setOrganization({ ...organization, name: value })}
                placeholder="Autohaus Mustermann GmbH"
                disabled={!isAdmin}
                iconLeading={Building07}
              />
            </div>

            {/* Website */}
            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={organization.website || ''}
                onChange={(value) => setOrganization({ ...organization, website: value })}
                placeholder="https://www.autohaus-mustermann.de"
                disabled={!isAdmin}
                iconLeading={Globe01}
              />
            </div>

            {/* Phone */}
            <div>
              <Label htmlFor="phone">Telefonnummer</Label>
              <Input
                id="phone"
                type="tel"
                value={organization.phone || ''}
                onChange={(value) => setOrganization({ ...organization, phone: value })}
                placeholder="+49 123 456789"
                disabled={!isAdmin}
                iconLeading={Phone}
              />
            </div>

            {/* Address */}
            <div>
              <h3 className="text-sm font-medium text-primary mb-3">Adresse</h3>
              <div className="grid gap-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="street">Straße</Label>
                    <Input
                      id="street"
                      value={organization.street || ''}
                      onChange={(value) => setOrganization({ ...organization, street: value })}
                      placeholder="Musterstraße"
                      disabled={!isAdmin}
                    />
                  </div>
                  <div>
                    <Label htmlFor="street_number">Hausnummer</Label>
                    <Input
                      id="street_number"
                      value={organization.street_number || ''}
                      onChange={(value) => setOrganization({ ...organization, street_number: value })}
                      placeholder="123"
                      disabled={!isAdmin}
                    />
                  </div>
                </div>
                
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <Label htmlFor="postal_code">PLZ</Label>
                    <Input
                      id="postal_code"
                      value={organization.postal_code || ''}
                      onChange={(value) => setOrganization({ ...organization, postal_code: value })}
                      placeholder="12345"
                      disabled={!isAdmin}
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">Stadt</Label>
                    <Input
                      id="city"
                      value={organization.city || ''}
                      onChange={(value) => setOrganization({ ...organization, city: value })}
                      placeholder="Musterstadt"
                      disabled={!isAdmin}
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">Land</Label>
                    <Input
                      id="country"
                      value={organization.country || ''}
                      onChange={(value) => setOrganization({ ...organization, country: value })}
                      placeholder="Deutschland"
                      disabled={!isAdmin}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Beschreibung</Label>
              <TextArea
                id="description"
                value={organization.description || ''}
                onChange={(value) => setOrganization({ ...organization, description: value })}
                placeholder="Beschreiben Sie Ihr Unternehmen..."
                disabled={!isAdmin}
                rows={4}
              />
              <HintText>
                Diese Beschreibung wird auf Ihren Landing Pages angezeigt
              </HintText>
            </div>
          </div>
        </div>

        {/* Action Buttons - Only show for admins */}
        {isAdmin && (
          <div className="flex justify-end gap-3 pt-6 border-t border-secondary">
            <Button
              variant="secondary"
              onClick={() => loadOrganizationData()}
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
        )}
      </form>
    </div>
  );
}