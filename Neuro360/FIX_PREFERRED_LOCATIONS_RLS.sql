-- =============================================================================
-- FIX: Superadmin cannot EDIT or TOGGLE (active/inactive) Preferred Locations
-- =============================================================================
-- Symptom: In superadmin -> System Settings -> Preferred Locations, "Add" works
-- but the Edit (pencil) and active/inactive toggle silently do nothing and the
-- change reverts on reload.
--
-- Root cause: Row Level Security is enabled on `preferred_locations` but the live
-- table is missing an effective UPDATE/DELETE policy. Postgres then updates/deletes
-- 0 rows and returns NO error, so the app shows a fake success. (INSERT/SELECT
-- have working policies, which is why Add and the list still work.)
--
-- This re-asserts a permissive all-verb policy on both location tables, matching
-- what migration 036_add_missing_tables_and_columns.sql already declares.
--
-- HOW TO RUN: paste into the Supabase SQL editor and run once.
-- =============================================================================

ALTER TABLE preferred_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_locations   ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all" ON preferred_locations;
CREATE POLICY "Allow all" ON preferred_locations FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all" ON clinic_locations;
CREATE POLICY "Allow all" ON clinic_locations FOR ALL USING (true) WITH CHECK (true);
