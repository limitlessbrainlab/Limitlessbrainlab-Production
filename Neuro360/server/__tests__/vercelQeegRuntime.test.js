const assert = require('assert');
const path = require('path');

const { getReportUploadDir, needsInstanceReportLock } = require('../services/reportRuntime');

assert.strictEqual(getReportUploadDir({ VERCEL: '1' }), '/tmp/neuro360-uploads');
assert.strictEqual(needsInstanceReportLock({ VERCEL: '1' }), false);
assert.strictEqual(needsInstanceReportLock({}), true);

const vercelConfig = require(path.join(__dirname, '../../vercel.json'));
const reportFiles = vercelConfig.functions['api/process-neurosense-report.js'].includeFiles;
assert.match(reportFiles, /server\/node_modules\/pdfjs-dist\/cmaps/);
assert.match(reportFiles, /server\/node_modules\/pdfjs-dist\/standard_fonts/);
assert.match(reportFiles, /server\/node_modules\/@napi-rs\/canvas/);

console.log('vercelQeegRuntime: ok');
