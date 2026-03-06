CREATE POLICY "Authenticated users can delete clients"
ON public.clients_config FOR DELETE TO authenticated
USING (true);