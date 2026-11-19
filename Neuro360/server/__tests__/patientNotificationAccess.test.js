const { test } = require('node:test');
const assert = require('node:assert/strict');
const { patientNotificationAccess } = require('../middleware/patientNotificationAccess');

function fixture({ owner = 'p1' } = {}) {
  const calls = [];
  const patient = { id: 'p1', email: 'person@example.test', full_name: 'Patient', clinic_id: 'c1', org_id: 'c1' };
  const db = {
    supabaseUrl: 'https://project.supabase.co',
    from(table) {
      const query = { select() { return this; }, eq() { return this; }, or(value) { calls.push(['scope', value]); return this; }, order() { return this; }, limit() { return this; },
        async maybeSingle() { return table === 'patients' ? { data: patient } : { data: { email: 'clinic@example.test', name: 'Clinic' } }; } };
      return query;
    },
    async rpc(name, args) { calls.push(['rpc', name, args]); return { data: owner }; },
    storage: { from(bucket) { return { async createSignedUrl(path, expiry) { calls.push(['sign', bucket, path, expiry]); return { data: { signedUrl: 'https://signed.invalid/report' } }; } }; } }
  };
  let next = 0, status;
  const middleware = patientNotificationAccess('patientEmail', db);
  return { calls, run: (req) => middleware(req, { status(code) { status = code; return this; }, json() {} }, () => { next++; }), state: () => ({ next, status }) };
}

test('patient report email is bound to a clinic patient and gets a fresh signed URL', async () => {
  const f = fixture();
  const req = { user: { role: 'clinic_admin', clinic_id: 'c1' }, body: { patientEmail: 'PERSON@example.test', reportUrl: 'https://project.supabase.co/storage/v1/object/public/patients_documents/p1/report.pdf' } };
  await f.run(req);
  assert.equal(f.state().next, 1);
  assert.equal(req.body.patientEmail, 'person@example.test');
  assert.equal(req.body.reportUrl, 'https://signed.invalid/report');
  assert.deepEqual(f.calls.at(-1), ['sign', 'patients_documents', 'p1/report.pdf', 604800]);
});

test('report email keeps a verified storage reference instead of minting a signed URL', async () => {
  const f = fixture();
  const req = {
    path: '/api/send-report-email',
    user: { role: 'clinic_admin', clinic_id: 'c1' },
    body: { patientEmail: 'PERSON@example.test', reportUrl: 'https://project.supabase.co/storage/v1/object/public/neurosense-reports/p1/report.pdf' }
  };
  await f.run(req);
  assert.equal(f.state().next, 1);
  assert.deepEqual(req.reportAttachmentRef, { bucket: 'neurosense-reports', path: 'p1/report.pdf' });
  assert.equal(req.body.reportUrl, 'https://limitlessbrainlab.com/patient/login');
  assert.equal(f.calls.some(call => call[0] === 'sign'), false);
});

test('unverified and cross-clinic email recipients are denied before mail handlers', async () => {
  const anonymous = fixture();
  await anonymous.run({ user: null, body: { patientEmail: 'person@example.test' } });
  assert.equal(anonymous.state().status, 401);
  const mismatched = fixture({ owner: 'other-patient' });
  await mismatched.run({ user: { role: 'clinic_admin', clinic_id: 'c1' }, body: { patientEmail: 'person@example.test', reportUrl: 'https://project.supabase.co/storage/v1/object/public/patients_documents/p1/report.pdf' } });
  assert.equal(mismatched.state().status, 403);
  assert.equal(mismatched.calls.some(call => call[0] === 'sign'), false);
});
