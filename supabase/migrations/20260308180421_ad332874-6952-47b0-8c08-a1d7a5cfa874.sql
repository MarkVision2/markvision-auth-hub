
-- ============================================================
-- Security definer function for project membership checks
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_project_member(_project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_members
    WHERE user_id = auth.uid() AND project_id = _project_id
  )
$$;

-- ============================================================
-- ANALYTICS_CHANNELS — has project_id
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can manage analytics_channels" ON public.analytics_channels;
CREATE POLICY "Project members manage analytics_channels"
  ON public.analytics_channels FOR ALL TO authenticated
  USING (public.is_project_member(project_id))
  WITH CHECK (public.is_project_member(project_id));

-- ============================================================
-- ANALYTICS_CAMPAIGNS — linked via channel_id -> analytics_channels.project_id
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can manage analytics_campaigns" ON public.analytics_campaigns;
CREATE POLICY "Project members manage analytics_campaigns"
  ON public.analytics_campaigns FOR ALL TO authenticated
  USING (
    channel_id IN (
      SELECT id FROM public.analytics_channels WHERE public.is_project_member(project_id)
    )
  )
  WITH CHECK (
    channel_id IN (
      SELECT id FROM public.analytics_channels WHERE public.is_project_member(project_id)
    )
  );

-- ============================================================
-- ANALYTICS_CREATIVES — linked via campaign_id -> analytics_campaigns -> analytics_channels
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can manage analytics_creatives" ON public.analytics_creatives;
CREATE POLICY "Project members manage analytics_creatives"
  ON public.analytics_creatives FOR ALL TO authenticated
  USING (
    campaign_id IN (
      SELECT ac.id FROM public.analytics_campaigns ac
      JOIN public.analytics_channels ch ON ac.channel_id = ch.id
      WHERE public.is_project_member(ch.project_id)
    )
  )
  WITH CHECK (
    campaign_id IN (
      SELECT ac.id FROM public.analytics_campaigns ac
      JOIN public.analytics_channels ch ON ac.channel_id = ch.id
      WHERE public.is_project_member(ch.project_id)
    )
  );

-- ============================================================
-- ANALYTICS_ORGANIC_POSTS — has project_id
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can manage analytics_organic_posts" ON public.analytics_organic_posts;
CREATE POLICY "Project members manage analytics_organic_posts"
  ON public.analytics_organic_posts FOR ALL TO authenticated
  USING (public.is_project_member(project_id))
  WITH CHECK (public.is_project_member(project_id));

-- ============================================================
-- AUTOPOST_ITEMS — has project_id
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can manage autopost_items" ON public.autopost_items;
CREATE POLICY "Project members manage autopost_items"
  ON public.autopost_items FOR ALL TO authenticated
  USING (public.is_project_member(project_id))
  WITH CHECK (public.is_project_member(project_id));

-- ============================================================
-- CLIENTS_CONFIG — drop blanket policies, keep project isolation
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can delete clients" ON public.clients_config;
DROP POLICY IF EXISTS "Authenticated users can insert clients" ON public.clients_config;
DROP POLICY IF EXISTS "Authenticated users can read clients" ON public.clients_config;
DROP POLICY IF EXISTS "Authenticated users can update clients" ON public.clients_config;

-- ============================================================
-- COMPETITOR_ADS — has project_id
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can delete competitor_ads" ON public.competitor_ads;
DROP POLICY IF EXISTS "Authenticated users can insert competitor_ads" ON public.competitor_ads;
DROP POLICY IF EXISTS "Authenticated users can read competitor_ads" ON public.competitor_ads;
DROP POLICY IF EXISTS "Authenticated users can update competitor_ads" ON public.competitor_ads;
CREATE POLICY "Project members manage competitor_ads"
  ON public.competitor_ads FOR ALL TO authenticated
  USING (public.is_project_member(project_id))
  WITH CHECK (public.is_project_member(project_id));

-- ============================================================
-- COMPETITORS — has project_id
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can manage competitors" ON public.competitors;
CREATE POLICY "Project members manage competitors"
  ON public.competitors FOR ALL TO authenticated
  USING (public.is_project_member(project_id))
  WITH CHECK (public.is_project_member(project_id));

-- ============================================================
-- CONTENT_FACTORY — has project_id
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can manage content_factory" ON public.content_factory;
CREATE POLICY "Project members manage content_factory"
  ON public.content_factory FOR ALL TO authenticated
  USING (public.is_project_member(project_id))
  WITH CHECK (public.is_project_member(project_id));

-- ============================================================
-- CONTENT_TASKS — drop blanket policies, keep project isolation
-- ============================================================
DROP POLICY IF EXISTS "Auth users delete content_tasks" ON public.content_tasks;
DROP POLICY IF EXISTS "Auth users insert content_tasks" ON public.content_tasks;
DROP POLICY IF EXISTS "Auth users read content_tasks" ON public.content_tasks;
DROP POLICY IF EXISTS "Auth users update content_tasks" ON public.content_tasks;

-- ============================================================
-- CRM_AUTOMATIONS — has project_id
-- ============================================================
DROP POLICY IF EXISTS "Auth users delete crm_automations" ON public.crm_automations;
DROP POLICY IF EXISTS "Auth users insert crm_automations" ON public.crm_automations;
DROP POLICY IF EXISTS "Auth users read crm_automations" ON public.crm_automations;
DROP POLICY IF EXISTS "Auth users update crm_automations" ON public.crm_automations;
CREATE POLICY "Project members manage crm_automations"
  ON public.crm_automations FOR ALL TO authenticated
  USING (public.is_project_member(project_id))
  WITH CHECK (public.is_project_member(project_id));

-- ============================================================
-- CRM_MESSAGES — linked via lead_id -> leads.project_id
-- ============================================================
DROP POLICY IF EXISTS "Auth users delete crm_messages" ON public.crm_messages;
DROP POLICY IF EXISTS "Auth users insert crm_messages" ON public.crm_messages;
DROP POLICY IF EXISTS "Auth users read crm_messages" ON public.crm_messages;
DROP POLICY IF EXISTS "Auth users update crm_messages" ON public.crm_messages;
CREATE POLICY "Project members manage crm_messages"
  ON public.crm_messages FOR ALL TO authenticated
  USING (
    lead_id IN (
      SELECT id FROM public.leads WHERE public.is_project_member(project_id)
    )
  )
  WITH CHECK (
    lead_id IN (
      SELECT id FROM public.leads WHERE public.is_project_member(project_id)
    )
  );

-- ============================================================
-- CRM_NOTES — linked via lead_id -> leads.project_id
-- ============================================================
DROP POLICY IF EXISTS "Auth users delete crm_notes" ON public.crm_notes;
DROP POLICY IF EXISTS "Auth users insert crm_notes" ON public.crm_notes;
DROP POLICY IF EXISTS "Auth users read crm_notes" ON public.crm_notes;
DROP POLICY IF EXISTS "Auth users update crm_notes" ON public.crm_notes;
CREATE POLICY "Project members manage crm_notes"
  ON public.crm_notes FOR ALL TO authenticated
  USING (
    lead_id IN (
      SELECT id FROM public.leads WHERE public.is_project_member(project_id)
    )
  )
  WITH CHECK (
    lead_id IN (
      SELECT id FROM public.leads WHERE public.is_project_member(project_id)
    )
  );

-- ============================================================
-- DAILY_METRICS — drop blanket, keep project isolation
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can manage daily_metrics" ON public.daily_metrics;

-- ============================================================
-- LEADS — drop blanket policies, keep project isolation
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can delete leads" ON public.leads;
DROP POLICY IF EXISTS "Authenticated users can insert leads" ON public.leads;
DROP POLICY IF EXISTS "Authenticated users can read leads" ON public.leads;
DROP POLICY IF EXISTS "Authenticated users can update leads" ON public.leads;

-- ============================================================
-- FINANCE_TEAM — has project_id
-- ============================================================
DROP POLICY IF EXISTS "Auth users manage finance_team" ON public.finance_team;
CREATE POLICY "Project members manage finance_team"
  ON public.finance_team FOR ALL TO authenticated
  USING (public.is_project_member(project_id))
  WITH CHECK (public.is_project_member(project_id));

-- ============================================================
-- FINANCE_CLIENT_BILLING — via client_config_id -> clients_config.project_id
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can manage finance_client_billing" ON public.finance_client_billing;
CREATE POLICY "Project members manage finance_client_billing"
  ON public.finance_client_billing FOR ALL TO authenticated
  USING (
    client_config_id IN (
      SELECT id FROM public.clients_config WHERE public.is_project_member(project_id)
    )
  )
  WITH CHECK (
    client_config_id IN (
      SELECT id FROM public.clients_config WHERE public.is_project_member(project_id)
    )
  );

-- ============================================================
-- FINANCE_CLIENT_SERVICES — via client_config_id -> clients_config.project_id
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can manage finance_client_services" ON public.finance_client_services;
CREATE POLICY "Project members manage finance_client_services"
  ON public.finance_client_services FOR ALL TO authenticated
  USING (
    client_config_id IN (
      SELECT id FROM public.clients_config WHERE public.is_project_member(project_id)
    )
  )
  WITH CHECK (
    client_config_id IN (
      SELECT id FROM public.clients_config WHERE public.is_project_member(project_id)
    )
  );

-- ============================================================
-- FINANCE_MONTHS — no project_id, keep authenticated-only
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can manage finance_months" ON public.finance_months;
CREATE POLICY "Auth users manage finance_months"
  ON public.finance_months FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- SCOREBOARD_DAILY_FACTS — has project_id
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can manage scoreboard_daily_facts" ON public.scoreboard_daily_facts;
CREATE POLICY "Project members manage scoreboard_daily_facts"
  ON public.scoreboard_daily_facts FOR ALL TO authenticated
  USING (public.is_project_member(project_id))
  WITH CHECK (public.is_project_member(project_id));

-- ============================================================
-- SCOREBOARD_PLANS — has project_id
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can manage scoreboard_plans" ON public.scoreboard_plans;
CREATE POLICY "Project members manage scoreboard_plans"
  ON public.scoreboard_plans FOR ALL TO authenticated
  USING (public.is_project_member(project_id))
  WITH CHECK (public.is_project_member(project_id));

-- ============================================================
-- MONTHLY_PLANS — has project_id
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can manage monthly_plans" ON public.monthly_plans;
CREATE POLICY "Project members manage monthly_plans"
  ON public.monthly_plans FOR ALL TO authenticated
  USING (public.is_project_member(project_id))
  WITH CHECK (public.is_project_member(project_id));
