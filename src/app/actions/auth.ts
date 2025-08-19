'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { RegisterFormData, LoginFormData } from '@/types/auth'

export async function signup(formData: RegisterFormData) {
  const supabase = await createClient()

  // Erstelle den User in Supabase Auth
  const siteUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:3000';
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
    options: {
      emailRedirectTo: `${siteUrl}/auth/confirm`,
      data: {
        first_name: formData.firstName,
        last_name: formData.lastName,
        company_name: formData.companyName,
        phone: formData.phone,
        accept_marketing: formData.acceptMarketing,
      }
    }
  })

  if (authError) {
    // Prüfe auf spezifische Fehler
    if (authError.message?.includes('already registered')) {
      return { error: 'Diese E-Mail-Adresse ist bereits registriert.' }
    }
    console.error('Signup error:', authError)
    return { error: 'Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.' }
  }

  // Nach erfolgreicher Registrierung zur Success-Page weiterleiten
  revalidatePath('/', 'layout')
  redirect(`/auth/success?type=registration&email=${encodeURIComponent(formData.email)}&name=${encodeURIComponent(formData.firstName)}`)
}

export async function login(formData: LoginFormData) {
  const supabase = await createClient()

  console.log('Login attempt for:', formData.email)

  const { data, error } = await supabase.auth.signInWithPassword({
    email: formData.email,
    password: formData.password,
  })

  if (error) {
    console.error('Login error details:', {
      message: error.message,
      status: error.status,
      code: error.code,
      details: error
    })

    if (error.message?.includes('Invalid login credentials')) {
      return { error: 'Ungültige E-Mail-Adresse oder Passwort.' }
    }
    if (error.message?.includes('Email not confirmed')) {
      return { error: 'Bitte bestätigen Sie zuerst Ihre E-Mail-Adresse.' }
    }
    if (error.message?.includes('Database error')) {
      // Spezifischer Fehler für Datenbankprobleme
      return { error: 'Datenbankfehler. Bitte versuchen Sie es später erneut oder kontaktieren Sie den Support.' }
    }
    return { error: `Anmeldung fehlgeschlagen: ${error.message}` }
  }

  if (!data.user) {
    console.error('Login succeeded but no user data returned')
    return { error: 'Anmeldung fehlgeschlagen. Keine Benutzerdaten erhalten.' }
  }

  console.log('Login successful for user:', data.user.id)

  // Verifiziere, dass der User ein Profil hat
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('*, organizations(*)')
    .eq('user_id', data.user.id)
    .single()

  if (profileError || !profile) {
    console.error('Profile fetch error:', profileError)
    // Profil fehlt, aber User ist authentifiziert - leite trotzdem weiter
    console.warn('User logged in but profile not found, redirecting anyway')
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function logout() {
  const supabase = await createClient()
  
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    console.error('Logout error:', error)
    return { error: 'Abmeldung fehlgeschlagen.' }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function resendConfirmationEmail(email: string) {
  const supabase = await createClient()
  const siteUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:3000';

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: email,
    options: {
      emailRedirectTo: `${siteUrl}/auth/confirm`,
    }
  })

  if (error) {
    console.error('Resend email error:', error)
    return { error: 'E-Mail konnte nicht gesendet werden. Bitte versuchen Sie es später erneut.' }
  }

  return { success: true }
}

export async function resetPassword(email: string) {
  const supabase = await createClient()
  const siteUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:3000';

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/reset-password`,
  })

  if (error) {
    console.error('Reset password error:', error)
    return { error: 'Passwort-Reset fehlgeschlagen. Bitte versuchen Sie es erneut.' }
  }

  return { success: true }
}

export async function updatePassword(newPassword: string) {
  const supabase = await createClient()

  const { error } = await supabase.auth.updateUser({
    password: newPassword
  })

  if (error) {
    console.error('Update password error:', error)
    return { error: 'Passwort konnte nicht geändert werden.' }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}