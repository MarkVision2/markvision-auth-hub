-- Restoration of CRM visibility: Fix missing SELECT policies for projects and leads
-- Run this in Supabase SQL Editor

-- 1. Restore visibility for projects
DROP POLICY IF EXISTS "allow_all_authenticated_select" ON public.projects;
CREATE POLICY "allow_all_authenticated_select" 
  ON public.projects FOR SELECT 
  TO authenticated 
  USING (true);

-- 2. Restore visibility for project memberships
DROP POLICY IF EXISTS "allow_all_authenticated_select_members" ON public.project_members;
CREATE POLICY "allow_all_authenticated_select_members" 
  ON public.project_members FOR SELECT 
  TO authenticated 
  USING (true);

-- 3. Ensure leads_crm has proper SELECT policy
DROP POLICY IF EXISTS "allow_all_authenticated_select_leads" ON public.leads_crm;
CREATE POLICY "allow_all_authenticated_select_leads" 
  ON public.leads_crm FOR SELECT 
  TO authenticated 
  USING (true);
