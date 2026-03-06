
-- RLS policies for content_tasks
ALTER TABLE public.content_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read content_tasks"
  ON public.content_tasks FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert content_tasks"
  ON public.content_tasks FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update content_tasks"
  ON public.content_tasks FOR UPDATE
  USING (true);

-- Storage policies for content_assets bucket
CREATE POLICY "Public read content_assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'content_assets');

CREATE POLICY "Anyone can upload to content_assets"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'content_assets');
