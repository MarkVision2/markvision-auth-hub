
CREATE POLICY "Anyone can delete content_tasks"
  ON public.content_tasks FOR DELETE TO authenticated
  USING (true);
