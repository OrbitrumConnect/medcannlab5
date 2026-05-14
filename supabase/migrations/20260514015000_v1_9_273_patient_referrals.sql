-- V1.9.273 — patient_referrals (consent-first, LGPD art. 11 §1 + CFM 2.314 art. 8)
-- Pedro+Ricardo+João aprovaram modelo 13/05 noite. Schema enxuto, RLS rigorosa.
BEGIN;

CREATE TABLE IF NOT EXISTS public.patient_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_doctor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  to_doctor_id   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  patient_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN (
    'agenda_cheia','especialidade','ferias','segunda_opiniao','outro'
  )),
  status TEXT NOT NULL DEFAULT 'pending_patient_consent' CHECK (status IN (
    'pending_patient_consent','accepted','declined_by_patient','revoked'
  )),
  consent_given_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT no_self_referral CHECK (from_doctor_id <> to_doctor_id)
);

CREATE INDEX IF NOT EXISTS idx_pr_to_status ON public.patient_referrals (to_doctor_id, status);
CREATE INDEX IF NOT EXISTS idx_pr_from ON public.patient_referrals (from_doctor_id);
CREATE INDEX IF NOT EXISTS idx_pr_patient ON public.patient_referrals (patient_id);

ALTER TABLE public.patient_referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS pr_select_from ON public.patient_referrals;
CREATE POLICY pr_select_from ON public.patient_referrals
  FOR SELECT USING (auth.uid() = from_doctor_id);

DROP POLICY IF EXISTS pr_select_to ON public.patient_referrals;
CREATE POLICY pr_select_to ON public.patient_referrals
  FOR SELECT USING (auth.uid() = to_doctor_id AND status = 'accepted');

DROP POLICY IF EXISTS pr_select_patient ON public.patient_referrals;
CREATE POLICY pr_select_patient ON public.patient_referrals
  FOR SELECT USING (auth.uid() = patient_id);

DROP POLICY IF EXISTS pr_insert_from ON public.patient_referrals;
CREATE POLICY pr_insert_from ON public.patient_referrals
  FOR INSERT WITH CHECK (
    auth.uid() = from_doctor_id
    AND EXISTS (
      SELECT 1 FROM public.users u WHERE u.id = patient_id
      AND (u.invited_by = auth.uid() OR u.id IN (
        SELECT a.patient_id FROM public.appointments a
        WHERE a.professional_id = auth.uid()
      ))
    )
  );

DROP POLICY IF EXISTS pr_update_patient ON public.patient_referrals;
CREATE POLICY pr_update_patient ON public.patient_referrals
  FOR UPDATE USING (auth.uid() = patient_id) WITH CHECK (auth.uid() = patient_id);

DROP POLICY IF EXISTS pr_update_from ON public.patient_referrals;
CREATE POLICY pr_update_from ON public.patient_referrals
  FOR UPDATE USING (auth.uid() = from_doctor_id AND status = 'pending_patient_consent')
  WITH CHECK (auth.uid() = from_doctor_id);

CREATE OR REPLACE FUNCTION public.tg_patient_referrals_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_patient_referrals_updated_at ON public.patient_referrals;
CREATE TRIGGER trg_patient_referrals_updated_at
  BEFORE UPDATE ON public.patient_referrals
  FOR EACH ROW EXECUTE FUNCTION public.tg_patient_referrals_updated_at();

COMMENT ON TABLE public.patient_referrals IS 'V1.9.273 — Direcionamento de pacientes entre médicos com consent-first (LGPD art. 11 §1 + CFM 2.314 art. 8). Aprovado Pedro+Ricardo+João 13/05.';

COMMIT;
