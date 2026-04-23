-- =============================================================================
-- V1.9.1-db — Add missing phase_iteration_count column
-- =============================================================================
-- Data:     2026-04-23
-- Propósito: Preencher lacuna entre o código e o schema. O código frontend
--            (desde V1.8.4-H, commit 124d48d) envia phase_iteration_count no
--            upsert do aec_assessment_state, mas a coluna nunca foi criada no
--            banco. O try/catch do persist() engolia o erro silenciosamente.
--
--            Log exposto em 23/04 ~16:15 no test do Dr. Ricardo:
--              [AEC] Erro ao persistir estado no BD:
--              Could not find the 'phase_iteration_count' column of
--              'aec_assessment_state' in the schema cache
--
-- Impacto do fix:
--   - O contador passa a ser persistido corretamente entre turnos (antes vivia
--     só em memória; em reload de página o contador zerava).
--   - Remove o console.warn recorrente em toda avaliação.
--
-- Segurança:
--   - Idempotente (IF NOT EXISTS)
--   - DEFAULT 0 cobre rows existentes sem quebrar lógica
--   - Zero impacto em RLS/FKs/índices
-- =============================================================================

BEGIN;

ALTER TABLE public.aec_assessment_state
  ADD COLUMN IF NOT EXISTS phase_iteration_count integer NOT NULL DEFAULT 0;

-- Audit trail
INSERT INTO public.cognitive_events (intent, action, decision_result, source, metadata)
VALUES (
  'SYSTEM_MAINTENANCE',
  'SCHEMA_GAP_PATCH',
  'APPLIED',
  'V1.9.1-db',
  jsonb_build_object(
    'gap',          'phase_iteration_count column was being written by code since V1.8.4-H but never existed in DB',
    'fix',          'ADD COLUMN IF NOT EXISTS phase_iteration_count integer NOT NULL DEFAULT 0',
    'applied_at',   now()
  )
);

COMMIT;
