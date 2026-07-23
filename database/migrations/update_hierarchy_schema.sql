-- 1. Create project_teams table
CREATE TABLE IF NOT EXISTS public.project_teams (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
    team_name text NOT NULL,
    team_leader_id uuid REFERENCES public.employees(id),
    team_members uuid[] DEFAULT '{}',
    created_at timestamptz DEFAULT now()
);

-- 2. Create project_modules table
CREATE TABLE IF NOT EXISTS public.project_modules (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
    team_id uuid REFERENCES public.project_teams(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    status text DEFAULT 'Not Started',
    created_at timestamptz DEFAULT now()
);

-- 3. Alter tasks to link to project_modules
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS module_id uuid REFERENCES public.project_modules(id) ON DELETE CASCADE;

-- 4. Alter tasks to add TL review states
-- Make sure the frontend knows that "Pending Review" means TL needs to review it before Manager
-- We already have approval_status, so we'll just allow new string values: 'Pending TL Review', 'Rejected by TL', 'Approved by TL', 'Pending Manager Review', etc.

-- 5. RLS permissions (Disabled for ease of frontend dev)
ALTER TABLE public.project_teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_modules DISABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE public.project_teams TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.project_modules TO anon, authenticated, service_role;
