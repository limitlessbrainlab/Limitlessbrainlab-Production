/**
 * 12-page "Brain Type & Performance Report" HTML template
 * (NeuroSense / Limitless Brain Lab).
 *
 * renderReportHtml(reportData, narrative) returns a complete A4 HTML document.
 * All NUMBERS come from reportData (deterministic, from the qEEG algorithm).
 * All PROSE comes from `narrative` (Claude), falling back to the brain-type
 * framework copy in reportData.brainType when a narrative field is missing — so
 * the report is always complete even if the narrative call returns little.
 *
 * Render to PDF with Puppeteer using `printBackground: true` and format 'A4'.
 */

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function fmt(value, unit) {
  if (value == null || value === 'Indeterminate') return '—';
  const n = typeof value === 'number' ? (Math.round(value * 100) / 100) : value;
  if (!unit) return `${n}`;
  // No space before a percent sign; a thin space before word units (Hz).
  return unit === '%' ? `${n}%` : `${n} ${unit}`;
}

// Map a status word to a colour family used across badges and bars.
function statusKind(status) {
  const s = String(status || '').toLowerCase();
  if (/(excellent|strong|healthy|good|balanced|normal)/.test(s)) return 'good';
  if (/(moderate|mild|borderline|right-shifted|left-shifted)/.test(s)) return 'warn';
  return 'bad'; // needs attention / low / elevated / high load
}
const KIND_COLOR = { good: '#16a34a', warn: '#f59e0b', bad: '#ea580c' };
const KIND_BG = { good: '#dcfce7', warn: '#fef3c7', bad: '#ffedd5' };

function bar(label, sub, percentText, pct, kind) {
  const color = KIND_COLOR[kind];
  return `<div class="prow">
    <div class="plabel"><strong>${esc(label)}</strong>${sub ? `<span class="psub">${esc(sub)}</span>` : ''}</div>
    <div class="ptrack"><div class="pfill" style="width:${Math.max(2, Math.min(100, pct))}%;background:${color}"></div></div>
    <div class="pval" style="color:${color}">${esc(percentText)}</div>
  </div>`;
}

function badge(text, kind) {
  return `<span class="badge" style="background:${KIND_BG[kind]};color:${KIND_COLOR[kind]}">${esc(String(text).toUpperCase())}</span>`;
}

function metricCard(m) {
  const kind = statusKind(m.status);
  return `<div class="card metric">
    <div class="metric-head"><span class="metric-title">${esc(m.label)}</span></div>
    <div class="metric-opt">Optimal: ${esc(m.optimal)}</div>
    <div class="metric-val" style="color:${KIND_COLOR[kind]}">${esc(fmt(m.value, m.unit))}</div>
    ${badge(m.status, kind)}
  </div>`;
}

function perfCard(b, narrative) {
  const kind = statusKind(b.status);
  return `<div class="card perf">
    <div class="perf-head"><span class="perf-title">${esc(b.icon)} ${esc(b.label)}</span></div>
    <div class="perf-val" style="color:${KIND_COLOR[kind]}">${b.percent}<span class="pct">%</span></div>
    <div class="ptrack"><div class="pfill" style="width:${b.percent}%;background:${KIND_COLOR[kind]}"></div></div>
    ${badge(b.status, kind)}
    <p class="perf-body">${esc(narrative || '')}</p>
  </div>`;
}

function listBox(title, items, tone) {
  const cls = tone === 'good' ? 'box-good' : tone === 'warn' ? 'box-warn' : 'box-info';
  const mark = tone === 'good' ? '✓' : tone === 'warn' ? '!' : '•';
  return `<div class="listbox ${cls}">
    <h4>${esc(title)}</h4>
    <ul>${(items || []).map((i) => `<li><span class="mk">${mark}</span><span>${esc(i)}</span></li>`).join('')}</ul>
  </div>`;
}

function pageHeader(num, section) {
  return `<div class="phead"><div class="logo-sm">◉ <span>NeuroSense Brain Health</span></div><div class="phead-r">${esc(num)} / ${esc(section)}</div></div>`;
}
function pageFooter(label) {
  return `<div class="pfoot"><span>NeuroSense • Limitless Brain Lab</span><span>${esc(label)}</span></div>`;
}

function renderReportHtml(reportData, narrative = {}) {
  const d = reportData;
  const bt = d.brainType.primary;
  const secondary = d.brainType.secondary;
  const p = d.patient;
  const n = narrative || {};

  // ── Deterministic defaults merged with Claude narrative ────────────────────
  const topStrength = n.topStrength || { title: 'Top Strength', points: bt.strengths.slice(0, 2) };
  const watchZone = n.watchZone || { title: 'Watch Zone', points: bt.watchZones.slice(0, 2) };
  const brainTypeReason = n.brainTypeReason || bt.strengths;
  const planIntro = n.plan?.intro || `A staged, ${bt.name}-brain-friendly plan. The order matters: calm the nervous system first, then layer in performance work.`;
  const after30 = n.plan?.after30 || 'Repeat the qEEG after 30 days — the markers most likely to shift first are arousal, regeneration, and frontal asymmetry.';

  const dd = d.deepDive;
  const prof = d.profile;

  // Five-type cards (highlight the patient's primary type).
  const { TYPES } = require('../services/brainType5Classifier');
  const typeCards = [1, 2, 3, 4, 5].map((id) => {
    const t = TYPES[id];
    const active = id === bt.id;
    return `<div class="type-card ${active ? 'active' : ''}">
      ${active ? '<div class="type-tag">YOUR TYPE</div>' : ''}
      <div class="type-icon" style="color:${t.color}">${t.icon}</div>
      <div class="type-num">TYPE ${id}</div>
      <div class="type-name">${esc(t.name)}</div>
      <div class="type-card-desc">${esc(t.card)}</div>
    </div>`;
  }).join('');

  const brainwaveCards = [
    {
      title: `Strong, healthy alpha (peak ${fmt(prof.alphaPeakHz, 'Hz')})`,
      body: `Your alpha rhythm is ${fmt(prof.alpha, '%')} and peaks in the optimal range. This supports clear processing, working memory, and relaxed focus.`,
    },
    {
      title: `${dd.daytimeDelta.value >= 20 ? 'Elevated delta — recovery debt' : 'Delta — within range'}`,
      body: `Daytime delta reads ${fmt(dd.daytimeDelta.value, '%')}. Combined with regeneration at ${fmt(dd.regeneration.value, '%')}, this points to the brain's current recovery load.`,
    },
    {
      title: 'Moderate theta & alpha:theta balance',
      body: `Theta sits at ${fmt(prof.theta, '%')}. ${dd.alphaTheta?.optimal || 'Alpha:theta ratios'} provide the learning and memory context behind this marker.`,
    },
    {
      title: `${prof.beta < 8 || prof.hiBeta < 8 ? 'Low beta — depletion, not over-drive' : 'Beta & hi-beta activity'}`,
      body: `Fast-wave activity is beta ${fmt(prof.beta, '%')} and hi-beta ${fmt(prof.hiBeta, '%')}. Interpret this with arousal (${fmt(dd.arousal.value)}) and asymmetry (${fmt(dd.frontalAsymmetry.value)}) instead of replacing the values with a label.`,
    },
  ];

  // 30-day daily anchors from the type's strategy, plus a generic 4-week build.
  const anchors = (bt.strategy.doMore || []).slice(0, 4);
  const weeks = [
    { label: 'WEEK 1 — CALM FIRST', title: 'Lock in the daily anchors', body: 'Just the anchors above. Prove to your nervous system that calm is safe and consistent.' },
    { label: 'WEEK 2 — CONTAIN', title: 'Add structure & containment', body: 'A short evening wind-down and a 3-item morning priority list. Contain the open loops.' },
    { label: 'WEEK 3 — RECOVER', title: 'Add one weekly true-rest session', body: '90 minutes of no productivity, no input, no goal. It will feel uncomfortable — that is the point.' },
    { label: 'WEEK 4 — ACTIVATE', title: 'Layer in performance work', body: 'Add a daily goal-activation routine — one intention plus one thing you are looking forward to.' },
  ];

  const profileBars = [
    bar('Delta', '0.5–4 Hz · Deep rest', fmt(prof.delta, '%'), prof.delta, 'good'),
    bar('Theta', '4–7 Hz · Creativity', fmt(prof.theta, '%'), prof.theta, 'warn'),
    bar('Alpha', '8–12 Hz · Calm focus', `Peak ${fmt(prof.alphaPeakHz, 'Hz')}`, prof.alpha, 'good'),
    bar('Beta', '13–20 Hz · Active thinking', fmt(prof.beta, '%'), prof.beta, 'warn'),
    bar('Hi-Beta', '20–30 Hz · Vigilance', fmt(prof.hiBeta, '%'), prof.hiBeta, 'warn'),
  ].join('');

  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><style>
  @page { size: A4 portrait; margin: 0; }
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif; color:#1f2a44; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  .page { position:relative; width:210mm; height:297mm; padding:18mm 16mm; page-break-after:always; overflow:hidden; }
  .page:last-child { page-break-after:auto; }
  .dark { background:linear-gradient(135deg,#0f2a5e 0%,#1e63b4 100%); color:#fff; }
  h1 { font-size:40px; line-height:1.08; font-weight:800; }
  h2 { font-size:30px; font-weight:800; color:#15315f; }
  h2 .hl { color:#1e9bb8; }
  .eyebrow { letter-spacing:3px; font-size:12px; font-weight:700; color:#1e63b4; text-transform:uppercase; margin-bottom:8px; }
  .lead { color:#5b6b86; font-size:14px; line-height:1.6; margin-top:10px; max-width:640px; }
  .phead { display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #e5e9f0; padding-bottom:10px; margin-bottom:22px; }
  .logo-sm { color:#1e63b4; font-weight:700; font-size:13px; }
  .phead-r { letter-spacing:3px; font-size:11px; color:#8aa0c0; font-weight:700; }
  .pfoot { position:absolute; bottom:12mm; left:16mm; right:16mm; display:flex; justify-content:space-between; font-size:10px; color:#9aa8c0; border-top:1px solid #eef1f6; padding-top:8px; }
  .card { background:#fff; border:1px solid #e8edf5; border-radius:14px; padding:18px; }
  .grid2 { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
  .grid3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:14px; }
  .badge { display:inline-block; font-size:10px; font-weight:800; letter-spacing:.5px; padding:4px 10px; border-radius:20px; margin:6px 0; }
  /* progress bars */
  .prow { display:flex; align-items:center; gap:12px; margin:10px 0; }
  .plabel { width:170px; font-size:12px; color:#33405c; }
  .plabel .psub { display:block; font-size:10px; color:#9aa8c0; }
  .ptrack { flex:1; height:9px; background:#eef1f6; border-radius:6px; overflow:hidden; }
  .pfill { height:100%; border-radius:6px; }
  .pval { width:64px; text-align:right; font-weight:800; font-size:13px; }
  /* snapshot */
  .score-card { background:linear-gradient(160deg,#1e63b4,#0f2a5e); color:#fff; border-radius:16px; padding:24px; text-align:center; }
  .score-card .big { font-size:64px; font-weight:800; line-height:1; }
  .score-card .lbl { letter-spacing:3px; font-size:11px; opacity:.85; }
  .signals { display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; margin-top:18px; }
  .listbox { border-radius:12px; padding:14px 16px; }
  .listbox h4 { font-size:13px; margin-bottom:8px; }
  .listbox ul { list-style:none; }
  .listbox li { display:flex; gap:8px; font-size:11.5px; line-height:1.5; margin:6px 0; color:#41506c; }
  .listbox .mk { font-weight:800; }
  .box-good { background:#f0fdf4; border-left:4px solid #16a34a; } .box-good h4{color:#15803d;}
  .box-warn { background:#fffbeb; border-left:4px solid #f59e0b; } .box-warn h4{color:#b45309;}
  .box-info { background:#eff6ff; border-left:4px solid #1e63b4; } .box-info h4{color:#1e40af;}
  /* metric cards */
  .metric .metric-title { font-weight:700; font-size:14px; }
  .metric .metric-opt { font-size:10.5px; color:#9aa8c0; margin:4px 0 8px; }
  .metric .metric-val { font-size:34px; font-weight:800; }
  .perf .perf-title { font-weight:700; font-size:14px; }
  .perf .perf-val { font-size:38px; font-weight:800; margin:6px 0; } .perf .pct{font-size:16px;}
  .perf .perf-body { font-size:11.5px; color:#5b6b86; line-height:1.5; margin-top:8px; }
  /* type cards */
  .types { display:grid; grid-template-columns:repeat(5,1fr); gap:10px; margin-top:18px; }
  .type-card { position:relative; border:1px solid #e8edf5; border-radius:12px; padding:14px 10px; text-align:center; }
  .type-card.active { border:2px solid #1e63b4; box-shadow:0 6px 18px rgba(30,99,180,.18); }
  .type-tag { position:absolute; top:-9px; left:50%; transform:translateX(-50%); background:#1e63b4; color:#fff; font-size:8px; letter-spacing:1px; font-weight:800; padding:3px 8px; border-radius:10px; }
  .type-icon { font-size:24px; } .type-num{font-size:9px;letter-spacing:1px;color:#9aa8c0;margin-top:6px;} .type-name{font-weight:800;font-size:14px;margin:2px 0 6px;}
  .type-card-desc { font-size:9.5px; color:#6b7a94; line-height:1.45; }
  /* contents */
  .toc-row { display:flex; align-items:center; gap:14px; border-left:4px solid #1e63b4; background:#f7faff; border-radius:8px; padding:12px 16px; margin:10px 0; }
  .toc-num { width:26px; height:26px; border-radius:50%; background:#1e63b4; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:13px; }
  .toc-row .t { flex:1; font-weight:600; font-size:13px; }
  .toc-row .pg { font-size:11px; letter-spacing:1px; color:#9aa8c0; }
  .info-cards { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-top:30px; }
  .info-card { background:rgba(255,255,255,.10); border:1px solid rgba(255,255,255,.18); border-radius:12px; padding:14px; }
  .info-card .k { font-size:10px; letter-spacing:2px; opacity:.75; } .info-card .v{font-weight:700;font-size:15px;margin-top:6px;}
  .disc { font-size:10px; opacity:.7; text-align:center; line-height:1.5; }
  .center { text-align:center; }
  p.body { font-size:12.5px; color:#41506c; line-height:1.6; }
  .mt8{margin-top:8px;} .mt14{margin-top:14px;} .mt18{margin-top:18px;} .mt24{margin-top:24px;}
  .h3 { font-size:18px; font-weight:800; color:#15315f; margin:18px 0 10px; }
  </style></head><body>

  <!-- PAGE 1 — COVER -->
  <section class="page dark">
    <div class="logo-sm" style="color:#fff;font-size:16px;">◉ NeuroSense<div style="font-size:10px;letter-spacing:3px;opacity:.7;font-weight:500;">SMART EEG INTELLIGENCE</div></div>
    <div style="margin-top:120px;">
      <div class="eyebrow" style="color:#9ec2f0;">Personalized Neuro-Profile</div>
      <h1>Neuro Performance Report</h1>
      <p class="lead" style="color:#cfe0f7;">A complete map of your brainwave activity, cognitive performance, and dominant brain type — built from 19-channel qEEG analysis and the NeuroSense five-type framework.</p>
    </div>
    <div class="info-cards">
      <div class="info-card"><div class="k">NAME</div><div class="v">${esc(p.name)}</div></div>
      <div class="info-card"><div class="k">ASSESSMENT</div><div class="v">${esc(p.assessmentDate)}</div></div>
      <div class="info-card"><div class="k">BRAIN TYPE</div><div class="v">${esc(bt.name)}</div></div>
      <div class="info-card"><div class="k">REPORT ID</div><div class="v">${esc(p.reportId)}</div></div>
    </div>
    <div class="pfoot" style="border-color:rgba(255,255,255,.15);"><span style="color:#cfe0f7;">${esc(p.clinicName)}</span><span style="color:#9ec2f0;">AI-generated wellness report — not a medical diagnosis</span></div>
  </section>

  <!-- PAGE 2 — WELCOME / CONTENTS -->
  <section class="page">
    ${pageHeader('01', 'WELCOME')}
    <div class="eyebrow">Welcome, ${esc(p.firstName)}</div>
    <h2>What's <span class="hl">inside</span> this report</h2>
    <p class="lead">A complete walkthrough of how your brain works — from the dominant brainwave patterns across 19 EEG channels, to your unique brain type, to a personalized 30-day plan.</p>
    <div class="mt18">
      <div class="toc-row"><div class="toc-num">1</div><div class="t">Your Snapshot — at-a-glance score &amp; key signals</div><div class="pg">PAGE 3</div></div>
      <div class="toc-row"><div class="toc-num">2</div><div class="t">Brainwave Profile — Delta, Theta, Alpha, Beta, hi-Beta</div><div class="pg">PAGE 4</div></div>
      <div class="toc-row"><div class="toc-num">3</div><div class="t">Your Brain Type — the NeuroSense five-type framework</div><div class="pg">PAGE 5–7</div></div>
      <div class="toc-row"><div class="toc-num">4</div><div class="t">Performance Markers — Cognition, Focus, Stress, Burnout</div><div class="pg">PAGE 8</div></div>
      <div class="toc-row"><div class="toc-num">5</div><div class="t">Emotional Regulation, Learning &amp; Creativity</div><div class="pg">PAGE 9</div></div>
      <div class="toc-row"><div class="toc-num">6</div><div class="t">Deep-Dive Neuro-Metrics</div><div class="pg">PAGE 10</div></div>
      <div class="toc-row"><div class="toc-num">7</div><div class="t">Your 30-Day Brain Optimization Plan</div><div class="pg">PAGE 11</div></div>
    </div>
    <div class="listbox box-info mt18"><h4>★ How to read this report</h4>
      <p style="font-size:11.5px;color:#41506c;line-height:1.55;">Each metric is shown as a percentage or raw EEG value. Higher isn't always better — for stress regulation, higher means calmer. Look for the colored status badges on every card. Your <strong>Brain Type</strong> on page 5 is the lens through which every score should be interpreted.</p></div>
    ${pageFooter('Page 2 • Welcome')}
  </section>

  <!-- PAGE 3 — SNAPSHOT -->
  <section class="page">
    ${pageHeader('02', 'SNAPSHOT')}
    <div class="eyebrow">Section 1 — Quick Read</div>
    <h2>Your brain at a <span class="hl">glance</span></h2>
    <p class="lead">${esc(n.snapshotSummary || `A quick view of where you stand. Your standout strength and your main growth zone are highlighted below.`)}</p>
    <div class="grid2 mt18" style="grid-template-columns:0.9fr 1.4fr;">
      <div class="score-card">
        <div class="lbl">OVERALL BRAIN PERFORMANCE</div>
        <div class="big mt8">${d.overall}<span style="font-size:24px;opacity:.7;">/100</span></div>
        <p style="font-size:11px;opacity:.9;margin-top:12px;line-height:1.5;">A composite of your seven performance markers. The growth zones are where small daily practices yield outsized gains.</p>
      </div>
      <div>${d.bars.map((b) => bar(`${b.icon} ${b.label}`, '', `${b.percent}%`, b.percent, statusKind(b.status))).join('')}</div>
    </div>
    <h3 class="h3">Your three biggest signals</h3>
    <div class="signals">
      ${listBox(`💪 ${topStrength.title}`, topStrength.points, 'good')}
      ${listBox(`⚠️ ${watchZone.title}`, watchZone.points, 'warn')}
      ${listBox(`🧭 Brain Type`, [`Type ${bt.id} — ${bt.name}${secondary ? `, with secondary ${secondary.name} traits.` : '.'}`, bt.tagline], 'info')}
    </div>
    ${pageFooter('Page 3 • Snapshot')}
  </section>

  <!-- PAGE 4 — BRAINWAVE PROFILE -->
  <section class="page">
    ${pageHeader('03', 'BRAINWAVES')}
    <div class="eyebrow">Section 2 — The Five Bands</div>
    <h2>Your <span class="hl">brainwave</span> profile</h2>
    <p class="lead">${esc(n.brainwaveIntro || 'Your brain produces five distinct rhythms simultaneously, each tied to a different mental state. Below is your relative power across the spectrum, recorded eyes-closed.')}</p>
    <div class="card mt18"><h4 style="font-size:14px;margin-bottom:10px;">Relative Power Distribution</h4>${profileBars}</div>
    <h3 class="h3">What this means for you</h3>
    <div class="grid2">${brainwaveCards.slice(0, 4).map((c) => `<div class="card"><div style="font-weight:700;font-size:13px;margin-bottom:6px;">${esc(c.title)}</div><p style="font-size:11.5px;color:#5b6b86;line-height:1.5;">${esc(c.body)}</p></div>`).join('')}</div>
    ${pageFooter('Page 4 • Brainwaves')}
  </section>

  <!-- PAGE 5 — FIVE TYPES -->
  <section class="page">
    ${pageHeader('04', 'BRAIN TYPE')}
    <div class="eyebrow">Section 3 — The NeuroSense Framework</div>
    <h2>The five <span class="hl">brain types</span></h2>
    <p class="lead">Decades of brain imaging and qEEG research show that brains organize into recognizable patterns — distinct combinations of arousal, regulation, and reactivity. Knowing your type isn't a label — it's a lens. It tells you which strategies will actually work for your brain.</p>
    <div class="types">${typeCards}</div>
    <h3 class="h3">How we determined your type</h3>
    <div class="listbox box-info"><p style="font-size:11.5px;color:#41506c;margin-bottom:8px;">Your qEEG showed signatures that map onto the <strong>${esc(bt.name)} (Type ${bt.id})</strong> profile${secondary ? `, with secondary <strong>${esc(secondary.name)}</strong> features` : ''}:</p>
      <ul>${brainTypeReason.map((r) => `<li><span class="mk">•</span><span>${esc(r)}</span></li>`).join('')}</ul></div>
    ${pageFooter('Page 5 • Brain Types Overview')}
  </section>

  <!-- PAGE 6 — YOUR TYPE DEEP DIVE -->
  <section class="page">
    ${pageHeader('04', 'YOUR TYPE')}
    <div class="card" style="border:none;background:linear-gradient(160deg,#1e63b4,#0f2a5e);color:#fff;border-radius:16px;">
      <div class="eyebrow" style="color:#9ec2f0;">${esc(p.firstName)}'s Brain Type</div>
      <h1 style="font-size:30px;">Type ${bt.id} — The ${esc(bt.name)} Brain</h1>
      <p class="lead" style="color:#cfe0f7;">${esc(bt.tagline)}.</p>
      <div class="mt14">${bt.traits.map((t) => `<span style="display:inline-block;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);border-radius:18px;padding:5px 12px;font-size:11px;margin:4px 6px 0 0;">${esc(t)}</span>`).join('')}</div>
    </div>
    <h3 class="h3">What's happening in your brain</h3>
    <div class="grid2">
      <div class="card"><div style="font-weight:700;font-size:13px;margin-bottom:6px;">🧬 The neuroscience</div><p style="font-size:11.5px;color:#5b6b86;line-height:1.55;">${esc(bt.neuroscience)}</p></div>
      <div class="card"><div style="font-weight:700;font-size:13px;margin-bottom:6px;">⭐ Why it's a strength</div><p style="font-size:11.5px;color:#5b6b86;line-height:1.55;">${esc(bt.whyStrength)}</p></div>
    </div>
    <h3 class="h3">Your strengths &amp; watch-zones</h3>
    <div class="grid2">${listBox(`✨ ${bt.name}-Brain Strengths`, bt.strengths, 'good')}${listBox(`🔍 ${bt.name}-Brain Watch-Zones`, bt.watchZones, 'warn')}</div>
    ${pageFooter('Page 6 • Your Type Deep Dive')}
  </section>

  <!-- PAGE 7 — STRATEGY GUIDE -->
  <section class="page">
    ${pageHeader('04', 'TYPE-SPECIFIC STRATEGY')}
    <div class="eyebrow">What Works For Your Type</div>
    <h2>${esc(bt.name)}-brain <span class="hl">strategy</span> guide</h2>
    <p class="lead">Generic advice often fails this type. Here's what actually moves the needle for a ${esc(bt.name)} brain.</p>
    <h3 class="h3">Lifestyle &amp; nutrition</h3>
    <div class="grid3">
      <div class="card"><div style="font-weight:700;font-size:13px;margin-bottom:6px;">🥗 Eat for your type</div><p style="font-size:11px;color:#5b6b86;line-height:1.5;">${esc(bt.strategy.eat)}</p></div>
      <div class="card"><div style="font-weight:700;font-size:13px;margin-bottom:6px;">🏃 Move</div><p style="font-size:11px;color:#5b6b86;line-height:1.5;">${esc(bt.strategy.move)}</p></div>
      <div class="card"><div style="font-weight:700;font-size:13px;margin-bottom:6px;">😴 Sleep</div><p style="font-size:11px;color:#5b6b86;line-height:1.5;">${esc(bt.strategy.sleep)}</p></div>
    </div>
    <h3 class="h3">Mind &amp; emotional practices</h3>
    <div class="grid2">${listBox('✓ Do more of', bt.strategy.doMore, 'good')}${listBox('⚠ Less of', bt.strategy.lessOf, 'warn')}</div>
    ${pageFooter('Page 7 • Type-Specific Strategy')}
  </section>

  <!-- PAGE 8 — PERFORMANCE MARKERS -->
  <section class="page">
    ${pageHeader('05', 'PERFORMANCE')}
    <div class="eyebrow">Section 4 — Performance Markers</div>
    <h2>Cognition &amp; <span class="hl">stress</span></h2>
    <p class="lead">How clearly you think and how well you handle pressure — the two engines of daily performance.</p>
    <div class="grid2 mt18">
      ${perfCard(d.performance.cognition, n.performance?.cognition)}
      ${perfCard(d.performance.stress, n.performance?.stress)}
      ${perfCard(d.performance.focus, n.performance?.focus)}
      ${perfCard(d.performance.burnout, n.performance?.burnout)}
    </div>
    ${n.performanceFeature ? `<div class="listbox box-info mt18"><h4>Worth understanding</h4><p style="font-size:11.5px;color:#41506c;line-height:1.6;">${esc(n.performanceFeature)}</p></div>` : ''}
    ${pageFooter('Page 8 • Cognition & Stress')}
  </section>

  <!-- PAGE 9 — EMOTION / LEARNING / CREATIVITY -->
  <section class="page">
    ${pageHeader('05', 'PERFORMANCE')}
    <div class="eyebrow">Section 5 — Inner Bandwidth</div>
    <h2>Emotion, learning &amp; <span class="hl">creativity</span></h2>
    <p class="lead">When the nervous system is busy scanning, it has less bandwidth for emotional flexibility, divergent thinking, and the open-mode states that drive creativity.</p>
    <div class="grid3 mt18">
      ${[['emotional','💗 Emotional Regulation'],['learning','📚 Learning Capacity'],['creativity','🎨 Creativity']].map(([k,label])=>{const b=d.innerBandwidth[k];const kind=statusKind(b.status);return `<div class="card"><div style="font-weight:700;font-size:13px;">${esc(label)}</div><div style="font-size:32px;font-weight:800;color:${KIND_COLOR[kind]};margin:6px 0;">${b.percent}<span style="font-size:14px;">%</span></div>${badge(b.status,kind)}<p style="font-size:11px;color:#5b6b86;line-height:1.5;margin-top:6px;">${esc(n.innerBandwidth?.[k]||'')}</p></div>`;}).join('')}
    </div>
    <div class="listbox box-info mt18"><h4>✦ The hidden link between these three</h4><p style="font-size:11.5px;color:#41506c;line-height:1.6;">${esc(n.innerBandwidth?.link || 'Emotional regulation, creative thinking, and durable learning depend on the same underlying state: low arousal plus alert alpha. When the nervous system runs hot, all three drop; give the brain real recovery and all three rise — usually together.')}</p></div>
    ${pageFooter('Page 9 • Inner Bandwidth')}
  </section>

  <!-- PAGE 10 — DEEP-DIVE METRICS -->
  <section class="page">
    ${pageHeader('06', 'DEEP DIVE')}
    <div class="eyebrow">Section 6 — The Numbers Behind The Story</div>
    <h2>Deep-dive <span class="hl">neuro metrics</span></h2>
    <p class="lead">The actual EEG values behind every score above — the metrics your clinician will reference.</p>
    <div class="grid2 mt18">
      ${metricCard(dd.alphaPeak)}${metricCard(dd.arousal)}
      ${metricCard(dd.relaxation)}${metricCard(dd.regeneration)}
      ${metricCard(dd.frontalAsymmetry)}${metricCard(dd.daytimeDelta)}
      ${metricCard(dd.focusScore)}${metricCard(dd.alphaTheta)}
    </div>
    <div class="listbox box-info mt14"><h4>① Reading these numbers</h4><p style="font-size:11.5px;color:#41506c;line-height:1.6;">${esc(n.deepDive?.readingPattern || 'No single metric tells the story — look at the pattern they form together.')}</p></div>
    ${pageFooter('Page 10 • Deep-Dive Metrics')}
  </section>

  <!-- PAGE 11 — 30-DAY PLAN -->
  <section class="page">
    ${pageHeader('07', 'ACTION PLAN')}
    <div class="eyebrow">Section 7 — Your Personalized Plan</div>
    <h2>Your 30-day <span class="hl">brain plan</span></h2>
    <p class="lead">${esc(planIntro)}</p>
    <h3 class="h3">Daily non-negotiables (start tomorrow)</h3>
    <div class="grid2">${anchors.map((a, i) => `<div class="card" style="display:flex;gap:12px;"><div class="toc-num">${i + 1}</div><p style="font-size:11.5px;color:#41506c;line-height:1.5;">${esc(a)}</p></div>`).join('')}</div>
    <h3 class="h3">Week-by-week build</h3>
    ${weeks.map((w) => `<div style="border-left:3px dashed #1e63b4;padding:4px 0 12px 16px;margin-left:6px;"><div class="eyebrow" style="margin-bottom:2px;">${esc(w.label)}</div><div style="font-weight:700;font-size:13px;">${esc(w.title)}</div><p style="font-size:11px;color:#5b6b86;line-height:1.5;">${esc(w.body)}</p></div>`).join('')}
    <div class="listbox box-info mt8"><h4>◷ After 30 days</h4><p style="font-size:11.5px;color:#41506c;line-height:1.6;">${esc(after30)}</p></div>
    ${pageFooter('Page 11 • 30-Day Plan')}
  </section>

  <!-- PAGE 12 — CLOSING -->
  <section class="page dark center">
    <div style="margin-top:150px;">
      <div style="font-size:40px;">◉</div>
      <h1 style="margin-top:20px;">Your brain is unique.<br>Your plan should be too.</h1>
      <p class="lead" style="color:#cfe0f7;margin:20px auto 0;">${esc(n.closing || 'This report is a starting point, not a finish line. Small, consistent shifts in lifestyle, sleep, and self-regulation produce measurable changes in your EEG within weeks.')}</p>
      <div class="card" style="background:rgba(255,255,255,.10);border:1px solid rgba(255,255,255,.18);max-width:340px;margin:34px auto 0;">
        <div style="letter-spacing:2px;font-size:11px;opacity:.75;">GET IN TOUCH</div>
        <div style="font-weight:800;font-size:22px;margin:8px 0;">+971 58 560 2551</div>
        <div style="color:#9ec2f0;font-size:13px;">www.limitlessbrainlab.com</div>
      </div>
    </div>
    <div class="disc" style="position:absolute;bottom:24mm;left:16mm;right:16mm;">This AI-generated qEEG report is provided for informational, educational, and wellness purposes only. It is not intended to diagnose, treat, cure, mitigate, or prevent any medical condition and is not a substitute for the individualized care of a licensed healthcare professional. The five brain-type framework is the NeuroSense interpretation of common qEEG patterns and is used for educational context only.</div>
  </section>

  </body></html>`;
}

module.exports = { renderReportHtml };
