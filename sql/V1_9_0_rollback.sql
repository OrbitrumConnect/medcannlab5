-- =============================================================================
-- V1.9.0 — ROLLBACK Script
-- =============================================================================
-- Use APENAS se a migration 20260423210000_structural_integrity_v1_9_0.sql
-- causar problema imediato detectado antes de confiarmos que está estável.
--
-- IMPORTANTE: DROPs de tabela NÃO podem ser revertidos por SQL.
-- Para restaurar tabelas removidas, use:
--   Dashboard → Database → Point-in-Time Recovery → timestamp ANTES da migration.
-- =============================================================================

BEGIN;

-- 1) Remover colunas novas de aec_assessment_state
ALTER TABLE public.aec_assessment_state
  DROP COLUMN IF EXISTS is_complete,
  DROP COLUMN IF EXISTS required_phases,
  DROP COLUMN IF EXISTS completed_phases,
  DROP COLUMN IF EXISTS consent_at,
  DROP COLUMN IF EXISTS consent_given;

-- 2) Remover colunas novas de clinical_reports
ALTER TABLE public.clinical_reports
  DROP COLUMN IF EXISTS consent_at,
  DROP COLUMN IF EXISTS consent_given;

-- 3) Remover índices criados
DROP INDEX IF EXISTS public.idx_aec_is_complete;
DROP INDEX IF EXISTS public.one_active_report_per_assessment;

-- 4) Audit trail do rollback
INSERT INTO public.cognitive_events (intent, action, decision_result, source, metadata)
VALUES (
  'SYSTEM_MAINTENANCE',
  'STRUCTURAL_MIGRATION_ROLLBACK',
  'EXECUTED',
  'V1.9.0_ROLLBACK',
  jsonb_build_object(
    'rolled_back_at', now(),
    'note', 'Tabelas dropadas NÃO foram restauradas aqui — requer PITR do Supabase.'
  )
);

COMMIT;

-- =============================================================================
-- Para restaurar TABELAS dropadas (dev_vivo_*, pacientes, abertura_exponencial,
-- etc), use Point-in-Time Recovery no Dashboard do Supabase com timestamp
-- imediatamente ANTES da migration. Não há forma SQL de reverter DROP TABLE.
-- =============================================================================
