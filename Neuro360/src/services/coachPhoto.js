const photoExtensions = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp'
};

const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL?.replace(/\/$/, '');

export function normalizeCoachPhotoUrl(url) {
  if (!url || !supabaseUrl || !url.includes('/storage/v1/object/public/')) return url;
  return url.replace(/^https:\/\/[^/]+\.supabase\.co/, supabaseUrl);
}

export function validateCoachPhoto(files) {
  const file = files?.[0];
  if (!file) return true;
  if (!Object.hasOwn(photoExtensions, file.type)) return 'Choose a JPG, PNG or WebP image.';
  if (!file.size || file.size > 5 * 1024 * 1024) return 'Choose an image between 1 byte and 5 MB.';
  return true;
}

export async function uploadCoachPhoto(storage, file) {
  if (!file) return null;

  const bucket = storage.from('coach-photos');
  // ponytail: Unique paths prevent stale cached images. Old uploads need a cleanup job if storage growth warrants it.
  const path = `${crypto.randomUUID()}.${photoExtensions[file.type]}`;
  const { error } = await bucket.upload(path, file, { contentType: file.type });
  if (error) throw error;
  return bucket.getPublicUrl(path).data.publicUrl;
}
