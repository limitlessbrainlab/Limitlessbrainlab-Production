/**
 * Introduction Page Generator (Page 2)
 * Fully programmatic — no image assets fetched
 * Matches Figma design exactly: fonts, colors, spacing, alignment
 */

const { FONTS, LAYOUT, addPageHeader } = require('./pdfStyles');
const fs = require('fs');
const path = require('path');

// Brain watermark image path
const BRAIN_BG_PATH = path.resolve(__dirname, '../../../public/assets/Group (1).png');
// EEG signal illustration image
const EEG_SIGNAL_PATH = path.resolve(__dirname, '../../../public/assets/Group (2).png');

// Figma exact colors
const TITLE_BLUE = '#2563EB';   // Bright blue for titles (Figma)
const BODY_BLACK = '#000000';   // Black body text
const REF_GRAY = '#000000';     // Black for references

/**
 * Generate the Introduction page (Page 2)
 */
function generateIntroductionPage(doc) {
  // White background
  doc.rect(0, 0, LAYOUT.pageWidth, LAYOUT.pageHeight).fill('#FFFFFF');

  // Brain watermark — left half off-page, right half visible behind text
  // Image: 468x263 (ratio 1.78). At width=550, height≈309
  // Pushed far left so only right portion shows on page
  try {
    if (fs.existsSync(BRAIN_BG_PATH)) {
      doc.image(BRAIN_BG_PATH, -220, 230, { width: 460 });
      // Light white overlay to soften into watermark
      doc.save();
      doc.rect(0, 0, LAYOUT.pageWidth, LAYOUT.pageHeight)
         .fillOpacity(0.25)
         .fill('#FFFFFF');
      doc.fillOpacity(1);
      doc.restore();
    }
  } catch (e) {
    // Silently skip if image not found
  }

  // Logo top-right
  addPageHeader(doc);

  // ===== "INTRODUCTION" TITLE =====
  // Figma: Outfit Bold 24px, blue, left-aligned
  doc.fontSize(24)
     .font(FONTS.bold)
     .fillColor(TITLE_BLUE)
     .text('INTRODUCTION', 42, 75, { width: 450, lineBreak: false });

  // ===== PARAGRAPH 1 =====
  // Figma: ~10px regular, black, left-aligned (not justified)
  var yPos = 120;
  doc.fontSize(10)
     .font(FONTS.regular)
     .fillColor(BODY_BLACK)
     .text(
       'The qEEG report provided by NeuroSense EEG is intended for informational, educational, and wellness purposes only. It is designed to help individuals and neurofeedback professionals better understand brainwave patterns and to support decisions related to neurofeedback training for non-medical cognitive enhancement. This report is not intended to diagnose, treat, cure, mitigate, or prevent any medical condition, and it should not be used as a substitute for consultation with a licensed healthcare provider.',
       42, yPos, { width: 510, align: 'left', lineGap: 3.5 }
     );

  // ===== PARAGRAPH 2 =====
  yPos += 80;
  doc.fontSize(10)
     .font(FONTS.regular)
     .fillColor(BODY_BLACK)
     .text(
       'Users are encouraged to consult with a qualified healthcare provider regarding any medical concerns or before starting any new treatment or therapy. NeuroSense EEG\'s qEEG analysis application is not a replacement for the individualized care provided by medical professionals.',
       42, yPos, { width: 510, align: 'left', lineGap: 3.5 }
     );

  // ===== "EEG RECORDING" TITLE =====
  // Figma: Outfit Bold 24px, blue, left-aligned
  yPos += 65;
  doc.fontSize(24)
     .font(FONTS.bold)
     .fillColor(TITLE_BLUE)
     .text('EEG RECORDING', 42, yPos, { width: 450, lineBreak: false });

  // ===== EEG PARAGRAPH 1 =====
  yPos += 42;
  doc.fontSize(10)
     .font(FONTS.regular)
     .fillColor(BODY_BLACK)
     .text(
       'The 10-20 system is the internationally recognized method used for placing electrodes on the scalp during an EEG (Electroencephalogram) recording. It is named for the standardized distances between electrode positions, which are either 10% or 20% of the total front-to-back or right-to-left measurement of the head. This system ensures consistent and reproducible electrode placement, allowing for accurate brainwave measurement across individuals.',
       42, yPos, { width: 510, align: 'left', lineGap: 3.5 }
     );

  // ===== EEG PARAGRAPH 2 =====
  yPos += 72;
  doc.fontSize(10)
     .font(FONTS.regular)
     .fillColor(BODY_BLACK)
     .text(
       'Electrodes are positioned over specific areas of the brain, corresponding to functional regions like the frontal, temporal, parietal, and occipital lobes, helping clinicians and researchers capture electrical activity associated with various cognitive and neurological functions. The 10-20 system is widely used in clinical diagnostics and research to assess brain activity related to conditions such as epilepsy, sleep disorders, and other neurological disorders.',
       42, yPos, { width: 510, align: 'left', lineGap: 3.5 }
     );

  // ===== EEG SIGNAL ILLUSTRATION (Group (2).png) =====
  // Source image: 281x135px (ratio 2.08). Display large for clarity.
  yPos += 100;
  var imgWidth = 370;
  var imgHeight = 178; // 370 / 2.081
  var imgX = 35;
  try {
    if (fs.existsSync(EEG_SIGNAL_PATH)) {
      doc.image(EEG_SIGNAL_PATH, imgX, yPos, { width: imgWidth });
    }
  } catch (e) {
    // Silently skip if image not found
  }

  // Right side text — "A segment of raw EEG signal..."
  // Positioned to the right of image, vertically centered
  var textX = imgX + imgWidth + 10;
  var textBlockHeight = 48;
  var textY = yPos + (imgHeight - textBlockHeight) / 2;
  doc.fontSize(12)
     .font(FONTS.regular)
     .fillColor(BODY_BLACK)
     .text('A segment of raw EEG signal\nfrom the 19 electrode locations\nin the Eyes Closed condition.', textX, textY, { width: 155, lineGap: 5 });

  // ===== REFERENCES =====
  // Position references with enough gap from image and before footer (footer at ~800)
  var refsStartY = yPos + imgHeight + 45;
  drawReferences(doc, refsStartY);
}


/**
 * Draw academic references at bottom of page — Figma: small gray text
 */
function drawReferences(doc, startY) {
  var references = [
    'Arns, M., de Ridder, S., Strehl, U., Breteler, M., & Coenen, A. (2009). Efficacy of neurofeedback treatment in ADHD: The effects on inattention, impulsivity, and hyperactivity: A meta-analysis. Clinical EEG and Neuroscience, 40(3), 180-189. doi: 10.1177/155005940904000311 https://www.ncbi.nlm.nih.gov/pubmed/19715181.',
    'Micoulaud-Franchi, J-A., Geoffroy, P. A., Fond, G., Lopez, R., Bioulac, S., Philip, P. (2014). EEG neurofeedback treatments in children with ADHD: An update meta-analysis of randomized controlled trials. Frontiers in Human Neuroscience, 8(906), 1-7. doi: 10.3389/fnhum.2014.00906 https://www.ncbi.nlm.nih.gov/pubmed/25431555.',
    'Steiner, N. J., Frenette, E. C., Rene K. M., Brennan, R. T., & Perrin, E. C. (2014). In-school neurofeedback training for ADHD: Sustained improvements from a randomized control trial. Pediatrics, 133(3), 483-492. doi: 10.1542/peds.2013-2059. https://www.ncbi.nlm.nih.gov/pubmed/24534402.',
    'Wigton, N. L., & Krigbaum, G. (2015). Attention, executive function, behavior, and electrocortical function, significantly improved with 19-channel z-score neurofeedback in a clinical setting: A pilot study. Journal of Attention Disorders, [e-pub ahead of print]. doi: 10.1177/1087054715577135, https://www.ncbi.nlm.nih.gov/pubmed/25823743.',
    'Escolano, Carlos, and Javier Minguez. "EEG-Based Upper Alpha Neurofeedback Training Improves Working Memory Performance." IEEE Eplore, 2011, https://ieeexplore.ieee.org/abstract/document/6090651/.',
    'Gruzelier, John H. "EEG-Neurofeedback for Optimising Performance. III: A Review of Methodological and Theoretical Considerations." Neuroscience & Biobehavioral Reviews, Pergamon, 29 Mar. 2014, https://www.sciencedirect.com/science/article/abs/pii/S0149763414000700.',
    'Woeful, Benedikt, et al. "Neurofeedback Training of the Upper Alpha Frequency Band in EEG Improves Cognitive Performance." NeuroImage, Academic Press, 17 Sept. 2010, https://www.sciencedirect.com/science/article/abs/pii/S105381191001181X'
  ];

  doc.fontSize(5)
     .font(FONTS.regular)
     .fillColor(REF_GRAY);

  var refY = startY || 720;
  for (var i = 0; i < references.length; i++) {
    var text = (i + 1) + '. ' + references[i];
    doc.text(text, 30, refY, { width: 535, lineGap: 0.5 });
    refY += doc.heightOfString(text, { width: 535 }) + 1.5;
  }
}

module.exports = { generateIntroductionPage };
