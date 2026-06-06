/**
 * Nexaproc AI Gateway — wraps the Claude CLI as an HTTP service.
 * Runs on the VPS (port 8787). Neuro backend calls this instead of Anthropic directly.
 *
 * Endpoints:
 *   GET  /health              — liveness check (no auth)
 *   POST /api/invoke          — run Claude, return { parsed, stdout }
 *   POST /api/html-to-pdf     — render HTML → PDF via headless Chromium, return bytes
 *   POST /api/report-lesson   — log an error lesson (fire-and-forget)
 *   GET  /api/report-examples — return last 5 saved narrative examples for few-shot prompting
 *   POST /api/save-example    — save a generated narrative to the rolling examples file
 */

'use strict';

const express = require('express');
const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const app = express();
app.use(express.json({ limit: '4mb' }));

const MASTER_KEY = process.env.NEXAPROC_MASTER_KEY || '';
const PORT = parseInt(process.env.PORT || '8787', 10);
const EXAMPLES_FILE = path.join(__dirname, 'report-examples.json');
const MAX_EXAMPLES = 5;

// ─── Auth ─────────────────────────────────────────────────────────────────────

function requireKey(req, res, next) {
  if (!MASTER_KEY) {
    return res.status(500).json({ error: 'NEXAPROC_MASTER_KEY is not set on this gateway.' });
  }
  const key = req.headers['x-nexaproc-key'];
  if (!key || key !== MASTER_KEY) {
    return res.status(401).json({ error: 'Unauthorized — bad or missing X-Nexaproc-Key.' });
  }
  next();
}

// ─── Health (no auth) ─────────────────────────────────────────────────────────

app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'nexaproc-gateway', ts: new Date().toISOString() });
});

// ─── Single-flight guard ──────────────────────────────────────────────────────
// The Claude CLI is a stateful process — concurrent calls would queue internally
// and cause timeouts. Serialize with a simple busy flag; callers retry on 429.

let busy = false;

// ─── POST /api/invoke ─────────────────────────────────────────────────────────

app.post('/api/invoke', requireKey, async (req, res) => {
  if (busy) {
    return res.status(429).json({ error: 'Gateway is processing another request. Retry in a moment.' });
  }
  busy = true;
  try {
    const { payload, useJson, model } = req.body;
    if (!payload) return res.status(400).json({ error: 'payload is required' });

    // Map short names to real model IDs supported by this Claude Code installation.
    const modelId = resolveModel(model);

    const rawText = await runClaude(payload, modelId, 180000);

    if (!useJson) {
      return res.json({ stdout: rawText });
    }

    // The caller expects the response JSON already parsed into `parsed`.
    const parsed = extractJson(rawText);
    return res.json({ parsed, stdout: rawText });
  } catch (err) {
    console.error('[invoke]', err.message);
    return res.status(500).json({ error: err.message });
  } finally {
    busy = false;
  }
});

// ─── POST /api/html-to-pdf ────────────────────────────────────────────────────

app.post('/api/html-to-pdf', requireKey, async (req, res) => {
  const { html } = req.body;
  if (!html) return res.status(400).json({ error: 'html is required' });

  try {
    const pdfBuf = await renderHtmlToPdf(html);
    res.setHeader('Content-Type', 'application/pdf');
    res.send(pdfBuf);
  } catch (err) {
    console.error('[html-to-pdf]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/report-lesson ─────────────────────────────────────────────────

app.post('/api/report-lesson', requireKey, (req, res) => {
  const { stage, error: errMsg, lesson } = req.body;
  console.log(`[LESSON] stage=${stage} | error=${String(errMsg || '').slice(0, 200)}`);
  if (lesson) console.log(`[LESSON] lesson: ${String(lesson).slice(0, 400)}`);
  res.json({ ok: true });
});

// ─── GET /api/report-examples ────────────────────────────────────────────────
// Returns the last MAX_EXAMPLES saved narratives as formatted strings for few-shot prompting.

app.get('/api/report-examples', requireKey, (req, res) => {
  try {
    if (!fs.existsSync(EXAMPLES_FILE)) {
      return res.json({ examples: [] });
    }
    let data;
    try {
      data = JSON.parse(fs.readFileSync(EXAMPLES_FILE, 'utf8'));
    } catch (_) {
      return res.json({ examples: [] });
    }
    const entries = Array.isArray(data) ? data : [];
    const formatted = entries.map((e) => {
      const lines = [
        `PATIENT: ${e.patient || 'Unknown'}`,
        e.snapshotSummary ? `snapshotSummary: "${e.snapshotSummary}"` : null,
        e.performanceFeature ? `performanceFeature: "${e.performanceFeature}"` : null,
        e.deepDive?.readingPattern ? `deepDive.readingPattern: "${e.deepDive.readingPattern}"` : null,
        e.closing ? `closing: "${e.closing}"` : null,
      ].filter(Boolean);
      return lines.join('\n');
    });
    res.json({ examples: formatted });
  } catch (err) {
    console.error('[report-examples]', err.message);
    res.json({ examples: [] });
  }
});

// ─── POST /api/save-example ──────────────────────────────────────────────────
// Appends a generated narrative to the rolling examples file (keeps last MAX_EXAMPLES).

app.post('/api/save-example', requireKey, (req, res) => {
  try {
    const { narrative, patient } = req.body;
    if (!narrative || typeof narrative !== 'object') {
      return res.status(400).json({ error: 'narrative object is required' });
    }

    let examples = [];
    if (fs.existsSync(EXAMPLES_FILE)) {
      try {
        const raw = JSON.parse(fs.readFileSync(EXAMPLES_FILE, 'utf8'));
        if (Array.isArray(raw)) examples = raw;
      } catch (_) { /* start fresh */ }
    }

    const entry = {
      patient: patient
        ? `${patient.name || 'Unknown'} | ${patient.brainType || ''} | ${patient.assessmentDate || ''}`
        : 'Unknown',
      snapshotSummary: narrative.snapshotSummary || null,
      performanceFeature: narrative.performanceFeature || null,
      deepDive: { readingPattern: narrative.deepDive?.readingPattern || null },
      closing: narrative.closing || null,
      savedAt: new Date().toISOString(),
    };

    examples.push(entry);
    if (examples.length > MAX_EXAMPLES) {
      examples = examples.slice(examples.length - MAX_EXAMPLES);
    }

    fs.writeFileSync(EXAMPLES_FILE, JSON.stringify(examples, null, 2), 'utf8');
    console.log(`[save-example] saved for ${entry.patient} (total: ${examples.length})`);
    res.json({ ok: true, total: examples.length });
  } catch (err) {
    console.error('[save-example]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolveModel(model) {
  if (!model || model === 'haiku') return 'claude-haiku-4-5-20251001';
  if (model === 'sonnet') return 'claude-sonnet-4-6';
  if (model === 'opus') return 'claude-opus-4-8';
  return model; // pass through if already a full model ID
}

/**
 * Run `claude -p PROMPT --model MODEL --output-format json` and return the
 * assistant's text response (extracted from the CLI's JSON wrapper).
 */
function runClaude(prompt, modelId, timeoutMs) {
  return new Promise((resolve, reject) => {
    execFile(
      'claude',
      ['-p', prompt, '--model', modelId, '--output-format', 'json'],
      {
        timeout: timeoutMs,
        maxBuffer: 20 * 1024 * 1024,
        env: {
          ...process.env,
          CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1',
        },
      },
      (error, stdout, stderr) => {
        if (error) {
          const detail = stderr ? stderr.slice(0, 500) : '';
          return reject(new Error(`Claude CLI failed: ${error.message}${detail ? '\n' + detail : ''}`));
        }
        // Claude CLI with --output-format json wraps the response:
        // { "type": "result", "result": "<assistant text>", ... }
        try {
          const wrapper = JSON.parse(stdout);
          resolve((wrapper.result || wrapper.text || stdout).trim());
        } catch (_) {
          // If it's not JSON wrapper, just return raw stdout
          resolve((stdout || '').trim());
        }
      }
    );
  });
}

/**
 * Try to parse a JSON object out of Claude's text response.
 * Claude sometimes wraps JSON in markdown fences — strip those first.
 */
function extractJson(text) {
  try {
    let cleaned = (text || '').trim()
      .replace(/^```(?:json)?\s*/im, '')
      .replace(/\s*```\s*$/m, '')
      .trim();
    const first = cleaned.indexOf('{');
    const last = cleaned.lastIndexOf('}');
    if (first !== -1 && last > first) cleaned = cleaned.slice(first, last + 1);
    return JSON.parse(cleaned);
  } catch (_) {
    return {};
  }
}

/**
 * Render an HTML string to a PDF buffer using Puppeteer (headless Chrome).
 * Falls back to the `chromium-browser` CLI if Puppeteer is not installed.
 */
async function renderHtmlToPdf(html) {
  // Try puppeteer
  try {
    const puppeteer = require('puppeteer');
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      headless: 'new',
    });
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '0', bottom: '0', left: '0', right: '0' },
      });
      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  } catch (puppeteerErr) {
    console.warn('[html-to-pdf] puppeteer unavailable, trying chromium CLI:', puppeteerErr.message);
    return renderWithChromiumCli(html);
  }
}

function renderWithChromiumCli(html) {
  return new Promise((resolve, reject) => {
    const tmpDir = os.tmpdir();
    const htmlFile = path.join(tmpDir, `report-${Date.now()}.html`);
    const pdfFile = path.join(tmpDir, `report-${Date.now()}.pdf`);
    fs.writeFileSync(htmlFile, html);

    const chromeBin = process.env.CHROMIUM_PATH
      || findChromium()
      || 'chromium-browser';

    execFile(
      chromeBin,
      ['--headless', '--no-sandbox', '--disable-gpu', `--print-to-pdf=${pdfFile}`, `file://${htmlFile}`],
      { timeout: 45000 },
      (err) => {
        fs.unlink(htmlFile, () => {});
        if (err) {
          fs.unlink(pdfFile, () => {});
          return reject(new Error(`Chromium CLI failed: ${err.message}`));
        }
        const pdf = fs.readFileSync(pdfFile);
        fs.unlink(pdfFile, () => {});
        resolve(pdf);
      }
    );
  });
}

function findChromium() {
  const candidates = [
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Nexaproc gateway ready on :${PORT}`);
  if (!MASTER_KEY) {
    console.warn('⚠️  NEXAPROC_MASTER_KEY is not set — all authenticated routes will return 500.');
  }
});
