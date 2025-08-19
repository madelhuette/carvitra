-- ============================================
-- Storage Bucket Setup für PDF-Dokumente
-- ============================================

-- Erstelle Storage Bucket für PDF-Dokumente
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pdf-documents',
  'pdf-documents',
  true, -- Public bucket für einfachen Zugriff (RLS schützt trotzdem)
  10485760, -- 10MB max file size
  ARRAY['application/pdf']::text[]
)
ON CONFLICT (id) DO UPDATE
SET 
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['application/pdf']::text[];

-- Storage Policies für pdf-documents bucket
CREATE POLICY "Users can upload PDFs for their organization" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'pdf-documents' AND
    auth.uid() IN (
      SELECT user_id FROM user_profiles 
      WHERE organization_id::text = (storage.foldername(name))[1]
    )
  );

CREATE POLICY "Users can view PDFs from their organization" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'pdf-documents' AND
    auth.uid() IN (
      SELECT user_id FROM user_profiles 
      WHERE organization_id::text = (storage.foldername(name))[1]
    )
  );

CREATE POLICY "Users can update PDFs from their organization" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'pdf-documents' AND
    auth.uid() IN (
      SELECT user_id FROM user_profiles 
      WHERE organization_id::text = (storage.foldername(name))[1]
    )
  );

CREATE POLICY "Users can delete PDFs from their organization" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'pdf-documents' AND
    auth.uid() IN (
      SELECT user_id FROM user_profiles 
      WHERE organization_id::text = (storage.foldername(name))[1]
    )
  );

-- ============================================
-- Storage Bucket für Fahrzeugbilder
-- ============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vehicle-images',
  'vehicle-images',
  true, -- Public für Landingpages
  5242880, -- 5MB max file size
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE
SET 
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']::text[];

-- Storage Policies für vehicle-images bucket
CREATE POLICY "Users can upload images for their organization" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'vehicle-images' AND
    auth.uid() IN (
      SELECT user_id FROM user_profiles 
      WHERE organization_id::text = (storage.foldername(name))[1]
    )
  );

CREATE POLICY "Public can view vehicle images" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'vehicle-images'
  );

CREATE POLICY "Users can update images from their organization" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'vehicle-images' AND
    auth.uid() IN (
      SELECT user_id FROM user_profiles 
      WHERE organization_id::text = (storage.foldername(name))[1]
    )
  );

CREATE POLICY "Users can delete images from their organization" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'vehicle-images' AND
    auth.uid() IN (
      SELECT user_id FROM user_profiles 
      WHERE organization_id::text = (storage.foldername(name))[1]
    )
  );