-- ============================================================================
-- pgTAP Tests for RLS Performance and Security Fixes
-- ============================================================================
-- Tests validate that:
-- 1. All RLS policies use (SELECT auth.uid()) pattern
-- 2. No service_role policies exist
-- 3. Functions have search_path set
-- 4. Required indexes exist
-- 5. RLS is enabled on all tables
-- ============================================================================

BEGIN;

-- Install pgTAP if not already installed
CREATE EXTENSION IF NOT EXISTS pgtap;

-- Plan the number of tests
SELECT plan(12);

-- ============================================================================
-- TEST 1: RLS is enabled on all public tables
-- ============================================================================
SELECT ok(
  NOT EXISTS (
    SELECT 1 
    FROM pg_tables t
    LEFT JOIN pg_class c ON c.relname = t.tablename
    LEFT JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = t.schemaname
    WHERE t.schemaname = 'public' 
    AND c.relrowsecurity = false
  ),
  'All public tables have RLS enabled'
);

-- ============================================================================
-- TEST 2: No policies use auth.uid() without SELECT wrapper
-- ============================================================================
SELECT ok(
  NOT EXISTS (
    SELECT 1 
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND qual LIKE '%auth.uid()%' 
    AND qual NOT LIKE '%(SELECT auth.uid())%'
    AND qual NOT LIKE '%select auth.uid()%'
  ),
  'All policies wrap auth.uid() in SELECT for performance'
);

-- ============================================================================
-- TEST 3: No service_role policies exist (anti-pattern)
-- ============================================================================
SELECT ok(
  NOT EXISTS (
    SELECT 1 
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND (
      policyname ILIKE '%service%role%' 
      OR roles::text LIKE '%service_role%'
      OR qual LIKE '%service_role%'
    )
  ),
  'No service_role policies exist (anti-pattern removed)'
);

-- ============================================================================
-- TEST 4: All policies have TO clause (role targeting)
-- ============================================================================
SELECT ok(
  NOT EXISTS (
    SELECT 1 
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND roles = '{public}'
  ),
  'All policies have explicit role targeting (TO clause)'
);

-- ============================================================================
-- TEST 5: Critical functions have search_path set
-- ============================================================================
SELECT ok(
  (SELECT COUNT(*) FROM pg_proc 
   WHERE pronamespace = 'public'::regnamespace 
   AND proname = 'update_updated_at_column'
   AND proconfig IS NOT NULL 
   AND proconfig::text LIKE '%search_path%') = 1,
  'update_updated_at_column has search_path set'
);

SELECT ok(
  (SELECT COUNT(*) FROM pg_proc 
   WHERE pronamespace = 'public'::regnamespace 
   AND proname = 'generate_unique_slug'
   AND proconfig IS NOT NULL 
   AND proconfig::text LIKE '%search_path%') = 1,
  'generate_unique_slug has search_path set'
);

SELECT ok(
  (SELECT COUNT(*) FROM pg_proc 
   WHERE pronamespace = 'public'::regnamespace 
   AND proname = 'increment_landingpage_views'
   AND proconfig IS NOT NULL 
   AND proconfig::text LIKE '%search_path%') = 1,
  'increment_landingpage_views has search_path set'
);

SELECT ok(
  (SELECT COUNT(*) FROM pg_proc 
   WHERE pronamespace = 'public'::regnamespace 
   AND proname = 'handle_new_user'
   AND proconfig IS NOT NULL 
   AND proconfig::text LIKE '%search_path%') = 1,
  'handle_new_user has search_path set'
);

-- ============================================================================
-- TEST 6: Required indexes exist for foreign keys
-- ============================================================================
SELECT has_index('public', 'offers', 'idx_offers_fuel_type', 
  'Index on offers.fuel_type_id exists');

SELECT has_index('public', 'offers', 'idx_offers_transmission_type', 
  'Index on offers.transmission_type_id exists');

SELECT has_index('public', 'offers', 'idx_offers_vehicle_type', 
  'Index on offers.vehicle_type_id exists');

-- ============================================================================
-- TEST 7: No duplicate policies per table/operation
-- ============================================================================
SELECT ok(
  NOT EXISTS (
    SELECT tablename, cmd, COUNT(*) 
    FROM pg_policies 
    WHERE schemaname = 'public'
    GROUP BY tablename, cmd 
    HAVING COUNT(*) > 1
  ),
  'No duplicate policies for same table/operation combination'
);

-- Finish tests
SELECT * FROM finish();
ROLLBACK;