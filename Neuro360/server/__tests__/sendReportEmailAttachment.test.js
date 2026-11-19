const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const vm = require('node:vm');

test('report email attaches the owned PDF and never sends its storage URL', async () => {
  const source = fs.readFileSync(require.resolve('../index.js'), 'utf8');
  const start = source.indexOf("app.post('/api/send-report-email',");
  const end = source.indexOf('\n});', start);
  const messages = [];
  let handler;
  let fileBytes = Buffer.from('%PDF-report');
  let downloadError = null;
  vm.runInNewContext(source.slice(start, end + '\n});'.length), {
    app: { post: (_path, _auth, _access, callback) => { handler = callback; } },
    authMiddleware() {},
    patientNotificationAccess: () => () => {},
    require: () => ({ requirePatientAccess: async () => ({ id: 'patient-1', full_name: 'Rakesh', clinic_id: null }) }),
    supabase: {
      rpc: async () => ({ data: 'patient-1' }),
      from: () => ({ select() { return this; }, eq() { return this; }, async maybeSingle() { return { data: null }; } }),
      storage: { from: bucket => ({ async download(objectPath) {
        assert.equal(bucket, 'neurosense-reports');
        assert.equal(objectPath, 'reports/patient/report.pdf');
        return downloadError ? { error: downloadError } : { data: { arrayBuffer: async () => fileBytes.buffer.slice(fileBytes.byteOffset, fileBytes.byteOffset + fileBytes.byteLength) } };
      } }) }
    },
    emailTransporter: { async sendMail(message) { messages.push(message); } },
    getNeuroSenseReportEmailHtml: options => JSON.stringify(options),
    getReportEmailHtml: options => JSON.stringify(options),
    getLogoAttachment: () => [],
    EMAIL_FROM: { address: 'sender@example.test', name: 'LBL' },
    APP_URL: 'https://limitlessbrainlab.com',
    INTERNAL_COPY_EMAIL: 'audit@example.test',
    process: { env: {} },
    Buffer,
    URL,
    console: { log() {}, error() {} },
  });

  const deliver = async () => {
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
  };

  assert.equal((await deliver()).statusCode, 200);
  assert.equal(messages.length, 1);
  const attachment = messages[0].attachments.find(item => item.contentType === 'application/pdf');
  assert.equal(attachment.filename, 'NeuroSense-Report-Rakesh.pdf');
  assert.equal(attachment.content.toString(), '%PDF-report');
  assert.match(messages[0].text, /attached to this email as a PDF/);
  assert.doesNotMatch(messages[0].text, /storage\/v1\/object/);
  assert.doesNotMatch(messages[0].html, /storage\/v1\/object/);

  downloadError = new Error('missing PDF');
  assert.equal((await deliver()).statusCode, 502);
  assert.equal(messages.length, 1);

  fileBytes = Buffer.alloc(15 * 1024 * 1024 + 1);
  downloadError = null;
  assert.equal((await deliver()).statusCode, 413);
  assert.equal(messages.length, 1);
});
