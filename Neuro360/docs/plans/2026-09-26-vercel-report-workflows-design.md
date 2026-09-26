# Vercel Report Workflows Design

## Goal

Keep the application responsive when clinics generate reports concurrently, make report runs survive browser disconnects and transient failures, and ensure NeuroSense and Performance PDFs use the same immutable algorithm result.

## Architecture

- Render remains the authentication and ordinary API service.
- Original qEEG files are stored in Supabase before heavy processing begins.
- A `report_jobs` row is the durable source of job status, progress, ownership, inputs, canonical results, attempts, and output URLs.
- Vercel Workflow starts one durable run per report job. Workflow steps use full Node.js and contain the existing parser and PDF generators.
- Workflow steps exchange job IDs and Supabase object paths, never large buffers.
- The canonical calculator output is written once. Both report generators consume that record; the Performance report never transcribes scores from a NeuroSense PDF.
- The frontend starts a job, receives `202 Accepted`, and polls job state. Closing the page does not cancel work.

## Reliability and scaling

- A unique idempotency key prevents duplicate jobs from repeated clicks.
- Each step persists before the next step and retries transient failures.
- Permanent validation failures are recorded without retry loops.
- One failed workflow is isolated from Render and other workflow runs.
- Vercel controls horizontal execution; Supabase remains the durable coordination layer.
- Provider quotas remain finite. Capacity beyond Vercel, Supabase, or Gemini quotas is delayed or rejected cleanly instead of crashing the web service.

## Security

- Browser requests remain authenticated by the existing backend.
- Workflow start/status endpoints use a server-only shared token between Render and Vercel.
- Supabase service-role credentials exist only in Render/Vercel server environments.
- Job status responses are scoped to the authenticated clinic/admin.
- Inputs are validated for file type, size, report type, and ownership.

## Migration

1. Add `report_jobs` and atomic idempotent job creation.
2. Add Vercel Workflow start/status endpoints and reusable workflow steps.
3. Change NeuroSense submission to upload inputs and start a workflow.
4. Persist/display canonical algorithm results returned by the job.
5. Generate Performance reports from the canonical result ID.
6. Remove the emergency in-process report lock after production verification.

## Verification

- Unit check for canonical score conversion and idempotency.
- Build both frontend and Vercel functions.
- Run one NeuroSense report and one Performance report end to end.
- Start multiple report jobs concurrently and verify Render health stays responsive.
- Verify identical seven parameter raw scores in both PDFs.

