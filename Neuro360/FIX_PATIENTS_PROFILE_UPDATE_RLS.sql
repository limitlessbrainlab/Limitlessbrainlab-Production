-- =============================================================================
-- FIX: Patient profile / clinical-history edits do not persist
-- =============================================================================
-- Symptom: In the patient portal, editing profile details (avatar "Profile"
-- modal, the "Edit Profile" section, or the "Clinical & Medical History" form)
-- appears to save -- sometimes with a success toast -- but the change reverts on
-- reload.
--
-- Root cause: Row Level Security is enabled on `patients` and `clinical_reports`
-- but the live tables are missing an effective UPDATE policy. Postgres then
-- updates 0 rows and returns NO error, so the app shows a fake success.
-- INSERT/SELECT have working policies (login, registration, and report reads all
-- work), which is why only edits fail. This is the exact pattern already fixed
-- for preferred_locations / clinic_locations in FIX_PREFERRED_LOCATIONS_RLS.sql.
--
-- All patient edits go frontend -> Supabase directly (no backend route), and
-- patients authenticate via custom bcrypt (often no Supabase Auth session), so an
-- auth.uid()-gated or missing UPDATE policy matches 0 rows.
--
-- HOW TO RUN: paste into the Supabase SQL editor and run once.
-- =============================================================================

ALTER TABLE patients         ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all" ON patients;
CREATE POLICY "Allow all" ON patients FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all" ON clinical_reports;
CREATE POLICY "Allow all" ON clinical_reports FOR ALL USING (true) WITH CHECK (true);
