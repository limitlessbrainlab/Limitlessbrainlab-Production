-- ========================================
-- Notification de-duplication ledger
-- One row per notification actually sent, keyed by a unique dedupe_key.
-- Used so each booking/payment notification (admin / coach / patient) is sent
-- exactly once even when both the frontend success handler AND the Stripe
-- webhook fire for the same checkout session.
-- ========================================

CREATE TABLE IF NOT EXISTS public.sent_notifications (
  dedupe_key text PRIMARY KEY,            -- e.g. 'coaching:<stripe_session_id>:admin'
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sent_notifications ENABLE ROW LEVEL SECURITY;

-- Backend uses the service-role key (bypasses RLS); permissive policy kept for safety.
DROP POLICY IF EXISTS "Allow all" ON public.sent_notifications;
CREATE POLICY "Allow all" ON public.sent_notifications
  FOR ALL USING (true) WITH CHECK (true);
