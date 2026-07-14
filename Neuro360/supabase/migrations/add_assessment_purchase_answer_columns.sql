-- Assessment one-time-link + submission columns for assessment_purchases.
-- These are read/written by server/index.js (assessment-link consume/complete,
-- jotform-webhook) and by the admin AssessmentResults view, but were never
-- defined in a migration (036 created the base table without them). When the
-- column is missing, PostgREST silently rejects the write and the admin
-- "Answers" column stays empty. Safe to re-run.
ALTER TABLE assessment_purchases
  ADD COLUMN IF NOT EXISTS link_token text,
  ADD COLUMN IF NOT EXISTS link_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS link_opened_at timestamptz,
  ADD COLUMN IF NOT EXISTS assessment_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS submission_data jsonb;

-- Reload the PostgREST schema cache so the new columns are queryable immediately.
NOTIFY pgrst, 'reload schema';
