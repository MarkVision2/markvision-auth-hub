
-- Migration to add cross-project cabinet visibility
-- This allows a cabinet to "belong" to one project but be "visible/shared" with others (MarkVision AI, CPR_KZ).

BEGIN;

-- 1. Create the visibility/sharing table
CREATE TABLE IF NOT EXISTS public.client_config_visibility (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    client_config_id uuid NOT NULL REFERENCES public.clients_config(id) ON DELETE CASCADE,
    project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
    is_hq_sharing boolean DEFAULT false, -- If true, it's shared with the 'hq' (CPR_KZ) internal ID
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(client_config_id, project_id),
    UNIQUE(client_config_id, is_hq_sharing) WHERE is_hq_sharing = true
);

-- 2. Update RLS on clients_config to allow visibility via the sharing table
-- We need to drop the old blanket policy and replace it with a smarter one
DROP POLICY IF EXISTS "allow_all_authenticated_manage_clients" ON public.clients_config;

-- Policy for SELECT: Home project OR Shared projects
CREATE POLICY "visibility_select_policy"
  ON public.clients_config FOR SELECT
  TO authenticated
  USING (
    public.is_project_member(project_id) -- Home project
    OR id IN (
      SELECT client_config_id FROM public.client_config_visibility 
      WHERE (project_id IS NOT NULL AND public.is_project_member(project_id))
         OR (is_hq_sharing = true AND public.is_project_member('hq'))
    )
    OR (project_id IS NULL AND is_agency = true AND public.is_project_member('hq')) -- Legacy agency check
  );

-- Policy for ALL other actions: Only Home project members
CREATE POLICY "visibility_manage_policy"
  ON public.clients_config FOR ALL
  TO authenticated
  USING (public.is_project_member(project_id) OR (project_id IS NULL AND public.is_project_member('hq')))
  WITH CHECK (public.is_project_member(project_id) OR (project_id IS NULL AND public.is_project_member('hq')));

-- 3. Enable RLS and grant permissions
ALTER TABLE public.client_config_visibility ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users manage their visibility"
  ON public.client_config_visibility FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

GRANT ALL ON public.client_config_visibility TO authenticated;

COMMIT;
