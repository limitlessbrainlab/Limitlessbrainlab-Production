const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { extractPageImage } = require('../services/pdf/yourNumbersPage');

const BUCKET = 'qeeg-uploads';

function isQeegUploadPath(value) {
  return typeof value === 'string'
    && value.endsWith('.pdf')
    && value.includes('/')
    && !value.startsWith('/')
    && !value.includes('..')
    && !value.startsWith('_');
}

function requireBothMaps(maps) {
  if (!maps?.eyesClosed) throw new Error('Eyes Closed Page 6 map was not rendered');
  if (!maps?.eyesOpen) throw new Error('Eyes Open Page 6 map was not rendered');
  return maps;
}

function createRenderQueue(limit = 2, maxQueued = 8) {
  let active = 0;
  const waiting = [];
  const next = () => {
    if (active >= limit || waiting.length === 0) return;
    const { task, resolve, reject } = waiting.shift();
    active += 1;
    Promise.resolve(task()).then(resolve, reject).finally(() => {
      active -= 1;
      next();
    });
  };
  return {
    run(task) {
      if (waiting.length >= maxQueued) return Promise.reject(new Error('Page 6 render queue is full; please retry shortly'));
      return new Promise((resolve, reject) => {
        waiting.push({ task, resolve, reject });
        next();
      });
    }
  };
}

const renderQueue = createRenderQueue();

function isAuthorized(header) {
  const token = process.env.PDF_RENDER_TOKEN || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const supplied = String(header || '').replace(/^Bearer\s+/i, '');
  const expected = Buffer.from(token);
  const actual = Buffer.from(supplied);
  return expected.length > 0 && expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

function storageClient() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Render map storage credentials are not configured');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function downloadPdf(client, storagePath, condition) {
  const { data, error } = await client.storage.from(BUCKET).download(storagePath);
  if (error) throw new Error(`${condition} PDF download failed: ${error.message}`);
  const localPath = path.join('/tmp', `qeeg-map-${crypto.randomUUID()}.pdf`);
  fs.writeFileSync(localPath, Buffer.from(await data.arrayBuffer()));
  return localPath;
}

async function renderMaps({ eyesClosedPath, eyesOpenPath }) {
  if (!isQeegUploadPath(eyesClosedPath) || !isQeegUploadPath(eyesOpenPath)) {
    throw new Error('Invalid qEEG upload path');
  }
  const client = storageClient();
  let eyesClosedFile;
  let eyesOpenFile;
  try {
    eyesClosedFile = await downloadPdf(client, eyesClosedPath, 'Eyes Closed');
    eyesOpenFile = await downloadPdf(client, eyesOpenPath, 'Eyes Open');
    const maps = requireBothMaps({
      eyesClosed: (await extractPageImage(eyesClosedFile))?.toString('base64'),
      eyesOpen: (await extractPageImage(eyesOpenFile))?.toString('base64'),
    });
    return maps;
  } finally {
    for (const file of [eyesClosedFile, eyesOpenFile]) {
      if (file && fs.existsSync(file)) fs.unlinkSync(file);
    }
  }
}

async function internalQeegMapRenderRoute(req, res) {
  if (!isAuthorized(req.headers.authorization)) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const maps = await renderQueue.run(() => renderMaps(req.body || {}));
    return res.status(200).json(maps);
  } catch (error) {
    const status = error.message === 'Invalid qEEG upload path' ? 400 : 502;
    return res.status(status).json({ message: `Page 6 map rendering failed: ${error.message}` });
  }
}

module.exports = { internalQeegMapRenderRoute, createRenderQueue, isQeegUploadPath, requireBothMaps };
