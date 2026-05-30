/**
 * Static Pages Generator
 * Generates the 4 static informational pages for the NeuroSense report
 */

const { COLORS, FONTS, LAYOUT } = require('./pdfStyles');

// Colors - Using consistent blue (#121e36) throughout PDF
const PRIMARY_BLUE = '#121e36';
const TEAL = '#121e36';  // Changed to blue for consistency
const LIGHT_BLUE = '#E3F2FD';
const DARK_GRAY = '#000000';
const LIGHT_GRAY = '#000000';
const WHITE = '#FFFFFF';

// ============== ICON DRAWING FUNCTIONS ==============

/**
 * Draw a brain icon
 */
function drawBrainIcon(doc, x, y, size, color = PRIMARY_BLUE) {
  doc.save();
  doc.strokeColor(color).lineWidth(1.5);

  // Main brain outline (oval)
  doc.ellipse(x, y, size * 0.45, size * 0.35).stroke();

  // Center dividing line
  doc.moveTo(x, y - size * 0.3).lineTo(x, y + size * 0.3).stroke();

  // Left hemisphere curves
  doc.moveTo(x - size * 0.3, y - size * 0.1)
     .bezierCurveTo(x - size * 0.15, y - size * 0.2, x - size * 0.1, y - size * 0.1, x - size * 0.05, y)
     .stroke();
  doc.moveTo(x - size * 0.3, y + size * 0.1)
     .bezierCurveTo(x - size * 0.15, y + size * 0.2, x - size * 0.1, y + size * 0.1, x - size * 0.05, y)
     .stroke();

  // Right hemisphere curves
  doc.moveTo(x + size * 0.3, y - size * 0.1)
     .bezierCurveTo(x + size * 0.15, y - size * 0.2, x + size * 0.1, y - size * 0.1, x + size * 0.05, y)
     .stroke();
  doc.moveTo(x + size * 0.3, y + size * 0.1)
     .bezierCurveTo(x + size * 0.15, y + size * 0.2, x + size * 0.1, y + size * 0.1, x + size * 0.05, y)
     .stroke();

  doc.restore();
}

/**
 * Draw a head with gear icon (for stress/cognition)
 */
function drawHeadGearIcon(doc, x, y, size, color = PRIMARY_BLUE) {
  doc.save();
  doc.strokeColor(color).lineWidth(1.5);

  // Head circle
  doc.circle(x, y, size * 0.4).stroke();

  // Gear inside (small circle with teeth)
  const gearX = x + size * 0.05;
  const gearY = y - size * 0.05;
  const gearSize = size * 0.2;

  doc.circle(gearX, gearY, gearSize).stroke();

  // Gear teeth (small lines)
  for (let i = 0; i < 6; i++) {
    const angle = (i * 60) * Math.PI / 180;
    const innerX = gearX + gearSize * Math.cos(angle);
    const innerY = gearY + gearSize * Math.sin(angle);
    const outerX = gearX + (gearSize + 4) * Math.cos(angle);
    const outerY = gearY + (gearSize + 4) * Math.sin(angle);
    doc.moveTo(innerX, innerY).lineTo(outerX, outerY).stroke();
  }

  doc.restore();
}

/**
 * Draw a head with waves icon (for brainwaves)
 */
function drawHeadWavesIcon(doc, x, y, size, color = PRIMARY_BLUE) {
  doc.save();
  doc.strokeColor(color).lineWidth(1.5);

  // Head circle
  doc.circle(x, y, size * 0.4).stroke();

  // Wavy lines inside
  const waveY1 = y - size * 0.1;
  const waveY2 = y + size * 0.1;

  // Wave 1
  doc.moveTo(x - size * 0.25, waveY1)
     .bezierCurveTo(x - size * 0.1, waveY1 - 5, x + size * 0.1, waveY1 + 5, x + size * 0.25, waveY1)
     .stroke();

  // Wave 2
  doc.moveTo(x - size * 0.25, waveY2)
     .bezierCurveTo(x - size * 0.1, waveY2 + 5, x + size * 0.1, waveY2 - 5, x + size * 0.25, waveY2)
     .stroke();

  doc.restore();
}

/**
 * Draw a lightbulb icon (for focus/attention)
 */
function drawLightbulbIcon(doc, x, y, size, color = PRIMARY_BLUE) {
  doc.save();
  doc.strokeColor(color).lineWidth(1.5);

  // Bulb top (circle)
  doc.circle(x, y - size * 0.1, size * 0.3).stroke();

  // Bulb base
  doc.moveTo(x - size * 0.15, y + size * 0.15)
     .lineTo(x - size * 0.15, y + size * 0.3)
     .lineTo(x + size * 0.15, y + size * 0.3)
     .lineTo(x + size * 0.15, y + size * 0.15)
     .stroke();

  // Filament lines inside bulb
  doc.moveTo(x - size * 0.1, y - size * 0.05)
     .lineTo(x, y - size * 0.2)
     .lineTo(x + size * 0.1, y - size * 0.05)
     .stroke();

  // Rays around bulb
  for (let i = 0; i < 5; i++) {
    const angle = (-90 + i * 45) * Math.PI / 180;
    if (i !== 2) { // Skip the bottom ray
      const startX = x + size * 0.35 * Math.cos(angle);
      const startY = (y - size * 0.1) + size * 0.35 * Math.sin(angle);
      const endX = x + size * 0.45 * Math.cos(angle);
      const endY = (y - size * 0.1) + size * 0.45 * Math.sin(angle);
      doc.moveTo(startX, startY).lineTo(endX, endY).stroke();
    }
  }

  doc.restore();
}

/**
 * Draw a heart icon (for emotional regulation)
 */
function drawHeartIcon(doc, x, y, size, color = PRIMARY_BLUE) {
  doc.save();
  doc.strokeColor(color).lineWidth(1.5);

  // Heart shape using bezier curves
  doc.moveTo(x, y + size * 0.25)
     .bezierCurveTo(x - size * 0.4, y, x - size * 0.4, y - size * 0.3, x, y - size * 0.15)
     .bezierCurveTo(x + size * 0.4, y - size * 0.3, x + size * 0.4, y, x, y + size * 0.25)
     .stroke();

  doc.restore();
}

/**
 * Draw a decorative wavy line
 */
function drawWavyLine(doc, startX, y, width, color = '#333333') {
  doc.save();
  doc.strokeColor(color).lineWidth(2);

  const segments = 8;
  const segmentWidth = width / segments;
  const amplitude = 8;

  doc.moveTo(startX, y);
  for (let i = 0; i < segments; i++) {
    const x1 = startX + i * segmentWidth + segmentWidth / 2;
    const y1 = y + (i % 2 === 0 ? -amplitude : amplitude);
    const x2 = startX + (i + 1) * segmentWidth;
    const y2 = y;
    doc.quadraticCurveTo(x1, y1, x2, y2);
  }
  doc.stroke();

  doc.restore();
}

/**
 * Draw a rounded rectangle card
 */
function drawCard(doc, x, y, width, height, options = {}) {
  const {
    borderColor = PRIMARY_BLUE,
    fillColor = null,
    borderWidth = 1.5,
    radius = 8
  } = options;

  doc.save();

  if (fillColor) {
    doc.roundedRect(x, y, width, height, radius)
       .fillColor(fillColor)
       .fill();
  }

  doc.roundedRect(x, y, width, height, radius)
     .strokeColor(borderColor)
     .lineWidth(borderWidth)
     .stroke();

  doc.restore();
}

// ============== PAGE GENERATORS ==============

/**
 * Generate the Introduction page
 * Note: Logo is already added by addPageHeader() in geminiPdfGenerator.js
 */
function generateIntroductionPage(doc) {
  // Title - centered and positioned below the logo header
  doc.fontSize(28)
     .font('Helvetica-Bold')
     .fillColor(PRIMARY_BLUE)
     .text('INTRODUCTION', 0, 75, { width: 595, align: 'center' });

  // First paragraph - more space after heading
  let yPos = 120;
  const paragraphGap = 45;  // Gap between paragraphs

  doc.fontSize(9)
     .font('Helvetica')
     .fillColor(DARK_GRAY)
     .text('The qEEG report provided by NeuroSense EEG is intended for informational, educational and wellness purposes only. It is designed to help individuals and neurofeedback professionals better understand brainwave patterns and to support decisions related to neurofeedback training for non-medical cognitive enhancement. This report is not intended to diagnose, treat, cure, mitigate, or prevent any medical condition, and it should not be used as a substitute for consultation with a licensed healthcare provider.',
           50, yPos, { width: 495, align: 'justify', lineGap: 3 });

  yPos += paragraphGap + 20;
  doc.text('The EEG-based scores, brain maps, spectrograms, and neurofeedback protocol suitability scores are based on the analysis of EEG recordings. These scores are not diagnostic tools, and the information in this report should not be interpreted as medical advice.',
           50, yPos, { width: 495, align: 'justify', lineGap: 3 });

  yPos += paragraphGap;
  doc.text('Users are encouraged to consult with a qualified healthcare provider regarding any medical concerns or before starting any new treatment or therapy. NeuroSense EEG\'s qEEG analysis application is not a replacement for the individualized care provided by medical professionals.',
           50, yPos, { width: 495, align: 'justify', lineGap: 3 });

  // EEG Recording Section - more spacing before section heading
  yPos += paragraphGap + 20;
  doc.fontSize(20)
     .font('Helvetica-Bold')
     .fillColor(PRIMARY_BLUE)
     .text('EEG RECORDING', 50, yPos);

  yPos += 30;
  doc.fontSize(9)
     .font('Helvetica')
     .fillColor(DARK_GRAY)
     .text('The 10-20 system is the internationally recognized method used for placing electrodes on the scalp during an EEG (Electroencephalogram) recording.',
           50, yPos, { width: 495, align: 'justify', lineGap: 3 });

  yPos += 30;
  doc.text('It is named for the standardized distances between electrode positions, which are either 10% or 20% of the total front-to-back or right-to-left measurement of the head. This system ensures consistent and reproducible electrode placement, allowing for accurate brainwave measurement across individuals.',
           50, yPos, { width: 495, align: 'justify', lineGap: 3 });

  yPos += paragraphGap + 5;
  doc.text('Electrodes are positioned over specific areas of the brain, corresponding to functional regions like the frontal, temporal, parietal, and occipital lobes, helping clinicians and researchers capture electrical activity associated with various cognitive and neurological functions. The 10-20 system is widely used in clinical diagnostics and research to assess brain activity related to conditions such as epilepsy, sleep disorders, and other neurological disorders.',
           50, yPos, { width: 495, align: 'justify', lineGap: 3 });

  // EEG Signal illustration section
  yPos += 70;

  // EEG signal container - white background with subtle border
  const eegBoxX = 50;
  const eegBoxY = yPos;
  const eegBoxWidth = 495;
  const eegBoxHeight = 260;

  // White background box
  doc.rect(eegBoxX, eegBoxY, eegBoxWidth, eegBoxHeight)
     .fillColor('#FFFFFF')
     .fill();
  doc.rect(eegBoxX, eegBoxY, eegBoxWidth, eegBoxHeight)
     .strokeColor('#E0E0E0')
     .lineWidth(0.5)
     .stroke();

  // All 19 EEG channels
  const channels = ['Fp1', 'Fp2', 'F7', 'F3', 'Fz', 'F4', 'F8', 'T3', 'C3', 'Cz', 'C4', 'T4', 'T5', 'P3', 'Pz', 'P4', 'T6', 'O1', 'O2'];
  const channelSpacing = 12;
  const eegStartY = eegBoxY + 15;
  const eegWaveWidth = 280; // Width for EEG waves (left portion)
  const textAreaX = eegBoxX + 320; // Right side for text

  // Draw channel labels and EEG waves
  doc.fontSize(7).fillColor(PRIMARY_BLUE).font('Helvetica-Bold');

  for (let i = 0; i < channels.length; i++) {
    const lineY = eegStartY + i * channelSpacing;

    // Channel label
    doc.text(channels[i], eegBoxX + 10, lineY - 3, { width: 25 });

    // Draw realistic EEG wave line
    doc.save();
    doc.strokeColor(PRIMARY_BLUE).lineWidth(0.6);
    doc.moveTo(eegBoxX + 40, lineY);

    // Create more realistic EEG-like waveform
    const seed = i * 17; // Different seed for each channel
    for (let x = 0; x < eegWaveWidth; x += 2) {
      // Combine multiple sine waves for realistic EEG appearance
      const wave1 = Math.sin((x + seed) * 0.08) * 2;
      const wave2 = Math.sin((x + seed) * 0.15) * 1.5;
      const wave3 = Math.sin((x + seed) * 0.25) * 1;
      const noise = (Math.sin((x * i) * 0.5) * 0.5);
      const amplitude = wave1 + wave2 + wave3 + noise;
      doc.lineTo(eegBoxX + 40 + x, lineY + amplitude);
    }
    doc.stroke();
    doc.restore();
  }

  // Time scale line at bottom of EEG waves
  const timeScaleY = eegStartY + channels.length * channelSpacing + 5;
  doc.save();
  doc.strokeColor('#333333').lineWidth(0.8);
  doc.moveTo(eegBoxX + 40, timeScaleY).lineTo(eegBoxX + 40 + eegWaveWidth, timeScaleY).stroke();

  // Time scale tick marks
  const tickCount = 10;
  const tickSpacing = eegWaveWidth / tickCount;
  for (let t = 0; t <= tickCount; t++) {
    const tickX = eegBoxX + 40 + t * tickSpacing;
    doc.moveTo(tickX, timeScaleY).lineTo(tickX, timeScaleY + 4).stroke();
  }
  doc.restore();

  // "1 second" label centered below time scale
  doc.fontSize(8)
     .font('Helvetica')
     .fillColor(PRIMARY_BLUE)
     .text('1 second', eegBoxX + 40, timeScaleY + 10, { width: eegWaveWidth, align: 'center' });

  // Right side text area
  doc.fontSize(11)
     .font('Helvetica-Bold')
     .fillColor(DARK_GRAY)
     .text('A segment of raw EEG signal', textAreaX, eegBoxY + 60, { width: 160, align: 'left', lineGap: 4 });

  doc.fontSize(11)
     .font('Helvetica-Bold')
     .fillColor(DARK_GRAY)
     .text('from the 19 electrode locations', textAreaX, eegBoxY + 85, { width: 160, align: 'left', lineGap: 4 });

  doc.fontSize(11)
     .font('Helvetica-Bold')
     .fillColor(DARK_GRAY)
     .text('in the Eyes Closed condition.', textAreaX, eegBoxY + 110, { width: 160, align: 'left', lineGap: 4 });

  // Voltage scale on the right side
  const scaleX = textAreaX + 40;
  const scaleY = eegBoxY + 160;
  const scaleHeight = 50;

  // Vertical scale line
  doc.save();
  doc.strokeColor('#333333').lineWidth(1);
  doc.moveTo(scaleX, scaleY).lineTo(scaleX, scaleY + scaleHeight).stroke();

  // Horizontal ticks at top and bottom
  doc.moveTo(scaleX - 5, scaleY).lineTo(scaleX + 5, scaleY).stroke();
  doc.moveTo(scaleX - 5, scaleY + scaleHeight).lineTo(scaleX + 5, scaleY + scaleHeight).stroke();
  doc.restore();

  // Scale labels
  doc.fontSize(8)
     .font('Helvetica')
     .fillColor(DARK_GRAY)
     .text('50 µV', scaleX + 10, scaleY - 3)
     .text('-50 µV', scaleX + 10, scaleY + scaleHeight - 3);
}

/**
 * Generate the Rationale page
 * Note: Logo is already added by addPageHeader() in geminiPdfGenerator.js
 */
function generateRationalePage(doc) {
  // Title - centered and positioned below the logo header (shifted down)
  doc.fontSize(16)
     .font('Helvetica-Bold')
     .fillColor(PRIMARY_BLUE)
     .text('Rationale For Personalized Brain & Mind Well-Being Strategies', 0, 95, { width: 595, align: 'center' });

  const cardWidth = 480;
  const cardHeight = 100;
  const startX = 57;
  const cardGap = 30;  // Consistent gap between cards
  let yPos = 135;  // Adjusted for equal spacing after heading

  const cards = [
    {
      icon: drawBrainIcon,
      text: 'Every individual has unique cognitive and emotional patterns. Understanding brainwave activity allows for the creation of personalized self-care routines, relaxation techniques, and mental well-being practices that align with an individual\'s natural tendencies.'
    },
    {
      icon: drawHeadGearIcon,
      text: 'Recognizing early signs of stress, emotional imbalance, or cognitive exhaustion helps prevent long-term mental health struggles. Timely interventions can build resilience, improve emotional intelligence, and enhance overall quality of life.'
    },
    {
      icon: drawHeadWavesIcon,
      text: 'By identifying dominant brainwave patterns—such as theta waves for relaxation or beta waves for high alertness—individuals can optimize mental clarity, productivity, and emotional balance.'
    },
    {
      icon: drawBrainIcon,
      text: 'Balanced brain activity is crucial for long-term mental and physical health. Developing stability and adaptability helps individuals navigate personal and professional challenges with confidence and emotional control.'
    }
  ];

  cards.forEach((card, index) => {
    // Draw card border
    drawCard(doc, startX, yPos, cardWidth, cardHeight, { borderColor: PRIMARY_BLUE, borderWidth: 2, radius: 10 });

    // Draw icon circle background
    doc.circle(startX + 50, yPos + cardHeight / 2, 30)
       .strokeColor(PRIMARY_BLUE)
       .lineWidth(1.5)
       .stroke();

    // Draw icon
    card.icon(doc, startX + 50, yPos + cardHeight / 2, 50, PRIMARY_BLUE);

    // Draw text
    doc.fontSize(9)
       .font('Helvetica')
       .fillColor(DARK_GRAY)
       .text(card.text, startX + 100, yPos + 20, { width: cardWidth - 120, align: 'justify', lineGap: 2 });

    yPos += cardHeight + cardGap;  // Consistent spacing between cards
  });
}

/**
 * Generate the Brainwave Profiles page - Professional Design
 */
function generateBrainwaveProfilesPage(doc) {
  // Logo is already added by addPageHeader in geminiPdfGenerator.js - don't add again

  // Title - centered, no background, shifted down
  doc.fontSize(22)
     .font('Helvetica-Bold')
     .fillColor(PRIMARY_BLUE)
     .text('BRAINWAVE PROFILES', 0, 50, { width: 595, align: 'center' });

  // Intro section with light background - equal spacing
  let yPos = 90;
  const sectionGap = 25;  // Consistent gap between sections

  doc.roundedRect(40, yPos, 515, 70, 8)
     .fillColor('#F5F5F5')
     .fill();

  doc.fontSize(10)
     .font('Helvetica')
     .fillColor(DARK_GRAY)
     .text('Brainwaves are the electrical impulses generated by the brain, reflecting its activity and mental states. Understanding brainwave patterns provides valuable insights into stress levels, emotional resilience, cognitive balance, and overall well-being.',
           50, yPos + 10, { width: 495, align: 'justify', lineGap: 3 });

  // Section title - equal spacing
  yPos += 70 + sectionGap;
  doc.fontSize(14)
     .font('Helvetica-Bold')
     .fillColor(PRIMARY_BLUE)
     .text('Description of Common Brainwave Types', 0, yPos, { width: 595, align: 'center' });

  // Three professional cards
  yPos += 25;
  const cardWidth = 165;
  const cardHeight = 430;  // Reduced height to remove blank space
  const cardGap = 12;
  const startX = 44;

  const brainwaves = [
    {
      title: 'Beta Waves',
      color: '#121e36',
      frequency: '13-30 Hz',
      sections: [
        { heading: 'Role', points: ['Support logical thinking and decision-making', 'Task-oriented focus and alertness', 'Managing daily responsibilities'] },
        { heading: 'When Balanced', points: ['Enhanced focus and productivity', 'Clear thinking and mental clarity', 'Effective problem-solving'] },
        { heading: 'When Excessive', points: ['Stress and anxiety symptoms', 'Cognitive exhaustion', 'Difficulty relaxing'] }
      ]
    },
    {
      title: 'Alpha Waves',
      color: '#121e36',
      frequency: '8-12 Hz',
      sections: [
        { heading: 'Role', points: ['Facilitate relaxation and calm', 'Emotional stability and clarity', 'Bridge between focus and rest'] },
        { heading: 'When Balanced', points: ['Emotional resilience', 'Mindfulness and presence', 'Stress recovery ability'] },
        { heading: 'When Imbalanced', points: ['Emotional reactivity', 'Restlessness and agitation', 'Difficulty unwinding'] }
      ]
    },
    {
      title: 'Theta Waves',
      color: '#121e36',
      frequency: '4-7 Hz',
      sections: [
        { heading: 'Role', points: ['Drive creativity and intuition', 'Deep relaxation states', 'Subconscious processing'] },
        { heading: 'When Balanced', points: ['Enhanced creativity', 'Emotional processing', 'Restorative mental states'] },
        { heading: 'When Excessive', points: ['Excessive daydreaming', 'Mental fog and confusion', 'Difficulty maintaining focus'] }
      ]
    }
  ];

  brainwaves.forEach((wave, colIndex) => {
    const colX = startX + colIndex * (cardWidth + cardGap);

    // Card shadow
    doc.roundedRect(colX + 2, yPos + 2, cardWidth, cardHeight, 8)
       .fillColor('#E0E0E0')
       .fill();

    // Card background
    doc.roundedRect(colX, yPos, cardWidth, cardHeight, 8)
       .fillColor(WHITE)
       .fill();

    // Card border
    doc.roundedRect(colX, yPos, cardWidth, cardHeight, 8)
       .strokeColor(wave.color)
       .lineWidth(2)
       .stroke();

    // Colored header bar
    doc.roundedRect(colX, yPos, cardWidth, 45, 8)
       .fillColor(wave.color)
       .fill();
    // Cover bottom corners of header
    doc.rect(colX, yPos + 35, cardWidth, 10)
       .fillColor(wave.color)
       .fill();

    // Title
    doc.fontSize(13)
       .font('Helvetica-Bold')
       .fillColor(WHITE)
       .text(wave.title, colX, yPos + 8, { width: cardWidth, align: 'center' });

    // Frequency badge - increased font size
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor('#E3F2FD')
       .text(wave.frequency, colX, yPos + 26, { width: cardWidth, align: 'center' });

    let sectionY = yPos + 55;

    wave.sections.forEach((section, sIdx) => {
      // Section heading - all blue - increased font size
      const headingColor = '#121e36';

      doc.fontSize(11)
         .font('Helvetica-Bold')
         .fillColor(headingColor)
         .text(section.heading + ':', colX + 10, sectionY, { width: cardWidth - 20 });

      sectionY += 18;

      section.points.forEach(point => {
        // Bullet point
        doc.circle(colX + 15, sectionY + 4, 2)
           .fillColor(headingColor)
           .fill();

        doc.fontSize(10)
           .font('Helvetica')
           .fillColor(DARK_GRAY)
           .text(point, colX + 22, sectionY, { width: cardWidth - 35, lineGap: 2 });
        sectionY += doc.heightOfString(point, { width: cardWidth - 35 }) + 8;
      });

      sectionY += 10;
    });
  });
}

/**
 * Helper function to get score color based on classification
 * For Stress/Burnout: score = count of RED sub-params (0=best, 3=worst)
 */
function getScoreColor(score, maxScore, parameterName = '') {
  const isStressOrBurnout = parameterName === 'Stress' || parameterName === 'Burnout & Fatigue';

  if (isStressOrBurnout) {
    if (score === 0) return '#4CAF50';  // Green (0/3 red = Low = best)
    if (score === 1) return '#FF9800';  // Amber (1/3 red = Mild)
    if (score === 2) return '#FF9800';  // Orange (2/3 red = Moderate)
    return '#F44336';                   // Red (3/3 red = Severe)
  }

  const ratio = score / maxScore;
  if (ratio >= 0.8) return '#4CAF50'; // Green - High
  if (ratio >= 0.5) return '#FF9800'; // Orange - Medium
  return '#F44336'; // Red - Low
}

/**
 * Helper function to get parameter score from results
 */
function getParameterScore(algorithmResults, paramName) {
  if (!algorithmResults || !algorithmResults.parameters) return null;
  const param = algorithmResults.parameters.find(p =>
    p.name.toLowerCase().includes(paramName.toLowerCase()) ||
    paramName.toLowerCase().includes(p.name.toLowerCase().split(' ')[0])
  );
  return param ? { score: param.score, maxScore: param.maxScore, classification: param.classification } : null;
}

/**
 * Draw a professional circular icon with symbol
 */
function drawProfessionalIcon(doc, x, y, size, iconType, primaryColor = TEAL) {
  doc.save();

  // Outer circle with gradient effect (lighter fill)
  const lightColor = '#E8F5F3';
  doc.circle(x, y, size)
     .fillColor(lightColor)
     .fill();

  // Border circle
  doc.circle(x, y, size)
     .strokeColor(primaryColor)
     .lineWidth(2)
     .stroke();

  // Draw icon based on type
  doc.strokeColor(primaryColor).fillColor(primaryColor).lineWidth(1.5);

  const s = size * 0.5; // Scale factor

  switch(iconType) {
    case 'stress':
      // Gear/cog icon
      doc.circle(x, y, s * 0.4).stroke();
      for (let i = 0; i < 8; i++) {
        const angle = (i * 45) * Math.PI / 180;
        const innerR = s * 0.45;
        const outerR = s * 0.7;
        doc.moveTo(x + innerR * Math.cos(angle), y + innerR * Math.sin(angle))
           .lineTo(x + outerR * Math.cos(angle), y + outerR * Math.sin(angle))
           .stroke();
      }
      break;

    case 'heart':
      // Heart icon
      const hScale = s * 0.8;
      doc.save();
      doc.translate(x, y + hScale * 0.1);
      doc.moveTo(0, hScale * 0.3)
         .bezierCurveTo(-hScale * 0.5, -hScale * 0.1, -hScale * 0.5, -hScale * 0.5, 0, -hScale * 0.25)
         .bezierCurveTo(hScale * 0.5, -hScale * 0.5, hScale * 0.5, -hScale * 0.1, 0, hScale * 0.3)
         .fill();
      doc.restore();
      break;

    case 'lightbulb':
      // Lightbulb icon
      doc.circle(x, y - s * 0.15, s * 0.4).stroke();
      doc.rect(x - s * 0.2, y + s * 0.2, s * 0.4, s * 0.3).stroke();
      // Rays
      for (let i = 0; i < 5; i++) {
        const angle = (-120 + i * 30) * Math.PI / 180;
        doc.moveTo(x + s * 0.5 * Math.cos(angle), (y - s * 0.15) + s * 0.5 * Math.sin(angle))
           .lineTo(x + s * 0.7 * Math.cos(angle), (y - s * 0.15) + s * 0.7 * Math.sin(angle))
           .stroke();
      }
      break;

    case 'brain':
      // Brain icon
      doc.ellipse(x, y, s * 0.6, s * 0.45).stroke();
      doc.moveTo(x, y - s * 0.4).lineTo(x, y + s * 0.4).stroke();
      // Brain curves
      doc.moveTo(x - s * 0.4, y - s * 0.1)
         .bezierCurveTo(x - s * 0.2, y - s * 0.25, x - s * 0.1, y - s * 0.1, x, y)
         .stroke();
      doc.moveTo(x + s * 0.4, y - s * 0.1)
         .bezierCurveTo(x + s * 0.2, y - s * 0.25, x + s * 0.1, y - s * 0.1, x, y)
         .stroke();
      break;

    case 'burnout':
      // Head with lightning bolt (burnout)
      doc.circle(x, y, s * 0.5).stroke();
      // Lightning bolt
      doc.moveTo(x - s * 0.1, y - s * 0.3)
         .lineTo(x + s * 0.1, y - s * 0.05)
         .lineTo(x - s * 0.05, y - s * 0.05)
         .lineTo(x + s * 0.1, y + s * 0.3)
         .lineTo(x - s * 0.1, y + s * 0.05)
         .lineTo(x + s * 0.05, y + s * 0.05)
         .closePath()
         .fill();
      break;
  }

  doc.restore();
}

/**
 * Generate the Brain Markers page (without scores) - Professional Design
 */
function generateBrainMarkersPage(doc, algorithmResults = null) {
  // Logo is already added by addPageHeader in geminiPdfGenerator.js - don't add again

  // Title - centered, no background, shifted down
  doc.fontSize(22)
     .font('Helvetica-Bold')
     .fillColor(PRIMARY_BLUE)
     .text('YOUR BRAIN MARKERS', 0, 50, { width: 595, align: 'center' });

  // Card dimensions - optimized for content visibility
  const cardWidth = 255;
  const cardHeight = 210;
  const startX = 40;
  const col2X = 300;
  const cardGap = 12;
  let yPos = 95;  // More space between heading and content

  const markers = [
    {
      title: 'Stress & Mental Overload',
      iconType: 'stress',
      x: startX,
      y: yPos,
      points: [
        'High beta levels indicate excessive stress or mental fatigue, negatively impacting relaxation and well-being.',
        'Understanding this parameter enables the implementation of stress-management techniques such as meditation, breathwork, and structured downtime.'
      ]
    },
    {
      title: 'Emotional Regulation',
      iconType: 'heart',
      x: col2X,
      y: yPos,
      points: [
        'Emotional balance is key to a healthy mindset. Imbalanced alpha waves can lead to mood swings, frustration, and burnout.',
        'Monitoring alpha activity helps determine the need for interventions like guided relaxation, mindfulness, or reflective journaling to improve emotional stability.'
      ]
    },
    {
      title: 'Focus & Attention',
      iconType: 'lightbulb',
      x: startX,
      y: yPos + cardHeight + cardGap,
      points: [
        'Theta dominance supports deep relaxation and creativity, while beta dominance enhances focus and structure.',
        'Identifying these tendencies ensures that wellness routines align with natural cognitive states, promoting relaxation when needed and focus when necessary.'
      ]
    },
    {
      title: 'Cognition',
      iconType: 'brain',
      x: col2X,
      y: yPos + cardHeight + cardGap,
      points: [
        'Peak alpha activity reflects the brain\'s ability to process emotions and thoughts efficiently.',
        'Low alpha activation suggests the need for slowing down, mindfulness exercises, and sensory grounding techniques to restore mental clarity.'
      ]
    }
  ];

  // Draw first 4 cards with professional design
  markers.forEach(marker => {
    // Card shadow effect (subtle)
    doc.roundedRect(marker.x + 2, marker.y + 2, cardWidth, cardHeight, 10)
       .fillColor('#E8E8E8')
       .fill();

    // Card background - solid white
    doc.roundedRect(marker.x, marker.y, cardWidth, cardHeight, 10)
       .fillColor('#FFFFFF')
       .fill();

    // Card border
    doc.roundedRect(marker.x, marker.y, cardWidth, cardHeight, 10)
       .strokeColor(TEAL)
       .lineWidth(1.5)
       .stroke();

    // Title row with icon on the right
    // Icon circle background (small, positioned at top-right corner inside the card)
    const iconX = marker.x + cardWidth - 30;
    const iconY = marker.y + 25;
    const iconSize = 18;

    // Draw icon with light background
    doc.circle(iconX, iconY, iconSize)
       .fillColor('#E8F5F3')
       .fill();
    doc.circle(iconX, iconY, iconSize)
       .strokeColor(TEAL)
       .lineWidth(1.5)
       .stroke();

    // Draw simple icon symbol inside
    doc.save();
    doc.strokeColor(TEAL).fillColor(TEAL).lineWidth(1.2);
    const s = iconSize * 0.5;

    if (marker.iconType === 'stress') {
      // Gear icon
      doc.circle(iconX, iconY, s * 0.35).stroke();
      for (let i = 0; i < 6; i++) {
        const angle = (i * 60) * Math.PI / 180;
        doc.moveTo(iconX + s * 0.4 * Math.cos(angle), iconY + s * 0.4 * Math.sin(angle))
           .lineTo(iconX + s * 0.65 * Math.cos(angle), iconY + s * 0.65 * Math.sin(angle))
           .stroke();
      }
    } else if (marker.iconType === 'heart') {
      // Heart icon (smaller)
      const hs = s * 0.6;
      doc.moveTo(iconX, iconY + hs * 0.3)
         .bezierCurveTo(iconX - hs * 0.5, iconY - hs * 0.1, iconX - hs * 0.5, iconY - hs * 0.4, iconX, iconY - hs * 0.2)
         .bezierCurveTo(iconX + hs * 0.5, iconY - hs * 0.4, iconX + hs * 0.5, iconY - hs * 0.1, iconX, iconY + hs * 0.3)
         .fill();
    } else if (marker.iconType === 'lightbulb') {
      // Lightbulb icon
      doc.circle(iconX, iconY - s * 0.1, s * 0.35).stroke();
      doc.rect(iconX - s * 0.15, iconY + s * 0.2, s * 0.3, s * 0.25).stroke();
    } else if (marker.iconType === 'brain') {
      // Brain icon
      doc.ellipse(iconX, iconY, s * 0.55, s * 0.4).stroke();
      doc.moveTo(iconX, iconY - s * 0.35).lineTo(iconX, iconY + s * 0.35).stroke();
    }
    doc.restore();

    // Title in rounded badge - properly centered horizontally and vertically
    const titleText = marker.title;
    const titleWidth = 190; // Fixed width for consistency
    const titleHeight = 28;  // Reduced height for better text fit
    const titleX = marker.x + (cardWidth - titleWidth) / 2 - 15; // Proper horizontal center (accounting for icon)
    const titleY = marker.y + 12;

    // Draw rounded badge background
    doc.roundedRect(titleX, titleY, titleWidth, titleHeight, 14)
       .fillColor(TEAL)
       .fill();

    // Title text in white on the badge - properly vertically centered
    doc.fontSize(11)
       .font('Helvetica-Bold')
       .fillColor(WHITE)
       .text(titleText, titleX, titleY + 8, { width: titleWidth, align: 'center' });

    // Bullet points - below the title badge with more spacing
    let bulletY = marker.y + 55;
    marker.points.forEach(point => {
      // Teal bullet point
      doc.circle(marker.x + 20, bulletY + 5, 2.5)
         .fillColor(TEAL)
         .fill();

      doc.fontSize(9)
         .font('Helvetica')
         .fillColor(DARK_GRAY)
         .text(point, marker.x + 30, bulletY, { width: cardWidth - 45, lineGap: 2 });
      bulletY += doc.heightOfString(point, { width: cardWidth - 45 }) + 10;
    });
  });

  // Brain Burn Out card (centered at bottom)
  const burnoutY = yPos + (cardHeight + cardGap) * 2;
  const burnoutX = (595 - cardWidth) / 2;
  const burnoutHeight = cardHeight;

  // Card shadow
  doc.roundedRect(burnoutX + 2, burnoutY + 2, cardWidth, burnoutHeight, 10)
     .fillColor('#E8E8E8')
     .fill();

  // Card background
  doc.roundedRect(burnoutX, burnoutY, cardWidth, burnoutHeight, 10)
     .fillColor('#FFFFFF')
     .fill();

  // Card border
  doc.roundedRect(burnoutX, burnoutY, cardWidth, burnoutHeight, 10)
     .strokeColor(TEAL)
     .lineWidth(1.5)
     .stroke();

  // Icon for burnout (same position as other cards)
  const burnoutIconX = burnoutX + cardWidth - 30;
  const burnoutIconY = burnoutY + 25;
  const burnoutIconSize = 18;

  doc.circle(burnoutIconX, burnoutIconY, burnoutIconSize)
     .fillColor('#E8F5F3')
     .fill();
  doc.circle(burnoutIconX, burnoutIconY, burnoutIconSize)
     .strokeColor(TEAL)
     .lineWidth(1.5)
     .stroke();

  // Burnout icon - lightning bolt in head
  doc.save();
  doc.strokeColor(TEAL).fillColor(TEAL).lineWidth(1.2);
  const bs = burnoutIconSize * 0.5;
  doc.circle(burnoutIconX, burnoutIconY, bs * 0.45).stroke();
  // Lightning bolt
  doc.moveTo(burnoutIconX - bs * 0.1, burnoutIconY - bs * 0.25)
     .lineTo(burnoutIconX + bs * 0.05, burnoutIconY)
     .lineTo(burnoutIconX - bs * 0.05, burnoutIconY)
     .lineTo(burnoutIconX + bs * 0.1, burnoutIconY + bs * 0.25)
     .stroke();
  doc.restore();

  // Title in rounded badge - properly centered horizontally and vertically
  const burnoutTitleWidth = 190;
  const burnoutTitleHeight = 28;  // Reduced height for better text fit
  const burnoutTitleX = burnoutX + (cardWidth - burnoutTitleWidth) / 2 - 15; // Proper horizontal center (accounting for icon)
  const burnoutTitleY = burnoutY + 12;

  // Draw rounded badge background
  doc.roundedRect(burnoutTitleX, burnoutTitleY, burnoutTitleWidth, burnoutTitleHeight, 14)
     .fillColor(TEAL)
     .fill();

  // Title text in white on the badge - properly vertically centered
  doc.fontSize(11)
     .font('Helvetica-Bold')
     .fillColor(WHITE)
     .text('Brain Burn Out', burnoutTitleX, burnoutTitleY + 8, { width: burnoutTitleWidth, align: 'center' });

  const burnoutPoints = [
    'Cognitive adaptability—the ability to shift between different states of mind—is essential for emotional intelligence and personal growth. If this is absent, burnout happens.',
    'Understanding this parameter helps individuals integrate creative and logical thinking, improving problem-solving and stress resilience.'
  ];

  let burnoutBulletY = burnoutY + 55;  // More space after badge
  burnoutPoints.forEach(point => {
    doc.circle(burnoutX + 20, burnoutBulletY + 5, 2.5)
       .fillColor(TEAL)
       .fill();

    doc.fontSize(9)
       .font('Helvetica')
       .fillColor(DARK_GRAY)
       .text(point, burnoutX + 30, burnoutBulletY, { width: cardWidth - 45, lineGap: 2 });
    burnoutBulletY += doc.heightOfString(point, { width: cardWidth - 45 }) + 10;
  });
}

/**
 * Draw a curved arrow pointing right
 */
function drawRightArrow(doc, x, y, width, height, color = PRIMARY_BLUE) {
  doc.save();
  doc.fillColor(color);

  // Arrow body (curved rectangle)
  const arrowBodyHeight = height * 0.4;
  const arrowBodyY = y + (height - arrowBodyHeight) / 2;

  doc.roundedRect(x, arrowBodyY, width * 0.7, arrowBodyHeight, 3).fill();

  // Arrow head (triangle)
  const headX = x + width * 0.6;
  const headWidth = width * 0.4;

  doc.moveTo(headX, y)
     .lineTo(headX + headWidth, y + height / 2)
     .lineTo(headX, y + height)
     .closePath()
     .fill();

  doc.restore();
}

/**
 * Draw a thinking person icon
 */
function drawThinkingPersonIcon(doc, x, y, size, color = PRIMARY_BLUE) {
  doc.save();
  doc.fillColor(color).strokeColor(color);

  const s = size;

  // Head
  doc.circle(x + s * 0.3, y + s * 0.15, s * 0.15).fill();

  // Body
  doc.moveTo(x + s * 0.3, y + s * 0.3)
     .lineTo(x + s * 0.15, y + s * 0.7)
     .lineTo(x + s * 0.25, y + s * 0.7)
     .lineTo(x + s * 0.3, y + s * 0.5)
     .lineTo(x + s * 0.35, y + s * 0.7)
     .lineTo(x + s * 0.45, y + s * 0.7)
     .lineTo(x + s * 0.3, y + s * 0.3)
     .fill();

  // Raised arm (thinking pose)
  doc.lineWidth(s * 0.08);
  doc.moveTo(x + s * 0.3, y + s * 0.35)
     .lineTo(x + s * 0.5, y + s * 0.25)
     .lineTo(x + s * 0.45, y + s * 0.1)
     .stroke();

  // Thought bubbles
  doc.circle(x + s * 0.6, y + s * 0.15, s * 0.03).fill();
  doc.circle(x + s * 0.68, y + s * 0.1, s * 0.04).fill();
  doc.circle(x + s * 0.78, y + s * 0.05, s * 0.06).fill();

  doc.restore();
}

/**
 * Draw brain icon for parameter pages
 */
function drawParameterBrainIcon(doc, x, y, size, color = PRIMARY_BLUE) {
  doc.save();

  // Light background circle
  doc.circle(x, y, size)
     .fillColor('#E3F2FD')
     .fill();

  doc.circle(x, y, size)
     .strokeColor(color)
     .lineWidth(2)
     .stroke();

  // Brain details
  doc.strokeColor(color).lineWidth(1.5);
  const s = size * 0.6;

  doc.ellipse(x, y, s * 0.8, s * 0.6).stroke();
  doc.moveTo(x, y - s * 0.5).lineTo(x, y + s * 0.5).stroke();

  // Brain folds
  doc.moveTo(x - s * 0.5, y - s * 0.2)
     .bezierCurveTo(x - s * 0.25, y - s * 0.4, x - s * 0.1, y - s * 0.2, x, y)
     .stroke();
  doc.moveTo(x + s * 0.5, y - s * 0.2)
     .bezierCurveTo(x + s * 0.25, y - s * 0.4, x + s * 0.1, y - s * 0.2, x, y)
     .stroke();
  doc.moveTo(x - s * 0.5, y + s * 0.2)
     .bezierCurveTo(x - s * 0.25, y + s * 0.4, x - s * 0.1, y + s * 0.2, x, y)
     .stroke();
  doc.moveTo(x + s * 0.5, y + s * 0.2)
     .bezierCurveTo(x + s * 0.25, y + s * 0.4, x + s * 0.1, y + s * 0.2, x, y)
     .stroke();

  doc.restore();
}

/**
 * Generate a Parameter Detail Page (High/Low with Implications and How to Improve)
 * @param {Object} doc - PDFKit document
 * @param {Object} parameterData - Parameter information
 */
function generateParameterDetailPage(doc, parameterData) {
  const {
    name = 'Cognition',
    highTitle = 'High Cognition',
    highDescription = '',
    highImplications = [],
    lowTitle = 'Low Cognition',
    lowDescription = '',
    lowImplications = [],
    howToImprove = []
  } = parameterData;

  const pageWidth = 595;
  const margin = 35;
  const contentWidth = pageWidth - margin * 2;

  // Light blue background for entire page
  doc.rect(0, 0, pageWidth, 842)
     .fillColor('#F5FAFF')
     .fill();

  // Brain icon in top right
  drawParameterBrainIcon(doc, pageWidth - 60, 45, 30, PRIMARY_BLUE);

  let yPos = 30;

  // === HIGH SECTION ===
  const sectionHeight = 200;
  const leftColWidth = contentWidth * 0.45;
  const rightColWidth = contentWidth * 0.45;
  const arrowWidth = contentWidth * 0.1;

  // High title bar
  doc.roundedRect(margin, yPos, leftColWidth, 32, 5)
     .fillColor(PRIMARY_BLUE)
     .fill();

  doc.fontSize(14)
     .font('Helvetica-Bold')
     .fillColor(WHITE)
     .text(highTitle, margin + 15, yPos + 9, { width: leftColWidth - 30 });

  // Implications title bar (right side)
  doc.roundedRect(margin + leftColWidth + arrowWidth, yPos, rightColWidth, 32, 5)
     .fillColor(PRIMARY_BLUE)
     .fill();

  doc.fontSize(14)
     .font('Helvetica-Bold')
     .fillColor(WHITE)
     .text('Implications', margin + leftColWidth + arrowWidth + 15, yPos + 9, { width: rightColWidth - 30 });

  yPos += 40;

  // High description box (left)
  const highDescBoxHeight = 140;
  doc.roundedRect(margin, yPos, leftColWidth, highDescBoxHeight, 8)
     .fillColor(WHITE)
     .fill();
  doc.roundedRect(margin, yPos, leftColWidth, highDescBoxHeight, 8)
     .strokeColor('#E0E0E0')
     .lineWidth(1)
     .stroke();

  doc.fontSize(10)
     .font('Helvetica')
     .fillColor(DARK_GRAY)
     .text(highDescription, margin + 12, yPos + 12, {
       width: leftColWidth - 24,
       align: 'justify',
       lineGap: 4
     });

  // Arrow between columns
  const arrowY = yPos + highDescBoxHeight / 2 - 15;
  drawRightArrow(doc, margin + leftColWidth + 5, arrowY, arrowWidth - 10, 30, PRIMARY_BLUE);

  // High implications box (right)
  doc.roundedRect(margin + leftColWidth + arrowWidth, yPos, rightColWidth, highDescBoxHeight, 8)
     .fillColor(WHITE)
     .fill();
  doc.roundedRect(margin + leftColWidth + arrowWidth, yPos, rightColWidth, highDescBoxHeight, 8)
     .strokeColor('#E0E0E0')
     .lineWidth(1)
     .stroke();

  let bulletY = yPos + 12;
  highImplications.forEach(point => {
    doc.circle(margin + leftColWidth + arrowWidth + 18, bulletY + 5, 3)
       .fillColor(PRIMARY_BLUE)
       .fill();

    doc.fontSize(9)
       .font('Helvetica')
       .fillColor(DARK_GRAY)
       .text(point, margin + leftColWidth + arrowWidth + 28, bulletY, {
         width: rightColWidth - 40,
         lineGap: 2
       });
    bulletY += doc.heightOfString(point, { width: rightColWidth - 40 }) + 10;
  });

  yPos += highDescBoxHeight + 25;

  // === LOW SECTION ===
  // Low title bar
  doc.roundedRect(margin, yPos, leftColWidth, 32, 5)
     .fillColor(PRIMARY_BLUE)
     .fill();

  doc.fontSize(14)
     .font('Helvetica-Bold')
     .fillColor(WHITE)
     .text(lowTitle, margin + 15, yPos + 9, { width: leftColWidth - 30 });

  // Implications title bar (right side)
  doc.roundedRect(margin + leftColWidth + arrowWidth, yPos, rightColWidth, 32, 5)
     .fillColor(PRIMARY_BLUE)
     .fill();

  doc.fontSize(14)
     .font('Helvetica-Bold')
     .fillColor(WHITE)
     .text('Implications', margin + leftColWidth + arrowWidth + 15, yPos + 9, { width: rightColWidth - 30 });

  yPos += 40;

  // Low description box (left)
  const lowDescBoxHeight = 140;
  doc.roundedRect(margin, yPos, leftColWidth, lowDescBoxHeight, 8)
     .fillColor(WHITE)
     .fill();
  doc.roundedRect(margin, yPos, leftColWidth, lowDescBoxHeight, 8)
     .strokeColor('#E0E0E0')
     .lineWidth(1)
     .stroke();

  doc.fontSize(10)
     .font('Helvetica')
     .fillColor(DARK_GRAY)
     .text(lowDescription, margin + 12, yPos + 12, {
       width: leftColWidth - 24,
       align: 'justify',
       lineGap: 4
     });

  // Arrow between columns
  const arrowY2 = yPos + lowDescBoxHeight / 2 - 15;
  drawRightArrow(doc, margin + leftColWidth + 5, arrowY2, arrowWidth - 10, 30, PRIMARY_BLUE);

  // Low implications box (right)
  doc.roundedRect(margin + leftColWidth + arrowWidth, yPos, rightColWidth, lowDescBoxHeight, 8)
     .fillColor(WHITE)
     .fill();
  doc.roundedRect(margin + leftColWidth + arrowWidth, yPos, rightColWidth, lowDescBoxHeight, 8)
     .strokeColor('#E0E0E0')
     .lineWidth(1)
     .stroke();

  bulletY = yPos + 12;
  lowImplications.forEach(point => {
    doc.circle(margin + leftColWidth + arrowWidth + 18, bulletY + 5, 3)
       .fillColor(PRIMARY_BLUE)
       .fill();

    doc.fontSize(9)
       .font('Helvetica')
       .fillColor(DARK_GRAY)
       .text(point, margin + leftColWidth + arrowWidth + 28, bulletY, {
         width: rightColWidth - 40,
         lineGap: 2
       });
    bulletY += doc.heightOfString(point, { width: rightColWidth - 40 }) + 10;
  });

  yPos += lowDescBoxHeight + 25;

  // === HOW TO IMPROVE SECTION ===
  // Thinking person icon (left side)
  drawThinkingPersonIcon(doc, margin + 10, yPos + 20, 70, PRIMARY_BLUE);

  // How to Improve title bar
  const improveBoxX = margin + 90;
  const improveBoxWidth = contentWidth - 90;

  doc.roundedRect(improveBoxX, yPos, improveBoxWidth, 32, 5)
     .fillColor(PRIMARY_BLUE)
     .fill();

  doc.fontSize(14)
     .font('Helvetica-Bold')
     .fillColor(WHITE)
     .text('How to Improve', improveBoxX + 15, yPos + 9, { width: improveBoxWidth - 30 });

  yPos += 40;

  // How to Improve content box
  const improveContentHeight = 130;
  doc.roundedRect(improveBoxX, yPos, improveBoxWidth, improveContentHeight, 8)
     .fillColor(WHITE)
     .fill();
  doc.roundedRect(improveBoxX, yPos, improveBoxWidth, improveContentHeight, 8)
     .strokeColor('#E0E0E0')
     .lineWidth(1)
     .stroke();

  bulletY = yPos + 12;
  howToImprove.forEach(item => {
    doc.circle(improveBoxX + 18, bulletY + 5, 3)
       .fillColor(PRIMARY_BLUE)
       .fill();

    // Bold the title part (before colon)
    const colonIndex = item.indexOf(':');
    if (colonIndex > -1) {
      const title = item.substring(0, colonIndex + 1);
      const description = item.substring(colonIndex + 1);

      doc.fontSize(9)
         .font('Helvetica-Bold')
         .fillColor(DARK_GRAY)
         .text(title, improveBoxX + 28, bulletY, { continued: true, width: improveBoxWidth - 50 });

      doc.font('Helvetica')
         .text(description, { width: improveBoxWidth - 50, lineGap: 2 });
    } else {
      doc.fontSize(9)
         .font('Helvetica')
         .fillColor(DARK_GRAY)
         .text(item, improveBoxX + 28, bulletY, { width: improveBoxWidth - 50, lineGap: 2 });
    }

    bulletY += doc.heightOfString(item, { width: improveBoxWidth - 50 }) + 10;
  });
}

/**
 * Pre-defined parameter data for Cognition page
 */
const COGNITION_PAGE_DATA = {
  name: 'Cognition',
  highTitle: 'High Cognition',
  highDescription: 'Individuals with high cognitive function process and retain information quickly, demonstrating strong problem-solving skills and adaptability. They tend to have a high working memory capacity and can efficiently integrate new knowledge into existing frameworks.',
  highImplications: [
    'High cognitive function enables quick learning, making individuals more efficient in academic and professional settings.',
    'Strong reasoning skills allow for better judgment and decision-making, particularly in complex situations.',
    'Individuals with high cognition exhibit mental agility, helping them switch between tasks smoothly.'
  ],
  lowTitle: 'Low Cognition',
  lowDescription: 'Lower cognitive function can manifest as slower information processing, memory difficulties, and struggles with multitasking. Individuals may find it harder to grasp new concepts or retain key details in conversations and learning environments.',
  lowImplications: [
    'Difficulty processing information may lead to frustration and reduced confidence in learning environments.',
    'Poor working memory can make it harder to follow multi-step instructions or remember key details from discussions.',
    'Reduced cognitive efficiency can impact problem-solving abilities, leading to longer task completion times.'
  ],
  howToImprove: [
    'Cognitive Training: Engage in brain-training games, such as Sudoku, chess, or logic puzzles, to strengthen mental agility.',
    'Active Learning Techniques: Use spaced repetition, teaching concepts to others, and hands-on problem-solving to reinforce cognitive skills.',
    'Physical Activity: Regular aerobic exercise has been shown to enhance cognitive function by increasing blood flow to the brain.',
    'Healthy Diet: Consume brain-supporting nutrients like omega-3 fatty acids, antioxidants, and complex carbohydrates for sustained mental energy.'
  ]
};

module.exports = {
  generateIntroductionPage,
  generateRationalePage,
  generateBrainwaveProfilesPage,
  generateBrainMarkersPage,
  generateParameterDetailPage,
  COGNITION_PAGE_DATA,
  // Export icons for reuse
  drawBrainIcon,
  drawHeadGearIcon,
  drawHeadWavesIcon,
  drawLightbulbIcon,
  drawHeartIcon,
  drawThinkingPersonIcon,
  drawParameterBrainIcon
};
