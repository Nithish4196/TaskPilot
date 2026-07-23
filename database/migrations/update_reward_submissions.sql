-- Create reward_submissions table
CREATE TABLE IF NOT EXISTS public.reward_submissions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    reward_id uuid REFERENCES public.team_rewards(id) ON DELETE CASCADE,
    employee_id uuid REFERENCES public.employees(id) ON DELETE CASCADE,
    project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
    team_name text,
    status text DEFAULT 'Submitted for Review', -- 'Submitted for Review', 'Approved', 'Rejected'
    manager_comments text,
    submitted_at timestamp DEFAULT now(),
    reviewed_at timestamp,
    UNIQUE(reward_id, employee_id)
);

-- Disable RLS and Grant Permissions
ALTER TABLE public.reward_submissions DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.reward_submissions TO anon, authenticated, service_role;
