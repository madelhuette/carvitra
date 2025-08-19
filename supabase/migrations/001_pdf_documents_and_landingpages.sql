-- ============================================
-- PDF Documents Table (Master Templates)
-- ============================================
CREATE TABLE IF NOT EXISTS pdf_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size_bytes BIGINT,
  extracted_text TEXT,
  extracted_data JSONB DEFAULT '{}'::jsonb,
  processing_status TEXT DEFAULT 'uploaded' CHECK (processing_status IN ('uploaded', 'extracting', 'ready', 'failed')),
  processing_error TEXT,
  page_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index für schnelle Abfragen
CREATE INDEX idx_pdf_documents_organization ON pdf_documents(organization_id);
CREATE INDEX idx_pdf_documents_status ON pdf_documents(processing_status);

-- ============================================
-- Extraction Cache für KI-Ergebnisse
-- ============================================
CREATE TABLE IF NOT EXISTS extraction_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pdf_document_id UUID NOT NULL REFERENCES pdf_documents(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  extracted_value JSONB,
  confidence_score FLOAT CHECK (confidence_score >= 0 AND confidence_score <= 1),
  prompt_version TEXT DEFAULT 'v1',
  model_used TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Unique constraint für field_name pro PDF
  UNIQUE(pdf_document_id, field_name, prompt_version)
);

CREATE INDEX idx_extraction_cache_pdf ON extraction_cache(pdf_document_id);
CREATE INDEX idx_extraction_cache_field ON extraction_cache(field_name);

-- ============================================
-- Landingpages Table
-- ============================================
CREATE TABLE IF NOT EXISTS landingpages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  offer_id UUID NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  template_type TEXT DEFAULT 'modern' CHECK (template_type IN ('modern', 'classic', 'minimal')),
  customization JSONB DEFAULT '{
    "primaryColor": "#0066FF",
    "fontFamily": "Inter",
    "showFinancing": true,
    "showEquipment": true,
    "ctaButtonText": "Jetzt anfragen"
  }'::jsonb,
  seo_metadata JSONB DEFAULT '{}'::jsonb,
  published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  view_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_landingpages_offer ON landingpages(offer_id);
CREATE INDEX idx_landingpages_slug ON landingpages(slug);
CREATE INDEX idx_landingpages_published ON landingpages(published);

-- ============================================
-- Erweitere offers Tabelle
-- ============================================
ALTER TABLE offers 
ADD COLUMN IF NOT EXISTS pdf_document_id UUID REFERENCES pdf_documents(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS template_overrides JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS is_draft BOOLEAN DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_offers_pdf_document ON offers(pdf_document_id);

-- ============================================
-- Lead Capture Table (für Landingpage-Anfragen)
-- ============================================
CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  landingpage_id UUID NOT NULL REFERENCES landingpages(id) ON DELETE CASCADE,
  offer_id UUID NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT,
  financing_interest BOOLEAN DEFAULT false,
  preferred_contact_method TEXT CHECK (preferred_contact_method IN ('email', 'phone', 'whatsapp')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_leads_landingpage ON leads(landingpage_id);
CREATE INDEX idx_leads_offer ON leads(offer_id);
CREATE INDEX idx_leads_created ON leads(created_at DESC);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

-- PDF Documents
ALTER TABLE pdf_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's PDFs" ON pdf_documents
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert PDFs for their organization" ON pdf_documents
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_profiles 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their organization's PDFs" ON pdf_documents
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their organization's PDFs" ON pdf_documents
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles 
      WHERE user_id = auth.uid()
    )
  );

-- Extraction Cache
ALTER TABLE extraction_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view extraction cache for their PDFs" ON extraction_cache
  FOR SELECT USING (
    pdf_document_id IN (
      SELECT id FROM pdf_documents 
      WHERE organization_id IN (
        SELECT organization_id FROM user_profiles 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Service role can manage extraction cache
CREATE POLICY "Service role can manage extraction cache" ON extraction_cache
  FOR ALL USING (auth.role() = 'service_role');

-- Landingpages
ALTER TABLE landingpages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their organization's landingpages" ON landingpages
  FOR ALL USING (
    offer_id IN (
      SELECT id FROM offers 
      WHERE organization_id IN (
        SELECT organization_id FROM user_profiles 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Public can view published landingpages
CREATE POLICY "Public can view published landingpages" ON landingpages
  FOR SELECT USING (published = true);

-- Leads
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view leads for their offers" ON leads
  FOR SELECT USING (
    offer_id IN (
      SELECT id FROM offers 
      WHERE organization_id IN (
        SELECT organization_id FROM user_profiles 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Public can insert leads
CREATE POLICY "Public can insert leads" ON leads
  FOR INSERT WITH CHECK (true);

-- ============================================
-- Functions und Trigger
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_pdf_documents_updated_at 
  BEFORE UPDATE ON pdf_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_landingpages_updated_at 
  BEFORE UPDATE ON landingpages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate unique slug
CREATE OR REPLACE FUNCTION generate_unique_slug(base_text TEXT)
RETURNS TEXT AS $$
DECLARE
  clean_text TEXT;
  new_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Clean and format the text
  clean_text := lower(regexp_replace(base_text, '[^a-zA-Z0-9\s-]', '', 'g'));
  clean_text := regexp_replace(clean_text, '\s+', '-', 'g');
  clean_text := regexp_replace(clean_text, '-+', '-', 'g');
  clean_text := trim(both '-' from clean_text);
  
  new_slug := clean_text;
  
  -- Check for uniqueness and add counter if needed
  WHILE EXISTS (SELECT 1 FROM landingpages WHERE slug = new_slug) LOOP
    counter := counter + 1;
    new_slug := clean_text || '-' || counter;
  END LOOP;
  
  RETURN new_slug;
END;
$$ LANGUAGE plpgsql;

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_landingpage_views(landingpage_slug TEXT)
RETURNS void AS $$
BEGIN
  UPDATE landingpages 
  SET 
    view_count = view_count + 1,
    last_viewed_at = NOW()
  WHERE slug = landingpage_slug AND published = true;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Seed Data for Development
-- ============================================

-- Sample Equipment Categories
INSERT INTO equipment (id, name, category, display_order) VALUES
  (gen_random_uuid(), 'Navigationssystem', 'comfort', 1),
  (gen_random_uuid(), 'Sitzheizung', 'comfort', 2),
  (gen_random_uuid(), 'Klimaautomatik', 'comfort', 3),
  (gen_random_uuid(), 'Parkassistent', 'safety', 4),
  (gen_random_uuid(), 'Spurhalteassistent', 'safety', 5),
  (gen_random_uuid(), 'LED-Scheinwerfer', 'exterior', 6),
  (gen_random_uuid(), 'Panoramadach', 'exterior', 7),
  (gen_random_uuid(), 'Lederausstattung', 'interior', 8)
ON CONFLICT DO NOTHING;

-- Sample Fuel Types
INSERT INTO fuel_types (id, name, display_order) VALUES
  (gen_random_uuid(), 'Benzin', 1),
  (gen_random_uuid(), 'Diesel', 2),
  (gen_random_uuid(), 'Elektro', 3),
  (gen_random_uuid(), 'Hybrid', 4),
  (gen_random_uuid(), 'Plug-in Hybrid', 5)
ON CONFLICT DO NOTHING;

-- Sample Transmission Types
INSERT INTO transmission_types (id, name, display_order) VALUES
  (gen_random_uuid(), 'Schaltgetriebe', 1),
  (gen_random_uuid(), 'Automatik', 2),
  (gen_random_uuid(), 'DSG/Doppelkupplung', 3)
ON CONFLICT DO NOTHING;

-- Sample Vehicle Types
INSERT INTO vehicle_types (id, name, display_order) VALUES
  (gen_random_uuid(), 'Limousine', 1),
  (gen_random_uuid(), 'Kombi', 2),
  (gen_random_uuid(), 'SUV', 3),
  (gen_random_uuid(), 'Cabrio', 4),
  (gen_random_uuid(), 'Coupé', 5),
  (gen_random_uuid(), 'Van', 6),
  (gen_random_uuid(), 'Kleinwagen', 7),
  (gen_random_uuid(), 'Kompaktwagen', 8)
ON CONFLICT DO NOTHING;