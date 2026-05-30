/**
 * Cognition Page Generator (Page 8)
 * Semi-circular gauge, description, 3 metric cards, references
 */

const { FONTS, LAYOUT, addPageHeader, registerOutfitFonts } = require('./pdfStyles');
const fs = require('fs');
const path = require('path');

const LOGO_PATH = path.resolve(__dirname, '../../../public/assets/Layer_1.png');
// Brain illustration — Figma: X:175, Y:168, W:242, H:210
const COGNITION_IMG = path.resolve(__dirname, '../../../public/assets/Illustration.png');

// Metric card icons
const ICON1_PATH = path.resolve(__dirname, '../../../public/assets/Group 1437253610.png');
const ICON2_PATH = path.resolve(__dirname, '../../../public/assets/Group 1437253612.png');
const ICON3_PATH = path.resolve(__dirname, '../../../public/assets/Frame 427321204 (4).png');

// Page 9 frame icons
const FRAME_ICON1 = path.resolve(__dirname, '../../../public/assets/Frameicon1.png');
const FRAME_ICON2 = path.resolve(__dirname, '../../../public/assets/Frameicon2.png');
const FRAME_ICON3 = path.resolve(__dirname, '../../../public/assets/Frameicon3.png');

const BLUE = '#227AFF';

/**
 * Generate the Cognition page
 * @param {object} doc - PDFKit document
 * @param {object} [data] - Dynamic data (title, percentage, description, metrics)
 */
function generateCognitionPage(doc, data) {
  var pw = LAYOUT.pageWidth;   // 595.28
  var ph = LAYOUT.pageHeight;  // 841.89

  // Default sample data — merge with provided data
  var defaults = {
    title: 'COGNITION',
    percentage: 50,
    description: 'Your cognitive function demonstrates moderate performance with balanced mental processing capabilities. While your brain shows adequate information processing and memory function, there are opportunities to enhance cognitive efficiency. Targeted brain training, lifestyle adjustments, and stress management can help optimize your mental performance.',
    metrics: [
      { title: 'Focus Score Stimulation Control', body: 'Suggests areas for improving focus and sustained attention capacity.', value: 'Value: 3.14' },
      { title: 'Alpha Peak', body: 'Healthy alpha peak supports good cognitive processing.', value: 'Value: fz: 1.06, cz: 2.84,\npz: 7.50' },
      { title: 'Alpha:Theta Balance', body: 'Suggests areas for improving focus and sustained attention capacity.', value: 'Value: 3.14' }
    ],
    references: [
      'Arns, Martijn, et al. "A Decade of EEG Theta/Beta Ratio Research in ADHD: a Meta-Analysis." Sage Journals, 2012, https://journals.sagepub.com/doi/10.1177/1087054712460087.',
      'Clarkea, Adam R, et al. "Age and Sex Effects in the EEG: Development of the Normal Child." Clinical Neurophysiology, Elsevier, 27 Apr. 2001, https://www.sciencedirect.com/science/article/abs/pii/S1388245701004886.',
      'Gold, Christian, et al. "Validity and Reliability of Electroencephalographic Frontal Alpha Asymmetry and Frontal Midline Theta as Biomarkers for Depression." Wiley Online Library, 2012, https://onlinelibrary.wiley.com/doi/full/10.1111/sjop.12022.',
      'Kementrian Riset, Teknologi Dan Pendidikan Tinggi. "Electroencephalogram (EEG) Stress Analysis on Alpha/Beta Ratio and Theta/Beta Ratio." Garuda, Jan. 2020, https://garuda.kemdikbud.go.id/documents/detail/1669212.',
      'Picken, Christie, et al. "The Theta/Beta Ratio as an Index of Cognitive Processing in Adults with the Combined Type of Attention Deficit Hyperactivity Disorder." Sage Journals, 26 Dec. 2019, https://journals.sagepub.com/doi/10.1177/1550059419895242.'
    ]
  };
  if (data) {
    data = {
      title: data.title || defaults.title,
      percentage: data.percentage !== undefined ? data.percentage : defaults.percentage,
      description: data.description || defaults.description,
      metrics: (data.metrics && data.metrics.length > 0 && data.metrics[0].title && data.metrics[0].title !== 'N/A') ? data.metrics : defaults.metrics,
      references: data.references || defaults.references,
      gaugeImage: data.gaugeImage || null
    };
  } else {
    data = defaults;
  }

  // Register Outfit fonts
  registerOutfitFonts(doc);

  // White background
  doc.rect(0, 0, pw, ph).fill('#FFFFFF');

  // ===== Logo top-right =====
  addPageHeader(doc);

  // ===== 1. TITLE — true page center =====
  doc.save();
  doc.font(FONTS.bold).fontSize(26).fillColor(BLUE)
     .text(data.title, 0, 35, { width: pw, align: 'center', characterSpacing: 0.5 });
  doc.restore();

  // ===== 2. ARC GAUGE — Figma Ellipse: W:333.93, H:333.93 =====
  var arcCx = pw / 2;               // centered ≈ 297.64
  var arcCy = 265;                   // shifted up
  var outerR = 300 / 2;             // ≈ 150
  var innerR = outerR * 0.8813;     // ≈ 132

  // Step 1: Draw arc ring only (no box yet)
  drawArcRing(doc, arcCx, arcCy, outerR, innerR, data.percentage);

  // ===== 3. BRAIN ILLUSTRATION — drawn AFTER arc ring, BEFORE box =====
  // Per-page Figma specs for illustration position/size
  var imgW, imgH, imgX, imgY;
  if (data.title === 'COGNITION') {
    imgX = 175; imgY = 195; imgW = 242; imgH = 210;
  } else if (data.title === 'FOCUS AND ATTENTION' || data.title === 'EMOTIONAL REGULATION' || data.title === 'STRESS') {
    imgX = 169; imgY = 194; imgW = 247; imgH = 165;
  } else {
    imgX = 175; imgY = 195; imgW = 242; imgH = 210;
  }

  // Use custom gaugeImage if provided, otherwise fall back to default COGNITION_IMG
  var gaugeImgPath = data.gaugeImage || COGNITION_IMG;

  try {
    if (fs.existsSync(gaugeImgPath)) {
      doc.image(gaugeImgPath, imgX, imgY, { width: imgW, height: imgH });
    } else {
      doc.save();
      doc.roundedRect(imgX, imgY, imgW, imgH, 8)
         .fillColor('#F0F4F8').fill();
      doc.restore();
      doc.save();
      doc.font(FONTS.regular).fontSize(10).fillColor('#AAAAAA')
         .text('[Illustration.png]', imgX, imgY + imgH / 2 - 5, { width: imgW, align: 'center' });
      doc.restore();
    }
  } catch (e) { /* skip */ }

  // Step 2: Draw percentage box ON TOP of illustration
  drawPercentageBox(doc, arcCx, data.percentage);

  // ===== ARC INDICATOR — positioned at percentage point on arc =====
  var gapDeg = 90;
  var arcSpanRad = (360 - gapDeg) * Math.PI / 180;
  var startRad = (90 + gapDeg / 2) * Math.PI / 180;
  var indAngle = startRad + (data.percentage / 100) * arcSpanRad;
  var indMidR = (outerR + innerR) / 2;
  var indPx = arcCx + indMidR * Math.cos(indAngle);
  var indPy = arcCy + indMidR * Math.sin(indAngle);
  var indR = 7;

  // Solid dark circle
  doc.save();
  doc.circle(indPx, indPy, indR)
     .fillColor('#3B4252').fill();
  doc.restore();

  // Subtle top shine
  doc.save();
  doc.ellipse(indPx, indPy - 2, indR - 2, indR - 4)
     .fillColor('#FFFFFF').fillOpacity(0.15).fill();
  doc.fillOpacity(1);
  doc.restore();

  // ===== 4. DESCRIPTION PARAGRAPH =====
  doc.save();
  doc.font(FONTS.regular).fontSize(10).fillColor('#000000')
     .text(data.description, 30, 455, { width: 535, align: 'center', lineGap: 3 });
  doc.restore();

  // ===== 5. "Your Key Metrics" HEADING =====
  doc.save();
  doc.font(FONTS.bold).fontSize(18).fillColor('#001B6A')
     .text('Your Key Metrics', 0, 535, { width: pw, align: 'center' });
  doc.restore();

  // ===== 6. METRIC CARDS — 3 equal cards, full width =====
  var cardW = 176;
  var cardH = 160;
  var cardGap = 12;
  var cardsAreaW = 3 * cardW + 2 * cardGap;  // 552
  var cardsStartX = (pw - cardsAreaW) / 2;  // centered
  var cardsStartY = 580;

  var iconPaths = [ICON1_PATH, ICON2_PATH, ICON3_PATH];
  var iconColors = ['#F97316', '#8B5CF6', '#3B82F6'];

  for (var i = 0; i < 3; i++) {
    var cx = cardsStartX + i * (cardW + cardGap);
    drawMetricCard(doc, cx, cardsStartY, cardW, cardH, data.metrics[i], iconColors[i], iconPaths[i]);
  }

  // ===== 7. REFERENCES — positioned right above footer (800) =====
  if (data.references && data.references.length > 0) {
    // Calculate total refs height first
    doc.font(FONTS.regular).fontSize(5);
    var totalRefsH = 0;
    for (var i = 0; i < data.references.length; i++) {
      var text = (i + 1) + '. ' + data.references[i];
      totalRefsH += doc.heightOfString(text, { width: 535, lineGap: 0.5 }) + 1;
    }
    var refY = 800 - totalRefsH - 2;  // position refs to end right at footer

    doc.save();
    doc.font(FONTS.regular).fontSize(5).fillColor('#000000');
    for (var i = 0; i < data.references.length; i++) {
      var text = (i + 1) + '. ' + data.references[i];
      doc.text(text, 30, refY, { width: 535, lineGap: 0.5 });
      refY += doc.heightOfString(text, { width: 535, lineGap: 0.5 }) + 1;
    }
    doc.restore();
  }
}

// ===================================================================
// ARC GAUGE — Figma: Ellipse #22234B, ~300° arc, 88.13% inner radius
// ===================================================================

/**
 * Draw the arc gauge wrapping around the illustration
 * Arc sweeps ~300° from lower-left (0%) through top to lower-right (100%)
 * Gap at the bottom where the percentage box sits
 *
 * Screen coords: θ=0→right, θ=PI/2→down, θ=PI→left, θ=3PI/2→up
 * Arc: from θ=120° (lower-left) clockwise 300° to θ=60° (lower-right)
 */
/**
 * Draw arc ring only (track + gradient fill + end caps) — NO box
 */
function drawArcRing(doc, cx, cy, outerR, innerR, percentage) {
  var gapDeg = 90;
  var arcSpanDeg = 360 - gapDeg;
  var startDeg = 90 + gapDeg / 2;
  var startRad = startDeg * Math.PI / 180;
  var arcSpanRad = arcSpanDeg * Math.PI / 180;

  function angleAt(t) { return startRad + t * arcSpanRad; }
  function pt(r, angle) { return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }; }

  var midR = (outerR + innerR) / 2;
  var capR = (outerR - innerR) / 2;

  // Track
  drawDonutArc(doc, cx, cy, outerR, innerR, 0, 1, angleAt, '#B0B8C4');

  // Filled gradient
  if (percentage > 0) {
    var arcGrad = doc.linearGradient(cx - outerR, cy, cx + outerR, cy);
    arcGrad.stop(0, '#4FACFE').stop(0.35, '#2563EB').stop(0.7, '#1E3A8A').stop(1, '#22234B');
    drawDonutArcGradient(doc, cx, cy, outerR, innerR, 0, percentage / 100, angleAt, arcGrad);
  }

  // End caps
  if (percentage > 0) {
    var sP = pt(midR, angleAt(0));
    doc.save(); doc.circle(sP.x, sP.y, capR).fillColor('#4FACFE').fill(); doc.restore();
  }
  if (percentage > 0 && percentage <= 100) {
    var eP = pt(midR, angleAt(percentage / 100));
    doc.save(); doc.circle(eP.x, eP.y, capR).fillColor('#22234B').fill(); doc.restore();
  }
  if (percentage < 100) {
    var endP = pt(midR, angleAt(1));
    doc.save(); doc.circle(endP.x, endP.y, capR).fillColor('#B0B8C4').fill(); doc.restore();
  }
}

/**
 * Draw percentage box — drawn ON TOP of illustration
 */
function drawPercentageBox(doc, cx, percentage) {
  var boxW = 300;
  var boxX = cx - boxW / 2;
  var boxY = 355;
  var boxH = 82;
  var boxR = 20;

  doc.save();
  doc.roundedRect(boxX, boxY, boxW, boxH, boxR)
     .fillColor('#011A6B').fill();
  doc.restore();

  // "0%" label
  doc.save();
  doc.font(FONTS.regular).fontSize(11).fillColor('#FFFFFF')
     .text('0%', boxX + 14, boxY + 12, { width: 25, align: 'left', lineBreak: false });
  doc.restore();

  // "100%" label
  doc.save();
  doc.font(FONTS.regular).fontSize(11).fillColor('#FFFFFF')
     .text('100%', boxX + boxW - 50, boxY + 12, { width: 35, align: 'right', lineBreak: false });
  doc.restore();

  // Percentage text
  doc.save();
  doc.font(FONTS.bold).fontSize(34).fillColor('#FFFFFF')
     .text(percentage + '%', boxX, boxY + 26, { width: boxW, align: 'center' });
  doc.restore();
}

/**
 * Draw a donut arc segment using polyline fill
 * tStart/tEnd: 0→1 mapped via angleAt function
 */
function drawDonutArc(doc, cx, cy, outerR, innerR, tStart, tEnd, angleAt, color) {
  var steps = 100;

  doc.save();

  // Outer arc from tStart to tEnd
  var a0 = angleAt(tStart);
  doc.moveTo(cx + outerR * Math.cos(a0), cy + outerR * Math.sin(a0));

  for (var i = 1; i <= steps; i++) {
    var t = tStart + (i / steps) * (tEnd - tStart);
    var angle = angleAt(t);
    doc.lineTo(cx + outerR * Math.cos(angle), cy + outerR * Math.sin(angle));
  }

  // Inner arc back from tEnd to tStart
  for (var i = steps; i >= 0; i--) {
    var t = tStart + (i / steps) * (tEnd - tStart);
    var angle = angleAt(t);
    doc.lineTo(cx + innerR * Math.cos(angle), cy + innerR * Math.sin(angle));
  }

  doc.closePath();
  doc.fillColor(color).fill();
  doc.restore();
}

/**
 * Draw a donut arc with gradient fill
 */
function drawDonutArcGradient(doc, cx, cy, outerR, innerR, tStart, tEnd, angleAt, gradient) {
  var steps = 100;

  doc.save();

  var a0 = angleAt(tStart);
  doc.moveTo(cx + outerR * Math.cos(a0), cy + outerR * Math.sin(a0));

  for (var i = 1; i <= steps; i++) {
    var t = tStart + (i / steps) * (tEnd - tStart);
    var angle = angleAt(t);
    doc.lineTo(cx + outerR * Math.cos(angle), cy + outerR * Math.sin(angle));
  }

  for (var i = steps; i >= 0; i--) {
    var t = tStart + (i / steps) * (tEnd - tStart);
    var angle = angleAt(t);
    doc.lineTo(cx + innerR * Math.cos(angle), cy + innerR * Math.sin(angle));
  }

  doc.closePath();
  doc.fill(gradient);
  doc.restore();
}

// ===================================================================
// METRIC CARD
// ===================================================================

function drawMetricCard(doc, x, y, w, h, metric, iconColor, iconPath) {
  var cardR = 12;
  var pad = 12;

  // Outer glow
  doc.save();
  doc.roundedRect(x - 3, y - 3, w + 6, h + 6, cardR + 2)
     .fillColor('#A8C8FF').fillOpacity(0.12).fill();
  doc.fillOpacity(1);
  doc.restore();

  // Card background
  doc.save();
  doc.roundedRect(x, y, w, h, cardR)
     .fillColor('#FFFFFF').fill();
  doc.restore();

  // Shine — top highlight
  doc.save();
  doc.roundedRect(x, y, w, h * 0.4, cardR)
     .fillColor('#FFFFFF').fillOpacity(0.5).fill();
  doc.fillOpacity(1);
  doc.restore();

  // Card border
  doc.save();
  doc.roundedRect(x, y, w, h, cardR)
     .strokeColor('#D0D5DD').lineWidth(0.5).stroke();
  doc.restore();

  // ---- Icon — centered on top edge ----
  var iconSize = 34;
  var iconCx = x + w / 2;
  var iconCy = y - 2;

  // White mask
  doc.save();
  doc.circle(iconCx, iconCy, iconSize / 2 + 3).fillColor('#FFFFFF').fill();
  doc.restore();

  // Tinted ring
  doc.save();
  doc.circle(iconCx, iconCy, iconSize / 2 + 1).fillColor(iconColor).fillOpacity(0.10).fill();
  doc.fillOpacity(1);
  doc.restore();

  // Icon image
  try {
    if (iconPath && fs.existsSync(iconPath)) {
      doc.save();
      doc.circle(iconCx, iconCy, iconSize / 2).clip();
      doc.image(iconPath, iconCx - iconSize / 2, iconCy - iconSize / 2, { width: iconSize, height: iconSize });
      doc.restore();
    }
  } catch (e) { /* skip */ }

  // ---- Fixed Y positions for all 3 cards (same alignment) ----
  var titleY = y + 24;       // title starts here
  var bodyY = y + 55;        // body always starts here (moved up for longer text)
  var valueY = y + h - 30;   // value always at bottom

  // Title — Outfit Bold, auto-size for long titles
  var titleFontSize = metric.title.length > 25 ? 10 : (metric.title.length > 18 ? 11 : 14);
  doc.save();
  doc.font(FONTS.bold).fontSize(titleFontSize).fillColor('#000000')
     .text(metric.title, x + pad, titleY, { width: w - pad * 2, align: 'center', lineGap: 1.5 });
  doc.restore();

  // Body — Outfit Regular 10px, centered (fixed Y so all cards align)
  doc.save();
  doc.font(FONTS.regular).fontSize(10).fillColor('#000000')
     .text(metric.body, x + pad, bodyY, { width: w - pad * 2, align: 'center', lineGap: 2.5 });
  doc.restore();

  // Value — Bold 11px at bottom (fixed Y)
  doc.save();
  doc.font(FONTS.bold).fontSize(11).fillColor('#000000')
     .text(metric.value, x + pad - 4, valueY, { width: w - pad * 2 + 8, align: 'center', lineGap: 1 });
  doc.restore();
}

// ===================================================================
// COGNITION PAGE 2 — High/Low Cognition + How to Improve
// Figma: Group X:61, Y:33, W:471, H:471
// ===================================================================

/**
 * Generate the Cognition Details page (Page 9)
 */
function generateCognitionPage2(doc, data) {
  var pw = LAYOUT.pageWidth;   // 595.28
  var ph = LAYOUT.pageHeight;  // 841.89

  var defaults2 = {
    title: 'COGNITION',
    description: 'Cognition encompasses multiple mental functions, including memory, learning, reasoning, and problem-solving. Strong cognitive abilities support decision-making, information retention, and the ability to adapt to new challenges. This metric evaluates an individual\'s overall cognitive efficiency and processing speed.',
    highCognition: {
      title: 'High Cognition',
      paragraphs: [
        'Individuals with high cognitive function process and retain information quickly, demonstrating strong problem-solving skills and adaptability.',
        'They tend to have a high working memory capacity and can efficiently integrate new knowledge into existing frameworks.'
      ],
      implications: [
        'High cognitive function enables quick learning, making individuals more efficient in academic and professional settings.',
        'Strong reasoning skills allow for better judgment and decision-making, particularly in complex situations.',
        'Individuals with high cognition exhibit mental agility, helping them switch between tasks smoothly.'
      ]
    },
    lowCognition: {
      title: 'Low Cognition',
      paragraphs: [
        'Lower cognitive function can manifest as slower information processing, memory difficulties, and struggles with multitasking.',
        'Individuals may find it harder to grasp new concepts or retain key details in conversations and learning environments.'
      ],
      implications: [
        'Difficulty processing information may lead to frustration and reduced confidence in learning environments.',
        'Poor working memory can make it harder to follow multi-step instructions or remember key details from discussions.',
        'Reduced cognitive efficiency can impact problem-solving abilities, leading to longer task completion times.'
      ]
    },
    howToImprove: [
      'Cognitive Training: Engage in brain-training games, such as Sudoku, chess, or logic puzzles, to strengthen mental agility.',
      'Active Learning Techniques: Use spaced repetition, teaching concepts to others, and hands-on problem-solving to reinforce cognitive skills.',
      'Physical Activity: Regular aerobic exercise has been shown to enhance cognitive function by increasing blood flow to the brain.',
      'Healthy Diet: Consume brain-supporting nutrients like omega-3 fatty acids, antioxidants, and complex carbohydrates for sustained mental energy.'
    ],
    references: []
  };
  if (data) {
    data = {
      title: data.title || defaults2.title,
      description: data.description || defaults2.description,
      highCognition: data.highCognition || defaults2.highCognition,
      lowCognition: data.lowCognition || defaults2.lowCognition,
      howToImprove: data.howToImprove || defaults2.howToImprove,
      references: data.references || defaults2.references,
      showPillBar: !!data.showPillBar,
      pillBarScore: data.pillBarScore,
      pillBarScale: data.pillBarScale
    };
  } else {
    data = defaults2;
  }

  // White background
  doc.rect(0, 0, pw, ph).fill('#FFFFFF');

  // Logo top-right
  addPageHeader(doc);

  // ===== 1. TITLE — true page center =====
  // Use smaller font for very long titles to avoid logo overlap
  var titleFS2 = data.title && data.title.length > 25 ? 22 : 26;
  doc.save();
  doc.font(FONTS.bold).fontSize(titleFS2).fillColor(BLUE)
     .text(data.title, 0, 35, { width: pw, align: 'center', characterSpacing: -0.26 });
  doc.restore();

  var descY = 88;
  var contentGrpY = 175;

  if (data.showPillBar) {
    // ===== 1.5. DECORATIVE PILL BAR — Figma: X:133.36, Y:81, W:328.68, Fill:Linear 100%, Effects:Glass =====
    var barW = 270;
    var barH = 24;
    var barX = (pw - barW) / 2;  // centered ≈ 133.14
    var barY = 90;
    var barR = barH / 2;  // full pill shape

    // 1. Outer glow — subtle blue ambient
    doc.save();
    doc.roundedRect(barX - 2, barY - 2, barW + 4, barH + 4, barR + 1)
       .fillColor('#4FACFE').fillOpacity(0.10).fill();
    doc.fillOpacity(1);
    doc.restore();

    // 2. Drop shadow
    doc.save();
    doc.roundedRect(barX + 1, barY + 2, barW, barH, barR)
       .fillColor('#1E3A8A').fillOpacity(0.12).fill();
    doc.fillOpacity(1);
    doc.restore();

    // 3. Glass base fill — white semi-transparent
    doc.save();
    doc.roundedRect(barX, barY, barW, barH, barR)
       .fillColor('#FFFFFF').fillOpacity(0.50).fill();
    doc.fillOpacity(1);
    doc.restore();

    // 4. Linear gradient fill at 100% — Figma: Linear, 100%
    doc.save();
    var barGrad = doc.linearGradient(barX, barY, barX + barW, barY);
    barGrad.stop(0, '#4FACFE').stop(0.35, '#2563EB').stop(0.7, '#1E3A8A').stop(1, '#22234B');
    doc.roundedRect(barX, barY, barW, barH, barR);
    doc.fillOpacity(1.0);
    doc.fill(barGrad);
    doc.fillOpacity(1);
    doc.restore();

    // 4b. Green normal range overlay
    if (data.pillBarScale && data.pillBarScale.normalMin !== undefined && data.pillBarScale.normalMax !== undefined) {
      var scMin = data.pillBarScale.min;
      var scMax = data.pillBarScale.max;
      var nMin = data.pillBarScale.normalMin;
      var nMax = data.pillBarScale.normalMax;
      var capPadN = 8;
      var capWN = 15;
      var usableLeft = barX + capPadN + (capWN / 2);
      var usableRight = barX + barW - capPadN - (capWN / 2);
      var usableW = usableRight - usableLeft;
      var greenLeft = usableLeft + ((nMin - scMin) / (scMax - scMin)) * usableW;
      var greenRight = usableLeft + ((nMax - scMin) / (scMax - scMin)) * usableW;
      var greenW = greenRight - greenLeft;
      doc.save();
      doc.rect(greenLeft, barY, greenW, barH).clip();
      doc.roundedRect(barX, barY, barW, barH, barR)
         .fillColor('#38A169').fillOpacity(0.45).fill();
      doc.fillOpacity(1);
      doc.restore();
    }

    // 5. Glass frost overlay
    doc.save();
    doc.roundedRect(barX, barY, barW, barH, barR)
       .fillColor('#EEF2F7').fillOpacity(0.15).fill();
    doc.fillOpacity(1);
    doc.restore();

    // 6. Glass top shimmer highlight
    doc.save();
    doc.roundedRect(barX + 6, barY + 3, barW - 12, barH * 0.38, barR - 3)
       .fillColor('#FFFFFF').fillOpacity(0.30).fill();
    doc.fillOpacity(1);
    doc.restore();

    // 7. Glass edge border — subtle white
    doc.save();
    doc.roundedRect(barX, barY, barW, barH, barR)
       .strokeColor('#FFFFFF').strokeOpacity(0.45).lineWidth(0.7).stroke();
    doc.strokeOpacity(1);
    doc.restore();

    // 8. Outer subtle border
    doc.save();
    doc.roundedRect(barX, barY, barW, barH, barR)
       .strokeColor('#2563EB').strokeOpacity(0.20).lineWidth(0.3).stroke();
    doc.strokeOpacity(1);
    doc.restore();

    // 9. Capsule indicator — dynamic position based on score
    var pillScore = Math.max(0, Math.min(100, data.pillBarScore || 0));
    var capW = 15;
    var capH = 30;
    var capPad = 8;  // padding from edges
    var capTravel = barW - capW - (capPad * 2);  // usable travel distance
    var capX = barX + capPad + (pillScore / 100) * capTravel;
    var capY = barY - 15;
    var capR = capW / 2;

    // Capsule gradient fill
    doc.save();
    var capGrad = doc.linearGradient(capX, capY, capX, capY + capH);
    capGrad.stop(0, '#4FACFE').stop(0.5, '#2563EB').stop(1, '#1E3A8A');
    doc.roundedRect(capX, capY, capW, capH, capR);
    doc.fill(capGrad);
    doc.restore();

    // Capsule glass shimmer
    doc.save();
    doc.roundedRect(capX + 3, capY + 2, capW - 6, capH * 0.4, capR - 2)
       .fillColor('#FFFFFF').fillOpacity(0.35).fill();
    doc.fillOpacity(1);
    doc.restore();

    // Capsule border
    doc.save();
    doc.roundedRect(capX, capY, capW, capH, capR)
       .strokeColor('#FFFFFF').strokeOpacity(0.40).lineWidth(0.5).stroke();
    doc.strokeOpacity(1);
    doc.restore();

    // 10. Scale numbers below the bar
    if (data.pillBarScale) {
      var sc = data.pillBarScale;
      var scMin = sc.min !== undefined ? sc.min : 0;
      var scMax = sc.max !== undefined ? sc.max : 100;
      var scValue = sc.value !== undefined ? sc.value : null;
      var scUnit = sc.unit || '';
      var scSteps = sc.steps || 5;
      var scLabelY = barY + barH + 4;
      var scFontSize = 6.5;
      var scUsableLeft = barX + capPad + (capW / 2);
      var scUsableRight = barX + barW - capPad - (capW / 2);
      var scUsableW = scUsableRight - scUsableLeft;

      // Draw scale tick marks and numbers
      for (var si = 0; si <= scSteps; si++) {
        var fraction = si / scSteps;
        var scTickX = scUsableLeft + (fraction * scUsableW);
        var scLabelVal = scMin + (fraction * (scMax - scMin));
        var scLabel = scLabelVal % 1 === 0 ? String(Math.round(scLabelVal)) : scLabelVal.toFixed(1);

        // Tick mark
        doc.save();
        doc.moveTo(scTickX, barY + barH).lineTo(scTickX, barY + barH + 3)
           .strokeColor('#666666').strokeOpacity(0.6).lineWidth(0.5).stroke();
        doc.strokeOpacity(1);
        doc.restore();

        // Number label (centered on tick)
        doc.save();
        doc.font('Helvetica').fontSize(scFontSize).fillColor('#000000').fillOpacity(1);
        var scLabelW = doc.widthOfString(scLabel);
        doc.text(scLabel, scTickX - (scLabelW / 2), scLabelY, { lineBreak: false, width: 40 });
        doc.restore();
      }

      // 11. Value label above the capsule pointer
      if (scValue !== null && scValue !== 'Indeterminate' && typeof scValue === 'number' && isFinite(scValue)) {
        var valLabel = scValue % 1 === 0 ? String(Math.round(scValue)) : scValue.toFixed(2);
        if (scUnit) valLabel = valLabel + ' ' + scUnit;
        doc.save();
        doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#1E3A8A').fillOpacity(1);
        var valLabelW = doc.widthOfString(valLabel);
        var valLabelX = capX + (capW / 2) - (valLabelW / 2);
        valLabelX = Math.max(barX, Math.min(barX + barW - valLabelW, valLabelX));
        doc.text(valLabel, valLabelX, capY - 11, { lineBreak: false, width: 60 });
        doc.restore();
      }
    }

    descY = 135;
    contentGrpY = 210;
  }

  // ===== 2. DESCRIPTION =====
  var descFontSize = 10;
  var descLineGap = data.showPillBar ? 1.5 : 2;
  doc.save();
  doc.font(FONTS.regular).fontSize(descFontSize).fillColor('#000000')
     .text(data.description, 42, descY, { width: 512, align: 'center', lineGap: descLineGap });
  doc.restore();

  // ===== 3. MAIN CONTENT GROUP — dynamic layout =====
  var grpX = 42;
  var grpW = 512;
  var sectionX = grpX + 15;
  var sectionW = grpW - 30;

  // ===== SHARED DYNAMIC LAYOUT — fills page to footer =====
  var pageBottom = 800;  // footer bar starts at 800
  var cardGap = data.showPillBar ? 12 : 18;

  // Compute description height to place content below it
  doc.font(FONTS.regular).fontSize(descFontSize);
  var descH = doc.heightOfString(data.description, { width: 512, lineGap: descLineGap });
  var descToCardGap = data.showPillBar ? 18 : 12;
  if (data.title === 'FOCUS AND ATTENTION' || data.title === 'FOCUS & ATTENTION') descToCardGap = 8;
  if (data.title === 'STRESS') descToCardGap = 10;
  if (data.title === 'LEARNING') descToCardGap = 10;
  if (data.title === 'RELAXATION SCORE') descToCardGap = 8;
  if (data.title === 'AROUSAL SCORE') descToCardGap = 2;
  if (data.title === 'PEAK ALPHA') descToCardGap = 5;
  if (data.title === 'EXCESSIVE DELTA') descToCardGap = 5;
  var sec1Y = descY + descH + descToCardGap;

  // Card widths
  var highLeftW = 217, highRightW = 228, lowLeftW = 217, lowRightW = 228;
  if (data.title === 'EXCESSIVE DELTA') {
    highLeftW = 223; highRightW = 240;
    lowLeftW = 223; lowRightW = 240;
  } else if (data.title === 'PEAK ALPHA') {
    highLeftW = 217; highRightW = 230;
    lowLeftW = 217; lowRightW = 230;
  }

  // Font size 10 for all pages
  var cardOpts = null;

  // Dynamic card height calculation — measure actual content at font size 10
  function measureCardH(cardData, leftW_inner, rightW_inner) {
    var headerH = 52; // icon + title space
    var pad = 10;

    // Left side: paragraphs
    var leftH = headerH;
    for (var i = 0; i < cardData.paragraphs.length; i++) {
      doc.font(FONTS.regular).fontSize(10);
      leftH += doc.heightOfString(cardData.paragraphs[i], { width: leftW_inner - 20, lineGap: 2.5 }) + 6;
    }

    // Right side: implications
    var impData = cardData.implications || cardData.bullets || [];
    var rightH = headerH;
    for (var i = 0; i < impData.length; i++) {
      doc.font(FONTS.regular).fontSize(10);
      rightH += doc.heightOfString('\u2022  ' + impData[i], { width: rightW_inner - 24, lineGap: 2.5 }) + 5;
    }

    return Math.max(leftH, rightH) + pad;
  }

  // Measure How to Improve height at font size 10
  // Align How to Improve width with card frames (leftW + gap + rightW)
  var improveW = highLeftW + 40 + highRightW;

  function measureImproveH() {
    var titleH = 14;
    var bulletsH = 0;
    var bList = data.howToImprove || [];
    for (var i = 0; i < bList.length; i++) {
      doc.font(FONTS.regular).fontSize(10);
      bulletsH += doc.heightOfString('\u2022  ' + bList[i], { width: improveW - 90, lineGap: 1.5 }) + 2;
    }
    return titleH + bulletsH + 20;
  }

  // Calculate refs height
  var refsH = 0;
  if (data.references && data.references.length > 0) {
    for (var ri = 0; ri < data.references.length; ri++) {
      doc.font(FONTS.regular).fontSize(5);
      refsH += doc.heightOfString((ri + 1) + '. ' + data.references[ri], { width: improveW, lineGap: 1 }) + 1;
    }
    refsH += 4;
  }

  var highH, lowH, improveFH;

  if (data.showPillBar) {
    // Dynamic layout for sub-parameter pages (22-28) — font size 10, frames sized to content
    highH = measureCardH(data.highCognition, highLeftW, highRightW) + 20;
    lowH = measureCardH(data.lowCognition, lowLeftW, lowRightW) + 20;
    improveFH = measureImproveH() + 25;

    // AROUSAL SCORE: reduce improve frame, give more space to cards
    if (data.title === 'AROUSAL SCORE') {
      improveFH = measureImproveH() - 2;
      highH += 45;
      lowH += 50;
    }
    // RELAXATION SCORE: reduce improve frame size
    if (data.title === 'RELAXATION SCORE') {
      improveFH = measureImproveH() + 10;
    }
    // EXCESSIVE DELTA: reduce improve frame, increase card frames
    if (data.title === 'EXCESSIVE DELTA') {
      improveFH = measureImproveH() - 15;
      highH += 62;
      lowH += 62;
    }
    // PEAK ALPHA: reduce improve frame, increase card frames
    if (data.title === 'PEAK ALPHA') {
      improveFH = measureImproveH() - 15;
      highH += 30;
      lowH += 30;
    }
    // FOCUS AND ATTENTION (sub-param): reduce improve frame size
    if (data.title === 'FOCUS AND ATTENTION' || data.title === 'FOCUS & ATTENTION') {
      improveFH = measureImproveH() - 5;
    }

    // Ensure everything fits on page with proper gaps
    var totalNeeded = highH + lowH + improveFH + refsH + (cardGap * 3);
    var available = pageBottom - sec1Y;
    if (totalNeeded > available) {
      // Proportionally scale down card heights only, keep improve frame intact
      var cardsAvailable = available - improveFH - refsH - (cardGap * 3);
      var cardsTotal = highH + lowH;
      var scale = cardsAvailable / cardsTotal;
      highH = Math.floor(highH * scale);
      lowH = Math.floor(lowH * scale);
    }
  } else {
    // Existing tuned values for main parameter pages (9-21)
    highH = 232; lowH = 232;
    if (data.title === 'BURNOUT & FATIGUE' || data.title === 'BURNOUT AND FATIGUE' || data.title === 'BRAIN BURN OUT') {
      highH = 232; lowH = 230;
    } else if (data.title === 'FOCUS AND ATTENTION' || data.title === 'FOCUS & ATTENTION') {
      highH = 230; lowH = 230;
    }
    // improveFH will be calculated dynamically after improveY is known
    improveFH = 0; // placeholder — set below
  }

  drawCognitionCard(doc, sectionX, sec1Y, sectionW, highH, data.highCognition, FRAME_ICON1, FRAME_ICON3, highLeftW, highRightW, cardOpts);

  var actualCardGap = cardGap;
  if (data.title === 'CREATIVITY') actualCardGap = 18;
  else if (data.title === 'FOCUS AND ATTENTION' || data.title === 'FOCUS & ATTENTION') actualCardGap = 12;
  else if (data.title === 'STRESS') actualCardGap = 12;
  else if (data.title === 'REGENERATION AND REPAIR SCORE') actualCardGap = 14;
  var sec2Y = sec1Y + highH + actualCardGap;
  drawCognitionCard(doc, sectionX, sec2Y, sectionW, lowH, data.lowCognition, FRAME_ICON2, FRAME_ICON3, lowLeftW, lowRightW, cardOpts);

  // Position How to Improve — for showPillBar pages, center between cards bottom and footer area
  var improveY;
  if (data.showPillBar) {
    var naturalY = sec2Y + lowH + cardGap;
    if (data.title === 'AROUSAL SCORE') naturalY += 2;
    if (data.title === 'EXCESSIVE DELTA') naturalY += 8;
    improveY = naturalY;
  } else {
    // Main parameter pages (11,13,15,17,19,21): fill available space to footer
    improveY = sec2Y + lowH + 15; // gap after low card
    var refsSpace = (data.references && data.references.length > 0) ? 18 : 5;
    improveFH = pageBottom - improveY - refsSpace - 8; // 8px gap before footer
    if (improveFH < 110) improveFH = 110; // ensure minimum height
  }
  drawHowToImprove(doc, sectionX, improveY, improveW, data.howToImprove, improveFH);

  // References after How to Improve — bottom-aligned to touch footer at Y=800
  if (data.references && data.references.length > 0) {
    var refsX = sectionX;
    var refsW = improveW;
    var footerY = 800;

    // Calculate total references height
    var totalRefsH = 0;
    for (var ri = 0; ri < data.references.length; ri++) {
      var refText = (ri + 1) + '. ' + data.references[ri];
      doc.font(FONTS.regular).fontSize(5);
      totalRefsH += doc.heightOfString(refText, { width: refsW, lineGap: 1 }) + 1;
    }

    // Position refs so they end right at the footer
    var refsY = footerY - totalRefsH - 2;
    for (var ri = 0; ri < data.references.length; ri++) {
      var refText = (ri + 1) + '. ' + data.references[ri];
      doc.save();
      doc.font(FONTS.regular).fontSize(5).fillColor('#000000')
         .text(refText, refsX, refsY, { width: refsW, align: 'left', lineGap: 1 });
      var refH = doc.heightOfString(refText, { width: refsW, lineGap: 1 });
      doc.restore();
      refsY += refH + 1;
    }
  }

}

/**
 * Draw a glass frame card — R:13, Glass/mirror transparent effect
 */
function drawGlassFrame(doc, fx, fy, fw, fh) {
  var fR = 13;

  // Outer soft shadow — spread
  doc.save();
  doc.roundedRect(fx + 3, fy + 4, fw, fh, fR)
     .fillColor('#000000').fillOpacity(0.06).fill();
  doc.fillOpacity(1);
  doc.restore();

  // Middle shadow layer
  doc.save();
  doc.roundedRect(fx + 2, fy + 3, fw, fh, fR)
     .fillColor('#000000').fillOpacity(0.04).fill();
  doc.fillOpacity(1);
  doc.restore();

  // Inner shadow layer — tightest
  doc.save();
  doc.roundedRect(fx + 1, fy + 1, fw, fh, fR)
     .fillColor('#000000').fillOpacity(0.03).fill();
  doc.fillOpacity(1);
  doc.restore();

  // Base fill — solid white background
  doc.save();
  doc.roundedRect(fx, fy, fw, fh, fR)
     .fillColor('#FFFFFF').fillOpacity(1.0).fill();
  doc.fillOpacity(1);
  doc.restore();

  // Border — light gray for visible card edge
  doc.save();
  doc.roundedRect(fx, fy, fw, fh, fR)
     .strokeColor('#E0E0E0').strokeOpacity(1.0).lineWidth(0.8).stroke();
  doc.strokeOpacity(1);
  doc.restore();
}

/**
 * Draw a High/Low Cognition section — Figma style
 * Two glass frame cards (217x217) with arrow between
 */
function drawCognitionCard(doc, x, y, w, h, cardData, leftIconPath, rightIconPath, leftW, rightW, opts) {
  var gap = 40;
  var cardWLeft = leftW || Math.floor((w - gap) / 2);
  var cardWRight = rightW || Math.floor((w - gap) / 2);
  var cardH = h || 210;
  var leftX = x;
  var rightX = x + cardWLeft + gap;
  var gapCenter = leftX + cardWLeft + gap / 2;
  var cfs = (opts && opts.fontSize) || 10;
  var titleFs = (opts && opts.titleFontSize) || 10;
  var lineGap = (opts && opts.lineGap !== undefined) ? opts.lineGap : 2.5;
  var bulletGap = (opts && opts.bulletGap !== undefined) ? opts.bulletGap : 5;
  var paraGap = (opts && opts.paraGap !== undefined) ? opts.paraGap : 6;

  // --- LEFT GLASS FRAME ---
  drawGlassFrame(doc, leftX, y, cardWLeft, cardH);

  // Left icon — PNG image
  var iconCx = leftX + cardWLeft / 2;
  var iconCy = y + 20;
  var iconSize = 22;

  try {
    if (leftIconPath && fs.existsSync(leftIconPath)) {
      doc.image(leftIconPath, iconCx - iconSize / 2, iconCy - iconSize / 2, { width: iconSize, height: iconSize });
    }
  } catch (e) { /* skip */ }

  // Title
  doc.save();
  doc.font(FONTS.bold).fontSize(titleFs).fillColor('#000000')
     .text(cardData.title, leftX + 10, y + 36, { width: cardWLeft - 20, align: 'center' });
  doc.restore();

  // Description paragraphs
  var paraY = y + 52;
  for (var pi = 0; pi < cardData.paragraphs.length; pi++) {
    doc.save();
    doc.font(FONTS.regular).fontSize(cfs).fillColor('#000000')
       .text(cardData.paragraphs[pi], leftX + 10, paraY, { width: cardWLeft - 20, align: 'center', lineGap: lineGap });
    var pH = doc.heightOfString(cardData.paragraphs[pi], { width: cardWLeft - 20, lineGap: lineGap });
    doc.restore();
    paraY += pH + paraGap;
  }

  // --- TWO ARROWS: → on top, ← on bottom ---
  var arrowY = y + cardH / 2;
  var arrowColor = '#227AFF';
  var aL = 12;

  // Forward arrow → (top)
  doc.save();
  doc.moveTo(gapCenter - aL, arrowY - 6).lineTo(gapCenter + aL, arrowY - 6)
     .strokeColor(arrowColor).lineWidth(1.8).stroke();
  doc.moveTo(gapCenter + aL - 6, arrowY - 11).lineTo(gapCenter + aL, arrowY - 6).lineTo(gapCenter + aL - 6, arrowY - 1)
     .strokeColor(arrowColor).lineWidth(1.8).stroke();
  doc.restore();

  // Backward arrow ← (bottom)
  doc.save();
  doc.moveTo(gapCenter + aL, arrowY + 6).lineTo(gapCenter - aL, arrowY + 6)
     .strokeColor(arrowColor).lineWidth(1.8).stroke();
  doc.moveTo(gapCenter - aL + 6, arrowY + 1).lineTo(gapCenter - aL, arrowY + 6).lineTo(gapCenter - aL + 6, arrowY + 11)
     .strokeColor(arrowColor).lineWidth(1.8).stroke();
  doc.restore();

  // --- RIGHT GLASS FRAME ---
  drawGlassFrame(doc, rightX, y, cardWRight, cardH);

  // Right icon — PNG image
  var rIconCx = rightX + cardWRight / 2;
  var rIconCy = y + 20;

  try {
    if (rightIconPath && fs.existsSync(rightIconPath)) {
      doc.image(rightIconPath, rIconCx - iconSize / 2, rIconCy - iconSize / 2, { width: iconSize, height: iconSize });
    }
  } catch (e) { /* skip */ }

  // "Implications" title
  doc.save();
  doc.font(FONTS.bold).fontSize(titleFs).fillColor('#000000')
     .text('Implications', rightX + 10, y + 36, { width: cardWRight - 20, align: 'center' });
  doc.restore();

  // Implication bullet points
  var impData = cardData.implications || cardData.bullets || [];
  var bulletY = y + 52;
  for (var bi = 0; bi < impData.length; bi++) {
    doc.save();
    doc.font(FONTS.regular).fontSize(cfs).fillColor('#000000')
       .text('\u2022  ' + impData[bi], rightX + 12, bulletY, { width: cardWRight - 24, align: 'left', lineGap: lineGap });
    var bH = doc.heightOfString('\u2022  ' + impData[bi], { width: cardWRight - 24, lineGap: lineGap });
    doc.restore();
    bulletY += bH + bulletGap;
  }
}

/**
 * Draw "How to Improve" section — glass effect + centered text
 */
function drawHowToImprove(doc, x, y, w, bullets, customHeight, customFontSize) {
  var frameH = customHeight || 130;
  var bfs = customFontSize || 10;

  // How to Improve frame — simulated gradient (no linearGradient to avoid color state corruption)
  var fR = 13;
  // Soft shadow
  doc.save();
  doc.roundedRect(x + 3, y + 4, w, frameH, fR)
     .fillColor('#000000').fillOpacity(0.06).fill();
  doc.fillOpacity(1);
  doc.restore();
  doc.save();
  doc.roundedRect(x + 1, y + 1, w, frameH, fR)
     .fillColor('#000000').fillOpacity(0.03).fill();
  doc.fillOpacity(1);
  doc.restore();
  // Base fill — solid #D4D6FF
  doc.save();
  doc.roundedRect(x, y, w, frameH, fR).fillColor('#E8EAFF').fill();
  doc.restore();
  // Border — subtle
  doc.save();
  doc.roundedRect(x, y, w, frameH, fR)
     .strokeColor('#C8CAEF').strokeOpacity(0.5).lineWidth(0.6).stroke();
  doc.strokeOpacity(1);
  doc.restore();

  // Brain icon on left (Layer_8.png) — centered vertically
  var iconSize = 60;
  var iconX = x + 5;
  var iconY = y + frameH / 2 - iconSize / 2;

  try {
    var LAYER8_PATH = path.resolve(__dirname, '../../../public/assets/Layer_8.png');
    if (fs.existsSync(LAYER8_PATH)) {
      doc.image(LAYER8_PATH, iconX, iconY, { width: iconSize, height: iconSize });
    }
  } catch (e) { /* skip */ }

  // "How to Improve" title + bullets — vertically centered in frame
  var textX = x + 75;
  var textW = w - 90;

  // Calculate total content height first
  var titleH = 14;
  var totalBulletH = 0;
  for (var i = 0; i < bullets.length; i++) {
    doc.font(FONTS.regular).fontSize(10);
    totalBulletH += doc.heightOfString('\u2022  ' + bullets[i], { width: textW - 10, lineGap: 1.5 }) + 2;
  }
  var totalContentH = titleH + totalBulletH;
  var startY = totalContentH < frameH ? y + (frameH - totalContentH) / 2 : y + 6;

  // Title — same approach as card frames: FONTS.bold, 10, #000000
  doc.save();
  doc.font(FONTS.bold).fontSize(10).fillColor('#000000')
     .text('How to Improve', textX, startY, { width: textW, align: 'left' });
  doc.restore();

  // Bullet points — same approach as card frames: FONTS.regular, 10, #000000
  var bY = startY + titleH;
  for (var i = 0; i < bullets.length; i++) {
    doc.save();
    doc.font(FONTS.regular).fontSize(10).fillColor('#000000')
       .text('\u2022  ' + bullets[i], textX + 5, bY, { width: textW - 10, align: 'left', lineGap: 1.5 });
    var bH = doc.heightOfString('\u2022  ' + bullets[i], { width: textW - 10, lineGap: 1.5 });
    doc.restore();
    bY += bH + 2;
  }
}

module.exports = { generateCognitionPage, generateCognitionPage2 };
