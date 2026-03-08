
CREATE TABLE IF NOT EXISTS public.monthly_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month_year text NOT NULL,
  project_id uuid REFERENCES public.projects(id),
  client_config_id uuid REFERENCES public.clients_config(id),
  plan_spend numeric NOT NULL DEFAULT 0,
  plan_impressions integer NOT NULL DEFAULT 0,
  plan_clicks integer NOT NULL DEFAULT 0,
  plan_leads integer NOT NULL DEFAULT 0,
  plan_followers integer NOT NULL DEFAULT 0,
  plan_visits integer NOT NULL DEFAULT 0,
  plan_sales integer NOT NULL DEFAULT 0,
  plan_revenue numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(month_year, project_id, client_config_id)
);

CREATE POLICY "Authenticated users can manage monthly_plans"
  ON public.monthly_plans FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
