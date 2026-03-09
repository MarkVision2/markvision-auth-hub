
-- Add WhatsApp Green-API columns to clients_config
ALTER TABLE public.clients_config
  ADD COLUMN IF NOT EXISTS wa_instance_id text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS wa_api_token text DEFAULT NULL;

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  message_text text NOT NULL,
  is_inbound boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS policy: project members only (via lead -> project_id)
CREATE POLICY "Project members manage chat_messages"
  ON public.chat_messages FOR ALL TO authenticated
  USING (lead_id IN (SELECT id FROM public.leads WHERE is_project_member(project_id)))
  WITH CHECK (lead_id IN (SELECT id FROM public.leads WHERE is_project_member(project_id)));
