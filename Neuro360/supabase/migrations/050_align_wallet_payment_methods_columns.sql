-- 050_align_wallet_payment_methods_columns.sql
--
-- Issue #8: Patient-portal Wallet "Add Card" / "Add UPI" silently failed because the
-- live wallet_payment_methods table (created by migration 047) uses Stripe-style columns
-- (type/last4/brand/exp_month/exp_year) while the frontend (src/pages/Wallet.jsx) inserts
-- and reads method_type/card_type/last_four/expiry/cardholder_name/upi_id. The mismatch
-- caused PostgREST "column not found" errors that surfaced as "Could not save card".
--
-- This migration adds the frontend-expected columns (idempotent) so card + UPI saves persist.
-- It is additive only — existing Stripe columns are left untouched.

ALTER TABLE public.wallet_payment_methods
  ADD COLUMN IF NOT EXISTS method_type      varchar,
  ADD COLUMN IF NOT EXISTS card_type        varchar,
  ADD COLUMN IF NOT EXISTS last_four        varchar,
  ADD COLUMN IF NOT EXISTS expiry           varchar,
  ADD COLUMN IF NOT EXISTS cardholder_name  varchar,
  ADD COLUMN IF NOT EXISTS upi_id           varchar;

-- Make the new columns visible to the PostgREST API immediately (no redeploy needed).
NOTIFY pgrst, 'reload schema';
