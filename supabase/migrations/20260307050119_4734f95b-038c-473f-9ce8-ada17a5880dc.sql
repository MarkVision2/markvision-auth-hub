CREATE TABLE public.competitor_ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_name text NOT NULL,
  advertiser_avatar text,
  page_id text,
  platform text DEFAULT 'Instagram',
  ad_copy text,
  media_url text,
  media_type text DEFAULT '4:5',
  active_since timestamp with time zone,
  is_active boolean DEFAULT true,
  is_monitored boolean DEFAULT false,
  source_url text,
  scrape_status text DEFAULT 'pending',
  project_id uuid REFERENCES public.projects(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.competitor_ads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read competitor_ads"
  ON public.competitor_ads FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert competitor_ads"
  ON public.competitor_ads FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update competitor_ads"
  ON public.competitor_ads FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete competitor_ads"
  ON public.competitor_ads FOR DELETE TO authenticated USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.competitor_ads;