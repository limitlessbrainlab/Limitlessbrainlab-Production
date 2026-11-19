CREATE TABLE IF NOT EXISTS public.report_email_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed')),
  attempts SMALLINT NOT NULL DEFAULT 0,
  available_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  claimed_at TIMESTAMPTZ,
  patient_id UUID NOT NULL,
  clinic_id UUID,
  requested_by UUID NOT NULL,
  patient_email TEXT NOT NULL,
  clinic_email TEXT,
  patient_name TEXT NOT NULL,
  clinic_name TEXT NOT NULL DEFAULT '',
  report_type TEXT NOT NULL CHECK (report_type IN ('neurosense', 'performance')),
  generated_at TIMESTAMPTZ,
  report_bucket TEXT NOT NULL,
  report_path TEXT NOT NULL,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS report_email_jobs_pending_idx
  ON public.report_email_jobs (available_at, created_at)
  WHERE status = 'pending';

ALTER TABLE public.report_email_jobs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.report_email_jobs FROM anon, authenticated;
GRANT ALL ON public.report_email_jobs TO service_role;

CREATE OR REPLACE FUNCTION public.claim_report_email_jobs()
RETURNS SETOF public.report_email_jobs
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.report_email_jobs
  SET status = 'failed', error_message = COALESCE(error_message, 'Worker stopped during final retry'), claimed_at = NULL
  WHERE status = 'processing' AND claimed_at < now() - interval '10 minutes' AND attempts >= 4;

  WITH next_jobs AS (
    SELECT id
    FROM public.report_email_jobs
    WHERE (status = 'pending' AND available_at <= now())
       OR (status = 'processing' AND claimed_at < now() - interval '10 minutes' AND attempts < 4)
    ORDER BY available_at, created_at
    FOR UPDATE SKIP LOCKED
    LIMIT 1
  )
  UPDATE public.report_email_jobs AS jobs
  SET status = 'processing', attempts = jobs.attempts + 1, claimed_at = now()
  FROM next_jobs
  WHERE jobs.id = next_jobs.id
  RETURNING jobs.*;
$$;

REVOKE ALL ON FUNCTION public.claim_report_email_jobs() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_report_email_jobs() TO service_role;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('report-email-attachments', 'report-email-attachments', false, 15728640, ARRAY['application/pdf'])
ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = 15728640, allowed_mime_types = ARRAY['application/pdf'];

DROP POLICY IF EXISTS report_email_attachment_service_only ON storage.objects;
CREATE POLICY report_email_attachment_service_only
ON storage.objects FOR ALL TO service_role
USING (bucket_id = 'report-email-attachments')
WITH CHECK (bucket_id = 'report-email-attachments');
