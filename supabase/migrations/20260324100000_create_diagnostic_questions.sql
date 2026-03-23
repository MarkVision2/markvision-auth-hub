-- Create diagnostic_questions table
CREATE TABLE IF NOT EXISTS public.diagnostic_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('text', 'textarea', 'radio', 'checkbox')),
    options JSONB DEFAULT '[]'::jsonb,
    sort_order INTEGER DEFAULT 0,
    category TEXT NOT NULL CHECK (category IN ('admin', 'doctor')),
    is_required BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.diagnostic_questions ENABLE ROW LEVEL SECURITY;

-- Policies for diagnostic_questions
-- Everyone authenticated can read questions
CREATE POLICY "Allow all authenticated users to read questions"
ON public.diagnostic_questions
FOR SELECT
TO authenticated
USING (true);

-- Only Admins can modify questions
CREATE POLICY "Allow admins to insert questions"
ON public.diagnostic_questions
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

CREATE POLICY "Allow admins to update questions"
ON public.diagnostic_questions
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

CREATE POLICY "Allow admins to delete questions"
ON public.diagnostic_questions
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- Function to handle updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER set_diagnostic_questions_updated_at
BEFORE UPDATE ON public.diagnostic_questions
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();
