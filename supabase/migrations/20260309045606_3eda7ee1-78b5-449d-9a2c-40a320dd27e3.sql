
-- Add RLS policies for retention_templates
CREATE POLICY "Project members manage retention_templates"
ON public.retention_templates
FOR ALL
TO authenticated
USING (is_project_member(project_id))
WITH CHECK (is_project_member(project_id));

-- Add RLS policies for retention_tasks
CREATE POLICY "Project members manage retention_tasks"
ON public.retention_tasks
FOR ALL
TO authenticated
USING (is_project_member(project_id))
WITH CHECK (is_project_member(project_id));
