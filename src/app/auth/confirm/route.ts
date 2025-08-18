import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/dashboard'

  // Erstelle Redirect-URL ohne secret token
  const redirectTo = request.nextUrl.clone()
  redirectTo.pathname = next
  redirectTo.searchParams.delete('token_hash')
  redirectTo.searchParams.delete('type')
  redirectTo.searchParams.delete('next')

  if (token_hash && type) {
    const supabase = await createClient()

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })

    if (!error) {
      // Erfolgreiche Verifizierung - redirect zum Dashboard
      redirectTo.pathname = '/auth/success'
      redirectTo.searchParams.set('type', 'verification')
      return NextResponse.redirect(redirectTo)
    }

    // Fehler bei der Verifizierung
    console.error('Email verification error:', error)
  }

  // Redirect zu Error-Page bei Fehler
  redirectTo.pathname = '/auth/error'
  redirectTo.searchParams.set('message', 'Email-Bestätigung fehlgeschlagen')
  return NextResponse.redirect(redirectTo)
}