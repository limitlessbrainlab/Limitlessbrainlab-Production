-- 048_add_source_to_contact_inquiries.sql
--
-- Fixes "Failed to send your message" on the public Customer Inquiry form
-- (Start Your Journey / Unlock My Brain buttons).
--
-- Commit 069691c started writing a `source` value (which button the lead came
-- from: treat-my-brain / protect-my-brain) into contact_inquiries and reads it
-- back in the Super Admin "Package" column, but no migration ever added the
-- column. On a DB without it, PostgREST rejects every insert with
-- "Could not find the 'source' column of 'contact_inquiries' in the schema
-- cache", so the form save fails.

ALTER TABLE contact_inquiries
  ADD COLUMN IF NOT EXISTS source VARCHAR(100);

-- PostgREST caches the table schema; tell it to reload so the new column is
-- visible immediately without a manual API restart.
NOTIFY pgrst, 'reload schema';
