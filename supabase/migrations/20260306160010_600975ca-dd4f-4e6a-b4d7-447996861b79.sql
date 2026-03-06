-- Add RLS policies for clients_config so authenticated users can read/insert
CREATE POLICY "Authenticated users can read clients"
ON public.clients_config FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert clients"
ON public.clients_config FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update clients"
ON public.clients_config FOR UPDATE TO authenticated
USING (true);