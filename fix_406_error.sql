-- Enable RLS if not already enabled
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Allow anyone (authenticated or anonymous) to view employee profiles
-- This fixes the 406 Not Acceptable error on login
CREATE POLICY "Allow public read access to employees" 
ON public.employees 
FOR SELECT 
USING (true);

-- Allow authenticated users to update their OWN profile
-- This is required for the "Force Password Reset" flow to flip the requires_password_change flag
CREATE POLICY "Allow users to update their own profile" 
ON public.employees 
FOR UPDATE 
USING (auth.uid() = id);
