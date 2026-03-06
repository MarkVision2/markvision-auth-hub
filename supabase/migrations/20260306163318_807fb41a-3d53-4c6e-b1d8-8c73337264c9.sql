
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read leads"
  ON public.leads FOR SELECT USING (true);

CREATE POLICY "Anyone can insert leads"
  ON public.leads FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update leads"
  ON public.leads FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete leads"
  ON public.leads FOR DELETE USING (true);
