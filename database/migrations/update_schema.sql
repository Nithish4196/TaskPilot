-- Add approval_status to tasks
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'Pending';
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS reward_points integer DEFAULT 0;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS reward_bonus_coins integer DEFAULT 0;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS reward_badge text;

-- Create team_rewards table
CREATE TABLE IF NOT EXISTS public.team_rewards (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    team_name text NOT NULL,
    week_number integer NOT NULL,
    title text NOT NULL,
    description text,
    category text,
    icon text,
    reward_date date,
    reward_value text,
    rules jsonb,
    deadline timestamptz NOT NULL,
    status text DEFAULT 'Locked',
    created_at timestamptz DEFAULT now()
);

-- Note: We can rely on AppContext.jsx to handle real-time automatic evaluation
-- OR we can add a Postgres Trigger if we prefer, but for this project we'll do it in React context for simpler frontend real-time updates.

-- Ensure realtime is enabled for team_rewards
alter publication supabase_realtime add table team_rewards;
