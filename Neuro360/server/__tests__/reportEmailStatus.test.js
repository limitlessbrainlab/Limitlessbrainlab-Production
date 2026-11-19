const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const vm = require('node:vm');

function fixture({ job, accessError } = {}) {
  const source = fs.readFileSync(require.resolve('../index.js'), 'utf8');
  const start = source.indexOf("app.get('/api/report-email-status',");
  const end = source.indexOf('\n});', start);
  let handler;
  let accessChecks = 0;
  vm.runInNewContext(source.slice(start, end + '\n});'.length), {
    app: { get: (_path, _auth, callback) => { handler = callback; } },
    authMiddleware() {},
    require: () => ({ requirePatientAccess: async () => { accessChecks++; if (accessError) throw accessError; } }),
    supabase: { from: () => ({ select() { return this; }, eq() { return this; }, async maybeSingle() { return { data: job, error: null }; } }) },
    console: { error() {} },
  });
  return {
    get accessChecks() { return accessChecks; },
    async request(jobId = '15a1fb8e-1c39-46cf-9fb4-3e2b13ef45a6') {
      const res = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
      await handler({ query: { jobId }, user: { id: 'admin-1' } }, res);
      return res;
    }
  };
}

test('report email status is returned only after patient ownership is checked', async () => {
  const f = fixture({ job: { id: 'job-1', status: 'sent', patient_id: 'patient-1', completed_at: 'now' } });
  const response = await f.request();
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.status, 'sent');
  assert.equal(f.accessChecks, 1);
});

test('report email status rejects invalid IDs and cross-patient access', async () => {
  const invalid = fixture({ job: null });
  assert.equal((await invalid.request('bad-id')).statusCode, 400);
  assert.equal(invalid.accessChecks, 0);

  const denied = fixture({ job: { id: 'job-1', status: 'sent', patient_id: 'patient-1' }, accessError: Object.assign(new Error('denied'), { status: 403 }) });
  assert.equal((await denied.request()).statusCode, 403);
});
