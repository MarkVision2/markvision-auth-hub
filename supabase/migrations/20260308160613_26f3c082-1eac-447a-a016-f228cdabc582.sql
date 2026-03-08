
-- Table: competitors (список конкурентов для мониторинга)
CREATE TABLE public.competitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id),
  username text NOT NULL,
  platform text NOT NULL DEFAULT 'instagram',
  display_name text,
  avatar_url text,
  followers text,
  engagement_rate text,
  bio text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table: content_factory (результаты анализа от n8n workflow)
CREATE TABLE public.content_factory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id),
  competitor_id uuid REFERENCES public.competitors(id) ON DELETE SET NULL,
  video_url text,
  transcription text,
  ai_analysis text,
  generated_script text,
  performance_score integer DEFAULT 0,
  post_caption text,
  post_type text DEFAULT 'unknown',
  strengths text[],
  weaknesses text[],
  hook text,
  status text DEFAULT 'completed',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS policies for competitors
ALTER TABLE public.competitors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage competitors"
  ON public.competitors FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- RLS policies for content_factory
ALTER TABLE public.content_factory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage content_factory"
  ON public.content_factory FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Enable realtime for content_factory
ALTER PUBLICATION supabase_realtime ADD TABLE public.content_factory;
ALTER PUBLICATION supabase_realtime ADD TABLE public.competitors;
