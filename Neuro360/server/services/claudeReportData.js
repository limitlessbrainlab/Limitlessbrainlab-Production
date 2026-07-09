/**
 * Build the structured data object that drives the 12-page
 * "Brain Type & Performance Report". Every number here comes straight from the
 * deterministic algorithm (algorithmCalculator.js output) and the parsed qEEG
 * data — nothing is recomputed by Claude. Claude only writes narrative prose on
 * top of these numbers.
 */

const { classifyBrainType5 } = require('./brainType5Classifier');

const POSTERIOR_CHANNELS = ['Pz', 'P3', 'P4', 'O1', 'O2', 'Oz'];

function round1(n) {
  return Math.round(n * 10) / 10;
}

/** Average relative power for a band across the given channels (skips missing). */
function avgRelative(qeegData, condition, channels, band) {
  const table = qeegData?.[condition]?.relative;
  if (!table) return null;
  let sum = 0;
  let count = 0;
  for (const ch of channels) {
    const v = table[ch]?.[band];
    if (typeof v === 'number' && isFinite(v)) {
      sum += v;
      count++;
    }
  }
  return count ? sum / count : null;
}

function readMetricValue(m) {
  const v = m?.value ?? m?.score ?? null;
  if (typeof v === 'number') return isFinite(v) ? v : null;
  if (typeof v === 'string') return v || null;
  if (v && typeof v === 'object') return v;
  return null;
}

function metricMatch(parameters, includes) {
  const needle = includes.toLowerCase();
  let fallback = null;
  for (const p of parameters || []) {
    for (const m of p.metrics || []) {
      const name = String(m.name || '').toLowerCase();
      if (name === needle || name.startsWith(`${needle} (`)) return m;
      if (!fallback && name.includes(needle)) {
        fallback = m;
      }
    }
  }
  return fallback;
}

/** Pull a sub-metric value from the algorithm results by partial name. */
function metricValue(parameters, includes) {
  return readMetricValue(metricMatch(parameters, includes));
}

function score(parameters, name) {
  const p = (parameters || []).find((x) => x.name === name);
  return p ? p.score : 0;
}

function normalizeIncomingAlgorithmResults(algorithmResults) {
  const candidates = Array.isArray(algorithmResults)
    ? algorithmResults
    : (algorithmResults && Array.isArray(algorithmResults.parameters)
      ? algorithmResults.parameters
      : (algorithmResults && Array.isArray(algorithmResults.results) ? algorithmResults.results : []));

  if (!Array.isArray(candidates)) return [];

  return candidates
    .map((item) => {
      const name = item?.parameter || item?.name || 'Unknown';
      const rawScore = item?.rawScore || item?.raw_score || item?.score || item?.result;
      const scoreParts = String(rawScore || '').split('/');
      const score = Number(scoreParts[0]);
      const maxScore = Number(scoreParts[1]) || 3;
      const metrics = Array.isArray(item?.metrics)
        ? item.metrics.map((metric) => ({ ...metric, value: metric?.value ?? metric?.score ?? null }))
        : [];

      return {
        name,
        score: Number.isFinite(score) ? score : 0,
        maxScore: Number.isFinite(maxScore) && maxScore > 0 ? maxScore : 3,
        classification: item?.classification || item?.bucket || item?.status || null,
        metrics,
      };
    })
    .filter((item) => item.name);
}

function toParameters(algoResults) {
  if (Array.isArray(algoResults)) return normalizeIncomingAlgorithmResults(algoResults);
  if (algoResults && Array.isArray(algoResults.parameters)) return normalizeIncomingAlgorithmResults(algoResults.parameters);
  if (algoResults && Array.isArray(algoResults.results)) return normalizeIncomingAlgorithmResults(algoResults.results);
  return [];
}

/** Stable 7-digit report id from patient id + date (e.g. NS-1773769). */
function makeReportId(patientId, dateStr) {
  const seed = `${patientId || ''}|${dateStr || ''}`;
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const seven = String(h % 10000000).padStart(7, '0');
  return `NS-${seven}`;
}

function formatDate(iso) {
  const d = iso ? new Date(iso) : new Date();
  if (isNaN(d.getTime())) return new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Status labels for the snapshot bars / performance markers.
function positiveStatus(s) {
  if (s >= 3) return 'Excellent';
  if (s === 2) return 'Moderate';
  return 'Needs Attention';
}
function stressRegStatus(red) {
  return ['Excellent', 'Good', 'Moderate', 'Low'][Math.min(red, 3)];
}
function burnoutResistStatus(red) {
  return ['Strong', 'Mild Load', 'Moderate Load', 'High Load'][Math.min(red, 3)];
}
// Bucket -> gauge % used by the NeuroSense report: Low=20%, Medium/Mild/Moderate=55%,
// High/Severe=90%. Positive params use the direct bucket. Stress & Burnout scores are
// a RED count (0=healthiest, 3=worst); the performance report frames them positively
// ("Stress Regulation" / "Burnout Resistance"), so they are INVERTED to a health score
// before bucketing — matching how the NeuroSense report scores overall health
// (low stress = healthy = high) and its green-for-low-stress gauges.
function positiveClass(score) {
  if (score <= 1) return 'Low';
  if (score === 2) return 'Medium';
  return 'High';
}
function stressClass(score) {
  if (score === 0) return 'Low';
  if (score === 1) return 'Mild';
  if (score === 2) return 'Moderate';
  return 'Severe';
}
function gaugePercent(param, isStress = false) {
  const score = param?.score || 0;
  const maxScore = param?.maxScore || 3;
  if (isStress) {
    // Invert the RED count to a health score (0 red -> 3 healthy) and bucket that.
    const health = maxScore - score;
    const bucket = positiveClass(health).toLowerCase();
    if (bucket === 'low') return 20;
    if (bucket === 'medium') return 55;
    return 90;
  }
  const bucket = String(param?.classification || positiveClass(score)).toLowerCase();
  if (bucket === 'low') return 20;
  if (bucket === 'mild' || bucket === 'moderate' || bucket === 'medium') return 55;
  if (bucket === 'high' || bucket === 'severe') return 90;
  // Fallback (no classification present) mirrors the NeuroSense gauge score path.
  if (score === 0) return 10;
  if (score === 1) return 25;
  if (score === 2) return 55;
  return 90;
}

function focusScoreStatus(value) {
  if (value == null || value === 'Indeterminate') return 'N/A';
  return typeof value === 'number' && value < 1.5 ? 'Good' : 'Above Target';
}

function alphaThetaStatus(metric, value) {
  if (value == null || value === 'Indeterminate') return 'N/A';
  if (metric && typeof metric.score === 'number') return metric.score > 0 ? 'Healthy' : 'Low';
  return typeof value === 'number' && value >= 1 ? 'Healthy' : 'Low';
}

/**
 * @param {object} qeegData     Parsed qEEG (EO/EC → absolute/relative/special).
 * @param {object} algoResults  AlgorithmCalculator.calculate() output.
 * @param {object} patient      { name, id, processedAt, clinicName, age, gender }.
 * @returns {object} reportData consumed by the 12-page template + narrative prompt.
 */
function buildReportData(qeegData, algoResults, patient = {}) {
  const params = toParameters(algoResults);

  const cognition = score(params, 'Cognition');
  const stressRed = score(params, 'Stress');
  const focus = score(params, 'Focus & Attention');
  const burnoutRed = score(params, 'Burnout & Fatigue');
  const emotional = score(params, 'Emotional Regulation');
  const learning = score(params, 'Learning');
  const creativity = score(params, 'Creativity');
  const paramByName = (name) => params.find((p) => p.name === name) || { score: 0, maxScore: 3 };

  // Match the NeuroSense PDF gauge mapping exactly (Low=20%, Medium/Mild/Moderate=55%,
  // High/Severe=90%) so the performance report shows the same score for every parameter.
  const stressPct = gaugePercent(paramByName('Stress'), true);
  const cognitionPct = gaugePercent(paramByName('Cognition'));
  const focusPct = gaugePercent(paramByName('Focus & Attention'));
  const learningPct = gaugePercent(paramByName('Learning'));
  const burnoutPct = gaugePercent(paramByName('Burnout & Fatigue'), true);
  const emotionalPct = gaugePercent(paramByName('Emotional Regulation'));
  const creativityPct = gaugePercent(paramByName('Creativity'));
  const bars = [
    { key: 'stress', label: 'Stress Regulation', percent: stressPct, status: stressRegStatus(stressRed), icon: '⚡' },
    { key: 'cognition', label: 'Cognition', percent: cognitionPct, status: positiveStatus(cognition), icon: '🧠' },
    { key: 'focus', label: 'Focus & Attention', percent: focusPct, status: positiveStatus(focus), icon: '🎯' },
    { key: 'learning', label: 'Learning', percent: learningPct, status: positiveStatus(learning), icon: '📚' },
    { key: 'burnout', label: 'Burnout Resistance', percent: burnoutPct, status: burnoutResistStatus(burnoutRed), icon: '🔋' },
    { key: 'emotional', label: 'Emotional Regulation', percent: emotionalPct, status: positiveStatus(emotional), icon: '💗' },
    { key: 'creativity', label: 'Creativity', percent: creativityPct, status: positiveStatus(creativity), icon: '🎨' },
  ];

  // Match the NeuroSense report's overall exactly: sum of raw 0-3 scores
  // (Stress & Burnout already inverted in algoResults.overallScore) over the
  // max (params × 3), ×100 — identical to geminiPdfGenerator.js:523-525.
  const maxTotal = (params.length || 7) * 3;
  const overall = (algoResults && typeof algoResults.overallScore === 'number')
    ? Math.round((algoResults.overallScore / maxTotal) * 100)
    : Math.round(bars.reduce((s, b) => s + b.percent, 0) / bars.length);

  // Deep-dive metric VALUES (deterministic, from the algorithm sub-metrics).
  const alphaPeak = metricValue(params, 'Alpha Peak');
  const arousal = metricValue(params, 'Arousal Score');
  const relaxation = metricValue(params, 'Relaxation Score');
  const regeneration = metricValue(params, 'Regeneration');
  const asymmetry = metricValue(params, 'Alpha Asymmetry');
  const daytimeDelta = metricValue(params, 'Excessive Delta');
  const focusScore = metricValue(params, 'Focus Score');
  const alphaThetaMetric = metricMatch(params, 'Alpha:Theta Balance');
  const alphaTheta = metricValue(params, 'Alpha:Theta Balance');

  const deepDive = {
    alphaPeak: {
      label: 'Alpha Peak Frequency', value: alphaPeak, unit: 'Hz', optimal: '9.5 – 11.5 Hz',
      status: alphaPeak == null ? 'N/A' : alphaPeak > 9 ? 'Healthy' : 'Low',
    },
    arousal: {
      label: 'Arousal Score', value: arousal, unit: '', optimal: '< 1.0',
      status: arousal == null ? 'N/A' : arousal < 1 ? 'Balanced' : 'Elevated',
    },
    relaxation: {
      label: 'Relaxation Score', value: relaxation, unit: '', optimal: '> 8',
      status: relaxation == null ? 'N/A' : relaxation > 8 ? 'Good' : 'Low',
    },
    regeneration: {
      label: 'Regeneration (Alpha Modulation)', value: regeneration, unit: '%', optimal: '> 30%',
      status: regeneration == null ? 'N/A' : regeneration > 30 ? 'Healthy' : 'Low',
    },
    frontalAsymmetry: {
      label: 'Frontal Alpha Asymmetry', value: asymmetry, unit: '', optimal: 'Balanced (near 0)',
      status: asymmetry == null ? 'N/A' : asymmetry < 0 ? 'Right-Shifted' : asymmetry > 0 ? 'Left-Shifted' : 'Balanced',
    },
    daytimeDelta: {
      label: 'Excessive / Daytime Delta', value: daytimeDelta, unit: '%', optimal: '< 20%',
      status: daytimeDelta == null ? 'N/A' : daytimeDelta < 20 ? 'Normal' : daytimeDelta <= 30 ? 'Borderline' : 'Elevated',
    },
    focusScore: {
      label: 'Focus Score', value: focusScore, unit: '', optimal: '< 1.5',
      status: focusScoreStatus(focusScore),
    },
    alphaTheta: {
      label: 'Alpha:Theta Balance', value: alphaTheta, unit: '', optimal: '> 1.0 (healthy)',
      status: alphaThetaStatus(alphaThetaMetric, alphaTheta),
    },
  };

  // Brainwave relative-power profile (eyes-closed, posterior average).
  const profile = {
    delta: round1(avgRelative(qeegData, 'EC', POSTERIOR_CHANNELS, 'Delta') ?? daytimeDelta ?? 0),
    theta: round1(avgRelative(qeegData, 'EC', POSTERIOR_CHANNELS, 'Theta') ?? 0),
    alpha: round1(avgRelative(qeegData, 'EC', POSTERIOR_CHANNELS, 'Alpha') ?? 0),
    beta: round1(avgRelative(qeegData, 'EC', POSTERIOR_CHANNELS, 'Beta') ?? 0),
    hiBeta: round1(avgRelative(qeegData, 'EC', POSTERIOR_CHANNELS, 'HiBeta') ?? 0),
    alphaPeakHz: alphaPeak,
  };

  const brainType = classifyBrainType5(algoResults);

  const assessmentDate = formatDate(patient.processedAt);

  return {
    patient: {
      name: patient.name || 'Patient',
      reportId: makeReportId(patient.id, assessmentDate),
      assessmentDate,
      clinicName: patient.clinicName || 'Limitless Brain Lab',
      firstName: (patient.name || 'Patient').split(/\s+/)[0],
    },
    overall,
    bars,
    // Performance markers (page 8) + inner bandwidth (page 9) reuse the bars.
    performance: {
      cognition: bars.find((b) => b.key === 'cognition'),
      stress: bars.find((b) => b.key === 'stress'),
      focus: bars.find((b) => b.key === 'focus'),
      burnout: bars.find((b) => b.key === 'burnout'),
    },
    innerBandwidth: {
      emotional: bars.find((b) => b.key === 'emotional'),
      learning: bars.find((b) => b.key === 'learning'),
      creativity: bars.find((b) => b.key === 'creativity'),
    },
    deepDive,
    profile,
    brainType,
    overallScore21: algoResults?.overallScore ?? null,
  };
}

/**
 * Build reportData from numbers TRANSCRIBED out of an already-generated report
 * (the `source` object from nexaprocService.extractReportSource: displayed
 * percentages + deep-dive values + brainwave). All inversion/derivation happens
 * here (deterministic) — Claude only copied the printed numbers. We then reuse
 * `buildReportData` for the rest (bars, overall, statuses, 5-type, profile).
 * @param {object} source   { patient, markers:{...% }, deepDive:{...}, brainwave:{...} }
 * @param {object} patient  Fallback meta { id, clinicName } from the request.
 * @returns {object} reportData (same shape as buildReportData).
 */
function buildReportDataFromSource(source, patient = {}, algorithmResults = null) {
  const markers = source && source.markers;
  if (!markers || Object.values(markers).every((v) => v == null)) {
    throw new Error('Could not read the report: no performance scores were found in the uploaded PDF.');
  }

  const num = (v) => (typeof v === 'number' && isFinite(v) ? v : null);
  // Displayed NeuroSense gauge % -> 0-3 score.
  const pctToScore = (pct) => (pct == null ? 0 : Math.round((Math.max(0, Math.min(100, pct)) / 100) * 3));
  const pctToClass = (pct, stress = false) => {
    if (pct == null) return stress ? 'Low' : 'Low';
    if (pct <= 37.5) return 'Low';
    if (pct < 72.5) return stress ? 'Moderate' : 'Medium';
    return stress ? 'Severe' : 'High';
  };

  const dd = source.deepDive || {};
  const mk = (name, value) => ({ name, value: num(value), score: 0 });

  const incomingParameters = toParameters(algorithmResults);
  const incomingMetricValue = (includes) => metricValue(incomingParameters, includes);

  // Current admin flow sends the original deterministic algorithm results; those
  // are the same values the NeuroSense PDF used. PDF extraction remains fallback.
  const parameters = incomingParameters.length ? incomingParameters : [
    {
      name: 'Cognition',
      score: pctToScore(markers.cognition),
      maxScore: 3,
      classification: pctToClass(markers.cognition),
      metrics: [
        mk('Alpha Peak', dd.alphaPeak ?? incomingMetricValue('Alpha Peak')),
      ],
    },
    {
      name: 'Stress',
      score: pctToScore(markers.stressRegulation),
      maxScore: 3,
      classification: pctToClass(markers.stressRegulation, true),
      metrics: [
        mk('Arousal Score', dd.arousal ?? incomingMetricValue('Arousal Score')),
        mk('Relaxation Score', dd.relaxation ?? incomingMetricValue('Relaxation Score')),
        mk('Regeneration (Alpha Modulation)', dd.regeneration ?? incomingMetricValue('Regeneration')),
      ],
    },
    { name: 'Focus & Attention', score: pctToScore(markers.focusAttention), maxScore: 3, classification: pctToClass(markers.focusAttention), metrics: [] },
    {
      name: 'Burnout & Fatigue',
      score: pctToScore(markers.burnoutResistance),
      maxScore: 3,
      classification: pctToClass(markers.burnoutResistance, true),
      metrics: [
        mk('Excessive Delta', dd.daytimeDelta ?? incomingMetricValue('Excessive Delta')),
      ],
    },
    {
      name: 'Emotional Regulation',
      score: pctToScore(markers.emotionalRegulation),
      maxScore: 3,
      classification: pctToClass(markers.emotionalRegulation),
      metrics: [
        mk('Alpha Asymmetry (Frontal)', dd.frontalAsymmetry ?? incomingMetricValue('Alpha Asymmetry')),
        mk('Arousal Score', dd.arousal ?? incomingMetricValue('Arousal Score')),
        mk('Regeneration (Alpha Modulation)', dd.regeneration ?? incomingMetricValue('Regeneration')),
      ],
    },
    { name: 'Learning', score: pctToScore(markers.learning), maxScore: 3, classification: pctToClass(markers.learning), metrics: [] },
    { name: 'Creativity', score: pctToScore(markers.creativity), maxScore: 3, classification: pctToClass(markers.creativity), metrics: [] },
  ];

  const focusScoreMetric = metricMatch(incomingParameters, 'Focus Score');
  const focusScore = incomingMetricValue('Focus Score');
  const alphaThetaMetric = metricMatch(incomingParameters, 'Alpha:Theta Balance');
  const alphaTheta = incomingMetricValue('Alpha:Theta Balance');
  const alphaPeak = metricValue(parameters, 'Alpha Peak');
  const arousal = metricValue(parameters, 'Arousal Score');
  const relaxation = metricValue(parameters, 'Relaxation Score');
  const regeneration = metricValue(parameters, 'Regeneration');
  const asymmetry = metricValue(parameters, 'Alpha Asymmetry');
  const daytimeDelta = metricValue(parameters, 'Excessive Delta');

  // Overall /21 (Stress & Burnout scores are RED counts → inverted for health).
  const overallScore = parameters.reduce((sum, p) => {
    const inv = p.name === 'Stress' || p.name === 'Burnout & Fatigue';
    return sum + (inv ? p.maxScore - p.score : p.score);
  }, 0);

  const algoResults = { parameters, overallScore };

  // Synthesize the minimal qeegData buildReportData needs for the brainwave
  // profile (it averages posterior channels; a single Pz entry is enough).
  const bw = source.brainwave || {};
  const qeegData = {
    EC: { relative: { Pz: { Delta: num(bw.delta), Theta: num(bw.theta), Alpha: num(bw.alpha), Beta: num(bw.beta), HiBeta: num(bw.hiBeta) } } },
  };

  // Prefer the date printed on the report; fall back to now.
  let processedAt = new Date().toISOString();
  const srcDate = source.patient && source.patient.assessmentDate;
  if (srcDate && !isNaN(new Date(srcDate).getTime())) processedAt = new Date(srcDate).toISOString();

  const rd = buildReportData(qeegData, algoResults, {
    name: (source.patient && source.patient.name) || patient.name || 'Patient',
    id: patient.id,
    clinicName: patient.clinicName,
    processedAt,
  });

  // If a deep-dive metric was missing but the brainwave block had alpha peak,
  // surface it on the profile so page 4 still shows the peak.
  if (rd.profile && rd.profile.alphaPeakHz == null && num(bw.alphaPeakHz) != null) {
    rd.profile.alphaPeakHz = num(bw.alphaPeakHz);
  }

  if (rd.deepDive) {
    rd.deepDive.focusScore = {
      label: 'Focus Score',
      value: focusScore,
      unit: '',
      optimal: '< 1.5',
      status: focusScoreMetric && typeof focusScoreMetric.score === 'number'
        ? (focusScoreMetric.score > 0 ? 'Good' : 'Above Target')
        : focusScoreStatus(focusScore),
    };
    rd.deepDive.alphaTheta = {
      label: 'Alpha:Theta Balance',
      value: alphaTheta,
      unit: '',
      optimal: '> 1.0 (healthy)',
      status: alphaThetaStatus(alphaThetaMetric, alphaTheta),
    };
    rd.deepDive.alphaPeak = rd.deepDive.alphaPeak || {
      label: 'Alpha Peak Frequency', value: alphaPeak, unit: 'Hz', optimal: '9.5 – 11.5 Hz',
      status: alphaPeak == null ? 'N/A' : alphaPeak > 9 ? 'Healthy' : 'Low',
    };
    rd.deepDive.arousal = rd.deepDive.arousal || {
      label: 'Arousal Score', value: arousal, unit: '', optimal: '< 1.0',
      status: arousal == null ? 'N/A' : arousal < 1 ? 'Balanced' : 'Elevated',
    };
    rd.deepDive.relaxation = rd.deepDive.relaxation || {
      label: 'Relaxation Score', value: relaxation, unit: '', optimal: '> 8',
      status: relaxation == null ? 'N/A' : relaxation > 8 ? 'Good' : 'Low',
    };
    rd.deepDive.regeneration = rd.deepDive.regeneration || {
      label: 'Regeneration (Alpha Modulation)', value: regeneration, unit: '%', optimal: '> 30%',
      status: regeneration == null ? 'N/A' : regeneration > 30 ? 'Healthy' : 'Low',
    };
    rd.deepDive.frontalAsymmetry = rd.deepDive.frontalAsymmetry || {
      label: 'Frontal Alpha Asymmetry', value: asymmetry, unit: '', optimal: 'Balanced (near 0)',
      status: asymmetry == null ? 'N/A' : asymmetry < 0 ? 'Right-Shifted' : asymmetry > 0 ? 'Left-Shifted' : 'Balanced',
    };
    rd.deepDive.daytimeDelta = rd.deepDive.daytimeDelta || {
      label: 'Excessive / Daytime Delta', value: daytimeDelta, unit: '%', optimal: '< 20%',
      status: daytimeDelta == null ? 'N/A' : daytimeDelta < 20 ? 'Normal' : daytimeDelta <= 30 ? 'Borderline' : 'Elevated',
    };
  }

  return rd;
}

if (require.main === module) {
  const assert = require('assert');
  const params = [
    { name: 'Cognition', score: 2, maxScore: 3, classification: 'Medium', metrics: [] },
    { name: 'Stress', score: 0, maxScore: 3, classification: 'Low', metrics: [] },
    { name: 'Focus & Attention', score: 2, maxScore: 3, classification: 'Medium', metrics: [] },
    { name: 'Learning', score: 2, maxScore: 3, classification: 'Medium', metrics: [] },
    { name: 'Burnout & Fatigue', score: 3, maxScore: 3, classification: 'Severe', metrics: [] },
    { name: 'Emotional Regulation', score: 2, maxScore: 3, classification: 'Medium', metrics: [] },
    { name: 'Creativity', score: 2, maxScore: 3, classification: 'Medium', metrics: [] },
  ];
  const report = buildReportData({}, { parameters: params, overallScore: 12 }, { name: 'Self Check', id: 'self', processedAt: '2026-07-09T00:00:00Z' });
  const bar = (key) => report.bars.find((b) => b.key === key).percent;
  // Positive params: direct bucket (Low=20, Medium=55, High=90).
  // Stress & Burnout: inverted to health (red count -> maxScore-score) then bucketed.
  assert.equal(bar('cognition'), 55); // Medium
  assert.equal(bar('stress'), 90);    // 0 red -> health 3 -> High
  assert.equal(bar('burnout'), 20);   // 3 red -> health 0 -> Low
  assert.equal(report.overall, 57);   // round(overallScore 12 / (7*3) * 100)
  console.log('claudeReportData self-check ok');
}

module.exports = { buildReportData, buildReportDataFromSource };
