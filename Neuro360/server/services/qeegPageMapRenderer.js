function rendererUrl(env = process.env) {
  const base = env.VITE_DIRECT_BACKEND_URL || env.VITE_API_URL;
  if (!base) throw new Error('Page 6 Render backend URL is not configured');
  return new URL('/api/internal/qeeg-page-maps', base).toString();
}

function decodePage6Maps(maps) {
  if (!maps?.eyesClosed) throw new Error('Eyes Closed Page 6 map was not returned');
  if (!maps?.eyesOpen) throw new Error('Eyes Open Page 6 map was not returned');
  const result = {
    eyesClosed: Buffer.from(maps.eyesClosed, 'base64'),
    eyesOpen: Buffer.from(maps.eyesOpen, 'base64'),
  };
  const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (!result.eyesClosed.subarray(0, 8).equals(pngHeader) || !result.eyesOpen.subarray(0, 8).equals(pngHeader)) {
    throw new Error('Page 6 renderer returned an invalid map');
  }
  return result;
}

async function renderPage6Maps({ eyesClosedPath, eyesOpenPath }, env = process.env) {
  const token = env.PDF_RENDER_TOKEN || env.SUPABASE_SERVICE_ROLE_KEY;
  if (!token) throw new Error('Page 6 Render token is not configured');
  let response;
  try {
    response = await fetch(rendererUrl(env), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ eyesClosedPath, eyesOpenPath }),
      signal: AbortSignal.timeout(180000),
    });
  } catch (error) {
    throw new Error(`Page 6 Render request failed: ${error.message}`);
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Page 6 Render request failed: ${body.message || response.status}`);
  return decodePage6Maps(body);
}

module.exports = { rendererUrl, decodePage6Maps, renderPage6Maps };
