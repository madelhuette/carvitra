-- ============================================================================
-- Migration: Fix RLS Policies, Remove Duplicates, and Optimize Performance
-- ============================================================================
-- This migration:
-- 1. Removes duplicate RLS policies
-- 2. Implements (SELECT auth.uid()) pattern for performance
-- 3. Creates Security Definer helper functions
-- 4. Adds missing indexes
-- 5. Fixes the registration flow issues
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: Create Security Definer Helper Functions
-- ============================================================================

-- Function to get user's organization_id (cached per query)
CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
    org_id UUID;
BEGIN
    SELECT organization_id INTO org_id
    FROM user_profiles
    WHERE user_id = (SELECT auth.uid())
    LIMIT 1;
    
    RETURN org_id;
END;
$$;

-- Function to check if user can access an organization
CREATE OR REPLACE FUNCTION public.user_has_organization_access(org_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM user_profiles
        WHERE user_id = (SELECT auth.uid())
        AND organization_id = org_id
    );
END;
$$;

-- Function to check if user is organization admin/owner
CREATE OR REPLACE FUNCTION public.user_is_organization_admin(org_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM user_profiles
        WHERE user_id = (SELECT auth.uid())
        AND organization_id = org_id
        AND role IN ('owner', 'admin')
    );
END;
$$;

-- ============================================================================
-- STEP 2: Drop ALL existing policies to start fresh
-- ============================================================================

-- Drop all user_profiles policies
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can view profiles in their organization" ON user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "user_profile_insert_policy" ON user_profiles;
DROP POLICY IF EXISTS "user_profile_select_policy" ON user_profiles;
DROP POLICY IF EXISTS "user_profile_update_policy" ON user_profiles;

-- Drop all organizations policies
DROP POLICY IF EXISTS "Admins can update organization" ON organizations;
DROP POLICY IF EXISTS "Owners and admins can update organization" ON organizations;
DROP POLICY IF EXISTS "organization_select_policy" ON organizations;
DROP POLICY IF EXISTS "organization_update_policy" ON organizations;

-- Drop all pdf_documents policies
DROP POLICY IF EXISTS "Users can delete their organization's PDFs" ON pdf_documents;
DROP POLICY IF EXISTS "Users can insert PDFs for their organization" ON pdf_documents;
DROP POLICY IF EXISTS "Users can update their organization's PDFs" ON pdf_documents;
DROP POLICY IF EXISTS "Users can view their organization's PDFs" ON pdf_documents;

-- ============================================================================
-- STEP 3: Create clean, optimized RLS policies
-- ============================================================================

-- USER_PROFILES POLICIES (Simplified and consolidated)
CREATE POLICY "user_profiles_select"
    ON user_profiles FOR SELECT
    TO authenticated
    USING (
        user_id = (SELECT auth.uid())
        OR 
        organization_id = get_user_organization_id()
    );

CREATE POLICY "user_profiles_insert"
    ON user_profiles FOR INSERT
    TO authenticated
    WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "user_profiles_update"
    ON user_profiles FOR UPDATE
    TO authenticated
    USING (user_id = (SELECT auth.uid()))
    WITH CHECK (user_id = (SELECT auth.uid()));

-- ORGANIZATIONS POLICIES (Using helper functions)
CREATE POLICY "organizations_select"
    ON organizations FOR SELECT
    TO authenticated
    USING (user_has_organization_access(id));

CREATE POLICY "organizations_update"
    ON organizations FOR UPDATE
    TO authenticated
    USING (user_is_organization_admin(id))
    WITH CHECK (user_is_organization_admin(id));

-- PDF_DOCUMENTS POLICIES (Using helper functions)
CREATE POLICY "pdf_documents_select"
    ON pdf_documents FOR SELECT
    TO authenticated
    USING (user_has_organization_access(organization_id));

CREATE POLICY "pdf_documents_insert"
    ON pdf_documents FOR INSERT
    TO authenticated
    WITH CHECK (user_has_organization_access(organization_id));

CREATE POLICY "pdf_documents_update"
    ON pdf_documents FOR UPDATE
    TO authenticated
    USING (user_has_organization_access(organization_id))
    WITH CHECK (user_has_organization_access(organization_id));

CREATE POLICY "pdf_documents_delete"
    ON pdf_documents FOR DELETE
    TO authenticated
    USING (user_is_organization_admin(organization_id));

-- ============================================================================
-- STEP 4: Fix other tables with auth.uid() pattern
-- ============================================================================

-- OFFERS POLICIES
DROP POLICY IF EXISTS "Users can view their organization's offers" ON offers;
DROP POLICY IF EXISTS "Users can insert offers for their organization" ON offers;
DROP POLICY IF EXISTS "Users can update their organization's offers" ON offers;
DROP POLICY IF EXISTS "Users can delete their organization's offers" ON offers;

CREATE POLICY "offers_select"
    ON offers FOR SELECT
    TO authenticated
    USING (user_has_organization_access(organization_id));

CREATE POLICY "offers_insert"
    ON offers FOR INSERT
    TO authenticated
    WITH CHECK (user_has_organization_access(organization_id));

CREATE POLICY "offers_update"
    ON offers FOR UPDATE
    TO authenticated
    USING (user_has_organization_access(organization_id))
    WITH CHECK (user_has_organization_access(organization_id));

CREATE POLICY "offers_delete"
    ON offers FOR DELETE
    TO authenticated
    USING (user_is_organization_admin(organization_id));

-- LANDINGPAGES POLICIES
DROP POLICY IF EXISTS "Users can view their organization's landing pages" ON landingpages;
DROP POLICY IF EXISTS "Users can insert landing pages for their organization" ON landingpages;
DROP POLICY IF EXISTS "Users can update their organization's landing pages" ON landingpages;
DROP POLICY IF EXISTS "Users can delete their organization's landing pages" ON landingpages;

CREATE POLICY "landingpages_select"
    ON landingpages FOR SELECT
    TO authenticated
    USING (user_has_organization_access(organization_id));

CREATE POLICY "landingpages_insert"
    ON landingpages FOR INSERT
    TO authenticated
    WITH CHECK (user_has_organization_access(organization_id));

CREATE POLICY "landingpages_update"
    ON landingpages FOR UPDATE
    TO authenticated
    USING (user_has_organization_access(organization_id))
    WITH CHECK (user_has_organization_access(organization_id));

CREATE POLICY "landingpages_delete"
    ON landingpages FOR DELETE
    TO authenticated
    USING (user_is_organization_admin(organization_id));

-- LEADS POLICIES (corrected - no organization_id column)
DROP POLICY IF EXISTS "Users can view their organization's leads" ON leads;
DROP POLICY IF EXISTS "Users can update their organization's leads" ON leads;
DROP POLICY IF EXISTS "Anyone can insert leads" ON leads;

CREATE POLICY "leads_select"
    ON leads FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 
            FROM landingpages 
            WHERE landingpages.id = leads.landingpage_id
            AND user_has_organization_access(landingpages.organization_id)
        )
    );

CREATE POLICY "leads_insert"
    ON leads FOR INSERT
    TO anon, authenticated
    WITH CHECK (true); -- Anyone can submit a lead

CREATE POLICY "leads_update"
    ON leads FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 
            FROM landingpages 
            WHERE landingpages.id = leads.landingpage_id
            AND user_has_organization_access(landingpages.organization_id)
        )
    );

CREATE POLICY "leads_delete"
    ON leads FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 
            FROM landingpages 
            WHERE landingpages.id = leads.landingpage_id
            AND user_is_organization_admin(landingpages.organization_id)
        )
    );

-- ============================================================================
-- STEP 5: Ensure handle_new_user function works correctly
-- ============================================================================

-- Update handle_new_user to ensure it can insert into user_profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    org_id UUID;
    org_name TEXT;
    org_slug TEXT;
BEGIN
    -- Extract organization name from metadata or use company name
    org_name := COALESCE(
        NEW.raw_user_meta_data->>'company_name',
        NEW.raw_user_meta_data->>'organization_name',
        SPLIT_PART(NEW.email, '@', 1) || '-org'
    );
    
    -- Generate a unique slug
    org_slug := LOWER(REPLACE(org_name, ' ', '-'));
    org_slug := REGEXP_REPLACE(org_slug, '[^a-z0-9-]', '', 'g');
    
    -- Ensure slug is unique by appending a random suffix if needed
    WHILE EXISTS (SELECT 1 FROM public.organizations WHERE slug = org_slug) LOOP
        org_slug := org_slug || '-' || SUBSTRING(MD5(RANDOM()::TEXT), 1, 6);
    END LOOP;
    
    -- Create new organization (with SECURITY DEFINER, this bypasses RLS)
    INSERT INTO public.organizations (name, slug)
    VALUES (org_name, org_slug)
    RETURNING id INTO org_id;
    
    -- Create user profile (with SECURITY DEFINER, this bypasses RLS)
    INSERT INTO public.user_profiles (
        user_id,
        organization_id,
        first_name,
        last_name,
        phone,
        role
    ) VALUES (
        NEW.id,
        org_id,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'phone', ''),
        'owner' -- First user is always the owner
    );
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail the user creation
        RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
        RETURN NEW;
END;
$$;

-- ============================================================================
-- STEP 6: Add missing indexes for performance
-- ============================================================================

-- Indexes for foreign key lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_organization_id ON user_profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_pdf_documents_organization_id ON pdf_documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_offers_organization_id ON offers(organization_id);
CREATE INDEX IF NOT EXISTS idx_landingpages_organization_id ON landingpages(organization_id);
CREATE INDEX IF NOT EXISTS idx_leads_landingpage_id ON leads(landingpage_id);
CREATE INDEX IF NOT EXISTS idx_leads_offer_id ON leads(offer_id);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_org ON user_profiles(user_id, organization_id);
CREATE INDEX IF NOT EXISTS idx_pdf_documents_org_status ON pdf_documents(organization_id, processing_status);
CREATE INDEX IF NOT EXISTS idx_offers_org_active ON offers(organization_id, is_active);
CREATE INDEX IF NOT EXISTS idx_landingpages_org_published ON landingpages(organization_id, is_published);

-- ============================================================================
-- STEP 7: Grant necessary permissions
-- ============================================================================

-- Grant execute permissions on helper functions
GRANT EXECUTE ON FUNCTION get_user_organization_id() TO authenticated;
GRANT EXECUTE ON FUNCTION user_has_organization_access(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION user_is_organization_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION user_has_organization_access(UUID) TO anon; -- For leads insert

-- ============================================================================
-- STEP 8: Verify all tables have RLS enabled
-- ============================================================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdf_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE landingpages ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

COMMIT;

-- ============================================================================
-- Post-migration verification queries (run these manually to verify)
-- ============================================================================

/*
-- Check that no duplicate policies exist:
SELECT tablename, COUNT(*), STRING_AGG(policyname, ', ') as policies
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- Check that all policies use optimized patterns:
SELECT tablename, policyname, 
       CASE 
         WHEN qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(SELECT auth.uid())%' THEN 'NEEDS FIX'
         ELSE 'OK'
       END as status
FROM pg_policies
WHERE schemaname = 'public';

-- Check that helper functions exist:
SELECT proname FROM pg_proc 
WHERE pronamespace = 'public'::regnamespace 
AND proname IN ('get_user_organization_id', 'user_has_organization_access', 'user_is_organization_admin');

-- Check indexes:
SELECT indexname FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE 'idx_%'
ORDER BY indexname;
*/