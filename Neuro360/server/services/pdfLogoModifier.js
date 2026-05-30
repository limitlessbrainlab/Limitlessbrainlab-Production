/**
 * PDF Logo Modifier Service
 * Replaces EEG machine logo with NeuroSense logo in uploaded PDFs
 */

const { PDFDocument, rgb } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

// NeuroSense logo path
const NEUROSENSE_LOGO_PATH = path.resolve(__dirname, '../../public/NeuroSense_Version_7_White_BG-removebg-preview.png');

/**
 * Replace EEG logo with NeuroSense logo on all pages of a PDF
 * @param {string} inputPdfPath - Path to the input PDF file
 * @param {string} outputPdfPath - Optional output path (defaults to temp file)
 * @returns {Promise<string>} - Path to the modified PDF
 */
async function replaceLogo(inputPdfPath, outputPdfPath = null) {
  console.log('🔄 Starting logo replacement for:', inputPdfPath);

  try {
    // Read the input PDF
    const pdfBytes = fs.readFileSync(inputPdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });

    // Embed the NeuroSense logo
    let logoImage = null;
    if (fs.existsSync(NEUROSENSE_LOGO_PATH)) {
      const logoBytes = fs.readFileSync(NEUROSENSE_LOGO_PATH);
      logoImage = await pdfDoc.embedPng(logoBytes);
      console.log('   ✅ NeuroSense logo embedded successfully');
    } else {
      console.warn('   ⚠️ NeuroSense logo not found at:', NEUROSENSE_LOGO_PATH);
    }

    // Get all pages
    const pages = pdfDoc.getPages();
    console.log(`   📄 Processing ${pages.length} pages...`);

    // Process each page
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const { width, height } = page.getSize();

      console.log(`   Page ${i + 1}: Size ${width}x${height}`);

      // Cover ONLY the qEEGpro logo in the top-right corner
      // Page 1 has larger S.A.R.A + qEEGpro logo, other pages have smaller qEEGpro logo
      const isFirstPage = (i === 0);
      const coverWidth = isFirstPage ? 280 : 180;
      const coverHeight = isFirstPage ? 120 : 80;
      page.drawRectangle({
        x: width - coverWidth,
        y: height - coverHeight,
        width: coverWidth,
        height: coverHeight,
        color: rgb(1, 1, 1), // White
      });

      console.log(`   Page ${i + 1}: Covered qEEGpro logo area (top-right ${coverWidth}x${coverHeight})`);

      // Draw NeuroSense logo on top of the white rectangle
      if (logoImage) {
        const logoDims = logoImage.scale(1);
        // Scale logo to fit in the covered area
        const maxLogoWidth = isFirstPage ? 250 : 160;
        const maxLogoHeight = isFirstPage ? 110 : 70;
        const scale = Math.min(maxLogoWidth / logoDims.width, maxLogoHeight / logoDims.height);
        const drawWidth = logoDims.width * scale;
        const drawHeight = logoDims.height * scale;

        // Position logo in the top-right corner with small padding
        const padding = 5;
        const logoX = width - drawWidth - padding;
        const logoY = height - drawHeight - padding;

        page.drawImage(logoImage, {
          x: logoX,
          y: logoY,
          width: drawWidth,
          height: drawHeight,
        });

        console.log(`   Page ${i + 1}: NeuroSense logo drawn (${Math.round(drawWidth)}x${Math.round(drawHeight)})`);
      }
    }

    // Generate output path if not provided
    if (!outputPdfPath) {
      const inputDir = path.dirname(inputPdfPath);
      const inputBasename = path.basename(inputPdfPath, '.pdf');
      outputPdfPath = path.join(inputDir, `${inputBasename}_modified.pdf`);
    }

    // Save the modified PDF
    const modifiedPdfBytes = await pdfDoc.save();
    fs.writeFileSync(outputPdfPath, modifiedPdfBytes);

    console.log(`   ✅ Logo replaced successfully. Output: ${outputPdfPath}`);
    return outputPdfPath;

  } catch (error) {
    console.error('   ❌ Error replacing logo:', error.message);
    // Return original path if modification fails (fallback)
    console.log('   ⚠️ Falling back to original PDF');
    return inputPdfPath;
  }
}

/**
 * Replace logo and overwrite the original file
 * @param {string} pdfPath - Path to the PDF file to modify in place
 * @returns {Promise<boolean>} - Success status
 */
async function replaceLogoInPlace(pdfPath) {
  console.log('🔄 Replacing logo in place for:', pdfPath);

  try {
    // Create temp output path
    const tempOutputPath = pdfPath.replace('.pdf', '_temp_modified.pdf');

    // Replace logo
    const modifiedPath = await replaceLogo(pdfPath, tempOutputPath);

    // If modification was successful (not fallback), replace original
    if (modifiedPath !== pdfPath && fs.existsSync(modifiedPath)) {
      // Delete original
      fs.unlinkSync(pdfPath);
      // Rename modified to original name
      fs.renameSync(modifiedPath, pdfPath);
      console.log('   ✅ Original PDF replaced with modified version');
      return true;
    }

    return false;
  } catch (error) {
    console.error('   ❌ Error in replaceLogoInPlace:', error.message);
    return false;
  }
}

/**
 * Clean up temporary modified PDF files
 * @param {string} modifiedPdfPath - Path to the modified PDF to delete
 */
function cleanupModifiedPdf(modifiedPdfPath) {
  try {
    if (modifiedPdfPath && fs.existsSync(modifiedPdfPath) && modifiedPdfPath.includes('_modified')) {
      fs.unlinkSync(modifiedPdfPath);
      console.log('   🧹 Cleaned up temp modified PDF:', modifiedPdfPath);
    }
  } catch (error) {
    console.error('   ⚠️ Error cleaning up modified PDF:', error.message);
  }
}

module.exports = {
  replaceLogo,
  replaceLogoInPlace,
  cleanupModifiedPdf,
  NEUROSENSE_LOGO_PATH
};
