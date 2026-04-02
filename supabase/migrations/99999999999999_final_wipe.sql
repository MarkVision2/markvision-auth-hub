-- FINAL SYSTEM WIPE: Clean Slate for all data tables
-- WARNING: This will permanently delete all your projects, cabinets, leads, and more.
-- This keeps the table structures, roles, and functions intact.

BEGIN;

-- 1. Truncate all data tables (cascading will handle dependencies)
TRUNCATE public.projects CASCADE;
TRUNCATE public.clients_config CASCADE;
TRUNCATE public.leads CASCADE;
TRUNCATE public.daily_data CASCADE;
TRUNCATE public.project_members CASCADE;
TRUNCATE public.client_config_visibility CASCADE;
TRUNCATE public.monthly_plans CASCADE;
TRUNCATE public.competitor_configs CASCADE;
TRUNCATE public.competitor_ads CASCADE;
TRUNCATE public.competitors CASCADE;
TRUNCATE public.content_factory CASCADE;
TRUNCATE public.content_tasks CASCADE;
TRUNCATE public.ai_bridge_tasks CASCADE;
TRUNCATE public.ai_rop_audits CASCADE;
TRUNCATE public.agency_billing CASCADE;
TRUNCATE public.diagnostic_questions CASCADE;
TRUNCATE public.chat_messages CASCADE;
TRUNCATE public.marketing_metrics CASCADE;

-- 2. Optionally wipe users (Auth schema)
-- Warning: You'll need to re-register after this!
-- DELETE FROM auth.users;

COMMIT;
