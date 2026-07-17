-- 1. Disable Row Level Security (RLS) on the reminders table so the frontend can insert using Anon key
ALTER TABLE public.reminders DISABLE ROW LEVEL SECURITY;

-- 2. Disable Row Level Security (RLS) on the notifications table so JIT notifications can be inserted
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;

-- 3. Add the missing 'assigned_to' column that is causing the 400 Bad Request error
ALTER TABLE public.reminders ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES public.employees(id) ON DELETE CASCADE;
