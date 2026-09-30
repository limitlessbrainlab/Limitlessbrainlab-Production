const assert = require('node:assert/strict');
const fs = require('node:fs');
const { buildPillBarDisplay } = require('../services/geminiPdfGenerator');

const generatorSource = fs.readFileSync(require.resolve('../services/geminiPdfGenerator'), 'utf8');
assert.match(generatorSource, /'ALPHA ASYMMETRY': 'Alpha Asymmetry \(Frontal\)'/);

const display = buildPillBarDisplay(-1.22, {
  min: -10,
  max: 10,
  unit: '',
  steps: 4,
  normalMin: -1,
  normalMax: 1,
  symmetric: true
});

assert.equal(display.score, 44);
assert.deepEqual(display.scale, {
  min: -10,
  max: 10,
  value: -1.22,
  unit: '',
  steps: 4,
  normalMin: -1,
  normalMax: 1
});

console.log('alphaAsymmetryScale.test.js: ok');
