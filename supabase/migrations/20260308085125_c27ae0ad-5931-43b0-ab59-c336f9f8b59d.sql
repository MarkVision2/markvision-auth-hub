
ALTER TABLE public.daily_metrics
  ADD COLUMN IF NOT EXISTS plan_spend numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS plan_leads integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS plan_visits integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS plan_sales integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS plan_revenue numeric DEFAULT 0;

-- RLS policy for authenticated users
CREATE POLICY "Authenticated users can manage daily_metrics"
  ON public.daily_metrics
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
