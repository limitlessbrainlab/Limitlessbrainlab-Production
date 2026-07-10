/**
 * PDF Logo Modifier — Worker Thread
 *
 * Runs the CPU-bound pdf-lib logo replacement OFF the main event loop. Shares the exact same
 * drawing logic as the in-process fallback via pdfLogoCore.js.
 *
 * Contract: receives { inputPdfPath, outputPdfPath } via workerData, posts back
 * { ok: true, outputPdfPath, logoApplied } on success or { ok: false, error } on failure.
 */

const { parentPort, workerData } = require('worker_threads');
const { applyLogoToPdf } = require('./pdfLogoCore');

applyLogoToPdf(workerData.inputPdfPath, workerData.outputPdfPath)
  .then(({ outputPdfPath, logoApplied }) => parentPort.postMessage({ ok: true, outputPdfPath, logoApplied }))
  .catch((error) => parentPort.postMessage({ ok: false, error: error.message }));
