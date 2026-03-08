-- Add RLS policies for project_members so users can read their own memberships
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own memberships"
ON public.project_members
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Insert the user into the project
INSERT INTO public.project_members (user_id, project_id)
VALUES ('cdc200ff-5590-4d83-94f6-b5ec2d755eed', 'c6fdc17c-3e5b-4cf9-95a8-a0ef4f08f7a5')
ON CONFLICT DO NOTHING;