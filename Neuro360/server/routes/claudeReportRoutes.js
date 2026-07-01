const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const axios = require('axios');
const { sidecarAuth } = require('../middleware/sidecarAuth');
const { extractReportSource, postLesson, GATEWAY_URL } = require('../services/nexaprocService');
const { buildReportDataFromSource } = require('../services/claudeReportData');
const { generateBrainReportPdf } = require('../services/claudeReportGenerator');
const SupabaseStorage = require('../services/supabaseStorage');

const router = express.Router();

// GET /api/qeeg/claude-report/health — proxy VPS sidecar health (no auth, read-only)
router.get('/health', async (req, res) => {
  try {
    const response = await axios.get(`${GATEWAY_URL}/health`, { timeout: 6000 });
    res.json({ ok: true, ...response.data });
  } catch (error) {
    res.status(503).json({ ok: false, error: error.message });
  }
});

// Gateway caps the JSON body ~1MB; keep extracted text well under it.
const MAX_TEXT_CHARS = 200000;

// PDF upload to a temp file (text extracted, then deleted).
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `claude-report-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || path.extname(file.originalname).toLowerCase() === '.pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
});

/**
 * POST /api/qeeg/claude-report
 * Upload an ALREADY-GENERATED brain/qEEG report PDF (field "pdf"). We read its
 * text, have VPS Claude transcribe the numbers + write the narrative, build the
 * report data deterministically, and return the polished 12-page "Brain Type &
 * Performance Report" PDF. Auth: static long-lived CLAUDE_REPORT_TOKEN.
 */
// Human-readable label for each streamed stage (frontend shows these verbatim).
const STAGE_LABELS = {
  reading: 'Reading the document…',
  extract: 'Claude is reading your numbers…',
  build: 'Building your report…',
  narrative: 'Claude is writing your report…',
  render: 'Rendering the 12-page PDF…',
  saving: 'Saving your report…',
};
const STAGE_PCT = { reading: 10, extract: 25, build: 55, narrative: 60, render: 88, saving: 95 };

function parseJsonField(value) {
  if (!value || typeof value !== 'string') return null;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch (_) {
    return null;
  }
}

function hasAnyValue(obj) {
  return !!obj && Object.values(obj).some((v) => v !== null && v !== undefined);
}

function mergeReportSources(extractedSource, clientSource) {
  const extracted = extractedSource && typeof extractedSource === 'object' ? extractedSource : {};
  const client = clientSource && typeof clientSource === 'object' ? clientSource : {};

  return {
    ...extracted,
    ...client,
    patient: {
      ...(extracted.patient || {}),
      ...(client.patient || {}),
      // The uploaded NeuroSense PDF is the authority for the printed assessment
      // date / report id. The client-side source is primarily for scores.
      assessmentDate: extracted.patient?.assessmentDate || client.patient?.assessmentDate || null,
      reportId: extracted.patient?.reportId || client.patient?.reportId || null,
    },
    brainwave: {
      ...(client.brainwave || {}),
      ...(extracted.brainwave || {}),
    },
    markers: {
      ...(extracted.markers || {}),
      ...(client.markers || {}),
    },
    deepDive: {
      ...(extracted.deepDive || {}),
      ...(client.deepDive || {}),
    },
  };
}

router.post('/', sidecarAuth, upload.single('pdf'), async (req, res) => {
  const tempPath = req.file?.path;

  // The "no file" guard stays plain JSON — emitted BEFORE we switch to SSE.
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'A PDF file (field "pdf") is required.' });
  }

  // Switch the response to Server-Sent Events so the frontend can show live,
  // stage-by-stage progress instead of a featureless spinner. Once these headers
  // are flushed we can no longer set an HTTP status, so ALL outcomes (including
  // errors) travel as `event:` frames; the client treats `error`/no-`done` as failure.
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no', // disable proxy buffering (Render/nginx) so events stream live
  });
  res.flushHeaders?.();

  const send = (event, data) => {
    try {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    } catch (_) { /* client gone — ignore */ }
  };
  const progress = (stage) => send('progress', { stage, label: STAGE_LABELS[stage], pct: STAGE_PCT[stage] });

  // Keep the connection alive through the long (30-60s) Claude calls so the
  // proxy doesn't drop an idle stream.
  const heartbeat = setInterval(() => {
    try { res.write(`: ping\n\n`); } catch (_) { /* ignore */ }
  }, 15000);
  let clientGone = false;
  req.on('close', () => { clientGone = true; clearInterval(heartbeat); });

  try {
    // Extract the uploaded report's text (fast; the values are textual).
    progress('reading');
    let text;
    try {
      const parsed = await pdfParse(fs.readFileSync(tempPath));
      text = (parsed.text || '').trim();
    } catch (e) {
      throw new Error(`Failed to read the PDF: ${e.message}`);
    }
    if (!text) {
      throw new Error('No extractable text found in the PDF (it may be a scanned image).');
    }
    if (text.length > MAX_TEXT_CHARS) text = text.slice(0, MAX_TEXT_CHARS);

    const clientSource = parseJsonField(req.body && req.body.reportSource);

    // Call 1: transcribe context off the uploaded report (fast, small output).
    // If the browser sent result-card data, those scores override the PDF/Claude
    // transcription below. The transcription is only fallback/context.
    progress('extract');
    let extractedSource = null;
    try {
      extractedSource = await extractReportSource(text);
    } catch (extractError) {
      if (!clientSource) throw extractError;
      console.warn('[Claude Report] PDF number transcription failed; using client result-card source:', extractError.message);
    }
    if (extractedSource) {
      const idMatch = text.match(/\bNS-\d{5,}\b/i);
      if (idMatch) {
        extractedSource.patient = { ...(extractedSource.patient || {}), reportId: idMatch[0].toUpperCase() };
      }
    }
    const source = mergeReportSources(extractedSource, clientSource);
    if (!hasAnyValue(source.markers)) {
      throw new Error('Could not read the report: no performance scores were found in the uploaded PDF or result-card source.');
    }

    // Official per-parameter display percentages computed by the caller from the
    // result-card score mapping. When present, the snapshot bars use these exact
    // numbers instead of any recalculation.
    let displayPercents = null;
    if (req.body && req.body.displayPercents) {
      displayPercents = parseJsonField(req.body.displayPercents);
    }

    // Deterministic build (derives %s, statuses, 5-type classification, profile).
    progress('build');
    const reportData = buildReportDataFromSource(source, {
      name: (req.body && req.body.patientName) || undefined,
      id: (req.body && req.body.patientId) || undefined,
      clinicName: (req.body && req.body.clinicName) || undefined,
    }, displayPercents);

    // Call 2 (inside): fetch the doctor-readable narrative, then render to PDF.
    // onProgress fires 'narrative' then 'render' from inside the generator.
    const { pdf } = await generateBrainReportPdf(reportData, undefined, progress);

    // Storage key + download name use the report id (e.g. NS-1773769 -> 1773769)
    // so files are short and unique per patient+assessment: NPR-<id>-<ts>.pdf.
    const reportIdDigits = String(reportData.patient.reportId || '').replace(/\D/g, '');
    const base = reportIdDigits
      ? `NPR-${reportIdDigits}`
      : (reportData.patient.name || req.file.originalname || 'report').replace(/[^a-z0-9]/gi, '-');

    // Upload the generated PDF to the same 'neurosense-reports' bucket the QEEG
    // flow uses, then stream its public URL in the terminal `done` event. A
    // shareable URL lets the Claude report flow through the same addReport +
    // email path as NeuroSense. (uploadFile reads from disk, so write first.)
    progress('saving');
    const outPath = path.join(__dirname, '../uploads', `claude-report-out-${Date.now()}-${Math.round(Math.random() * 1e9)}.pdf`);
    try {
      fs.writeFileSync(outPath, pdf);
      const uploadResult = await SupabaseStorage.uploadFile(outPath, 'neurosense-reports', `claude-reports/${base}-${Date.now()}.pdf`);
      if (!uploadResult || !uploadResult.url) {
        throw new Error('Supabase upload returned an invalid result');
      }
      console.log('🔗 Claude Report uploaded to Supabase:', uploadResult.url);
      send('done', { success: true, pdfUrl: uploadResult.url, reportId: reportData.patient.reportId });
    } finally {
      fs.unlink(outPath, () => {});
    }
  } catch (error) {
    console.error('[Claude Report] Error:', error.message);
    postLesson('report-generation', error.message,
      `Report generation failed: "${error.message}". Investigate root cause and prevent recurrence.`);
    if (!clientGone) send('error', { success: false, message: error.message });
  } finally {
    clearInterval(heartbeat);
    if (tempPath) fs.unlink(tempPath, () => {});
    try { res.end(); } catch (_) { /* ignore */ }
  }
});

module.exports = router;
