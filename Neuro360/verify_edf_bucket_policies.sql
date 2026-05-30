-- ================================================
-- VERIFY EDF BUCKET POLICIES
-- ================================================
-- Run this to check if policies are correctly set

-- Check if edf-files bucket exists
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id = 'edf-files';

-- Check all policies for storage.objects table related to edf-files
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'objects'
AND (policyname LIKE '%edf%' OR policyname LIKE '%eeg%')
ORDER BY policyname;

-- If no policies found, create them again
DO $$
BEGIN
  -- Drop and recreate policies for edf-files
  DROP POLICY IF EXISTS "Allow authenticated users to upload edf" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated users to view edf" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated users to update edf" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated users to delete edf" ON storage.objects;

  -- Create fresh policies
  CREATE POLICY "Allow authenticated users to upload edf"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'edf-files');

  CREATE POLICY "Allow authenticated users to view edf"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'edf-files');

  CREATE POLICY "Allow authenticated users to update edf"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'edf-files')
  WITH CHECK (bucket_id = 'edf-files');

  CREATE POLICY "Allow authenticated users to delete edf"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'edf-files');

  RAISE NOTICE 'Policies recreated successfully for edf-files bucket!';
END $$;

-- Verify policies were created
SELECT
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'objects'
AND policyname LIKE '%edf%'
ORDER BY policyname;
