const { GoogleGenerativeAI } = require('@google/generative-ai');
const rateLimiter = require('./geminiRateLimiter');
const nexaproc = require('./nexaprocService');

/**
 * Provider toggle for the NeuroSense Performance Report pipeline.
 *
 * REPORT_AI_PROVIDER=gemini (default) — both AI calls (number extraction +
 * narrative prose) run on the Gemini API key already used by the qEEG flow,
 * pinned to gemini-2.5-flash with thinking disabled (cost cutting — Pro models
 * are deliberately excluded).
 * REPORT_AI_PROVIDER=claude — the original Nexaproc gateway path, unchanged.
 *
 * No automatic fallback chain: a Gemini failure fails the request loudly; the
 * flip back to Claude is one env-var change + redeploy. PDF rendering stays on
 * the VPS (renderHtmlOnVps) in both modes.
 */

// Pinned cheap-and-fast model. qeegParser.js already uses this model with the
// same key, so its availability is proven. Overridable via GEMINI_REPORT_MODEL
// (e.g. gemini-2.5-flash-lite for even cheaper runs). Bump maxOutputTokens if
// truncation ever shows up in logs.
const REPORT_GEMINI_MODEL = process.env.GEMINI_REPORT_MODEL || 'gemini-2.5-flash';
const GEMINI_MAX_ATTEMPTS = 3;
const GEMINI_ATTEMPT_TIMEOUT_MS = 180000;

// Cost budget guardrails — target: ≤ ₹1 of Gemini spend per report.
// Rates are gemini-2.5-flash list prices; revisit if the model changes
// (ai.google.dev/gemini-api/docs/pricing).
const REPORT_MAX_TEXT_CHARS = 40000; // caps extract input ≈ 10k tokens worst case
const INPUT_USD_PER_M = 0.30;
const OUTPUT_USD_PER_M = 2.50;
const USD_TO_INR = 88;
const SINGLE_CALL_INR_WARN = 0.60;

// Per-report token ledger for the cost-total log line. Reset at extract (the
// first AI call of a report) and totalled after narrative. Two CONCURRENT
// report uploads would interleave their ledgers — cosmetic log drift only.
let reportLedger = { calls: 0, inTok: 0, outTok: 0 };
function ledgerInr(inTok, outTok) {
  return ((inTok * INPUT_USD_PER_M + outTok * OUTPUT_USD_PER_M) / 1e6) * USD_TO_INR;
}

function getReportAiProvider() {
  return (process.env.REPORT_AI_PROVIDER || 'gemini').trim().toLowerCase() === 'claude' ? 'claude' : 'gemini';
}

// Lazy singleton — built on first use so a missing GEMINI_API_KEY can never
// crash server boot; it throws at call time with a clear message instead.
let reportModel = null;
function getReportModel() {
  if (reportModel) return reportModel;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set on the server. Cannot run the performance report with REPORT_AI_PROVIDER=gemini.');
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  reportModel = genAI.getGenerativeModel({
    model: REPORT_GEMINI_MODEL,
    generationConfig: {
      temperature: 0, // match the deterministic gateway config
      topK: 1,
      topP: 1,
      maxOutputTokens: 8192,
      responseMimeType: 'application/json',
      // 2.5-family models spend "thinking" tokens by default — disable for cost.
      ...(REPORT_GEMINI_MODEL.includes('2.5') ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
    },
  });
  return reportModel;
}

/**
 * Normalize a Gemini reply into an object. responseMimeType handles most of it;
 * this is the belt-and-braces fallback (same normalization parseGatewayJson
 * applies to the CLI's stdout). Returns null on failure.
 */
function parseGeminiJson(text) {
  if (!text || typeof text !== 'string') return null;
  let cleaned = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  const first = cleaned.indexOf('{');
  const last = cleaned.lastIndexOf('}');
  if (first !== -1 && last > first) cleaned = cleaned.slice(first, last + 1);
  try {
    const parsed = JSON.parse(cleaned);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
  } catch (_) {
    return null;
  }
}

function isRetryableGeminiError(err) {
  const msg = String(err?.message || err || '');
  return /429|503/i.test(msg);
}

// Google-side quota rejections (RESOURCE_EXHAUSTED) — never recoverable within
// this request, unlike a transient 429/503.
function isGeminiQuotaError(err) {
  return /quota/i.test(String(err?.message || err || ''));
}

/**
 * Report-specific quota error. Same code the shared limiter throws, but without
 * its qEEG-specific advice ("re-upload the SAME files") — wrong here, where a
 * retry burns MORE quota. Tagged so claudeReportGenerator fails the paid report
 * loudly instead of silently degrading to template copy.
 */
function reportQuotaError(dailyRemaining) {
  const error = new Error(
    `The daily Gemini AI quota is exhausted${Number.isFinite(dailyRemaining) ? ` (${dailyRemaining} request(s) left; a report needs 2)` : ''}. ` +
    'Wait for the quota reset (24h window), raise GEMINI_DAILY_LIMIT, or set REPORT_AI_PROVIDER=claude to use the Claude gateway again.'
  );
  error.code = 'GEMINI_DAILY_QUOTA_EXCEEDED';
  return error;
}

/**
 * Shared Gemini call for both report stages. Goes through the shared rate
 * limiter (quota exhaustion propagates as GEMINI_DAILY_QUOTA_EXCEEDED), retries
 * only cheap rejections (429/503/quota) with backoff, and hard-times-out each
 * attempt at 180s so a hung call can't outlive the route's 5-min budget.
 * @param {string} prompt  Full prompt (identical wording to the Claude path).
 * @param {'extract'|'narrative'} stage  Label for logs.
 * @returns {Promise<object|null>}  Parsed JSON object, or null on parse failure.
 */
async function callGeminiForJson(prompt, stage) {
  const model = getReportModel();

  for (let attempt = 1; ; attempt++) {
    // App-limiter quota errors throw here — never retried, re-worded for this flow.
    try {
      await rateLimiter.waitForRateLimit();
    } catch (e) {
      if (e && e.code === 'GEMINI_DAILY_QUOTA_EXCEEDED') throw reportQuotaError();
      throw e;
    }
    console.log(`[Report AI] gemini ${stage} attempt ${attempt}/${GEMINI_MAX_ATTEMPTS} → ${REPORT_GEMINI_MODEL}`);
    // Record BEFORE the call: the request is being sent regardless of outcome,
    // so a timed-out attempt still counts against the shared daily budget.
    rateLimiter.recordRequest();
    let timer;
    try {
      const result = await new Promise((resolve, reject) => {
        timer = setTimeout(() => reject(new Error(`Gemini ${stage} timed out after ${GEMINI_ATTEMPT_TIMEOUT_MS / 1000}s`)), GEMINI_ATTEMPT_TIMEOUT_MS);
        model.generateContent(prompt).then(resolve, reject);
      });
      const response = await result.response;
      // Cost measurement: token usage from the response, logged per call so the
      // ₹1/report budget is verifiable in production logs.
      const usage = response.usageMetadata;
      if (usage) {
        reportLedger.calls += 1;
        reportLedger.inTok += usage.promptTokenCount || 0;
        reportLedger.outTok += usage.candidatesTokenCount || 0;
        const inr = ledgerInr(usage.promptTokenCount || 0, usage.candidatesTokenCount || 0);
        console.log(
          `[Report AI] gemini ${stage} used ${usage.promptTokenCount || 0} in / ${usage.candidatesTokenCount || 0} out tokens ≈ ₹${inr.toFixed(2)}`
        );
        if (inr > SINGLE_CALL_INR_WARN) {
          console.warn(`[Report AI] gemini ${stage} cost ₹${inr.toFixed(2)} exceeds the ₹${SINGLE_CALL_INR_WARN} per-call guard — check input size`);
        }
      }
      const parsed = parseGeminiJson(response.text());
      if (!parsed) {
        // finishReason MAX_TOKENS here means truncation — bump maxOutputTokens.
        console.warn(
          `[Report AI] gemini ${stage}: response was not parseable JSON — returning null`,
          `(finishReason=${response.candidates?.[0]?.finishReason || 'n/a'}`,
          response.usageMetadata ? `tokens=${response.usageMetadata.totalTokenCount})` : ')'
        );
      }
      return parsed;
    } catch (err) {
      // A Google-side quota rejection never recovers within this request — fail
      // loudly (tagged like the limiter's error) instead of retrying pointlessly
      // and letting the paid report silently degrade to template copy.
      if (isGeminiQuotaError(err)) {
        const quotaErr = err instanceof Error ? err : new Error(String(err?.message || err));
        quotaErr.code = 'GEMINI_DAILY_QUOTA_EXCEEDED';
        throw quotaErr;
      }
      if (attempt < GEMINI_MAX_ATTEMPTS && isRetryableGeminiError(err)) {
        const base = /429/.test(String(err?.message || '')) ? 10000 : 5000;
        const delay = Math.min(2 ** (attempt - 1) * base, 60000);
        console.warn(`[Report AI] gemini ${stage} attempt ${attempt} failed (${err.message}); retrying in ${delay / 1000}s`);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }
}

/**
 * Transcribe the uploaded report's numbers. Same contract as the gateway path:
 * returns the `source` object, or null when nothing usable came back.
 * @param {string} pdfText  Text extracted (pdf-parse) from the uploaded report.
 * @returns {Promise<object|null>}
 */
async function extractReportSource(pdfText) {
  if (getReportAiProvider() === 'claude') {
    return nexaproc.extractReportSource(pdfText);
  }

  // Pre-flight: a report needs TWO Gemini units (extract + narrative). Failing
  // fast here beats burning the last unit on extract and dying at narrative.
  // Not a guarantee — qEEG traffic can take units in between — just fast-fail.
  const { dailyRemaining } = rateLimiter.getQuotaStatus();
  if (dailyRemaining < 2) throw reportQuotaError(dailyRemaining);

  // New report → reset the cost ledger. Cap the PDF text: the numbers all live
  // in the first ~40k chars of a real report, and an unbounded input is the
  // one thing that can blow the ₹1/report budget on a pathological PDF.
  reportLedger = { calls: 0, inTok: 0, outTok: 0 };
  const cappedText = pdfText.length > REPORT_MAX_TEXT_CHARS ? pdfText.slice(0, REPORT_MAX_TEXT_CHARS) : pdfText;

  const parsed = await callGeminiForJson(nexaproc.buildExtractSourcePrompt(cappedText), 'extract');
  // Same tail as the gateway path: the extraction IS the object; tolerate a
  // {source:{...}} wrapper too.
  if (parsed && (parsed.markers || parsed.deepDive)) return parsed;
  if (parsed && parsed.source) return parsed.source;
  return null;
}

/**
 * Write the doctor-readable narrative. Same contract as the gateway path:
 * best-effort — returns {} when the reply isn't usable JSON so the template
 * falls back to framework copy. Learned examples are still fetched from (and
 * saved to) the VPS store: those are plain HTTP calls, cost nothing, and keep
 * the prompt byte-identical to the Claude path.
 * @param {object} reportData  Output of buildReportData().
 * @returns {Promise<object>}  Parsed narrative ({} on failure → template falls back).
 */
async function generateReportNarrative(reportData) {
  if (getReportAiProvider() === 'claude') {
    return nexaproc.generateReportNarrative(reportData);
  }

  // Fetch previously-learned examples (fail-safe — returns [] on any error).
  // Cost guardrail: at most ONE learned example — the Sagar reference in the
  // prompt already fixes the style, and each example is ~1k+ input tokens.
  const learnedExamples = (await nexaproc.fetchReportExamples()).slice(0, 1);
  const payload = nexaproc.buildNarrativePrompt(reportData, learnedExamples);

  const narrative = await callGeminiForJson(payload, 'narrative');

  console.log(
    `[Report AI] report AI cost total: ${reportLedger.calls} call(s), ${reportLedger.inTok} in / ${reportLedger.outTok} out tokens ≈ ₹${ledgerInr(reportLedger.inTok, reportLedger.outTok).toFixed(2)} (budget ₹1)`
  );

  // Fire-and-forget: save this narrative as a learned example for future reports
  if (narrative && Object.keys(narrative).length > 0) {
    nexaproc.saveReportExample(narrative, {
      name: reportData.patient?.name || 'Unknown',
      assessmentDate: reportData.patient?.assessmentDate || '',
      brainType: reportData.brainType?.name || '',
    });
  }

  return narrative || {};
}

module.exports = {
  extractReportSource,
  generateReportNarrative,
  getReportAiProvider,
  REPORT_GEMINI_MODEL,
};
