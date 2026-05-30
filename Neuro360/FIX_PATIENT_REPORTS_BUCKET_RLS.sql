-- ============================================
-- FIX: Make patient-reports bucket PUBLIC
-- This will allow uploads without RLS errors
-- ============================================

-- Step 1: Make bucket public
UPDATE storage.buckets
SET public = true
WHERE id = 'patient-reports';

-- Step 2: Verify bucket is public
SELECT id, name, public, file_size_limit/1024/1024 || ' MB' as limit
FROM storage.buckets
WHERE id = 'patient-reports';

-- If bucket doesn't exist, create it
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('patient-reports', 'patient-reports', true, 52428800)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Verify again
SELECT 'SUCCESS: Bucket configuration:' as message, id, name, public
FROM storage.buckets
WHERE id = 'patient-reports';
