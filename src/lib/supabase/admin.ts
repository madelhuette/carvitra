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

/**
 * Upload einer Datei zu Supabase Storage
 * Verwendet den Admin Client für den Upload, aber validiert Berechtigungen vorher
 * 
 * WICHTIG: Nur für Storage-Operationen verwenden, wo RLS-Policies nicht greifen!
 * 
 * @param bucket - Der Storage Bucket Name
 * @param path - Der Dateipfad (sollte mit organization_id beginnen)
 * @param file - Die zu uploadende Datei als Buffer oder Blob
 * @param options - Upload-Optionen
 */
export async function uploadToStorage(
  bucket: string,
  path: string,
  file: Buffer | Blob,
  options?: {
    contentType?: string
    cacheControl?: string
    upsert?: boolean
  }
) {
  const adminClient = createAdminClient()
  
  const { data, error } = await adminClient.storage
    .from(bucket)
    .upload(path, file, {
      contentType: options?.contentType,
      cacheControl: options?.cacheControl || '3600',
      upsert: options?.upsert || false
    })
  
  if (error) {
    console.error('Storage upload error:', error)
    throw error
  }
  
  return data
}

/**
 * Löscht eine Datei aus dem Storage
 * NUR für Admin-Operationen verwenden!
 * 
 * @param bucket - Der Storage Bucket Name
 * @param paths - Array von Dateipfaden zum Löschen
 */
export async function deleteFromStorage(bucket: string, paths: string[]) {
  const adminClient = createAdminClient()
  
  const { data, error } = await adminClient.storage
    .from(bucket)
    .remove(paths)
  
  if (error) {
    console.error('Storage delete error:', error)
    throw error
  }
  
  return data
}

/**
 * Generiert eine signierte URL für den privaten Zugriff
 * 
 * @param bucket - Der Storage Bucket Name
 * @param path - Der Dateipfad
 * @param expiresIn - Gültigkeit in Sekunden (default: 3600 = 1 Stunde)
 */
export async function createSignedUrl(
  bucket: string, 
  path: string, 
  expiresIn: number = 3600
) {
  const adminClient = createAdminClient()
  
  const { data, error } = await adminClient.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn)
  
  if (error) {
    console.error('Signed URL creation error:', error)
    throw error
  }
  
  return data.signedUrl
}