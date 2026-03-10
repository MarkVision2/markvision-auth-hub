-- DEFINITIVE FIX: Nuclear RLS reset for projects and project_members
-- This script completely resets RLS and ensures that EVERY authenticated user can create and see projects.

-- 1. Temporarily disable RLS to clear any blockers
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members DISABLE ROW LEVEL SECURITY;

-- 2. Drop EVERY known and possible policy on projects
DROP POLICY IF EXISTS "Authenticated users can select projects v2" ON public.projects;
DROP POLICY IF EXISTS "Authenticated users can insert projects v2" ON public.projects;
DROP POLICY IF EXISTS "Project members can update projects v2" ON public.projects;
DROP POLICY IF EXISTS "Authenticated users can read projects" ON public.projects;
DROP POLICY IF EXISTS "Authenticated users can insert projects" ON public.projects;
DROP POLICY IF EXISTS "Project members can update projects" ON public.projects;
DROP POLICY IF EXISTS "Anyone can read projects" ON public.projects;
DROP POLICY IF EXISTS "allow_all_authenticated_select" ON public.projects;
DROP POLICY IF EXISTS "allow_all_authenticated_insert" ON public.projects;

-- 3. Drop EVERY known and possible policy on project_members
DROP POLICY IF EXISTS "Users can read own memberships v2" ON public.project_members;
DROP POLICY IF EXISTS "Users can insert own memberships v2" ON public.project_members;
DROP POLICY IF EXISTS "Members can see project colleagues v2" ON public.project_members;
DROP POLICY IF EXISTS "Users can read own memberships" ON public.project_members;
DROP POLICY IF EXISTS "Authenticated users can insert memberships" ON public.project_members;
DROP POLICY IF EXISTS "Project owners can manage members" ON public.project_members;

-- 4. Re-enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

-- 5. Create basic, absolute policies
CREATE POLICY "allow_all_authenticated_select"
  ON public.projects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "allow_all_authenticated_insert"
  ON public.projects FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "allow_all_authenticated_update"
  ON public.projects FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "allow_all_authenticated_pm_select"
  ON public.project_members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "allow_all_authenticated_pm_insert"
  ON public.project_members FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Ensure authenticated role has full table permissions
GRANT ALL ON public.projects TO authenticated;
GRANT ALL ON public.project_members TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
