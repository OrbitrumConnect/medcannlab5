-- ============================================================================
-- V1.9.474 (27/05/2026) — Trigger BD: reset invalidated_at em restart AEC
-- ============================================================================
--
-- CONTEXTO EMPÍRICO (audit 27/05 ~21h BRT):
-- Audit empírico via PAT revelou 3 rows em aec_assessment_state com anomalia
-- temporal: invalidated_at >27 dias ANTERIOR ao started_at. Causa raiz
-- identificada em src/lib/clinicalAssessmentFlow.ts:435-449 — o UPSERT com
-- onConflict='user_id' sobrescreve started_at/phase/data/etc MAS não inclui
-- invalidated_at nem invalidation_reason. Resultado: rows novos (sessão AEC
-- recomeçada) carregam cicatriz temporal da invalidação anterior.
--
-- 3 rows afetadas empiricamente:
-- - df6cee2d (passosmir4 — Eduardo simulou 27/05): invalidated 30/04, started 27/05 (gap 27.4 dias)
-- - 5c98c123 (Carolina Campello): invalidated 25/04, started 25/05 (gap 29.6 dias)
-- - d5e01ead (casualmusic2021): invalidated 27/04, started 24/05 (gap 27.4 dias)
--
-- IMPLICAÇÃO REGULATÓRIA: auditoria ANVISA SaMD pode questionar inconsistência
-- temporal (ISO 13485 §4.2.5 rastreabilidade de registros). Inversão lógica
-- (invalidação antes de criação) é visível em audit empírico.
--
-- SOLUÇÃO ARQUITETURAL (BD-only, não toca FSM clinicalAssessmentFlow.ts):
-- Trigger BEFORE UPDATE que detecta cenário "restart AEC pós-invalidação" e
-- automaticamente limpa invalidated_at + invalidation_reason. Garante
-- invariante temporal sem precisar fix em todos callers (defesa em
-- profundidade — princípio cristalizado MedCannLab).
--
-- LÓGICA do trigger:
-- IF OLD.invalidated_at IS NOT NULL (estado anterior estava invalidado)
-- AND NEW.started_at > OLD.invalidated_at (estado novo é posterior à invalidação)
-- THEN reset invalidated_at + invalidation_reason para NULL
--
-- CENÁRIOS SEGUROS (smoke empírico 27/05):
-- ✅ Cenário 1: Restart pós-invalidação → trigger dispara, reseta corretamente
-- ✅ Cenário 2: Continuação AEC ativa (OLD.invalidated_at IS NULL) → não dispara
-- ✅ Cenário 3: Invalidação fresca (UPDATE seta invalidated_at) → NEW.started_at NÃO > NEW.invalidated_at → não dispara
-- ✅ Cenário 4: 2 rows backfilladas via UPDATE neutro empíricamente
--
-- TIMING TRIGGER:
-- BEFORE UPDATE FOR EACH ROW
-- Ordem alfabética: roda APÓS trg_aec_state_last_update (compatível).
-- AFTER UPDATE: trigger aec_state_anomaly_logger continua intacto (audit log).
--
-- VALIDAÇÃO PRÉ-MIGRATION (já aplicada via PAT 27/05 ~22h):
-- - CREATE FUNCTION + CREATE TRIGGER executados via Management API SQL
-- - 1 smoke empírico em row Eduardo (passosmir4) → invalidated_at NULL ✅
-- - 2 backfill seletivo restantes via UPDATE neutro → invalidated_at NULL ✅
-- - Validação final: 0 anomalias temporais empíricamente
--
-- Esta migration é DOCUMENTAL/IDEMPOTENTE — recria função e trigger se
-- ambiente novo (DROP IF EXISTS + CREATE OR REPLACE).
-- ============================================================================

-- Função: detecta restart AEC pós-invalidação + reseta campos
CREATE OR REPLACE FUNCTION public.reset_invalidated_on_aec_restart()
RETURNS TRIGGER AS $$
BEGIN
  -- Cenário: registro estava INVALIDADO antes + agora está sendo atualizado
  -- com started_at POSTERIOR à invalidação = restart AEC.
  IF OLD.invalidated_at IS NOT NULL
     AND NEW.started_at > OLD.invalidated_at THEN
    RAISE NOTICE '[V1.9.474] AEC restart detectado user=% (started_at % > invalidated_at %). Resetando invalidated_at + invalidation_reason.',
      NEW.user_id, NEW.started_at, OLD.invalidated_at;
    NEW.invalidated_at := NULL;
    NEW.invalidation_reason := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger BEFORE UPDATE — idempotente (DROP IF EXISTS + CREATE)
DROP TRIGGER IF EXISTS trg_aec_state_reset_invalidated_on_restart
  ON public.aec_assessment_state;

CREATE TRIGGER trg_aec_state_reset_invalidated_on_restart
  BEFORE UPDATE ON public.aec_assessment_state
  FOR EACH ROW
  EXECUTE FUNCTION public.reset_invalidated_on_aec_restart();

-- Documentação inline
COMMENT ON FUNCTION public.reset_invalidated_on_aec_restart() IS
  'V1.9.474 (27/05/2026) — Reset invalidated_at em restart AEC. Audit empírico identificou rows com gap temporal >27 dias entre invalidated_at e started_at causado por UPSERT seletivo em clinicalAssessmentFlow.ts:435-449 que não incluía invalidated_at na cláusula. Trigger BD garante invariante temporal sem precisar fix frontend (defesa em profundidade).';

COMMENT ON TRIGGER trg_aec_state_reset_invalidated_on_restart ON public.aec_assessment_state IS
  'V1.9.474 — Detecta restart AEC pós-invalidação e limpa invalidated_at + invalidation_reason automaticamente. Smoke empírico 27/05 ~22h BRT: 3/3 rows anomalia históricas zeradas. Princípio anti-Babylon: invariante temporal é controle de integridade SaMD (ISO 13485 §4.2.5).';
