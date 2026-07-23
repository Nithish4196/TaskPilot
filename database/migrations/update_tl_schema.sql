-- 1. Alter tasks table to include more metadata for TL assignments
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS task_type text;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS start_date date;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS attachments text; -- Storing URLs as text or JSON

-- 2. Create task_deliverables table
CREATE TABLE IF NOT EXISTS public.task_deliverables (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE,
    employee_id uuid REFERENCES public.employees(id) ON DELETE CASCADE,
    link_url text NOT NULL,
    description text,
    submitted_at timestamptz DEFAULT now()
);

-- 3. Create task_history table
CREATE TABLE IF NOT EXISTS public.task_history (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE,
    performed_by uuid REFERENCES public.employees(id),
    action text NOT NULL, -- e.g., 'Created', 'Assigned', 'Status Changed', 'Deliverable Submitted', 'Approved', 'Rejected'
    old_status text,
    new_status text,
    comments text,
    timestamp timestamptz DEFAULT now()
);

-- 4. Set Permissions
ALTER TABLE public.task_deliverables DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_history DISABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE public.task_deliverables TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.task_history TO anon, authenticated, service_role;

-- 5. Add to realtime
alter publication supabase_realtime add table task_deliverables;
alter publication supabase_realtime add table task_history;
