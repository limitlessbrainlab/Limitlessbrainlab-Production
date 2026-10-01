import assert from 'node:assert/strict';
import { createSseEmitter } from '../../api/generate-performance-report.js';

const headers = {};
const frames = [];
const emit = createSseEmitter({
  setHeader(name, value) { headers[name] = value; },
  flushHeaders() {},
  write(frame) { frames.push(frame); },
});

emit('progress', { stage: 'narrative', pct: 35 });

assert.equal(headers['Content-Type'], 'text/event-stream');
assert.equal(frames[0], 'event: progress\ndata: {"stage":"narrative","pct":35}\n\n');
console.log('performanceReportSse.test.mjs: ok');
