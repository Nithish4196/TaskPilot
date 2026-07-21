ALTER TABLE public.daily_team_reports ADD COLUMN IF NOT EXISTS submitted_by uuid REFERENCES public.employees(id) ON DELETE CASCADE;
ALTER TABLE public.daily_team_reports ADD COLUMN IF NOT EXISTS summary text;
ALTER TABLE public.daily_team_reports ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();
NOTIFY pgrst, 'reload schema';
