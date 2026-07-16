-- Add Manager feedback to daily team reports
ALTER TABLE public.daily_team_reports ADD COLUMN IF NOT EXISTS rating integer CHECK (rating >= 1 AND rating <= 5);
ALTER TABLE public.daily_team_reports ADD COLUMN IF NOT EXISTS manager_feedback text;
ALTER TABLE public.daily_team_reports ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

-- Create Final Team Reports table
CREATE TABLE IF NOT EXISTS public.final_team_reports (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
    team_id uuid REFERENCES public.project_teams(id) ON DELETE CASCADE,
    tl_id uuid REFERENCES public.employees(id) ON DELETE CASCADE,
    project_summary text NOT NULL,
    team_performance text NOT NULL,
    technologies_used text,
    challenges text,
    improvements text,
    lessons_learned text,
    submitted_at timestamptz DEFAULT now()
);

-- Realtime
alter publication supabase_realtime add table final_team_reports;

-- Add problem solving to daily feedback
ALTER TABLE public.daily_feedback ADD COLUMN IF NOT EXISTS problem_solving_rating integer CHECK (problem_solving_rating >= 1 AND problem_solving_rating <= 5);
