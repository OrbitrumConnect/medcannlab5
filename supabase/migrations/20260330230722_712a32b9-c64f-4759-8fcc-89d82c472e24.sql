
-- Add consent and onboarding tracking fields to users table
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS consent_accepted_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz DEFAULT NULL;

-- Comment for clarity
COMMENT ON COLUMN public.users.consent_accepted_at IS 'Timestamp when user accepted LGPD consent terms';
COMMENT ON COLUMN public.users.onboarding_completed_at IS 'Timestamp when user completed the guided tutorial';
