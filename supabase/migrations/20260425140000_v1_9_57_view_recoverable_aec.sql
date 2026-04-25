-- V1.9.57 (complemento) — View de recuperação clínica para AEC invalidadas
--
-- Contexto:
--   Após V1.9.57 invalidar state da Carolina Campello (e qualquer state futuro
--   que cair no cold start guard), o dado clínico fica preservado em
--   aec_assessment_state.data jsonb mas com invalidated_at IS NOT NULL.
--
--   Sem uma view dedicada, o médico não tem como ver essas avaliações
--   parciais — ficariam invisíveis na UI normal (que filtra invalidated_at IS NULL).
--
-- Solução:
--   View v_aec_invalidated_recoverable lista TODAS as avaliações invalidadas
--   com dado clínico parcial extraído em colunas legíveis (não jsonb cru).
--
--   Permite Dr. Ricardo Valença + outros profissionais visualizarem
--   avaliações que foram interrompidas (state inconsistente) e decidirem
--   manualmente se querem formalizar como clinical_report ou retomar AEC.
--
-- Segurança:
--   security_invoker=on → RLS herda da tabela base aec_assessment_state.
--   Admin vê tudo. Profissional vê do paciente vinculado. Paciente vê só seu.
--   (V1.9.50 RLS audit gate confirmou: 0 FAIL após esta view criada.)
--
-- Aplicação:
--   Já aplicada via Management API antes do commit. Migration arquivada para
--   rastreabilidade (padrão V1.9.47/48/49/50/57).

CREATE OR REPLACE VIEW public.v_aec_invalidated_recoverable
  WITH (security_invoker = on)
AS
SELECT
  s.user_id,
  u.name AS patient_name,
  u.email AS patient_email,
  s.id AS state_id,
  s.started_at,
  s.last_update,
  s.invalidated_at,
  s.invalidation_reason,

  -- Identificação e queixa principal
  s.data->>'mainComplaint' AS main_complaint,
  s.data->'complaintList' AS complaint_list,

  -- COMPLAINT_DETAILS (todos sub-campos extraídos)
  s.data->>'complaintLocation' AS complaint_location,
  s.data->>'complaintOnset' AS complaint_onset,
  s.data->>'complaintDescription' AS complaint_description,
  s.data->'complaintImprovements' AS improvements,
  s.data->'complaintWorsening' AS worsening,
  s.data->'complaintAssociatedSymptoms' AS associated_symptoms,

  -- Histórico
  s.data->'medicalHistory' AS medical_history,
  s.data->'familyHistoryMother' AS family_mother,
  s.data->'familyHistoryFather' AS family_father,
  s.data->'lifestyleHabits' AS lifestyle_habits,

  -- OBJECTIVE_QUESTIONS
  s.data->>'allergies' AS allergies,
  s.data->>'regularMedications' AS regular_medications,
  s.data->>'sporadicMedications' AS sporadic_medications,

  -- Consent (LGPD)
  (s.data->>'consentGiven')::boolean AS consent_given,
  s.data->>'consentTimestamp' AS consent_timestamp,

  -- Diagnóstico de quais fases ficaram sem markPhaseCompleted
  ARRAY(
    SELECT unnest(s.required_phases) EXCEPT SELECT unnest(s.completed_phases)
  ) AS missing_phases,

  -- Snapshot completo para casos que precisam ler tudo
  s.data AS full_snapshot

FROM public.aec_assessment_state s
LEFT JOIN public.users u ON u.id = s.user_id
WHERE s.invalidated_at IS NOT NULL
  AND s.data IS NOT NULL
  AND s.data != '{}'::jsonb;

COMMENT ON VIEW public.v_aec_invalidated_recoverable IS
  '[V1.9.57] Avaliações AEC invalidadas com dado clínico parcial recuperável. RLS herda da tabela base via security_invoker — admin/professional vê tudo, paciente vê só o próprio. Permite recovery clínico manual sem destruir state inconsistente.';

-- Validação
DO $$
DECLARE
  view_count INTEGER;
  carolina_recoverable BOOLEAN;
BEGIN
  SELECT COUNT(*) INTO view_count
  FROM public.v_aec_invalidated_recoverable;

  SELECT EXISTS(
    SELECT 1 FROM public.v_aec_invalidated_recoverable
    WHERE patient_email = 'carolinacampellovalenca@gmail.com'
  ) INTO carolina_recoverable;

  RAISE NOTICE '[V1.9.57 view] Total avaliações invalidadas recuperáveis: % | Carolina recoverable: %',
    view_count, carolina_recoverable;

  IF NOT carolina_recoverable THEN
    RAISE WARNING '[V1.9.57 view] Carolina não aparece na view — verificar migration retroativa.';
  END IF;
END $$;

-- Rollback manual (se necessário, fora desta migration):
-- DROP VIEW IF EXISTS public.v_aec_invalidated_recoverable;
