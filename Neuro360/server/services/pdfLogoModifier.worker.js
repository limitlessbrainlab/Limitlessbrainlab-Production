/**
 * PDF Logo Modifier — Worker Thread
 *
 * Runs the CPU-bound pdf-lib parse → draw-every-page → re-serialize work OFF the main event
 * loop. On the 0.1-CPU Render free tier this synchronous work would otherwise block the process
 * for the whole request, stalling health checks and other downloads → ERR_TIMED_OUT.
 *
 * Contract: receives { inputPdfPath, outputPdfPath } via workerData, posts back
 * { ok: true, outputPdfPath } on success or { ok: false, error } on failure.
 */

const { parentPort, workerData } = require('worker_threads');
const { PDFDocument, rgb } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

const NEUROSENSE_LOGO_PATH = path.resolve(__dirname, '../../public/NeuroSense_Version_7_White_BG-removebg-preview.png');

async function run({ inputPdfPath, outputPdfPath }) {
  const pdfBytes = fs.readFileSync(inputPdfPath);
  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });

  let logoImage = null;
  if (fs.existsSync(NEUROSENSE_LOGO_PATH)) {
    const logoBytes = fs.readFileSync(NEUROSENSE_LOGO_PATH);
    logoImage = await pdfDoc.embedPng(logoBytes);
  }

  const pages = pdfDoc.getPages();
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const { width, height } = page.getSize();

    // Cover ONLY the qEEGpro logo in the top-right corner. Page 1 has a larger
    // S.A.R.A + qEEGpro logo; other pages have a smaller qEEGpro logo.
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

    if (logoImage) {
      const logoDims = logoImage.scale(1);
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

  const modifiedPdfBytes = await pdfDoc.save();
  fs.writeFileSync(outputPdfPath, modifiedPdfBytes);
  return outputPdfPath;
}

run(workerData)
  .then((outputPdfPath) => parentPort.postMessage({ ok: true, outputPdfPath }))
  .catch((error) => parentPort.postMessage({ ok: false, error: error.message }));
