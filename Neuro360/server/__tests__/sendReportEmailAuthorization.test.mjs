import test from 'node:test';
import assert from 'node:assert/strict';
import { parseReportReference } from '../../api/send-report-email.js';
const supabase = 'https://ukmggjcvjvjodksopngs.supabase.co';

test('report email accepts only local upload and registered storage references', () => {
  assert.deepEqual(parseReportReference('/uploads/patient.pdf', supabase), { local: true, filename: 'patient.pdf' });
  assert.deepEqual(parseReportReference(`${supabase}/storage/v1/object/public/neurosense-reports/reports/patient.pdf`, supabase), {
    local: false, bucket: 'neurosense-reports', path: 'reports/patient.pdf',
  });
  assert.throws(() => parseReportReference('https://attacker.example/uploads/patient.pdf', supabase));
  assert.throws(() => parseReportReference(`${supabase}/storage/v1/object/public/neurosense-reports/%2e%2e/private.pdf`, supabase));
  assert.throws(() => parseReportReference('https://attacker.example/storage/v1/object/public/neurosense-reports/patient.pdf', supabase));
});
