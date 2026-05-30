/**
 * Brain Type 5-Framework Classifier (NeuroSense / Limitless Brain Lab)
 *
 * Classifies a patient into one of FIVE brain types from the deterministic
 * 7-parameter algorithm output (algorithmCalculator.js) plus the key sub-metric
 * VALUES. This is the new "Brain Type & Performance Report" framework — distinct
 * from the legacy 6-type brainTypeClassifier.js used by the old PDFKit report.
 *
 *   Type 1 — Steady    Well-regulated, balanced
 *   Type 2 — Explorer  Creative, novelty-seeking, low follow-through
 *   Type 3 — Driver    Driven, high-arousal but recovers, goal-focused
 *   Type 4 — Empath    Deeply feeling, mood-reactive, dysregulated
 *   Type 5 — Sentinel  Vigilant, prepared, worry-prone but reliable
 *
 * Classification is a transparent additive fit-score across signals derived from
 * the algorithm's own thresholds (arousal<1, relaxation>8, regen>30%, asymmetry
 * sign/magnitude, alphaPeak>9, and the 0-3 parameter scores). The highest fit is
 * the primary type; the runner-up is the secondary. Numbers are never invented
 * here — only the qualitative classification + framework copy.
 *
 * Derived from the Sagar reference report (Sentinel, secondary Driver: arousal
 * 2.24, relaxation 2.47, regeneration 20.4%, frontal alpha asymmetry -9.97, with
 * good cognition / stress-regulation) and standard qEEG arousal/asymmetry
 * literature. Reviewed by the clinic before use.
 */

// ── Per-type framework copy (stable, doctor-facing backbone) ─────────────────
const TYPES = {
  1: {
    id: 1,
    name: 'Steady',
    icon: '✳️',
    color: '#38A169',
    tagline: 'The well-regulated, balanced brain',
    card: 'Focused, flexible, emotionally even. Shows up on time, follows through, plays by the rules. The well-regulated brain.',
    traits: ['Balanced', 'Reliable', 'Even-keeled', 'Adaptable'],
    neuroscience:
      'A Steady brain shows balanced arousal, posterior-dominant alpha, and symmetric frontal activity. The nervous system activates and recovers cleanly — the hallmark of good self-regulation.',
    whyStrength:
      'Steady brains are dependable and adaptable. They handle pressure without overreacting and recover quickly, which makes them consistent performers across many settings.',
    strengths: [
      'Even emotional baseline — pressure rarely tips you over.',
      'Clean activate/recover cycle supports sustained focus.',
      'Flexible attention — you shift between tasks without friction.',
    ],
    watchZones: [
      'Comfort can become complacency — keep setting fresh challenges.',
      'Balanced brains can under-rate their own capacity; aim higher.',
    ],
    strategy: {
      eat: 'A balanced whole-food diet maintains your steady baseline. No special intervention needed — protect what works.',
      move: 'Mix cardio and strength. Your brain tolerates intensity well, so train for goals, not regulation.',
      sleep: 'Keep a consistent sleep window. Your regulation depends on it staying consistent.',
      doMore: [
        'Progressive challenge — set goals slightly beyond your comfort zone.',
        'Skill stacking — your stable base makes deliberate practice highly effective.',
        'Novelty in small doses to keep engagement high.',
      ],
      lessOf: [
        'Autopilot — coasting wastes a well-regulated system.',
        'Skipping recovery on the assumption you don’t need it.',
      ],
    },
  },
  2: {
    id: 2,
    name: 'Explorer',
    icon: '🟠',
    color: '#ED8936',
    tagline: 'The creative, novelty-seeking brain',
    card: 'Creative, risk-taking, novelty-seeking. Lower prefrontal regulation — easily bored, struggles with routine and follow-through.',
    traits: ['Creative', 'Curious', 'Spontaneous', 'Divergent'],
    neuroscience:
      'Explorer brains show elevated frontal theta and lower prefrontal beta — a pattern tied to divergent thinking and novelty-seeking, but also to weaker sustained attention and follow-through.',
    whyStrength:
      'Explorers generate ideas others miss. Their open, associative cognition is a genuine creative engine — the trick is building structure around it so ideas become finished work.',
    strengths: [
      'Rich idea generation and lateral thinking.',
      'Comfortable with ambiguity and novelty.',
      'Quick to connect unrelated concepts.',
    ],
    watchZones: [
      'Sustained attention dips — long, repetitive tasks drain you fast.',
      'Follow-through gap — starting is easy, finishing is the work.',
      'Boredom-driven task switching fragments deep work.',
    ],
    strategy: {
      eat: 'Stabilise blood sugar with protein + complex carbs to steady frontal regulation. Omega-3s support prefrontal function.',
      move: 'Novel, varied movement (climbing, dance, sport) keeps you engaged. Routine gym plans tend not to stick for your type.',
      sleep: 'Protect a regular sleep schedule — irregular sleep amplifies the attention/regulation gap.',
      doMore: [
        'External structure — timers, checklists, body-doubling to anchor follow-through.',
        'Capture ideas immediately, then schedule execution separately.',
        'Single-task in short, novel-framed sprints.',
      ],
      lessOf: [
        'Open-ended unstructured days — they scatter your attention.',
        'Starting new projects before finishing current ones.',
      ],
    },
  },
  3: {
    id: 3,
    name: 'Driver',
    icon: '⚡',
    color: '#F59E0B',
    tagline: 'The driven, goal-focused brain',
    card: 'Driven, strong-willed, reliable. High arousal channelled into output. Sees things through. Tends to lock onto thoughts and grind on problems.',
    traits: ['Driven', 'Focused', 'Strong-willed', 'Reliable'],
    neuroscience:
      'Driver brains run a high-arousal, beta-rich baseline — but unlike the Sentinel, they regulate it: stress activates them productively and they recover. Fast-wave activity powers drive and goal-completion.',
    whyStrength:
      'Drivers convert pressure into output. High arousal that would overwhelm others becomes fuel — they finish what they start and perform under load.',
    strengths: [
      'Channels arousal into productivity — pressure makes you sharper.',
      'Strong goal-lock and completion drive.',
      'Reliable under deadline and load.',
    ],
    watchZones: [
      'Over-grinding — locking onto problems past the point of return.',
      'Difficulty downshifting; "off" mode can feel uncomfortable.',
      'Recovery debt if the high baseline is never deliberately lowered.',
    ],
    strategy: {
      eat: 'Moderate caffeine — your baseline is already high. Magnesium and balanced meals support a calmer evening downshift.',
      move: 'Use intense training as a pressure valve, but bookend it with parasympathetic work (slow walks, mobility) so you actually recover.',
      sleep: 'Hard stop on work 60-90 min before bed. Your drive is an asset; an over-driven nervous system at midnight is not.',
      doMore: [
        'Scheduled hard stops — protect recovery the way you protect deadlines.',
        'Single high-priority focus block per day instead of endless grind.',
        'Deliberate downshift ritual after intense work.',
      ],
      lessOf: [
        'Stimulants late in the day.',
        'Treating recovery as optional — it is what sustains the drive.',
      ],
    },
  },
  4: {
    id: 4,
    name: 'Empath',
    icon: '💗',
    color: '#E53E8C',
    tagline: 'The deeply feeling, relationship-driven brain',
    card: 'Empathetic, deeply feeling, relationship-driven. High limbic reactivity. Prone to mood swings and emotional intensity.',
    traits: ['Empathetic', 'Sensitive', 'Intuitive', 'Expressive'],
    neuroscience:
      'Empath brains show heightened limbic reactivity and frontal alpha asymmetry, with weaker top-down emotional regulation. Feelings register strongly and recover slowly — depth of feeling is the trait, dysregulation is the cost.',
    whyStrength:
      'Empaths read people and situations with rare sensitivity. Their emotional depth fuels connection, creativity, and intuition — the work is building regulation so feeling doesn’t become flooding.',
    strengths: [
      'High emotional attunement and intuition.',
      'Deep, authentic connection with others.',
      'Rich inner and creative life.',
    ],
    watchZones: [
      'Emotional flooding — feelings escalate faster than they settle.',
      'Mood reactivity and slower emotional recovery.',
      'Absorbing others’ stress as your own.',
    ],
    strategy: {
      eat: 'Stabilise mood with omega-3s, magnesium, and steady blood sugar. Limit alcohol — it worsens emotional volatility.',
      move: 'Rhythmic, grounding movement (yoga, swimming, walking) regulates the limbic system better than high-intensity spikes.',
      sleep: 'Protect sleep fiercely — emotional regulation collapses fastest when you’re under-slept.',
      doMore: [
        'Daily "name it to tame it" labelling practice before reacting.',
        'Clear emotional boundaries — you don’t have to carry everyone.',
        'HRV/breath training to build top-down regulation.',
      ],
      lessOf: [
        'Doom-scrolling and emotionally charged media.',
        'Over-committing to others at your own expense.',
      ],
    },
  },
  5: {
    id: 5,
    name: 'Sentinel',
    icon: '🛡️',
    color: '#2B6CB0',
    tagline: 'The vigilant, prepared brain',
    card: 'Prepared, motivated, thorough. Heightened activity in vigilance circuits (amygdala, basal ganglia). Worry-prone but reliable.',
    traits: ['Prepared', 'Goal-Oriented', 'High Drive', 'Vigilant', 'Reliable'],
    neuroscience:
      'Brain-imaging research shows the Sentinel brain has heightened activity in the basal ganglia, insular cortex, and amygdala — the threat-detection circuits — often linked to lower GABA. Your qEEG mirrors this: high arousal, right-frontal alpha asymmetry, and low regeneration. The nervous system stays "on," scanning for what could go wrong.',
    whyStrength:
      'Sentinel brains are the people you want planning your wedding or running operations. You see risk before it arrives, you prepare, and you finish what you start. The same vigilance that costs recovery is what makes you exceptionally reliable.',
    strengths: [
      'Reliable and prepared — you don’t drop balls; people trust your follow-through.',
      'Risk-aware and goal-driven — you see what others miss and don’t quit once committed.',
      'Strong stress tolerance — a real advantage over most Sentinel-type brains.',
    ],
    watchZones: [
      'Mental "always-on" mode — the mind doesn’t switch off; falling asleep can feel hard.',
      'Anticipatory worry — what-ifs run in the background, reducing emotional bandwidth.',
      'Recovery debt — low regeneration means you spend energy faster than you replenish.',
    ],
    strategy: {
      eat: 'Sentinel brains do best with a balanced diet rich in complex carbohydrates (which raise serotonin) plus moderate protein. Foods rich in magnesium (leafy greens, almonds, dark chocolate) support GABA. Limit caffeine — it amplifies your already-active arousal.',
      move: 'Skip extreme HIIT for now — it spikes the same arousal you’re trying to lower. Choose walking, swimming, yoga, tai chi, or light cycling. Aim for daily movement that finishes with you feeling calmer than you started.',
      sleep: 'Your low regeneration score makes sleep non-negotiable. No screens 60 min before bed. Cool, dark room. Same wake-time daily. Consider magnesium glycinate at night (after a chat with your doctor).',
      doMore: [
        '4-7-8 breathing — twice daily for 4 cycles. Activates parasympathetic tone.',
        'Worry journaling — 10 min before bed. Sentinel brains sleep better when worries are "contained."',
        'Box breathing before any high-stakes task.',
        'Cognitive reframing — for every "what could go wrong," add "what could go right."',
      ],
      lessOf: [
        'Caffeine after noon — extends your already-elevated arousal into the night.',
        'Doom-scrolling news — primes the threat-monitoring circuits already running hot.',
        'Saying yes when you mean no — Sentinel brains over-commit; boundaries protect your nervous system.',
        'Late-night problem-solving — your brain gnaws on it. Park it; tackle after sleep.',
      ],
    },
  },
};

/**
 * Pull a numeric sub-metric value out of the algorithm results by metric name.
 * Returns null when the metric is missing or marked Indeterminate.
 */
function findMetricValue(parameters, metricNameIncludes) {
  for (const param of parameters || []) {
    for (const metric of param.metrics || []) {
      if (metric.name && metric.name.toLowerCase().includes(metricNameIncludes.toLowerCase())) {
        const v = metric.value;
        if (typeof v === 'number' && isFinite(v)) return v;
        return null; // string ('Indeterminate') or object value → not usable here
      }
    }
  }
  return null;
}

function scoreOf(parameters, name) {
  const p = (parameters || []).find((x) => x.name === name);
  return p ? p.score : 0;
}

/**
 * Classify the patient into the 5-type framework.
 * @param {object} algoResults  Output of AlgorithmCalculator.calculate() ({ parameters, overallScore }).
 * @returns {{ primary: object, secondary: object, fitScores: object, signals: object }}
 */
function classifyBrainType5(algoResults) {
  const params = algoResults?.parameters || [];

  // 0-3 parameter scores. Stress & Burnout scores are RED counts (higher = worse),
  // so stress regulation is good when stressRed is low.
  const cognition = scoreOf(params, 'Cognition');
  const stressRed = scoreOf(params, 'Stress');
  const focus = scoreOf(params, 'Focus & Attention');
  const burnoutRed = scoreOf(params, 'Burnout & Fatigue');
  const emotional = scoreOf(params, 'Emotional Regulation');
  const learning = scoreOf(params, 'Learning');
  const creativity = scoreOf(params, 'Creativity');

  // Key metric VALUES (deterministic, straight from the algorithm).
  const arousal = findMetricValue(params, 'Arousal Score');
  const relaxation = findMetricValue(params, 'Relaxation Score');
  const regen = findMetricValue(params, 'Regeneration');
  const asymmetry = findMetricValue(params, 'Alpha Asymmetry');
  const alphaPeak = findMetricValue(params, 'Alpha Peak');

  // Signals, derived from the algorithm's own thresholds.
  const arousalHigh = arousal != null && arousal >= 1; // healthy is < 1
  const relaxLow = relaxation != null && relaxation <= 8; // healthy is > 8
  const regenLow = regen != null && regen < 30; // healthy is > 30%
  const rightShift = asymmetry != null && asymmetry < 0; // right-frontal dominance
  const alphaHealthy = alphaPeak != null && alphaPeak > 9;
  const stressRegGood = stressRed <= 1;
  const stressRegPoor = stressRed >= 2;
  const cogGood = cognition >= 2;
  const cogLow = cognition <= 1;
  const focusGood = focus >= 2;
  const focusLow = focus <= 1;
  const emoLow = emotional <= 1;
  const emoGood = emotional >= 2;

  const b = (cond, pts) => (cond ? pts : 0);

  // Additive fit scores. Higher = stronger match.
  const fitScores = {
    5: b(arousalHigh, 1) + b(relaxLow, 1) + b(regenLow, 1) + b(rightShift, 1) + b(stressRegGood, 1) + b(cogGood, 0.5),
    4: b(emoLow, 1.5) + b(rightShift, 1) + b(stressRegPoor, 1) + b(relaxLow, 0.5) + b(arousalHigh, 0.5),
    3: b(arousalHigh, 1) + b(stressRegGood, 1) + b(cogGood, 1) + b(focusGood, 1) + b(!regenLow, 0.5) + b(!rightShift, 0.5),
    2: b(focusLow, 1) + b(cogLow, 1) + b(creativity >= 2, 1) + b(emoGood, 0.3),
    1: b(cogGood, 1) + b(focusGood, 1) + b(stressRegGood, 1) + b(!arousalHigh, 1) + b(!rightShift, 1) + b(!regenLow, 1) + b(emoGood, 1) + b(alphaHealthy, 0.5),
  };

  // Rank types; tie-break by lower type id is arbitrary, so tie-break by a fixed
  // priority that favours the more clinically specific type.
  const priority = [5, 4, 2, 3, 1]; // most-specific → least-specific
  const ranked = Object.keys(fitScores)
    .map((id) => ({ id: Number(id), score: fitScores[id] }))
    .sort((a, z) => z.score - a.score || priority.indexOf(a.id) - priority.indexOf(z.id));

  const primaryId = ranked[0].id;
  const secondaryId = ranked[1].id;

  return {
    primary: TYPES[primaryId],
    secondary: TYPES[secondaryId],
    fitScores,
    signals: {
      arousal, relaxation, regen, asymmetry, alphaPeak,
      arousalHigh, relaxLow, regenLow, rightShift, alphaHealthy,
      stressRegGood, stressRegPoor, cogGood, focusGood, emoLow,
    },
  };
}

module.exports = { classifyBrainType5, TYPES };
