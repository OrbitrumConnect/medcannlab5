-- Migration: V1.9.103 — RPC share_report_with_doctors com vínculo + promoção draft
-- Data: 30/04/2026 ~05h BRT
--
-- CONTEXTO
-- ────────
-- V1.9.102 (30/04 ~04h) salvou rascunho ANTES de Gate D' bloquear. Mas o
-- RASCUNHO ficava órfão — sem vínculo de médico, sem signature, sem
-- promoção. Pedro identificou: "quando paciente compartilha relatório,
-- vincula automaticamente — tinhamos isso já".
--
-- V1.9.103 fecha o ciclo:
--   1. RPC share_report_with_doctors agora SETA professional_id quando há
--      apenas 1 médico selecionado (vínculo explícito sem ambiguidade)
--   2. Se report está como 'draft' E paciente já consentiu, RPC PROMOVE
--      para 'shared' + popula signed_at (trigger V1.9.101 aec_finalized
--      dispara automaticamente)
--
-- REFINAMENTOS GPT-RICARDO ACEITOS:
--   - professional_id NUNCA é "primeiro da lista" arbitrário (anti-vínculo
--     arbitrário). Se >1 médico → professional_id fica NULL, mantém
--     shared_with[] (todos veem, ninguém é "principal" sem decisão clínica)
--
-- COMPATIBILIDADE COM V1.9.103 GATE (aec_gate.ts):
--   Gate ampliado aceita 3 fontes:
--     1. appointments ativos (igual)
--     2. reports.professional_id + signed_at (vem de aqui se 1 médico)
--     3. reports.shared_with[] + signed_at (vem de aqui se >1 médicos)
--
-- LOCK PRESERVATION:
--   ❌ NÃO toca handleFinalizeAssessment (pipeline)
--   ❌ NÃO toca clinicalAssessmentFlow.ts (FSM)
--   ❌ NÃO toca tradevision-core/index.ts
--   ❌ NÃO toca Verbatim First / AEC Gate V1.5 / COS Kernel / Signature
--   ✅ Apenas substitui RPC SQL (SECURITY DEFINER)
--   ✅ Reversível com restore da função antiga via migration anterior

BEGIN;

-- ──────────────────────────────────────────────────────────────────────
-- RPC share_report_with_doctors (V1.9.103)
-- ──────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.share_report_with_doctors(
  p_report_id text,
  p_patient_id uuid,
  p_doctor_ids uuid[]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_doctor_id uuid;
  v_report_status text;
  v_report_consent boolean;
  v_report_signed_at timestamptz;
  v_doctor_count int;
  v_promoted boolean := false;
  v_set_professional uuid := NULL;
BEGIN
  -- Verify ownership/existence + capturar estado atual
  SELECT cr.status, cr.consent_given, cr.signed_at
    INTO v_report_status, v_report_consent, v_report_signed_at
  FROM clinical_reports cr
  WHERE cr.id::TEXT = p_report_id
    AND (cr.patient_id = p_patient_id OR cr.patient_id::TEXT = p_patient_id::TEXT)
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Relatório não encontrado ou permissão negada');
  END IF;

  IF p_doctor_ids IS NULL OR array_length(p_doctor_ids, 1) = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Nenhum médico selecionado');
  END IF;

  v_doctor_count := array_length(p_doctor_ids, 1);

  -- ────────────────────────────────────────────────────────────────────
  -- Refinamento GPT-Ricardo: professional_id explícito SOMENTE se 1 médico
  -- ────────────────────────────────────────────────────────────────────
  IF v_doctor_count = 1 THEN
    v_set_professional := p_doctor_ids[1];
  ELSE
    -- 2+ médicos: NÃO definir vínculo arbitrário. shared_with[] continua
    -- válido pra Gate D' Fonte 3. Paciente decide depois quem é "principal".
    v_set_professional := NULL;
  END IF;

  -- ────────────────────────────────────────────────────────────────────
  -- Promoção draft → shared (V1.9.103)
  -- Se report está como 'draft' (V1.9.102 criou) E consent_given=true,
  -- promove para 'shared' + popula signed_at.
  -- Trigger V1.9.101 trg_ns_aec_finalized_update dispara automaticamente.
  -- ────────────────────────────────────────────────────────────────────
  IF v_report_status = 'draft' AND COALESCE(v_report_consent, false) = true AND v_report_signed_at IS NULL THEN
    v_promoted := true;
  END IF;

  -- UPDATE consolidado (1 query, atômico)
  IF v_promoted THEN
    UPDATE clinical_reports SET
      shared_with = p_doctor_ids,
      shared_at = NOW(),
      shared_by = p_patient_id,
      professional_id = COALESCE(v_set_professional, professional_id),
      status = 'shared',
      signed_at = NOW(),  -- promoção: dispara trigger V1.9.101
      updated_at = NOW()
    WHERE id::TEXT = p_report_id;
  ELSE
    -- Comportamento clássico V1.9.102 (sem promoção, status já era completed/shared)
    UPDATE clinical_reports SET
      shared_with = p_doctor_ids,
      shared_at = NOW(),
      shared_by = p_patient_id,
      professional_id = COALESCE(v_set_professional, professional_id),
      status = CASE WHEN status = 'draft' THEN 'shared' ELSE 'shared' END,
      updated_at = NOW()
    WHERE id::TEXT = p_report_id;
  END IF;

  -- ────────────────────────────────────────────────────────────────────
  -- Notificações para cada médico (mantido da versão anterior)
  -- ────────────────────────────────────────────────────────────────────
  FOR v_doctor_id IN SELECT unnest(p_doctor_ids) LOOP
    INSERT INTO notifications (
      id,
      type,
      title,
      message,
      data,
      user_id,
      user_type,
      is_read,
      created_at
    )
    VALUES (
      gen_random_uuid()::TEXT,
      'report_shared',
      'Novo Relatório Compartilhado',
      'Um paciente compartilhou um relatório clínico com você.',
      jsonb_build_object('report_id', p_report_id, 'patient_id', p_patient_id, 'promoted_from_draft', v_promoted),
      v_doctor_id,
      'professional',
      false,
      NOW()
    )
    ON CONFLICT (id) DO NOTHING;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Relatório compartilhado com sucesso',
    'doctor_count', v_doctor_count,
    'professional_id_set', v_set_professional IS NOT NULL,
    'promoted_from_draft', v_promoted
  );
END;
$function$;

COMMENT ON FUNCTION public.share_report_with_doctors IS
  'V1.9.103 — RPC compartilha relatório + cria vínculo médico explícito + '
  'promove draft (V1.9.102) para shared. professional_id apenas se 1 doctor '
  '(anti-vínculo arbitrário). signed_at populado em promoção dispara trigger '
  'V1.9.101 aec_finalized.';

COMMIT;

-- ──────────────────────────────────────────────────────────────────────
-- VERIFICAÇÃO PÓS-DEPLOY (rodar manualmente)
-- ──────────────────────────────────────────────────────────────────────
--
-- 1. Function existe e retorna jsonb:
--    SELECT proname, pg_get_function_result(oid) FROM pg_proc
--    WHERE proname = 'share_report_with_doctors';
--
-- 2. Smoke test em paciente sem appointment:
--    a) V1.9.102 cria draft (signed_at=NULL, status='draft')
--    b) Paciente compartilha com 1 médico
--    c) UPDATE: professional_id = doctor, status='shared', signed_at=NOW()
--    d) Trigger V1.9.101 aec_finalized dispara
--    e) Próxima AEC: Gate aceita via Fonte 2 (professional_id + signed_at)
