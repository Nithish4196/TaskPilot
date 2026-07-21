-- Add Manager feedback to module submissions
ALTER TABLE public.module_submissions ADD COLUMN IF NOT EXISTS manager_feedback text;
ALTER TABLE public.module_submissions ADD COLUMN IF NOT EXISTS rating integer CHECK (rating >= 1 AND rating <= 5);
ALTER TABLE public.module_submissions ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

-- Add Manager feedback to final team reports
ALTER TABLE public.final_team_reports ADD COLUMN IF NOT EXISTS manager_feedback text;
ALTER TABLE public.final_team_reports ADD COLUMN IF NOT EXISTS rating integer CHECK (rating >= 1 AND rating <= 5);
ALTER TABLE public.final_team_reports ADD COLUMN IF NOT EXISTS status text DEFAULT 'Pending';
ALTER TABLE public.final_team_reports ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

-- Force schema reload
NOTIFY pgrst, 'reload schema';
