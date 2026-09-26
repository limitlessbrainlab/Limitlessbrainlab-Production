# Vercel Report Workflows Implementation Plan

1. Add the Supabase `report_jobs` migration with idempotency, ownership, progress, canonical results, output URLs, timestamps, and indexes.
2. Install and configure Vercel Workflow for the existing Vite project.
3. Extract NeuroSense processing and Performance generation from Express request handlers into reusable job functions without changing calculation rules.
4. Add durable workflow steps for input download, calculation, NeuroSense PDF generation, Performance PDF generation, storage upload, and terminal status updates.
5. Add authenticated Vercel start/status endpoints.
6. Add small Render endpoints that validate the current user and relay start/status requests without exposing workflow credentials.
7. Replace the frontend's long multipart/SSE requests with job submission and polling while retaining stage progress.
8. Remove PDF transcription from Performance generation and consume canonical saved results.
9. Add one runnable pipeline check, build, and concurrency smoke verification.
10. Deploy Vercel first, configure server-only environment values, deploy Render, run a canary, then remove the temporary single-process lock.

