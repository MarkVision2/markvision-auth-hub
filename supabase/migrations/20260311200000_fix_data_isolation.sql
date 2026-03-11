-- Migration: Tighten Project-Level Data Isolation
-- Created to prevent data from one project leaking into others

BEGIN;

-- 1. CLEANUP: Fix any daily_data rows that might have been accidentally linked to the wrong project
-- This query ensures that daily_data records always have the same project_id as their parent client configuration.
UPDATE public.daily_data d
SET project_id = c.project_id
FROM public.clients_config c
WHERE d.client_config_id = c.id
AND (d.project_id IS NULL OR d.project_id != c.project_id);


-- 2. CLIENTS_CONFIG RLS: Restrict visibility based on project_id and shared visibility
ALTER TABLE public.clients_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_all_authenticated_manage_clients" ON public.clients_config;
DROP POLICY IF EXISTS "Authenticated users can manage clients_config" ON public.clients_config;

-- Policy for users to see only their own project's clients
CREATE POLICY "Users can only view their project clients"
  ON public.clients_config
  FOR SELECT
  TO authenticated
  USING (
    project_id::text = (select current_setting('request.jwt.claims', true)::jsonb ->> 'project_id')
    OR id IN (
      SELECT client_config_id 
      FROM public.client_config_visibility 
      WHERE project_id::text = (select current_setting('request.jwt.claims', true)::jsonb ->> 'project_id')
    )
    OR (select current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'hq'
  );

CREATE POLICY "Users can manage their project clients"
  ON public.clients_config
  FOR ALL
  TO authenticated
  USING (
    project_id::text = (select current_setting('request.jwt.claims', true)::jsonb ->> 'project_id')
    OR (select current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'hq'
  )
  WITH CHECK (
    project_id::text = (select current_setting('request.jwt.claims', true)::jsonb ->> 'project_id')
    OR (select current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'hq'
  );


-- 3. DAILY_DATA RLS: Secure daily metrics
ALTER TABLE public.daily_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can manage daily_metrics" ON public.daily_data;
DROP POLICY IF EXISTS "Authenticated users can manage daily_data" ON public.daily_data;

CREATE POLICY "Users can only view their project daily data"
  ON public.daily_data
  FOR SELECT
  TO authenticated
  USING (
    project_id::text = (select current_setting('request.jwt.claims', true)::jsonb ->> 'project_id')
    OR (select current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'hq'
  );

CREATE POLICY "Users can manage their project daily data"
  ON public.daily_data
  FOR ALL
  TO authenticated
  USING (
    project_id::text = (select current_setting('request.jwt.claims', true)::jsonb ->> 'project_id')
    OR (select current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'hq'
  )
  WITH CHECK (
    project_id::text = (select current_setting('request.jwt.claims', true)::jsonb ->> 'project_id')
    OR (select current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'hq'
  );

COMMIT;
