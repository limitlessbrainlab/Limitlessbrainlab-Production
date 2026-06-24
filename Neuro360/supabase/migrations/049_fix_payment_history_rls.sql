-- 049_fix_payment_history_rls.sql
-- Repairs the conflicting / broken RLS on payment_history.
--
-- Root cause: migration 002 created policy "Org owners can view payment history"
-- whose USING clause references payment_history.org_id — a column that does not
-- exist on this table (it uses clinic_id). Depending on migration order this policy
-- is either broken or shadowed by migration 009's permissive "Allow all" policy,
-- leaving SELECT behaviour ambiguous. This migration removes the broken policy and
-- (re)establishes a single, clean, permissive policy so the Super Admin Payment
-- History reads work and the Stripe/Razorpay webhook writes continue to succeed.

ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

-- Remove the broken org_id-based policy from migration 002.
DROP POLICY IF EXISTS "Org owners can view payment history" ON payment_history;

-- Re-assert one authoritative permissive policy (matches payments / patient_payments).
DROP POLICY IF EXISTS "Allow all operations on payment_history" ON payment_history;
CREATE POLICY "Allow all operations on payment_history"
  ON payment_history FOR ALL
  USING (true)
  WITH CHECK (true);
