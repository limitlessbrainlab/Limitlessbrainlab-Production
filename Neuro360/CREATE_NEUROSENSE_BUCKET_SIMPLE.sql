-- ============================================
-- SIMPLE: Create neurosense-reports bucket
-- Run this as service_role or use Dashboard UI
-- ============================================

-- Just create the bucket (public)
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
  file_size_limit = 52428800;

-- Verify
SELECT id, name, public, file_size_limit/1024/1024 || ' MB' as limit
FROM storage.buckets
WHERE id = 'neurosense-reports';
