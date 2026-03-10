
-- Migration to add project_id to content_tasks and enforce RLS
ALTER TABLE public.content_tasks ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id);

-- Drop old blanket policies if they exist (assuming they might be there or were dropped)
DROP POLICY IF EXISTS "Auth users delete content_tasks" ON public.content_tasks;
DROP POLICY IF EXISTS "Auth users insert content_tasks" ON public.content_tasks;
DROP POLICY IF EXISTS "Auth users read content_tasks" ON public.content_tasks;
DROP POLICY IF EXISTS "Auth users update content_tasks" ON public.content_tasks;

-- Create project-based RLS policies
CREATE POLICY "Project members can read content_tasks"
  ON public.content_tasks FOR SELECT TO authenticated
  USING (public.is_project_member(project_id));

CREATE POLICY "Project members can insert content_tasks"
  ON public.content_tasks FOR INSERT TO authenticated
  WITH CHECK (public.is_project_member(project_id));

CREATE POLICY "Project members can update content_tasks"
  ON public.content_tasks FOR UPDATE TO authenticated
  USING (public.is_project_member(project_id))
  WITH CHECK (public.is_project_member(project_id));

CREATE POLICY "Project members can delete content_tasks"
  ON public.content_tasks FOR DELETE TO authenticated
  USING (public.is_project_member(project_id));
