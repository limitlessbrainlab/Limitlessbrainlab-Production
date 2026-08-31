-- Allow administrators to control which secondary currency prices are shown.
-- USD remains mandatory and is intentionally not configurable.
ALTER TABLE public.neurosense_assessments
  ADD COLUMN IF NOT EXISTS show_price_aed BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS show_price_inr BOOLEAN NOT NULL DEFAULT TRUE;

COMMENT ON COLUMN public.neurosense_assessments.show_price_aed IS
  'Whether AED pricing is displayed to customers for this assessment.';

COMMENT ON COLUMN public.neurosense_assessments.show_price_inr IS
  'Whether INR pricing is displayed to customers for this assessment.';
