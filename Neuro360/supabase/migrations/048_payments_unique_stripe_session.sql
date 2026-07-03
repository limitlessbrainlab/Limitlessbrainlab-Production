-- Make payments.stripe_session_id unique so report-credit purchases can be
-- recorded idempotently via upsert (onConflict: stripe_session_id) from both
-- the Stripe webhook and the /api/confirm-report-credits frontend path without
-- creating duplicate Payment History rows.
--
-- NULL stripe_session_id values remain allowed and are treated as distinct by
-- Postgres, so non-Stripe payment rows are unaffected.

-- 1. Remove any pre-existing duplicate rows (e.g. from the old webhook-only
--    insert firing on Stripe's automatic retries), keeping the earliest row.
DELETE FROM payments a
USING payments b
WHERE a.stripe_session_id IS NOT NULL
  AND a.stripe_session_id = b.stripe_session_id
  AND a.ctid > b.ctid;

-- 2. Enforce uniqueness going forward.
CREATE UNIQUE INDEX IF NOT EXISTS payments_stripe_session_id_key
  ON payments (stripe_session_id);
