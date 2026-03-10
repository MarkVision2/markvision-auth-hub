
-- DEFINITIVE FIX: Nuclear RLS reset for clients_config
-- This ensures that ANY authenticated user can read, insert, and update ad cabinets.

-- 1. Temporarily disable RLS to clear any blockers
ALTER TABLE public.clients_config DISABLE ROW LEVEL SECURITY;

-- 2. Drop EVERY possible policy on clients_config
DROP POLICY IF EXISTS "Authenticated users can select clients" ON public.clients_config;
DROP POLICY IF EXISTS "Authenticated users can insert clients" ON public.clients_config;
DROP POLICY IF EXISTS "Authenticated users can update clients" ON public.clients_config;
DROP POLICY IF EXISTS "Authenticated users can delete clients" ON public.clients_config;
DROP POLICY IF EXISTS "Project members can manage clients" ON public.clients_config;
DROP POLICY IF EXISTS "Authenticated users can read clients" ON public.clients_config;
DROP POLICY IF EXISTS "Anyone can read clients" ON public.clients_config;

-- 3. Re-enable RLS
ALTER TABLE public.clients_config ENABLE ROW LEVEL SECURITY;

-- 4. Create basic, absolute policy for managing all cabinets
-- This ensures the system works for all users (Agency, HQ, and Individual Projects)
CREATE POLICY "allow_all_authenticated_manage_clients"
  ON public.clients_config FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 5. Ensure authenticated role has full table permissions
GRANT ALL ON public.clients_config TO authenticated;

-- Analyze to refresh stats
ANALYZE public.clients_config;
