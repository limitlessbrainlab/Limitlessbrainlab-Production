const crypto = require('crypto');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const PIPELINE_VERSION = 'qeeg-extraction-v1';
const CACHE_BUCKET = 'qeeg-uploads';

function hashQeegInputs(eyesOpen, eyesClosed) {
  return crypto.createHash('sha256')
    .update(PIPELINE_VERSION).update('\0eyes-open\0').update(eyesOpen)
    .update('\0eyes-closed\0').update(eyesClosed)
    .digest('hex');
}

function hashQeegFiles(eyesOpenPath, eyesClosedPath) {
  return hashQeegInputs(fs.readFileSync(eyesOpenPath), fs.readFileSync(eyesClosedPath));
}

function getSupabaseUrl(env = process.env) {
  return env.SUPABASE_URL || env.VITE_SUPABASE_URL;
}

function client() {
  const supabaseUrl = getSupabaseUrl();
  if (!supabaseUrl || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase cache credentials are not configured');
  }
  return createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function cacheObjectPath(sourceHash) {
  return `_cache/${sourceHash}.json`;
}

function isCacheMiss(error) {
  return error?.statusCode === '404' || (error?.name === 'StorageUnknownError' && error.message === '{}');
}

async function getQeegExtraction(sourceHash) {
  const { data, error } = await client().storage.from(CACHE_BUCKET).download(cacheObjectPath(sourceHash));
  if (isCacheMiss(error)) return null;
  if (error) throw error;
  return JSON.parse(Buffer.from(await data.arrayBuffer()).toString('utf8'));
}

async function saveQeegExtraction(sourceHash, qeegData, results) {
  const extraction = { qeegData, results };
  const { error } = await client().storage.from(CACHE_BUCKET).upload(
    cacheObjectPath(sourceHash),
    Buffer.from(JSON.stringify(extraction)),
    { contentType: 'application/json', upsert: false }
  );

  if (!error) return extraction;
  if (error.statusCode === '409' || /already exists/i.test(error.message)) {
    const cached = await getQeegExtraction(sourceHash);
    if (cached) return cached;
  }
  throw error;
}

module.exports = { hashQeegInputs, hashQeegFiles, getSupabaseUrl, cacheObjectPath, isCacheMiss, getQeegExtraction, saveQeegExtraction };
