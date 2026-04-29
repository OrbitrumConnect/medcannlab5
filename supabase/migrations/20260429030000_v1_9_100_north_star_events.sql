-- Migration: V1.9.100 — North Star Events (Caminho A — instrumentação fundacional)
-- Data: 29/04/2026 ~03h BRT
--
-- CONTEXTO
-- ────────
-- Audit estratégico 28-29/04 cristalizou: o MedCannLab está em estado
-- "infra muito bem construída" → falta "prova de valor percebido". Para
-- atravessar essa lacuna sem quebrar o que foi conquistado, é preciso
-- INSTRUMENTAR antes do 1º paciente externo (Caminho A do North Star),
-- não depois.
--
-- GPT review 29/04 ~03h corrigiu prioridade: P0c não é "métrica/polish"
-- — é APRENDIZADO fundacional. Em pré-PMF, executar sem instrumentação
-- = gasta tempo + zero conhecimento + zero base pra iterar.
--
-- Princípio cristalizado: "Instrumentação ANTES do teste."
--   feedback_instrumentacao_antes_do_teste.md
--
-- ESTA MIGRATION (FASE 1 mínima — fundação cognitiva)
-- ─────────────────────────────────────────────────────
--   ✅ Cria tabela clinical_north_star_events
--   ✅ Cria indexes para queries das 3 métricas iniciais
--   ✅ Habilita RLS com policies admin_all + self_read
--   ✅ Helper function record_north_star_event() (uso opcional)
--   ❌ NÃO cria triggers no Core (preservação do lock V1.9.95+97+98+99-B)
--   ❌ NÃO grava nenhum evento (hooks vão na FASE 2)
--   ❌ NÃO cria cron de patient_returned (vai na FASE 2)
--
-- LOCK PRESERVATION
-- ─────────────────
-- Esta migration NÃO toca:
--   - tradevision-core/index.ts (AEC core)
--   - clinicalAssessmentFlow.ts (FSM)
--   - Pipeline orchestrator (REPORT→SCORES→SIGNATURE→AXES→...)
--   - Verbatim First / AEC Gate / COS Kernel
--   - Nenhuma tabela existente
--
-- É puramente ADITIVA: nova tabela + RLS + helper function.
-- Pode ser revertida com DROP TABLE sem afetar nada.
--
-- FASE 2 (próxima sessão técnica, com cabeça fresca)
-- ───────────────────────────────────────────────────
-- 2.1. Hook em finalizeAssessment → record_north_star_event('aec_finalized')
-- 2.2. Frontend hooks: physician_review_started/ended, physician_override
-- 2.3. Cron diário: patient_returned_spontaneous (consultando chat_messages)
-- 2.4. Trigger em appointments → patient_followup_scheduled
--
-- FASE 3 (com Ricardo no loop — semântica clínica)
-- ─────────────────────────────────────────────────
-- 3.1. Definir o que conta como "retorno espontâneo" (qualquer mensagem?
--      agendamento? consulta concluída?)
-- 3.2. Janela exata de "30 dias" (corridos? úteis? a partir de signature?)
-- 3.3. Definir "override significativo" (qualquer edit? > N% chars?)
-- 3.4. Quais campos do relatório DEVEM ser auditados em override

BEGIN;

-- ──────────────────────────────────────────────────────────────────────
-- 1. TABELA clinical_north_star_events
-- ──────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.clinical_north_star_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Tipo do evento (enum literal — força disciplina)
  event_type      text NOT NULL CHECK (event_type IN (
    'aec_finalized',                  -- AEC completa, signature_complete
    'physician_review_started',       -- médico abriu o relatório
    'physician_review_ended',         -- médico fechou o relatório
    'physician_override',             -- médico editou campo do relatório
    'patient_returned_spontaneous',   -- paciente voltou sem ser chamado
    'patient_followup_scheduled'      -- agendamento de retorno criado
  )),

  -- Vínculos (todos opcionais — depende do tipo de evento)
  patient_id      uuid REFERENCES public.users(id) ON DELETE CASCADE,
  professional_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  report_id       text REFERENCES public.clinical_reports(id) ON DELETE CASCADE,
  -- NB: clinical_reports.id é text (não uuid) — descoberto na aplicação 29/04 ~14h45
  appointment_id  uuid REFERENCES public.appointments(id) ON DELETE SET NULL,

  -- Payload específico do evento (estrutura livre)
  -- Ex em physician_override: { field: 'diagnosis', old_len: 234, new_len: 287 }
  -- Ex em patient_returned: { source: 'chat_message', message_id: '...' }
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb,

  -- Quando o evento aconteceu (clínicamente)
  occurred_at     timestamptz NOT NULL DEFAULT now(),

  -- Quando foi gravado no banco (pode diferir em casos de cron retroativo)
  recorded_at     timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.clinical_north_star_events IS
  'V1.9.100 — Eventos fundacionais para medir aprendizado clínico do produto. '
  'Caminho A do North Star: instrumentação ANTES do 1º paciente externo. '
  'Hooks de gravação são FASE 2 — esta tabela é só fundação.';

-- ──────────────────────────────────────────────────────────────────────
-- 2. INDEXES (alinhados às 3 métricas iniciais)
-- ──────────────────────────────────────────────────────────────────────

-- M1 (return_30d): per-patient timeline
CREATE INDEX IF NOT EXISTS idx_ns_events_patient_timeline
  ON public.clinical_north_star_events(patient_id, occurred_at DESC)
  WHERE patient_id IS NOT NULL;

-- M2 (physician_time_delta): per-report review window
CREATE INDEX IF NOT EXISTS idx_ns_events_report_review
  ON public.clinical_north_star_events(report_id, event_type, occurred_at)
  WHERE report_id IS NOT NULL
    AND event_type IN ('physician_review_started', 'physician_review_ended');

-- M3 (override_rate): per-report overrides
CREATE INDEX IF NOT EXISTS idx_ns_events_overrides
  ON public.clinical_north_star_events(report_id, occurred_at)
  WHERE event_type = 'physician_override';

-- Geral: lookup por tipo + janela
CREATE INDEX IF NOT EXISTS idx_ns_events_type_occurred
  ON public.clinical_north_star_events(event_type, occurred_at DESC);

-- Cohort analysis: queries do tipo "todos os eventos X de paciente Y por janela"
-- Sugestão Ricardo via GPT (29/04 ~04h) — vale ouro pra análises retrospectivas
CREATE INDEX IF NOT EXISTS idx_ns_events_type_patient
  ON public.clinical_north_star_events(event_type, patient_id, occurred_at DESC)
  WHERE patient_id IS NOT NULL;

-- ──────────────────────────────────────────────────────────────────────
-- 3. RLS — segurança como o resto do banco
-- ──────────────────────────────────────────────────────────────────────
ALTER TABLE public.clinical_north_star_events ENABLE ROW LEVEL SECURITY;

-- Admin: acesso total (Pedro, Ricardo, João, Eduardo)
DO $$ BEGIN
  CREATE POLICY "ns_events_admin_all"
    ON public.clinical_north_star_events
    FOR ALL
    USING (is_admin())
    WITH CHECK (is_admin());
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Self read: paciente vê seus próprios eventos; profissional vê eventos
-- onde é o profissional vinculado.
DO $$ BEGIN
  CREATE POLICY "ns_events_self_read"
    ON public.clinical_north_star_events
    FOR SELECT
    USING (
      patient_id = auth.uid()
      OR professional_id = auth.uid()
    );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- INSERT: apenas service_role (Edge Functions/Core gravam via key bypass).
-- Não há policy explícita — auth.uid() bloqueia INSERT direto via PostgREST.
-- Service role bypassa RLS por design.

-- ──────────────────────────────────────────────────────────────────────
-- 4. HELPER FUNCTION — record_north_star_event()
-- ──────────────────────────────────────────────────────────────────────
-- Simplifica gravação a partir de Edge Functions na FASE 2.
-- Uso opcional — permite gravar com 1 chamada em vez de INSERT manual.
--
-- SECURITY INVOKER (rodam com permissão do chamador) — Edge Functions
-- com service_role têm permissão; usuário comum NÃO consegue gravar.

CREATE OR REPLACE FUNCTION public.record_north_star_event(
  p_event_type      text,
  p_patient_id      uuid DEFAULT NULL,
  p_professional_id uuid DEFAULT NULL,
  p_report_id       text DEFAULT NULL,  -- text para casar com clinical_reports.id
  p_appointment_id  uuid DEFAULT NULL,
  p_metadata        jsonb DEFAULT '{}'::jsonb,
  p_occurred_at     timestamptz DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_event_id uuid;
BEGIN
  INSERT INTO public.clinical_north_star_events (
    event_type,
    patient_id,
    professional_id,
    report_id,
    appointment_id,
    metadata,
    occurred_at
  ) VALUES (
    p_event_type,
    p_patient_id,
    p_professional_id,
    p_report_id,
    p_appointment_id,
    COALESCE(p_metadata, '{}'::jsonb),
    COALESCE(p_occurred_at, now())
  )
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$;

COMMENT ON FUNCTION public.record_north_star_event IS
  'V1.9.100 — Helper para gravar eventos North Star a partir de Edge Functions. '
  'Uso opcional. Hooks no Core ficam para FASE 2.';

-- ──────────────────────────────────────────────────────────────────────
-- 5. SMOKE TEST INLINE (executa na própria migration)
-- ──────────────────────────────────────────────────────────────────────
-- Insere 1 evento dummy via helper, valida, deleta.
-- Se algo está quebrado, migration falha aqui (idempotente).

DO $$
DECLARE
  v_test_event_id uuid;
  v_count int;
BEGIN
  -- Insere evento dummy
  v_test_event_id := public.record_north_star_event(
    p_event_type := 'aec_finalized',
    p_metadata   := '{"smoke_test": true, "migration": "v1_9_100"}'::jsonb
  );

  -- Valida que foi gravado
  SELECT count(*) INTO v_count
  FROM public.clinical_north_star_events
  WHERE id = v_test_event_id;

  IF v_count != 1 THEN
    RAISE EXCEPTION 'Smoke test V1.9.100 FALHOU: evento dummy não foi gravado';
  END IF;

  -- Cleanup
  DELETE FROM public.clinical_north_star_events WHERE id = v_test_event_id;

  RAISE NOTICE 'V1.9.100 smoke test OK — tabela + helper funcionais';
END $$;

COMMIT;

-- ──────────────────────────────────────────────────────────────────────
-- VERIFICAÇÃO PÓS-DEPLOY (rodar manualmente após apply)
-- ──────────────────────────────────────────────────────────────────────
--
-- 1. Tabela criada e vazia:
--    SELECT count(*) FROM clinical_north_star_events;
--    -- esperado: 0
--
-- 2. RLS habilitada:
--    SELECT relname, relrowsecurity FROM pg_class
--    WHERE relname = 'clinical_north_star_events';
--    -- esperado: relrowsecurity = true
--
-- 3. Policies criadas:
--    SELECT policyname FROM pg_policies
--    WHERE tablename = 'clinical_north_star_events';
--    -- esperado: ns_events_admin_all, ns_events_self_read
--
-- 4. Helper function callable:
--    SELECT record_north_star_event('aec_finalized', NULL, NULL, NULL, NULL, '{}', NULL);
--    -- esperado: retorna UUID. Cleanup: DELETE WHERE event_type='aec_finalized' AND metadata->>'smoke_test' IS NULL;
--
-- 5. Indexes presentes:
--    SELECT indexname FROM pg_indexes
--    WHERE tablename = 'clinical_north_star_events';
--    -- esperado: 4 indexes (patient_timeline, report_review, overrides, type_occurred)
