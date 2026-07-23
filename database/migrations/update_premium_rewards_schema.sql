-- 1. Alter existing team_rewards table to support new premium fields
ALTER TABLE public.team_rewards ADD COLUMN IF NOT EXISTS project_id uuid;
ALTER TABLE public.team_rewards ADD COLUMN IF NOT EXISTS reward_type text DEFAULT 'Weekly';
ALTER TABLE public.team_rewards ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.team_rewards ADD COLUMN IF NOT EXISTS start_date timestamp;
ALTER TABLE public.team_rewards ADD COLUMN IF NOT EXISTS end_date timestamp;
ALTER TABLE public.team_rewards ADD COLUMN IF NOT EXISTS claim_deadline timestamp;
ALTER TABLE public.team_rewards ADD COLUMN IF NOT EXISTS max_winners integer;

-- 2. Create reward_claims table to track individual eligibility and claims
CREATE TABLE IF NOT EXISTS public.reward_claims (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    reward_id uuid REFERENCES public.team_rewards(id) ON DELETE CASCADE,
    employee_id uuid REFERENCES public.employees(id) ON DELETE CASCADE,
    status text DEFAULT 'Unlocked', -- 'Unlocked', 'Claimed', 'Not Claimed', 'Expired'
    earned_at timestamp DEFAULT now(),
    claimed_at timestamp,
    UNIQUE(reward_id, employee_id)
);

-- 3. Create reward_settings table to store global configurations
CREATE TABLE IF NOT EXISTS public.reward_settings (
    id integer PRIMARY KEY DEFAULT 1,
    allow_multiple_claims boolean DEFAULT false
);

-- Insert default setting
INSERT INTO public.reward_settings (id, allow_multiple_claims) 
VALUES (1, false) 
ON CONFLICT (id) DO NOTHING;

-- 4. Disable RLS and Grant Permissions (simplest approach for frontend anon key)
ALTER TABLE public.team_rewards DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_claims DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_settings DISABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE public.team_rewards TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.reward_claims TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.reward_settings TO anon, authenticated, service_role;

-- 5. Storage Bucket (Run this manually in Supabase Dashboard -> Storage -> New Bucket)
-- Name: reward_images
-- Public: YES
