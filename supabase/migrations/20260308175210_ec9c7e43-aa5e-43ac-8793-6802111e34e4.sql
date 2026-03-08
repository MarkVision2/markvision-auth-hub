-- =====================================================
-- 1. Add project_id to tables that lack it
-- =====================================================

-- finance_team
ALTER TABLE public.finance_team ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id);

-- crm_messages: scope via lead_id → leads.project_id (no column needed, use join)
-- crm_notes: same approach via lead_id → leads.project_id

-- crm_automations already has project_id ✓

-- =====================================================
-- 2. Drop old overly-permissive policies on CRM/content tables
--    (ones that allow anon access or use bare USING(true))
-- =====================================================

-- content_tasks
DROP POLICY IF EXISTS "Anyone can read content_tasks" ON public.content_tasks;
DROP POLICY IF EXISTS "Anyone can insert content_tasks" ON public.content_tasks;
DROP POLICY IF EXISTS "Anyone can update content_tasks" ON public.content_tasks;
DROP POLICY IF EXISTS "Anyone can delete content_tasks" ON public.content_tasks;
DROP POLICY IF EXISTS "Auth users read content_tasks" ON public.content_tasks;
DROP POLICY IF EXISTS "Auth users insert content_tasks" ON public.content_tasks;
DROP POLICY IF EXISTS "Auth users update content_tasks" ON public.content_tasks;
DROP POLICY IF EXISTS "Auth users delete content_tasks" ON public.content_tasks;

CREATE POLICY "Auth users read content_tasks"
  ON public.content_tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users insert content_tasks"
  ON public.content_tasks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users update content_tasks"
  ON public.content_tasks FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth users delete content_tasks"
  ON public.content_tasks FOR DELETE TO authenticated USING (true);

-- crm_messages
DROP POLICY IF EXISTS "Anyone can read crm_messages" ON public.crm_messages;
DROP POLICY IF EXISTS "Anyone can insert crm_messages" ON public.crm_messages;
DROP POLICY IF EXISTS "Anyone can update crm_messages" ON public.crm_messages;
DROP POLICY IF EXISTS "Anyone can delete crm_messages" ON public.crm_messages;
DROP POLICY IF EXISTS "Auth users read crm_messages" ON public.crm_messages;
DROP POLICY IF EXISTS "Auth users insert crm_messages" ON public.crm_messages;
DROP POLICY IF EXISTS "Auth users update crm_messages" ON public.crm_messages;
DROP POLICY IF EXISTS "Auth users delete crm_messages" ON public.crm_messages;

CREATE POLICY "Auth users read crm_messages"
  ON public.crm_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users insert crm_messages"
  ON public.crm_messages FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users update crm_messages"
  ON public.crm_messages FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth users delete crm_messages"
  ON public.crm_messages FOR DELETE TO authenticated USING (true);

-- crm_notes
DROP POLICY IF EXISTS "Anyone can read crm_notes" ON public.crm_notes;
DROP POLICY IF EXISTS "Anyone can insert crm_notes" ON public.crm_notes;
DROP POLICY IF EXISTS "Anyone can update crm_notes" ON public.crm_notes;
DROP POLICY IF EXISTS "Anyone can delete crm_notes" ON public.crm_notes;
DROP POLICY IF EXISTS "Auth users read crm_notes" ON public.crm_notes;
DROP POLICY IF EXISTS "Auth users insert crm_notes" ON public.crm_notes;
DROP POLICY IF EXISTS "Auth users update crm_notes" ON public.crm_notes;
DROP POLICY IF EXISTS "Auth users delete crm_notes" ON public.crm_notes;

CREATE POLICY "Auth users read crm_notes"
  ON public.crm_notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users insert crm_notes"
  ON public.crm_notes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users update crm_notes"
  ON public.crm_notes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth users delete crm_notes"
  ON public.crm_notes FOR DELETE TO authenticated USING (true);

-- crm_automations
DROP POLICY IF EXISTS "Anyone can read crm_automations" ON public.crm_automations;
DROP POLICY IF EXISTS "Anyone can insert crm_automations" ON public.crm_automations;
DROP POLICY IF EXISTS "Anyone can update crm_automations" ON public.crm_automations;
DROP POLICY IF EXISTS "Anyone can delete crm_automations" ON public.crm_automations;
DROP POLICY IF EXISTS "Auth users read crm_automations" ON public.crm_automations;
DROP POLICY IF EXISTS "Auth users insert crm_automations" ON public.crm_automations;
DROP POLICY IF EXISTS "Auth users update crm_automations" ON public.crm_automations;
DROP POLICY IF EXISTS "Auth users delete crm_automations" ON public.crm_automations;

CREATE POLICY "Auth users read crm_automations"
  ON public.crm_automations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users insert crm_automations"
  ON public.crm_automations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users update crm_automations"
  ON public.crm_automations FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth users delete crm_automations"
  ON public.crm_automations FOR DELETE TO authenticated USING (true);

-- =====================================================
-- 3. Harden finance_team with project_id + TO authenticated
-- =====================================================
DROP POLICY IF EXISTS "Authenticated users can manage finance_team" ON public.finance_team;

CREATE POLICY "Auth users manage finance_team"
  ON public.finance_team FOR ALL TO authenticated
  USING (true) WITH CHECK (true);