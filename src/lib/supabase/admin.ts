import { createClient } from '@supabase/supabase-js'

/**
 * WICHTIG: Admin Client mit Service Role Key
 * 
 * NUR VERWENDEN FÜR:
 * - Datenbank-Migrationen
 * - Batch-Updates ohne User-Kontext
 * - System-weite Administrative Tasks
 * - Cleanup-Jobs und Maintenance
 * 
 * NIEMALS VERWENDEN FÜR:
 * - User-Authentifizierung
 * - User-spezifische Datenabfragen
 * - Normale Application-Logic
 * 
 * Der Service Role Key umgeht ALLE RLS-Policies!
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing Supabase environment variables for admin client')
  }

  // Admin Client mit Service Role - umgeht RLS!
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

/**
 * Beispiel für legitime Admin-Operationen
 */
export async function performSystemMaintenance() {
  const adminClient = createAdminClient()
  
  // Beispiel: Cleanup alter Einträge
  const { error } = await adminClient
    .from('audit_logs')
    .delete()
    .lt('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
  
  if (error) {
    console.error('Maintenance error:', error)
  }
}

/**
 * Beispiel: Batch-Update für System-Migration
 */
export async function migrateDataStructure() {
  const adminClient = createAdminClient()
  
  // Nur für einmalige Migrationen ohne User-Kontext
  // NICHT für normale User-Operationen!
}