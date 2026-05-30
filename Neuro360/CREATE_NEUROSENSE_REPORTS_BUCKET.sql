-- ============================================
-- CREATE NEUROSENSE-REPORTS BUCKET
-- For SuperAdmin response uploads
-- ============================================

-- Step 1: Create bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'neurosense-reports',
  'neurosense-reports',
  true,
  52428800,
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = NULL;

-- Step 2: Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated uploads to neurosense-reports" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read from neurosense-reports" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated read from neurosense-reports" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete from neurosense-reports" ON storage.objects;

-- Step 4: Create permissive RLS policies

-- Allow any authenticated user to upload
CREATE POLICY "Allow authenticated uploads to neurosense-reports"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'neurosense-reports');

-- Allow anyone to read (public bucket)
CREATE POLICY "Allow public read from neurosense-reports"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'neurosense-reports');

-- Allow authenticated users to read
CREATE POLICY "Allow authenticated read from neurosense-reports"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'neurosense-reports');

-- Allow authenticated users to delete their files
CREATE POLICY "Allow authenticated delete from neurosense-reports"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'neurosense-reports');

-- Step 5: Verify
SELECT 'Bucket created:', id, name, public, file_size_limit/1024/1024 || ' MB' as limit
FROM storage.buckets
WHERE id = 'neurosense-reports';

SELECT 'Policy created:', policyname
FROM pg_policies
WHERE tablename = 'objects' AND policyname LIKE '%neurosense-reports%';
