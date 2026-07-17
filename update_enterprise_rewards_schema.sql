-- ==============================================================================
-- ENTERPRISE REWARD MANAGEMENT WORKFLOW SCHEMA
-- ==============================================================================

-- 1. Create the primary enterprise_rewards table
CREATE TABLE IF NOT EXISTS public.enterprise_rewards (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    description text,
    reward_type text NOT NULL, -- 'Weekly', 'Milestone', 'Grand'
    image_url text, -- Will store Supabase Storage URL
    reward_value text,
    rules text[],
    project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
    team_id uuid REFERENCES public.project_teams(id) ON DELETE CASCADE,
    unlock_condition text DEFAULT 'module_completion',
    expiry_date timestamp,
    priority text DEFAULT 'Medium', -- 'Low', 'Medium', 'High', 'Urgent'
    status text DEFAULT 'Draft', -- 'Draft', 'Assigned', 'Locked', 'Ready for Unlock', 'Unlocked', 'Claimed', 'Completed', 'Expired', 'Archived'
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
);

-- 2. Create the claims table
CREATE TABLE IF NOT EXISTS public.enterprise_reward_claims (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    reward_id uuid REFERENCES public.enterprise_rewards(id) ON DELETE CASCADE,
    employee_id uuid REFERENCES public.employees(id) ON DELETE CASCADE,
    claim_date timestamp DEFAULT now(),
    status text DEFAULT 'Claimed',
    UNIQUE(reward_id, employee_id)
);

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

-- 4. Set up Supabase Storage Bucket for Reward Images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('reward-images', 'reward-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- 5. Add Storage RLS Policies
-- Allow public read access to reward images
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'reward-images' );

-- Allow authenticated inserts (Managers)
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'reward-images' AND auth.role() = 'authenticated' );

-- 6. Add Tables to Realtime Publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.enterprise_rewards;
ALTER PUBLICATION supabase_realtime ADD TABLE public.enterprise_reward_claims;
ALTER PUBLICATION supabase_realtime ADD TABLE public.enterprise_reward_audit_log;
