-- Drop the old SELECT policy and recreate for all roles
DROP POLICY IF EXISTS "Authenticated users can read clients" ON public.clients_config;
CREATE POLICY "Anyone can read clients"
ON public.clients_config FOR SELECT
USING (true);