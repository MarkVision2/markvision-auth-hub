-- Migration: Restore Raptor and migrate orphaned cabinets to projects
-- This ensures that items added "via system" have a matching project record.

BEGIN;

-- 1. Create Raptor Project if it doesn't exist
INSERT INTO public.projects (name)
SELECT 'Raptor'
WHERE NOT EXISTS (SELECT 1 FROM public.projects WHERE name = 'Raptor');

-- 2. Create Raptor Client/Cabinet
-- We use the ID of the newly created Raptor project
INSERT INTO public.clients_config (client_name, project_id, is_active)
SELECT 'Raptor Cabinet', id, true
FROM public.projects
WHERE name = 'Raptor'
AND NOT EXISTS (SELECT 1 FROM public.clients_config WHERE client_name = 'Raptor Cabinet');

-- 3. Migrate "Дизайн меню" (currently has project_id: null)
INSERT INTO public.projects (name)
SELECT 'Дизайн меню'
WHERE NOT EXISTS (SELECT 1 FROM public.projects WHERE name = 'Дизайн меню');

UPDATE public.clients_config
SET project_id = (SELECT id FROM public.projects WHERE name = 'Дизайн меню')
WHERE client_name = 'Дизайн меню' AND project_id IS NULL;

-- 4. Migrate "Авто Сервис Павлодар" (has a ghost project_id)
INSERT INTO public.projects (name)
SELECT 'Авто Сервис Павлодар'
WHERE NOT EXISTS (SELECT 1 FROM public.projects WHERE name = 'Авто Сервис Павлодар');

UPDATE public.clients_config
SET project_id = (SELECT id FROM public.projects WHERE name = 'Авто Сервис Павлодар')
WHERE client_name = 'Авто Сервис Павлодар';

COMMIT;
