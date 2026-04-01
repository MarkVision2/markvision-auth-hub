-- ============================================================
-- ИСПРАВЛЕНИЕ: RLS для clients_config
-- Проблема: 
--   1. INSERT блокировался т.к. RLS проверял JWT-claims (project_id, role),
--      которых нет в стандартном Supabase JWT.
--   2. SELECT не находил кабинеты у клиентских проектов.
-- Решение:
--   Разрешаем все операции для authenticated пользователей.
--   Фильтрация данных по проекту делается на уровне приложения (JS-код).
-- ============================================================

BEGIN;

-- 1. Удаляем ВСЕ существующие политики на clients_config
DO $$ 
DECLARE 
    r record; 
BEGIN
    FOR r IN SELECT policyname FROM pg_policies 
             WHERE schemaname = 'public' AND tablename = 'clients_config' 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.clients_config', r.policyname);
    END LOOP;
END $$;

-- 2. Включаем RLS (чтобы анонимные пользователи не имели доступа)
ALTER TABLE public.clients_config ENABLE ROW LEVEL SECURITY;

-- 3. Простая политика: все авторизованные пользователи имеют полный доступ.
--    Фильтрация по project_id происходит на уровне приложения (в JS-запросах).
CREATE POLICY "authenticated_full_access"
  ON public.clients_config
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 4. Обеспечиваем права
GRANT ALL ON public.clients_config TO authenticated;

-- 5. Тоже самое для client_config_visibility
DO $$ 
DECLARE 
    r record; 
BEGIN
    FOR r IN SELECT policyname FROM pg_policies 
             WHERE schemaname = 'public' AND tablename = 'client_config_visibility' 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.client_config_visibility', r.policyname);
    END LOOP;
END $$;

ALTER TABLE public.client_config_visibility ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_full_access"
  ON public.client_config_visibility
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

GRANT ALL ON public.client_config_visibility TO authenticated;

-- 6. Аналогично для projects и project_members (чтобы не было каскадных блокировок)
DO $$ 
DECLARE 
    r record; 
BEGIN
    FOR r IN SELECT policyname FROM pg_policies 
             WHERE schemaname = 'public' AND tablename = 'projects' 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.projects', r.policyname);
    END LOOP;
END $$;

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_full_access"
  ON public.projects
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

GRANT ALL ON public.projects TO authenticated;

DO $$ 
DECLARE 
    r record; 
BEGIN
    FOR r IN SELECT policyname FROM pg_policies 
             WHERE schemaname = 'public' AND tablename = 'project_members' 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.project_members', r.policyname);
    END LOOP;
END $$;

ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_full_access"
  ON public.project_members
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

GRANT ALL ON public.project_members TO authenticated;

-- 7. И для daily_data (тоже имела JWT-based RLS)
DO $$ 
DECLARE 
    r record; 
BEGIN
    FOR r IN SELECT policyname FROM pg_policies 
             WHERE schemaname = 'public' AND tablename = 'daily_data' 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.daily_data', r.policyname);
    END LOOP;
END $$;

ALTER TABLE public.daily_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_full_access"
  ON public.daily_data
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

GRANT ALL ON public.daily_data TO authenticated;

COMMIT;
