-- Disable Row Level Security (RLS) on the new table so that the frontend can insert records using the anon key.
ALTER TABLE public.team_rewards DISABLE ROW LEVEL SECURITY;

-- If you prefer to keep RLS enabled, you can instead run:
-- CREATE POLICY "Enable access to all users" ON public.team_rewards FOR ALL USING (true) WITH CHECK (true);
