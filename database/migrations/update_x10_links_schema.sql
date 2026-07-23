-- 1. Add links and files (JSONB) to daily_work_submissions
ALTER TABLE public.daily_work_submissions ADD COLUMN IF NOT EXISTS links jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.daily_work_submissions ADD COLUMN IF NOT EXISTS files jsonb DEFAULT '[]'::jsonb;

-- 2. Add links, files, and team_statistics to module_submissions
ALTER TABLE public.module_submissions ADD COLUMN IF NOT EXISTS links jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.module_submissions ADD COLUMN IF NOT EXISTS files jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.module_submissions ADD COLUMN IF NOT EXISTS team_statistics jsonb DEFAULT '{}'::jsonb;

-- 3. Update existing records with default empty arrays/objects if null
UPDATE public.daily_work_submissions SET links = '[]'::jsonb WHERE links IS NULL;
UPDATE public.daily_work_submissions SET files = '[]'::jsonb WHERE files IS NULL;

UPDATE public.module_submissions SET links = '[]'::jsonb WHERE links IS NULL;
UPDATE public.module_submissions SET files = '[]'::jsonb WHERE files IS NULL;
UPDATE public.module_submissions SET team_statistics = '{}'::jsonb WHERE team_statistics IS NULL;
