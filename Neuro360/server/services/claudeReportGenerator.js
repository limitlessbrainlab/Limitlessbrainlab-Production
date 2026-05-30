/**
 * Claude Report orchestrator — turns the deterministic qEEG report data into the
 * polished 12-page "Brain Type & Performance Report" PDF.
 *
 *   reportData (numbers, from algorithmCalculator + buildReportData)
 *      → Claude narrative (VPS gateway, prose only)
 *      → 12-page HTML template (numbers filled deterministically)
 *      → VPS gateway renders HTML to PDF via headless Chromium (no Puppeteer on Render)
 *
 * Claude never computes or alters numbers — see nexaprocService.generateReportNarrative.
 * PDF rendering is offloaded to the VPS (/api/html-to-pdf) to avoid OOM on Render free tier.
 */

const { generateReportNarrative, renderHtmlOnVps, postLesson } = require('./nexaprocService');
const { renderReportHtml } = require('../templates/brainReport12Page');

/**
 * @param {object} reportData  Output of buildReportData() (numbers + brain type).
 * @param {object} [narrative] Pre-fetched narrative. If provided, the internal
 *   narrate call is skipped (used by the upload path, where extraction + narrative
 *   come from a single gateway call). If omitted, the narrative is fetched here.
 * @param {function} [onProgress] Optional callback fired with a stage key
 *   ('narrative' | 'render') just before that step starts, so callers can stream
 *   live progress. No-op if omitted.
 * @returns {Promise<{ pdf: Buffer, narrative: object }>}
 */
async function generateBrainReportPdf(reportData, narrative, onProgress) {
  if (!reportData || !reportData.brainType || !reportData.patient) {
    throw new Error('Invalid reportData: expected the structured object from buildReportData().');
  }

  // Narrative is best-effort — the template falls back to framework copy if it's
  // missing, so a Claude hiccup never blocks the report.
  let prose = narrative && typeof narrative === 'object' ? narrative : null;
  if (!prose) {
    try {
      if (typeof onProgress === 'function') onProgress('narrative');
      prose = await generateReportNarrative(reportData);
    } catch (e) {
      console.warn('[Claude Report] Narrative generation failed, using framework defaults:', e.message);
      postLesson('narrative', e.message,
        `Narrative generation failed: "${e.message}". Ensure the JSON schema is followed exactly and output has no markdown fences.`);
      prose = {};
    }
  }

  if (typeof onProgress === 'function') onProgress('render');
  const html = renderReportHtml(reportData, prose);
  const pdf = await renderHtmlOnVps(html);
  return { pdf, narrative: prose };
}

module.exports = { generateBrainReportPdf };
