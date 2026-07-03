-- Fix: Payment History always empty because every insert into `payments` failed.
--
-- The application code (server/index.js — clinic report-credit purchases, patient
-- subscriptions, assessment / meditation / frequency purchases) and the frontend
-- Payment History view expect columns that were never present on the `payments`
-- table. PostgREST rejected the whole insert with "column ... does not exist",
-- the error was caught and only logged, so NO payment row was ever recorded
-- (payments row count = 0) and Payment History showed "No payments found".
--
-- This migration adds every missing column additively (IF NOT EXISTS — safe to
-- re-run) so all payment-recording paths succeed. Must run BEFORE migration 048
-- (which creates a unique index on stripe_session_id); it is included here so a
-- single apply fixes everything.

ALTER TABLE payments ADD COLUMN IF NOT EXISTS type            varchar;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS package_name    varchar;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS reports_allowed integer;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_id      varchar;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS stripe_session_id varchar;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS patient_email   varchar;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS source          varchar;

-- Enforce idempotency for report-credit upserts (onConflict: stripe_session_id).
-- NULL stripe_session_id values are treated as distinct by Postgres, so non-Stripe
-- rows are unaffected. (Same as migration 048; safe to re-run.)
CREATE UNIQUE INDEX IF NOT EXISTS payments_stripe_session_id_key
  ON payments (stripe_session_id);

-- Reload the PostgREST schema cache so the new columns are visible immediately.
NOTIFY pgrst, 'reload schema';
