-- Enterprise Calendar Schema Update

CREATE TABLE IF NOT EXISTS public.reminders (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    description text,
    created_by uuid REFERENCES public.employees(id) ON DELETE CASCADE,
    assigned_by uuid REFERENCES public.employees(id) ON DELETE CASCADE,
    assigned_to uuid REFERENCES public.employees(id) ON DELETE CASCADE,
    project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
    team_id uuid REFERENCES public.project_teams(id) ON DELETE CASCADE,
    reminder_date date NOT NULL,
    reminder_time time NOT NULL,
    priority text DEFAULT 'Medium', -- High, Medium, Low
    status text DEFAULT 'Pending', -- Pending, Completed, Overdue
    type text NOT NULL, -- 'Personal', 'Team Leader', 'Manager'
    created_at timestamptz DEFAULT now()
);

-- Enable RLS (Assuming basic RLS policies will be managed at the app layer or globally)
-- No strict RLS policies are applied here to avoid locking out users in MVP, 
-- but in production we'd restrict SELECT based on created_by or team_id.
