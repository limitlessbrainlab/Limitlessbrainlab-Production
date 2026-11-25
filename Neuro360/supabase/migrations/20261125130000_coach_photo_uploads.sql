INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('coach-photos', 'coach-photos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit, allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY "Catalog admins can upload coach photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'coach-photos' AND (SELECT private.is_admin()));
