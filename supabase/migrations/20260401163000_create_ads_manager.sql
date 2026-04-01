-- ============================================================
-- Новая таблица ads_manager
-- Хранит рекламные кабинеты только для запуска кампаний.
-- Не привязаны к проектам, не отображаются в Workspace Switcher.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.ads_manager (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_name TEXT NOT NULL,
  ad_account_id TEXT,
  fb_token TEXT,
  page_id TEXT,
  page_name TEXT,
  instagram_user_id TEXT,
  whatsapp_number TEXT,
  fb_pixel_id TEXT,
  pixel_event TEXT,
  website_url TEXT,
  city TEXT,
  region_key TEXT,
  daily_budget NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- RLS: доступ для всех авторизованных (фильтрация на уровне приложения)
ALTER TABLE public.ads_manager DISABLE ROW LEVEL SECURITY;
GRANT ALL ON public.ads_manager TO authenticated;

COMMENT ON TABLE public.ads_manager IS 'Рекламные кабинеты только для запуска кампаний. Не привязаны к проектам CRM.';
