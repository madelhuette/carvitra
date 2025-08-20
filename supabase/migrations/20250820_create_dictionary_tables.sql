-- Migration: Create Dictionary Tables for CARVITRA
-- Description: Creates lookup tables for consistent data management
-- Date: 2025-08-20

-- 1. Makes (Fahrzeughersteller)
CREATE TABLE IF NOT EXISTS public.makes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed initial makes
INSERT INTO public.makes (name) VALUES 
  ('Audi'), ('BMW'), ('Mercedes-Benz'), ('Volkswagen'), ('Porsche'),
  ('Opel'), ('Ford'), ('Toyota'), ('Hyundai'), ('Kia'),
  ('Skoda'), ('Seat'), ('Cupra'), ('Volvo'), ('Mazda'),
  ('Nissan'), ('Renault'), ('Peugeot'), ('Citroen'), ('Fiat'),
  ('Tesla'), ('BYD'), ('Polestar'), ('Smart'), ('Mini')
ON CONFLICT (name) DO NOTHING;

-- 2. Vehicle Categories (Fahrzeugkategorien)
CREATE TABLE IF NOT EXISTS public.vehicle_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO public.vehicle_categories (name) VALUES 
  ('Limousine'), ('Kombi'), ('SUV'), ('Cabrio'), ('Coupe'),
  ('Van'), ('Kleinwagen'), ('Kompaktklasse'), ('Mittelklasse'), ('Oberklasse'),
  ('Sportwagen'), ('Pickup'), ('Transporter'), ('Wohnmobil')
ON CONFLICT (name) DO NOTHING;

-- 3. Vehicle Types (Spezifischere Fahrzeugtypen)
CREATE TABLE IF NOT EXISTS public.vehicle_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  vehicle_category_id UUID REFERENCES public.vehicle_categories(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Fuel Types (Kraftstoffarten)
CREATE TABLE IF NOT EXISTS public.fuel_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO public.fuel_types (name) VALUES 
  ('Benzin'), ('Diesel'), ('Elektro'), ('Hybrid'), ('Plug-in Hybrid'),
  ('Erdgas (CNG)'), ('Autogas (LPG)'), ('Wasserstoff'), ('Mild-Hybrid')
ON CONFLICT (name) DO NOTHING;

-- 5. Transmission Types (Getriebearten)
CREATE TABLE IF NOT EXISTS public.transmission_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO public.transmission_types (name) VALUES 
  ('Manuell'), ('Automatik'), ('Doppelkupplung (DSG)', ('CVT'), 
  ('Tiptronic'), ('Sequentiell'), ('Halbautomatik')
ON CONFLICT (name) DO NOTHING;

-- 6. Offer Types (Angebotsarten)
CREATE TABLE IF NOT EXISTS public.offer_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO public.offer_types (name) VALUES 
  ('Neuwagen'), ('Gebrauchtwagen'), ('Jahreswagen'), ('Vorführwagen'),
  ('Tageszulassung'), ('EU-Import'), ('Oldtimer'), ('Unfallwagen')
ON CONFLICT (name) DO NOTHING;

-- 7. Availability Types (Verfügbarkeitsarten)
CREATE TABLE IF NOT EXISTS public.availability_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO public.availability_types (name) VALUES 
  ('Sofort verfügbar'), ('Kurzfristig verfügbar'), ('Bestellfahrzeug'),
  ('In Produktion'), ('Auf Lager'), ('Reserviert'), ('Verkauft')
ON CONFLICT (name) DO NOTHING;

-- 8. Equipment Categories (Ausstattungskategorien)
CREATE TABLE IF NOT EXISTS public.equipment_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO public.equipment_categories (name) VALUES 
  ('Sicherheit'), ('Komfort'), ('Infotainment'), ('Exterieur'), ('Interieur'),
  ('Assistenzsysteme'), ('Beleuchtung'), ('Konnektivität'), ('Performance')
ON CONFLICT (name) DO NOTHING;

-- 9. Equipment (Ausstattungsmerkmale)
CREATE TABLE IF NOT EXISTS public.equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category_id UUID REFERENCES public.equipment_categories(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(name, category_id)
);

-- Sample equipment items
INSERT INTO public.equipment (name, category_id) 
SELECT 
  equipment.name,
  ec.id
FROM (VALUES 
  ('ABS', 'Sicherheit'),
  ('ESP', 'Sicherheit'),
  ('Airbag', 'Sicherheit'),
  ('Klimaanlage', 'Komfort'),
  ('Klimaautomatik', 'Komfort'),
  ('Sitzheizung', 'Komfort'),
  ('Navigationssystem', 'Infotainment'),
  ('Apple CarPlay', 'Infotainment'),
  ('Android Auto', 'Infotainment'),
  ('Panoramadach', 'Exterieur'),
  ('Anhängerkupplung', 'Exterieur'),
  ('Ledersitze', 'Interieur'),
  ('Tempomat', 'Assistenzsysteme'),
  ('Spurhalteassistent', 'Assistenzsysteme'),
  ('LED-Scheinwerfer', 'Beleuchtung'),
  ('Xenon-Scheinwerfer', 'Beleuchtung')
) AS equipment(name, category_name)
JOIN public.equipment_categories ec ON ec.name = equipment.category_name
ON CONFLICT (name, category_id) DO NOTHING;

-- 10. Credit Institution Types (Finanzierungsarten)
CREATE TABLE IF NOT EXISTS public.credit_offer_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO public.credit_offer_types (name) VALUES 
  ('Leasing'), ('Finanzierung'), ('Vario-Finanzierung'), 
  ('Ballonfinanzierung'), ('3-Wege-Finanzierung'), ('Barzahlung')
ON CONFLICT (name) DO NOTHING;

-- 11. Credit Institutions (Finanzierungsgeber)
CREATE TABLE IF NOT EXISTS public.credit_institutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  street TEXT,
  street_number TEXT,
  postal_code TEXT,
  city TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Sample institutions
INSERT INTO public.credit_institutions (company_name, city) VALUES 
  ('Mercedes-Benz Bank AG', 'Stuttgart'),
  ('BMW Bank GmbH', 'München'),
  ('Volkswagen Bank GmbH', 'Braunschweig'),
  ('Santander Consumer Bank AG', 'Mönchengladbach'),
  ('BNP Paribas', 'Frankfurt')
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_makes_name ON public.makes(name);
CREATE INDEX IF NOT EXISTS idx_vehicle_categories_name ON public.vehicle_categories(name);
CREATE INDEX IF NOT EXISTS idx_fuel_types_name ON public.fuel_types(name);
CREATE INDEX IF NOT EXISTS idx_transmission_types_name ON public.transmission_types(name);
CREATE INDEX IF NOT EXISTS idx_offer_types_name ON public.offer_types(name);
CREATE INDEX IF NOT EXISTS idx_equipment_name ON public.equipment(name);
CREATE INDEX IF NOT EXISTS idx_equipment_category ON public.equipment(category_id);

-- Add RLS policies
ALTER TABLE public.makes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transmission_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_offer_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_institutions ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users
CREATE POLICY "Allow read access to dictionary tables" ON public.makes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to vehicle_categories" ON public.vehicle_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to vehicle_types" ON public.vehicle_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to fuel_types" ON public.fuel_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to transmission_types" ON public.transmission_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to offer_types" ON public.offer_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to availability_types" ON public.availability_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to equipment_categories" ON public.equipment_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to equipment" ON public.equipment FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to credit_offer_types" ON public.credit_offer_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to credit_institutions" ON public.credit_institutions FOR SELECT TO authenticated USING (true);