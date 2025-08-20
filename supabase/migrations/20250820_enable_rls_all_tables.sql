-- ============================================================================
-- RLS (Row Level Security) Aktivierung für alle Tabellen
-- Datum: 2025-08-20
-- Beschreibung: Aktiviert RLS auf allen Tabellen ohne aktive RLS-Policies
--               und erstellt entsprechende Sicherheits-Policies
-- ============================================================================

-- ============================================================================
-- 1. RLS auf Haupttabellen aktivieren
-- ============================================================================

-- OFFER Tabelle (KRITISCH - Haupttabelle!)
ALTER TABLE offer ENABLE ROW LEVEL SECURITY;

-- Dealers und Sales Persons
ALTER TABLE dealers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_persons ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. RLS auf Dictionary/Lookup-Tabellen aktivieren
-- ============================================================================

ALTER TABLE availability_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_offer_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE makes ENABLE ROW LEVEL SECURITY;
ALTER TABLE offer_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_categories ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 3. Policies für OFFER Tabelle (Multi-Tenant)
-- ============================================================================

-- SELECT Policy: Nutzer können nur Angebote ihrer Organisation sehen
CREATE POLICY "Users can view offers from their organization" ON offer
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id 
            FROM user_profiles 
            WHERE user_id = auth.uid()
        )
    );

-- INSERT Policy: Nutzer können Angebote für ihre Organisation erstellen
CREATE POLICY "Users can create offers for their organization" ON offer
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id 
            FROM user_profiles 
            WHERE user_id = auth.uid()
        )
    );

-- UPDATE Policy: Nutzer können Angebote ihrer Organisation bearbeiten
CREATE POLICY "Users can update offers from their organization" ON offer
    FOR UPDATE USING (
        organization_id IN (
            SELECT organization_id 
            FROM user_profiles 
            WHERE user_id = auth.uid()
        )
    );

-- DELETE Policy: Nur Admins können Angebote löschen
CREATE POLICY "Only admins can delete offers" ON offer
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_id = auth.uid()
            AND organization_id = offer.organization_id
            AND role IN ('admin', 'owner')
        )
    );

-- ============================================================================
-- 4. Policies für DEALERS Tabelle
-- ============================================================================

-- SELECT Policy
CREATE POLICY "Users can view dealers from their organization" ON dealers
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id 
            FROM user_profiles 
            WHERE user_id = auth.uid()
        )
    );

-- INSERT Policy
CREATE POLICY "Users can create dealers for their organization" ON dealers
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id 
            FROM user_profiles 
            WHERE user_id = auth.uid()
        )
    );

-- UPDATE Policy
CREATE POLICY "Users can update dealers from their organization" ON dealers
    FOR UPDATE USING (
        organization_id IN (
            SELECT organization_id 
            FROM user_profiles 
            WHERE user_id = auth.uid()
        )
    );

-- DELETE Policy
CREATE POLICY "Only admins can delete dealers" ON dealers
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_id = auth.uid()
            AND organization_id = dealers.organization_id
            AND role IN ('admin', 'owner')
        )
    );

-- ============================================================================
-- 5. Policies für SALES_PERSONS Tabelle
-- ============================================================================

-- SELECT Policy
CREATE POLICY "Users can view sales persons from their organization" ON sales_persons
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id 
            FROM user_profiles 
            WHERE user_id = auth.uid()
        )
    );

-- INSERT Policy
CREATE POLICY "Users can create sales persons for their organization" ON sales_persons
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id 
            FROM user_profiles 
            WHERE user_id = auth.uid()
        )
    );

-- UPDATE Policy
CREATE POLICY "Users can update sales persons from their organization" ON sales_persons
    FOR UPDATE USING (
        organization_id IN (
            SELECT organization_id 
            FROM user_profiles 
            WHERE user_id = auth.uid()
        )
    );

-- DELETE Policy
CREATE POLICY "Only admins can delete sales persons" ON sales_persons
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE user_id = auth.uid()
            AND organization_id = sales_persons.organization_id
            AND role IN ('admin', 'owner')
        )
    );

-- ============================================================================
-- 6. Policies für Dictionary-Tabellen (Read-Only für alle authenticated users)
-- ============================================================================

-- AVAILABILITY_TYPES
CREATE POLICY "Anyone can read availability types" ON availability_types
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- CREDIT_INSTITUTIONS
CREATE POLICY "Anyone can read credit institutions" ON credit_institutions
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- CREDIT_OFFER_TYPES
CREATE POLICY "Anyone can read credit offer types" ON credit_offer_types
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- EQUIPMENT_CATEGORIES
CREATE POLICY "Anyone can read equipment categories" ON equipment_categories
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- MAKES
CREATE POLICY "Anyone can read makes" ON makes
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- OFFER_TYPES
CREATE POLICY "Anyone can read offer types" ON offer_types
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- VEHICLE_CATEGORIES
CREATE POLICY "Anyone can read vehicle categories" ON vehicle_categories
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- 7. Doppelte Indexes entfernen (Performance-Optimierung)
-- ============================================================================

-- Entferne redundante Indexes (behalte die spezifischeren)
DROP INDEX IF EXISTS idx_landingpages_offer;  -- Behalte idx_landingpages_offer_id
DROP INDEX IF EXISTS idx_pdf_documents_organization;  -- Behalte idx_pdf_documents_organization_id

-- ============================================================================
-- 8. Verifizierung der RLS-Aktivierung
-- ============================================================================

-- Dieser Query kann manuell ausgeführt werden zur Überprüfung:
-- SELECT tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public' 
-- ORDER BY tablename;

-- ============================================================================
-- Migration erfolgreich abgeschlossen
-- Alle Tabellen sind nun mit RLS gesichert!
-- ============================================================================