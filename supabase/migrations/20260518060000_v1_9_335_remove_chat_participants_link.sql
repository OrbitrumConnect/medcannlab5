-- V1.9.335 — Remove UNION chat_participants de is_professional_patient_link
-- PARECER_FISCAL_INDEPENDENTE_01_04 P1-13 (vazamento lateral RLS)
-- Audit empírico 18/05: 0 vínculos prof↔paciente dependendo APENAS de chat_participants.
-- TODOS os vínculos existentes têm fundamento via appointments/clinical_assessments/clinical_reports.
-- Remoção segura por verificação empírica. Memory: feedback_debitos_tecnicos_parecer_fiscal_01_04_pendentes.

CREATE OR REPLACE FUNCTION public.is_professional_patient_link(
  _patient_id uuid,
  _professional_id uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
SET row_security TO 'off'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.clinical_reports cr
    WHERE cr.patient_id = _patient_id
      AND cr.professional_id = _professional_id
    UNION
    SELECT 1
    FROM public.clinical_assessments ca
    WHERE ca.patient_id = _patient_id
      AND ca.doctor_id = _professional_id
    UNION
    SELECT 1
    FROM public.appointments a
    WHERE a.patient_id = _patient_id
      AND a.professional_id = _professional_id
    -- V1.9.335: removido UNION com chat_participants (P1-13 parecer 01/04)
    -- Audit empírico 18/05 confirmou 0 vínculos dependendo APENAS deste path
  );
$function$;

COMMENT ON FUNCTION public.is_professional_patient_link IS
  'V1.9.335 (18/05) — Vínculo prof↔paciente via clinical_reports OU clinical_assessments OU appointments. UNION com chat_participants removido após audit empírico confirmar 0 acessos dependentes (P1-13 PARECER_FISCAL 01/04).';
