DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'neurosense_assessments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.neurosense_assessments;
  END IF;
END $$;
