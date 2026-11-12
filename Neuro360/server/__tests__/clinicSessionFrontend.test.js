const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('all deployed roles use /auth/login native session contract', async () => {
  for (const userType of ['clinic', 'patient', 'admin']) {
    const calls = [];
    const client = { auth: { setSession: async session => { calls.push(['setSession', session]); return { error: null }; } } };
    const api = { interceptors: { request: { use() {} }, response: { use() {} } } };
    const axios = { create: () => api, post: async (url, body) => { calls.push(['post', url, body]); return { data: { success: true, token: 'jwt', session: { access_token: 'jwt', refresh_token: 'refresh' }, user: { id: 'business', role: userType } } }; } };
    const context = { module: { exports: {} }, axios, Cookies: {}, window: { location: { origin: 'https://example.test' } }, SupabaseService: { supabase: client }, console: { warn() {}, error() {} }, credentialRpc: {}, sameEnv: () => true, getOriginUrl: () => '', DatabaseService: {}, fetch: async () => ({ ok: true, json: async () => ({}) }) };
    const source = fs.readFileSync(path.join(__dirname, '../../src/services/authService.js'), 'utf8').replace(/^import .*;\r?$/gm, '').replace(/import\.meta\.env/g, '({})').replace('export const authService', 'const authService').replace(/export default authService;?/, '') + '\nmodule.exports=authService;';
    vm.runInNewContext(source, context);
    const result = await context.module.exports.loginWithEmail({ email: 'person@example.test', password: 'secret', userType });
    assert.equal(result.token, 'jwt');
    assert.ok(calls[0][1].endsWith('/auth/login'));
    assert.equal(calls[1][0], 'setSession');
  }
});
