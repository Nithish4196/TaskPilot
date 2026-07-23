-- Add project_id to daily_updates to link updates to a specific project
ALTER TABLE public.daily_updates ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE;
