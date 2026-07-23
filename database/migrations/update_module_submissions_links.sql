ALTER TABLE public.module_submissions ADD COLUMN IF NOT EXISTS source_code_url text;
ALTER TABLE public.module_submissions ADD COLUMN IF NOT EXISTS files_url text;
ALTER TABLE public.module_submissions ADD COLUMN IF NOT EXISTS live_url text;
ALTER TABLE public.module_submissions ADD COLUMN IF NOT EXISTS testing_details text;
ALTER TABLE public.module_submissions ADD COLUMN IF NOT EXISTS deployment_details text;
ALTER TABLE public.module_submissions ADD COLUMN IF NOT EXISTS notes text; -- just in case it doesn't exist
NOTIFY pgrst, 'reload schema';
