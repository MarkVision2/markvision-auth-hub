-- Migration: Ensure daily_data always has correct project_id and shared visibility works
-- 1. Create a function to auto-fill project_id from clients_config
CREATE OR REPLACE FUNCTION public.sync_daily_data_project_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.project_id IS NULL OR NEW.project_id != (SELECT project_id FROM public.clients_config WHERE id = NEW.client_config_id) THEN
    SELECT project_id INTO NEW.project_id FROM public.clients_config WHERE id = NEW.client_config_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the trigger
DROP TRIGGER IF EXISTS tr_sync_daily_data_project_id ON public.daily_data;
CREATE TRIGGER tr_sync_daily_data_project_id
BEFORE INSERT OR UPDATE OF client_config_id ON public.daily_data
FOR EACH ROW EXECUTE FUNCTION public.sync_daily_data_project_id();

-- 3. Update existing NULL or mismatched project_ids
UPDATE public.daily_data d
SET project_id = c.project_id
FROM public.clients_config c
WHERE d.client_config_id = c.id
AND (d.project_id IS NULL OR d.project_id != c.project_id);

-- 4. Fix RLS for daily_data to allow shared visibility
DROP POLICY IF EXISTS "Users can only view their project daily data" ON public.daily_data;
CREATE POLICY "Users can only view their project daily data"
  ON public.daily_data
  FOR SELECT
  TO authenticated
  USING (
    project_id::text = (select current_setting('request.jwt.claims', true)::jsonb ->> 'project_id')
    OR client_config_id IN (
      SELECT client_config_id 
      FROM public.client_config_visibility 
      WHERE project_id::text = (select current_setting('request.jwt.claims', true)::jsonb ->> 'project_id')
    )
    OR (select current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'hq'
  );

-- 5. Grant access to daily_data for authenticated users
GRANT ALL ON public.daily_data TO authenticated;
