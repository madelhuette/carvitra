import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database.types'

/**
 * Server-seitiger Supabase Client
 * 
 * Verwendet den ANON_KEY mit Session-basierter Authentifizierung.
 * Dieser Client respektiert RLS-Policies basierend auf dem authentifizierten User.
 * 
 * Für alle User-bezogenen Operationen verwenden!
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

/**
 * Holt den aktuell authentifizierten User über die Session
 * 
 * Dies ist die KORREKTE Methode für User-Authentifizierung!
 * Verwendet den normalen Client mit ANON_KEY, nicht den Admin Client.
 */
export async function getUser() {
  const supabase = await createClient()
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      return null
    }
    
    return user
  } catch (error) {
    console.error('Error getting user from session:', error)
    return null
  }
}

/**
 * Holt das User-Profil mit Organisation
 */
export async function getUserProfile() {
  const supabase = await createClient()
  const user = await getUser()
  
  if (!user) return null
  
  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('*, organizations(*)')
    .eq('user_id', user.id)
    .single()
  
  if (error) {
    console.error('Error fetching user profile:', error)
    return null
  }
  
  return profile
}

/**
 * Prüft ob der User authentifiziert ist
 */
export async function isAuthenticated() {
  const user = await getUser()
  return !!user
}