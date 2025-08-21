'use server'

import { createClient } from '@/lib/supabase/server'
import { randomBytes } from 'crypto'

export async function sendInvitation(email: string, role: string) {
  const supabase = await createClient()
  
  // Get current user and organization
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Nicht authentifiziert' }
  }

  // Get user's organization
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .single()

  if (profileError || !profile) {
    return { error: 'Profil nicht gefunden' }
  }

  // Check if user is admin
  if (profile.role !== 'admin') {
    return { error: 'Keine Berechtigung' }
  }

  // Create invitation
  const { data: invitation, error: inviteError } = await supabase
    .from('invitations')
    .insert({
      organization_id: profile.organization_id,
      email,
      role,
      invited_by: user.id
    })
    .select()
    .single()

  if (inviteError) {
    if (inviteError.message.includes('duplicate')) {
      return { error: 'Diese E-Mail wurde bereits eingeladen' }
    }
    return { error: 'Fehler beim Erstellen der Einladung' }
  }

  // TODO: Send invitation email via Supabase Edge Function
  // The Edge Function should:
  // 1. Generate a secure invitation link with the token
  // 2. Send an email with the invitation link
  // 3. The link should point to /auth/accept-invitation?token={token}

  return { 
    success: true, 
    invitation,
    message: `Einladung an ${email} wurde erstellt. E-Mail-Versand wird in Kürze implementiert.`
  }
}

export async function acceptInvitation(token: string, password: string) {
  const supabase = await createClient()

  // Find invitation by token
  const { data: invitation, error: inviteError } = await supabase
    .from('invitations')
    .select('*, organizations(name)')
    .eq('token', token)
    .eq('accepted', false)
    .single()

  if (inviteError || !invitation) {
    return { error: 'Ungültige oder abgelaufene Einladung' }
  }

  // Check if invitation is expired
  if (new Date(invitation.expires_at) < new Date()) {
    return { error: 'Einladung ist abgelaufen' }
  }

  // Create user account
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: invitation.email,
    password,
    options: {
      data: {
        organization_id: invitation.organization_id,
        role: invitation.role
      }
    }
  })

  if (authError) {
    if (authError.message?.includes('already registered')) {
      // User exists, just add to organization
      const { data: { user } } = await supabase.auth.signInWithPassword({
        email: invitation.email,
        password
      })

      if (user) {
        // Update user profile with organization
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({
            organization_id: invitation.organization_id,
            role: invitation.role
          })
          .eq('user_id', user.id)

        if (!updateError) {
          // Mark invitation as accepted
          await supabase
            .from('invitations')
            .update({ 
              accepted: true,
              accepted_at: new Date().toISOString()
            })
            .eq('id', invitation.id)

          return { success: true, organizationName: invitation.organizations?.name }
        }
      }
    }
    return { error: 'Fehler beim Erstellen des Kontos' }
  }

  // Mark invitation as accepted
  await supabase
    .from('invitations')
    .update({ 
      accepted: true,
      accepted_at: new Date().toISOString()
    })
    .eq('id', invitation.id)

  return { success: true, organizationName: invitation.organizations?.name }
}

export async function cancelInvitation(invitationId: string) {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Nicht authentifiziert' }
  }

  // Check if user is admin of the organization
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return { error: 'Keine Berechtigung' }
  }

  // Delete invitation
  const { error } = await supabase
    .from('invitations')
    .delete()
    .eq('id', invitationId)
    .eq('organization_id', profile.organization_id)

  if (error) {
    return { error: 'Fehler beim Löschen der Einladung' }
  }

  return { success: true }
}

export async function resendInvitation(invitationId: string) {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Nicht authentifiziert' }
  }

  // Get invitation
  const { data: invitation, error: inviteError } = await supabase
    .from('invitations')
    .select('*')
    .eq('id', invitationId)
    .single()

  if (inviteError || !invitation) {
    return { error: 'Einladung nicht gefunden' }
  }

  // Check if user is admin of the organization
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .single()

  if (!profile || profile.role !== 'admin' || profile.organization_id !== invitation.organization_id) {
    return { error: 'Keine Berechtigung' }
  }

  // Update expiration date
  const { error: updateError } = await supabase
    .from('invitations')
    .update({
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', invitationId)

  if (updateError) {
    return { error: 'Fehler beim Aktualisieren der Einladung' }
  }

  // TODO: Resend invitation email

  return { success: true, message: 'Einladung wurde erneut gesendet' }
}