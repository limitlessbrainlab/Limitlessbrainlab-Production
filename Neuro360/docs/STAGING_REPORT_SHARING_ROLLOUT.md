# Report Sharing: Production-to-Staging Rollout

## Environment ownership

| Environment | Project | Purpose |
| --- | --- | --- |
| Production | `limitlessbrainlab-production` / `www.limitlessbrainlab.com` | Live users |
| Staging | `limitlessbrainlab` | Test environment |

Never deploy or point staging changes at the production project, and never point production at the staging project.

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
