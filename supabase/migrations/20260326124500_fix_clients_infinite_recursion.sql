
-- FINAL DEFINITIVE FIX: Remove recursion from project_members AND clients_config
-- This script targets the core reason for "infinite recursion" errors.

BEGIN;

-- 1. FIX RECURSION IN project_members
-- This is often the hidden source of recursion when using is_project_member()
ALTER TABLE public.project_members DISABLE ROW LEVEL SECURITY;

DO $$ 
DECLARE 
    pol record;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'project_members' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.project_members', pol.policyname);
    END LOOP;
END $$;

-- Enable a safe, non-recursive policy for project members
CREATE POLICY "allow_all_authenticated_pm_select"
  ON public.project_members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "allow_all_authenticated_pm_insert"
  ON public.project_members FOR INSERT
  TO authenticated
  WITH CHECK (true);

ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

-- 2. FIX RECURSION IN projects
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;

DO $$ 
DECLARE 
    pol record;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'projects' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.projects', pol.policyname);
    END LOOP;
END $$;

CREATE POLICY "allow_all_authenticated_projects_all"
  ON public.projects FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- 3. FIX RECURSION IN clients_config
ALTER TABLE public.clients_config DISABLE ROW LEVEL SECURITY;

DO $$ 
DECLARE 
    pol record;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'clients_config' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.clients_config', pol.policyname);
    END LOOP;
END $$;

-- Create a flattened version of the access policy without complex subqueries
CREATE POLICY "definitive_clients_access_policy"
  ON public.clients_config FOR ALL
  TO authenticated
  USING (
    project_id IS NULL OR 
    EXISTS (SELECT 1 FROM public.project_members pm WHERE pm.user_id = auth.uid() AND pm.project_id = public.clients_config.project_id)
    OR id IN (
      SELECT v.client_config_id FROM public.client_config_visibility v
    )
  )
  WITH CHECK (true);

ALTER TABLE public.clients_config ENABLE ROW LEVEL SECURITY;

-- 4. FIX RECURSION IN visibility table
ALTER TABLE public.client_config_visibility DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users manage visibility" ON public.client_config_visibility;
DROP POLICY IF EXISTS "client_config_visibility_access_policy" ON public.client_config_visibility;

CREATE POLICY "simple_visibility_policy"
  ON public.client_config_visibility FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

ALTER TABLE public.client_config_visibility ENABLE ROW LEVEL SECURITY;

-- 5. Ensure function is security definer and safe
CREATE OR REPLACE FUNCTION public.is_project_member(_project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_members
    WHERE user_id = auth.uid() AND project_id = _project_id
  )
$$;

COMMIT;
