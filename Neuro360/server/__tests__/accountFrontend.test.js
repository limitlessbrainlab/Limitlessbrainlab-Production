const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
function load({ admin = false, session = true, patient = false, provision = false, bound = false } = {}) {
  const calls = [];
  const client = { auth: {
    signOut: async () => {},
    signInWithPassword: async () => { calls.push('auth'); return { data: { user: { id: 'verified-id' }, session: session ? { access_token: 'jwt' } : null }, error: admin ? null : new Error('bad') }; },
    getSession: async () => ({ data: { session: session ? { access_token: 'jwt' } : null } }),
    setSession: async () => { calls.push('setSession'); return { data: { session: { access_token: 'jwt' } }, error: null }; }
  }, from(table) { calls.push(table); if (table === 'patients') return { update: () => ({ eq: async () => ({error:null}) }) }; return { select() { return this; }, eq(key, value) { assert.equal(key, 'id'); assert.equal(value, 'verified-id'); return this; }, async maybeSingle() { return { data: { id: 'verified-id', role: 'super_admin', email: 'admin@example.com' } }; } }; } };
  const api = { interceptors: { request: { use() {} }, response: { use() {} } } };
  const axios = { create: () => api, post: async (url, body) => { calls.push(url); if (!session) return { data: { success: false, error: 'Invalid email or password' } }; return { data: { success: true, token: 'jwt', session: { access_token: 'jwt', refresh_token: 'refresh' }, user: { id: 'verified-id', email: body.email, role: body.userType === 'admin' ? 'super_admin' : body.userType === 'patient' ? 'patient' : 'clinic_admin' } } }; } };
  const context = { module: { exports: {} }, console: { warn() {}, error() {} }, axios, Cookies: {}, window: { location: { origin: 'https://app.example.test' } }, SupabaseService: { supabase: client },
    credentialRpc: { verifyClinicLogin: async () => [], verifyPatientLogin: async () => patient ? [{id:'patient-id',email:'patient@example.com'}] : [] },
    sameEnv: () => true, getOriginUrl: () => '',
    DatabaseService: { get() { throw Error('public scan forbidden'); } }, PUBLIC_COLUMNS: { profiles: 'id,role,email' },
    fetch: async (url, options) => { calls.push(url); if (url.endsWith('/ensure-patient-auth') && calls.includes('auth')) assert.equal(options.headers.Authorization, 'Bearer jwt'); return { ok: provision || !url.endsWith('/ensure-patient-auth'), json: async () => ({ success: true, bound, account: { id: 'new', name: 'New', email: 'new@example.com' } }) }; }
  };
  const source = fs.readFileSync(path.join(__dirname, '../../src/services/authService.js'), 'utf8').replace(/^import .*;\r?$/gm, '').replace(/import\.meta\.env/g, '({})').replace('export const authService', 'const authService').replace(/export default authService;?/, '') + '\nmodule.exports=authService;';
  vm.runInNewContext(source, context); return { auth: context.module.exports, calls };
}
test('login keeps the deployed server endpoint and installs its native session', async () => {
  const f = load({ admin: true }); const r = await f.auth.loginWithEmail({ email: 'admin@example.com', password: 'password', userType: 'admin' });
  assert.equal(r.token, 'jwt'); assert.equal(r.user.id, 'verified-id'); assert.ok(f.calls[0].endsWith('/auth/login')); assert.equal(f.calls[1], 'setSession');
});
test('admin login without a session cannot succeed', async () => {
  const f = load({ admin: true, session: false }); await assert.rejects(() => f.auth.loginWithEmail({ email: 'admin@example.com', password: 'password' }), /Invalid email or password/);
});
test('clinic registration uses server without public scans or credential claim', async () => {
  const f = load(); const r = await f.auth.registerWithEmail({ name: 'New', email: 'new@example.com', password: 'password', confirmPassword: 'password', userType: 'clinic' });
  assert.equal(r.needsActivation, true); assert.equal(r.user.id, 'new'); assert.ok(f.calls[0].endsWith('/register-account'));
});
test('public administrator registration is rejected before requests', async () => {
  const f = load(); await assert.rejects(() => f.auth.registerWithEmail({ name: 'New', email: 'new@example.com', password: 'password', confirmPassword: 'password', userType: 'super_admin' }), /Invalid user type/); assert.equal(f.calls.length, 0);
});
test('patient signup requires real login and reports persisted account on session failure', async () => {
  const f = load(); let invoked = false;
  f.auth.loginWithEmail = async args => { invoked = true; assert.equal(args.userType, 'patient'); throw new Error('Auth unavailable'); };
  await assert.rejects(() => f.auth.registerWithEmail({ name: 'New', email: 'new@example.com', password: 'password', confirmPassword: 'password', userType: 'patient' }), /account was created.*sign-in failed/);
  assert.equal(invoked, true);
});

test('patient login receives a native session from the server contract', async () => {
  const f = load({ patient: true });
  const result = await f.auth.loginWithEmail({ email: 'patient@example.com', password: 'password', userType: 'patient' });
  assert.equal(result.token, 'jwt'); assert.equal(result.user.role, 'patient'); assert.ok(f.calls[0].endsWith('/auth/login')); assert.equal(f.calls[1], 'setSession');
});
