const axios = require('axios');
const fs = require('fs');
const pdfParse = require('pdf-parse');

/**
 * Sidecar client for the Nexaproc AI Gateway (AIaaS) on the Hostinger VPS.
 *
 * The gateway wraps the Claude CLI. We extract the qEEG PDF's text locally
 * (fast — milliseconds) and POST it to the gateway's /api/report-pdf endpoint;
 * the gateway runs Claude (fast Haiku model) to build a styled HTML report,
 * renders it to a PDF with headless Chromium, and returns the PDF bytes. We
 * send TEXT (not the raw image-heavy PDF) so generation fits the 300s cap.
 *
 * Neuro's backend is the "sidecar": the browser never talks to the VPS
 * directly — it calls our route, which forwards to the gateway here.
 */

const GATEWAY_URL = process.env.NEXAPROC_GATEWAY_URL || 'http://76.13.244.21:8787';
const MASTER_KEY = process.env.NEXAPROC_MASTER_KEY || '';
// Gateway caps the JSON body at 1MB; keep the extracted text well under it.
const MAX_TEXT_CHARS = 200000;

/**
 * Extract a PDF's text, send it to the gateway, and return the rendered PDF.
 * @param {string} filePath  Absolute path to the uploaded PDF on disk.
 * @param {object} [opts]
 * @param {string} [opts.taskID='CLAUDE_REPORT']
 * @param {string} [opts.filename]
 * @returns {Promise<{pdf: Buffer}>}
 */
async function generateClaudeReportFromPdf(filePath, opts = {}) {
  const { taskID = 'CLAUDE_REPORT' } = opts;

  if (!MASTER_KEY) {
    throw new Error('NEXAPROC_MASTER_KEY is not set on the server. Cannot authenticate to the AIaaS gateway.');
  }

  // Extract text from the PDF (fast; the qEEG values are textual).
  let text;
  try {
    const parsed = await pdfParse(fs.readFileSync(filePath));
    text = (parsed.text || '').trim();
  } catch (e) {
    throw new Error(`Failed to read the PDF: ${e.message}`);
  }
  if (!text) {
    throw new Error('No extractable text found in the PDF (it may be a scanned image).');
  }
  if (text.length > MAX_TEXT_CHARS) text = text.slice(0, MAX_TEXT_CHARS);

  try {
    const response = await axios.post(
      `${GATEWAY_URL}/api/report-pdf`,
      { taskID, payload: text, timeoutMs: 295000 },
      {
        headers: { 'X-Nexaproc-Key': MASTER_KEY, 'Content-Type': 'application/json' },
        timeout: 320000,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        responseType: 'arraybuffer',
      }
    );

    return { pdf: Buffer.from(response.data) };
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      // Error bodies arrive as an arraybuffer (responseType above); decode JSON.
      let gwMsg = error.response.statusText;
      try {
        const parsed = JSON.parse(Buffer.from(error.response.data).toString('utf8'));
        gwMsg = parsed.error || gwMsg;
      } catch (_) { /* not JSON */ }
      if (status === 401 || status === 403) {
        throw new Error('AIaaS rejected the request (bad or missing NEXAPROC_MASTER_KEY).');
      }
      if (status === 429) {
        throw new Error('AIaaS is busy processing another request. Please try again in a moment.');
      }
      if (status === 504) {
        throw new Error('AIaaS timed out generating the report. The document may be too large.');
      }
      throw new Error(`AIaaS error (${status}): ${gwMsg}`);
    }
    if (error.code === 'ECONNREFUSED' || error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      throw new Error(`Could not reach the AIaaS gateway at ${GATEWAY_URL}. ${error.message}`);
    }
    throw error;
  }
}

/**
 * Build the doctor-readable narrative prompt from the deterministic report data.
 * Claude writes ONLY prose — it must echo every number exactly as given and never
 * recompute or invent values.
 */
// The doctor-readable narrative JSON schema, shared by both Claude prompts.
const NARRATIVE_SCHEMA = `{
  "snapshotSummary": "2-3 sentences: where the patient stands overall, referencing the overall score and their standout strength + main watch-zone.",
  "topStrength": { "title": "short", "points": ["2 bullets grounded in the data"] },
  "watchZone": { "title": "short", "points": ["2 bullets grounded in the data"] },
  "brainTypeReason": ["3-4 bullets: the qEEG signatures that map to this brain type, each citing a real value"],
  "brainwaveIntro": "1-2 sentences introducing the relative-power profile (eyes-closed).",
  "brainwaveCards": [ { "title": "short", "body": "1-2 sentences" } ],
  "performance": { "cognition": "1-2 sentences", "stress": "1-2 sentences", "focus": "1-2 sentences", "burnout": "1-2 sentences" },
  "performanceFeature": "A short paragraph (3-4 sentences) on the single most clinically interesting finding.",
  "innerBandwidth": { "emotional": "1-2 sentences", "learning": "1-2 sentences", "creativity": "1-2 sentences", "link": "1-2 sentences on how the three move together." },
  "deepDive": { "alphaPeak": "1 sentence", "arousal": "1 sentence", "relaxation": "1 sentence", "regeneration": "1 sentence", "frontalAsymmetry": "1 sentence", "daytimeDelta": "1 sentence", "readingPattern": "1-2 sentences on the overall pattern." },
  "plan": { "intro": "1-2 sentences framing the 30-day plan.", "after30": "1-2 sentences on which markers shift first." },
  "closing": "2-3 sentences, encouraging and forward-looking."
}`;

function buildNarrativePrompt(reportData) {
  const safe = JSON.stringify(reportData, null, 2);
  return `You are a clinical neuroscience writer producing the narrative prose for a
"Neuro Performance Report" that a DOCTOR will read alongside a patient.

You are given a JSON object with ALL the computed numbers and the patient's brain
type (from a deterministic qEEG algorithm). Your job is ONLY to write clear,
warm, clinically-grounded prose that explains these numbers.

ABSOLUTE RULES:
- NEVER change, round, or invent any number. Use the values exactly as provided.
- Do NOT add medical diagnoses or treatment claims. Wellness/educational tone.
- Write for an intelligent lay patient; a doctor should find it accurate.
- Keep each field concise (1-3 sentences unless a list is requested).
- Return PURE JSON only (no markdown, no code fences), matching this schema:

${NARRATIVE_SCHEMA}

Here is the report data:
${safe}`;
}

/**
 * Parse the gateway's wrapped CLI output into an object. With useJson:true the
 * JSON lands in `parsed`; otherwise raw text is in `stdout`. Returns {} on failure.
 */
function parseGatewayJson(responseData) {
  const data = responseData || {};
  if (data.parsed && typeof data.parsed === 'object' && !Array.isArray(data.parsed)) {
    return data.parsed;
  }
  const raw = data.stdout ?? data.result ?? data.output ?? (typeof data === 'string' ? data : '');
  if (raw && typeof raw === 'string') {
    let cleaned = raw.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
    const first = cleaned.indexOf('{');
    const last = cleaned.lastIndexOf('}');
    if (first !== -1 && last > first) cleaned = cleaned.slice(first, last + 1);
    try {
      return JSON.parse(cleaned);
    } catch (_) {
      return {};
    }
  }
  return {};
}

/**
 * Ask the VPS Claude (Nexaproc gateway) for the report narrative blocks.
 * @param {object} reportData  Output of buildReportData().
 * @returns {Promise<object>}  Parsed narrative ({} on failure → template falls back).
 */
async function generateReportNarrative(reportData) {
  if (!MASTER_KEY) {
    throw new Error('NEXAPROC_MASTER_KEY is not set on the server. Cannot authenticate to the AIaaS gateway.');
  }
  const payload = buildNarrativePrompt(reportData);
  const opts = { headers: { 'X-Nexaproc-Key': MASTER_KEY, 'Content-Type': 'application/json' }, timeout: 180000 };

  // One retry ONLY when the single-flight gateway rejects us fast as "busy" (429) —
  // that call cost ~nothing, so retrying is cheap. Do NOT retry on a 504/timeout:
  // that attempt already burned the full timeout, and a second one would double the
  // total time and blow the caller's 5-min budget. The narrative is best-effort
  // (the template falls back to framework copy), so failing fast is correct.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await axios.post(`${GATEWAY_URL}/api/invoke`, { taskID: 'GENERIC_ASK', payload, useJson: true, model: 'haiku' }, opts);
      return parseGatewayJson(response.data);
    } catch (err) {
      const status = err.response?.status;
      if (attempt === 0 && status === 429) {
        await new Promise((r) => setTimeout(r, 4000));
        continue;
      }
      throw err;
    }
  }
}

/**
 * Read an ALREADY-GENERATED brain/qEEG report's text and TRANSCRIBE its numbers
 * verbatim into the `source` object. We never recompute — the uploaded report
 * already prints these values; Claude only transcribes them. Kept deliberately
 * small/fast (numbers only, no prose) so it stays well under the gateway's 300s
 * cap; the doctor-readable prose is fetched separately via generateReportNarrative.
 * @param {string} pdfText  Text extracted (pdf-parse) from the uploaded report.
 * @returns {Promise<object|null>}  The `source` object (or null on failure).
 */
async function extractReportSource(pdfText) {
  if (!MASTER_KEY) {
    throw new Error('NEXAPROC_MASTER_KEY is not set on the server. Cannot authenticate to the AIaaS gateway.');
  }

  const payload = `You are given the raw text of an EXISTING brain / qEEG performance report for a
single patient. It already prints the patient's scores and EEG metric values.

TRANSCRIBE the numbers EXACTLY as they appear. Do NOT compute, invert, infer, or
invent anything — just copy what is printed. If a value is not present, use null.
Return ONE pure JSON object (no markdown, no code fences, no prose):

{
  "patient": { "name": "<patient name or null>", "assessmentDate": "<date string or null>" },
  "markers": {
    "stressRegulation": <0-100 or null>,
    "cognition": <0-100 or null>,
    "focusAttention": <0-100 or null>,
    "learning": <0-100 or null>,
    "burnoutResistance": <0-100 or null>,
    "emotionalRegulation": <0-100 or null>,
    "creativity": <0-100 or null>
  },
  "deepDive": {
    "alphaPeak": <Hz or null>,
    "arousal": <number or null>,
    "relaxation": <number or null>,
    "regeneration": <percent or null>,
    "frontalAsymmetry": <number, keep sign, or null>,
    "daytimeDelta": <percent or null>
  },
  "brainwave": { "delta": <% or null>, "theta": <% or null>, "alpha": <% or null>, "beta": <% or null>, "hiBeta": <% or null>, "alphaPeakHz": <Hz or null> }
}

Rules:
- "markers" are the seven performance percentages exactly as shown on the report's
  snapshot/markers pages (e.g. "Stress Regulation 100%", "Cognition 67%", "Burnout
  Resistance 67%", "Emotional Regulation 33%"). Copy the number shown — do NOT invert
  or recompute. If the report shows a 0-3 score instead of a %, convert 3→100, 2→67,
  1→33, 0→0.
- "deepDive" values are raw numbers wherever they appear (Alpha Peak in Hz, Arousal,
  Relaxation, Regeneration %, Frontal Alpha Asymmetry keeping its +/- sign, Daytime
  or Excessive Delta %).

Here is the report text:
${pdfText}`;

  // The gateway is single-flight (one CLI call at a time) and shared with other
  // products, so a momentary "busy" (429) is common. Extract is the FIRST call and
  // has NO fallback — if it fails the whole report fails — so ride out transient
  // contention with a few quick retries (429 is rejected instantly, so this only
  // waits for the other call to free the gateway). Do not retry slow 504/timeouts.
  const opts = { headers: { 'X-Nexaproc-Key': MASTER_KEY, 'Content-Type': 'application/json' }, timeout: 180000 };
  let response;
  for (let attempt = 0; ; attempt++) {
    try {
      response = await axios.post(`${GATEWAY_URL}/api/invoke`, { taskID: 'GENERIC_ASK', payload, useJson: true, model: 'haiku' }, opts);
      break;
    } catch (err) {
      if (err.response?.status === 429 && attempt < 4) {
        await new Promise((r) => setTimeout(r, 5000));
        continue;
      }
      throw err;
    }
  }

  const parsed = parseGatewayJson(response.data);
  // The extraction IS the object; tolerate a {source:{...}} wrapper too.
  if (parsed && (parsed.markers || parsed.deepDive)) return parsed;
  if (parsed && parsed.source) return parsed.source;
  return null;
}

/**
 * Send a fully-rendered HTML string to the VPS gateway for PDF rendering.
 * The VPS uses headless Chromium — no Puppeteer needed on the Render backend.
 * @param {string} html  Complete HTML document string.
 * @returns {Promise<Buffer>}  PDF bytes.
 */
async function renderHtmlOnVps(html) {
  if (!MASTER_KEY) {
    throw new Error('NEXAPROC_MASTER_KEY is not set on the server. Cannot render PDF on VPS.');
  }
  const opts = {
    headers: { 'X-Nexaproc-Key': MASTER_KEY, 'Content-Type': 'application/json' },
    timeout: 60000,
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
    responseType: 'arraybuffer',
  };
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await axios.post(`${GATEWAY_URL}/api/html-to-pdf`, { html }, opts);
      return Buffer.from(response.data);
    } catch (err) {
      const status = err.response?.status;
      // Retry once on transient failures (PM2 restart ~5s, brief network blip).
      // Skip retry on 4xx — a bad request won't succeed on retry.
      const isTransient = !status || status >= 500;
      if (attempt === 0 && isTransient) {
        console.warn(`[renderHtmlOnVps] attempt 1 failed (${err.message}), retrying in 15s…`);
        await new Promise((r) => setTimeout(r, 15000));
        continue;
      }
      throw err;
    }
  }
}

/**
 * Fire-and-forget: post an error lesson to the VPS gateway so Claude CLI
 * learns from it via CLAUDE.md on the next invocation. Never throws.
 */
function postLesson(stage, error, lesson) {
  if (!MASTER_KEY || !GATEWAY_URL) return;
  axios.post(
    `${GATEWAY_URL}/api/report-lesson`,
    { stage, error: String(error).slice(0, 300), lesson },
    { headers: { 'X-Nexaproc-Key': MASTER_KEY, 'Content-Type': 'application/json' }, timeout: 5000 }
  ).catch((e) => console.warn('[postLesson] failed to save lesson:', e.message));
}

module.exports = {
  generateClaudeReportFromPdf,
  generateReportNarrative,
  extractReportSource,
  renderHtmlOnVps,
  postLesson,
  GATEWAY_URL,
};
