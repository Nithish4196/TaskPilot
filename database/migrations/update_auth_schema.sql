-- Add requires_password_change column
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS requires_password_change BOOLEAN DEFAULT true;

-- Ensure auth trigger isn't needed anymore, but we can verify RLS works.
