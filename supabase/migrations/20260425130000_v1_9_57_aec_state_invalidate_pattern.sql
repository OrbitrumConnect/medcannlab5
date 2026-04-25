-- V1.9.57 — AEC State Invalidate Pattern (3 camadas: Recovery + Observability + ajuste retroativo)
--
-- Contexto:
--   Em 25/04/2026 (manhã), Carolina Campello (paciente real) reportou via Dr. Ricardo
--   que a Nôa fez perguntas múltiplas em um único turno durante AEC, violando o phase
--   lock V1.9.30 (que está no código).
--
--   Investigação via Management API revelou state inconsistente em aec_assessment_state:
--     phase: 'COMPLETED'
--     is_complete: false   ← GENERATED column = (completed_phases @> required_phases)
--     completed_phases: array faltando ['INITIAL_GREETING','OBJECTIVE_QUESTIONS','COMPLAINT_DETAILS']
--     required_phases: 13 fases
--
--   FSM nunca chamou markPhaseCompleted() para essas 3 fases. Resultado:
--   - is_complete = false PRA SEMPRE (até array ser corrigido)
--   - state nunca é descartado / nova sessão nunca criada
--   - cada novo turno envia ao Core: assessmentPhase: "COMPLETED"
--   - Phase lock V1.9.30 (que é específico de COMPLAINT_DETAILS) JAMAIS aplica
--   - GPT entra em modo livre → agrupa 5 perguntas
--
--   Os 4 sintomas reportados (perguntas múltiplas, perguntas sim/não, drift de
--   linguagem, perda de estado pós-erro) são manifestações do MESMO bug
--   arquitetural: assessmentPhase mente sobre a fase real porque state está morto.
--
-- Princípio aplicado (memória feedback_principio_clinico_destrutivo + GPT 25/04):
--   "invalidate + preserve snapshot + restart controlado"
--   NUNCA destruir dado clínico, mesmo inconsistente. Estado parcial tem valor.
--
-- 3 camadas (mitigate → detect → prevent):
--   Camada 1 (Recovery)      — esta migration adiciona colunas + cold start guard
--                              em clinicalAssessmentFlow.ts (commit junto)
--   Camada 2 (Observability) — esta migration adiciona trigger SQL anomaly_logger
--   Camada 3 (Prevention)    — V1.9.58 sessão dedicada com telemetria de C2

BEGIN;

-- ============================================================================
-- PARTE 1 — Schema change: colunas invalidated_at + invalidation_reason
-- ============================================================================

ALTER TABLE public.aec_assessment_state
  ADD COLUMN IF NOT EXISTS invalidated_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE public.aec_assessment_state
  ADD COLUMN IF NOT EXISTS invalidation_reason TEXT DEFAULT NULL;

COMMENT ON COLUMN public.aec_assessment_state.invalidated_at IS
  '[V1.9.57] Timestamp quando state foi marcado como inválido pelo cold start guard ou trigger. NULL = state ativo. NOT NULL = state arquivado, FSM ignora ao carregar.';

COMMENT ON COLUMN public.aec_assessment_state.invalidation_reason IS
  '[V1.9.57] Motivo da invalidação (ex: "phase_completed_but_incomplete_after_6h"). Para auditoria e diagnóstico.';

-- Index parcial para queries do FSM ignorarem states inválidos rapidamente
CREATE INDEX IF NOT EXISTS idx_aec_state_active_only
  ON public.aec_assessment_state (user_id)
  WHERE invalidated_at IS NULL;

-- ============================================================================
-- PARTE 2 — Trigger SQL: detector de anomalia (system screaming)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.log_aec_state_anomaly()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Detecta state inconsistente: phase=COMPLETED mas is_complete=false e ainda não invalidado.
  -- is_complete é GENERATED ALWAYS = (completed_phases @> required_phases), então este
  -- estado significa que alguma fase foi pulada sem markPhaseCompleted().
  IF NEW.phase = 'COMPLETED'
     AND NEW.is_complete = false
     AND NEW.invalidated_at IS NULL THEN
    BEGIN
      INSERT INTO public.noa_logs (user_id, interaction_type, payload)
      VALUES (
        NEW.user_id,
        'aec_state_anomaly',
        jsonb_build_object(
          'state_id', NEW.id,
          'phase', NEW.phase,
          'is_complete', NEW.is_complete,
          'completed_phases', NEW.completed_phases,
          'required_phases', NEW.required_phases,
          'missing_phases', ARRAY(
            SELECT unnest(NEW.required_phases) EXCEPT SELECT unnest(NEW.completed_phases)
          ),
          'started_at', NEW.started_at,
          'last_update', NEW.last_update,
          'detected_at', now(),
          'trigger_op', TG_OP,
          'source', 'aec_state_anomaly_logger'
        )
      );
    EXCEPTION WHEN OTHERS THEN
      -- Trigger nunca pode bloquear o INSERT/UPDATE original. Falha de log = silencioso.
      NULL;
    END;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS aec_state_anomaly_logger ON public.aec_assessment_state;
CREATE TRIGGER aec_state_anomaly_logger
  AFTER INSERT OR UPDATE ON public.aec_assessment_state
  FOR EACH ROW
  EXECUTE FUNCTION public.log_aec_state_anomaly();

-- ============================================================================
-- PARTE 3 — Retroativo: snapshot + invalidate states inconsistentes existentes
-- ============================================================================

-- 3.1 — Snapshot dos states inconsistentes em noa_logs ANTES de invalidar
INSERT INTO public.noa_logs (user_id, interaction_type, payload)
SELECT
  user_id,
  'aec_state_invalidated_retroactive_v1_9_57',
  jsonb_build_object(
    'state_id', id,
    'phase', phase,
    'is_complete', is_complete,
    'data', data,
    'completed_phases', completed_phases,
    'required_phases', required_phases,
    'missing_phases', ARRAY(
      SELECT unnest(required_phases) EXCEPT SELECT unnest(completed_phases)
    ),
    'current_question_index', current_question_index,
    'consent_given', consent_given,
    'started_at', started_at,
    'last_update', last_update,
    'invalidation_context', 'V1.9.57 deploy — state inconsistente detectado retroativamente',
    'snapshotted_at', now()
  )
FROM public.aec_assessment_state
WHERE phase = 'COMPLETED'
  AND is_complete = false
  AND invalidated_at IS NULL;

-- 3.2 — Marcar como inválido (NÃO DELETE — princípio clínico de não destruir dado)
UPDATE public.aec_assessment_state
SET
  invalidated_at = now(),
  invalidation_reason = 'V1.9.57 retroativo: state phase=COMPLETED mas is_complete=false (alguma fase não foi marcada como concluída pelo FSM). Snapshot preservado em noa_logs.'
WHERE phase = 'COMPLETED'
  AND is_complete = false
  AND invalidated_at IS NULL;

-- ============================================================================
-- VALIDAÇÃO
-- ============================================================================

DO $$
DECLARE
  invalidated_count INTEGER;
  snapshot_count INTEGER;
  remaining_inconsistent INTEGER;
BEGIN
  SELECT COUNT(*) INTO invalidated_count
  FROM public.aec_assessment_state
  WHERE invalidated_at IS NOT NULL;

  SELECT COUNT(*) INTO snapshot_count
  FROM public.noa_logs
  WHERE interaction_type = 'aec_state_invalidated_retroactive_v1_9_57';

  SELECT COUNT(*) INTO remaining_inconsistent
  FROM public.aec_assessment_state
  WHERE phase = 'COMPLETED' AND is_complete = false AND invalidated_at IS NULL;

  RAISE NOTICE '[V1.9.57] States invalidados: % | Snapshots em noa_logs: % | Remanescentes inconsistentes: %',
    invalidated_count, snapshot_count, remaining_inconsistent;

  IF remaining_inconsistent > 0 THEN
    RAISE EXCEPTION '[V1.9.57] Esperado 0 states inconsistentes não-invalidados, encontrados %', remaining_inconsistent;
  END IF;
END $$;

COMMIT;

-- ============================================================================
-- ROLLBACK MANUAL (se necessário, fora desta migration):
-- ============================================================================
-- BEGIN;
-- -- 1. Restaurar states a partir de snapshot em noa_logs:
-- --    UPDATE aec_assessment_state SET invalidated_at = NULL, invalidation_reason = NULL
-- --    WHERE id IN (SELECT (payload->>'state_id')::uuid FROM noa_logs
-- --                 WHERE interaction_type = 'aec_state_invalidated_retroactive_v1_9_57');
-- -- 2. Remover trigger:
-- DROP TRIGGER IF EXISTS aec_state_anomaly_logger ON public.aec_assessment_state;
-- DROP FUNCTION IF EXISTS public.log_aec_state_anomaly();
-- -- 3. Remover colunas (cuidado — perde audit trail):
-- ALTER TABLE public.aec_assessment_state DROP COLUMN IF EXISTS invalidated_at;
-- ALTER TABLE public.aec_assessment_state DROP COLUMN IF EXISTS invalidation_reason;
-- COMMIT;
