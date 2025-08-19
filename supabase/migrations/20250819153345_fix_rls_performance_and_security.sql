-- ============================================================================
-- FIX RLS PERFORMANCE AND SECURITY ISSUES
-- ============================================================================
-- This migration addresses critical performance and security issues identified
-- in the database integrity check:
-- 1. RLS Performance: auth.uid() wrapped in SELECT for caching
-- 2. Service Role Anti-Pattern removal
-- 3. Function security hardening with search_path
-- 4. Missing indexes for foreign keys
-- 5. Policy consolidation for better maintainability
-- ============================================================================

BEGIN;

-- ============================================================================
-- PART 1: RLS PERFORMANCE OPTIMIZATION
-- Replace auth.uid() with (SELECT auth.uid()) for single evaluation per query
-- ============================================================================

-- user_profiles policies
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "user_profile_select_policy" ON user_profiles;
DROP POLICY IF EXISTS "user_profile_access" ON user_profiles;
DROP POLICY IF EXISTS "profile_select" ON user_profiles;
DROP POLICY IF EXISTS "Users can select their own profile" ON user_profiles;

CREATE POLICY "user_profiles_select" ON user_profiles
  FOR SELECT TO authenticated
  USING (
    user_id = (SELECT auth.uid()) 
    OR 
    organization_id IN (
      SELECT organization_id FROM user_profiles 
      WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
CREATE POLICY "user_profiles_update" ON user_profiles
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
CREATE POLICY "user_profiles_insert" ON user_profiles
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

-- organizations policies
DROP POLICY IF EXISTS "Organizations are viewable by members" ON organizations;
CREATE POLICY "organizations_select" ON organizations
  FOR SELECT TO authenticated
  USING (
    id IN (
      SELECT organization_id FROM user_profiles 
      WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Organizations can be created by authenticated users" ON organizations;
CREATE POLICY "organizations_insert" ON organizations
  FOR INSERT TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Organizations can be updated by owners and admins" ON organizations;
CREATE POLICY "organizations_update" ON organizations
  FOR UPDATE TO authenticated
  USING (
    id IN (
      SELECT organization_id FROM user_profiles 
      WHERE user_id = (SELECT auth.uid()) 
      AND role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    id IN (
      SELECT organization_id FROM user_profiles 
      WHERE user_id = (SELECT auth.uid()) 
      AND role IN ('owner', 'admin')
    )
  );

-- offers policies
DROP POLICY IF EXISTS "Offers are viewable by organization members" ON offers;
CREATE POLICY "offers_select" ON offers
  FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles 
      WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Offers can be created by organization members" ON offers;
CREATE POLICY "offers_insert" ON offers
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_profiles 
      WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Offers can be updated by organization members" ON offers;
CREATE POLICY "offers_update" ON offers
  FOR UPDATE TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles 
      WHERE user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_profiles 
      WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Offers can be deleted by organization members" ON offers;
CREATE POLICY "offers_delete" ON offers
  FOR DELETE TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles 
      WHERE user_id = (SELECT auth.uid())
    )
  );

-- extraction_cache policies
DROP POLICY IF EXISTS "Extraction cache viewable by organization members" ON extraction_cache;
CREATE POLICY "extraction_cache_select" ON extraction_cache
  FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles 
      WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Extraction cache can be created by organization members" ON extraction_cache;
CREATE POLICY "extraction_cache_insert" ON extraction_cache
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_profiles 
      WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Extraction cache can be updated by organization members" ON extraction_cache;
CREATE POLICY "extraction_cache_update" ON extraction_cache
  FOR UPDATE TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles 
      WHERE user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_profiles 
      WHERE user_id = (SELECT auth.uid())
    )
  );

-- landing_pages policies
DROP POLICY IF EXISTS "Landing pages are viewable by organization members" ON landing_pages;
CREATE POLICY "landing_pages_select" ON landing_pages
  FOR SELECT TO authenticated
  USING (
    offer_id IN (
      SELECT id FROM offers 
      WHERE organization_id IN (
        SELECT organization_id FROM user_profiles 
        WHERE user_id = (SELECT auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS "Landing pages can be created by organization members" ON landing_pages;
CREATE POLICY "landing_pages_insert" ON landing_pages
  FOR INSERT TO authenticated
  WITH CHECK (
    offer_id IN (
      SELECT id FROM offers 
      WHERE organization_id IN (
        SELECT organization_id FROM user_profiles 
        WHERE user_id = (SELECT auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS "Landing pages can be updated by organization members" ON landing_pages;
CREATE POLICY "landing_pages_update" ON landing_pages
  FOR UPDATE TO authenticated
  USING (
    offer_id IN (
      SELECT id FROM offers 
      WHERE organization_id IN (
        SELECT organization_id FROM user_profiles 
        WHERE user_id = (SELECT auth.uid())
      )
    )
  )
  WITH CHECK (
    offer_id IN (
      SELECT id FROM offers 
      WHERE organization_id IN (
        SELECT organization_id FROM user_profiles 
        WHERE user_id = (SELECT auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS "Landing pages can be deleted by organization members" ON landing_pages;
CREATE POLICY "landing_pages_delete" ON landing_pages
  FOR DELETE TO authenticated
  USING (
    offer_id IN (
      SELECT id FROM offers 
      WHERE organization_id IN (
        SELECT organization_id FROM user_profiles 
        WHERE user_id = (SELECT auth.uid())
      )
    )
  );

-- tokens policies  
DROP POLICY IF EXISTS "Tokens are viewable by organization members" ON tokens;
CREATE POLICY "tokens_select" ON tokens
  FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles 
      WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Tokens can be created by organization admins" ON tokens;
CREATE POLICY "tokens_insert" ON tokens
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_profiles 
      WHERE user_id = (SELECT auth.uid()) 
      AND role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "Tokens can be updated by organization admins" ON tokens;
CREATE POLICY "tokens_update" ON tokens
  FOR UPDATE TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles 
      WHERE user_id = (SELECT auth.uid()) 
      AND role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_profiles 
      WHERE user_id = (SELECT auth.uid()) 
      AND role IN ('owner', 'admin')
    )
  );

-- invitations policies
DROP POLICY IF EXISTS "Invitations are viewable by organization admins" ON invitations;
CREATE POLICY "invitations_select" ON invitations
  FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles 
      WHERE user_id = (SELECT auth.uid()) 
      AND role IN ('owner', 'admin')
    )
    OR email = (SELECT email FROM auth.users WHERE id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Invitations can be created by organization admins" ON invitations;
CREATE POLICY "invitations_insert" ON invitations
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_profiles 
      WHERE user_id = (SELECT auth.uid()) 
      AND role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "Invitations can be updated by organization admins or invitee" ON invitations;
CREATE POLICY "invitations_update" ON invitations
  FOR UPDATE TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles 
      WHERE user_id = (SELECT auth.uid()) 
      AND role IN ('owner', 'admin')
    )
    OR email = (SELECT email FROM auth.users WHERE id = (SELECT auth.uid()))
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_profiles 
      WHERE user_id = (SELECT auth.uid()) 
      AND role IN ('owner', 'admin')
    )
    OR email = (SELECT email FROM auth.users WHERE id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Invitations can be deleted by organization admins" ON invitations;
CREATE POLICY "invitations_delete" ON invitations
  FOR DELETE TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_profiles 
      WHERE user_id = (SELECT auth.uid()) 
      AND role IN ('owner', 'admin')
    )
  );

-- leads policies
DROP POLICY IF EXISTS "Leads are viewable by organization members" ON leads;
CREATE POLICY "leads_select" ON leads
  FOR SELECT TO authenticated
  USING (
    landing_page_id IN (
      SELECT id FROM landing_pages 
      WHERE offer_id IN (
        SELECT id FROM offers 
        WHERE organization_id IN (
          SELECT organization_id FROM user_profiles 
          WHERE user_id = (SELECT auth.uid())
        )
      )
    )
  );

DROP POLICY IF EXISTS "Leads can be updated by organization members" ON leads;
CREATE POLICY "leads_update" ON leads
  FOR UPDATE TO authenticated
  USING (
    landing_page_id IN (
      SELECT id FROM landing_pages 
      WHERE offer_id IN (
        SELECT id FROM offers 
        WHERE organization_id IN (
          SELECT organization_id FROM user_profiles 
          WHERE user_id = (SELECT auth.uid())
        )
      )
    )
  )
  WITH CHECK (
    landing_page_id IN (
      SELECT id FROM landing_pages 
      WHERE offer_id IN (
        SELECT id FROM offers 
        WHERE organization_id IN (
          SELECT organization_id FROM user_profiles 
          WHERE user_id = (SELECT auth.uid())
        )
      )
    )
  );

DROP POLICY IF EXISTS "Leads can be deleted by organization members" ON leads;
CREATE POLICY "leads_delete" ON leads
  FOR DELETE TO authenticated
  USING (
    landing_page_id IN (
      SELECT id FROM landing_pages 
      WHERE offer_id IN (
        SELECT id FROM offers 
        WHERE organization_id IN (
          SELECT organization_id FROM user_profiles 
          WHERE user_id = (SELECT auth.uid())
        )
      )
    )
  );

-- Public lead insertion (for form submissions)
DROP POLICY IF EXISTS "Anyone can create leads" ON leads;
CREATE POLICY "leads_insert_public" ON leads
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- ============================================================================
-- PART 2: REMOVE SERVICE ROLE ANTI-PATTERN
-- Service role automatically bypasses RLS, no policy needed
-- ============================================================================

DROP POLICY IF EXISTS "Service role can manage extraction cache" ON extraction_cache;
DROP POLICY IF EXISTS "Service role full access" ON extraction_cache;
DROP POLICY IF EXISTS "service_role_bypass" ON extraction_cache;

-- ============================================================================
-- PART 3: FUNCTION SECURITY - SET search_path
-- Prevents schema injection attacks
-- ============================================================================

ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public.generate_unique_slug(text) SET search_path = public;
ALTER FUNCTION public.increment_landingpage_views(text) SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public, auth;

-- ============================================================================
-- PART 4: CREATE MISSING INDEXES
-- Improves JOIN performance for foreign keys
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_offers_fuel_type ON offers(fuel_type_id);
CREATE INDEX IF NOT EXISTS idx_offers_transmission_type ON offers(transmission_type_id);
CREATE INDEX IF NOT EXISTS idx_offers_vehicle_type ON offers(vehicle_type_id);

-- Additional performance indexes based on RLS patterns
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_organization_id ON user_profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_offers_organization_id ON offers(organization_id);
CREATE INDEX IF NOT EXISTS idx_extraction_cache_organization_id ON extraction_cache(organization_id);
CREATE INDEX IF NOT EXISTS idx_tokens_organization_id ON tokens(organization_id);
CREATE INDEX IF NOT EXISTS idx_invitations_organization_id ON invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_landing_pages_offer_id ON landing_pages(offer_id);
CREATE INDEX IF NOT EXISTS idx_landing_pages_slug ON landing_pages(slug);
CREATE INDEX IF NOT EXISTS idx_leads_landing_page_id ON leads(landing_page_id);

-- ============================================================================
-- PART 5: DICTIONARY TABLES - PUBLIC READ ACCESS
-- Allow public read access to dictionary/lookup tables
-- ============================================================================

-- Public read access for dictionary tables (no sensitive data)
DROP POLICY IF EXISTS "Public read access" ON fuel_type;
CREATE POLICY "fuel_type_public_read" ON fuel_type
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Public read access" ON transmission_type;
CREATE POLICY "transmission_type_public_read" ON transmission_type
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Public read access" ON vehicle_type;
CREATE POLICY "vehicle_type_public_read" ON vehicle_type
  FOR SELECT TO anon, authenticated
  USING (true);

-- ============================================================================
-- VALIDATION: Ensure all tables have RLS enabled
-- ============================================================================

DO $$
DECLARE
  table_record RECORD;
BEGIN
  FOR table_record IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_record.tablename);
  END LOOP;
END $$;

COMMIT;

-- ============================================================================
-- POST-MIGRATION VALIDATION QUERIES
-- Run these after migration to verify success
-- ============================================================================

-- Check that no policies use auth.uid() without SELECT wrapper
-- Should return 0 rows:
-- SELECT policyname, tablename, qual 
-- FROM pg_policies 
-- WHERE schemaname = 'public' 
--   AND qual LIKE '%auth.uid()%' 
--   AND qual NOT LIKE '%(SELECT auth.uid())%';

-- Check that no service_role policies exist
-- Should return 0 rows:
-- SELECT policyname, tablename 
-- FROM pg_policies 
-- WHERE schemaname = 'public' 
--   AND (policyname ILIKE '%service%' OR roles::text LIKE '%service_role%');

-- Check that all functions have search_path set
-- Should show search_path for all functions:
-- SELECT proname, prosecdef, proconfig 
-- FROM pg_proc 
-- WHERE pronamespace = 'public'::regnamespace 
--   AND proname IN ('update_updated_at_column', 'generate_unique_slug', 
--                   'increment_landingpage_views', 'handle_new_user');