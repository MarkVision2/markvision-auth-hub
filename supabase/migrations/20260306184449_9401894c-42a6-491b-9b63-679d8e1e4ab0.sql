
-- Fix: Restrict leads table RLS policies to authenticated users only

DROP POLICY IF EXISTS "Anyone can read leads" ON public.leads;
DROP POLICY IF EXISTS "Anyone can insert leads" ON public.leads;
DROP POLICY IF EXISTS "Anyone can update leads" ON public.leads;
DROP POLICY IF EXISTS "Anyone can delete leads" ON public.leads;

CREATE POLICY "Authenticated users can read leads"
  ON public.leads FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert leads"
  ON public.leads FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update leads"
  ON public.leads FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete leads"
  ON public.leads FOR DELETE TO authenticated
  USING (true);
