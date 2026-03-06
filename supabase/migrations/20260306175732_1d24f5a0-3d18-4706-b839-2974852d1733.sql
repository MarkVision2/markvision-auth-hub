
-- crm_messages table
CREATE TABLE public.crm_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  direction text NOT NULL DEFAULT 'inbound' CHECK (direction IN ('inbound', 'outbound')),
  sender_type text NOT NULL DEFAULT 'client' CHECK (sender_type IN ('client', 'ai', 'manager')),
  body text NOT NULL,
  channel text DEFAULT 'whatsapp' CHECK (channel IN ('whatsapp', 'instagram', 'web', 'telegram')),
  read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- crm_notes table
CREATE TABLE public.crm_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  author_name text NOT NULL DEFAULT 'Менеджер',
  body text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- crm_automations table
CREATE TABLE public.crm_automations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  trigger_type text NOT NULL,
  trigger_value text NOT NULL,
  action_type text NOT NULL,
  action_detail text,
  icon text DEFAULT 'zap',
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- RLS policies for crm_messages
ALTER TABLE public.crm_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read crm_messages" ON public.crm_messages FOR SELECT USING (true);
CREATE POLICY "Anyone can insert crm_messages" ON public.crm_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update crm_messages" ON public.crm_messages FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete crm_messages" ON public.crm_messages FOR DELETE USING (true);

-- RLS policies for crm_notes
ALTER TABLE public.crm_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read crm_notes" ON public.crm_notes FOR SELECT USING (true);
CREATE POLICY "Anyone can insert crm_notes" ON public.crm_notes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete crm_notes" ON public.crm_notes FOR DELETE USING (true);

-- RLS policies for crm_automations
ALTER TABLE public.crm_automations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read crm_automations" ON public.crm_automations FOR SELECT USING (true);
CREATE POLICY "Anyone can insert crm_automations" ON public.crm_automations FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update crm_automations" ON public.crm_automations FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete crm_automations" ON public.crm_automations FOR DELETE USING (true);

-- Enable realtime for crm_messages and crm_notes
ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_notes;
