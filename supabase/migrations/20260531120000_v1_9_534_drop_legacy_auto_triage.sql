-- V1.9.534 — Drop trigger legacy auto-TRIAGE (drift arquitetural)
-- Pedro 31/05/2026
--
-- CONTEXTO: trigger pg `on_patient_created_triage` (AFTER INSERT users) +
-- function `handle_new_patient_triage` criava placeholder TRIAGE in_progress
-- com `doctor_id = Ricardo` (fallback hardcoded) toda vez que paciente novo
-- fazia signup sem `metadata.doctor_id`/`invited_by`.
--
-- DRIFT VS ARQUITETURA VALIDADA:
--   - memory project_doctor_relation_card_design_18_05: vínculo médico-paciente
--     SÓ via referral / appointment / clinical_assessment / clinical_report /
--     admin_action. NÃO existe linked_via='signup'/'auto_fallback'.
--   - memory feedback_share_overwrite_professional_id_28_05: professional_id
--     é dinâmico (overwrite no share), não grudado em médico padrão.
--   - Pedro 31/05: "paciente que cria conta NÃO TEM medico ainda a não ser
--     que tenha add quem foi que indicou ou usando referal. Vincula só após
--     AEC, share de relatório, ou marcar consulta. Comportamento normal NÃO
--     deve vincular ou criar fila pra ninguém."
--
-- EMPÍRICO ANTES DA MIGRATION:
--   - 56 rows clinical_assessments status=in_progress assessment_type=TRIAGE
--     data={} idle >7d
--   - 43 pacientes únicos
--   - 18/43 (42%) só têm a órfã (paciente cadastrou e nunca abriu AEC)
--   - 5/43 (12%) já têm clinical_report assinado (fluxo real via FSM V1.9.299)
--   - 20/43 (47%) têm appointment (vínculo legítimo posterior)
--   - 12/43 (28%) têm aec_assessment_state (AEC real via tabela nova)
--   - Trigger inerte clinicamente: InterruptedAECsCard V1.9.500 lê
--     aec_assessment_state (não clinical_assessments). Fluxo real ignora.
--
-- IMPACTO:
--   - Para de poluir prontuário com TRIAGE inerte (Card "Outras avaliações")
--   - Para de criar pseudo-vínculo Ricardo→todo-paciente-novo sem ato clínico
--   - Audit preservado: 45 rows existentes → status='reviewed' (não DELETE)
--
-- LOCKS INTOCADOS: V1.9.299 PBAD + AEC FSM + Pipeline + Matrix Z2 + verify_jwt

-- 1) Mata o gerador
DROP TRIGGER IF EXISTS on_patient_created_triage ON public.users;
DROP FUNCTION IF EXISTS public.handle_new_patient_triage();

-- 2) Audit trail das 45 rows existentes (status reviewed)
-- NOTA: já aplicado via PAT em 31/05 ~10h BRT. Bloco abaixo é idempotente
-- (rerun via supabase db push é safe — WHERE filtra já-reviewed).
UPDATE public.clinical_assessments
SET status = 'reviewed', updated_at = now()
WHERE status = 'in_progress'
  AND assessment_type = 'TRIAGE'
  AND data = '{}'::jsonb
  AND updated_at < now() - interval '7 days';

-- 3) Marcador na tabela documentando decisão
COMMENT ON TABLE public.clinical_assessments IS
  'V1.9.534 (31/05/2026): trigger auto-TRIAGE removido (drift vs arquitetura validada). Vínculo médico-paciente só via referral/appointment/clinical_assessment/clinical_report/admin_action — paciente decide. Ver memory project_doctor_relation_card_design_18_05.';
