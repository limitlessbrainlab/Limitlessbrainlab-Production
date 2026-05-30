/**
 * Brain Waves Profile Generator
 * Explains the different brain wave frequency bands
 */

const { COLORS, FONTS, LAYOUT, BRAIN_WAVES, startNewSection, addPageFooter, drawRoundedRect } = require('./pdfStyles');

/**
 * Generate the brain waves profile section
 */
function generateBrainWavesProfile(doc) {
  let yPos = startNewSection(doc, 'Brain Waves Profile');

  // Page title
  doc.fontSize(FONTS.heading1)
     .fillColor(COLORS.primaryDark)
     .font(FONTS.bold)
     .text('Understanding Brain Waves', LAYOUT.margin.left, yPos);

  yPos += 40;

  // Introduction
  const intro = 'Your brain produces electrical signals at different frequencies, known as brain waves. Each frequency band is associated with different mental states and cognitive functions. Understanding your brain wave patterns helps identify areas of strength and opportunities for improvement.';

  doc.fontSize(FONTS.body)
     .fillColor(COLORS.darkGray)
     .font(FONTS.regular)
     .text(intro, LAYOUT.margin.left, yPos, {
       width: LAYOUT.contentWidth,
       align: 'justify',
       lineGap: 4
     });

  yPos += 80;

  // Brain wave frequency bands
  const waves = [
    BRAIN_WAVES.delta,
    BRAIN_WAVES.theta,
    BRAIN_WAVES.alpha,
    BRAIN_WAVES.smr,
    BRAIN_WAVES.beta
  ];

  waves.forEach((wave, index) => {
    // Check if we need a new page
    if (yPos > LAYOUT.pageHeight - LAYOUT.margin.bottom - 100) {
      yPos = startNewSection(doc, 'Brain Waves Profile');
      yPos += 20;
    }

    drawBrainWaveCard(doc, wave, LAYOUT.margin.left, yPos);
    yPos += 95;
  });

  // Summary note
  yPos += 10;

  if (yPos > LAYOUT.pageHeight - LAYOUT.margin.bottom - 100) {
    yPos = startNewSection(doc, 'Brain Waves Profile');
  }

  const summary = 'A healthy brain shows appropriate levels of each frequency band depending on the state of consciousness and task being performed. The balance and distribution of these waves provide insights into cognitive function, emotional regulation, and overall brain health.';

  doc.fontSize(FONTS.small)
     .fillColor(COLORS.gray)
     .font(FONTS.italic)
     .text(summary, LAYOUT.margin.left, yPos, {
       width: LAYOUT.contentWidth,
       align: 'justify',
       lineGap: 4
     });

  // Footer
  addPageFooter(doc);
}

/**
 * Draw a brain wave information card
 */
function drawBrainWaveCard(doc, wave, x, y) {
  const cardWidth = LAYOUT.contentWidth;
  const cardHeight = 85;
  const colorBarWidth = 8;

  // Background
  drawRoundedRect(doc, x, y, cardWidth, cardHeight, 5, COLORS.veryLightGray);

  // Color bar on the left
  doc.save();
  doc.rect(x, y, colorBarWidth, cardHeight)
     .fillColor(wave.color)
     .fill();
  doc.restore();

  // Content
  const contentX = x + colorBarWidth + 15;
  let contentY = y + 15;

  // Name and range
  doc.fontSize(FONTS.heading3)
     .fillColor(wave.color)
     .font(FONTS.bold)
     .text(wave.name, contentX, contentY);

  const nameWidth = doc.widthOfString(wave.name);

  doc.fontSize(FONTS.body)
     .fillColor(COLORS.gray)
     .font(FONTS.regular)
     .text(` (${wave.range})`, contentX + nameWidth + 5, contentY + 2);

  contentY += 28;

  // Description
  doc.fontSize(FONTS.body)
     .fillColor(COLORS.darkGray)
     .font(FONTS.regular)
     .text(wave.description, contentX, contentY, {
       width: cardWidth - colorBarWidth - 30,
       lineGap: 3
     });
}

module.exports = { generateBrainWavesProfile };
