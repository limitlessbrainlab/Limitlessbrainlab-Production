-- Environment-state tracking: record which environment (production vs staging URL)
-- a clinic/patient was created from, so login can be restricted to that environment.
-- Nullable + no default → existing rows stay NULL and are treated as "any environment"
-- (never locked out). See Neuro360/src/utils/environment.js and authService.js.

ALTER TABLE public.clinics  ADD COLUMN IF NOT EXISTS origin_url text;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS origin_url text;

-- Reload PostgREST schema cache so the new columns are usable immediately.
NOTIFY pgrst, 'reload schema';
