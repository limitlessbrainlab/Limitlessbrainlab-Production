/**
 * PDF Logo Modifier Service
 * Replaces EEG machine logo with NeuroSense logo in uploaded PDFs
 */

const fs = require('fs');
const path = require('path');
const { Worker } = require('worker_threads');

// NeuroSense logo path
const NEUROSENSE_LOGO_PATH = path.resolve(__dirname, '../../public/NeuroSense_Version_7_White_BG-removebg-preview.png');

const LOGO_WORKER_PATH = path.resolve(__dirname, 'pdfLogoModifier.worker.js');

/**
 * Replace EEG logo with NeuroSense logo on all pages of a PDF.
 *
 * The CPU-bound pdf-lib work runs in a worker thread so it does NOT block the main event loop —
 * critical on the 0.1-CPU Render free tier, where blocking here stalls health checks and other
 * downloads (→ ERR_TIMED_OUT). Falls back to the original PDF path on any failure.
 *
 * @param {string} inputPdfPath - Path to the input PDF file
 * @param {string} outputPdfPath - Optional output path (defaults to temp file)
 * @returns {Promise<string>} - Path to the modified PDF (or the original on failure)
 */
async function replaceLogo(inputPdfPath, outputPdfPath = null) {
  console.log('🔄 Starting logo replacement (worker) for:', inputPdfPath);

  // Generate output path if not provided
  if (!outputPdfPath) {
    const inputDir = path.dirname(inputPdfPath);
    const inputBasename = path.basename(inputPdfPath, '.pdf');
    outputPdfPath = path.join(inputDir, `${inputBasename}_modified.pdf`);
  }

  return new Promise((resolve) => {
    let settled = false;
    const finish = (result) => { if (!settled) { settled = true; resolve(result); } };

    let worker;
    try {
      worker = new Worker(LOGO_WORKER_PATH, { workerData: { inputPdfPath, outputPdfPath } });
    } catch (spawnErr) {
      console.error('   ❌ Could not spawn logo worker:', spawnErr.message);
      console.log('   ⚠️ Falling back to original PDF');
      return finish(inputPdfPath);
    }

    worker.on('message', (msg) => {
      if (msg && msg.ok) {
        console.log(`   ✅ Logo replaced successfully. Output: ${msg.outputPdfPath}`);
        finish(msg.outputPdfPath);
      } else {
        console.error('   ❌ Error replacing logo:', msg && msg.error);
        console.log('   ⚠️ Falling back to original PDF');
        finish(inputPdfPath);
      }
    });
    worker.on('error', (err) => {
      console.error('   ❌ Logo worker error:', err.message);
      console.log('   ⚠️ Falling back to original PDF');
      finish(inputPdfPath);
    });
    worker.on('exit', (code) => {
      if (code !== 0) {
        console.error(`   ❌ Logo worker exited with code ${code}`);
        console.log('   ⚠️ Falling back to original PDF');
        finish(inputPdfPath);
      }
    });
  });
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
