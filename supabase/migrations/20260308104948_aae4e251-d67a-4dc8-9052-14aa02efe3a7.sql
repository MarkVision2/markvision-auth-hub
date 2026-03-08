
CREATE TABLE public.autopost_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  media_url text NOT NULL,
  media_type text NOT NULL DEFAULT 'image',
  caption text,
  channels jsonb NOT NULL DEFAULT '[]'::jsonb,
  scheduled_at timestamp with time zone,
  status text NOT NULL DEFAULT 'draft',
  published_at timestamp with time zone,
  impressions integer NOT NULL DEFAULT 0,
  clicks integer NOT NULL DEFAULT 0,
  leads integer NOT NULL DEFAULT 0,
  visits integer NOT NULL DEFAULT 0,
  sales integer NOT NULL DEFAULT 0,
  revenue numeric NOT NULL DEFAULT 0,
  content_task_id uuid REFERENCES public.content_tasks(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.autopost_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage autopost_items"
  ON public.autopost_items FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

ALTER TABLE public.autopost_items REPLICA IDENTITY FULL;
