-- Add missing inquiry_type column to franchise_inquiries
-- The footer Partnership/Investment forms insert `inquiry_type` ('partnership' | 'investment'),
-- but the original table (migration 024) never defined this column, causing
-- PGRST204: "Could not find the 'inquiry_type' column of 'franchise_inquiries' in the schema cache"
-- and blocking all submissions + notification emails.

ALTER TABLE public.franchise_inquiries
  ADD COLUMN IF NOT EXISTS inquiry_type TEXT DEFAULT 'partnership';

-- Force PostgREST to refresh its schema cache so the new column is immediately visible
NOTIFY pgrst, 'reload schema';
