const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync(require.resolve('../index.js'), 'utf8');
const start = source.indexOf("app.post('/api/auth/login'");
const end = source.indexOf('\n});', start) + 4;
const route = source.slice(start, end);

async function invoke({ type, db, auth, clinicSession, patientAuth, actor }) {
  let handler;
  const context = {
    app: { post(_path, ...callbacks) { handler = callbacks.at(-1); } },
    rateLimiters: { loginLimiter() {} },
    createRoutedClient: () => db,
    createAuthClient: () => auth,
    establishClinicSession: clinicSession,
    ensurePatientAuth: patientAuth,
    verifiedPortalUser: async (_db, token) => { assert.ok(token); return actor; },
    console: { error() {} },
  };
  vm.runInNewContext(route, context);
  let status = 200;
  const response = { set() { return this; }, status(n) { status = n; return this; }, json(body) { this.body = body; return this; } };
  await handler({ body: { email: 'person@example.test', password: 'secret', userType: type }, headers: { origin: 'https://limitlessbrainlab.com' }, get(name) { return this.headers[name.toLowerCase()]; } }, response);
  return { status, body: response.body };
}

test('clinic login returns a verified native session while service auth stays untouched', async () => {
  const db = { rpc: async () => ({ data: [{ id: 'clinic-id', email: 'person@example.test', is_active: true }], error: null }), auth: { signInWithPassword() { assert.fail('shared service client must not sign in'); } } };
  const auth = { auth: { verifyOtp: async () => ({ data: { user: { id: 'auth-clinic' }, session: { access_token: 'clinic-access', refresh_token: 'clinic-refresh' } } }) } };
  const result = await invoke({ type: 'clinic', db, auth, clinicSession: async () => ({ status: 200, token_hash: 'once', auth_user_id: 'auth-clinic' }), actor: { id: 'auth-clinic', role: 'clinic_admin', clinic_id: 'clinic-id' } });
  assert.equal(result.status, 200);
  assert.deepEqual(JSON.parse(JSON.stringify(result.body.session)), { access_token: 'clinic-access', refresh_token: 'clinic-refresh' });
  assert.equal(result.body.user.role, 'clinic_admin');
});

test('patient login binds the independently signed-in session before returning it', async () => {
  const patient = { id: 'patient-id', email: 'person@example.test', full_name: 'Patient', clinic_id: 'clinic-id' };
  const db = { rpc: async () => ({ data: [patient], error: null }), auth: { signInWithPassword() { assert.fail('shared service client must not sign in'); } } };
  const auth = { auth: { signInWithPassword: async () => ({ data: { user: { id: 'auth-patient' }, session: { access_token: 'patient-access', refresh_token: 'patient-refresh' } } }) } };
  let binds = 0;
  const result = await invoke({ type: 'patient', db, auth, patientAuth: async ({ token }) => { binds++; return { status: 200, patient, authUser: { id: 'auth-patient' }, bound: !!token }; }, actor: { id: 'auth-patient', role: 'patient', patient_id: 'patient-id' } });
  assert.equal(result.status, 200);
  assert.equal(binds, 2);
  assert.equal(result.body.token, 'patient-access');
  assert.equal(result.body.session.refresh_token, 'patient-refresh');
});

test('admin login returns only a currently mapped superadmin session', async () => {
  const query = { select() { return this; }, eq() { return this; }, limit: async () => ({ data: [{ id: 'admin-id', email: 'person@example.test', role: 'super_admin' }], error: null }) };
  const db = { from: () => query, auth: { signInWithPassword() { assert.fail('shared service client must not sign in'); } } };
  const auth = { auth: { signInWithPassword: async () => ({ data: { user: { id: 'admin-id' }, session: { access_token: 'admin-access', refresh_token: 'admin-refresh' } } }) } };
  const result = await invoke({ type: 'admin', db, auth, actor: { id: 'admin-id', role: 'super_admin' } });
  assert.equal(result.status, 200);
  assert.equal(result.body.user.role, 'super_admin');
  assert.equal(result.body.session.access_token, 'admin-access');
});
