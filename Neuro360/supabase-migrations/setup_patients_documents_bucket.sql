-- ================================================
-- Setup patients_documents bucket policies
-- Run this in Supabase SQL Editor if uploads fail
-- ================================================

-- First, create the bucket if it doesn't exist (run in Dashboard > Storage)
-- Bucket name: patients_documents
-- Public: false (or true if you want public access)

-- Storage policies for patients_documents bucket
-- Allow authenticated users to upload files
INSERT INTO storage.policies (name, bucket_id, operation, definition)
SELECT
  'Allow authenticated uploads',
  id,
  'INSERT',
  '(auth.role() = ''authenticated'')'::jsonb
FROM storage.buckets
WHERE name = 'patients_documents'
ON CONFLICT DO NOTHING;

-- Allow authenticated users to read files
INSERT INTO storage.policies (name, bucket_id, operation, definition)
SELECT
  'Allow authenticated reads',
  id,
  'SELECT',
  '(auth.role() = ''authenticated'')'::jsonb
FROM storage.buckets
WHERE name = 'patients_documents'
ON CONFLICT DO NOTHING;

-- Allow authenticated users to update files
INSERT INTO storage.policies (name, bucket_id, operation, definition)
SELECT
  'Allow authenticated updates',
  id,
  'UPDATE',
  '(auth.role() = ''authenticated'')'::jsonb
FROM storage.buckets
WHERE name = 'patients_documents'
ON CONFLICT DO NOTHING;

-- Allow authenticated users to delete files
INSERT INTO storage.policies (name, bucket_id, operation, definition)
SELECT
  'Allow authenticated deletes',
  id,
  'DELETE',
  '(auth.role() = ''authenticated'')'::jsonb
FROM storage.buckets
WHERE name = 'patients_documents'
ON CONFLICT DO NOTHING;

-- Alternative: Simple RLS policies using SQL
-- If the above doesn't work, try these in SQL Editor:

/*
-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policy for patients_documents bucket
CREATE POLICY "patients_documents_insert" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'patients_documents');

CREATE POLICY "patients_documents_select" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'patients_documents');

CREATE POLICY "patients_documents_update" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'patients_documents');

CREATE POLICY "patients_documents_delete" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'patients_documents');
*/

-- Or simplest approach - make bucket public (not recommended for sensitive data)
-- UPDATE storage.buckets SET public = true WHERE name = 'patients_documents';

SELECT 'Bucket policies setup complete!' as result;
