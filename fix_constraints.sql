-- Remove NOT NULL constraints that are causing the 400 errors during insert
ALTER TABLE public.team_rewards ALTER COLUMN week_number DROP NOT NULL;
ALTER TABLE public.team_rewards ALTER COLUMN deadline DROP NOT NULL;
