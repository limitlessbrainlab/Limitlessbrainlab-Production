-- =====================================================
-- CREATE SUPABASE STORAGE BUCKETS
-- =====================================================

-- Create patient-reports bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('patient-reports', 'patient-reports', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Create eeg-files bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('eeg-files', 'eeg-files', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Create reports bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('reports', 'reports', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Create clinic-logos bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('clinic-logos', 'clinic-logos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing policies first
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload files" ON storage.objects;

-- Allow public read access to patient-reports bucket
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'patient-reports' );

-- Allow authenticated users to upload to all buckets
CREATE POLICY "Authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id IN ('patient-reports', 'eeg-files', 'reports', 'clinic-logos') );

-- Allow authenticated users to update files
CREATE POLICY "Authenticated updates"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id IN ('patient-reports', 'eeg-files', 'reports', 'clinic-logos') );

-- Allow authenticated users to delete files
CREATE POLICY "Authenticated deletes"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id IN ('patient-reports', 'eeg-files', 'reports', 'clinic-logos') );

-- Verify buckets created
SELECT 
  id,
  name,
  public,
  created_at
FROM storage.buckets
ORDER BY created_at;
