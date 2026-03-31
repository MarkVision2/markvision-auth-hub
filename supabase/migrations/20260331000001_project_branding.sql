-- 1. Add branding and localization fields to projects
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS currency text DEFAULT '₸';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'Asia/Almaty';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS language text DEFAULT 'ru';

-- 2. Add some comments for documentation
COMMENT ON COLUMN public.projects.logo_url IS 'Public URL for the workspace logo';
COMMENT ON COLUMN public.projects.currency IS 'Symbol or code (₸, $, Br) used for financial modules';
COMMENT ON COLUMN public.projects.language IS 'Primary interface language for the project (ru, kk, en)';
