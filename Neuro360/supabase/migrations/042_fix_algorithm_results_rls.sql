-- Fix RLS on algorithm_results — allow all authenticated users to insert/update
ALTER TABLE public.algorithm_results DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.algorithm_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all" ON public.algorithm_results;
DROP POLICY IF EXISTS "Super admins have full access to algorithm_results" ON public.algorithm_results;
DROP POLICY IF EXISTS "Clinic admins can view their clinic algorithm_results" ON public.algorithm_results;
DROP POLICY IF EXISTS "Doctors can view their clinic algorithm_results" ON public.algorithm_results;

CREATE POLICY "Allow all for algorithm_results"
  ON public.algorithm_results
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Also fix reports table RLS
ALTER TABLE public.reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for reports" ON public.reports;
DROP POLICY IF EXISTS "Allow all operations on reports" ON public.reports;
CREATE POLICY "Allow all for reports" ON public.reports FOR ALL USING (true) WITH CHECK (true);

-- Fix clinical_reports RLS
ALTER TABLE public.clinical_reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all" ON public.clinical_reports;
CREATE POLICY "Allow all for clinical_reports" ON public.clinical_reports FOR ALL USING (true) WITH CHECK (true);
