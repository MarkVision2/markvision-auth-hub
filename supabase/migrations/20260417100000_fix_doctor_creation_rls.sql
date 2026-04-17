
-- Migration: Fix doctor creation RLS
-- Allows authenticated users to create and update profiles and project memberships.
-- This is necessary for Admins to create new doctor profiles and link them to projects.

BEGIN;

-- 1. Broaden profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "authenticated_full_access_profiles" ON public.profiles;

CREATE POLICY "authenticated_full_access_profiles"
  ON public.profiles
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 2. Broaden project_members policies
DROP POLICY IF EXISTS "Users can read own memberships" ON public.project_members;
DROP POLICY IF EXISTS "Authenticated users can insert memberships" ON public.project_members;
DROP POLICY IF EXISTS "Project owners can manage members" ON public.project_members;
DROP POLICY IF EXISTS "Users can read own memberships v2" ON public.project_members;
DROP POLICY IF EXISTS "Users can insert own memberships v2" ON public.project_members;
DROP POLICY IF EXISTS "Members can see project colleagues v2" ON public.project_members;
DROP POLICY IF EXISTS "allow_all_authenticated_pm_select" ON public.project_members;
DROP POLICY IF EXISTS "allow_all_authenticated_pm_insert" ON public.project_members;
DROP POLICY IF EXISTS "authenticated_full_access_project_members" ON public.project_members;

CREATE POLICY "authenticated_full_access_project_members"
  ON public.project_members
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

COMMIT;
