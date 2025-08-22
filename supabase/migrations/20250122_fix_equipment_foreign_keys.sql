-- Migration: Fix Equipment Foreign Keys and Categories
-- Datum: 2025-01-22
-- Zweck: Behebt fehlende Foreign Keys und inkonsistente Kategorien

-- 1. KRITISCH: Fehlender Foreign Key für offer_equipment.offer_id hinzufügen
ALTER TABLE offer_equipment 
DROP CONSTRAINT IF EXISTS offer_equipment_offer_id_fkey;

ALTER TABLE offer_equipment 
ADD CONSTRAINT offer_equipment_offer_id_fkey 
FOREIGN KEY (offer_id) 
REFERENCES offer(id) 
ON DELETE CASCADE;

-- 2. Equipment-Kategorien normalisieren (Englisch als Standard)
-- Erst sicherstellen, dass alle benötigten Kategorien existieren
INSERT INTO equipment_categories (id, name, display_order, created_at) 
VALUES 
  (gen_random_uuid(), 'safety', 1, NOW()),
  (gen_random_uuid(), 'comfort', 2, NOW()),
  (gen_random_uuid(), 'assistance', 3, NOW()),
  (gen_random_uuid(), 'infotainment', 4, NOW()),
  (gen_random_uuid(), 'performance', 5, NOW()),
  (gen_random_uuid(), 'exterior', 6, NOW()),
  (gen_random_uuid(), 'interior', 7, NOW()),
  (gen_random_uuid(), 'lighting', 8, NOW()),
  (gen_random_uuid(), 'other', 9, NOW())
ON CONFLICT (name) DO NOTHING;

-- 3. Equipment-Tabelle: Kategorie-Strings auf konsistente englische Werte normalisieren
UPDATE equipment 
SET category = CASE 
  WHEN LOWER(category) IN ('sicherheit', 'safety') THEN 'safety'
  WHEN LOWER(category) IN ('komfort', 'comfort') THEN 'comfort'
  WHEN LOWER(category) IN ('assistenzsysteme', 'assistance', 'assistenz') THEN 'assistance'
  WHEN LOWER(category) IN ('infotainment', 'multimedia', 'entertainment') THEN 'infotainment'
  WHEN LOWER(category) IN ('performance', 'sport', 'leistung') THEN 'performance'
  WHEN LOWER(category) IN ('exterieur', 'exterior', 'außen') THEN 'exterior'
  WHEN LOWER(category) IN ('interieur', 'interior', 'innen') THEN 'interior'
  WHEN LOWER(category) IN ('beleuchtung', 'lighting', 'licht') THEN 'lighting'
  ELSE 'other'
END
WHERE category IS NOT NULL;

-- 4. Neue Spalte für dynamisch erstellte Equipment-Items
ALTER TABLE equipment 
ADD COLUMN IF NOT EXISTS is_custom BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS created_by_organization_id UUID REFERENCES organizations(id),
ADD COLUMN IF NOT EXISTS confidence_score INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'manual';

-- Source kann sein: 'manual', 'pdf_extraction', 'ai_inferred', 'perplexity_research'

-- 5. Index für Performance bei Equipment-Suche
CREATE INDEX IF NOT EXISTS idx_equipment_category ON equipment(category);
CREATE INDEX IF NOT EXISTS idx_equipment_name_search ON equipment USING gin(to_tsvector('german', name));
CREATE INDEX IF NOT EXISTS idx_offer_equipment_offer ON offer_equipment(offer_id);

-- 6. Neue Tabelle für Equipment-Übersetzungen (für Multi-Language-Support)
CREATE TABLE IF NOT EXISTS equipment_translations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  language_code VARCHAR(5) NOT NULL, -- 'de', 'en', 'fr', etc.
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(equipment_id, language_code)
);

-- 7. RLS für equipment_translations
ALTER TABLE equipment_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Equipment translations are viewable by everyone"
  ON equipment_translations FOR SELECT
  USING (true);

CREATE POLICY "Equipment translations manageable by organization"
  ON equipment_translations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM equipment e
      WHERE e.id = equipment_translations.equipment_id
      AND (
        e.created_by_organization_id IS NULL -- System equipment
        OR e.created_by_organization_id = (
          SELECT organization_id FROM user_profiles WHERE user_id = auth.uid()
        )
      )
    )
  );

-- 8. Funktion zum intelligenten Equipment-Matching
CREATE OR REPLACE FUNCTION match_equipment_by_keywords(
  keywords TEXT[],
  organization_id UUID DEFAULT NULL
)
RETURNS TABLE (
  equipment_id UUID,
  equipment_name VARCHAR,
  category VARCHAR,
  confidence INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    e.id as equipment_id,
    e.name as equipment_name,
    e.category,
    CASE 
      WHEN e.name = ANY(keywords) THEN 100  -- Exakter Match
      WHEN e.name ILIKE ANY(
        SELECT '%' || keyword || '%' FROM unnest(keywords) as keyword
      ) THEN 85  -- Teilmatch
      ELSE 70  -- Fuzzy Match
    END as confidence
  FROM equipment e
  WHERE 
    -- System equipment oder eigene Organisation
    (e.created_by_organization_id IS NULL OR e.created_by_organization_id = organization_id)
    AND (
      -- Exakter Match
      e.name = ANY(keywords)
      -- Oder Teilmatch
      OR e.name ILIKE ANY(
        SELECT '%' || keyword || '%' FROM unnest(keywords) as keyword
      )
      -- Oder Volltextsuche
      OR to_tsvector('german', e.name) @@ to_tsquery('german', 
        array_to_string(keywords, ' | ')
      )
    )
  ORDER BY confidence DESC, e.display_order;
END;
$$ LANGUAGE plpgsql;

-- 9. Hilfs-View für Equipment mit Übersetzungen
CREATE OR REPLACE VIEW equipment_with_translations AS
SELECT 
  e.*,
  COALESCE(
    jsonb_object_agg(
      et.language_code, 
      jsonb_build_object('name', et.name, 'description', et.description)
    ) FILTER (WHERE et.language_code IS NOT NULL),
    '{}'::jsonb
  ) as translations
FROM equipment e
LEFT JOIN equipment_translations et ON e.id = et.equipment_id
GROUP BY e.id, e.category, e.name, e.icon, e.display_order, e.created_at, 
         e.updated_at, e.is_custom, e.created_by_organization_id, 
         e.confidence_score, e.source;

-- 10. Grant permissions
GRANT SELECT ON equipment_with_translations TO authenticated;
GRANT SELECT ON equipment_with_translations TO anon;

COMMENT ON MIGRATION '20250122_fix_equipment_foreign_keys' 
IS 'Behebt Equipment-FK-Issues und normalisiert Kategorien für KI-Equipment-Extraction';