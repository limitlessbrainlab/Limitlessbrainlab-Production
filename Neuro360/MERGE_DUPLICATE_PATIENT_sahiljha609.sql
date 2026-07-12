-- ============================================================================
-- Merge duplicate patient rows for sahiljha609@gmail.com
-- ============================================================================
-- Context: the email sahiljha609@gmail.com has TWO rows in `patients`:
--
--   KEEP  5b88ec63-3d2d-49c4-9bda-5230a2e2235b  (password matches Ss11111@,
--         has 1 clinical_report + 40 algorithm_results, 0 reports)
--   MERGE b4770f56-762c-411a-9040-b7f2da0997ce  (password does NOT match,
--         has 17 reports + 1 clinical_report + 28 algorithm_results)
--
-- Duplicate emails do not block login (the app loops over both rows), but they
-- break patient-dashboard fetches that use .single() by email, and prevent a
-- unique index on patients.email.
--
-- This script reassigns all child rows from the MERGE id onto the KEEP id, then
-- deletes the MERGE row, then adds a unique index to stop this recurring.
--
-- ⚠️ REVIEW FIRST. If the 17 reports under b4770f56 are the patient's REAL
--    history and you would rather keep THAT row as canonical, swap the two UUIDs
--    below and reset its password instead (see the note at the bottom).
--
-- Run in the Supabase SQL editor (project puzdgwtprcpaaxxwkwtk) as an admin.
-- ============================================================================

BEGIN;

-- Canonical (kept) and duplicate (merged-then-deleted) patient ids
DO $$
DECLARE
  keep_id  uuid := '5b88ec63-3d2d-49c4-9bda-5230a2e2235b';
  dup_id   uuid := 'b4770f56-762c-411a-9040-b7f2da0997ce';
BEGIN
  -- Reassign every child table that references the patient. Guarded so a table
  -- that does not exist in this project is simply skipped.
  IF to_regclass('public.reports')           IS NOT NULL THEN UPDATE reports           SET patient_id = keep_id WHERE patient_id = dup_id; END IF;
  IF to_regclass('public.clinical_reports')  IS NOT NULL THEN UPDATE clinical_reports  SET patient_id = keep_id WHERE patient_id = dup_id; END IF;
  IF to_regclass('public.algorithm_results') IS NOT NULL THEN UPDATE algorithm_results SET patient_id = keep_id WHERE patient_id = dup_id; END IF;
  IF to_regclass('public.payment_history')   IS NOT NULL THEN UPDATE payment_history   SET patient_id = keep_id WHERE patient_id = dup_id; END IF;

  -- Delete the now-childless duplicate row
  DELETE FROM patients WHERE id = dup_id;
END $$;

-- Confirm exactly one row remains for this email (should return 1)
SELECT count(*) AS rows_for_email
FROM patients
WHERE lower(email) = 'sahiljha609@gmail.com';

-- Prevent duplicate patient emails going forward (case-insensitive).
-- If this fails, other duplicate emails exist — resolve them the same way first.
CREATE UNIQUE INDEX IF NOT EXISTS patients_email_lower_uidx
  ON patients (lower(email));

COMMIT;

-- ============================================================================
-- ALTERNATIVE (keep b4770f56 as canonical instead — it has the 17 reports):
--   1) Swap keep_id / dup_id above.
--   2) Reset its password so the patient can log in with Ss11111@:
--        UPDATE patients
--        SET password = crypt('Ss11111@', gen_salt('bf'))   -- needs pgcrypto
--        WHERE id = 'b4770f56-762c-411a-9040-b7f2da0997ce';
--      (or set the bcrypt hash from 5b88ec63 verbatim).
-- ============================================================================
