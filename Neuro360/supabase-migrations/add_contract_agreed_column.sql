-- Add contract_agreed column to clinics table
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/wqykofpjpaytjuqsessf/sql

ALTER TABLE clinics
ADD COLUMN IF NOT EXISTS contract_agreed BOOLEAN DEFAULT FALSE;

-- Verify the column was added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'clinics' AND column_name = 'contract_agreed';
