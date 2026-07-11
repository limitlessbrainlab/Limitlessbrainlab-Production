-- ================================================
-- Add plain_password column to patients table
-- ================================================
-- Run this in the Supabase SQL Editor BEFORE deploying the app change.
--
-- WHY: When a clinic updates ONLY a patient's email (password unchanged), the
-- credentials-update email must still show the patient's CURRENT password in
-- plain text. patients.password stores only a one-way bcrypt hash (not
-- recoverable), so — mirroring clinics.plain_password — we also keep the
-- patient's chosen password here in plaintext purely so those emails can
-- display it. Populated going forward on every patient password create/reset.
-- NOTE: This is a deliberate product decision — plaintext passwords at rest.
-- ================================================

-- Step 1: Add the column
ALTER TABLE patients
ADD COLUMN IF NOT EXISTS plain_password TEXT;

-- Step 2: Reload PostgREST schema cache so the API sees the new column immediately
NOTIFY pgrst, 'reload schema';

-- Step 3: Verify the column exists
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'patients'
AND column_name = 'plain_password';
