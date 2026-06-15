-- ============================================================
-- Lock down the patients_documents bucket (medical PII)
-- ============================================================
-- After this migration, NO browser client (anon or authenticated) can touch
-- this bucket. All uploads / downloads / deletes go through the Express backend
-- using the SUPABASE_SERVICE_ROLE_KEY, which bypasses RLS entirely.
--
-- Why: clinics/patients authenticate with custom local passwords (no Supabase
-- JWT), so the browser only ever holds the public anon key. Granting anon any
-- storage access would expose every patient's files to anyone with that key.
-- Run in the Supabase SQL Editor.
-- ============================================================

-- 1. Ensure the bucket exists and is PRIVATE (no public URLs resolve)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('patients_documents', 'patients_documents', false, 52428800)
ON CONFLICT (id) DO UPDATE SET public = false;

-- 2. Drop every policy that previously granted client access to this bucket.
--    With RLS enabled and no matching policy, all non-service-role requests are
--    denied. The service-role key used by the backend bypasses RLS.
DROP POLICY IF EXISTS "Allow authenticated users to upload"                 ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to view"                   ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update"                 ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete"                 ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload patient documents"    ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view patient documents"      ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update patient documents"    ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete patient documents"    ON storage.objects;
-- Defensive: in case the previous (rejected) anon policies were ever applied
DROP POLICY IF EXISTS "patients_documents anon insert" ON storage.objects;
DROP POLICY IF EXISTS "patients_documents anon select" ON storage.objects;
DROP POLICY IF EXISTS "patients_documents anon update" ON storage.objects;
DROP POLICY IF EXISTS "patients_documents anon delete" ON storage.objects;

-- 3. Verify: bucket is private and no patients_documents policies remain
SELECT id, name, public FROM storage.buckets WHERE id = 'patients_documents';

SELECT policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
  AND (qual ILIKE '%patients_documents%' OR with_check ILIKE '%patients_documents%');
-- ^ Expect ZERO rows. (Other buckets' policies, if any, are unaffected.)
