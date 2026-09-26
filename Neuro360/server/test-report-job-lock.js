const assert = require('node:assert/strict');
const reportJobLock = require('./services/reportJobLock');

assert.equal(reportJobLock.acquire(), true, 'first report should acquire the worker');
assert.equal(reportJobLock.acquire(), false, 'a concurrent report should be rejected');
reportJobLock.release();
assert.equal(reportJobLock.acquire(), true, 'the worker should be reusable after completion');
reportJobLock.release();

console.log('report job lock self-check passed');
