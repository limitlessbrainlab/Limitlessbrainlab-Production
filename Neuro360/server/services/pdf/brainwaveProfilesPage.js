/**
 * Brainwave Profiles Page Generator (Page 4)
 * Clinical photo at top with blue tint, title+description section,
 * three-column layout with vertical blue line dividers
 */

const { FONTS, LAYOUT, addPageHeader } = require('./pdfStyles');
const fs = require('fs');
const path = require('path');

// Brain watermark image — same as Page 2/3 (top-left decorative)
const BRAIN_BG_PATH = path.resolve(__dirname, '../../../public/assets/Group (1).png');
// Page 4 top image
const PAGE4_IMG = path.resolve(__dirname, '../../../public/assets/Imagepage4.png');

// Colors matching Figma design
const BLUE = '#2563EB';
const DARK_TEXT = '#000000';
const BODY_GRAY = '#000000';
const BLUE_TINT = '#227aff';

// Brainwave content data
const BRAINWAVES = [
  {
    title: 'Beta Waves',
    frequency: '13-30Hz',
    sections: [
      { heading: 'Role:', points: ['Support logical thinking and decision-making', 'Task-oriented focus and alertness', 'Managing daily responsibilities'] },
      { heading: 'When Balanced:', points: ['Enhanced focus and productivity', 'Clear thinking and mental clarity', 'Effective problem-solving'] },
      { heading: 'When Excessive:', points: ['Stress and anxiety symptoms', 'Cognitive exhaustion', 'Difficulty relaxing'] }
    ]
  },
  {
    title: 'Alpha Waves',
    frequency: '8-12Hz',
    sections: [
      { heading: 'Role:', points: ['Facilitate relaxation and calm', 'Emotional stability and clarity', 'Bridge between focus and rest'] },
      { heading: 'When Balanced:', points: ['Emotional resilience', 'Mindfulness and presence', 'Stress recovery ability'] },
      { heading: 'When Excessive:', points: ['Emotional reactivity', 'Restlessness and agitation', 'Difficulty unwinding'] }
    ]
  },
  {
    title: 'Theta Waves',
    frequency: '4-7Hz',
    sections: [
      { heading: 'Role:', points: ['Drive creativity and intuition', 'Deep relaxation states', 'Subconscious processing'] },
      { heading: 'When Balanced:', points: ['Enhanced creativity', 'Emotional processing', 'Restorative mental states'] },
      { heading: 'When Excessive:', points: ['Excessive daydreaming', 'Mental fog and confusion', 'Difficulty maintaining focus'] }
    ]
  }
];

/**
 * Generate the Brainwave Profiles page (Page 4)
 */
function generateBrainwaveProfilesPage(doc) {
  var pw = LAYOUT.pageWidth;   // 595.28
  var ph = LAYOUT.pageHeight;  // 841.89

  // White background
  doc.rect(0, 0, pw, ph).fill('#FFFFFF');

  // Brain watermark as page background (top-left decorative)
  try {
    if (fs.existsSync(BRAIN_BG_PATH)) {
      doc.save();
      doc.opacity(0.55);
      doc.image(BRAIN_BG_PATH, -100, 200, { width: 400 });
      doc.opacity(1);
      doc.restore();
    }
  } catch (e) {
    // Silently skip
  }

  // ===== 1. TOP IMAGE PLACEHOLDER — Figma exact: X:30, Y:18, W:483, H:166, Mixed radius =====
  var phX = 30;
  var phY = 18;
  var phW = 483;
  var phH = 166;

  // COMPOSITE approach — MIXED corner radius (different per corner)
  var rTL = 50;   // top-left
  var rTR = 0;   // top-right
  var rBR = 50;   // bottom-right
  var rBL = 0;   // bottom-left
  var fillColor = '#D9D9D9';

  // Corner circle centers
  var cTL = { x: phX + rTL, y: phY + rTL };
  var cTR = { x: phX + phW - rTR, y: phY + rTR };
  var cBR = { x: phX + phW - rBR, y: phY + phH - rBR };
  var cBL = { x: phX + rBL, y: phY + phH - rBL };

  // Helper: draw mixed-radius shape using composite fills
  function fillMixedShape(color, opacity) {
    doc.save();
    if (opacity) doc.fillOpacity(opacity);
    // 4 corner circles (different sizes)
    doc.circle(cTL.x, cTL.y, rTL).fill(color);
    doc.circle(cTR.x, cTR.y, rTR).fill(color);
    doc.circle(cBR.x, cBR.y, rBR).fill(color);
    doc.circle(cBL.x, cBL.y, rBL).fill(color);
    // Top strip (between top circles)
    doc.rect(cTL.x, phY, cTR.x - cTL.x, Math.max(rTL, rTR)).fill(color);
    // Bottom strip (between bottom circles)
    doc.rect(cBL.x, phY + phH - Math.max(rBL, rBR), cBR.x - cBL.x, Math.max(rBL, rBR)).fill(color);
    // Center body (full height minus corners, full width)
    var topMax = Math.max(rTL, rTR);
    var botMax = Math.max(rBL, rBR);
    doc.rect(phX, phY + topMax, phW, phH - topMax - botMax).fill(color);
    // Left strip
    doc.rect(phX, cTL.y, Math.max(rTL, rBL), cBL.y - cTL.y).fill(color);
    // Right strip
    doc.rect(phX + phW - Math.max(rTR, rBR), cTR.y, Math.max(rTR, rBR), cBR.y - cTR.y).fill(color);
    if (opacity) doc.fillOpacity(1);
    doc.restore();
  }

  // Solid fill — #D9D9D9 at 100% (no overlay)
  fillMixedShape(fillColor);

  // Imagepage4.png clipped inside the placeholder shape
  var kTL = rTL * 0.5523, kTR = rTR * 0.5523, kBR = rBR * 0.5523, kBL = rBL * 0.5523;
  try {
    if (fs.existsSync(PAGE4_IMG)) {
      doc.save();
      doc.moveTo(cTL.x, phY).lineTo(cTR.x, phY)
         .bezierCurveTo(cTR.x + kTR, phY, phX + phW, cTR.y - kTR, phX + phW, cTR.y)
         .lineTo(phX + phW, cBR.y)
         .bezierCurveTo(phX + phW, cBR.y + kBR, cBR.x + kBR, phY + phH, cBR.x, phY + phH)
         .lineTo(cBL.x, phY + phH)
         .bezierCurveTo(cBL.x - kBL, phY + phH, phX, cBL.y + kBL, phX, cBL.y)
         .lineTo(phX, cTL.y)
         .bezierCurveTo(phX, cTL.y - kTL, cTL.x - kTL, phY, cTL.x, phY)
         .closePath().clip();
      doc.image(PAGE4_IMG, phX, phY, { width: phW, height: phH, cover: [phW, phH] });
      doc.restore();
    }
  } catch (e) {
    // Silently skip
  }

  // Logo top-right — removed per request
  // addPageHeader(doc);

  // ===== 2. TITLE + DESCRIPTION SECTION — Figma: X:30, Y:205, W:535, H:112 =====
  var sectionX = 30;
  var sectionY = 205;
  var sectionW = 535;
  var sectionH = 112;
  var titleY = sectionY + 8;

  // Left: "Brainwave\nProfiles" — large bold blue, font size 24
  doc.save();
  doc.fontSize(24)
     .font(FONTS.bold)
     .fillColor(BLUE)
     .text('Brainwave', sectionX + 12, titleY, { lineBreak: false });
  doc.fontSize(24)
     .font(FONTS.bold)
     .fillColor(BLUE)
     .text('Profiles', sectionX + 12, titleY + 28, { lineBreak: false });
  doc.restore();

  // Right: description paragraph — font size 10
  doc.save();
  doc.fontSize(10)
     .font(FONTS.regular)
     .fillColor('#00000D')
     .text(
       'Brainwaves are the electrical impulses generated by the brain, reflecting its activity and various mental and emotional states.',
       190, 210,
       { width: 370, align: 'left', lineGap: 5 }
     );
  doc.restore();

  // ===== 3. SECTION HEADING — Figma: X:135, Y:295, W:324, H:22, Outfit Medium 18px, 120% LH, -1% LS =====
  // "Description of Common " (dark) + "Brainwave Types" (#227AFF)
  var headText1 = 'Description of Common ';
  var headText2 = 'Brainwave Types';
  var headFS = 18;
  var headingY = 295;

  // Measure widths to center the combined text
  doc.font(FONTS.regular).fontSize(headFS);
  var w1 = doc.widthOfString(headText1, { characterSpacing: -0.18 });
  var w2 = doc.widthOfString(headText2, { characterSpacing: -0.18 });
  var totalW = w1 + w2;
  var headStartX = (pw - totalW) / 2;

  doc.save();
  doc.font(FONTS.regular).fontSize(headFS)
     .fillColor(DARK_TEXT)
     .text(headText1, headStartX, headingY, { lineBreak: false, characterSpacing: -0.18 });
  doc.restore();

  // "Brainwave Types" with linear gradient: #FF22DA (0%) → #4DC4FF (100%)
  // PDFKit can't do gradient text natively, so we simulate with multiple colored segments
  var gradX = headStartX + w1;
  var chars = headText2.split('');
  var totalChars = chars.length;
  var curX = gradX;
  doc.font(FONTS.regular).fontSize(headFS);
  // Pre-calculate each character width (no extra spacing)
  var charWidths = chars.map(function(ch) {
    return doc.widthOfString(ch);
  });
  // Total raw width vs target width with -1% letter spacing
  var rawTotal = charWidths.reduce(function(a, b) { return a + b; }, 0);
  var letterSpacing = -0.18;
  var targetTotal = rawTotal + letterSpacing * (totalChars - 1);
  for (var gi = 0; gi < totalChars; gi++) {
    var t = gi / (totalChars - 1);  // 0 to 1
    // Interpolate #FF22DA → #4DC4FF
    var r = Math.round(255 + t * (77 - 255));
    var g = Math.round(34 + t * (196 - 34));
    var b = Math.round(218 + t * (255 - 218));
    var hexColor = '#' + r.toString(16).padStart(2, '0') + g.toString(16).padStart(2, '0') + b.toString(16).padStart(2, '0');
    doc.save();
    doc.font(FONTS.regular).fontSize(headFS)
       .fillColor(hexColor)
       .text(chars[gi], curX, headingY, { lineBreak: false });
    doc.restore();
    curX += charWidths[gi] + letterSpacing;
  }

  // ===== 4. THREE COLUMN CARDS — Figma: X:25, Y:353, W:544, H:352, gap:8, #FFFFFF 25% =====
  var gridX = 25;
  var gridY = 353;
  var gridW = 544;
  var gridH = 352;
  var colGap = 8;
  var colW = (gridW - 2 * colGap) / 3;  // ~176
  var cardRadius = 8;
  var internalGap = 18;

  // Draw each column card
  BRAINWAVES.forEach(function(wave, idx) {
    var cx = gridX + idx * (colW + colGap);

    // Outer glow
    doc.save();
    doc.roundedRect(cx - 3, gridY - 3, colW + 6, gridH + 6, cardRadius + 2)
       .fillColor('#A8C8FF').fillOpacity(0.12).fill();
    doc.fillOpacity(1);
    doc.restore();

    // Drop shadow
    doc.save();
    doc.roundedRect(cx + 2, gridY + 3, colW, gridH, cardRadius)
       .fillColor('#000000').fillOpacity(0.05).fill();
    doc.fillOpacity(1);
    doc.restore();

    // Card fill — Figma: #FFFFFF at 25%
    doc.save();
    doc.roundedRect(cx, gridY, colW, gridH, cardRadius)
       .fillColor('#FFFFFF').fillOpacity(0.25).fill();
    doc.fillOpacity(1);
    doc.restore();

    // Glass effect — Figma: Glass backdrop
    doc.save();
    doc.roundedRect(cx, gridY, colW, gridH, cardRadius)
       .fillColor('#FFFFFF').fillOpacity(0.18).fill();
    doc.fillOpacity(1);
    doc.restore();

    // Glass highlight — top portion
    doc.save();
    doc.roundedRect(cx + 2, gridY + 2, colW - 4, gridH * 0.25, cardRadius)
       .fillColor('#FFFFFF').fillOpacity(0.10).fill();
    doc.fillOpacity(1);
    doc.restore();

    // Glass edge border
    doc.save();
    doc.roundedRect(cx, gridY, colW, gridH, cardRadius)
       .strokeColor('#FFFFFF').strokeOpacity(0.35).lineWidth(0.7).stroke();
    doc.strokeOpacity(1);
    doc.restore();

    // Heading — Figma: X:42 (relative), Y:17, W:93, H:46, Outfit Regular 16px, LH:22.6, #010101
    var headX = cx + 42;
    var headY = gridY + 17;
    doc.save();
    doc.font(FONTS.regular).fontSize(16).fillColor('#010101')
       .text(wave.title, cx, headY, { width: colW, align: 'center', lineGap: 6.6 });
    doc.restore();

    doc.save();
    doc.font(FONTS.regular).fontSize(16).fillColor('#010101')
       .text(wave.frequency, cx, headY + 22.6, { width: colW, align: 'center', lineGap: 6.6 });
    doc.restore();

    // Text block — Figma: X:-1, Y:81 (relative), W:178, H:254, Mixed, 150% LH, #000000
    var textBlockY = gridY + 81;
    var textW = colW;
    var textX = cx - 1;

    // Sections: Role, When Balanced, When Excessive
    py = textBlockY;
    wave.sections.forEach(function(section) {
      // Section heading — bold, Figma: Outfit Mixed 10px
      doc.save();
      doc.font(FONTS.bold).fontSize(10).fillColor('#000000')
         .text(section.heading, textX, py, { width: textW, align: 'center', lineGap: 5 });
      doc.restore();
      py += 15;

      // Body text points — regular, Figma: Outfit Mixed 10px, 150% LH
      section.points.forEach(function(point) {
        doc.save();
        doc.font(FONTS.regular).fontSize(10).fillColor('#000000')
           .text(point, textX, py, { width: textW, align: 'center', lineGap: 5 });
        var textH = doc.heightOfString(point, { width: textW, fontSize: 10, lineGap: 5 });
        doc.restore();
        py += textH + 1;
      });

      py += 8; // gap between sections
    });
  });
}

module.exports = { generateBrainwaveProfilesPage };
