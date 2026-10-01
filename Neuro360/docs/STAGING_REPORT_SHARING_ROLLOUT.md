# Report Sharing: Production-to-Staging Rollout

## Environment ownership

| Environment | Project | Purpose |
| --- | --- | --- |
| Production | `limitlessbrainlab-production` / `www.limitlessbrainlab.com` | Live users |
| Staging | `limitlessbrainlab` | Test environment |

Never deploy or point staging changes at the production project, and never point production at the staging project.

## Issue record: cause, fix, and staging verification

| Issue | Why it happened | Production fix | Staging verification |
| --- | --- | --- | --- |
| Page 6 showed blank Eyes Open/Eyes Closed maps | The report renderer could not reliably use the browser-generated map content. | Page 6 maps are rendered by the backend and inserted into the report PDF. | Generate a NeuroSense report and confirm both map panels contain images. |
| Eyes Open and Eyes Closed data were swapped or duplicated | Source files can have misleading filenames; one supplied pair had the same Eyes Open content in both files. | Input validation rejects duplicate PDF bytes and embedded condition-label mismatch. | Upload each condition to its correct field. Try a duplicate or reversed pair and confirm it is rejected. |
| Page 6 labels did not match the displayed data | The report used the selected slot label even when the uploaded file content was the opposite condition. | The validation above blocks mismatched files before processing. | Confirm left **Eyes-closed** map comes from the eyes-closed PDF and right **Eyes-open** map comes from the eyes-open PDF. |
| New and historic downloads had confusing source filenames | Raw uploaded filenames could be reversed or inconsistent. | New records use canonical condition names; history display uses **Eyes Open PDF, Eyes Closed PDF** labels. | Download both condition files and confirm the content and internal condition heading match the button label. |
| Patient list was not newest-first | The processor list lacked an explicit scan-date sort. | Processor patients are sorted by newest processed scan. | Verify the latest processed patient appears first after refresh. |
| Performance Report progress stayed at 10% | The Vercel report endpoint returned only a final JSON response; the frontend had no progress stream. | The endpoint emits Server-Sent Events and the UI consumes the stages. | Build a Performance Report and confirm progress advances through narrative, rendering, and saving. |
| Patient portal did not receive a sent report | Browser-side `reports` insert could fail; the error was caught and email continued, creating a false success. | `api/share-report.js` saves the portal record server-side before email is attempted. | Send both report types and confirm each is in the patient Downloads tab before confirming email. |
| Send returned Render `404 /api/share-report` | `VITE_API_URL` pointed sharing traffic to Render, which does not own that endpoint. | Sharing uses relative `/api/share-report`; `vercel.json` excludes it from the Render rewrite. | In browser Network, Send must request `https://<staging-domain>/api/share-report`, never `onrender.com`. |

## Required Send behavior

For both **NeuroSense Report** and **Neurosense Performance Report**:

1. Admin clicks a Send button.
2. The report is saved in the `reports` table with the correct `clinic_id`, `patient_id`, file name, path, and report data.
3. The patient can see and download it in the patient portal.
4. Only after step 2 succeeds, send email to the patient and clinic.

If step 2 fails, show an error. Do not claim the report was sent and do not send email.

## Production fix to copy to staging

Production uses:

- `api/share-report.js`: authenticated Vercel endpoint using the server Supabase client; validates patient-to-clinic ownership and inserts/deduplicates the `reports` row.
- `src/utils/shareReport.js`: always calls the relative route `/api/share-report`.
- `src/components/admin/AlgorithmDataProcessor.jsx`: saves through `shareReport` before either email workflow.
- `vercel.json`: excludes `share-report` from the `/api/*` Render rewrite.

The relative URL is mandatory. `VITE_API_URL` may point to Render for selected processing work. If sharing uses it, Render returns `404 /api/share-report`, while Vercel owns this endpoint.

## Staging implementation checklist

- [ ] Copy the four production changes above to the staging branch/project.
- [ ] Confirm staging Vercel environment has `SUPABASE_URL` (or `VITE_SUPABASE_URL`) and `SUPABASE_SERVICE_ROLE_KEY`.
- [ ] Deploy to the staging Vercel project only.
- [ ] Verify unauthenticated `POST /api/share-report` returns `401`, confirming Vercel serves it rather than Render.
- [ ] As a super admin, send one NeuroSense report and one Performance report to a staging test patient.
- [ ] Confirm each appears in that patient's Downloads tab before checking email.
- [ ] Confirm both patient and clinic emails arrive with the matching report link.
- [ ] Confirm a second click does not create a duplicate `reports` row.

## Regression checks

Run in `Neuro360`:

```bash
node server/__tests__/shareReportValidation.test.mjs
node server/__tests__/shareReportClient.test.mjs
node server/__tests__/shareReportVercelRoute.test.mjs
```

The route test must remain green: `share-report` must not be sent to Render.
