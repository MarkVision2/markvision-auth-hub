-- MarkVision AI: Bootstrap project setup for zapoinov@bk.ru
-- This migration creates the initial project, membership, and ad account configuration.

-- 1. Fix RLS to allow authenticated inserts on projects (in case earlier migration was not applied)
DROP POLICY IF EXISTS "allow_all_authenticated_insert" ON public.projects;
CREATE POLICY "allow_all_authenticated_insert"
  ON public.projects FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "allow_all_authenticated_delete" ON public.projects;
CREATE POLICY "allow_all_authenticated_delete"
  ON public.projects FOR DELETE
  TO authenticated
  USING (true);

-- 2. Create the main project
INSERT INTO public.projects (id, name, created_at)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'MarkVision AI',
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 3. Link owner user to the project
INSERT INTO public.project_members (user_id, project_id)
VALUES (
  'cdc200ff-5590-4d83-94f6-b5ec2d755eed',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
)
ON CONFLICT DO NOTHING;

-- 4. Ensure profile exists for the owner
INSERT INTO public.profiles (id, email, full_name, role, permissions)
VALUES (
  'cdc200ff-5590-4d83-94f6-b5ec2d755eed',
  'zapoinov@bk.ru',
  'MarkVision Admin',
  'superadmin',
  ARRAY['hq','accounts','ads','content','autoposting','spy','crm','schedule','ai_rop','quality','retention','analytics','scoreboard','finance','ai_reports','ai_manager']
)
ON CONFLICT (id) DO UPDATE SET
  role = 'superadmin',
  full_name = 'MarkVision Admin',
  permissions = ARRAY['hq','accounts','ads','content','autoposting','spy','crm','schedule','ai_rop','quality','retention','analytics','scoreboard','finance','ai_reports','ai_manager'];

-- 5. Create the ad account (clients_config)
INSERT INTO public.clients_config (
  client_name,
  project_id,
  daily_budget,
  city,
  ad_account_id,
  page_id,
  page_name,
  is_agency,
  fb_token
)
VALUES (
  'MarkVision AI',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  500,
  'Павлодар',
  'act_1253891246841934',
  '997313993471858',
  'MarkVision AI',
  false,
  'EAANaVrGsWLYBQx2zJZCYxaz16KSfXDHFwIZA5xuZACh8fXnWD1gHcu4YryOs5lCcydaQ0f0D0EhDteeIZBMpD99QBy2a5BEB6JULlKi81zgQIjqnXo46dixFo1NB0BdHo1wAQkJ1fwdiZAqtg5AY2DY8XLDDPIMsJJbUkkhtswZCt48Vw8WuU5Ml5es1X9egMK'
);

-- 6. Create visibility record for the ad account
INSERT INTO public.client_config_visibility (client_config_id, project_id)
SELECT id, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
FROM public.clients_config
WHERE ad_account_id = 'act_1253891246841934'
LIMIT 1;
