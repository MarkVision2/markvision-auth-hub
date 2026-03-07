-- Fix: restrict clients_config to authenticated users only
DROP POLICY IF EXISTS "Anyone can read clients" ON public.clients_config;
DROP POLICY IF EXISTS "Authenticated users can delete clients" ON public.clients_config;
DROP POLICY IF EXISTS "Authenticated users can insert clients" ON public.clients_config;
DROP POLICY IF EXISTS "Authenticated users can update clients" ON public.clients_config;

CREATE POLICY "Authenticated users can read clients"
  ON public.clients_config FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert clients"
  ON public.clients_config FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update clients"
  ON public.clients_config FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete clients"
  ON public.clients_config FOR DELETE TO authenticated
  USING (true);