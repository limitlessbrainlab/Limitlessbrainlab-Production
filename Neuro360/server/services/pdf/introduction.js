/**
 * Introduction Page Generator
 * Includes disclaimer, symptoms checklist, and EEG recording information
 */

const { COLORS, FONTS, LAYOUT, SYMPTOMS_CHECKLIST, startNewSection, addPageFooter } = require('./pdfStyles');

/**
 * Generate the introduction section
 */
function generateIntroduction(doc, patientData) {
  let yPos = startNewSection(doc, 'Introduction');

  // Page title
  doc.fontSize(FONTS.heading1)
     .fillColor(COLORS.primaryDark)
     .font(FONTS.bold)
     .text('Introduction', LAYOUT.margin.left, yPos);

  yPos += 40;

  // Disclaimer
  doc.fontSize(FONTS.heading3)
     .fillColor(COLORS.primary)
     .font(FONTS.bold)
     .text('Important Notice', LAYOUT.margin.left, yPos);

  yPos += 20;

  const disclaimer = 'This report is NOT a medical diagnosis. It provides quantitative analysis of brain wave activity recorded through electroencephalography (EEG). The information presented should be interpreted by qualified healthcare professionals in conjunction with clinical assessment and other diagnostic information. This analysis is for informational and research purposes only.';

  doc.fontSize(FONTS.small)
     .fillColor(COLORS.darkGray)
     .font(FONTS.italic)
     .text(disclaimer, LAYOUT.margin.left, yPos, {
       width: LAYOUT.contentWidth,
       align: 'justify',
       lineGap: 3
     });

  yPos += 90;

  // Symptoms Checklist
  doc.fontSize(FONTS.heading3)
     .fillColor(COLORS.primary)
     .font(FONTS.bold)
     .text('Patient-Reported Symptoms', LAYOUT.margin.left, yPos);

  yPos += 25;

  doc.fontSize(FONTS.small)
     .fillColor(COLORS.gray)
     .font(FONTS.regular)
     .text('Please indicate which symptoms you are currently experiencing:', LAYOUT.margin.left, yPos);

  yPos += 20;

  // Draw symptom checklist grid (3 columns)
  const checklistStartY = yPos;
  const checklistCols = 3;
  const colWidth = LAYOUT.contentWidth / checklistCols;
  const rowHeight = 25;

  const patientSymptoms = patientData.symptoms || [];

  SYMPTOMS_CHECKLIST.forEach((symptom, index) => {
    const col = index % checklistCols;
    const row = Math.floor(index / checklistCols);
    const x = LAYOUT.margin.left + (col * colWidth);
    const y = checklistStartY + (row * rowHeight);

    const isChecked = patientSymptoms.includes(symptom);

    // Checkbox
    const boxSize = 10;
    doc.save();
    doc.rect(x, y, boxSize, boxSize)
       .strokeColor(COLORS.gray)
       .lineWidth(1)
       .stroke();

    if (isChecked) {
      // Draw checkmark
      doc.fontSize(FONTS.small)
         .fillColor(COLORS.primary)
         .font(FONTS.bold)
         .text('✓', x + 1, y - 1);
    }
    doc.restore();

    // Label
    doc.fontSize(FONTS.small)
       .fillColor(isChecked ? COLORS.darkGray : COLORS.gray)
       .font(isChecked ? FONTS.bold : FONTS.regular)
       .text(symptom, x + boxSize + 8, y);
  });

  yPos = checklistStartY + (Math.ceil(SYMPTOMS_CHECKLIST.length / checklistCols) * rowHeight) + 30;

  // EEG Recording Information
  doc.fontSize(FONTS.heading3)
     .fillColor(COLORS.primary)
     .font(FONTS.bold)
     .text('About EEG Recording', LAYOUT.margin.left, yPos);

  yPos += 25;

  const eegInfo = 'Electroencephalography (EEG) measures electrical activity in the brain using electrodes placed on the scalp. This analysis used the International 10-20 system, a standardized electrode placement method that ensures consistent and reliable measurements across different recording sessions.';

  doc.fontSize(FONTS.body)
     .fillColor(COLORS.darkGray)
     .font(FONTS.regular)
     .text(eegInfo, LAYOUT.margin.left, yPos, {
       width: LAYOUT.contentWidth,
       align: 'justify',
       lineGap: 4
     });

  yPos += 70;

  // 10-20 Electrode System (simplified text description)
  doc.fontSize(FONTS.small)
     .fillColor(COLORS.gray)
     .font(FONTS.italic)
     .text('Recording performed using 19-channel EEG with the International 10-20 electrode system.',
           LAYOUT.margin.left, yPos, {
       width: LAYOUT.contentWidth,
       align: 'center'
     });

  yPos += 30;

  // Electrode positions
  const electrodeInfo = 'Electrode Locations: Fp1, Fp2 (frontal poles), F7, F3, Fz, F4, F8 (frontal), T3, C3, Cz, C4, T4 (central), T5, P3, Pz, P4, T6 (parietal), O1, O2 (occipital)';

  doc.fontSize(FONTS.tiny)
     .fillColor(COLORS.gray)
     .font(FONTS.regular)
     .text(electrodeInfo, LAYOUT.margin.left, yPos, {
       width: LAYOUT.contentWidth,
       align: 'center',
       lineGap: 3
     });

  yPos += 60;

  // Sample EEG Waveform description
  doc.fontSize(FONTS.small)
     .fillColor(COLORS.gray)
     .font(FONTS.italic)
     .text('Sample EEG waveforms represent brain electrical activity across different regions,',
           LAYOUT.margin.left, yPos, {
       width: LAYOUT.contentWidth,
       align: 'center'
     });

  yPos += 15;

  doc.fontSize(FONTS.small)
     .fillColor(COLORS.gray)
     .font(FONTS.italic)
     .text('recorded simultaneously from all 19 electrode sites.',
           LAYOUT.margin.left, yPos, {
       width: LAYOUT.contentWidth,
       align: 'center'
     });

  // Footer
  addPageFooter(doc);
}

module.exports = { generateIntroduction };
