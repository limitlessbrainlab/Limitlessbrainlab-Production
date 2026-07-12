/**
 * Patient document storage client.
 *
 * The patients_documents bucket is PRIVATE. Clinics/patients have no Supabase
 * session (only the public anon key), so all storage operations go through the
 * Express backend, which uses the service-role key. Auth is a static app token
 * (VITE_PATIENT_DOCS_TOKEN) sent as a Bearer header.
 */

const DEFAULT_BUCKET = 'patients_documents';

function getBaseUrl() {
  const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:5000');
  return apiUrl.replace(/\/api\/?$/, '');
}

function authHeaders(extra = {}) {
  const token = import.meta.env.VITE_PATIENT_DOCS_TOKEN;
  const headers = { ...extra };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

/**
 * Upload a file to the private bucket.
 * @param {File} file
 * @param {string} filePath - desired path within the bucket (re-sanitized server-side)
 * @returns {Promise<{ path: string, bucket: string }>}
 */
export async function uploadPatientDocument(file, filePath) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('filePath', filePath);

  const res = await fetch(`${getBaseUrl()}/api/patient-documents/upload`, {
    method: 'POST',
    headers: authHeaders(), // do NOT set Content-Type; browser sets multipart boundary
    body: formData,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    throw new Error(data.error || `Upload failed (${res.status})`);
  }
  return { path: data.path, bucket: data.bucket || DEFAULT_BUCKET };
}

/**
 * Get a short-lived signed URL for a private file.
 * @returns {Promise<string|null>}
 */
export async function getPatientDocSignedUrl(bucket, path, expiresIn = 300) {
  const res = await fetch(`${getBaseUrl()}/api/patient-documents/signed-url`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ bucket: bucket || DEFAULT_BUCKET, path, expiresIn }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    throw new Error(data.error || `Signed URL failed (${res.status})`);
  }
  return data.signedUrl || null;
}

/**
 * Delete a file from the private bucket.
 */
export async function deletePatientDocument(bucket, path) {
  const res = await fetch(`${getBaseUrl()}/api/patient-documents/delete`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ bucket: bucket || DEFAULT_BUCKET, path }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    throw new Error(data.error || `Delete failed (${res.status})`);
  }
  return true;
}
