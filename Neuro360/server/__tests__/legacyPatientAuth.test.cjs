const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

process.env.LEGACY_AUTH_JWT_SECRET = 'test-only-legacy-patient-secret';
process.env.SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

const { createLegacyPatientToken, legacyPatientFromToken } = require('../middleware/authMiddleware');

const token = createLegacyPatientToken({ id: 'patient-123', email: 'patient@example.com', credentials_updated_at: '2026-10-03T12:00:00.000Z' });
assert.deepEqual(legacyPatientFromToken(token), {
  id: 'patient-123', email: 'patient@example.com', role: 'patient', credentialsUpdatedAt: '2026-10-03T12:00:00.000Z'
});
assert.equal(legacyPatientFromToken('patient_token_123'), null);
const loginRoute = fs.readFileSync(path.join(__dirname, '../index.js'), 'utf8');
assert.match(loginRoute, /token: createLegacyPatientToken\(patient\)/);
console.log('legacyPatientAuth.test.cjs: ok');
