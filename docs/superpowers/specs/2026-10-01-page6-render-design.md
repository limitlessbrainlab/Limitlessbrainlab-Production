# Page 6 Render Service Design

## Goal

Show the supplied Eyes Closed and Eyes Open Z-score maps on NeuroSense Page 6 in production without changing qEEG extraction, calculation, Neuro Performance generation, or the other report pages.

## Boundary

Vercel continues to authenticate the super-admin, receive uploads, calculate the report, and create the complete NeuroSense PDF. It delegates only conversion of page 2 from each source PDF to the existing Render backend.

## Data flow

1. Vercel uploads the named Eyes Open and Eyes Closed PDFs to the existing `qeeg-uploads` bucket.
2. Vercel sends their storage paths to a new internal Render endpoint with the existing server-to-server render token.
3. Render downloads each path with its server-side Supabase credential, renders page 2, and returns PNG bytes keyed as `eyesClosed` and `eyesOpen`.
4. Vercel embeds those two returned buffers in Page 6 and produces the remaining report normally.

The request uses explicit condition names at every step. A path or image cannot be reused for the other condition.

## Failure behavior

Both images are required. If either source cannot be fetched, rendered, or returned, NeuroSense report generation fails with a clear Page 6 rendering error. It must not produce a report with blank Page 6 placeholders.

## Capacity

The production Render backend is one Starter instance. Its Page 6 renderer runs no more than two jobs at once and renders the two maps within each job sequentially. Additional requests wait in the bounded in-process queue; ten admins can submit reports at the same time without mixing report data or exhausting native-render memory. Vercel's existing 800-second report function limit remains the upper bound. If that queue cannot start a job before the request deadline, the report fails visibly and can be retried; it never generates blank maps.

## Security and scope

The new Render endpoint is internal-only and validates the existing server-to-server token. It accepts only storage paths in the qEEG upload bucket and downloads them with Render's service credential. It does not expose PDFs or images to the browser and does not alter the existing user authentication model.

## Verification

Automated checks cover condition ordering and reject a partial Render response. Production verification requires one fresh authenticated NeuroSense PDF: Page 6 must contain two non-placeholder images, with Eyes Closed left and Eyes Open right. Its Neuro Performance report must use the unchanged canonical results from that NeuroSense session.
