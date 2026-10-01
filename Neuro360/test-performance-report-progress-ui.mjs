import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync('src/components/admin/AlgorithmDataProcessor.jsx', 'utf8');

assert.match(source, /data-testid="performance-report-progress"/);
assert.match(source, /Report generation/);
assert.match(source, /Final PDF/);
assert.match(source, /claudeStages\.map/);
