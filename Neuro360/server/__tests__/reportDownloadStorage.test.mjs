import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const calls = [];
let failEdf = false;
const supabase = {
  supabaseUrl: 'https://current.supabase.co',
  storage: {
    listBuckets: async () => ({ data: [{ name: 'neurosense-reports' }] }),
    from: bucket => ({ createSignedUrl: async (path, expiresIn) => {
      calls.push({ bucket, path, expiresIn });
      return path === 'missing/report.pdf' || (failEdf && bucket === 'edf-files')
        ? { error: { message: 'missing' } }
        : { data: { signedUrl: 'fresh-signed-url' } };
    } }),
  },
};
const source = readFileSync(new URL('../../src/services/storageService.js', import.meta.url), 'utf8');
const service = vm.runInNewContext(source.replace(/^import .*;\n/, '').replace('export default new StorageService();', 'new StorageService();'), { supabase, URL, console: { error() {}, warn() {} } });

for (const mode of ['public', 'sign', 'authenticated']) {
  calls.length = 0;
  assert.equal(await service.getSignedUrl(`https://current.supabase.co/storage/v1/object/${mode}/neurosense-reports/Clinic%20A/report%2520%23.pdf?token=expired#ignored`, 300), 'fresh-signed-url');
  assert.deepEqual(calls, [{ bucket: 'neurosense-reports', path: 'Clinic A/report%20#.pdf', expiresIn: 300 }]);
}
calls.length = 0;
await service.getSignedUrl('clinic/patient/report.pdf', 300);
assert.equal(calls[0].bucket, 'edf-files');
await service.getSignedUrl('Clinic/report%20.pdf', 300, 'custom');
assert.deepEqual(calls[1], { bucket: 'custom', path: 'Clinic/report%20.pdf', expiresIn: 300 });
await service.getSignedUrl('https://current.supabase.co/storage/v1/object/public/source/report.pdf', 300, 'custom');
assert.deepEqual(calls[2], { bucket: 'custom', path: 'report.pdf', expiresIn: 300 });
failEdf = true;
await service.getSignedUrl('clinic/patient/report.pdf');
assert.equal(calls.at(-1).bucket, 'neurosense-reports');
calls.length = 0;
await assert.rejects(service.getSignedUrl('https://current.supabase.co/storage/v1/object/public/neurosense-reports/bad%ZZ.pdf'));
assert.equal(calls.length, 0);
await assert.rejects(service.getSignedUrl('https://foreign.supabase.co/storage/v1/object/public/neurosense-reports/report.pdf'));
assert.equal(calls.length, 0);
await assert.rejects(service.getSignedUrl('https://current.supabase.co/not-storage/report.pdf'));
assert.equal(calls.length, 0);
// An explicit bucket in a URL must not be retried against another bucket.
await assert.rejects(service.getSignedUrl('https://current.supabase.co/storage/v1/object/public/edf-files/clinic/report.pdf'));
assert.equal(calls.length, 1);

// Execute both patient download resolution blocks, before their DOM/blob handling.
const dashboard = readFileSync(new URL('../../src/components/patient/PatientDashboard.jsx', import.meta.url), 'utf8');
const blocks = [...dashboard.matchAll(/let downloadUrl = null;([\s\S]*?)\n\s*if \(downloadUrl\) \{/g)].map(match => match[0].replace(/\n\s*if \(downloadUrl\) \{$/, ''));
assert.equal(blocks.length, 2);
for (const block of blocks) {
  for (const [filePath, directFileUrl, expected] of [
    ['Clinic/report.pdf', 'https://current.supabase.co/storage/v1/object/public/neurosense-reports/report.pdf', 'fresh-signed-url'],
    [null, 'https://current.supabase.co/storage/v1/object/sign/neurosense-reports/report.pdf?token=expired', 'fresh-signed-url'],
    [null, 'https://external.example/report.pdf', 'https://external.example/report.pdf'],
    ['clinic/patient/report.pdf', null, 'fresh-signed-url'],
    ['missing/report.pdf', null, null],
    ['/uploads/report.pdf', '/uploads/report.pdf', '/uploads/report.pdf'],
  ]) {
    const resolve = vm.runInNewContext(`(async () => { ${block}; return downloadUrl; })`, { filePath, directFileUrl, StorageService: service, console: { log() {} } });
    assert.equal(await resolve(), expected);
  }
}
console.log('reportDownloadStorage.test.mjs: ok');
