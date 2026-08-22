#!/usr/bin/env node
/**
 * Tests for services/reportAiProvider.js (REPORT_AI_PROVIDER toggle for the
 * NeuroSense Performance Report pipeline).
 *
 * Run from Neuro360/server:
 *     node __tests__/reportAiProvider.test.js
 *
 * No test framework is installed in this repo (no jest/vitest/mocha binary in
 * server/node_modules, and the repo root has no node_modules at all), so this is
 * a plain node script using node:assert. Module-level mocking is done by
 * pre-seeding require.cache for '@google/generative-ai', './geminiRateLimiter',
 * and './nexaprocService' BEFORE requiring the module under test — the real
 * Gemini SDK and rate limiter are never loaded, and no network call is possible.
 *
 * Timers: global setTimeout is clamped to <=5ms (real delays are recorded, then
 * shortened) so the 429/503 backoff sleeps (5-60s) and the 180s per-attempt race
 * timeout all run in milliseconds while the requested delays stay assertable.
 */

const assert = require('assert');
const path = require('path');

// ---------------------------------------------------------------------------
// Timer clamping
// ---------------------------------------------------------------------------
const realSetTimeout = global.setTimeout;
const requestedDelays = [];
global.setTimeout = (fn, ms, ...rest) => {
  requestedDelays.push(typeof ms === 'number' ? ms : 0);
  return realSetTimeout(fn, Math.min(typeof ms === 'number' ? ms : 0, 5), ...rest);
};
const retryDelaysSince = (marker) =>
  requestedDelays.slice(marker).filter((d) => d !== 180000); // 180000 = per-attempt race timeout
const timeoutArmsSince = (marker) =>
  requestedDelays.slice(marker).filter((d) => d === 180000).length;

// ---------------------------------------------------------------------------
// Module ids (resolved, never executed, from this file's own resolution paths —
// identical cache keys to what services/reportAiProvider.js resolves to)
// ---------------------------------------------------------------------------
const GENAI_ID = require.resolve('@google/generative-ai');
const RATE_ID = require.resolve('../services/geminiRateLimiter');
const NEXA_ID = require.resolve('../services/nexaprocService');
const PROVIDER_ID = require.resolve('../services/reportAiProvider');
const GEN_ID = require.resolve('../services/claudeReportGenerator');
const TEMPLATE_ID = require.resolve('../templates/brainReport12Page');
const EMOJI_ID = require.resolve('../utils/inlineEmojis');

// Load the REAL nexaprocService once (pure-refactor export check below) before
// its cache entry is replaced with a stub. It only requires axios at load time
// and makes no network calls on import.
const realNexaproc = require('../services/nexaprocService');

function inject(id, exports) {
  require.cache[id] = { id, filename: id, loaded: true, exports };
}

// ---------------------------------------------------------------------------
// Mutable mock state, reset per test
// ---------------------------------------------------------------------------
let state;
function resetState() {
  state = {
    // google sdk
    constructedWith: [],
    modelConfigs: [],
    generateContentCalls: [], // prompts
    handler: null, // async (prompt, callNo) => rawText or throws
    defaultText: '{}',
    // rate limiter
    rateWaits: 0,
    rateLimitError: null,
    records: 0,
    dailyRemaining: 50,
    // nexaproc stub
    nexaExtractCalls: [],
    nexaExtractResult: { markers: { cognition: 67 } },
    nexaNarrativeCalls: [],
    nexaNarrativeResult: { snapshotSummary: 'from claude' },
    buildExtractCalls: [],
    buildNarrativeCalls: [],
    fetchExamplesCalls: 0,
    examples: [],
    saveCalls: [],
  };
}

function installMocks() {
  inject(GENAI_ID, {
    GoogleGenerativeAI: class {
      constructor(apiKey) {
        state.constructedWith.push(apiKey);
      }
      getGenerativeModel(config) {
        state.modelConfigs.push(config);
        return {
          generateContent: async (prompt) => {
            const callNo = state.generateContentCalls.push(prompt);
            const text = state.handler
              ? await state.handler(prompt, callNo)
              : state.defaultText;
            // the real SDK's response.text() returns a string synchronously
            return { response: { text: () => text } };
          },
        };
      }
    },
  });

  inject(RATE_ID, {
    waitForRateLimit: async () => {
      state.rateWaits += 1;
      if (state.rateLimitError) throw state.rateLimitError;
    },
    recordRequest: () => {
      state.records += 1;
    },
    getQuotaStatus: () => ({ dailyRemaining: state.dailyRemaining }),
  });

  inject(NEXA_ID, {
    extractReportSource: async (pdfText) => {
      state.nexaExtractCalls.push(pdfText);
      return state.nexaExtractResult;
    },
    generateReportNarrative: async (reportData) => {
      state.nexaNarrativeCalls.push(reportData);
      return state.nexaNarrativeResult;
    },
    buildExtractSourcePrompt: (pdfText) => {
      state.buildExtractCalls.push(pdfText);
      return `EXTRACT_PROMPT<${pdfText}>`;
    },
    buildNarrativePrompt: (reportData, learnedExamples) => {
      state.buildNarrativeCalls.push({ reportData, learnedExamples });
      return 'NARRATIVE_PROMPT<built>';
    },
    fetchReportExamples: async () => {
      state.fetchExamplesCalls += 1;
      return state.examples;
    },
    saveReportExample: (narrative, meta) => {
      state.saveCalls.push({ narrative, meta });
    },
  });
}

// Fresh module instance of reportAiProvider (its reportModel is a lazy
// singleton held in module state, so each test needs a clean require).
function loadProvider({ provider, apiKey = 'test-key-123' } = {}) {
  resetState();
  delete require.cache[PROVIDER_ID];
  delete require.cache[GENAI_ID]; // never let the real SDK slip in
  delete process.env.REPORT_AI_PROVIDER;
  if (provider !== undefined) process.env.REPORT_AI_PROVIDER = provider;
  if (apiKey === null) delete process.env.GEMINI_API_KEY;
  else process.env.GEMINI_API_KEY = apiKey;
  installMocks();
  return require(PROVIDER_ID);
}

function quotaError() {
  const e = new Error('Gemini daily quota exceeded (GEMINI_DAILY_LIMIT)');
  e.code = 'GEMINI_DAILY_QUOTA_EXCEEDED';
  return e;
}

// ---------------------------------------------------------------------------
// Tiny harness
// ---------------------------------------------------------------------------
let passed = 0;
let failed = 0;
const failures = [];
async function test(name, fn) {
  try {
    await fn();
    passed += 1;
    console.log(`  ok   ${name}`);
  } catch (e) {
    failed += 1;
    failures.push({ name, e });
    console.log(`  FAIL ${name}`);
    console.log(`       ${e && e.message ? e.message.split('\n')[0] : e}`);
  }
}
function section(title) {
  console.log(`\n# ${title}`);
}

(async () => {
  // =========================================================================
  section('getReportAiProvider — env parsing');

  await test('defaults to gemini when REPORT_AI_PROVIDER is unset', async () => {
    const p = loadProvider();
    assert.strictEqual(p.getReportAiProvider(), 'gemini');
  });

  await test('defaults to gemini when REPORT_AI_PROVIDER is empty string', async () => {
    const p = loadProvider({ provider: '' });
    assert.strictEqual(p.getReportAiProvider(), 'gemini');
  });

  await test("exact 'claude' selects the claude path", async () => {
    const p = loadProvider({ provider: 'claude' });
    assert.strictEqual(p.getReportAiProvider(), 'claude');
  });

  await test('case-insensitive: CLAUDE / Claude select claude', async () => {
    assert.strictEqual(loadProvider({ provider: 'CLAUDE' }).getReportAiProvider(), 'claude');
    assert.strictEqual(loadProvider({ provider: 'Claude' }).getReportAiProvider(), 'claude');
  });

  await test('whitespace-tolerant: "  claude \\t" selects claude', async () => {
    const p = loadProvider({ provider: '  claude \t' });
    assert.strictEqual(p.getReportAiProvider(), 'claude');
  });

  await test('whitespace-only value falls back to gemini', async () => {
    const p = loadProvider({ provider: '   ' });
    assert.strictEqual(p.getReportAiProvider(), 'gemini');
  });

  await test("explicit 'gemini' stays gemini", async () => {
    const p = loadProvider({ provider: 'gemini' });
    assert.strictEqual(p.getReportAiProvider(), 'gemini');
  });

  await test('garbage values fall back to gemini (gpt-4, claude-sonnet, 1, true)', async () => {
    for (const bad of ['gpt-4', 'claude-sonnet', 'anthropic', '1', 'true']) {
      assert.strictEqual(
        loadProvider({ provider: bad }).getReportAiProvider(),
        'gemini',
        `expected gemini for ${JSON.stringify(bad)}`
      );
    }
  });

  await test('exports REPORT_GEMINI_MODEL pinned to gemini-2.5-flash', async () => {
    const p = loadProvider();
    assert.strictEqual(p.REPORT_GEMINI_MODEL, 'gemini-2.5-flash');
    assert.strictEqual(typeof p.extractReportSource, 'function');
    assert.strictEqual(typeof p.generateReportNarrative, 'function');
  });

  // =========================================================================
  section('lazy Gemini model — boot safety and pinned config');

  await test('requiring the module without GEMINI_API_KEY does not throw', async () => {
    const p = loadProvider({ apiKey: null });
    assert.ok(p, 'module must load even when the key is missing');
    assert.strictEqual(state.constructedWith.length, 0);
  });

  await test('gemini-path call without key rejects with a clear message at call time', async () => {
    const p = loadProvider({ apiKey: null });
    await assert.rejects(
      () => p.extractReportSource('some pdf text'),
      /GEMINI_API_KEY is not set/
    );
    assert.strictEqual(state.generateContentCalls.length, 0);
  });

  await test('builds the model with the pinned deterministic config on first call', async () => {
    const p = loadProvider();
    state.defaultText = '{"markers":{"cognition":67}}';
    await p.extractReportSource('pdf text');
    assert.deepStrictEqual(state.constructedWith, ['test-key-123']);
    assert.strictEqual(state.modelConfigs.length, 1);
    const cfg = state.modelConfigs[0];
    assert.strictEqual(cfg.model, 'gemini-2.5-flash');
    assert.deepStrictEqual(cfg.generationConfig, {
      temperature: 0,
      topK: 1,
      topP: 1,
      maxOutputTokens: 8192,
      responseMimeType: 'application/json',
      thinkingConfig: { thinkingBudget: 0 },
    });
  });

  await test('model is a singleton — second call reuses it', async () => {
    const p = loadProvider();
    state.defaultText = '{"markers":{"cognition":67}}';
    await p.extractReportSource('one');
    await p.extractReportSource('two');
    assert.strictEqual(state.modelConfigs.length, 1);
    assert.strictEqual(state.constructedWith.length, 1);
  });

  await test('goes through the shared rate limiter (wait before, record before call)', async () => {
    const p = loadProvider();
    state.defaultText = '{"markers":{}}';
    await p.extractReportSource('x');
    assert.strictEqual(state.rateWaits, 1);
    assert.strictEqual(state.records, 1);
  });

  // =========================================================================
  section('extractReportSource — claude path delegation');

  await test('REPORT_AI_PROVIDER=claude delegates to nexaproc.extractReportSource', async () => {
    const p = loadProvider({ provider: 'claude' });
    const result = await p.extractReportSource('PDF TEXT A');
    assert.strictEqual(result, state.nexaExtractResult);
    assert.deepStrictEqual(state.nexaExtractCalls, ['PDF TEXT A']);
  });

  await test('claude path never touches Gemini (no key needed, no SDK built, no prompt built)', async () => {
    const p = loadProvider({ provider: 'claude', apiKey: null });
    await p.extractReportSource('PDF TEXT');
    assert.strictEqual(state.constructedWith.length, 0);
    assert.strictEqual(state.generateContentCalls.length, 0);
    assert.strictEqual(state.buildExtractCalls.length, 0);
  });

  // =========================================================================
  section('extractReportSource — gemini path source-shape semantics');

  await test('parsed object carrying markers is returned as-is', async () => {
    const p = loadProvider();
    const src = { markers: { stressRegulation: 100, cognition: 67 }, deepDive: {} };
    state.defaultText = JSON.stringify(src);
    assert.deepStrictEqual(await p.extractReportSource('t'), src);
  });

  await test('parsed object carrying only deepDive is returned as-is', async () => {
    const p = loadProvider();
    const src = { deepDive: { alphaPeak: 11.6 } };
    state.defaultText = JSON.stringify(src);
    assert.deepStrictEqual(await p.extractReportSource('t'), src);
  });

  await test('a {source:{...}} wrapper is unwrapped to the inner object', async () => {
    const p = loadProvider();
    const inner = { markers: { focusAttention: 80 } };
    state.defaultText = JSON.stringify({ source: inner });
    assert.deepStrictEqual(await p.extractReportSource('t'), inner);
  });

  await test('markdown-fenced json is still parsed', async () => {
    const p = loadProvider();
    const src = { markers: { learning: 33 } };
    state.defaultText = '```json\n' + JSON.stringify(src) + '\n```';
    assert.deepStrictEqual(await p.extractReportSource('t'), src);
  });

  await test('json embedded in surrounding prose is extracted', async () => {
    const p = loadProvider();
    const src = { markers: { creativity: 50 } };
    state.defaultText = `Sure! Here is the transcription you asked for: ${JSON.stringify(src)} — hope that helps.`;
    assert.deepStrictEqual(await p.extractReportSource('t'), src);
  });

  await test('non-JSON reply yields null (not a throw)', async () => {
    const p = loadProvider();
    state.defaultText = 'I cannot read this report.';
    assert.strictEqual(await p.extractReportSource('t'), null);
  });

  await test('JSON array reply yields null', async () => {
    const p = loadProvider();
    state.defaultText = '[1,2,3]';
    assert.strictEqual(await p.extractReportSource('t'), null);
  });

  await test('scalar / null JSON replies yield null', async () => {
    const p = loadProvider();
    state.defaultText = '42';
    assert.strictEqual(await p.extractReportSource('t'), null);
    state.defaultText = 'null';
    assert.strictEqual(await p.extractReportSource('t'), null);
  });

  await test('parsed object with no markers/deepDive/source yields null', async () => {
    const p = loadProvider();
    state.defaultText = '{"foo": 1}';
    assert.strictEqual(await p.extractReportSource('t'), null);
  });

  await test('gemini call receives exactly nexaproc.buildExtractSourcePrompt(pdfText)', async () => {
    const p = loadProvider();
    state.defaultText = '{"markers":{}}';
    await p.extractReportSource('THE PDF TEXT');
    assert.deepStrictEqual(state.buildExtractCalls, ['THE PDF TEXT']);
    assert.deepStrictEqual(state.generateContentCalls, ['EXTRACT_PROMPT<THE PDF TEXT>']);
  });

  // =========================================================================
  section('gemini error semantics — quota, retry, timeout');

  await test('pre-flight: dailyRemaining < 2 fails fast with a tagged quota error', async () => {
    const p = loadProvider();
    state.dailyRemaining = 1;
    await assert.rejects(
      () => p.extractReportSource('t'),
      (err) =>
        err.code === 'GEMINI_DAILY_QUOTA_EXCEEDED' &&
        /a report needs 2/.test(err.message) &&
        /\(1 request\(s\) left/.test(err.message)
    );
    assert.strictEqual(state.generateContentCalls.length, 0, 'no API call after pre-flight failure');
    assert.strictEqual(state.rateWaits, 0, 'pre-flight fires before the limiter wait');
  });

  await test('pre-flight: dailyRemaining 0 reports 0 left and fails fast', async () => {
    const p = loadProvider();
    state.dailyRemaining = 0;
    await assert.rejects(
      () => p.extractReportSource('t'),
      (err) => err.code === 'GEMINI_DAILY_QUOTA_EXCEEDED' && /\(0 request\(s\) left/.test(err.message)
    );
  });

  await test('pre-flight: dailyRemaining exactly 2 lets the call through', async () => {
    const p = loadProvider();
    state.dailyRemaining = 2;
    state.defaultText = '{"markers":{"cognition":67}}';
    assert.deepStrictEqual(await p.extractReportSource('t'), { markers: { cognition: 67 } });
    assert.strictEqual(state.generateContentCalls.length, 1);
  });

  await test('a Google-side quota rejection is tagged and never retried', async () => {
    const p = loadProvider();
    state.handler = async () => {
      const e = new Error('RESOURCE_EXHAUSTED: Quota exceeded for gemini-2.5-flash');
      throw e;
    };
    await assert.rejects(
      () => p.extractReportSource('t'),
      (err) => err.code === 'GEMINI_DAILY_QUOTA_EXCEEDED' && /RESOURCE_EXHAUSTED/.test(err.message)
    );
    assert.strictEqual(state.generateContentCalls.length, 1, 'quota rejection must not be retried');
    assert.strictEqual(state.records, 1, 'the sent attempt still counts against the daily budget');
  });

  await test('GEMINI_DAILY_QUOTA_EXCEEDED from the rate limiter propagates and is never retried', async () => {
    const p = loadProvider();
    state.rateLimitError = quotaError();
    await assert.rejects(
      () => p.extractReportSource('t'),
      (err) => err.code === 'GEMINI_DAILY_QUOTA_EXCEEDED'
    );
    assert.strictEqual(state.rateWaits, 1, 'quota must not be retried');
    assert.strictEqual(state.generateContentCalls.length, 0, 'no API call on quota exhaustion');
  });

  await test('429 twice then success: 3 attempts, 10s/20s backoff, every attempt recorded', async () => {
    const p = loadProvider();
    const marker = requestedDelays.length;
    state.handler = async (_prompt, callNo) => {
      if (callNo < 3) throw new Error('Google API error: 429 resource exhausted');
      return '{"markers":{"cognition":67}}';
    };
    const out = await p.extractReportSource('t');
    assert.deepStrictEqual(out, { markers: { cognition: 67 } });
    assert.strictEqual(state.generateContentCalls.length, 3);
    assert.deepStrictEqual(retryDelaysSince(marker), [10000, 20000]);
    assert.strictEqual(state.records, 3, 'recordRequest fires before every sent attempt');
    assert.strictEqual(state.rateWaits, 3, 'one limiter wait per attempt');
    assert.strictEqual(timeoutArmsSince(marker), 3, 'each attempt arms the 180s race');
  });

  await test('503 is retryable with the 5s base backoff', async () => {
    const p = loadProvider();
    const marker = requestedDelays.length;
    state.handler = async (_prompt, callNo) => {
      if (callNo === 1) throw new Error('upstream 503 unavailable');
      return '{"deepDive":{"alphaPeak":10.7}}';
    };
    assert.deepStrictEqual(await p.extractReportSource('t'), { deepDive: { alphaPeak: 10.7 } });
    assert.strictEqual(state.generateContentCalls.length, 2);
    assert.deepStrictEqual(retryDelaysSince(marker), [5000]);
  });

  await test('non-retryable error (400) throws immediately after one attempt', async () => {
    const p = loadProvider();
    const marker = requestedDelays.length;
    state.handler = async () => {
      throw new Error('Invalid JSON payload: 400 Bad Request');
    };
    await assert.rejects(() => p.extractReportSource('t'), /400 Bad Request/);
    assert.strictEqual(state.generateContentCalls.length, 1);
    assert.deepStrictEqual(retryDelaysSince(marker), []);
    assert.strictEqual(state.records, 1, 'the sent (failed) attempt still counts');
  });

  await test('exhausted retries on 429 throw the last error (3 attempts max)', async () => {
    const p = loadProvider();
    state.handler = async () => {
      throw new Error('429 resource exhausted');
    };
    await assert.rejects(() => p.extractReportSource('t'), /429 resource exhausted/);
    assert.strictEqual(state.generateContentCalls.length, 3);
  });

  await test('a hung call is cut by the 180s per-attempt timeout and not retried', async () => {
    const p = loadProvider();
    state.handler = () => new Promise(() => {}); // never settles
    await assert.rejects(() => p.extractReportSource('t'), /Gemini extract timed out after 180s/);
    assert.strictEqual(state.generateContentCalls.length, 1, 'timeout error is not retryable');
  });

  // =========================================================================
  section('generateReportNarrative — claude path delegation');

  await test('REPORT_AI_PROVIDER=claude delegates to nexaproc.generateReportNarrative', async () => {
    const p = loadProvider({ provider: 'claude' });
    const reportData = { patient: { name: 'A' } };
    const result = await p.generateReportNarrative(reportData);
    assert.strictEqual(result, state.nexaNarrativeResult);
    assert.deepStrictEqual(state.nexaNarrativeCalls, [reportData]);
  });

  await test('claude narrative path makes no Gemini calls and no example-store calls', async () => {
    const p = loadProvider({ provider: 'claude', apiKey: null });
    await p.generateReportNarrative({});
    assert.strictEqual(state.constructedWith.length, 0);
    assert.strictEqual(state.generateContentCalls.length, 0);
    assert.strictEqual(state.fetchExamplesCalls, 0);
    assert.strictEqual(state.saveCalls.length, 0);
  });

  // =========================================================================
  section('generateReportNarrative — gemini path');

  const sampleReportData = () => ({
    patient: { name: 'Test Patient', assessmentDate: '2026-08-01' },
    brainType: { name: 'Cautious' },
    scores: { overall: 14 },
  });

  await test('returns the parsed narrative and saves it as a learned example', async () => {
    const p = loadProvider();
    const narrative = { snapshotSummary: 'hello', closing: 'bye' };
    state.defaultText = JSON.stringify(narrative);
    const out = await p.generateReportNarrative(sampleReportData());
    assert.deepStrictEqual(out, narrative);
    assert.strictEqual(state.saveCalls.length, 1);
    assert.deepStrictEqual(state.saveCalls[0].narrative, narrative);
    assert.deepStrictEqual(state.saveCalls[0].meta, {
      name: 'Test Patient',
      assessmentDate: '2026-08-01',
      brainType: 'Cautious',
    });
  });

  await test('prompt is built from reportData + fetched learned examples, then sent to gemini', async () => {
    const p = loadProvider();
    state.examples = ['example-one', 'example-two'];
    state.defaultText = '{"snapshotSummary":"s"}';
    const reportData = sampleReportData();
    await p.generateReportNarrative(reportData);
    assert.strictEqual(state.fetchExamplesCalls, 1);
    assert.strictEqual(state.buildNarrativeCalls.length, 1);
    // Cost guardrail: at most ONE learned example reaches the prompt.
    assert.deepStrictEqual(state.buildNarrativeCalls[0], {
      reportData,
      learnedExamples: ['example-one'],
    });
    assert.deepStrictEqual(state.generateContentCalls, ['NARRATIVE_PROMPT<built>']);
  });

  await test('cost guardrail: extract input is capped at 40k chars (huge PDFs cannot blow the ₹1 budget)', async () => {
    const p = loadProvider();
    state.defaultText = '{"markers":{}}';
    const huge = 'x'.repeat(60000) + 'SENTINEL-AFTER-CAP';
    await p.extractReportSource(huge);
    const sentPrompt = state.generateContentCalls[0];
    assert.ok(sentPrompt.length < 60000 + 3000, 'prompt must not embed the full 60k-char text');
    assert.ok(!sentPrompt.includes('SENTINEL-AFTER-CAP'), 'text beyond the cap must be dropped');
    // And a normal-sized text passes through untouched.
    await p.extractReportSource('short text SENTINEL-KEPT');
    assert.ok(state.generateContentCalls[1].includes('SENTINEL-KEPT'));
  });

  await test('unparseable narrative reply returns {} and saves nothing', async () => {
    const p = loadProvider();
    state.defaultText = 'not json at all';
    const out = await p.generateReportNarrative(sampleReportData());
    assert.deepStrictEqual(out, {});
    assert.strictEqual(state.saveCalls.length, 0);
  });

  await test('empty-object narrative ({}) returns {} and saves nothing', async () => {
    const p = loadProvider();
    state.defaultText = '{}';
    const out = await p.generateReportNarrative(sampleReportData());
    assert.deepStrictEqual(out, {});
    assert.strictEqual(state.saveCalls.length, 0);
  });

  await test('learned-example metadata falls back to Unknown/empty strings', async () => {
    const p = loadProvider();
    state.defaultText = '{"snapshotSummary":"s"}';
    await p.generateReportNarrative({});
    assert.deepStrictEqual(state.saveCalls[0].meta, {
      name: 'Unknown',
      assessmentDate: '',
      brainType: '',
    });
  });

  await test('quota exhaustion propagates out of the narrative call (no swallow)', async () => {
    const p = loadProvider();
    state.rateLimitError = quotaError();
    await assert.rejects(
      () => p.generateReportNarrative(sampleReportData()),
      (err) => err.code === 'GEMINI_DAILY_QUOTA_EXCEEDED'
    );
    assert.strictEqual(state.saveCalls.length, 0);
  });

  // =========================================================================
  section('nexaprocService — pure-refactor prompt builders (real module)');

  await test('exports buildNarrativePrompt and buildExtractSourcePrompt as functions', async () => {
    assert.strictEqual(typeof realNexaproc.buildNarrativePrompt, 'function');
    assert.strictEqual(typeof realNexaproc.buildExtractSourcePrompt, 'function');
    assert.strictEqual(typeof realNexaproc.extractReportSource, 'function');
    assert.strictEqual(typeof realNexaproc.generateReportNarrative, 'function');
  });

  await test('buildExtractSourcePrompt is pure: embeds the report text, no network', async () => {
    const prompt = realNexaproc.buildExtractSourcePrompt('TOKEN-PDF-123');
    assert.ok(typeof prompt === 'string');
    assert.ok(prompt.includes('TOKEN-PDF-123'));
    assert.ok(prompt.includes('TRANSCRIBE'));
  });

  await test('buildNarrativePrompt embeds the report data JSON and learned examples', async () => {
    const prompt = realNexaproc.buildNarrativePrompt({ alpha: 1.5 }, ['EX-A', 'EX-B']);
    assert.ok(typeof prompt === 'string');
    assert.ok(prompt.includes('"alpha": 1.5'));
    assert.ok(prompt.includes('EX-A'));
    assert.ok(prompt.includes('EX-B'));
  });

  // =========================================================================
  section('claudeReportGenerator — quota rethrow from the narrative catch');

  function loadGenerator({ narrativeImpl }) {
    resetState();
    delete require.cache[GEN_ID];
    inject(PROVIDER_ID, { generateReportNarrative: narrativeImpl });
    inject(NEXA_ID, {
      renderHtmlOnVps: async () => Buffer.from('FAKE-PDF'),
      postLesson: (...args) => {
        state.lessons = state.lessons || [];
        state.lessons.push(args);
      },
    });
    inject(TEMPLATE_ID, {
      renderReportHtml: (reportData, prose) => {
        state.renderedWith = { reportData, prose };
        return '<HTML>';
      },
    });
    inject(EMOJI_ID, { inlineEmojis: (s) => s });
    return require(GEN_ID);
  }

  await test('GEMINI_DAILY_QUOTA_EXCEEDED is rethrown, not swallowed into framework copy', async () => {
    const gen = loadGenerator({
      narrativeImpl: async () => {
        throw quotaError();
      },
    });
    await assert.rejects(
      () =>
        gen.generateBrainReportPdf(
          { brainType: { name: 'Cautious' }, patient: { name: 'X' } },
          undefined
        ),
      (err) => err.code === 'GEMINI_DAILY_QUOTA_EXCEEDED'
    );
    assert.ok(!state.lessons || state.lessons.length === 0, 'must not post a lesson for quota failure');
    assert.strictEqual(state.renderedWith, undefined, 'must not render after quota failure');
  });

  await test('any other narrative error degrades to framework copy and still renders the PDF', async () => {
    const gen = loadGenerator({
      narrativeImpl: async () => {
        throw new Error('gateway hiccup');
      },
    });
    const reportData = { brainType: { name: 'Balanced' }, patient: { name: 'Y' } };
    const result = await gen.generateBrainReportPdf(reportData, undefined);
    assert.ok(Buffer.isBuffer(result.pdf));
    assert.deepStrictEqual(result.narrative, {});
    assert.deepStrictEqual(state.renderedWith.prose, {});
    assert.strictEqual(state.lessons.length, 1);
    assert.strictEqual(state.lessons[0][0], 'narrative');
    assert.match(state.lessons[0][1], /gateway hiccup/);
  });

  await test('a pre-fetched narrative skips the AI call entirely', async () => {
    let called = 0;
    const gen = loadGenerator({
      narrativeImpl: async () => {
        called += 1;
        return {};
      },
    });
    const narrative = { snapshotSummary: 'prefetched' };
    const result = await gen.generateBrainReportPdf(
      { brainType: { name: 'Cautious' }, patient: { name: 'Z' } },
      narrative
    );
    assert.strictEqual(called, 0);
    assert.deepStrictEqual(result.narrative, narrative);
  });

  // =========================================================================
  console.log(`\n${passed} passed, ${failed} failed, ${passed + failed} total`);
  if (failures.length) {
    console.log('\nFailures:');
    for (const f of failures) {
      console.log(`\n  - ${f.name}\n    ${f.e && f.e.stack ? f.e.stack.split('\n').slice(0, 4).join('\n    ') : f.e}`);
    }
    process.exitCode = 1;
  }
})().catch((e) => {
  console.error('fatal:', e);
  process.exitCode = 1;
});
