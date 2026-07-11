-- ================================================
-- Add plain_password column to clinics table
-- ================================================
-- Run this in the Supabase SQL Editor BEFORE deploying the app change.
--
-- WHY: On approval, the credentials email must show the SAME password the
-- clinic chose at registration. clinics.password stores only a one-way bcrypt
-- hash (not recoverable), so we also keep the clinic's chosen password here in
-- plaintext purely so the approval email can display it.
-- NOTE: This is a deliberate product decision — plaintext passwords at rest.
-- ================================================

-- Step 1: Add the column
ALTER TABLE clinics
ADD COLUMN IF NOT EXISTS plain_password TEXT;

-- Step 2: Reload PostgREST schema cache so the API sees the new column immediately
NOTIFY pgrst, 'reload schema';

-- Step 3: Verify the column exists
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'clinics'
AND column_name = 'plain_password';
