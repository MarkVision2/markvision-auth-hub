-- Fix broken RLS recursion on profiles and ensure doctor creation flow works reliably.
-- This migration intentionally uses permissive authenticated policies,
-- consistent with project-wide access model in other migrations.

BEGIN;

-- 1) Drop all policies on profiles to remove recursive definitions.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', r.policyname);
  END LOOP;
END $$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_full_access_profiles"
  ON public.profiles
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

GRANT ALL ON public.profiles TO authenticated;

-- 2) Ensure project_members also has stable non-recursive policies.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'project_members'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.project_members', r.policyname);
  END LOOP;
END $$;

ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_full_access_project_members"
  ON public.project_members
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

GRANT ALL ON public.project_members TO authenticated;

COMMIT;

