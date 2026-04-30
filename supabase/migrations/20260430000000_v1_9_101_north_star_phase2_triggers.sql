-- Migration: V1.9.101 — North Star FASE 2 (triggers SQL aec_finalized + patient_followup_scheduled)
-- Data: 30/04/2026 ~00h BRT
--
-- CONTEXTO
-- ────────
-- V1.9.100 (FASE 1) criou a tabela clinical_north_star_events e helper
-- record_north_star_event(). Agora aplicamos os 2 hooks fundacionais
-- via TRIGGERS SQL (zero toque em Core/FSM/pipeline).
--
-- ESCOLHA DE TRIGGERS SQL (em vez de hooks JS no Core)
-- ─────────────────────────────────────────────────────
-- Lock V1.9.95+97+98+99-B exige NÃO TOCAR no tradevision-core/index.ts,
-- clinicalAssessmentFlow.ts, pipeline orchestrator, etc. Triggers SQL
-- entregam os mesmos hooks ao nível do banco — onde a verdade do
-- estado vive — sem requerer alteração de código JS/TS.
--
-- Vantagens dos triggers SQL aqui:
--   ✅ Lock 100% preservado (zero toque em código JS)
--   ✅ Disparo garantido (capta UPDATE direto via Edge Function ou Dashboard)
--   ✅ Catch-all: cobre todos os caminhos que populam signed_at, sem
--      depender de "qual orchestrator chamou"
--   ✅ Fail-safe: trigger NUNCA bloqueia o INSERT/UPDATE original
--      (EXCEPTION WHEN OTHERS handler)
--
-- HOOKS APLICADOS NESTA MIGRATION
-- ────────────────────────────────
-- 2.1. aec_finalized
--      Disparo: clinical_reports — AFTER UPDATE quando signed_at vai de
--               NULL → NOT NULL, OU AFTER INSERT quando já vem signed.
--      Marca clínica: assinatura digital concluída = AEC finalizada.
--
-- 2.2. patient_followup_scheduled
--      Disparo: appointments — AFTER INSERT.
--      Marca clínica: agendamento criado = continuidade de cuidado.
--
-- HOOKS QUE FICAM PARA FASE 2.3/2.4
-- ──────────────────────────────────
-- 2.3. physician_review_started/ended/override → frontend hooks
--      (decisão UX com Ricardo: onde captar exatamente)
-- 2.4. patient_returned_spontaneous → cron diário (Edge Function)
--
-- LOCK PRESERVATION
-- ─────────────────
-- ❌ NÃO toca tradevision-core/index.ts
-- ❌ NÃO toca clinicalAssessmentFlow.ts
-- ❌ NÃO toca pipeline orchestrator
-- ❌ NÃO toca handleFinalizeAssessment
-- ❌ NÃO toca Verbatim First / AEC Gate / COS Kernel / Signature
-- ❌ NÃO toca tabelas existentes (só ADICIONA triggers)
-- ✅ Aditiva pura: 2 trigger functions + 3 triggers + smoke test inline
-- ✅ Reversível com DROP TRIGGER + DROP FUNCTION sem afetar nada
--
-- FAIL-SAFE
-- ─────────
-- Cada trigger function tem EXCEPTION WHEN OTHERS que LOGA o erro mas
-- NUNCA propaga. Garante que telemetria observacional jamais bloqueia
-- a operação clínica original (assinatura, agendamento).

BEGIN;

-- ──────────────────────────────────────────────────────────────────────
-- 1. TRIGGER FUNCTION: aec_finalized
-- ──────────────────────────────────────────────────────────────────────
-- Dispara quando clinical_reports.signed_at é populado pela primeira vez.
-- Cobre:
--   - INSERT que já vem com signed_at populado
--   - UPDATE que muda signed_at de NULL para NOT NULL
-- Ignora:
--   - UPDATE de outro campo (signed_at já populado, não muda)
--   - DELETE
--
-- SECURITY DEFINER permite que a function bypasse RLS para inserir
-- em clinical_north_star_events (que tem policy admin_all + self_read,
-- sem policy de INSERT direto via PostgREST).

CREATE OR REPLACE FUNCTION public.ns_track_aec_finalized()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_should_track boolean := false;
  v_professional uuid;
BEGIN
  -- Detectar transição NULL → NOT NULL em signed_at
  IF TG_OP = 'INSERT' THEN
    v_should_track := (NEW.signed_at IS NOT NULL);
  ELSIF TG_OP = 'UPDATE' THEN
    v_should_track := (OLD.signed_at IS NULL AND NEW.signed_at IS NOT NULL);
  END IF;

  IF NOT v_should_track THEN
    RETURN NEW;
  END IF;

  -- Resolver médico responsável (professional_id tem precedência sobre doctor_id)
  v_professional := COALESCE(NEW.professional_id, NEW.doctor_id);

  -- Insert observacional fail-safe (nunca bloqueia o UPDATE/INSERT original)
  BEGIN
    INSERT INTO public.clinical_north_star_events (
      event_type,
      patient_id,
      professional_id,
      report_id,
      metadata,
      occurred_at
    ) VALUES (
      'aec_finalized',
      NEW.patient_id,
      v_professional,
      NEW.id,
      jsonb_build_object(
        'status',         NEW.status,
        'interaction_id', NEW.interaction_id,
        'tg_op',          TG_OP,
        'source',         'trigger_v1_9_101'
      ),
      NEW.signed_at
    );
  EXCEPTION
    WHEN OTHERS THEN
      -- Não propaga: telemetria nunca bloqueia operação clínica
      RAISE WARNING '[ns_track_aec_finalized] erro silencioso: % (report_id=%)',
                    SQLERRM, NEW.id;
  END;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.ns_track_aec_finalized IS
  'V1.9.101 — Hook North Star: registra evento aec_finalized quando '
  'clinical_reports.signed_at é populado. SECURITY DEFINER bypass RLS. '
  'Fail-safe: erro de telemetria nunca bloqueia operação clínica.';

-- Triggers em clinical_reports (cobre 2 caminhos: insert já-assinado e update assinando)
DROP TRIGGER IF EXISTS trg_ns_aec_finalized_insert ON public.clinical_reports;
CREATE TRIGGER trg_ns_aec_finalized_insert
  AFTER INSERT ON public.clinical_reports
  FOR EACH ROW
  WHEN (NEW.signed_at IS NOT NULL)
  EXECUTE FUNCTION public.ns_track_aec_finalized();

DROP TRIGGER IF EXISTS trg_ns_aec_finalized_update ON public.clinical_reports;
CREATE TRIGGER trg_ns_aec_finalized_update
  AFTER UPDATE OF signed_at ON public.clinical_reports
  FOR EACH ROW
  WHEN (OLD.signed_at IS DISTINCT FROM NEW.signed_at AND NEW.signed_at IS NOT NULL)
  EXECUTE FUNCTION public.ns_track_aec_finalized();

-- ──────────────────────────────────────────────────────────────────────
-- 2. TRIGGER FUNCTION: patient_followup_scheduled
-- ──────────────────────────────────────────────────────────────────────
-- Dispara em AFTER INSERT em appointments.
-- Marca clínica: agendamento criado = paciente engajado em continuidade.

CREATE OR REPLACE FUNCTION public.ns_track_followup_scheduled()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_professional uuid;
BEGIN
  -- Resolver médico (professional_id precedência sobre doctor_id)
  v_professional := COALESCE(NEW.professional_id, NEW.doctor_id);

  -- Insert observacional fail-safe
  BEGIN
    INSERT INTO public.clinical_north_star_events (
      event_type,
      patient_id,
      professional_id,
      appointment_id,
      metadata,
      occurred_at
    ) VALUES (
      'patient_followup_scheduled',
      NEW.patient_id,
      v_professional,
      NEW.id,
      jsonb_build_object(
        'status',           NEW.status,
        'type',             NEW.type,
        'appointment_date', NEW.appointment_date,
        'source',           'trigger_v1_9_101'
      ),
      COALESCE(NEW.appointment_date, now())
    );
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING '[ns_track_followup_scheduled] erro silencioso: % (appointment_id=%)',
                    SQLERRM, NEW.id;
  END;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.ns_track_followup_scheduled IS
  'V1.9.101 — Hook North Star: registra patient_followup_scheduled em '
  'AFTER INSERT em appointments. Fail-safe.';

DROP TRIGGER IF EXISTS trg_ns_followup_scheduled ON public.appointments;
CREATE TRIGGER trg_ns_followup_scheduled
  AFTER INSERT ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.ns_track_followup_scheduled();

-- ──────────────────────────────────────────────────────────────────────
-- 3. SMOKE TEST INLINE — 2 cenários
-- ──────────────────────────────────────────────────────────────────────
-- Insere dummy report já-assinado + dummy appointment, valida que ambos
-- triggers populam clinical_north_star_events corretamente, depois faz
-- cleanup completo. Se algo falhar, migration aborta (idempotente).

DO $$
DECLARE
  v_test_patient_id  uuid;
  v_test_pro_id      uuid;
  v_test_report_id   text  := 'smoke_v1_9_101_' || gen_random_uuid()::text;
  v_test_appt_id     uuid;
  v_aec_event_count  int;
  v_appt_event_count int;
BEGIN
  -- Pega IDs reais (admin Pedro como paciente fictício, Ricardo como pro fictício)
  -- Apenas para satisfazer FKs do teste; events serão limpos no fim.
  SELECT id INTO v_test_patient_id FROM public.users
   WHERE email = 'passosmir4@gmail.com' LIMIT 1;

  SELECT id INTO v_test_pro_id FROM public.users
   WHERE type IN ('professional', 'profissional') LIMIT 1;

  IF v_test_patient_id IS NULL OR v_test_pro_id IS NULL THEN
    RAISE NOTICE 'V1.9.101 smoke test PULADO: usuários teste não encontrados (banco vazio?)';
    RETURN;
  END IF;

  -- ── Cenário 1: clinical_reports INSERT já-assinado ──
  -- Valores compatíveis com 3 CHECK constraints:
  --   status: interseção das 2 constraints = 'completed' | 'reviewed' | 'draft'
  --   report_type: 'initial_assessment' | 'follow_up' | 'emergency'
  --   generated_by: interseção = 'professional'
  INSERT INTO public.clinical_reports (
    id, patient_id, patient_name, professional_id, status, content, signed_at,
    interaction_id, report_type, generated_by, created_at
  ) VALUES (
    v_test_report_id,
    v_test_patient_id,
    'SMOKE TEST V1.9.101',
    v_test_pro_id,
    'completed',
    '{"smoke_test": true, "migration": "v1_9_101"}'::jsonb,
    now(),
    'smoke_v1_9_101',
    'initial_assessment',
    'professional',
    now()
  );

  SELECT count(*) INTO v_aec_event_count
  FROM public.clinical_north_star_events
  WHERE report_id = v_test_report_id
    AND event_type = 'aec_finalized';

  IF v_aec_event_count != 1 THEN
    RAISE EXCEPTION 'V1.9.101 SMOKE FALHOU: trigger aec_finalized não disparou (esperado 1, achou %)',
                    v_aec_event_count;
  END IF;

  RAISE NOTICE 'V1.9.101 smoke 1/2 OK — trigger aec_finalized funcionando';

  -- ── Cenário 2: appointments INSERT ──
  INSERT INTO public.appointments (
    id, patient_id, professional_id, appointment_date, status, type, created_at
  ) VALUES (
    gen_random_uuid(),
    v_test_patient_id,
    v_test_pro_id,
    now() + INTERVAL '7 days',
    'scheduled',
    'consultation',
    now()
  ) RETURNING id INTO v_test_appt_id;

  SELECT count(*) INTO v_appt_event_count
  FROM public.clinical_north_star_events
  WHERE appointment_id = v_test_appt_id
    AND event_type = 'patient_followup_scheduled';

  IF v_appt_event_count != 1 THEN
    RAISE EXCEPTION 'V1.9.101 SMOKE FALHOU: trigger followup_scheduled não disparou (esperado 1, achou %)',
                    v_appt_event_count;
  END IF;

  RAISE NOTICE 'V1.9.101 smoke 2/2 OK — trigger patient_followup_scheduled funcionando';

  -- ── Cleanup (cascata explícita das 6 tabelas com FK pra clinical_reports) ──
  -- Pipeline orchestrator pode ter populado children automaticamente.
  DELETE FROM public.clinical_north_star_events
   WHERE report_id = v_test_report_id
      OR appointment_id = v_test_appt_id;

  -- Deletar children que têm FK pra clinical_reports.id
  DELETE FROM public.patient_medical_records WHERE report_id = v_test_report_id;
  DELETE FROM public.clinical_qa_runs        WHERE report_id = v_test_report_id;
  DELETE FROM public.ai_assessment_scores    WHERE assessment_id = v_test_report_id;
  DELETE FROM public.clinical_axes           WHERE report_id = v_test_report_id;
  DELETE FROM public.clinical_rationalities  WHERE report_id = v_test_report_id;

  -- Agora pode deletar o report
  DELETE FROM public.clinical_reports WHERE id = v_test_report_id;
  DELETE FROM public.appointments     WHERE id = v_test_appt_id;

  RAISE NOTICE 'V1.9.101 smoke test PASSOU — 2/2 triggers operacionais, cleanup completo';
END $$;

COMMIT;

-- ──────────────────────────────────────────────────────────────────────
-- VERIFICAÇÃO PÓS-DEPLOY (rodar manualmente)
-- ──────────────────────────────────────────────────────────────────────
--
-- 1. Triggers presentes:
--    SELECT trigger_name, event_object_table, action_timing, event_manipulation
--    FROM information_schema.triggers
--    WHERE trigger_name LIKE 'trg_ns_%';
--    -- esperado: 3 triggers (aec_finalized_insert, aec_finalized_update, followup_scheduled)
--
-- 2. Functions presentes:
--    SELECT proname FROM pg_proc
--    WHERE proname IN ('ns_track_aec_finalized', 'ns_track_followup_scheduled');
--    -- esperado: 2 functions
--
-- 3. Após 1 AEC real ser finalizada (signed_at populado):
--    SELECT * FROM clinical_north_star_events
--    WHERE event_type = 'aec_finalized'
--    ORDER BY occurred_at DESC LIMIT 5;
--    -- esperado: 1+ row com source='trigger_v1_9_101'
