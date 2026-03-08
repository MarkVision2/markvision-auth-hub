-- Fix content_tasks: restrict to authenticated only
DROP POLICY IF EXISTS "Anyone can delete content_tasks" ON public.content_tasks;
DROP POLICY IF EXISTS "Anyone can insert content_tasks" ON public.content_tasks;
DROP POLICY IF EXISTS "Anyone can read content_tasks" ON public.content_tasks;
DROP POLICY IF EXISTS "Anyone can update content_tasks" ON public.content_tasks;

CREATE POLICY "Auth users read content_tasks" ON public.content_tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users insert content_tasks" ON public.content_tasks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users update content_tasks" ON public.content_tasks FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth users delete content_tasks" ON public.content_tasks FOR DELETE TO authenticated USING (true);

-- Fix crm_messages: restrict to authenticated only
DROP POLICY IF EXISTS "Anyone can delete crm_messages" ON public.crm_messages;
DROP POLICY IF EXISTS "Anyone can insert crm_messages" ON public.crm_messages;
DROP POLICY IF EXISTS "Anyone can read crm_messages" ON public.crm_messages;
DROP POLICY IF EXISTS "Anyone can update crm_messages" ON public.crm_messages;

CREATE POLICY "Auth users read crm_messages" ON public.crm_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users insert crm_messages" ON public.crm_messages FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users update crm_messages" ON public.crm_messages FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth users delete crm_messages" ON public.crm_messages FOR DELETE TO authenticated USING (true);

-- Fix crm_notes: restrict to authenticated only
DROP POLICY IF EXISTS "Anyone can delete crm_notes" ON public.crm_notes;
DROP POLICY IF EXISTS "Anyone can insert crm_notes" ON public.crm_notes;
DROP POLICY IF EXISTS "Anyone can read crm_notes" ON public.crm_notes;

CREATE POLICY "Auth users read crm_notes" ON public.crm_notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users insert crm_notes" ON public.crm_notes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users update crm_notes" ON public.crm_notes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth users delete crm_notes" ON public.crm_notes FOR DELETE TO authenticated USING (true);

-- Fix crm_automations: restrict to authenticated only
DROP POLICY IF EXISTS "Anyone can delete crm_automations" ON public.crm_automations;
DROP POLICY IF EXISTS "Anyone can insert crm_automations" ON public.crm_automations;
DROP POLICY IF EXISTS "Anyone can read crm_automations" ON public.crm_automations;
DROP POLICY IF EXISTS "Anyone can update crm_automations" ON public.crm_automations;

CREATE POLICY "Auth users read crm_automations" ON public.crm_automations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users insert crm_automations" ON public.crm_automations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users update crm_automations" ON public.crm_automations FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth users delete crm_automations" ON public.crm_automations FOR DELETE TO authenticated USING (true);