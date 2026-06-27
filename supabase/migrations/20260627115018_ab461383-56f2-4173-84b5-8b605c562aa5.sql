ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS transcript jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS youtube_id text,
  ADD COLUMN IF NOT EXISTS last_error text;