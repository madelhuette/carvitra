"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Label } from "@/components/base/input/label";
import { Select } from "@/components/base/select/select";
import { Badge } from "@/components/base/badges/badges";
import { Avatar } from "@/components/base/avatar/avatar";
import { 
  UserPlus02,
  Mail01,
  Check,
  AlertCircle,
  Lock01,
  Trash01,
  Edit03,
  Send01
} from "@untitledui/icons";

interface TeamMember {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  position: string;
  avatar_url: string;
  is_active: boolean;
  created_at: string;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  invited_by: string;
  created_at: string;
  expires_at: string;
  accepted: boolean;
}

interface UserProfile {
  role: string;
  organization_id: string;
}

export default function TeamSettingsPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [sendingInvite, setSendingInvite] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const isAdmin = userProfile?.role === 'admin';

  useEffect(() => {
    loadTeamData();
  }, []);

  const loadTeamData = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Load user profile
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('organization_id, role')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;
      setUserProfile(profileData);

      // Load team members
      const { data: membersData, error: membersError } = await supabase
        .from('user_profiles')
        .select('*, auth.users!inner(email)')
        .eq('organization_id', profileData.organization_id)
        .order('created_at', { ascending: false });

      if (membersError) throw membersError;

      // Transform data to include email
      const members = membersData.map(member => ({
        ...member,
        email: member.auth?.users?.email || ''
      }));
      setTeamMembers(members);

      // Load pending invitations (admin only)
      if (profileData.role === 'admin') {
        const { data: invitesData, error: invitesError } = await supabase
          .from('invitations')
          .select('*')
          .eq('organization_id', profileData.organization_id)
          .eq('accepted', false)
          .order('created_at', { ascending: false });

        if (!invitesError && invitesData) {
          setInvitations(invitesData);
        }
      }
    } catch (error) {
      console.error('Error loading team data:', error);
      setErrorMessage('Fehler beim Laden der Team-Daten');
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvite = async () => {
    if (!inviteEmail || !userProfile) return;
    
    setSendingInvite(true);
    setErrorMessage("");

    try {
      const supabase = createClient();
      
      // Create invitation
      const { data: invitation, error: inviteError } = await supabase
        .from('invitations')
        .insert({
          organization_id: userProfile.organization_id,
          email: inviteEmail,
          role: inviteRole,
          invited_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (inviteError) {
        if (inviteError.message.includes('duplicate')) {
          throw new Error('Diese E-Mail wurde bereits eingeladen');
        }
        throw inviteError;
      }

      // TODO: Send invitation email via Edge Function
      // For now, just show success message with the token
      console.log('Invitation created:', invitation);

      setInvitations([invitation, ...invitations]);
      setInviteModalOpen(false);
      setInviteEmail("");
      setInviteRole("member");
      setSuccessMessage(`Einladung an ${inviteEmail} erfolgreich gesendet`);
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (error: any) {
      console.error('Error sending invite:', error);
      setErrorMessage(error.message || 'Fehler beim Senden der Einladung');
    } finally {
      setSendingInvite(false);
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    if (!isAdmin) return;

    try {
      const supabase = createClient();
      
      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          role: newRole,
          updated_at: new Date().toISOString()
        })
        .eq('id', memberId);

      if (error) throw error;

      setTeamMembers(members => 
        members.map(m => m.id === memberId ? { ...m, role: newRole } : m)
      );
      
      setSuccessMessage('Rolle erfolgreich aktualisiert');
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error('Error updating role:', error);
      setErrorMessage('Fehler beim Aktualisieren der Rolle');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!isAdmin) return;
    
    if (!confirm('Möchten Sie dieses Mitglied wirklich entfernen?')) return;

    try {
      const supabase = createClient();
      
      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', memberId);

      if (error) throw error;

      setTeamMembers(members => members.filter(m => m.id !== memberId));
      setSuccessMessage('Mitglied erfolgreich entfernt');
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error('Error removing member:', error);
      setErrorMessage('Fehler beim Entfernen des Mitglieds');
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (!isAdmin) return;

    try {
      const supabase = createClient();
      
      const { error } = await supabase
        .from('invitations')
        .delete()
        .eq('id', invitationId);

      if (error) throw error;

      setInvitations(invitations.filter(i => i.id !== invitationId));
      setSuccessMessage('Einladung erfolgreich zurückgezogen');
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error('Error canceling invitation:', error);
      setErrorMessage('Fehler beim Zurückziehen der Einladung');
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <p className="text-tertiary">Lade Team-Daten...</p>
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
            Nur Administratoren können Team-Mitglieder verwalten. Sie haben Lesezugriff.
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

      {/* Team Members Table */}
      <Table.Card size="md" className="mb-6">
        <Table.CardHeader
          title="Team-Mitglieder"
          badge={teamMembers.length.toString()}
          description="Verwalten Sie Ihr Team und deren Berechtigungen"
          contentTrailing={
            isAdmin && (
              <Button 
                size="sm"
                iconLeading={UserPlus02}
                onClick={() => setInviteModalOpen(true)}
              >
                Mitglied einladen
              </Button>
            )
          }
        />
        
        <Table.Root>
          <Table.Header>
            <Table.Column>Name</Table.Column>
            <Table.Column>E-Mail</Table.Column>
            <Table.Column>Rolle</Table.Column>
            <Table.Column>Status</Table.Column>
            {isAdmin && <Table.Column>Aktionen</Table.Column>}
          </Table.Header>
          
          <Table.Body>
            {teamMembers.map(member => (
              <Table.Row key={member.id}>
                <Table.Cell>
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={member.avatar_url}
                      initials={`${member.first_name?.[0] || ''}${member.last_name?.[0] || ''}`}
                      size="sm"
                    />
                    <div>
                      <p className="text-sm font-medium text-primary">
                        {member.first_name} {member.last_name}
                      </p>
                      {member.position && (
                        <p className="text-xs text-tertiary">
                          {member.position}
                        </p>
                      )}
                    </div>
                  </div>
                </Table.Cell>
                <Table.Cell>{member.email}</Table.Cell>
                <Table.Cell>
                  {isAdmin ? (
                    <Select
                      value={member.role}
                      onChange={(value) => handleUpdateRole(member.id, value)}
                      size="sm"
                    >
                      <Select.Item value="admin">Administrator</Select.Item>
                      <Select.Item value="member">Mitglied</Select.Item>
                    </Select>
                  ) : (
                    <Badge 
                      color={member.role === 'admin' ? 'brand' : 'gray'}
                      type="pill-color"
                    >
                      {member.role === 'admin' ? 'Administrator' : 'Mitglied'}
                    </Badge>
                  )}
                </Table.Cell>
                <Table.Cell>
                  <Badge 
                    color={member.is_active ? 'success' : 'gray'}
                    type="pill-color"
                  >
                    {member.is_active ? 'Aktiv' : 'Inaktiv'}
                  </Badge>
                </Table.Cell>
                {isAdmin && (
                  <Table.Cell>
                    <TableRowActionsDropdown
                      items={[
                        {
                          label: 'Rolle ändern',
                          icon: Edit03,
                          onClick: () => {
                            // Role change is handled inline
                          }
                        },
                        {
                          label: 'Entfernen',
                          icon: Trash01,
                          onClick: () => handleRemoveMember(member.id),
                          color: 'destructive'
                        }
                      ]}
                    />
                  </Table.Cell>
                )}
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Table.Card>

      {/* Pending Invitations - Admin only */}
      {isAdmin && invitations.length > 0 && (
        <Table.Card size="md">
          <Table.CardHeader
            title="Ausstehende Einladungen"
            badge={invitations.length.toString()}
            description="Noch nicht angenommene Einladungen"
          />
          
          <Table.Root>
            <Table.Header>
              <Table.Column>E-Mail</Table.Column>
              <Table.Column>Rolle</Table.Column>
              <Table.Column>Eingeladen am</Table.Column>
              <Table.Column>Aktionen</Table.Column>
            </Table.Header>
            
            <Table.Body>
              {invitations.map(invitation => (
                <Table.Row key={invitation.id}>
                  <Table.Cell>{invitation.email}</Table.Cell>
                  <Table.Cell>
                    <Badge 
                      color={invitation.role === 'admin' ? 'brand' : 'gray'}
                      type="pill-color"
                    >
                      {invitation.role === 'admin' ? 'Administrator' : 'Mitglied'}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    {new Date(invitation.created_at).toLocaleDateString('de-DE')}
                  </Table.Cell>
                  <Table.Cell>
                    <Button
                      size="sm"
                      variant="ghost"
                      color="destructive"
                      onClick={() => handleCancelInvitation(invitation.id)}
                    >
                      Zurückziehen
                    </Button>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Table.Card>
      )}

      {/* Invite Modal */}
      <Modal
        open={inviteModalOpen}
        onOpenChange={setInviteModalOpen}
      >
        <Dialog
          title="Team-Mitglied einladen"
          description="Senden Sie eine Einladung an ein neues Team-Mitglied"
          onClose={() => setInviteModalOpen(false)}
        >
          <div className="space-y-4">
            <div>
              <Label htmlFor="inviteEmail">E-Mail-Adresse</Label>
              <Input
                id="inviteEmail"
                type="email"
                value={inviteEmail}
                onChange={setInviteEmail}
                placeholder="kollege@autohaus.de"
                iconLeading={Mail01}
              />
            </div>
            
            <div>
              <Label htmlFor="inviteRole">Rolle</Label>
              <Select
                id="inviteRole"
                value={inviteRole}
                onChange={setInviteRole}
              >
                <Select.Item value="admin">Administrator</Select.Item>
                <Select.Item value="member">Mitglied</Select.Item>
              </Select>
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setInviteModalOpen(false);
                  setInviteEmail("");
                  setInviteRole("member");
                }}
              >
                Abbrechen
              </Button>
              <Button
                onClick={handleSendInvite}
                loading={sendingInvite}
                disabled={!inviteEmail || sendingInvite}
                iconLeading={Send01}
              >
                Einladung senden
              </Button>
            </div>
          </div>
        </Dialog>
      </Modal>
    </div>
  );
}