
-- Finance: services linked to clients_config
CREATE TABLE public.finance_client_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_config_id uuid NOT NULL REFERENCES public.clients_config(id) ON DELETE CASCADE,
  service_name text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Finance: client billing info
CREATE TABLE public.finance_client_billing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_config_id uuid NOT NULL REFERENCES public.clients_config(id) ON DELETE CASCADE UNIQUE,
  expenses numeric NOT NULL DEFAULT 0,
  next_billing date,
  billing_status text NOT NULL DEFAULT 'upcoming',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Finance: team members
CREATE TABLE public.finance_team (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL DEFAULT '',
  salary numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Finance: monthly dynamics
CREATE TABLE public.finance_months (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year integer NOT NULL,
  month_index integer NOT NULL CHECK (month_index >= 0 AND month_index <= 11),
  revenue numeric NOT NULL DEFAULT 0,
  expenses numeric NOT NULL DEFAULT 0,
  salaries numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(year, month_index)
);

-- RLS policies
ALTER TABLE public.finance_client_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_client_billing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_team ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_months ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage finance_client_services" ON public.finance_client_services FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage finance_client_billing" ON public.finance_client_billing FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage finance_team" ON public.finance_team FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage finance_months" ON public.finance_months FOR ALL TO authenticated USING (true) WITH CHECK (true);
