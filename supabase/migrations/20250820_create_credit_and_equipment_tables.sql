-- Migration: Create Credit Offers and Equipment Relations
-- Description: Tables for financing options and equipment associations
-- Date: 2025-08-20

-- 1. Credit Offers Table (Multiple financing options per offer)
CREATE TABLE IF NOT EXISTS public.credit_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES public.offer(id) ON DELETE CASCADE,
  credit_offer_type_id UUID REFERENCES public.credit_offer_types(id),
  credit_institution_id UUID REFERENCES public.credit_institutions(id),
  
  -- Finanzierungsraten
  financial_rate_gross DECIMAL(10,2), -- Monatsrate brutto
  financial_rate_net DECIMAL(10,2), -- Monatsrate netto
  runtime INT, -- Laufzeit in Monaten
  
  -- Schlussrate
  closing_rate_gross DECIMAL(10,2), -- Schlussrate brutto
  closing_rate_net DECIMAL(10,2), -- Schlussrate netto
  
  -- Zinsen
  effective_interest DECIMAL(5,2), -- Effektivzins in %
  target_interest DECIMAL(5,2), -- Sollzins in %
  
  -- 2/3 Beispiel (gesetzlich vorgeschrieben)
  credit_example TEXT, -- "2/3 Beispiel des Angebots"
  
  -- Anzahlungen
  down_payment_gross DECIMAL(10,2), -- Anzahlung brutto
  down_payment_net DECIMAL(10,2), -- Anzahlung netto
  deposit_gross DECIMAL(10,2), -- Kaution/Sonderzahlung brutto
  deposit_net DECIMAL(10,2), -- Kaution/Sonderzahlung netto
  
  -- Zusatzkosten
  delivery_cost_gross DECIMAL(8,2), -- Überführungskosten brutto
  delivery_cost_net DECIMAL(8,2), -- Überführungskosten netto
  registration_cost_gross DECIMAL(8,2), -- Zulassungskosten brutto
  registration_cost_net DECIMAL(8,2), -- Zulassungskosten netto
  
  -- Kilometerregelungen (für Leasing)
  annual_mileage INT, -- Jährliche Kilometerleistung
  more_kilometer_cost_gross DECIMAL(6,2), -- Mehrkilometerkosten brutto pro km
  more_kilometer_cost_net DECIMAL(6,2), -- Mehrkilometerkosten netto pro km
  less_kilometer_refund_net DECIMAL(6,2), -- Minderkilometererstattung netto pro km
  
  -- Leasingspezifisch
  leasing_factor DECIMAL(6,4), -- Leasingfaktor
  
  -- Summen
  sum_initial_payments_gross DECIMAL(10,2), -- Summe Einmalzahlungen brutto
  sum_initial_payments_net DECIMAL(10,2), -- Summe Einmalzahlungen netto
  total_amount DECIMAL(12,2), -- Gesamtbetrag
  
  -- Status
  is_primary BOOLEAN DEFAULT false, -- Haupt-Finanzierungsangebot
  status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'expired', 'accepted')),
  valid_until DATE, -- Gültigkeit des Angebots
  
  -- Metadaten
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Offer Equipment Relation (N:M relationship)
CREATE TABLE IF NOT EXISTS public.offer_equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES public.offer(id) ON DELETE CASCADE,
  equipment_id UUID NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
  is_standard BOOLEAN DEFAULT false, -- Serienausstattung vs. Sonderausstattung
  price_gross DECIMAL(8,2), -- Preis der Sonderausstattung brutto
  price_net DECIMAL(8,2), -- Preis der Sonderausstattung netto
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(offer_id, equipment_id)
);

-- 3. Offer Images Table (for future use)
CREATE TABLE IF NOT EXISTS public.offer_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES public.offer(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  image_type TEXT CHECK (image_type IN ('exterior', 'interior', 'detail', 'damage')),
  is_primary BOOLEAN DEFAULT false,
  caption TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Offer Documents Table (additional documents besides main PDF)
CREATE TABLE IF NOT EXISTS public.offer_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES public.offer(id) ON DELETE CASCADE,
  document_url TEXT NOT NULL,
  document_type TEXT CHECK (document_type IN ('service_history', 'inspection', 'contract', 'other')),
  document_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_credit_offers_offer ON public.credit_offers(offer_id);
CREATE INDEX IF NOT EXISTS idx_credit_offers_primary ON public.credit_offers(offer_id, is_primary) WHERE is_primary = true;
CREATE INDEX IF NOT EXISTS idx_offer_equipment_offer ON public.offer_equipment(offer_id);
CREATE INDEX IF NOT EXISTS idx_offer_equipment_equipment ON public.offer_equipment(equipment_id);
CREATE INDEX IF NOT EXISTS idx_offer_images_offer ON public.offer_images(offer_id);
CREATE INDEX IF NOT EXISTS idx_offer_documents_offer ON public.offer_documents(offer_id);

-- Enable RLS
ALTER TABLE public.credit_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for credit_offers
CREATE POLICY "Users can view credit offers for their organization's offers" 
  ON public.credit_offers FOR SELECT 
  TO authenticated 
  USING (
    offer_id IN (
      SELECT id FROM public.offer 
      WHERE organization_id IN (
        SELECT organization_id FROM public.users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage credit offers for their organization's offers" 
  ON public.credit_offers FOR ALL 
  TO authenticated 
  USING (
    offer_id IN (
      SELECT id FROM public.offer 
      WHERE organization_id IN (
        SELECT organization_id FROM public.users WHERE id = auth.uid()
      )
    )
  );

-- RLS Policies for offer_equipment
CREATE POLICY "Users can view equipment for their organization's offers" 
  ON public.offer_equipment FOR SELECT 
  TO authenticated 
  USING (
    offer_id IN (
      SELECT id FROM public.offer 
      WHERE organization_id IN (
        SELECT organization_id FROM public.users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage equipment for their organization's offers" 
  ON public.offer_equipment FOR ALL 
  TO authenticated 
  USING (
    offer_id IN (
      SELECT id FROM public.offer 
      WHERE organization_id IN (
        SELECT organization_id FROM public.users WHERE id = auth.uid()
      )
    )
  );

-- RLS Policies for offer_images
CREATE POLICY "Users can view images for their organization's offers" 
  ON public.offer_images FOR SELECT 
  TO authenticated 
  USING (
    offer_id IN (
      SELECT id FROM public.offer 
      WHERE organization_id IN (
        SELECT organization_id FROM public.users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage images for their organization's offers" 
  ON public.offer_images FOR ALL 
  TO authenticated 
  USING (
    offer_id IN (
      SELECT id FROM public.offer 
      WHERE organization_id IN (
        SELECT organization_id FROM public.users WHERE id = auth.uid()
      )
    )
  );

-- RLS Policies for offer_documents
CREATE POLICY "Users can view documents for their organization's offers" 
  ON public.offer_documents FOR SELECT 
  TO authenticated 
  USING (
    offer_id IN (
      SELECT id FROM public.offer 
      WHERE organization_id IN (
        SELECT organization_id FROM public.users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage documents for their organization's offers" 
  ON public.offer_documents FOR ALL 
  TO authenticated 
  USING (
    offer_id IN (
      SELECT id FROM public.offer 
      WHERE organization_id IN (
        SELECT organization_id FROM public.users WHERE id = auth.uid()
      )
    )
  );

-- Update triggers
CREATE TRIGGER update_credit_offers_updated_at BEFORE UPDATE ON public.credit_offers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Helper view for primary credit offers
CREATE OR REPLACE VIEW public.primary_credit_offers AS
SELECT 
  o.id as offer_id,
  o.model,
  o.make_id,
  co.*
FROM public.offer o
LEFT JOIN public.credit_offers co ON co.offer_id = o.id AND co.is_primary = true;

-- Comments for documentation
COMMENT ON TABLE public.credit_offers IS 'Stores multiple financing options per vehicle offer';
COMMENT ON COLUMN public.credit_offers.is_primary IS 'Marks the main financing option to display';
COMMENT ON COLUMN public.credit_offers.leasing_factor IS 'Leasing factor for calculating monthly rates';
COMMENT ON COLUMN public.credit_offers.credit_example IS 'Legally required 2/3 representative example';

COMMENT ON TABLE public.offer_equipment IS 'Many-to-many relation between offers and equipment items';
COMMENT ON COLUMN public.offer_equipment.is_standard IS 'Differentiates between standard and optional equipment';

COMMENT ON TABLE public.offer_images IS 'Stores multiple images per offer';
COMMENT ON TABLE public.offer_documents IS 'Additional documents like service history, inspections etc.';