# NeuroSense Performance Report Timeout Fix

## Purpose

This document explains the production fix for the NeuroSense Performance Report getting stuck or showing:

> The server is taking longer than usual to respond. Please wait a moment and try again.

Use these same changes when updating the staging environment.

## Files changed

### 1. `src/components/admin/AlgorithmDataProcessor.jsx`

Function changed: `handleUploadToClaude()`

The report-generation request is long-running because it performs AI extraction, narrative generation, PDF rendering, and storage. The frontend previously used:

```js
/api/qeeg/claude-report
```

In production, `/api` is a Vercel rewrite to Render. Vercel can close long-running proxied requests before the Render backend completes, which caused the browser to show the generic timeout message.

The frontend now uses the direct backend URL for this report request:

```js
const proxyApiUrl = import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');

const directBackendUrl = import.meta.env.VITE_DIRECT_BACKEND_URL || (
  import.meta.env.PROD
    ? 'https://limitlessbrainlab-production-backend.onrender.com'
    : ''
);

const apiUrl = directBackendUrl
  ? `${directBackendUrl.replace(/\/$/, '')}/api`
  : proxyApiUrl;
```

This bypasses the Vercel proxy only for the long-running report request. Other API requests are unchanged.

### 2. `server/services/nexaprocService.js`

Function changed: `launchAndRender()`

The backend used Puppeteer/Chrome to render the 12-page PDF. `page.pdf()` did not have a timeout. If Chrome stalled, the Server-Sent Events connection continued sending heartbeat messages, leaving the UI permanently at 94% (`Rendering the 12-page PDF...`).

The backend now:

- Stops a PDF render after 120 seconds.
- Returns a real render error instead of hanging forever.
- Gives Chrome five seconds to close.
- Force-terminates the Chrome process if it does not close.
- Cleans up temporary files so the next report is not blocked by leaked processes.

The timeout can be configured on Render if needed:

```text
PDF_RENDER_TIMEOUT_MS=120000
```

## Root causes

There were two separate issues:

1. **Vercel proxy timeout**
   The browser sent the multi-minute report request through the Vercel `/api` rewrite. The proxy could terminate the connection before Render completed.

2. **Unbounded Chrome PDF rendering**
   Once the request reached the backend, Puppeteer had no timeout around `page.pdf()`. A stalled or memory-constrained Chrome process could leave the request alive forever at 94%.

## Staging instructions

### Frontend staging environment

Set the staging Vercel environment variable to the staging Render backend URL. Do not let staging use the production fallback URL.

```text
VITE_DIRECT_BACKEND_URL=https://<staging-render-service>.onrender.com
```

Also make sure these values are configured as usual:

```text
VITE_API_URL=/api
VITE_CLAUDE_REPORT_TOKEN=<same value used by staging Render>
```

After changing Vercel environment variables, create a new staging deployment. Vite variables are compiled into the frontend bundle at build time.

### Backend staging environment

Deploy the updated `server/services/nexaprocService.js` to the staging Render service.

Recommended Render variable:

```text
PDF_RENDER_TIMEOUT_MS=120000
```

The backend still requires its existing AI, Supabase, storage, and report-token environment variables.

## Verification

1. Open the staging admin algorithm processor.
2. Generate and save the NeuroSense report first.
3. Click **Build Neurosense Performance Report**.
4. Confirm the Network request goes directly to:

   ```text
   https://<staging-render-service>.onrender.com/api/qeeg/claude-report
   ```

5. Confirm the SSE response shows progress events and heartbeats.
6. Confirm the progress moves from rendering (94%) to saving (95%) and then completes.
7. If Chrome hangs, confirm the request fails with a render-timeout message within two minutes instead of remaining stuck indefinitely.
8. Confirm the generated PDF is uploaded and appears in Processing History.

## Production commits

- `6650eae` — bypass Vercel proxy for the long-running report request.
- `77f4e0d` — add Puppeteer PDF timeout and Chrome cleanup.

