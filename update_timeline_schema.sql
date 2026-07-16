-- 1. Alter project_modules table to include timeline and priority
ALTER TABLE public.project_modules ADD COLUMN IF NOT EXISTS start_date date;
ALTER TABLE public.project_modules ADD COLUMN IF NOT EXISTS end_date date;
ALTER TABLE public.project_modules ADD COLUMN IF NOT EXISTS priority text DEFAULT 'Medium';

-- 2. Create notifications table for the JIT Evaluation Engine
CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    recipient_id uuid REFERENCES public.employees(id) ON DELETE CASCADE,
    title text NOT NULL,
    message text NOT NULL,
    type text NOT NULL, -- e.g., 'deadline_warning', 'module_start', 'overdue'
    reference_id uuid, -- could be a task_id or module_id
    is_read boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- Note: We assume tasks table already has start_date and due_date from previous schema update.

-- 3. Add priority to projects table (missing from earlier schema)
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS priority text DEFAULT 'Medium';
