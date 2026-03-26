
-- NUCLEAR OPTION V6: COMPLETE UNBLOCK
-- This script disables RLS completely and cleans up all triggers/policies.
-- RUN THIS ONLY IF REMAINS STUCK WITH RECURSION.

BEGIN;

-- 1. DISABLE RLS EVERYWHERE
ALTER TABLE public.clients_config DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_config_visibility DISABLE ROW LEVEL SECURITY;

-- 2. DROP ALL POLICIES DYNAMICALLY
DO $$ 
DECLARE 
    r record; 
BEGIN
    FOR r IN SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('clients_config', 'project_members', 'projects', 'client_config_visibility') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
    END LOOP;
END $$;

-- 3. DROP ALL TRIGGERS ON clients_config DYNAMICALY
DO $$ 
DECLARE 
    trig record;
BEGIN
    FOR trig IN SELECT trigger_name FROM information_schema.triggers WHERE event_object_table = 'clients_config' AND event_object_schema = 'public'
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.clients_config', trig.trigger_name);
    END LOOP;
END $$;

-- 4. Set a pure "ALLOW ALL" policy for security to prevent accidental lockouts if re-enabled
CREATE POLICY "safe_all" ON public.clients_config FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "pm_safe_all" ON public.project_members FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "projects_safe_all" ON public.projects FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 5. Leave RLS DISABLED for now to ensure the user can proceed.
-- The user can re-enable later once the cause is confirmed.

COMMIT;
