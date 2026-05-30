/**
 * QEEG Algorithm Calculator
 * Based on Rhea's Report - Calculates 7 brain health parameters
 * Each parameter has 3 sub-metrics, scored 0-3, classified as Low/Medium/High
 */

class AlgorithmCalculator {
  constructor(qeegData) {
    this.data = qeegData;
    this.results = {
      parameters: [],
      rawCalculations: {},
      overallScore: 0
    };
    // Cache for sub-metric calculations to ensure exact same values across parameters
    this.cache = {};
  }

  /**
   * Main calculation method - calculates all 7 parameters
   */
  calculate() {
    console.log('\n🧮 ========== STARTING ALGORITHM CALCULATIONS ==========');
    console.log('📊 Input Data Structure:', JSON.stringify(this.data, null, 2));

    console.log('\n🐛 === ENHANCED DEBUG MODE ACTIVATED ===');
    console.log('📋 This debug output will show:');
    console.log('   1. Every raw value extracted from QEEG data');
    console.log('   2. All mathematical formulas and calculations');
    console.log('   3. Threshold comparisons and scoring logic');
    console.log('   4. Final score aggregation for each parameter');
    console.log('===========================================\n');

    const parameters = [
      this.calculateCognition(),
      this.calculateStress(),
      this.calculateFocusAttention(),
      this.calculateBurnoutFatigue(),
      this.calculateEmotionalRegulation(),
      this.calculateLearning(),
      this.calculateCreativity()
    ];

    console.log('\n✅ Final 7 Parameter Scores Calculated:');
    parameters.forEach((p, i) => {
      console.log(`${i + 1}. ${p.name}: ${p.score}/${p.maxScore} (${p.classification}) ${this.getEmoji(p.classification)}`);
      p.metrics.forEach(m => {
        console.log(`   - ${m.name}: ${m.score} point (value: ${JSON.stringify(m.value)})`);
      });
    });

    // === ENHANCED DEBUG: Show complete calculation summary ===
    console.log('\n🐛 === DEBUG: COMPLETE CALCULATION SUMMARY ===');
    console.log('┌─────────────────────────────┬───────┬──────────────┐');
    console.log('│ Parameter                   │ Score │ Classification│');
    console.log('├─────────────────────────────┼───────┼──────────────┤');
    parameters.forEach(p => {
      const padding = ' '.repeat(28 - p.name.length);
      console.log(`│ ${p.name}${padding}│  ${p.score}/3  │ ${p.classification.padEnd(12)} │`);
    });
    console.log('└─────────────────────────────┴───────┴──────────────┘');
    const overallHealthy = parameters.reduce((sum, p) => {
      const isInverted = p.name === 'Stress' || p.name === 'Burnout & Fatigue';
      return sum + (isInverted ? (p.maxScore - p.score) : p.score);
    }, 0);
    console.log(`\n📊 OVERALL BRAIN HEALTH SCORE: ${overallHealthy}/21 (Stress & Burnout inverted for health score)`);
    console.log('=== END DEBUG: CALCULATION SUMMARY ===\n');

    console.log('========== CALCULATIONS COMPLETE ==========\n');

    this.results.parameters = parameters;
    // For overall score, invert Stress & Burnout (where score=RED count, higher=worse)
    // so that 0 red = 3 healthy points, 3 red = 0 healthy points
    this.results.overallScore = parameters.reduce((sum, p) => {
      const isInverted = p.name === 'Stress' || p.name === 'Burnout & Fatigue';
      return sum + (isInverted ? (p.maxScore - p.score) : p.score);
    }, 0);

    return this.results;
  }

  getEmoji(classification) {
    if (classification === 'Low') return '🔴';
    if (classification === 'Medium') return '🟡';
    if (classification === 'High') return '🟢';
    // Stress/Burnout labels
    if (classification === 'Mild') return '🟡';
    if (classification === 'Moderate') return '🟠';
    if (classification === 'Severe') return '🔴';
    return '🟢';
  }

  // ==================== HELPER METHODS ====================

  /**
   * Get value from QEEG data table
   * @param {string} condition - 'EC' (Eyes Closed) or 'EO' (Eyes Open)
   * @param {string} powerType - 'absolute' or 'relative'
   * @param {string} channel - e.g., 'Fz', 'Cz', 'Pz'
   * @param {string} band - e.g., 'Theta', 'Alpha', 'Beta', 'HiBeta', 'Delta'
   */
  getValue(condition, powerType, channel, band) {
    try {
      return this.data[condition][powerType][channel][band];
    } catch (error) {
      console.error(`Error getting value: ${condition}.${powerType}.${channel}.${band}`);
      return null;
    }
  }

  /**
   * Check if a calculated value is a valid finite number
   * Returns false for Infinity, -Infinity, NaN, null, undefined
   */
  isFiniteValue(value) {
    return value !== null && value !== undefined && typeof value === 'number' && isFinite(value);
  }

  /**
   * Score a metric based on threshold
   * Returns 1 if condition is met (HEALTHY/NORMAL state by default)
   * Use 'invert: true' for stress/problem indicators
   */
  scoreMetric(value, threshold, comparison = 'less', invert = false) {
    if (value === null || value === undefined || !isFinite(value)) return 0;

    let result = 0;

    if (comparison === 'less') {
      result = value < threshold ? 1 : 0;
    } else if (comparison === 'more') {
      result = value > threshold ? 1 : 0;
    } else if (comparison === 'equal') {
      result = value === threshold ? 1 : 0;
    }

    // Invert for stress/problem indicators (where 1 point = problem detected)
    return invert ? (1 - result) : result;
  }

  /**
   * Classify score to bucket (Low/Medium/High) for positive parameters
   * (Cognition, Focus & Attention, Emotional Regulation, Learning, Creativity)
   */
  classifyScore(score) {
    if (score <= 1) return 'Low';     // 0/3 or 1/3 = Low
    if (score === 2) return 'Medium'; // 2/3 = Medium
    return 'High';                    // 3/3 = High (best)
  }

  /**
   * Special classification for Stress and Burnout parameters
   * For Stress and Burnout & Fatigue:
   * Score = count of RED (abnormal/failed) sub-params
   * 0/3 = Low (Green - best, no red sub-params)
   * 1/3 = Mild (Yellow), 2/3 = Moderate (Orange), 3/3 = Severe (Red - worst)
   */
  classifyStressBurnout(score) {
    if (score === 0) return 'Low';        // 0/3 red = no issues (best)
    if (score === 1) return 'Mild';       // 1/3 red = 1 abnormal sub-param
    if (score === 2) return 'Moderate';   // 2/3 red = 2 abnormal sub-params
    return 'Severe';                      // 3/3 red = all abnormal (worst)
  }

  // ==================== INDIVIDUAL METRICS ====================

  /**
   * Focus Score Stimulation Control (Theta:Beta Ratio) - ABSOLUTE POWER - For Cognition parameter
   * Eyes Open, Absolute Power, Fz & Cz average
   * < 1.5 is normal (as per specification)
   */
  calculateFocusScoreAbsolute() {
    // Return cached result if available
    if (this.cache.focusScoreAbsolute) {
      console.log('\n  🔍 === Focus Score Stimulation Control (ABSOLUTE) - Using cached value ===');
      return this.cache.focusScoreAbsolute;
    }

    console.log('\n  🔍 === Calculating Focus Score Stimulation Control (Theta:Beta) - ABSOLUTE POWER ===');
    console.log('  📋 Purpose: Measures mental focus by comparing slow (Theta) vs fast (Beta) brain waves');
    console.log('  📊 Data Source: Eyes Open (EO), ABSOLUTE Power (μV²), Channels Fz & Cz');
    console.log('  🎯 Expected: Ratio < 1.5 indicates good focus (more Beta than Theta)\n');

    const fzTheta = this.getValue('EO', 'absolute', 'Fz', 'Theta');
    const fzBeta = this.getValue('EO', 'absolute', 'Fz', 'Beta');
    const czTheta = this.getValue('EO', 'absolute', 'Cz', 'Theta');
    const czBeta = this.getValue('EO', 'absolute', 'Cz', 'Beta');

    console.log('  🐛 DEBUG - Step 1: Extract Raw Values from QEEG Data');
    console.log('     ├─ EO.absolute.Fz.Theta =', fzTheta, 'μV²');
    console.log('     ├─ EO.absolute.Fz.Beta  =', fzBeta, 'μV²');
    console.log('     ├─ EO.absolute.Cz.Theta =', czTheta, 'μV²');
    console.log('     └─ EO.absolute.Cz.Beta  =', czBeta, 'μV²');

    // Fix: Use == null to allow 0 values (valid EEG readings)
    // Also check for zero denominators to prevent Infinity/NaN
    if (fzTheta == null || fzBeta == null || czTheta == null || czBeta == null || fzBeta === 0 || czBeta === 0) {
      console.log('     ❌ Missing or zero Beta values (division by zero prevented), returning 0');
      return { value: 'Indeterminate', score: 0, description: 'Indeterminate (Abnormal)' };
    }

    console.log('\n  🐛 DEBUG - Step 2: Calculate Theta:Beta Ratios');
    const fzRatio = fzTheta / fzBeta;
    const czRatio = czTheta / czBeta;

    // Check for Infinity/NaN after division
    if (!this.isFiniteValue(fzRatio) || !this.isFiniteValue(czRatio)) {
      console.log('     ❌ Indeterminate result (Infinity/NaN detected), marking as Abnormal');
      const result = { value: 'Indeterminate', score: 0, description: 'Theta:Beta Ratio = Indeterminate (Abnormal)', details: { fzRatio: 'Indeterminate', czRatio: 'Indeterminate' } };
      this.cache.focusScoreAbsolute = result;
      return result;
    }

    console.log('     ├─ Fz Ratio = Theta/Beta = ' + fzTheta + ' / ' + fzBeta + ' = ' + fzRatio.toFixed(3));
    console.log('     └─ Cz Ratio = Theta/Beta = ' + czTheta + ' / ' + czBeta + ' = ' + czRatio.toFixed(3));

    console.log('\n  🐛 DEBUG - Step 3: Calculate Average Ratio');
    const avgRatio = (fzRatio + czRatio) / 2;

    if (!this.isFiniteValue(avgRatio)) {
      console.log('     ❌ Indeterminate average ratio, marking as Abnormal');
      const result = { value: 'Indeterminate', score: 0, description: 'Theta:Beta Ratio = Indeterminate (Abnormal)', details: { fzRatio: fzRatio.toFixed(2), czRatio: czRatio.toFixed(2) } };
      this.cache.focusScoreAbsolute = result;
      return result;
    }

    console.log('     └─ Average = (Fz + Cz) / 2 = (' + fzRatio.toFixed(3) + ' + ' + czRatio.toFixed(3) + ') / 2 = ' + avgRatio.toFixed(3));

    console.log('\n  🐛 DEBUG - Step 4: Score Against Threshold');
    console.log('     ├─ Threshold: < 1.5 = Normal (good focus, per spec)');
    console.log('     ├─ Actual Value: ' + avgRatio.toFixed(3));
    console.log('     ├─ Comparison: ' + avgRatio.toFixed(3) + ' < 1.5 ? ' + (avgRatio < 1.5));
    const score = this.scoreMetric(avgRatio, 1.5, 'less');
    console.log('     └─ ✅ SCORE: ' + score + '/1 ' + (score === 1 ? '(PASS - Good focus)' : '(FAIL - Poor focus)'));

    const result = {
      value: avgRatio,
      score: score,
      description: `Theta:Beta Ratio = ${avgRatio.toFixed(2)} (< 1.5 is normal per spec)`,
      details: { fzRatio: fzRatio.toFixed(2), czRatio: czRatio.toFixed(2) }
    };
    this.cache.focusScoreAbsolute = result;
    return result;
  }

  /**
   * Focus Score (Theta:Beta Ratio) - RELATIVE POWER - For Learning, Creativity, Focus&Attention parameters
   * Eyes Open, Relative Power, Fz & Cz average
   * < 1.5 is normal (as per specification)
   */
  calculateFocusScoreRelative() {
    // Return cached result if available
    if (this.cache.focusScoreRelative) {
      console.log('\n  🔍 === Focus Score (RELATIVE) - Using cached value ===');
      return this.cache.focusScoreRelative;
    }

    console.log('\n  🔍 === Calculating Focus Score (Theta:Beta) - RELATIVE POWER ===');
    console.log('  📋 Purpose: Measures mental focus by comparing slow (Theta) vs fast (Beta) brain waves');
    console.log('  📊 Data Source: Eyes Open (EO), RELATIVE Power (%), Channels Fz & Cz');
    console.log('  🎯 Expected: Ratio < 1.5 indicates good focus (more Beta than Theta)\n');

    const fzTheta = this.getValue('EO', 'relative', 'Fz', 'Theta');
    const fzBeta = this.getValue('EO', 'relative', 'Fz', 'Beta');
    const czTheta = this.getValue('EO', 'relative', 'Cz', 'Theta');
    const czBeta = this.getValue('EO', 'relative', 'Cz', 'Beta');

    console.log('  🐛 DEBUG - Step 1: Extract Raw Values from QEEG Data');
    console.log('     ├─ EO.relative.Fz.Theta =', fzTheta, '%');
    console.log('     ├─ EO.relative.Fz.Beta  =', fzBeta, '%');
    console.log('     ├─ EO.relative.Cz.Theta =', czTheta, '%');
    console.log('     └─ EO.relative.Cz.Beta  =', czBeta, '%');

    // Fix: Use == null to allow 0 values (valid EEG readings)
    // Also check for zero denominators to prevent Infinity/NaN
    if (fzTheta == null || fzBeta == null || czTheta == null || czBeta == null || fzBeta === 0 || czBeta === 0) {
      console.log('     ❌ Missing or zero Beta values (division by zero prevented), returning 0');
      return { value: 'Indeterminate', score: 0, description: 'Indeterminate (Abnormal)' };
    }

    console.log('\n  🐛 DEBUG - Step 2: Calculate Theta:Beta Ratios');
    const fzRatio = fzTheta / fzBeta;
    const czRatio = czTheta / czBeta;

    if (!this.isFiniteValue(fzRatio) || !this.isFiniteValue(czRatio)) {
      console.log('     ❌ Indeterminate result (Infinity/NaN detected), marking as Abnormal');
      const result = { value: 'Indeterminate', score: 0, description: 'Theta:Beta Ratio = Indeterminate (Abnormal)', details: { fzRatio: 'Indeterminate', czRatio: 'Indeterminate' } };
      this.cache.focusScoreRelative = result;
      return result;
    }

    console.log('     ├─ Fz Ratio = Theta/Beta = ' + fzTheta + ' / ' + fzBeta + ' = ' + fzRatio.toFixed(3));
    console.log('     └─ Cz Ratio = Theta/Beta = ' + czTheta + ' / ' + czBeta + ' = ' + czRatio.toFixed(3));

    console.log('\n  🐛 DEBUG - Step 3: Calculate Average Ratio');
    const avgRatio = (fzRatio + czRatio) / 2;

    if (!this.isFiniteValue(avgRatio)) {
      console.log('     ❌ Indeterminate average ratio, marking as Abnormal');
      const result = { value: 'Indeterminate', score: 0, description: 'Theta:Beta Ratio = Indeterminate (Abnormal)', details: { fzRatio: fzRatio.toFixed(2), czRatio: czRatio.toFixed(2) } };
      this.cache.focusScoreRelative = result;
      return result;
    }

    console.log('     └─ Average = (Fz + Cz) / 2 = (' + fzRatio.toFixed(3) + ' + ' + czRatio.toFixed(3) + ') / 2 = ' + avgRatio.toFixed(3));

    console.log('\n  🐛 DEBUG - Step 4: Score Against Threshold');
    console.log('     ├─ Threshold: < 1.5 = Normal (good focus, per spec)');
    console.log('     ├─ Actual Value: ' + avgRatio.toFixed(3));
    console.log('     ├─ Comparison: ' + avgRatio.toFixed(3) + ' < 1.5 ? ' + (avgRatio < 1.5));
    const score = this.scoreMetric(avgRatio, 1.5, 'less');
    console.log('     └─ ✅ SCORE: ' + score + '/1 ' + (score === 1 ? '(PASS - Good focus)' : '(FAIL - Poor focus)'));

    const result = {
      value: avgRatio,
      score: score,
      description: `Theta:Beta Ratio = ${avgRatio.toFixed(2)} (< 1.5 is normal per spec)`,
      details: { fzRatio: fzRatio.toFixed(2), czRatio: czRatio.toFixed(2) }
    };
    this.cache.focusScoreRelative = result;
    return result;
  }

  /**
   * Alpha Peak - Used in multiple parameters
   * Eyes Closed, Special (highest frequency at Pz or below)
   * > 9 Hz is normal
   * As per specification: "Alpha peak - Eyes Closed Special PZ or below - the highest score will be taken"
   */
  calculateAlphaPeak() {
    // Return cached result if available
    if (this.cache.alphaPeak) {
      console.log('\n  🔍 === Alpha Peak - Using cached value ===');
      return this.cache.alphaPeak;
    }

    console.log('\n  🔍 === Calculating Alpha Peak ===');
    console.log('  📋 Purpose: Find highest alpha peak frequency at Pz or below (posterior electrodes)');
    console.log('  📊 Data Source: Eyes Closed (EC), Special, Channels: Pz, P4, O1, O2, Oz (P3 excluded)');
    console.log('  🎯 Expected: Highest value > 9 Hz indicates good alpha peak frequency\n');

    // Get alpha peak values from Pz and below (posterior electrodes)
    // Note: P3 is excluded as per requirement - only use Pz, P4, and occipital channels
    const posteriorChannels = ['Pz', 'P4', 'O1', 'O2', 'Oz'];
    const alphaPeakValues = [];

    console.log('  🐛 DEBUG - Step 1: Extract Alpha Peak Values from Posterior Channels');
    posteriorChannels.forEach(channel => {
      const value = this.data.EC?.special?.[channel];
      if (value !== null && value !== undefined && value > 0) {
        alphaPeakValues.push({ channel, value });
        console.log(`     ├─ ${channel}: ${value.toFixed(2)} Hz`);
      } else {
        console.log(`     ├─ ${channel}: N/A`);
      }
    });

    // If no values found, return 0 score
    if (alphaPeakValues.length === 0) {
      console.log('     ❌ No data available from posterior channels, returning 0');
      return { value: 'Indeterminate', score: 0, description: 'Indeterminate (Abnormal)' };
    }

    console.log('\n  🐛 DEBUG - Step 2: Find Highest Value');
    // Find the maximum value
    const maxPeak = alphaPeakValues.reduce((max, current) =>
      current.value > max.value ? current : max
    );

    console.log(`     └─ Highest Alpha Peak: ${maxPeak.value.toFixed(2)} Hz (from ${maxPeak.channel})`);

    console.log('\n  🐛 DEBUG - Step 3: Score Against Threshold');
    console.log(`     ├─ Threshold: > 9 Hz = normal`);
    console.log(`     ├─ Actual Value: ${maxPeak.value.toFixed(2)} Hz`);
    console.log(`     ├─ Comparison: ${maxPeak.value.toFixed(2)} > 9 ? ${maxPeak.value > 9}`);

    const score = this.scoreMetric(maxPeak.value, 9, 'more');
    console.log(`     └─ ✅ SCORE: ${score}/1 ${score === 1 ? '(PASS - Good alpha peak)' : '(FAIL - Low alpha peak)'}`);

    const result = {
      value: maxPeak.value,
      score: score,
      description: `Alpha Peak = ${maxPeak.value.toFixed(1)} Hz at ${maxPeak.channel} (> 9 is normal)`,
      details: {
        channel: maxPeak.channel,
        allValues: alphaPeakValues.map(p => `${p.channel}:${p.value.toFixed(1)}Hz`).join(', ')
      }
    };
    this.cache.alphaPeak = result;
    return result;
  }

  /**
   * Alpha:Theta Balance - Used in multiple parameters
   * Eyes Closed, Absolute Power, Fz, Cz, Pz
   * Order Fz < Cz < Pz is normal (posterior dominance)
   * As per specification: Fz < Cz < Pz is the correct order
   */
  calculateAlphaThetaBalance() {
    // Return cached result if available
    if (this.cache.alphaThetaBalance) {
      console.log('\n  🔍 === Alpha:Theta Balance - Using cached value ===');
      return this.cache.alphaThetaBalance;
    }

    console.log('\n  🔍 === Calculating Alpha:Theta Balance ===');
    const fzAlpha = this.getValue('EC', 'absolute', 'Fz', 'Alpha');
    const fzTheta = this.getValue('EC', 'absolute', 'Fz', 'Theta');
    const czAlpha = this.getValue('EC', 'absolute', 'Cz', 'Alpha');
    const czTheta = this.getValue('EC', 'absolute', 'Cz', 'Theta');
    const pzAlpha = this.getValue('EC', 'absolute', 'Pz', 'Alpha');
    const pzTheta = this.getValue('EC', 'absolute', 'Pz', 'Theta');

    console.log('     Raw Values - Fz:', { Alpha: fzAlpha, Theta: fzTheta });
    console.log('     Raw Values - Cz:', { Alpha: czAlpha, Theta: czTheta });
    console.log('     Raw Values - Pz:', { Alpha: pzAlpha, Theta: pzTheta });

    // Fix: Use == null to allow 0 values (valid EEG readings)
    // Also check for zero denominators to prevent Infinity/NaN
    if (fzAlpha == null || fzTheta == null || czAlpha == null || czTheta == null || pzAlpha == null || pzTheta == null ||
        fzTheta === 0 || czTheta === 0 || pzTheta === 0) {
      console.log('     ❌ Missing or zero Theta values (division by zero prevented), returning 0');
      return { value: 'Indeterminate', score: 0, description: 'Indeterminate (Abnormal)' };
    }

    const fzRatio = fzAlpha / fzTheta;
    const czRatio = czAlpha / czTheta;
    const pzRatio = pzAlpha / pzTheta;

    // Check for Infinity/NaN after division
    if (!this.isFiniteValue(fzRatio) || !this.isFiniteValue(czRatio) || !this.isFiniteValue(pzRatio)) {
      console.log('     ❌ Indeterminate result (Infinity/NaN detected), marking as Abnormal');
      const result = { value: 'Indeterminate', score: 0, description: 'Alpha:Theta Balance = Indeterminate (Abnormal)', details: { fzRatio: 'Indeterminate', czRatio: 'Indeterminate', pzRatio: 'Indeterminate', order: false } };
      this.cache.alphaThetaBalance = result;
      return result;
    }

    console.log(`     Ratios - Fz: ${fzRatio.toFixed(2)}, Cz: ${czRatio.toFixed(2)}, Pz: ${pzRatio.toFixed(2)}`);
    console.log(`     Expected Order: Fz < Cz < Pz (posterior dominant per spec)`);
    console.log(`     Actual Order: Fz(${fzRatio.toFixed(2)}) < Cz(${czRatio.toFixed(2)}) < Pz(${pzRatio.toFixed(2)})`);

    // Normal pattern: Fz < Cz < Pz (as per specification)
    const isNormalOrder = fzRatio < czRatio && czRatio < pzRatio;

    console.log(`     Check: ${fzRatio.toFixed(2)} < ${czRatio.toFixed(2)} = ${fzRatio < czRatio}`);
    console.log(`     Check: ${czRatio.toFixed(2)} < ${pzRatio.toFixed(2)} = ${czRatio < pzRatio}`);
    console.log(`     ✅ SCORE: ${isNormalOrder ? 1 : 0}/1`);

    const result = {
      value: { fz: fzRatio.toFixed(2), cz: czRatio.toFixed(2), pz: pzRatio.toFixed(2) },
      score: isNormalOrder ? 1 : 0,
      description: `Alpha:Theta Balance = Fz:${fzRatio.toFixed(2)}, Cz:${czRatio.toFixed(2)}, Pz:${pzRatio.toFixed(2)}`,
      details: { fzRatio, czRatio, pzRatio, order: isNormalOrder }
    };
    this.cache.alphaThetaBalance = result;
    return result;
  }

  /**
   * Arousal Score (HiBeta:Beta Ratio) - Used in multiple parameters
   * Eyes Open, Absolute Power, Fz & Cz average
   * < 1 is normal
   */
  calculateArousalScore() {
    // Return cached result if available
    if (this.cache.arousalScore) {
      console.log('\n  🔍 === Arousal Score - Using cached value ===');
      return this.cache.arousalScore;
    }

    console.log('\n  🔍 === Calculating Arousal Score (HiBeta:Beta) ===');
    const fzBeta = this.getValue('EO', 'absolute', 'Fz', 'Beta');
    const fzHiBeta = this.getValue('EO', 'absolute', 'Fz', 'HiBeta');
    const czBeta = this.getValue('EO', 'absolute', 'Cz', 'Beta');
    const czHiBeta = this.getValue('EO', 'absolute', 'Cz', 'HiBeta');

    console.log('     Raw Values - Fz:', { Beta: fzBeta, HiBeta: fzHiBeta });
    console.log('     Raw Values - Cz:', { Beta: czBeta, HiBeta: czHiBeta });

    // Fix: Use == null to allow 0 values (valid EEG readings)
    // Also check for zero denominators to prevent Infinity/NaN
    if (fzBeta == null || fzHiBeta == null || czBeta == null || czHiBeta == null || fzBeta === 0 || czBeta === 0) {
      console.log('     ❌ Missing or zero Beta values (division by zero prevented), returning 0');
      return { value: 'Indeterminate', score: 0, description: 'Indeterminate (Abnormal)' };
    }

    const fzRatio = fzHiBeta / fzBeta;
    const czRatio = czHiBeta / czBeta;

    if (!this.isFiniteValue(fzRatio) || !this.isFiniteValue(czRatio)) {
      console.log('     ❌ Indeterminate result (Infinity/NaN detected), marking as Abnormal');
      const result = { value: 'Indeterminate', score: 0, description: 'Arousal Score = Indeterminate (Abnormal)', details: { fzRatio: 'Indeterminate', czRatio: 'Indeterminate' } };
      this.cache.arousalScore = result;
      return result;
    }

    const avgRatio = (fzRatio + czRatio) / 2;

    if (!this.isFiniteValue(avgRatio)) {
      console.log('     ❌ Indeterminate average, marking as Abnormal');
      const result = { value: 'Indeterminate', score: 0, description: 'Arousal Score = Indeterminate (Abnormal)', details: { fzRatio: fzRatio.toFixed(2), czRatio: czRatio.toFixed(2) } };
      this.cache.arousalScore = result;
      return result;
    }

    const score = this.scoreMetric(avgRatio, 1, 'less');

    console.log(`     Fz ratio (HiBeta/Beta): ${fzRatio.toFixed(3)}`);
    console.log(`     Cz ratio (HiBeta/Beta): ${czRatio.toFixed(3)}`);
    console.log(`     Average: ${avgRatio.toFixed(3)}`);
    console.log(`     Threshold: < 1 = normal (low arousal)`);
    console.log(`     Result: ${avgRatio.toFixed(3)} < 1 = ${avgRatio < 1}`);
    console.log(`     ✅ SCORE: ${score}/1`);

    const result = {
      value: avgRatio,
      score: score,
      description: `Arousal Score = ${avgRatio.toFixed(2)} (< 1 is normal)`,
      details: { fzRatio: fzRatio.toFixed(2), czRatio: czRatio.toFixed(2) }
    };
    this.cache.arousalScore = result;
    return result;
  }

  /**
   * Relaxation Score - Used in multiple parameters
   * Eyes Closed, ABSOLUTE Power, Pz, Alpha/Beta
   * > 1 is healthy (as per specification)
   */
  calculateRelaxationScore() {
    // Return cached result if available
    if (this.cache.relaxationScore) {
      console.log('\n  🔍 === Relaxation Score - Using cached value ===');
      return this.cache.relaxationScore;
    }

    console.log('\n  🔍 === Calculating Relaxation Score ===');
    console.log('  📋 Purpose: Measures ability to relax by comparing Alpha vs Beta waves');
    console.log('  📊 Data Source: Eyes Closed (EC), ABSOLUTE Power (μV²), Pz channel (posterior)');
    console.log('  🎯 Expected: Alpha/Beta > 1 indicates good relaxation capacity (per spec)\n');

    const pzAlpha = this.getValue('EC', 'absolute', 'Pz', 'Alpha');
    const pzBeta = this.getValue('EC', 'absolute', 'Pz', 'Beta');

    console.log('  🐛 DEBUG - Step 1: Extract Raw Values from QEEG Data');
    console.log('     ├─ EC.absolute.Pz.Alpha =', pzAlpha, 'μV²');
    console.log('     └─ EC.absolute.Pz.Beta  =', pzBeta, 'μV²');

    // Fix: Use == null to allow 0 values (valid EEG readings)
    if (pzAlpha == null || pzBeta == null || pzBeta === 0) {
      console.log('     ⚠️ Missing or zero Beta value, returning 0');
      return { value: 'Indeterminate', score: 0, description: 'Indeterminate (Abnormal)' };
    }

    console.log('\n  🐛 DEBUG - Step 2: Calculate Alpha:Beta Ratio');
    const ratio = pzAlpha / pzBeta;

    if (!this.isFiniteValue(ratio)) {
      console.log('     ❌ Indeterminate result (Infinity/NaN detected), marking as Abnormal');
      const result = { value: 'Indeterminate', score: 0, description: 'Relaxation Score = Indeterminate (Abnormal)' };
      this.cache.relaxationScore = result;
      return result;
    }

    console.log('     └─ Ratio = Alpha/Beta = ' + pzAlpha + ' / ' + pzBeta + ' = ' + ratio.toFixed(2));

    console.log('\n  🐛 DEBUG - Step 3: Score Against Threshold');
    console.log('     ├─ Threshold: > 8 (per specification)');
    console.log('     ├─ Actual Value: ' + ratio.toFixed(2));
    console.log('     ├─ Comparison: ' + ratio.toFixed(2) + ' > 8 ? ' + (ratio > 8));

    // As per specification: > 8 is healthy
    const score = ratio > 8 ? 1 : 0;
    console.log('     └─ ✅ SCORE: ' + score + '/1 ' + (score === 1 ? '(PASS - Good relaxation)' : '(FAIL - Poor relaxation)'));

    console.log('\n  💡 Interpretation:');
    if (ratio > 8) {
      console.log('     → High Alpha relative to Beta = Good relaxation capacity');
      console.log('     → Brain can easily shift into relaxed, calm state');
    } else {
      console.log('     → Low Alpha relative to Beta = Difficulty relaxing');
      console.log('     → May indicate stress or hyperarousal');
    }

    const result = {
      value: ratio,
      score: score,
      description: `Relaxation Score = ${ratio.toFixed(2)} (> 8 is healthy per spec)`
    };
    this.cache.relaxationScore = result;
    return result;
  }

  /**
   * Regeneration (Alpha Modulation) - Used in multiple parameters
   * EO & EC, Relative Power, Pz, (EC-EO)/EC * 100
   * > 30% is healthy
   */
  calculateRegeneration() {
    // Return cached result if available
    if (this.cache.regeneration) {
      console.log('\n  🔍 === Regeneration - Using cached value ===');
      return this.cache.regeneration;
    }

    console.log('\n  🔍 === Calculating Regeneration (Alpha Modulation) ===');
    console.log('     Using: EC vs EO relative power at Pz');
    const ecAlpha = this.getValue('EC', 'relative', 'Pz', 'Alpha');
    const eoAlpha = this.getValue('EO', 'relative', 'Pz', 'Alpha');

    console.log('     Raw Values:', { 'EC Alpha': ecAlpha, 'EO Alpha': eoAlpha });

    // Fix: Use == null to allow 0 values (valid EEG readings)
    if (ecAlpha == null || eoAlpha == null || ecAlpha === 0) {
      console.log('     ❌ Missing or zero EC Alpha value, returning 0');
      return { value: 'Indeterminate', score: 0, description: 'Indeterminate (Abnormal)' };
    }

    const modulation = ((ecAlpha - eoAlpha) / ecAlpha) * 100;

    if (!this.isFiniteValue(modulation)) {
      console.log('     ❌ Indeterminate result (Infinity/NaN detected), marking as Abnormal');
      const result = { value: 'Indeterminate', score: 0, description: 'Alpha Modulation = Indeterminate (Abnormal)' };
      this.cache.regeneration = result;
      return result;
    }

    const score = this.scoreMetric(modulation, 30, 'more');

    console.log(`     Formula: ((EC - EO) / EC) × 100`);
    console.log(`     Calculation: ((${ecAlpha} - ${eoAlpha}) / ${ecAlpha}) × 100`);
    console.log(`     Modulation: ${modulation.toFixed(1)}%`);
    console.log(`     Threshold: > 30% = healthy (good alpha reactivity)`);
    console.log(`     Result: ${modulation.toFixed(1)}% > 30% = ${modulation > 30}`);
    console.log(`     ✅ SCORE: ${score}/1`);

    const result = {
      value: modulation,
      score: score,
      description: `Alpha Modulation = ${modulation.toFixed(1)}% (> 30% is healthy)`
    };
    this.cache.regeneration = result;
    return result;
  }

  /**
   * Focus Theta (Relative Power) - Used in Focus & Attention
   * Eyes Open, Relative Power, Fz & Cz average
   * < 20% is normal
   */
  calculateFocusTheta() {
    // Return cached result if available
    if (this.cache.focusTheta) {
      console.log('\n  🔍 === Focus Theta - Using cached value ===');
      return this.cache.focusTheta;
    }

    console.log('\n  🔍 === Calculating Focus Theta ===');
    console.log('     Using: EO relative power at Fz and Cz');
    const fzTheta = this.getValue('EO', 'relative', 'Fz', 'Theta');
    const czTheta = this.getValue('EO', 'relative', 'Cz', 'Theta');

    console.log('     Raw Values:', { 'Fz Theta': fzTheta, 'Cz Theta': czTheta });

    // Fix: Use == null to allow 0 values (valid EEG readings)
    if (fzTheta == null || czTheta == null) {
      console.log('     ❌ Missing values, returning 0');
      return { value: 'Indeterminate', score: 0, description: 'Indeterminate (Abnormal)' };
    }

    const avgTheta = (fzTheta + czTheta) / 2;
    const score = this.scoreMetric(avgTheta, 20, 'less');

    console.log(`     Average: (${fzTheta} + ${czTheta}) / 2 = ${avgTheta.toFixed(1)}%`);
    console.log(`     Threshold: < 20% = normal (low frontal theta)`);
    console.log(`     Result: ${avgTheta.toFixed(1)}% < 20% = ${avgTheta < 20}`);
    console.log(`     ✅ SCORE: ${score}/1`);

    const result = {
      value: avgTheta,
      score: score,
      description: `Focus Theta = ${avgTheta.toFixed(1)}% (< 20% is normal)`
    };
    this.cache.focusTheta = result;
    return result;
  }

  /**
   * Excessive Delta - Used in Burnout & Fatigue
   * Eyes Open, Relative Power, avg of Fz, C3, Cz, C4, P3, Pz, P4
   * < 20% is normal
   */
  calculateExcessiveDelta() {
    // Return cached result if available
    if (this.cache.excessiveDelta) {
      console.log('\n  🔍 === Excessive Delta - Using cached value ===');
      return this.cache.excessiveDelta;
    }

    console.log('\n  🔍 === Calculating Excessive Delta ===');
    console.log('     Using: EO relative power, averaging 7 channels');
    const channels = ['Fz', 'C3', 'Cz', 'C4', 'P3', 'Pz', 'P4'];
    let sum = 0;
    let count = 0;
    const channelValues = {};

    for (const channel of channels) {
      const delta = this.getValue('EO', 'relative', channel, 'Delta');
      channelValues[channel] = delta !== null ? delta : 'N/A';
      if (delta !== null) {
        sum += delta;
        count++;
      }
    }

    console.log('     Channel Values:', channelValues);
    console.log(`     Valid channels: ${count}/7`);

    if (count === 0) {
      console.log('     ❌ No valid channel data, returning 0');
      return { value: 'Indeterminate', score: 0, description: 'Indeterminate (Abnormal)' };
    }

    const avgDelta = sum / count;
    const score = this.scoreMetric(avgDelta, 20, 'less');

    console.log(`     Sum: ${sum.toFixed(2)}, Count: ${count}`);
    console.log(`     Average Delta: ${avgDelta.toFixed(1)}%`);
    console.log(`     Threshold: < 20% = normal (low delta during wakefulness)`);
    console.log(`     Result: ${avgDelta.toFixed(1)}% < 20% = ${avgDelta < 20}`);
    console.log(`     ✅ SCORE: ${score}/1`);

    const result = {
      value: avgDelta,
      score: score,
      description: `Excessive Delta = ${avgDelta.toFixed(1)}% (< 20% is normal)`
    };
    this.cache.excessiveDelta = result;
    return result;
  }

  /**
   * Alpha Asymmetry (Frontal) - Used in Emotional Regulation
   * Eyes Closed, Absolute Power, F3 & F4
   * Formula: (AlphaF4 + AlphaF3) / (AlphaF4 - AlphaF3)
   * < 1 is normal
   */
  calculateAlphaAsymmetry() {
    // Return cached result if available
    if (this.cache.alphaAsymmetry) {
      console.log('\n  🔍 === Alpha Asymmetry - Using cached value ===');
      return this.cache.alphaAsymmetry;
    }

    console.log('\n  🔍 === Calculating Alpha Asymmetry (Frontal) ===');
    console.log('     Using: EC absolute power at F3 and F4');
    console.log('     Formula: (AlphaF4 + AlphaF3) / (AlphaF4 - AlphaF3)');
    const f3Alpha = this.getValue('EC', 'absolute', 'F3', 'Alpha');
    const f4Alpha = this.getValue('EC', 'absolute', 'F4', 'Alpha');

    console.log('     Raw Values:', { 'F3 Alpha': f3Alpha, 'F4 Alpha': f4Alpha });

    // Fix: Use == null to allow 0 values (valid EEG readings)
    if (f3Alpha == null || f4Alpha == null) {
      console.log('     ❌ Missing values, returning 0');
      return { value: 'Indeterminate', score: 0, description: 'Indeterminate (Abnormal)' };
    }

    const denominator = f4Alpha - f3Alpha;

    // Prevent division by zero
    if (denominator === 0) {
      console.log('     ❌ Denominator is zero (F4 - F3 = 0), returning 0');
      return { value: 'Indeterminate', score: 0, description: 'Indeterminate (Abnormal)' };
    }

    const asymmetry = (f4Alpha + f3Alpha) / denominator;

    if (!this.isFiniteValue(asymmetry)) {
      console.log('     ❌ Indeterminate result (Infinity/NaN detected), marking as Abnormal');
      const result = { value: 'Indeterminate', score: 0, description: 'Alpha Asymmetry = Indeterminate (Abnormal)' };
      this.cache.alphaAsymmetry = result;
      return result;
    }

    const score = this.scoreMetric(asymmetry, 1, 'less');

    console.log(`     Numerator: F4 + F3 = ${f4Alpha} + ${f3Alpha} = ${(f4Alpha + f3Alpha).toFixed(2)}`);
    console.log(`     Denominator: F4 - F3 = ${f4Alpha} - ${f3Alpha} = ${denominator.toFixed(2)}`);
    console.log(`     Asymmetry: (F4 + F3) / (F4 - F3) = ${asymmetry.toFixed(3)}`);
    console.log(`     Threshold: < 1 = normal (left frontal dominance, positive affect)`);
    console.log(`     Result: ${asymmetry.toFixed(3)} < 1 = ${asymmetry < 1}`);
    console.log(`     ✅ SCORE: ${score}/1`);

    const result = {
      value: asymmetry,
      score: score,
      description: `Alpha Asymmetry = ${asymmetry.toFixed(2)} (< 1 is normal)`
    };
    this.cache.alphaAsymmetry = result;
    return result;
  }

  // ==================== 7 PARAMETER CALCULATIONS ====================

  /**
   * 1. Cognition
   * - Focus Score Stimulation Control (Theta:Beta Ratio)
   * - Alpha Peak
   * - Alpha:Theta Balance
   */
  calculateCognition() {
    console.log('\n📊 ==================== COGNITION PARAMETER ====================');
    console.log('📋 Input Data Verification:');
    console.log('   EO.absolute.Fz:', this.data.EO?.absolute?.Fz);
    console.log('   EO.absolute.Cz:', this.data.EO?.absolute?.Cz);
    console.log('   EC.absolute.Fz:', this.data.EC?.absolute?.Fz);
    console.log('   EC.absolute.Cz:', this.data.EC?.absolute?.Cz);
    console.log('   EC.absolute.Pz:', this.data.EC?.absolute?.Pz);
    console.log('   EC.special.alphaPeak:', this.data.EC?.special?.alphaPeak);
    console.log('==============================================================\n');

    const metric1 = this.calculateFocusScoreAbsolute(); // Use ABSOLUTE power for Cognition
    const metric2 = this.calculateAlphaPeak();
    const metric3 = this.calculateAlphaThetaBalance();

    const totalScore = metric1.score + metric2.score + metric3.score;
    console.log(`   Total: ${metric1.score} + ${metric2.score} + ${metric3.score} = ${totalScore}/3`);

    return {
      name: 'Cognition',
      score: totalScore,
      maxScore: 3,
      classification: this.classifyScore(totalScore),
      metrics: [
        { name: 'Focus Score Stimulation Control (Theta:Beta)', ...metric1 },
        { name: 'Alpha Peak', ...metric2 },
        { name: 'Alpha:Theta Balance', ...metric3 }
      ]
    };
  }

  /**
   * 2. Stress (INVERTED SCORING - Higher score = More stress)
   * - Arousal Score (inverted: 0 healthy = 1 stress point, 1 healthy = 0 stress points)
   * - Relaxation Score (inverted)
   * - Regeneration (inverted)
   */
  calculateStress() {
    console.log('\n📊 === STRESS PARAMETER ===');
    const metric1 = this.calculateArousalScore();
    const metric2 = this.calculateRelaxationScore();
    const metric3 = this.calculateRegeneration();

    // Score = count of RED (abnormal/failed) sub-params
    // 0/3 = Low (no red), 1/3 = Mild, 2/3 = Moderate, 3/3 = Severe
    const healthyCount = metric1.score + metric2.score + metric3.score;
    const redCount = 3 - healthyCount;
    console.log(`\n  📊 STRESS: Healthy=${healthyCount}, Red=${redCount} → Score: ${redCount}/3`);
    console.log(`  💡 Interpretation: ${redCount}/3 red sub-params → ${redCount === 0 ? 'Low' : redCount === 1 ? 'Mild' : redCount === 2 ? 'Moderate' : 'Severe'} stress`);

    return {
      name: 'Stress',
      score: redCount,
      maxScore: 3,
      classification: this.classifyStressBurnout(redCount),
      metrics: [
        { name: 'Arousal Score', ...metric1 },
        { name: 'Relaxation Score', ...metric2 },
        { name: 'Regeneration (Alpha Modulation)', ...metric3 }
      ]
    };
  }

  /**
   * 3. Focus & Attention
   * - Focus Theta
   * - Alpha:Theta Balance
   * - Focus Score (Theta:Beta)
   */
  calculateFocusAttention() {
    console.log('\n📊 Calculating FOCUS & ATTENTION...');
    const metric1 = this.calculateFocusTheta();
    const metric2 = this.calculateAlphaThetaBalance();
    const metric3 = this.calculateFocusScoreRelative(); // Use RELATIVE power

    const totalScore = metric1.score + metric2.score + metric3.score;
    console.log(`   Total: ${metric1.score} + ${metric2.score} + ${metric3.score} = ${totalScore}/3`);

    return {
      name: 'Focus & Attention',
      score: totalScore,
      maxScore: 3,
      classification: this.classifyScore(totalScore),
      metrics: [
        { name: 'Focus Theta', ...metric1 },
        { name: 'Alpha:Theta Balance', ...metric2 },
        { name: 'Focus Score (Theta:Beta)', ...metric3 }
      ]
    };
  }

  /**
   * 4. Burnout & Fatigue (INVERTED SCORING - Higher score = More burnout)
   * - Arousal Score (inverted: 0 healthy = 1 burnout point, 1 healthy = 0 burnout points)
   * - Relaxation Score (inverted)
   * - Excessive Delta (inverted)
   */
  calculateBurnoutFatigue() {
    console.log('\n📊 === BURNOUT & FATIGUE PARAMETER ===');
    const metric1 = this.calculateArousalScore();
    const metric2 = this.calculateRelaxationScore();
    const metric3 = this.calculateExcessiveDelta();

    // Score = count of RED (abnormal/failed) sub-params
    // 0/3 = Low (no red), 1/3 = Mild, 2/3 = Moderate, 3/3 = Severe
    const healthyCount = metric1.score + metric2.score + metric3.score;
    const redCount = 3 - healthyCount;
    console.log(`\n  📊 BURNOUT: Healthy=${healthyCount}, Red=${redCount} → Score: ${redCount}/3`);
    console.log(`  💡 Interpretation: ${redCount}/3 red sub-params → ${redCount === 0 ? 'Low' : redCount === 1 ? 'Mild' : redCount === 2 ? 'Moderate' : 'Severe'} burnout`);

    return {
      name: 'Burnout & Fatigue',
      score: redCount,
      maxScore: 3,
      classification: this.classifyStressBurnout(redCount),
      metrics: [
        { name: 'Arousal Score', ...metric1 },
        { name: 'Relaxation Score', ...metric2 },
        { name: 'Excessive Delta', ...metric3 }
      ]
    };
  }

  /**
   * 5. Emotional Regulation
   * - Alpha Asymmetry
   * - Arousal Score
   * - Regeneration
   */
  calculateEmotionalRegulation() {
    console.log('\n📊 Calculating EMOTIONAL REGULATION...');
    const metric1 = this.calculateAlphaAsymmetry();
    const metric2 = this.calculateArousalScore();
    const metric3 = this.calculateRegeneration();

    const totalScore = metric1.score + metric2.score + metric3.score;
    console.log(`   Total: ${metric1.score} + ${metric2.score} + ${metric3.score} = ${totalScore}/3`);

    return {
      name: 'Emotional Regulation',
      score: totalScore,
      maxScore: 3,
      classification: this.classifyScore(totalScore),
      metrics: [
        { name: 'Alpha Asymmetry (Frontal)', ...metric1 },
        { name: 'Arousal Score', ...metric2 },
        { name: 'Regeneration (Alpha Modulation)', ...metric3 }
      ]
    };
  }

  /**
   * 6. Learning
   * - Alpha Peak
   * - Focus Score (Theta:Beta)
   * - Alpha:Theta Balance
   */
  calculateLearning() {
    console.log('\n📊 Calculating LEARNING...');
    const metric1 = this.calculateAlphaPeak();
    const metric2 = this.calculateFocusScoreRelative(); // Use RELATIVE power
    const metric3 = this.calculateAlphaThetaBalance();

    const totalScore = metric1.score + metric2.score + metric3.score;
    console.log(`   Total: ${metric1.score} + ${metric2.score} + ${metric3.score} = ${totalScore}/3`);

    return {
      name: 'Learning',
      score: totalScore,
      maxScore: 3,
      classification: this.classifyScore(totalScore),
      metrics: [
        { name: 'Alpha Peak', ...metric1 },
        { name: 'Focus Score (Theta:Beta)', ...metric2 },
        { name: 'Alpha:Theta Balance', ...metric3 }
      ]
    };
  }

  /**
   * 7. Creativity
   * - Relaxation Score
   * - Focus Score (Theta:Beta)
   * - Alpha Peak
   */
  calculateCreativity() {
    console.log('\n📊 Calculating CREATIVITY...');
    const metric1 = this.calculateRelaxationScore();
    const metric2 = this.calculateFocusScoreRelative(); // Use RELATIVE power
    const metric3 = this.calculateAlphaPeak();

    const totalScore = metric1.score + metric2.score + metric3.score;
    console.log(`   Total: ${metric1.score} + ${metric2.score} + ${metric3.score} = ${totalScore}/3`);

    return {
      name: 'Creativity',
      score: totalScore,
      maxScore: 3,
      classification: this.classifyScore(totalScore),
      metrics: [
        { name: 'Relaxation Score', ...metric1 },
        { name: 'Focus Score (Theta:Beta)', ...metric2 },
        { name: 'Alpha Peak', ...metric3 }
      ]
    };
  }
}

module.exports = AlgorithmCalculator;
