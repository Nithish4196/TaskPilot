-- Alter projects table to support advanced resource assignment
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS department text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS team_leader_id uuid REFERENCES public.employees(id);
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS team_members uuid[] DEFAULT '{}';
