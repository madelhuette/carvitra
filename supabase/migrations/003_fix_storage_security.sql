-- 003_fix_storage_security.sql
-- Kritische Sicherheits-Fixes für PDF Storage
-- Datum: Januar 2025

-- ============================================
-- 1. STORAGE BUCKET SECURITY FIX
-- ============================================

-- Storage Bucket auf PRIVATE setzen (kritisch!)
UPDATE storage.buckets 
SET public = false 
WHERE id = 'pdf-documents';

-- Zweiten Bucket auch auf private setzen
UPDATE storage.buckets 
SET public = false 
WHERE id = 'vehicle-images';

-- ============================================
-- 2. STORAGE RLS POLICIES
-- ============================================

-- Erst alle alten Policies löschen (falls vorhanden)
DROP POLICY IF EXISTS "Users can upload PDFs to own org" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own org PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload images to own org" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own org images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete images" ON storage.objects;

-- ============================================
-- PDF-DOCUMENTS BUCKET POLICIES
-- ============================================

-- INSERT Policy: User kann nur in eigene Organisation hochladen
CREATE POLICY "Users can upload PDFs to own org" 
ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'pdf-documents' AND
  (storage.foldername(name))[1] = (
    SELECT organization_id::text 
    FROM user_profiles 
    WHERE user_id = auth.uid()
  )
);

-- SELECT Policy: User kann nur PDFs der eigenen Organisation sehen
CREATE POLICY "Users can view own org PDFs" 
ON storage.objects
FOR SELECT 
TO authenticated
USING (
  bucket_id = 'pdf-documents' AND
  (storage.foldername(name))[1] IN (
    SELECT organization_id::text 
    FROM user_profiles 
    WHERE user_id = auth.uid()
  )
);

-- UPDATE Policy: Admins können PDFs ihrer Organisation updaten
CREATE POLICY "Admins can update PDFs" 
ON storage.objects
FOR UPDATE 
TO authenticated
USING (
  bucket_id = 'pdf-documents' AND
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND organization_id = (storage.foldername(name))[1]::uuid
    AND role IN ('owner', 'admin')
  )
);

-- DELETE Policy: Nur Admins können PDFs löschen
CREATE POLICY "Admins can delete PDFs" 
ON storage.objects
FOR DELETE 
TO authenticated
USING (
  bucket_id = 'pdf-documents' AND
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND organization_id = (storage.foldername(name))[1]::uuid
    AND role IN ('owner', 'admin')
  )
);

-- ============================================
-- VEHICLE-IMAGES BUCKET POLICIES
-- ============================================

-- INSERT Policy: User kann nur in eigene Organisation hochladen
CREATE POLICY "Users can upload images to own org" 
ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'vehicle-images' AND
  (storage.foldername(name))[1] = (
    SELECT organization_id::text 
    FROM user_profiles 
    WHERE user_id = auth.uid()
  )
);

-- SELECT Policy: User kann nur Bilder der eigenen Organisation sehen
CREATE POLICY "Users can view own org images" 
ON storage.objects
FOR SELECT 
TO authenticated
USING (
  bucket_id = 'vehicle-images' AND
  (storage.foldername(name))[1] IN (
    SELECT organization_id::text 
    FROM user_profiles 
    WHERE user_id = auth.uid()
  )
);

-- UPDATE Policy: Admins können Bilder ihrer Organisation updaten
CREATE POLICY "Admins can update images" 
ON storage.objects
FOR UPDATE 
TO authenticated
USING (
  bucket_id = 'vehicle-images' AND
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND organization_id = (storage.foldername(name))[1]::uuid
    AND role IN ('owner', 'admin')
  )
);

-- DELETE Policy: Nur Admins können Bilder löschen
CREATE POLICY "Admins can delete images" 
ON storage.objects
FOR DELETE 
TO authenticated
USING (
  bucket_id = 'vehicle-images' AND
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid()
    AND organization_id = (storage.foldername(name))[1]::uuid
    AND role IN ('owner', 'admin')
  )
);

-- ============================================
-- 3. ZUSÄTZLICHE SICHERHEITS-CHECKS
-- ============================================

-- Funktion um zu prüfen ob Storage-Pfad zur User-Org gehört
CREATE OR REPLACE FUNCTION storage.validate_org_path(file_path text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND organization_id::text = (string_to_array(file_path, '/'))[1]
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. AUDIT LOG für Storage-Zugriffe
-- ============================================

-- Tabelle für Storage-Audit-Log
CREATE TABLE IF NOT EXISTS storage_audit_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  organization_id uuid REFERENCES organizations(id),
  bucket_id text NOT NULL,
  file_path text NOT NULL,
  action text NOT NULL CHECK (action IN ('upload', 'download', 'delete', 'update')),
  file_size_bytes bigint,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Index für Performance
CREATE INDEX idx_storage_audit_org ON storage_audit_log(organization_id);
CREATE INDEX idx_storage_audit_user ON storage_audit_log(user_id);
CREATE INDEX idx_storage_audit_created ON storage_audit_log(created_at);

-- RLS für Audit-Log (nur eigene Org)
ALTER TABLE storage_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org audit logs"
ON storage_audit_log
FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id 
    FROM user_profiles 
    WHERE user_id = auth.uid()
  )
);

-- ============================================
-- 5. RATE LIMITING VORBEREITUNG
-- ============================================

-- Tabelle für Upload-Rate-Limiting
CREATE TABLE IF NOT EXISTS upload_rate_limits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid REFERENCES organizations(id),
  user_id uuid REFERENCES auth.users(id),
  upload_count int DEFAULT 0,
  upload_bytes bigint DEFAULT 0,
  window_start timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Unique constraint für User pro Zeitfenster
CREATE UNIQUE INDEX idx_rate_limit_user_window 
ON upload_rate_limits(user_id, window_start);

-- RLS für Rate Limits
ALTER TABLE upload_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rate limits"
ON upload_rate_limits
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- ============================================
-- VERIFIKATION
-- ============================================

-- Check ob Buckets jetzt privat sind
SELECT id, name, public, created_at 
FROM storage.buckets 
WHERE id IN ('pdf-documents', 'vehicle-images');

-- Check ob Policies erstellt wurden
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage';

-- Erfolgreiche Migration
COMMENT ON SCHEMA storage IS 'Storage security hardened - January 2025';