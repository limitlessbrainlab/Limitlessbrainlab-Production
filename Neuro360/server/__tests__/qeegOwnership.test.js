const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const express = require('express');
const access = require('../utils/patientAccess');

test('QEEG endpoints deny unrelated records before storage or report processing', async t => {
  const patientId = '12345678-1234-4234-8234-123456789abc';
  const clinicId = '22345678-1234-4234-8234-123456789abc';
  let user = { role: 'clinic_admin', clinic_id: 'other-clinic' };
  let storageReads = 0;
  const db = { from() { const query = { select() { return query; }, eq() { return query; }, maybeSingle: async () => ({ data: { id: patientId, clinic_id: clinicId } }) }; return query; } };
  const context = {
    module: { exports: {} }, __dirname: path.join(__dirname, '../routes'), process,
    console: { log() {}, warn() {}, error() {} }, Buffer,
    require(name) {
      if (['express', 'multer', 'path', 'fs'].includes(name)) return require(name);
      if (name === '../dbRouter') return { createRoutedClient: () => db };
      if (name === '../utils/patientAccess') return { ...access, requirePatientAccess: (u, p, c) => access.requirePatientAccess(u, p, c, db) };
      if (name === '../services/supabaseStorage') return { listPatientQEEGFiles: async () => { storageReads++; return { eyesOpen: [], eyesClosed: [] }; } };
      return {};
    }
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../routes/qeegRoutes.js'), 'utf8'), context);
  const router = context.module.exports;
  const app = express(); app.use(express.json()); app.use((req, res, next) => { req.user = user; next(); }); app.use(router);
  const server = app.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve)); t.after(() => server.close());
  const url = endpoint => `http://127.0.0.1:${server.address().port}/${endpoint}`;
  assert.equal((await fetch(url(`patient-qeeg-files/${patientId}`))).status, 403);
  assert.equal(storageReads, 0);
  assert.equal((await fetch(url('supabase-pdfs'))).status, 403);
  assert.equal((await fetch(url('generate-pdf'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ patientData: { patientId, clinicId } }) })).status, 403);
  const response = { status(code) { this.code = code; return this; }, json(body) { this.body = body; } };
  await router.processQeegRequest({ user, body: { patientId, clinicId }, files: { eyesOpen: [{ path: '/nonexistent-fixture-eo.pdf' }], eyesClosed: [{ path: '/nonexistent-fixture-ec.pdf' }] } }, response);
  assert.equal(response.code, 403, 'direct Vercel entry also checks ownership before validation/AI/storage');
  user = { role: 'clinic_admin', clinic_id: clinicId };
  assert.equal((await fetch(url(`patient-qeeg-files/${patientId}`))).status, 200);
  assert.equal(storageReads, 1);
  user = { role: 'patient', patient_id: patientId };
  assert.equal((await fetch(url(`patient-qeeg-files/${patientId}`))).status, 200);
  assert.equal(storageReads, 2);
});

test('live Claude report uploads verify patient and saved result ownership', () => {
  const source = fs.readFileSync(path.join(__dirname, '../routes/claudeReportRoutes.js'), 'utf8');
  assert.ok(source.includes("router.post('/', authMiddleware, upload.single('pdf')"));
  assert.match(source, /requirePatientAccess\(req\.user, patientId/);
  assert.match(source, /savedResult\.patient_id !== authorizedPatient\.id/);
  assert.match(source, /SupabaseStorage\.uploadFile\([\s\S]*?authorizedPatient\.id\)/);
  assert.doesNotMatch(source, /sidecarAuth/);
});
