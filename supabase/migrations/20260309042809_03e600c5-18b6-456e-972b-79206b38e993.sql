
CREATE TABLE IF NOT EXISTS public.nps_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  score integer NOT NULL CHECK (score >= 1 AND score <= 10),
  feedback_text text DEFAULT '',
  is_resolved boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.nps_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project members manage nps_feedback"
  ON public.nps_feedback FOR ALL TO authenticated
  USING (public.is_project_member(project_id))
  WITH CHECK (public.is_project_member(project_id));
