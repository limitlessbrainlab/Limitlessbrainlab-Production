# Render-backed Page 6 Maps Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render only the Eyes Closed and Eyes Open Page 6 maps on Render while preserving Vercel for all report processing and pages.

**Architecture:** Vercel uploads the original named PDF inputs, asks the existing Render backend to convert each PDF's page 2 to a PNG, then embeds those returned buffers in Page 6. The Render endpoint accepts only authenticated storage paths and serializes native image jobs with two active jobs maximum; Vercel fails the report rather than emitting Page 6 placeholders when both images are unavailable.

**Tech Stack:** Node.js, Express, Supabase Storage, `pdf-to-img`, PDFKit, native `fetch`, `assert`.

**Spec:** `docs/superpowers/specs/2026-10-01-page6-render-design.md`

## Global Constraints

- Keep qEEG extraction, scoring, Neuro Performance inputs, and Pages 1-5/7-29 unchanged.
- Use the existing production Render backend and existing server-to-server render token fallback; do not add a dependency.
- Keep Eyes Closed and Eyes Open separately named throughout the request and response.
- Render two maps sequentially per job and run at most two jobs on the single Render Starter instance.
- If either image is absent or invalid, fail the report visibly; do not emit Page 6 placeholders in Vercel.

## Review Focus

- Swapped input paths must remain visibly assigned to their explicit Eyes Closed/Eyes Open keys; test the pair validator.
- A partial Render response must reject PDF creation; test missing Eyes Open and missing Eyes Closed separately.
- A storage path outside `qeeg-uploads` must receive 400 from Render; test validation before download.
- More than two simultaneous jobs must queue rather than invoke native rendering in parallel; test observed active-job maximum.
- A Render timeout or non-200 response must surface a Page 6-specific error, not silently use the placeholder; test client error handling.

---

### Task 1: Render map endpoint and bounded queue

**Files:**
- Create: `Neuro360/server/routes/internalQeegMapRenderRoute.js`
- Modify: `Neuro360/server/index.js`
- Test: `Neuro360/server/__tests__/internalQeegMapRenderRoute.test.js`

**Interfaces:**
- Consumes: `POST /api/internal/qeeg-page-maps` body `{ eyesClosedPath: string, eyesOpenPath: string }` and `Authorization: Bearer <render-token>`.
- Produces: `200 { eyesClosed: string, eyesOpen: string }`, where each value is PNG base64; rejects all invalid or partial inputs.

- [ ] **Step 1: Write failing route-helper tests**

```js
assert.equal(isQeegUploadPath('patient/EyesOpen.pdf'), true);
assert.equal(isQeegUploadPath('../secrets.pdf'), false);
await assert.rejects(() => requireBothMaps({ eyesClosed: 'a' }), /Eyes Open/);
```

- [ ] **Step 2: Run the helper test and verify it fails because the module does not exist.**

Run: `node server/__tests__/internalQeegMapRenderRoute.test.js`

- [ ] **Step 3: Implement the protected Render-only endpoint.**

Create `createRenderQueue(limit = 2)`, `isQeegUploadPath(path)`, and `requireBothMaps(maps)`. Authenticate with `PDF_RENDER_TOKEN || SUPABASE_SERVICE_ROLE_KEY`; download named input paths from `qeeg-uploads`; render page 2 sequentially with the existing `extractPageImage`; return keyed base64 PNG values; delete only its temporary downloads in `finally`.

- [ ] **Step 4: Mount the endpoint before the authenticated user routes in `server/index.js`.**

The endpoint's own constant-time server-to-server token check is its only auth path; no browser route can invoke it.

- [ ] **Step 5: Run the helper test and verify it passes.**

Run: `node server/__tests__/internalQeegMapRenderRoute.test.js`

- [ ] **Step 6: Commit.**

```bash
git add Neuro360/server/routes/internalQeegMapRenderRoute.js Neuro360/server/index.js Neuro360/server/__tests__/internalQeegMapRenderRoute.test.js
git commit -m "Render Page 6 maps on backend"
```

### Task 2: Vercel Render client and mandatory Page 6 images

**Files:**
- Create: `Neuro360/server/services/qeegPageMapRenderer.js`
- Modify: `Neuro360/server/routes/qeegRoutes.js`
- Modify: `Neuro360/server/services/geminiPdfGenerator.js`
- Modify: `Neuro360/server/services/pdf/yourNumbersPage.js`
- Test: `Neuro360/server/__tests__/qeegPageMapRenderer.test.js`

**Interfaces:**
- Consumes: `renderPage6Maps({ eyesClosedPath, eyesOpenPath })`.
- Produces: `{ eyesClosed: Buffer, eyesOpen: Buffer }` or throws a Page 6 rendering error.
- Consumes: `new GeminiPdfGenerator(patient, results, qeeg, inputPdfPaths, notes, page6Maps)`.

- [ ] **Step 1: Write failing client tests.**

```js
assert.throws(() => decodePage6Maps({ eyesClosed: png }), /Eyes Open/);
assert.deepEqual(decodePage6Maps({ eyesClosed: png, eyesOpen: png }), { eyesClosed: Buffer.from(png, 'base64'), eyesOpen: Buffer.from(png, 'base64') });
```

- [ ] **Step 2: Run the client test and verify it fails because the module does not exist.**

Run: `node server/__tests__/qeegPageMapRenderer.test.js`

- [ ] **Step 3: Implement the minimal Vercel client.**

Use `fetch` to post named storage paths to `VITE_API_URL || VITE_DIRECT_BACKEND_URL` plus `/api/internal/qeeg-page-maps`, use the existing render token fallback, enforce a 180-second abort timeout, validate HTTP status and both base64 PNG values, and return buffers only.

- [ ] **Step 4: Call the client from `processQeegRequest` after successful source-PDF upload and before PDF generation.**

Retain the two storage paths outside the upload `try` block. On Vercel, pass both decoded buffers to `GeminiPdfGenerator`; leave non-Vercel legacy generation on its local renderer path.

- [ ] **Step 5: Make Page 6 use returned buffers first and fail closed on Vercel.**

Extend `generateYourNumbersPageAsync` and `drawConditionPanel` to accept named map buffers. When `VERCEL` is set and valid returned maps are absent, throw `Page 6 map rendering failed` instead of drawing the placeholder. Do not change layouts or unrelated pages.

- [ ] **Step 6: Run focused tests and verify they pass.**

Run: `node server/__tests__/qeegPageMapRenderer.test.js && node server/__tests__/yourNumbersBrainMaps.test.js && node server/__tests__/vercelQeegEndpoint.test.mjs`

- [ ] **Step 7: Commit.**

```bash
git add Neuro360/server/services/qeegPageMapRenderer.js Neuro360/server/routes/qeegRoutes.js Neuro360/server/services/geminiPdfGenerator.js Neuro360/server/services/pdf/yourNumbersPage.js Neuro360/server/__tests__/qeegPageMapRenderer.test.js
git commit -m "Use Render maps for Vercel Page 6"
```

### Task 3: Production deployment and report verification

**Files:**
- Modify: `Neuro360/vercel.json` only if the Vercel client adds a new runtime asset requirement.

**Interfaces:**
- Consumes: production Render deployment and Vercel deployment from the same `main` revision.
- Produces: a fresh authenticated NeuroSense PDF with two non-placeholder Page 6 maps and an identical-session Neuro Performance report.

- [ ] **Step 1: Deploy the Render backend from `main` and verify its health endpoint.**

- [ ] **Step 2: Deploy Vercel production and verify aliases include `https://www.limitlessbrainlab.com`.**

- [ ] **Step 3: Generate one fresh authenticated production NeuroSense report from the supplied Eyes Open/Eyes Closed pair.**

Check that Page 6 embeds non-placeholder maps, with Eyes Closed in the left panel and Eyes Open in the right panel.

- [ ] **Step 4: Generate the matching Neuro Performance report and compare all canonical scores to the NeuroSense session.**

- [ ] **Step 5: Run final focused checks, inspect production logs for one Render Page 6 success, and commit any required deployment-only configuration.**
