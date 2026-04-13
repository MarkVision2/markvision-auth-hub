-- Clony AI: Airtable -> Supabase migration
-- Target project: szfgdruhlebfvcmlvxdk (new, empty)
-- Creates clony_designs and clony_requests tables replacing Airtable base
-- "CLONY - NEW - WORK" (Designs / Requests).
-- RLS is left disabled — n8n writes via service_role key, same pattern as before.

-- ============================================================
-- Table: clony_designs  (was Airtable "Designs")
-- ============================================================
create table if not exists public.clony_designs (
  id                    bigint generated always as identity primary key,
  created_at            timestamptz not null default now(),

  title                 text,
  status                text,
  record                text,
  product_url           text,

  main_image            text,
  original_images       jsonb,
  main_ai_design        jsonb,
  ai_design             jsonb,
  website_screenshot    text,
  video                 text,

  articul               text,
  description           text,
  options_text          text,
  brand                 text,
  original_photo_count  integer,

  pdf                   jsonb,
  google_doc            text,
  open_design           text,
  open_product_site     text,

  slide2                text,
  slide3                text,
  slide4                text,
  slide5                text,
  slide6                text,
  slide7                text,
  slide8                text,
  slide9                text,
  slides                jsonb,

  design_date           timestamptz,
  prompt                text,
  cloudinary            text,
  cloudinary_links      text,

  size_ratio            text,
  language              text,
  style                 text,
  color                 text,

  run_history           text,
  marketing             boolean,
  users                 jsonb,
  requests              jsonb
);

create index if not exists clony_designs_status_idx  on public.clony_designs (status);
create index if not exists clony_designs_articul_idx on public.clony_designs (articul);
create index if not exists clony_designs_created_at_idx on public.clony_designs (created_at desc);

-- ============================================================
-- Table: clony_requests  (was Airtable "Requests")
-- ============================================================
create table if not exists public.clony_requests (
  id               bigint generated always as identity primary key,
  created_at       timestamptz not null default now(),

  request_id       text,
  date             timestamptz,
  users            jsonb,
  designs          jsonb,
  request_text     text,
  name             text,
  input_type       text,
  status           text,
  attachments      jsonb,
  audio            jsonb,
  transcribe       text,
  clony_session_id text,
  record_id        text,
  log_automation   text,
  execution_id     text  -- was misspelled "Excution_id" in Airtable
);

create index if not exists clony_requests_status_idx    on public.clony_requests (status);
create index if not exists clony_requests_request_id_idx on public.clony_requests (request_id);
create index if not exists clony_requests_created_at_idx on public.clony_requests (created_at desc);
