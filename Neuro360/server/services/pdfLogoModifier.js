/**
 * PDF Logo Modifier Service
 * Replaces the EEG machine logo (qEEGpro / S.A.R.A) with the NeuroSense logo in PDFs.
 *
 * Strategy: run the CPU-bound pdf-lib work in a worker thread (fast path, doesn't block the
 * event loop on the 0.1-CPU Render tier). If the worker fails for ANY reason (fails to spawn,
 * errors, is OOM-killed / exits non-zero, hangs, or reports the logo asset missing), fall back
 * to doing the SAME work IN-PROCESS so the logo is still applied. Only if BOTH the worker and
 * the inline pass fail do we return the original PDF — and that is logged loudly, never silent.
 */

const fs = require('fs');
const path = require('path');
const { Worker } = require('worker_threads');
const { applyLogoToPdf } = require('./pdfLogoCore');

const LOGO_WORKER_PATH = path.resolve(__dirname, 'pdfLogoModifier.worker.js');
const WORKER_TIMEOUT_MS = 60000; // don't let a hung worker wedge the request

/**
 * Try the worker thread. Resolves { ok:true } only when the logo was actually applied,
 * otherwise { ok:false, reason }.
 */
function tryWorker(inputPdfPath, outputPdfPath) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (r) => { if (!settled) { settled = true; resolve(r); } };

    let worker;
    try {
      worker = new Worker(LOGO_WORKER_PATH, { workerData: { inputPdfPath, outputPdfPath } });
    } catch (spawnErr) {
      return finish({ ok: false, reason: `spawn: ${spawnErr.message}` });
    }

    const timer = setTimeout(() => {
      try { worker.terminate(); } catch { /* ignore */ }
      finish({ ok: false, reason: 'timeout' });
    }, WORKER_TIMEOUT_MS);

    worker.on('message', (msg) => {
      clearTimeout(timer);
      if (msg && msg.ok && msg.logoApplied) finish({ ok: true });
      else finish({ ok: false, reason: (msg && (msg.error || (msg.ok ? 'logo-asset-missing' : 'no-ok'))) || 'no-message' });
    });
    worker.on('error', (err) => { clearTimeout(timer); finish({ ok: false, reason: `error: ${err.message}` }); });
    worker.on('exit', (code) => { clearTimeout(timer); if (code !== 0) finish({ ok: false, reason: `exit ${code}` }); });
  });
}

/**
 * Replace the machine logo with the NeuroSense logo on all pages of a PDF.
 * @param {string} inputPdfPath
 * @param {string} outputPdfPath - optional; defaults to a temp "<name>_modified.pdf"
 * @returns {Promise<string>} path to the modified PDF (or the original if replacement is impossible)
 */
async function replaceLogo(inputPdfPath, outputPdfPath = null) {
  console.log('🔄 Starting logo replacement for:', inputPdfPath);

  if (!outputPdfPath) {
    const inputDir = path.dirname(inputPdfPath);
    const inputBasename = path.basename(inputPdfPath, '.pdf');
    outputPdfPath = path.join(inputDir, `${inputBasename}_modified.pdf`);
  }

  // Fast path: worker thread.
  const viaWorker = await tryWorker(inputPdfPath, outputPdfPath);
  if (viaWorker.ok) {
    console.log('   ✅ Logo replaced (worker). Output:', outputPdfPath);
    return outputPdfPath;
  }
  console.warn(`   ⚠️ Logo worker did not apply the logo (${viaWorker.reason}) — retrying in-process`);

  // Reliable fallback: same work, in-process. Never silently return the original when we can
  // actually do the swap.
  try {
    const { logoApplied } = await applyLogoToPdf(inputPdfPath, outputPdfPath);
    if (logoApplied) {
      console.log('   ✅ Logo replaced (inline fallback). Output:', outputPdfPath);
      return outputPdfPath;
    }
    console.error('   ❌ Logo asset missing — could not stamp NeuroSense logo; keeping original PDF.');
    return inputPdfPath;
  } catch (inlineErr) {
    console.error('   ❌ Inline logo replacement failed:', inlineErr.message, '— keeping original PDF');
    return inputPdfPath;
  }
}

/**
 * Replace logo and overwrite the original file. Returns true on success.
 */
async function replaceLogoInPlace(pdfPath) {
  try {
    const tempOutputPath = pdfPath.replace('.pdf', '_temp_modified.pdf');
    const modifiedPath = await replaceLogo(pdfPath, tempOutputPath);
    if (modifiedPath !== pdfPath && fs.existsSync(modifiedPath)) {
      fs.unlinkSync(pdfPath);
      fs.renameSync(modifiedPath, pdfPath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('   ❌ Error in replaceLogoInPlace:', error.message);
    return false;
  }
}

/**
 * Clean up temporary modified PDF files.
 */
function cleanupModifiedPdf(modifiedPdfPath) {
  try {
    if (modifiedPdfPath && fs.existsSync(modifiedPdfPath) && modifiedPdfPath.includes('_modified')) {
      fs.unlinkSync(modifiedPdfPath);
    }
  } catch (error) {
    console.error('   ⚠️ Error cleaning up modified PDF:', error.message);
  }
}

module.exports = {
  replaceLogo,
  replaceLogoInPlace,
  cleanupModifiedPdf,
};
