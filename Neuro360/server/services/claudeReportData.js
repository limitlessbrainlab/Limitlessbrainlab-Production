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

/** Pull a numeric sub-metric value from the algorithm results by partial name. */
function metricValue(parameters, includes) {
  for (const p of parameters || []) {
    for (const m of p.metrics || []) {
      if (m.name && m.name.toLowerCase().includes(includes.toLowerCase())) {
        return typeof m.value === 'number' && isFinite(m.value) ? m.value : null;
      }
    }
  }
  return null;
}

function score(parameters, name) {
  const p = (parameters || []).find((x) => x.name === name);
  return p ? p.score : 0;
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

/**
 * @param {object} qeegData     Parsed qEEG (EO/EC → absolute/relative/special).
 * @param {object} algoResults  AlgorithmCalculator.calculate() output.
 * @param {object} patient      { name, id, processedAt, clinicName, age, gender }.
 * @returns {object} reportData consumed by the 12-page template + narrative prompt.
 */
function buildReportData(qeegData, algoResults, patient = {}, displayPercents = null) {
  const params = algoResults?.parameters || [];

  const cognition = score(params, 'Cognition');
  const stressRed = score(params, 'Stress');
  const focus = score(params, 'Focus & Attention');
  const burnoutRed = score(params, 'Burnout & Fatigue');
  const emotional = score(params, 'Emotional Regulation');
  const learning = score(params, 'Learning');
  const creativity = score(params, 'Creativity');

  // 8% floor so a fully-failed marker never renders as a hard 0% (which looked
  // broken). Only the fallback path when no continuous displayPercents arrive;
  // clinical pass/fail scoring is unchanged.
  const pct = (s) => Math.max(8, Math.round((s / 3) * 100));
  const invPct = (red) => Math.max(8, Math.round(((3 - red) / 3) * 100));

  // Continuous display percentages (0–100) computed upstream from the real metric
  // margins. When present, the snapshot bars use these instead of the coarse
  // score/3 buckets (which pinned almost every patient at 67%). Clinical pass/fail
  // scoring is unchanged — this is display granularity only.
  const dp = displayPercents && typeof displayPercents === 'object' ? displayPercents : {};
  const useDp = (key, fallback) => {
    const v = dp[key];
    return (typeof v === 'number' && isFinite(v)) ? Math.max(0, Math.min(100, Math.round(v))) : fallback;
  };
  // Status derived from the continuous % so the bar and label stay coherent.
  const posStatusPct = (p) => (p >= 75 ? 'Excellent' : p >= 45 ? 'Moderate' : 'Needs Attention');
  const stressStatusPct = (p) => (p >= 75 ? 'Excellent' : p >= 50 ? 'Good' : p >= 30 ? 'Moderate' : 'Low');
  const burnoutStatusPct = (p) => (p >= 75 ? 'Strong' : p >= 50 ? 'Mild Load' : p >= 30 ? 'Moderate Load' : 'High Load');
  const hasDp = Object.keys(dp).length > 0;

  // Snapshot bars in the report's display order.
  const stressPct = useDp('stress', invPct(stressRed));
  const cognitionPct = useDp('cognition', pct(cognition));
  const focusPct = useDp('focus', pct(focus));
  const learningPct = useDp('learning', pct(learning));
  const burnoutPct = useDp('burnout', invPct(burnoutRed));
  const emotionalPct = useDp('emotional', pct(emotional));
  const creativityPct = useDp('creativity', pct(creativity));
  const bars = [
    { key: 'stress', label: 'Stress Regulation', percent: stressPct, status: hasDp ? stressStatusPct(stressPct) : stressRegStatus(stressRed), icon: '⚡' },
    { key: 'cognition', label: 'Cognition', percent: cognitionPct, status: hasDp ? posStatusPct(cognitionPct) : positiveStatus(cognition), icon: '🧠' },
    { key: 'focus', label: 'Focus & Attention', percent: focusPct, status: hasDp ? posStatusPct(focusPct) : positiveStatus(focus), icon: '🎯' },
    { key: 'learning', label: 'Learning', percent: learningPct, status: hasDp ? posStatusPct(learningPct) : positiveStatus(learning), icon: '📚' },
    { key: 'burnout', label: 'Burnout Resistance', percent: burnoutPct, status: hasDp ? burnoutStatusPct(burnoutPct) : burnoutResistStatus(burnoutRed), icon: '🔋' },
    { key: 'emotional', label: 'Emotional Regulation', percent: emotionalPct, status: hasDp ? posStatusPct(emotionalPct) : positiveStatus(emotional), icon: '💗' },
    { key: 'creativity', label: 'Creativity', percent: creativityPct, status: hasDp ? posStatusPct(creativityPct) : positiveStatus(creativity), icon: '🎨' },
  ];

  const overall = Math.round(bars.reduce((s, b) => s + b.percent, 0) / bars.length);

  // Deep-dive metric VALUES (deterministic, from the algorithm sub-metrics).
  const alphaPeak = metricValue(params, 'Alpha Peak');
  const arousal = metricValue(params, 'Arousal Score');
  const relaxation = metricValue(params, 'Relaxation Score');
  const regeneration = metricValue(params, 'Regeneration');
  const asymmetry = metricValue(params, 'Alpha Asymmetry');
  const daytimeDelta = metricValue(params, 'Excessive Delta');

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
      label: 'Daytime Delta', value: daytimeDelta, unit: '%', optimal: '< 20%',
      status: daytimeDelta == null ? 'N/A' : daytimeDelta < 20 ? 'Normal' : daytimeDelta <= 30 ? 'Borderline' : 'Elevated',
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
function buildReportDataFromSource(source, patient = {}, displayPercents = null) {
  const markers = source && source.markers;
  if (!markers || Object.values(markers).every((v) => v == null)) {
    throw new Error('Could not read the report: no performance scores were found in the uploaded PDF.');
  }

  const num = (v) => (typeof v === 'number' && isFinite(v) ? v : null);
  // Displayed % (healthy side) → 0-3 score. For Stress/Burnout we want the RED
  // count the algorithm uses, which is the inverse of the displayed regulation %.
  const pctToScore = (pct) => (pct == null ? 0 : Math.round((Math.max(0, Math.min(100, pct)) / 100) * 3));
  const redFromPct = (pct) => (pct == null ? 0 : 3 - pctToScore(pct));

  const dd = source.deepDive || {};
  const mk = (name, value) => ({ name, value: num(value), score: 0 });

  // Assemble the algorithmCalculator-shaped parameters (with metric values so the
  // 5-type classifier and the deep-dive page have what they need).
  const parameters = [
    { name: 'Cognition', score: pctToScore(markers.cognition), maxScore: 3,
      metrics: [mk('Alpha Peak', dd.alphaPeak)] },
    { name: 'Stress', score: redFromPct(markers.stressRegulation), maxScore: 3,
      metrics: [mk('Arousal Score', dd.arousal), mk('Relaxation Score', dd.relaxation), mk('Regeneration (Alpha Modulation)', dd.regeneration)] },
    { name: 'Focus & Attention', score: pctToScore(markers.focusAttention), maxScore: 3, metrics: [] },
    { name: 'Burnout & Fatigue', score: redFromPct(markers.burnoutResistance), maxScore: 3,
      metrics: [mk('Excessive Delta', dd.daytimeDelta)] },
    { name: 'Emotional Regulation', score: pctToScore(markers.emotionalRegulation), maxScore: 3,
      metrics: [mk('Alpha Asymmetry (Frontal)', dd.frontalAsymmetry), mk('Arousal Score', dd.arousal), mk('Regeneration (Alpha Modulation)', dd.regeneration)] },
    { name: 'Learning', score: pctToScore(markers.learning), maxScore: 3, metrics: [] },
    { name: 'Creativity', score: pctToScore(markers.creativity), maxScore: 3, metrics: [] },
  ];

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
  }, displayPercents);

  // If a deep-dive metric was missing but the brainwave block had alpha peak,
  // surface it on the profile so page 4 still shows the peak.
  if (rd.profile && rd.profile.alphaPeakHz == null && num(bw.alphaPeakHz) != null) {
    rd.profile.alphaPeakHz = num(bw.alphaPeakHz);
  }

  return rd;
}

module.exports = { buildReportData, buildReportDataFromSource };
