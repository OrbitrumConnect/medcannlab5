
-- Add trial_ends_at column to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

-- Backfill existing patients: trial = created_at + 3 days
UPDATE public.users
SET trial_ends_at = created_at + INTERVAL '3 days'
WHERE type IN ('paciente', 'patient')
  AND trial_ends_at IS NULL
  AND created_at IS NOT NULL;

-- Trigger to auto-set trial_ends_at for new patients
CREATE OR REPLACE FUNCTION public.set_trial_ends_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.type IN ('paciente', 'patient') AND NEW.trial_ends_at IS NULL THEN
    NEW.trial_ends_at := COALESCE(NEW.created_at, now()) + INTERVAL '3 days';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_trial_ends_at ON public.users;
CREATE TRIGGER trg_set_trial_ends_at
  BEFORE INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.set_trial_ends_at();
