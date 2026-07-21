-- ==============================================================================
-- ENTERPRISE REWARD MANAGEMENT WORKFLOW SCHEMA
-- ==============================================================================

-- 1. Create the primary enterprise_rewards table
DROP TABLE IF EXISTS public.enterprise_reward_audit_log CASCADE;
DROP TABLE IF EXISTS public.enterprise_reward_claims CASCADE;
DROP TABLE IF EXISTS public.enterprise_rewards CASCADE;

CREATE TABLE IF NOT EXISTS public.enterprise_rewards (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    description text,
    reward_type text NOT NULL, -- 'Weekly', 'Milestone', 'Grand'
    image_url text, -- Will store Supabase Storage URL
    reward_value text,
    rules text[],
    project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
    team_ids uuid[], -- Array of project_teams IDs
    module_ids uuid[], -- Array of project_modules IDs
    unlock_condition text DEFAULT 'module_completion',
    expiry_date timestamp,
    priority text DEFAULT 'Medium', -- 'Low', 'Medium', 'High', 'Urgent'
    status text DEFAULT 'Draft', -- 'Draft', 'Assigned', 'Locked', 'Waiting for TL Submission', 'Waiting for Manager Approval', 'Ready To Unlock', 'Unlocked', 'Claimed', 'Completed', 'Expired', 'Archived'
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
);

ALTER TABLE public.enterprise_rewards DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.enterprise_rewards TO anon, authenticated, service_role;

-- 2. Create the claims table
CREATE TABLE IF NOT EXISTS public.enterprise_reward_claims (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    reward_id uuid REFERENCES public.enterprise_rewards(id) ON DELETE CASCADE,
    employee_id uuid REFERENCES public.employees(id) ON DELETE CASCADE,
    claim_date timestamp DEFAULT now(),
    status text DEFAULT 'Claimed',
    UNIQUE(reward_id, employee_id)
);

ALTER TABLE public.enterprise_reward_claims DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.enterprise_reward_claims TO anon, authenticated, service_role;

-- 3. Create the audit log table
CREATE TABLE IF NOT EXISTS public.enterprise_reward_audit_log (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    reward_id uuid REFERENCES public.enterprise_rewards(id) ON DELETE CASCADE,
    action_type text NOT NULL, -- 'Created', 'Edited', 'Unlocked', 'Claimed', 'Archived', 'Deleted'
    action_by uuid REFERENCES public.employees(id) ON DELETE SET NULL, -- The user who performed the action
    action_by_role text,
    details jsonb, -- Stores what changed or specific details
    action_timestamp timestamp DEFAULT now()
);

ALTER TABLE public.enterprise_reward_audit_log DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.enterprise_reward_audit_log TO anon, authenticated, service_role;

-- 4. Set up Supabase Storage Bucket for Reward Images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('reward-images', 'reward-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- 5. Add Storage RLS Policies
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow public insert access" ON storage.objects;
DROP POLICY IF EXISTS "Allow public update access" ON storage.objects;
DROP POLICY IF EXISTS "Allow public delete access" ON storage.objects;

CREATE POLICY "Allow public read access" ON storage.objects FOR SELECT USING ( bucket_id = 'reward-images' );
CREATE POLICY "Allow public insert access" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'reward-images' );
CREATE POLICY "Allow public update access" ON storage.objects FOR UPDATE USING ( bucket_id = 'reward-images' );
CREATE POLICY "Allow public delete access" ON storage.objects FOR DELETE USING ( bucket_id = 'reward-images' );

-- 6. Add Tables to Realtime Publication
-- Need to drop them first in case they already exist to avoid errors
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'enterprise_rewards') THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.enterprise_rewards;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'enterprise_reward_claims') THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.enterprise_reward_claims;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'enterprise_reward_audit_log') THEN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.enterprise_reward_audit_log;
  END IF;
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.enterprise_rewards;
ALTER PUBLICATION supabase_realtime ADD TABLE public.enterprise_reward_claims;
ALTER PUBLICATION supabase_realtime ADD TABLE public.enterprise_reward_audit_log;

-- Force PostgREST schema cache reload to ensure APIs instantly recognize new tables and permissions
NOTIFY pgrst, 'reload schema';
