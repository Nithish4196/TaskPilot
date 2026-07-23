-- Run this ENTIRE block in your Supabase SQL Editor to fix the 401 Unauthorized error!

-- 1. Disable RLS (if it's blocking requests)
ALTER TABLE public.team_rewards DISABLE ROW LEVEL SECURITY;

-- 2. Explicitly Grant Privileges to the anon role
GRANT ALL ON TABLE public.team_rewards TO anon;
GRANT ALL ON TABLE public.team_rewards TO authenticated;
GRANT ALL ON TABLE public.team_rewards TO service_role;

-- 3. If Supabase forces RLS to remain enabled, we create a policy that allows everything:
DROP POLICY IF EXISTS "Allow all for anon" ON public.team_rewards;
CREATE POLICY "Allow all for anon" ON public.team_rewards FOR ALL USING (true) WITH CHECK (true);

-- 4. Re-enable RLS so the policy takes effect (Safest approach for Supabase)
ALTER TABLE public.team_rewards ENABLE ROW LEVEL SECURITY;
