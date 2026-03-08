
-- Каналы (Meta Ads, Google Ads, TikTok, Органика)
CREATE TABLE public.analytics_channels (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  icon text NOT NULL DEFAULT '📊',
  color text NOT NULL DEFAULT 'hsl(0,0%,50%)',
  spend numeric NOT NULL DEFAULT 0,
  clicks integer NOT NULL DEFAULT 0,
  leads integer NOT NULL DEFAULT 0,
  visits integer NOT NULL DEFAULT 0,
  sales integer NOT NULL DEFAULT 0,
  revenue numeric NOT NULL DEFAULT 0,
  period_start date,
  period_end date,
  created_at timestamptz DEFAULT now()
);

-- Кампании внутри каналов
CREATE TABLE public.analytics_campaigns (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id uuid REFERENCES public.analytics_channels(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  spend numeric NOT NULL DEFAULT 0,
  clicks integer NOT NULL DEFAULT 0,
  leads integer NOT NULL DEFAULT 0,
  visits integer NOT NULL DEFAULT 0,
  sales integer NOT NULL DEFAULT 0,
  revenue numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Креативы внутри кампаний
CREATE TABLE public.analytics_creatives (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id uuid REFERENCES public.analytics_campaigns(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  format text NOT NULL DEFAULT 'Photo',
  landing text,
  thumbnail text,
  spend numeric NOT NULL DEFAULT 0,
  clicks integer NOT NULL DEFAULT 0,
  leads integer NOT NULL DEFAULT 0,
  visits integer NOT NULL DEFAULT 0,
  sales integer NOT NULL DEFAULT 0,
  revenue numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Органические посты
CREATE TABLE public.analytics_organic_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  thumbnail text,
  caption text NOT NULL,
  trigger_word text,
  dms integer NOT NULL DEFAULT 0,
  leads integer NOT NULL DEFAULT 0,
  sales integer NOT NULL DEFAULT 0,
  revenue numeric NOT NULL DEFAULT 0,
  ltv numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE public.analytics_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_creatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_organic_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage analytics_channels" ON public.analytics_channels FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage analytics_campaigns" ON public.analytics_campaigns FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage analytics_creatives" ON public.analytics_creatives FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage analytics_organic_posts" ON public.analytics_organic_posts FOR ALL TO authenticated USING (true) WITH CHECK (true);
