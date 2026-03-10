-- Add RLS policies for projects and project_members to fix creation errors

-- 1. Enable RLS on projects (just in case)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- 2. Add policies for projects
DROP POLICY IF EXISTS "Anyone can read projects" ON public.projects;
CREATE POLICY "Authenticated users can read projects"
  ON public.projects FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert projects" ON public.projects;
CREATE POLICY "Authenticated users can insert projects"
  ON public.projects FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update projects" ON public.projects;
CREATE POLICY "Project members can update projects"
  ON public.projects FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.project_members
    WHERE user_id = auth.uid() AND project_id = id
  ));

-- 3. Enable RLS on project_members (just in case)
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

-- 4. Add policies for project_members
DROP POLICY IF EXISTS "Users can read own memberships" ON public.project_members;
CREATE POLICY "Users can read own memberships"
  ON public.project_members FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Authenticated users can insert memberships" ON public.project_members;
CREATE POLICY "Authenticated users can insert memberships"
  ON public.project_members FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid()); -- Users can add themselves

DROP POLICY IF EXISTS "Project owners can manage members" ON public.project_members;
CREATE POLICY "Project owners can manage members"
  ON public.project_members FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.project_members
    WHERE user_id = auth.uid() AND project_id = project_members.project_id
  ));
