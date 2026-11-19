const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const vm = require('node:vm');

function createFixture({ queueError = null, emailConfigured = true } = {}) {
  const source = fs.readFileSync(require.resolve('../index.js'), 'utf8');
  const start = source.indexOf("app.post('/api/send-report-email',");
  const end = source.indexOf('\n});', start);
  let handler;
  let queuedJob;
  let sendCount = 0;
  vm.runInNewContext(source.slice(start, end + '\n});'.length), {
    app: { post: (_path, _auth, _access, callback) => { handler = callback; } },
    authMiddleware() {},
    patientNotificationAccess: () => () => {},
    require: () => ({ requirePatientAccess: async () => ({ id: 'patient-1', full_name: 'Rakesh', clinic_id: 'clinic-1' }) }),
    supabase: {
      rpc: async () => ({ data: 'patient-1' }),
      from: table => table === 'report_email_jobs'
        ? { insert: async job => { queuedJob = job; return { error: queueError }; } }
        : { select() { return this; }, eq() { return this; }, async maybeSingle() { return { data: { email: 'clinic@example.test', clinic_name: 'Clinic' } }; } },
    },
    emailTransporter: emailConfigured ? { async sendMail() { sendCount++; } } : null,
    EMAIL_FROM: { address: 'sender@example.test', name: 'LBL' },
    APP_URL: 'https://limitlessbrainlab.com',
    INTERNAL_COPY_EMAIL: 'audit@example.test',
    process: { env: {} },
    Buffer,
    URL,
    randomUUID: () => 'job-1',
    console: { log() {}, error() {} },
  });

  return {
    get queuedJob() { return queuedJob; },
    get sendCount() { return sendCount; },
    async request() {
      const res = {
        statusCode: 200,
        status(code) { this.statusCode = code; return this; },
        json(body) { this.body = body; return this; },
      };
      await handler({
        user: { id: 'admin-1', role: 'super_admin' },
        authorizedPatient: { id: 'patient-1', email: 'patient@example.test' },
        reportAttachmentRef: { bucket: 'neurosense-reports', path: 'reports/patient/report.pdf' },
        body: { patientId: 'patient-1', patientEmail: 'patient@example.test', reportUrl: 'https://limitlessbrainlab.com/patient/login', reportType: 'neurosense' },
      }, res);
      return res;
    },
  };
}

test('report email request durably queues the authorized report without waiting for SMTP', async () => {
  const fixture = createFixture();
  const response = await fixture.request();
  assert.equal(response.statusCode, 202);
  assert.deepEqual(JSON.parse(JSON.stringify(response.body)), {
    success: true,
    status: 'queued',
    jobId: 'job-1',
    message: 'Report email queued and will be delivered in the background',
  });
  assert.equal(fixture.queuedJob.patient_id, 'patient-1');
  assert.equal(fixture.queuedJob.requested_by, 'admin-1');
  assert.equal(fixture.queuedJob.report_bucket, 'neurosense-reports');
  assert.equal(fixture.queuedJob.report_path, 'reports/patient/report.pdf');
  assert.equal(fixture.queuedJob.report_type, 'neurosense');
  assert.equal(fixture.sendCount, 0);
});

test('queue insert failure is returned as an error, never a false queued success', async () => {
  const fixture = createFixture({ queueError: new Error('database unavailable') });
  const response = await fixture.request();
  assert.equal(response.statusCode, 502);
  assert.equal(response.body.success, false);
  assert.equal(fixture.sendCount, 0);
});

test('missing SMTP configuration does not claim the queue accepted a job', async () => {
  const fixture = createFixture({ emailConfigured: false });
  const response = await fixture.request();
  assert.equal(response.statusCode, 500);
  assert.equal(response.body.success, false);
  assert.equal(fixture.queuedJob, undefined);
});
