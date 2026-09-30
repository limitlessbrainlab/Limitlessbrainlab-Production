#!/usr/bin/env node

const assert = require('assert');
const { buildReportDataFromNeuroSenseMd } = require('../services/claudeReportData');
const { renderReportHtml } = require('../templates/brainReport12Page');

const parameters = [
  ['Cognition', 2, 'Medium'],
  ['Stress', 2, 'Moderate'],
  ['Focus & Attention', 2, 'Medium'],
  ['Burnout & Fatigue', 2, 'Moderate'],
  ['Emotional Regulation', 2, 'Medium'],
  ['Learning', 2, 'Medium'],
  ['Creativity', 2, 'Medium'],
].map(([name, score, classification]) => ({ name, score, maxScore: 3, classification, metrics: [] }));

const md = `# NeuroSense Report Values
patient_name: TEST SONAM
assessment_date: 08/07/2026
overall_score: null
overall_percentage: null
param|stress|Stress|⚡|1|55|Moderate
param|cognition|Cognition|🧠|0|55|Medium
param|focus|Focus & Attention|🎯|0|55|Medium
param|learning|Learning|📚|0|55|Medium
param|burnout|Burnout & Fatigue|🔋|1|55|Moderate
param|emotional|Emotional Regulation|💗|0|55|Medium
param|creativity|Creativity|🎨|0|55|Medium
brainwave|alpha|18.9
brainwave|alphaPeakHz|10.3`;

const report = buildReportDataFromNeuroSenseMd(md, { id: 'test-sonam' }, { parameters, overallScore: 12 });

assert.equal(report.overallScore21, 12, 'NPR must preserve the canonical algorithm score');
assert.equal(report.overall, 57, 'NPR must render 12/21 as 57%, not average 55% gauge positions');
assert.deepEqual(report.bars.map((bar) => bar.percent), [55, 55, 55, 55, 55, 55, 55], 'category gauges must remain identical to NeuroSense');
assert.match(renderReportHtml(report), /18\.9% · Peak 10\.3 Hz/, 'NPR must show Alpha Power and Alpha Peak together');

console.log('NPR scoring check passed');
