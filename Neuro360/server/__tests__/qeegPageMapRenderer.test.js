const assert = require('assert');

const { decodePage6Maps, rendererUrl } = require('../services/qeegPageMapRenderer');

const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).toString('base64');

assert.throws(() => decodePage6Maps({ eyesClosed: png }), /Eyes Open/);
assert.throws(() => decodePage6Maps({ eyesOpen: png }), /Eyes Closed/);
assert.throws(() => decodePage6Maps({ eyesClosed: Buffer.from('not-a-png').toString('base64'), eyesOpen: png }), /invalid/);
assert.deepStrictEqual(decodePage6Maps({ eyesClosed: png, eyesOpen: png }), {
  eyesClosed: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  eyesOpen: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
});
assert.strictEqual(
  rendererUrl({ VITE_DIRECT_BACKEND_URL: 'https://backend.example.com/api' }),
  'https://backend.example.com/api/internal/qeeg-page-maps'
);

console.log('qeegPageMapRenderer: ok');
