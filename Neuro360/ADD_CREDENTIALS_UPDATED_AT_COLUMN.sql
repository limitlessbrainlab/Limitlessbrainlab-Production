-- ================================================
-- Add credentials_updated_at column to clinics + patients tables
-- ================================================
-- Run this in the Supabase SQL Editor BEFORE deploying the app change.
--
-- WHY: When an admin changes a clinic/partner's email or password, or a clinic
-- changes a patient's email or password, that user's currently open session must
-- be force-logged-out. Sessions are validated on a background poll against this
-- timestamp: the client captures its value at login, and if the DB value later
-- advances, the open session is wiped and the user must sign in again.
-- Bumped ONLY on email/password changes (not on unrelated edits like name/phone),
-- so ordinary edits never log anyone out.
-- ================================================

-- Step 1: Add the column to both tables
ALTER TABLE clinics
ADD COLUMN IF NOT EXISTS credentials_updated_at TIMESTAMPTZ;

ALTER TABLE patients
ADD COLUMN IF NOT EXISTS credentials_updated_at TIMESTAMPTZ;

-- Step 2: Reload PostgREST schema cache so the API sees the new column immediately
NOTIFY pgrst, 'reload schema';

-- Step 3: Verify the columns exist
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name IN ('clinics', 'patients')
AND column_name = 'credentials_updated_at';
