ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS stripe_invoice_id text;

CREATE UNIQUE INDEX IF NOT EXISTS payments_stripe_invoice_id_key
  ON public.payments (stripe_invoice_id);

NOTIFY pgrst, 'reload schema';
