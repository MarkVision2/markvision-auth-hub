
-- Migration to add project_id to daily_metrics and enforce RLS
ALTER TABLE public.daily_metrics ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id);

-- Backfill project_id from clients_config
UPDATE public.daily_metrics dm
SET project_id = cc.project_id
FROM public.clients_config cc
WHERE dm.client_config_id = cc.id
AND dm.project_id IS NULL;

-- Drop old blanket policy
DROP POLICY IF EXISTS "Authenticated users can manage daily_metrics" ON public.daily_metrics;

-- Create project-based RLS policies
CREATE POLICY "Project members can read daily_metrics"
  ON public.daily_metrics FOR SELECT TO authenticated
  USING (public.is_project_member(project_id));

CREATE POLICY "Project members can insert daily_metrics"
  ON public.daily_metrics FOR INSERT TO authenticated
  WITH CHECK (public.is_project_member(project_id));

CREATE POLICY "Project members can update daily_metrics"
  ON public.daily_metrics FOR UPDATE TO authenticated
  USING (public.is_project_member(project_id))
  WITH CHECK (public.is_project_member(project_id));

CREATE POLICY "Project members can delete daily_metrics"
  ON public.daily_metrics FOR DELETE TO authenticated
  USING (public.is_project_member(project_id));
