const assert = require('assert');

const { hashQeegInputs, getSupabaseUrl, cacheObjectPath, isCacheMiss } = require('../services/qeegExtractionCache');

const eyesOpen = Buffer.from('eyes-open-source');
const eyesClosed = Buffer.from('eyes-closed-source');

assert.strictEqual(
  hashQeegInputs(eyesOpen, eyesClosed),
  hashQeegInputs(Buffer.from('eyes-open-source'), Buffer.from('eyes-closed-source')),
  'the same ordered input pair must have one durable cache key'
);
assert.strictEqual(
  isCacheMiss({ name: 'StorageUnknownError', message: '{}' }),
  true,
  'Supabase Storage represents a missing cache object with an opaque error'
);
assert.strictEqual(
  cacheObjectPath(hashQeegInputs(eyesOpen, eyesClosed)),
  `_cache/${hashQeegInputs(eyesOpen, eyesClosed)}.json`,
  'cache objects must not be mixed with patient-facing upload paths'
);
assert.notStrictEqual(
  hashQeegInputs(eyesOpen, eyesClosed),
  hashQeegInputs(eyesClosed, eyesOpen),
  'eyes-open and eyes-closed must never be interchangeable'
);
assert.strictEqual(
  getSupabaseUrl({ VITE_SUPABASE_URL: 'https://production.supabase.co' }),
  'https://production.supabase.co',
  'production Vercel configuration must use VITE_SUPABASE_URL when SUPABASE_URL is absent'
);

console.log('qeegExtractionCache: ok');
