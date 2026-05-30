# QEEG Report Generation — Production Checklist & Incident Log

## Incident: 2026-04-10 — Gemini Error on PDF Upload (Production)

### What failed
Uploading Open Eye / Close Eye PDF files in production resulted in:
> "⚠️ Gemini AI Service Error — There was an issue with the AI service. Please try again in a moment."

Local environment worked fine. Only production (Render) was affected.

### Root Causes Found (all 3 must be addressed)

| # | Root Cause | File | Symptom |
|---|-----------|------|---------|
| 1 | `GEMINI_API_KEY` not declared in `render.yaml` | `render.yaml` | Key not available to server on Render redeploy |
| 2 | `testAPIConnection()` called before every upload | `server/routes/qeegRoutes.js` line ~209 | Wasted API quota + 30s delay causing frontend timeout |
| 3 | `GEMINI_REQUEST_DELAY_MS` set to 30000ms | `render.yaml` / `.env` | Frontend timed out waiting for response |

### Fixes Applied

**Fix 1 — Add GEMINI_API_KEY to render.yaml**
```yaml
- key: GEMINI_API_KEY
  sync: false
```

**Fix 2 — Remove live test API call in qeegRoutes.js**
```js
// REMOVED (was wasting quota + causing 30s delay):
// await QEEGParser.testAPIConnection();

// REPLACED WITH (safe check only):
if (!process.env.GEMINI_API_KEY) {
  console.warn('⚠️ GEMINI_API_KEY not set - processing may fail');
} else {
  console.log('✅ Gemini API key present');
}
```

**Fix 3 — Reduce rate limiter delay**
```yaml
- key: GEMINI_REQUEST_DELAY_MS
  value: "2000"      # was 30000 — frontend timeout was ~15s
- key: GEMINI_DAILY_LIMIT
  value: "50"        # was 20 — too restrictive for clinic use
```

---

## Pre-Deployment Checklist

Run this checklist before every push that touches QEEG, Gemini, or render.yaml.

### render.yaml verification
- [ ] `GEMINI_API_KEY` present with `sync: false`
- [ ] `GEMINI_REQUEST_DELAY_MS` set to `"2000"` (not higher)
- [ ] `GEMINI_DAILY_LIMIT` set to `"50"` (adjust if needed)
- [ ] `PORT` set to `3001` (Render uses 3001, NOT 5000)
- [ ] `FRONTEND_URL` set to `https://limitlessbrainlab.com`

### qeegRoutes.js verification
- [ ] NO `testAPIConnection()` call before processing
- [ ] API key check is a simple `process.env.GEMINI_API_KEY` presence check only
- [ ] File upload handler responds within 10 seconds (Vercel frontend timeout)
- [ ] Error messages are user-friendly, not raw Gemini stack traces

### Render dashboard verification (manual)
- [ ] `GEMINI_API_KEY` value is set in Render dashboard → Environment tab
- [ ] After any render.yaml push, trigger a manual redeploy on Render dashboard
- [ ] Check Render logs after redeploy: look for "✅ Gemini API key present"

### Local smoke test before pushing
```bash
# Start local backend
cd server && npm run dev

# Upload a test QEEG PDF via the UI
# Confirm: no error, report generates within ~30 seconds
```

---

## Architecture: How QEEG Report Generation Works

```
User uploads PDFs (Open Eye + Close Eye)
         ↓
Frontend → POST /api/qeeg/process (multipart form)
         ↓
qeegRoutes.js → validates key presence → parses PDFs
         ↓
QEEGParser.js → extracts brainwave data → calls Gemini API
         ↓
Gemini → returns AI analysis text
         ↓
Server → builds PDF report → sends back to frontend
         ↓
User downloads generated report
```

**Key files:**
- `server/routes/qeegRoutes.js` — main upload + processing route
- `server/services/QEEGParser.js` — PDF parsing + Gemini integration
- `render.yaml` — production environment config
- `server/.env` — local environment config (never commit)

---

## Future Recommendations

### 1. Add a health-check endpoint
Create `GET /api/qeeg/health` that returns:
```json
{ "gemini_key_present": true, "daily_limit": 50, "requests_today": 12 }
```
This lets you verify production config without uploading a real patient PDF.

### 2. Add Gemini quota monitoring
Log each Gemini call to a counter (Redis or simple file). Alert when approaching
`GEMINI_DAILY_LIMIT`. At 50/day, a busy clinic can hit this in hours.

### 3. Retry logic for Gemini rate limit errors
If Gemini returns 429 (rate limit), retry after 3 seconds, max 2 retries.
Currently there is no retry — one failed call = error shown to user.

### 4. Frontend timeout alignment
Vercel frontend has a ~30s default timeout. Render cold starts take ~30s.
If a user uploads right after Render spins down, the request will timeout.
**Short term:** Show a "Server is warming up, please wait..." message.
**Long term:** Upgrade Render to a paid tier (no spin-down).

### 5. Environment variable audit before handover
Before handing over the project, run:
```bash
grep -r "GEMINI\|SUPABASE\|STRIPE" render.yaml server/.env.example
```
Confirm every key used in code is documented in `.env.example` and present in render.yaml.
