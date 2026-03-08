
-- Переместить клиентов со старого проекта на новый
UPDATE public.clients_config 
SET project_id = 'c6fdc17c-3e5b-4cf9-95a8-a0ef4f08f7a5' 
WHERE project_id = 'fc323674-bde1-41f9-836b-43043ab10924';

-- Удалить старый проект
DELETE FROM public.projects 
WHERE id = 'fc323674-bde1-41f9-836b-43043ab10924';
