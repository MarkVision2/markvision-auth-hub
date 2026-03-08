
-- Месячные планы для scoreboard
CREATE TABLE public.scoreboard_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  client_config_id uuid REFERENCES public.clients_config(id) ON DELETE CASCADE,
  year integer NOT NULL,
  month_index integer NOT NULL, -- 0=Янв, 11=Дек
  spend numeric NOT NULL DEFAULT 0,
  impressions integer NOT NULL DEFAULT 0,
  clicks integer NOT NULL DEFAULT 0,
  leads integer NOT NULL DEFAULT 0,
  followers integer NOT NULL DEFAULT 0,
  visits integer NOT NULL DEFAULT 0,
  sales integer NOT NULL DEFAULT 0,
  revenue numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (client_config_id, year, month_index)
);

-- Ежедневные факты
CREATE TABLE public.scoreboard_daily_facts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  client_config_id uuid REFERENCES public.clients_config(id) ON DELETE CASCADE,
  date date NOT NULL,
  spend numeric NOT NULL DEFAULT 0,
  impressions integer NOT NULL DEFAULT 0,
  clicks integer NOT NULL DEFAULT 0,
  leads integer NOT NULL DEFAULT 0,
  followers integer NOT NULL DEFAULT 0,
  visits integer NOT NULL DEFAULT 0,
  sales integer NOT NULL DEFAULT 0,
  revenue numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE (client_config_id, date)
);

ALTER TABLE public.scoreboard_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scoreboard_daily_facts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage scoreboard_plans" ON public.scoreboard_plans FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage scoreboard_daily_facts" ON public.scoreboard_daily_facts FOR ALL TO authenticated USING (true) WITH CHECK (true);
