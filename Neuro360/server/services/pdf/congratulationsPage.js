/**
 * Congratulations Page Generator (Page 3)
 * Page3.png as background + programmatic Contents frame with 4 cards
 * Figma: Contents frame at x:51, y:206, W:493, H:532, radius:25
 */

const { FONTS, LAYOUT } = require('./pdfStyles');
const fs = require('fs');
const path = require('path');

const PAGE3_IMG = path.resolve(__dirname, '../../../public/assets/Page3.png');

// Icon images for each card (3x resolution: 276x276 px)
var ICON_IMAGES = [
  path.resolve(__dirname, '../../../public/assets/Frame3.png'),    // Brain icon
  path.resolve(__dirname, '../../../public/assets/Frame4.png'),    // Clock icon
  path.resolve(__dirname, '../../../public/assets/Frame1.png'),    // Brain waves icon
  path.resolve(__dirname, '../../../public/assets/Frame2.png')     // Scales icon
];

// Card text content
var CARD_TEXTS = [
  'Every individual has unique cognitive and emotional patterns. Understanding brainwave activity allows for the creation of personalized self-care routines, relaxation techniques, and mental well-being practices that align with an individual\'s natural tendencies.',
  'Recognizing early signs of stress, emotional imbalance, or cognitive exhaustion helps prevent long-term mental health struggles. Timely interventions can build resilience, improve emotional intelligence, and enhance overall quality of life.',
  'By identifying dominant brainwave patterns-such as theta waves for relaxation or beta waves for high alertness-individuals can optimize mental clarity, productivity, and emotional balance.',
  'Balanced brain activity is crucial for long-term mental and physical health. Developing stability and adaptability helps individuals navigate personal and professional challenges with confidence and emotional control.'
];

// ============== CARD ==============

function drawCard(doc, cardX, cardY, cardW, cardH, text, iconImgPath) {
  // Icon position
  var iconSize = 92;
  var iconX = cardX + 13;
  var iconY = cardY + (cardH - iconSize) / 2;
  var iconCx = iconX + iconSize / 2;
  var iconCy = iconY + iconSize / 2;
  var iconR = iconSize / 2 + 2;

  // Outer glow
  doc.save();
  doc.roundedRect(cardX - 4, cardY - 4, cardW + 8, cardH + 8, 12)
     .fillColor('#A8C8FF').fillOpacity(0.12).fill();
  doc.fillOpacity(1);
  doc.restore();

  // Drop shadow
  doc.save();
  doc.roundedRect(cardX - 2, cardY - 2, cardW + 4, cardH + 4, 11)
     .fillColor('#000000').fillOpacity(0.03).fill();
  doc.fillOpacity(1); doc.restore();

  doc.save();
  doc.roundedRect(cardX - 1, cardY - 1, cardW + 2, cardH + 2, 10)
     .fillColor('#000000').fillOpacity(0.05).fill();
  doc.fillOpacity(1); doc.restore();

  // Card fill: transparent glass white
  doc.save();
  doc.roundedRect(cardX, cardY, cardW, cardH, 9)
     .fillColor('#FFFFFF').fillOpacity(0.35).fill();
  doc.fillOpacity(1);
  doc.restore();

  // Frost layer
  doc.save();
  doc.roundedRect(cardX, cardY, cardW, cardH, 9)
     .fillColor('#FFFFFF').fillOpacity(0.15).fill();
  doc.fillOpacity(1);
  doc.restore();

  // Light highlight -45°
  doc.save();
  var hlW = cardW * 0.5;
  var hlH = cardH * 0.4;
  doc.roundedRect(cardX + 2, cardY + 2, hlW, hlH, 8)
     .fillColor('#FFFFFF').fillOpacity(0.08).fill();
  doc.fillOpacity(1);
  doc.restore();

  // Glass edge border
  doc.save();
  doc.roundedRect(cardX, cardY, cardW, cardH, 9)
     .strokeColor('#FFFFFF').strokeOpacity(0.30).lineWidth(0.6).stroke();
  doc.strokeOpacity(1);
  doc.restore();

  // Solid white circle behind icon — gives clean base for PNG transparency
  doc.save();
  doc.circle(iconCx, iconCy, iconSize / 2)
     .fill('#FFFFFF');
  doc.restore();

  // Icon image on clean white base
  try {
    if (fs.existsSync(iconImgPath)) {
      doc.image(iconImgPath, iconX, iconY, { width: iconSize, height: iconSize });
    }
  } catch (e) {
    doc.save();
    doc.circle(iconCx, iconCy, iconSize / 2)
       .fillColor('#227aff').fillOpacity(0.20).fill();
    doc.fillOpacity(1);
    doc.restore();
  }

  // Text — Figma: X:130, Y:21 (relative to card), W:328, H:90, Outfit Regular 12px, 150% LH, #000000
  var textX = cardX + 130;
  var textY = cardY + 21;
  var textW = 328;
  doc.save();
  doc.fontSize(12).font(FONTS.regular).fillColor('#000000')
     .text(text, textX, textY, { width: textW, align: 'left', lineGap: 6 });
  doc.restore();
}

// ============== MAIN ==============

function generateCongratulationsPage(doc) {
  // 1. Page3.png as full background (gradient, title, logo all from image)
  try {
    if (fs.existsSync(PAGE3_IMG)) {
      doc.image(PAGE3_IMG, 0, 0, {
        width: LAYOUT.pageWidth,
        height: LAYOUT.pageHeight
      });
    }
  } catch (e) {
    doc.rect(0, 0, LAYOUT.pageWidth, LAYOUT.pageHeight).fill('#FFFFFF');
  }

  // 2. Title: Figma — x:64, y:83, W:468, H:99
  // Outfit Bold 30px, line-height 110% (lineGap=3), letter-spacing -2% (-0.6), center
  // Fill: Linear gradient (white→blue) — PDFKit: use white
  doc.save();
  doc.fontSize(30)
     .font(FONTS.bold)
     .fillColor('#FFFFFF')
     .text(
       'Congratulations On Getting Your Personalized Brain and Mental Well-Being Report',
       64, 83,
       { width: 468, align: 'center', lineGap: 3, characterSpacing: -0.6 }
     );
  doc.restore();

  // 3. Contents frame: x:51, y:206, W:493, H:532, radius:25
  var frameX = 58;
  var frameY = 210;
  var frameW = 493;
  var frameH = 510;
  var cardH = 124;
  var gap = (frameH - 4 * cardH) / 3;

  // Draw 4 cards inside frame
  for (var i = 0; i < 4; i++) {
    var cardY = frameY + i * (cardH + gap);
    drawCard(doc, frameX, cardY, frameW, cardH, CARD_TEXTS[i], ICON_IMAGES[i]);
  }
}

module.exports = { generateCongratulationsPage };
