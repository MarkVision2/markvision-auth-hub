
-- Migration: cross-project cabinet visibility (simplified, no 'hq' references)
-- Allows a cabinet to belong to one project but be visible/shared with others.

BEGIN;

-- 1. Create the visibility/sharing table
CREATE TABLE IF NOT EXISTS public.client_config_visibility (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_config_id uuid NOT NULL REFERENCES public.clients_config(id) ON DELETE CASCADE,
    project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(client_config_id, project_id)
);

-- 2. Update RLS on clients_config for cross-project visibility
DROP POLICY IF EXISTS "allow_all_authenticated_manage_clients" ON public.clients_config;

-- SELECT: own project members OR shared via visibility table
CREATE POLICY "visibility_select_policy"
  ON public.clients_config FOR SELECT
  TO authenticated
  USING (
    project_id IS NULL
    OR public.is_project_member(project_id)
    OR id IN (
      SELECT v.client_config_id FROM public.client_config_visibility v
      WHERE public.is_project_member(v.project_id)
    )
  );

-- INSERT/UPDATE/DELETE: only home project members
CREATE POLICY "visibility_manage_policy"
  ON public.clients_config FOR ALL
  TO authenticated
  USING (project_id IS NULL OR public.is_project_member(project_id))
  WITH CHECK (project_id IS NULL OR public.is_project_member(project_id));

-- 3. Enable RLS on visibility table
ALTER TABLE public.client_config_visibility ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users manage visibility"
  ON public.client_config_visibility FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

GRANT ALL ON public.client_config_visibility TO authenticated;

COMMIT;
