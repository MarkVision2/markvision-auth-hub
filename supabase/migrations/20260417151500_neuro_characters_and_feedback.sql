-- Neuro characters: saved face references for repeated photo sessions
CREATE TABLE IF NOT EXISTS public.neuro_characters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  photo_urls jsonb NOT NULL DEFAULT '[]'::jsonb,
  project_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS neuro_characters_project_idx
  ON public.neuro_characters (project_id);

ALTER TABLE public.neuro_characters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read neuro_characters"
  ON public.neuro_characters FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert neuro_characters"
  ON public.neuro_characters FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update neuro_characters"
  ON public.neuro_characters FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete neuro_characters"
  ON public.neuro_characters FOR DELETE
  USING (true);

-- Feedback ratings/comments for content learning loop
CREATE TABLE IF NOT EXISTS public.content_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL,
  rating smallint NOT NULL CHECK (rating IN (-1, 1)),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS content_feedback_task_idx
  ON public.content_feedback (task_id);

ALTER TABLE public.content_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read content_feedback"
  ON public.content_feedback FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert content_feedback"
  ON public.content_feedback FOR INSERT
  WITH CHECK (true);
