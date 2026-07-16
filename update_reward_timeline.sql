-- Add historical timeline columns to team_rewards for permanent audit trail
ALTER TABLE public.team_rewards ADD COLUMN IF NOT EXISTS created_at timestamp DEFAULT now();
ALTER TABLE public.team_rewards ADD COLUMN IF NOT EXISTS unlocked_at timestamp;

-- Add historical timeline columns to reward_claims for permanent audit trail
ALTER TABLE public.reward_claims ADD COLUMN IF NOT EXISTS expired_at timestamp;
