-- 052_lock_down_patient_purchase_writes.sql
--
-- Root cause: patient_payments, assessment_purchases, meditation_purchases and
-- frequency_purchases all carry a permissive "Allow all"/"Allow insert for
-- anon" policy (FOR ALL / FOR INSERT USING true WITH CHECK true). Combined
-- with a frontend bug where the browser itself inserted "completed" purchase
-- rows straight from URL query params (no server-side Stripe verification),
-- any logged-in patient could grant themselves a free assessment/meditation
-- pack/frequency pack. The frontend bug is fixed separately (patient purchase
-- flows now go through the server's /api/stripe/verify-session endpoint,
-- which uses the service-role key and is unaffected by RLS). This migration
-- closes the hole at the database layer too: the anon/authenticated roles
-- (used by the browser's Supabase client) keep read access but lose the
-- ability to write to these four tables; only the service role (server-side,
-- bypasses RLS entirely) can still insert/update them.

-- patient_payments
DROP POLICY IF EXISTS "Allow insert for anon" ON patient_payments;
DROP POLICY IF EXISTS "Allow all for authenticated" ON patient_payments;
DROP POLICY IF EXISTS "Allow select for anon" ON patient_payments;
CREATE POLICY "Allow select for anon" ON patient_payments
  FOR SELECT USING (true);

-- assessment_purchases
DROP POLICY IF EXISTS "Allow all" ON assessment_purchases;
CREATE POLICY "Allow select" ON assessment_purchases
  FOR SELECT USING (true);

-- meditation_purchases
DROP POLICY IF EXISTS "Allow all for meditation_purchases" ON meditation_purchases;
CREATE POLICY "Allow select for meditation_purchases" ON meditation_purchases
  FOR SELECT USING (true);

-- frequency_purchases
DROP POLICY IF EXISTS "Allow all for frequency_purchases" ON frequency_purchases;
CREATE POLICY "Allow select for frequency_purchases" ON frequency_purchases
  FOR SELECT USING (true);
