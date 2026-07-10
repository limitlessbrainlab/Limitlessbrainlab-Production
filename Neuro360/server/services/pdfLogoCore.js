/**
 * PDF Logo Core — shared logo-replacement logic.
 *
 * Used by BOTH the worker thread (fast path, off the event loop) and the in-process inline
 * fallback in pdfLogoModifier.js, so the logo swap always runs the exact same way.
 */

const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb } = require('pdf-lib');

/**
 * Resolve the NeuroSense logo PNG from several candidate locations so a deploy rootDir
 * (the production backend uses rootDir = Neuro360/server) can never hide the asset that
 * lives outside it. Returns an absolute path, or null if none exist (logged loudly).
 */
function resolveLogoPath() {
  const candidates = [
    process.env.NEUROSENSE_LOGO_PATH,
    path.resolve(__dirname, '../assets/neurosense-logo.png'),                                   // deployed subtree (server/assets) — always present
    path.resolve(__dirname, '../../public/NeuroSense_Version_7_White_BG-removebg-preview.png'), // repo public/ (full-repo clone)
    path.resolve(process.cwd(), 'assets/neurosense-logo.png'),
    path.resolve(process.cwd(), 'server/assets/neurosense-logo.png'),
  ].filter(Boolean);

  for (const p of candidates) {
    try { if (fs.existsSync(p)) return p; } catch { /* ignore */ }
  }
  console.error('[pdfLogo] ⚠️ NeuroSense logo asset NOT FOUND. Tried:\n  ' + candidates.join('\n  '));
  return null;
}

/**
 * Draw the NeuroSense logo over the qEEGpro / S.A.R.A machine logo (top-right corner) on
 * every page and write the result to outputPdfPath.
 *
 * Returns { outputPdfPath, logoApplied }. `logoApplied` is false when the logo asset could
 * not be found — in that case the original page is left untouched (we never erase the old
 * logo with a blank white box when we have nothing to stamp in its place).
 *
 * @param {string} inputPdfPath
 * @param {string} outputPdfPath
 * @returns {Promise<{outputPdfPath: string, logoApplied: boolean}>}
 */
async function applyLogoToPdf(inputPdfPath, outputPdfPath) {
  const pdfBytes = fs.readFileSync(inputPdfPath);
  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true, updateMetadata: false });

  const logoPath = resolveLogoPath();
  const logoImage = logoPath ? await pdfDoc.embedPng(fs.readFileSync(logoPath)) : null;

  if (logoImage) {
    const logoDims = logoImage.scale(1);
    const pages = pdfDoc.getPages();
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const { width, height } = page.getSize();

      // Page 1 has the larger S.A.R.A + qEEGpro logo; other pages have a smaller qEEGpro logo.
      const isFirstPage = (i === 0);
      const coverWidth = isFirstPage ? 280 : 180;
      const coverHeight = isFirstPage ? 120 : 80;

      // Cover the machine logo with white, then stamp the NeuroSense logo over it.
      page.drawRectangle({
        x: width - coverWidth,
        y: height - coverHeight,
        width: coverWidth,
        height: coverHeight,
        color: rgb(1, 1, 1),
      });

      const maxLogoWidth = isFirstPage ? 250 : 160;
      const maxLogoHeight = isFirstPage ? 110 : 70;
      const scale = Math.min(maxLogoWidth / logoDims.width, maxLogoHeight / logoDims.height);
      const drawWidth = logoDims.width * scale;
      const drawHeight = logoDims.height * scale;
      const padding = 5;
      page.drawImage(logoImage, {
        x: width - drawWidth - padding,
        y: height - drawHeight - padding,
        width: drawWidth,
        height: drawHeight,
      });
    }
  }

  // useObjectStreams:false → simpler output, avoids the extra object-stream pass (a bit
  // gentler on the 0.1-CPU / 512 MB free tier).
  const modifiedPdfBytes = await pdfDoc.save({ useObjectStreams: false });
  fs.writeFileSync(outputPdfPath, modifiedPdfBytes);

  return { outputPdfPath, logoApplied: !!logoImage };
}

module.exports = { resolveLogoPath, applyLogoToPdf };
