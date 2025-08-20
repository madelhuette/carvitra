-- Migration: Create comprehensive Offer table
-- Description: Main table for vehicle offers with all fields from data model
-- Date: 2025-08-20

-- Create the main offer table
CREATE TABLE IF NOT EXISTS public.offer (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  pdf_document_id UUID REFERENCES public.pdf_documents(id) ON DELETE SET NULL,
  
  -- Wizard Step 0: Angebotstyp & Kategorie
  offer_type_id UUID REFERENCES public.offer_types(id),
  vehicle_category_id UUID REFERENCES public.vehicle_categories(id),
  
  -- Wizard Step 1: Basis Fahrzeugdaten
  make_id UUID REFERENCES public.makes(id),
  model TEXT NOT NULL,
  trim TEXT, -- Ausstattungslinie (z.B. "AMG Line", "M Sport")
  
  -- Preise
  list_price_gross DECIMAL(10,2), -- Listenpreis brutto
  list_price_net DECIMAL(10,2), -- Listenpreis netto
  
  -- Fahrzeugtyp & Details
  vehicle_type_id UUID REFERENCES public.vehicle_types(id),
  door_count INT CHECK (door_count BETWEEN 2 AND 5),
  
  -- Technische Daten
  transmission_type_id UUID REFERENCES public.transmission_types(id),
  seat_count INT CHECK (seat_count BETWEEN 1 AND 9),
  fuel_type_id UUID REFERENCES public.fuel_types(id),
  power_ps INT,
  power_kw INT,
  fuel_consumption_fossil DECIMAL(4,2), -- l/100km
  fuel_consumption_electric DECIMAL(4,2), -- kWh/100km
  displacement INT, -- Hubraum in ccm
  cylinder_count INT,
  
  -- Batterie (für E-Fahrzeuge)
  battery_capacity_gross DECIMAL(5,2), -- kWh
  battery_capacity_usable DECIMAL(5,2), -- kWh
  
  -- Umwelt
  co2_emissions DECIMAL(5,2), -- g/km
  emission_class TEXT, -- z.B. "Euro 6d"
  
  -- Farben & Material
  exterior_color TEXT,
  interior_color TEXT,
  interior_material TEXT,
  
  -- Extras (wird über offer_equipment relation gelöst)
  
  -- Verfügbarkeit
  availability_type_id UUID REFERENCES public.availability_types(id),
  availability_date DATE,
  first_registration DATE,
  mileage_count INT, -- Kilometerstand
  owner_count INT DEFAULT 0, -- Anzahl Vorbesitzer
  general_inspection_date DATE, -- HU bis
  accident_free BOOLEAN DEFAULT true,
  
  -- Finanzierung (Details in credit_offers)
  financing_available BOOLEAN DEFAULT false,
  
  -- Händler & Ansprechpartner
  dealer_id UUID, -- Will reference dealers table
  sales_person_id UUID, -- Will reference sales_persons table
  
  -- Metadaten
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Wizard completion tracking
  wizard_completed BOOLEAN DEFAULT false,
  wizard_current_step INT DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'sold', 'reserved', 'archived')),
  
  -- SEO & Marketing
  seo_title TEXT,
  seo_description TEXT,
  marketing_headline TEXT,
  marketing_description TEXT
);

-- Create dealers table
CREATE TABLE IF NOT EXISTS public.dealers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  street TEXT,
  street_number TEXT,
  postal_code TEXT,
  city TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create sales persons table
CREATE TABLE IF NOT EXISTS public.sales_persons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  dealer_id UUID REFERENCES public.dealers(id) ON DELETE CASCADE,
  salutation TEXT,
  first_name TEXT,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  mobile TEXT,
  position TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add foreign keys to offer table now that dealers and sales_persons exist
ALTER TABLE public.offer 
  ADD CONSTRAINT offer_dealer_fk FOREIGN KEY (dealer_id) REFERENCES public.dealers(id) ON DELETE SET NULL,
  ADD CONSTRAINT offer_sales_person_fk FOREIGN KEY (sales_person_id) REFERENCES public.sales_persons(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_offer_organization ON public.offer(organization_id);
CREATE INDEX IF NOT EXISTS idx_offer_pdf_document ON public.offer(pdf_document_id);
CREATE INDEX IF NOT EXISTS idx_offer_status ON public.offer(status);
CREATE INDEX IF NOT EXISTS idx_offer_make ON public.offer(make_id);
CREATE INDEX IF NOT EXISTS idx_offer_offer_type ON public.offer(offer_type_id);
CREATE INDEX IF NOT EXISTS idx_offer_created ON public.offer(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dealers_organization ON public.dealers(organization_id);
CREATE INDEX IF NOT EXISTS idx_sales_persons_dealer ON public.sales_persons(dealer_id);

-- Enable RLS
ALTER TABLE public.offer ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dealers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_persons ENABLE ROW LEVEL SECURITY;

-- RLS Policies for offer table
CREATE POLICY "Users can view offers from their organization" 
  ON public.offer FOR SELECT 
  TO authenticated 
  USING (
    organization_id IN (
      SELECT organization_id FROM public.users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create offers for their organization" 
  ON public.offer FOR INSERT 
  TO authenticated 
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update offers from their organization" 
  ON public.offer FOR UPDATE 
  TO authenticated 
  USING (
    organization_id IN (
      SELECT organization_id FROM public.users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete offers from their organization" 
  ON public.offer FOR DELETE 
  TO authenticated 
  USING (
    organization_id IN (
      SELECT organization_id FROM public.users WHERE id = auth.uid()
    )
  );

-- RLS Policies for dealers table
CREATE POLICY "Users can view dealers from their organization" 
  ON public.dealers FOR SELECT 
  TO authenticated 
  USING (
    organization_id IN (
      SELECT organization_id FROM public.users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can manage dealers for their organization" 
  ON public.dealers FOR ALL 
  TO authenticated 
  USING (
    organization_id IN (
      SELECT organization_id FROM public.users WHERE id = auth.uid()
    )
  );

-- RLS Policies for sales_persons table
CREATE POLICY "Users can view sales persons from their organization" 
  ON public.sales_persons FOR SELECT 
  TO authenticated 
  USING (
    organization_id IN (
      SELECT organization_id FROM public.users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can manage sales persons for their organization" 
  ON public.sales_persons FOR ALL 
  TO authenticated 
  USING (
    organization_id IN (
      SELECT organization_id FROM public.users WHERE id = auth.uid()
    )
  );

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_offer_updated_at BEFORE UPDATE ON public.offer
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dealers_updated_at BEFORE UPDATE ON public.dealers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comment on table for documentation
COMMENT ON TABLE public.offer IS 'Main table storing all vehicle offers with comprehensive details';
COMMENT ON COLUMN public.offer.trim IS 'Ausstattungslinie like AMG Line, M Sport, S-Line etc.';
COMMENT ON COLUMN public.offer.battery_capacity_gross IS 'Total battery capacity in kWh';
COMMENT ON COLUMN public.offer.battery_capacity_usable IS 'Usable battery capacity in kWh';
COMMENT ON COLUMN public.offer.co2_emissions IS 'CO2 emissions in g/km';
COMMENT ON COLUMN public.offer.wizard_completed IS 'Indicates if the offer wizard has been completed';
COMMENT ON COLUMN public.offer.wizard_current_step IS 'Current step in the offer creation wizard';