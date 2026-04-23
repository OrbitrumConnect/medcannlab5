-- =============================================================================
-- V1.9.0 — Structural Integrity Migration
-- =============================================================================
-- Data:     2026-04-23
-- Autor:    Claude Opus 4.7 (1M) + Pedro (CTO)
-- Propósito: Fechar gaps estruturais de LGPD (consentimento) e completude
--            de avaliação (phases) levantados nos 3 Checkpoints do review
--            externo, + limpeza de tabelas fósseis e token em plaintext.
-- -----------------------------------------------------------------------------
-- Dados REAIS validados antes da migration (2026-04-23):
--   • aec_assessment_state:   7 rows, todos com 'consentGiven' no jsonb
--   • clinical_reports:      58 rows, 100% internos (time/dev — validado via email)
--   • dev_vivo_sessions:      0 rows (safe to DROP)
--   • 8 legacy tables PT:     0 rows cada (safe to DROP CASCADE)
--   • base_conhecimento:      5 rows — RAG ATIVO (PRESERVAR, não mexer)
--   • imre_assessments:       0 rows MAS tem FKs — adiado pra sprint separado
--   • Zero duplicatas por assessment_id (UNIQUE INDEX partial criável limpo)
--   • 2 IDs não-UUID em clinical_reports (adiado — text→uuid em sprint separado)
-- -----------------------------------------------------------------------------
-- Segurança:
--   • Wrapped em BEGIN/COMMIT — atomic
--   • Idempotente (IF EXISTS / IF NOT EXISTS em todas as operações)
--   • Zero NOT NULL novos que quebrariam inserts existentes
--   • CHECK de consent NÃO é adicionado aqui (seria na V1.9.1 após code update)
-- -----------------------------------------------------------------------------
-- Pré-requisitos:
--   1. PITR confirmado (Dashboard → Database → Point-in-Time Recovery)
--   2. Backup recente disponível
--   3. Staging testado com snapshot real
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1) DROP — Tabelas fósseis e red flag de segurança
-- =============================================================================

-- 1.1 Família dev_vivo: ferramenta de dev com token em plaintext (red flag).
--     0 rows, nunca utilizada em produção. DROP limpo.
DROP TABLE IF EXISTS public.dev_vivo_audit CASCADE;
DROP TABLE IF EXISTS public.dev_vivo_diagnostics CASCADE;
DROP TABLE IF EXISTS public.dev_vivo_changes CASCADE;
DROP TABLE IF EXISTS public.dev_vivo_sessions CASCADE;

-- 1.2 Legacy em português: 0 rows cada, substituídas pela pipeline
--     aec_assessment_state → clinical_reports. A tabela pacientes é a raiz
--     das FKs das outras — CASCADE derruba o grupo inteiro.
DROP TABLE IF EXISTS public.abertura_exponencial CASCADE;
DROP TABLE IF EXISTS public.avaliacoes_renais CASCADE;
DROP TABLE IF EXISTS public.contexto_longitudinal CASCADE;
DROP TABLE IF EXISTS public.dados_imre_coletados CASCADE;
DROP TABLE IF EXISTS public.desenvolvimento_indiciario CASCADE;
DROP TABLE IF EXISTS public.fechamento_consensual CASCADE;
DROP TABLE IF EXISTS public.interacoes_ia CASCADE;
DROP TABLE IF EXISTS public.pacientes CASCADE;

-- NÃO dropar: base_conhecimento (5 rows, RAG ativo em tradevision-core:3143).
-- NÃO dropar: imre_assessments (0 rows mas tem FKs em assessment_sharing,
--   clinical_integration, imre_semantic_*). Adiado para sprint separado.

-- =============================================================================
-- 2) aec_assessment_state — Consent + Completude estruturais
-- =============================================================================

-- 2.1 Consent como colunas dedicadas (não jsonb validation)
ALTER TABLE public.aec_assessment_state
  ADD COLUMN IF NOT EXISTS consent_given boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS consent_at timestamp with time zone;

-- Backfill dos 7 registros existentes a partir do jsonb 'consentGiven'.
-- Resultado esperado: 1 row com consent_given=true (FINAL_RECOMMENDATION),
-- 6 com false (estados em progresso — natural, nem chegaram no CONSENT_COLLECTION).
UPDATE public.aec_assessment_state
   SET consent_given = COALESCE((data->>'consentGiven')::boolean, false),
       consent_at    = CASE
                         WHEN (data->>'consentGiven')::boolean = true THEN last_update
                         ELSE NULL
                       END
 WHERE data ? 'consentGiven';

-- 2.2 Completude derivada (nunca "mentirosa") via GENERATED column
ALTER TABLE public.aec_assessment_state
  ADD COLUMN IF NOT EXISTS completed_phases text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS required_phases  text[] NOT NULL DEFAULT ARRAY[
    'INITIAL_GREETING',
    'IDENTIFICATION',
    'COMPLAINT_LIST',
    'MAIN_COMPLAINT',
    'COMPLAINT_DETAILS',
    'MEDICAL_HISTORY',
    'FAMILY_HISTORY_MOTHER',
    'FAMILY_HISTORY_FATHER',
    'LIFESTYLE_HABITS',
    'OBJECTIVE_QUESTIONS',
    'CONSENSUS_REVIEW',
    'CONSENSUS_REPORT',
    'CONSENT_COLLECTION'
  ]::text[];

-- Flag derivável — PostgreSQL calcula automaticamente, impossível fraudar
ALTER TABLE public.aec_assessment_state
  ADD COLUMN IF NOT EXISTS is_complete boolean
    GENERATED ALWAYS AS (completed_phases @> required_phases) STORED;

-- Índice para queries "todos completos" eficientes
CREATE INDEX IF NOT EXISTS idx_aec_is_complete
  ON public.aec_assessment_state (is_complete)
  WHERE is_complete = true;

-- Backfill mínimo: registros que chegaram em fases terminais marcam o próprio
-- phase como completed. Código app é responsável por manter daqui pra frente.
UPDATE public.aec_assessment_state
   SET completed_phases = ARRAY[phase]::text[]
 WHERE phase IN ('COMPLETED', 'FINAL_RECOMMENDATION')
   AND COALESCE(array_length(completed_phases, 1), 0) = 0;

-- =============================================================================
-- 3) clinical_reports — Consent + Unique Index Partial
-- =============================================================================

-- 3.1 Coluna de consent (grandfather para os 57 legados sem afirmação)
ALTER TABLE public.clinical_reports
  ADD COLUMN IF NOT EXISTS consent_given boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS consent_at timestamp with time zone;

-- Backfill: dos 58 relatórios, apenas os que têm consenso.aceito=true no
-- jsonb ganham consent_given=true. Resultado esperado: 1 row.
-- Os 57 demais ficam consent_given=false — são dados de dev/time (validado),
-- então não há risco LGPD externo. Daqui pra frente código deve setar consent_given
-- APENAS após CONSENT_COLLECTION afirmativo.
UPDATE public.clinical_reports
   SET consent_given = true,
       consent_at    = generated_at
 WHERE (content->'consenso'->>'aceito')::text = 'true';

-- 3.2 Unique Index Partial — anti-concorrência estrutural
--     Impede que duas gerações paralelas criem 2 relatórios ativos pro
--     mesmo assessment. Rascunhos (status='draft') são permitidos.
CREATE UNIQUE INDEX IF NOT EXISTS one_active_report_per_assessment
  ON public.clinical_reports (assessment_id)
  WHERE assessment_id IS NOT NULL AND status != 'draft';

-- =============================================================================
-- 4) Audit log — Registro imutável da aplicação
-- =============================================================================

INSERT INTO public.cognitive_events (intent, action, decision_result, source, metadata)
VALUES (
  'SYSTEM_MAINTENANCE',
  'STRUCTURAL_MIGRATION_APPLIED',
  'SUCCESS',
  'V1.9.0_MIGRATION',
  jsonb_build_object(
    'version',       'V1.9.0',
    'applied_at',    now(),
    'dropped_tables', ARRAY[
      'dev_vivo_sessions', 'dev_vivo_changes', 'dev_vivo_audit', 'dev_vivo_diagnostics',
      'abertura_exponencial', 'avaliacoes_renais', 'contexto_longitudinal',
      'dados_imre_coletados', 'desenvolvimento_indiciario', 'fechamento_consensual',
      'interacoes_ia', 'pacientes'
    ],
    'added_columns', ARRAY[
      'aec_assessment_state.consent_given',
      'aec_assessment_state.consent_at',
      'aec_assessment_state.completed_phases',
      'aec_assessment_state.required_phases',
      'aec_assessment_state.is_complete',
      'clinical_reports.consent_given',
      'clinical_reports.consent_at'
    ],
    'created_indexes', ARRAY[
      'idx_aec_is_complete',
      'one_active_report_per_assessment'
    ],
    'preserved_tables', ARRAY['base_conhecimento (RAG active)', 'imre_assessments (has FKs, deferred)'],
    'deferred_to_next_sprint', ARRAY[
      'clinical_reports.id text -> uuid (2 invalid IDs + 4 FK cascades)',
      'imre_assessments cleanup (has assessment_sharing, clinical_integration, imre_semantic_* dependents)',
      'CHECK (consent_given = true) on clinical_reports (requires app code to set column explicitly first)'
    ]
  )
);

COMMIT;

-- =============================================================================
-- PÓS-MIGRATION — AÇÕES DE CÓDIGO NECESSÁRIAS (não SQL, coordenar com app)
-- =============================================================================
-- 1. handleFinalizeAssessment (tradevision-core/index.ts ~linha 2346):
--    Setar clinical_reports.consent_given = true e consent_at = now()
--    SOMENTE quando CONSENT_COLLECTION completou afirmativamente.
--    Hoje está só no jsonb content — precisa passar também para a coluna.
--
-- 2. clinicalAssessmentFlow.processResponse:
--    Em cada transição de fase válida, fazer:
--      UPDATE aec_assessment_state
--      SET completed_phases = array_append(completed_phases, '<previous_phase>')
--      WHERE user_id = $userId
--        AND NOT (completed_phases @> ARRAY['<previous_phase>']);
--    Assim is_complete vira true naturalmente quando o fluxo fechar.
--
-- 3. V1.9.1 (futuro próximo): quando (1) e (2) estiverem em prod e validados,
--    aplicar CHECK (consent_given = true) em clinical_reports via:
--      ALTER TABLE public.clinical_reports
--        ADD CONSTRAINT reports_require_consent CHECK (consent_given = true);
--    ATENÇÃO: aplicar ANTES disso bloqueia 100% dos inserts. Só depois de (1).
-- =============================================================================
