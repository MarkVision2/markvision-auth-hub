
-- DEFINITIVE RESOLUTION: Fix Infinite Recursion in clients_config RLS
-- This migration replaces the sophisticated but potentially recursive policies 
-- with a flattened, robust version.

BEGIN;

-- 1. Clear existing policies on clients_config
DROP POLICY IF EXISTS "visibility_select_policy" ON public.clients_config;
DROP POLICY IF EXISTS "visibility_manage_policy" ON public.clients_config;
DROP POLICY IF EXISTS "allow_all_authenticated_manage_clients" ON public.clients_config;
DROP POLICY IF EXISTS "Authenticated users can select clients" ON public.clients_config;
DROP POLICY IF EXISTS "Authenticated users can insert clients" ON public.clients_config;
DROP POLICY IF EXISTS "Authenticated users can update clients" ON public.clients_config;
DROP POLICY IF EXISTS "Authenticated users can delete clients" ON public.clients_config;
DROP POLICY IF EXISTS "Project members can manage clients" ON public.clients_config;

-- 2. Clear existing policies on client_config_visibility to be safe
DROP POLICY IF EXISTS "Authenticated users manage visibility" ON public.client_config_visibility;

-- 3. Ensure RLS is enabled on both
ALTER TABLE public.clients_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_config_visibility ENABLE ROW LEVEL SECURITY;

-- 4. Create a single, non-recursive policy for clients_config
-- We use EXISTS directly to avoid any potential function-call overhead or recursion.
CREATE POLICY "clients_config_access_policy"
  ON public.clients_config FOR ALL
  TO authenticated
  USING (
    -- Case 1: Shared/Global cabinets or user is a member of the home project
    project_id IS NULL OR 
    EXISTS (
      SELECT 1 FROM public.project_members 
      WHERE user_id = auth.uid() AND project_id = public.clients_config.project_id
    )
    -- Case 2: Shared via visibility table
    OR id IN (
      SELECT v.client_config_id 
      FROM public.client_config_visibility v
      WHERE EXISTS (
        SELECT 1 FROM public.project_members pm
        WHERE pm.user_id = auth.uid() AND pm.project_id = v.project_id
      )
    )
  )
  WITH CHECK (
    -- For INSERT/UPDATE: must be member of the home project (or it's a global cabinet)
    project_id IS NULL OR 
    EXISTS (
      SELECT 1 FROM public.project_members 
      WHERE user_id = auth.uid() AND project_id = public.clients_config.project_id
    )
  );

-- 5. Create a simple policy for the visibility table
CREATE POLICY "client_config_visibility_access_policy"
  ON public.client_config_visibility FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 6. Grant permissions
GRANT ALL ON public.clients_config TO authenticated;
GRANT ALL ON public.client_config_visibility TO authenticated;

COMMIT;
