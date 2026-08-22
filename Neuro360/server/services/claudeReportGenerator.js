/**
 * Claude Report orchestrator — turns the deterministic qEEG report data into the
 * polished 12-page "Brain Type & Performance Report" PDF.
 *
 *   reportData (numbers, from algorithmCalculator + buildReportData)
 *      → AI narrative (Gemini by default, or the VPS Claude gateway when
 *        REPORT_AI_PROVIDER=claude — prose only, via reportAiProvider)
 *      → 12-page HTML template (numbers filled deterministically)
 *      → VPS gateway renders HTML to PDF via headless Chromium (no Puppeteer on Render)
 *
 * The AI never computes or alters numbers — see reportAiProvider.generateReportNarrative.
 * PDF rendering is offloaded to the VPS (/api/html-to-pdf) to avoid OOM on Render free tier.
 */

const { generateReportNarrative } = require('./reportAiProvider');
const { renderHtmlOnVps, postLesson } = require('./nexaprocService');
const { renderReportHtml } = require('../templates/brainReport12Page');
const { inlineEmojis } = require('../utils/inlineEmojis');

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
  // missing, so an AI hiccup never blocks the report.
  let prose = narrative && typeof narrative === 'object' ? narrative : null;
  if (!prose) {
    try {
      if (typeof onProgress === 'function') onProgress('narrative');
      prose = await generateReportNarrative(reportData);
    } catch (e) {
      // A paid report must fail loudly with the quota reason rather than
      // silently degrade to template copy (the gateway path never sets this code).
      if (e && e.code === 'GEMINI_DAILY_QUOTA_EXCEEDED') throw e;
      console.warn('[Claude Report] Narrative generation failed, using framework defaults:', e.message);
      postLesson('narrative', e.message,
        `Narrative generation failed: "${e.message}". Ensure the JSON schema is followed exactly and output has no markdown fences.`);
      prose = {};
    }
  }

  if (typeof onProgress === 'function') onProgress('render');
  // Inline emojis as SVG images so they render on the fontless headless-Chromium
  // renderer (otherwise they appear as empty "tofu" boxes).
  const html = inlineEmojis(renderReportHtml(reportData, prose));
  const pdf = await renderHtmlOnVps(html);
  return { pdf, narrative: prose };
}

module.exports = { generateBrainReportPdf };
