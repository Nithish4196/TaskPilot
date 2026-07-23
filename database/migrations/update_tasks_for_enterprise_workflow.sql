-- 1. Alter tasks table to support detailed final review and rating
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS final_rating integer CHECK (final_rating >= 1 AND final_rating <= 5);
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS quality_score integer CHECK (quality_score >= 1 AND quality_score <= 100);
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS tl_feedback text;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS improvement_suggestions text;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS approved_at timestamptz;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES public.employees(id);

-- 2. Alter daily_work_submissions to make sure everything needed is there
ALTER TABLE public.daily_work_submissions ADD COLUMN IF NOT EXISTS rating integer CHECK (rating >= 1 AND rating <= 5);
ALTER TABLE public.daily_work_submissions ADD COLUMN IF NOT EXISTS changes_made text;
ALTER TABLE public.daily_work_submissions ADD COLUMN IF NOT EXISTS version integer DEFAULT 1;
ALTER TABLE public.daily_work_submissions ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;
ALTER TABLE public.daily_work_submissions ADD COLUMN IF NOT EXISTS blockers text;
ALTER TABLE public.daily_work_submissions ADD COLUMN IF NOT EXISTS previous_progress integer DEFAULT 0;
ALTER TABLE public.daily_work_submissions ADD COLUMN IF NOT EXISTS progress_added integer DEFAULT 0;
ALTER TABLE public.daily_work_submissions ADD COLUMN IF NOT EXISTS remaining_progress integer DEFAULT 100;

-- 3. Alter task_deliverables to support detailed final review deliverables
ALTER TABLE public.task_deliverables ADD COLUMN IF NOT EXISTS source_code_url text;
ALTER TABLE public.task_deliverables ADD COLUMN IF NOT EXISTS files_url text;
ALTER TABLE public.task_deliverables ADD COLUMN IF NOT EXISTS final_notes text;
ALTER TABLE public.task_deliverables ADD COLUMN IF NOT EXISTS testing_details text;
ALTER TABLE public.task_deliverables ADD COLUMN IF NOT EXISTS deployment_details text;

-- 4. Alter project_modules to track when and by whom the module was started
ALTER TABLE public.project_modules ADD COLUMN IF NOT EXISTS started_by uuid REFERENCES public.employees(id);
ALTER TABLE public.project_modules ADD COLUMN IF NOT EXISTS started_at timestamptz;
ALTER TABLE public.project_modules ADD COLUMN IF NOT EXISTS module_started boolean DEFAULT false;

-- 5. Alter daily_work_submissions and tasks for detailed hours and estimation tracking
ALTER TABLE public.daily_work_submissions ADD COLUMN IF NOT EXISTS hours_worked integer DEFAULT 0;
ALTER TABLE public.daily_work_submissions ADD COLUMN IF NOT EXISTS minutes_worked integer DEFAULT 0;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS estimated_hours integer DEFAULT 0;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS actual_hours integer DEFAULT 0;
