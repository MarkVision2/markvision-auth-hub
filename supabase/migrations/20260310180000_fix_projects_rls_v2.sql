-- RETRY: Add more robust RLS policies for projects and project_members
-- This migration ensures that authenticated users can always create projects and see them.

-- 1. Ensure RLS is enabled
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

-- 2. Broaden policies for 'projects'
-- We use unique names to avoid conflicts with potential hidden policies
DROP POLICY IF EXISTS "Authenticated users can read projects" ON public.projects;
DROP POLICY IF EXISTS "Authenticated users can insert projects" ON public.projects;
DROP POLICY IF EXISTS "Project members can update projects" ON public.projects;
DROP POLICY IF EXISTS "Anyone can read projects" ON public.projects;
DROP POLICY IF EXISTS "Authenticated users can select projects v2" ON public.projects;
DROP POLICY IF EXISTS "Authenticated users can insert projects v2" ON public.projects;

-- Simplified "Allow All Authenticated" for projects to ensure creation works
CREATE POLICY "Authenticated users can select projects v2"
  ON public.projects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert projects v2"
  ON public.projects FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Update remains restricted to members
CREATE POLICY "Project members can update projects v2"
  ON public.projects FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.project_members
    WHERE user_id = auth.uid() AND project_id = projects.id
  ));

-- 3. Broaden policies for 'project_members'
DROP POLICY IF EXISTS "Users can read own memberships" ON public.project_members;
DROP POLICY IF EXISTS "Authenticated users can insert memberships" ON public.project_members;
DROP POLICY IF EXISTS "Project owners can manage members" ON public.project_members;
DROP POLICY IF EXISTS "Users can read own memberships v2" ON public.project_members;
DROP POLICY IF EXISTS "Users can insert own memberships v2" ON public.project_members;

CREATE POLICY "Users can read own memberships v2"
  ON public.project_members FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own memberships v2"
  ON public.project_members FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid()); -- Critical for createProject hook

-- Allow members to see other members of the same project
CREATE POLICY "Members can see project colleagues v2"
  ON public.project_members FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.user_id = auth.uid() AND pm.project_id = project_members.project_id
  ));
