-- Add rating and changes_made columns to daily_work_submissions
ALTER TABLE public.daily_work_submissions ADD COLUMN IF NOT EXISTS rating integer CHECK (rating >= 1 AND rating <= 5);
ALTER TABLE public.daily_work_submissions ADD COLUMN IF NOT EXISTS changes_made text;
ALTER TABLE public.daily_work_submissions ADD COLUMN IF NOT EXISTS version integer DEFAULT 1;
ALTER TABLE public.daily_work_submissions ADD COLUMN IF NOT EXISTS reviewed_at timestamp;
