const assert = require('assert');
const path = require('path');

const { getReportUploadDir, needsInstanceReportLock } = require('../services/reportRuntime');

assert.strictEqual(getReportUploadDir({ VERCEL: '1' }), '/tmp/neuro360-uploads');
assert.strictEqual(needsInstanceReportLock({ VERCEL: '1' }), false);
assert.strictEqual(needsInstanceReportLock({}), true);

const vercelConfig = require(path.join(__dirname, '../../vercel.json'));
const configuredReportFiles = vercelConfig.functions['api/process-neurosense-report.js'].includeFiles;
const reportFiles = Array.isArray(configuredReportFiles) ? configuredReportFiles.join(',') : configuredReportFiles;
assert.match(reportFiles, /server\/node_modules\/\{pdf-to-img,/);
assert.match(reportFiles, /pdfjs-dist\/\{legacy\/build,cmaps,standard_fonts\}/);
assert.match(reportFiles, /@napi-rs\/\{canvas,canvas-linux-x64-gnu\}/);

console.log('vercelQeegRuntime: ok');
