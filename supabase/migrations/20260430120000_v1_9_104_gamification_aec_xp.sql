-- Migration: V1.9.104 — Gamificação por AEC finalizada (XP + nível custom)
-- Data: 30/04/2026 ~13h BRT
--
-- CONTEXTO
-- ────────
-- Sistema de gamificação JÁ EXISTE em prod (tabelas + funções + views) mas
-- está dormente:
--   - feature_flags.points_enabled = false (desde 30/12/2025)
--   - gamification_points: 0 rows
--   - user_statistics: 0 rows
--   - ranking_history: 0 rows
--
-- Pedro 30/04 ~14h confirmou 4 decisões:
--   1. XP por AEC = 20 fixo (não proporcional ao score)
--   2. Backfill: TODOS os 17 reports com signed_at antigos ganham XP
--   3. Diamante começa em 3000 XP (~150 AECs); 250 AECs = saturação (sem novo tier)
--   4. Decay: -10 XP/semana sem AEC, floor = Prata se já atingiu Prata
--      (decay implementado em V1.9.105 separada, não nesta migration)
--
-- Mapeamento níveis confirmado:
--   Iniciante  →   0–499 XP   (0% desc)
--   Bronze     → 500–999 XP   (5% desc)  — 25 AECs
--   Prata      → 1000–1999 XP (10% desc) — 50 AECs
--   Ouro       → 2000–2999 XP (15% desc) — 80 AECs (na verdade 100 AECs com 20 XP)
--   Diamante   → 3000+ XP     (20% desc) — 150 AECs
--
-- LOCK PRESERVATION:
--   ❌ NÃO toca handleFinalizeAssessment / FSM / Verbatim / Pipeline / Signature
--   ❌ NÃO toca clinical_reports / appointments / users
--   ❌ NÃO toca função award_gamification_points existente (usa, não modifica)
--   ✅ Aditiva pura: 1 função level + 1 trigger function + 1 trigger + 1 UPDATE flag
--   ✅ Reversível: DROP TRIGGER + DROP FUNCTION + UPDATE flag false
--
-- IDEMPOTÊNCIA:
--   - Backfill protegido por NOT EXISTS (description contém report_id)
--   - Trigger source_id = ns_events.id (uuid) → 1:1 com evento

BEGIN;

-- ──────────────────────────────────────────────────────────────────────
-- 1. Função compute_aec_level(xp) — mapeamento XP → nível
-- ──────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.compute_aec_level(p_xp integer)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN CASE
    WHEN p_xp >= 3000 THEN 'DIAMANTE'
    WHEN p_xp >= 2000 THEN 'OURO'
    WHEN p_xp >= 1000 THEN 'PRATA'
    WHEN p_xp >= 500  THEN 'BRONZE'
    ELSE 'INICIANTE'
  END;
END;
$$;

COMMENT ON FUNCTION public.compute_aec_level IS
  'V1.9.104 — Mapeia XP → nível custom AEC (Iniciante/Bronze/Prata/Ouro/Diamante). '
  'Thresholds: 0/500/1000/2000/3000. IMMUTABLE, sem side effects.';

-- ──────────────────────────────────────────────────────────────────────
-- 2. Trigger function: ns_award_xp_on_aec_finalized
-- ──────────────────────────────────────────────────────────────────────
-- Dispara em AFTER INSERT em clinical_north_star_events quando event_type
-- = 'aec_finalized'. Concede 20 XP via award_gamification_points (já existe).
--
-- Idempotência: source_id = NEW.id (uuid do ns_event) garante 1:1 com evento.
-- Se mesmo report disparar 2 events (caminho 1 + caminho 2), seriam 2 ns_events
-- diferentes → 2 disparos. Mas V1.9.101 só permite 1 disparo por report
-- (signed_at NULL→NOT NULL é transição única), então caso edge não acontece
-- em prod.

CREATE OR REPLACE FUNCTION public.ns_award_xp_on_aec_finalized()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Guard: só processar event_type='aec_finalized' com patient_id válido
  IF NEW.event_type != 'aec_finalized' OR NEW.patient_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Award XP via função existente (não toca lógica interna dela)
  -- Fail-safe: erro NÃO bloqueia o INSERT no ns_events
  BEGIN
    PERFORM public.award_gamification_points(
      p_user_id     := NEW.patient_id,
      p_points      := 20,
      p_source      := 'aec_finalized',
      p_description := 'AEC finalizada — V1.9.104',
      p_category    := 'clinical',
      p_source_id   := NEW.id
    );
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING '[ns_award_xp_on_aec_finalized] erro silencioso (não bloqueia): % (event_id=%)',
                    SQLERRM, NEW.id;
  END;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.ns_award_xp_on_aec_finalized IS
  'V1.9.104 — Trigger function: ao receber aec_finalized event, concede 20 XP. '
  'SECURITY DEFINER bypass RLS pra atualizar gamification_points + user_statistics. '
  'Fail-safe: erros silenciosos não bloqueiam ns_event.';

DROP TRIGGER IF EXISTS trg_ns_award_xp_on_aec ON public.clinical_north_star_events;
CREATE TRIGGER trg_ns_award_xp_on_aec
  AFTER INSERT ON public.clinical_north_star_events
  FOR EACH ROW
  WHEN (NEW.event_type = 'aec_finalized')
  EXECUTE FUNCTION public.ns_award_xp_on_aec_finalized();

-- ──────────────────────────────────────────────────────────────────────
-- 3. Ativar feature flag points_enabled
-- ──────────────────────────────────────────────────────────────────────
UPDATE public.feature_flags
   SET enabled = true,
       updated_at = NOW()
 WHERE flag = 'points_enabled';

-- ──────────────────────────────────────────────────────────────────────
-- 4. Backfill: 17 reports antigos com signed_at recebem 20 XP retroativos
-- ──────────────────────────────────────────────────────────────────────
-- Idempotência via NOT EXISTS: description contém report_id, não duplica
-- se migration rodar 2x.

DO $$
DECLARE
  v_record RECORD;
  v_count INT := 0;
  v_skipped INT := 0;
BEGIN
  FOR v_record IN
    SELECT cr.id AS report_id, cr.patient_id, cr.signed_at
    FROM public.clinical_reports cr
    WHERE cr.signed_at IS NOT NULL
      AND cr.patient_id IS NOT NULL
    ORDER BY cr.signed_at
  LOOP
    -- Skip se já tem registro de backfill V1.9.104 pra esse report
    IF EXISTS (
      SELECT 1 FROM public.gamification_points gp
       WHERE gp.user_id = v_record.patient_id
         AND gp.source = 'aec_finalized'
         AND gp.description LIKE '%V1.9.104 backfill%' || v_record.report_id || '%'
    ) THEN
      v_skipped := v_skipped + 1;
      CONTINUE;
    END IF;

    BEGIN
      PERFORM public.award_gamification_points(
        p_user_id     := v_record.patient_id,
        p_points      := 20,
        p_source      := 'aec_finalized',
        p_description := 'V1.9.104 backfill — report ' || v_record.report_id,
        p_category    := 'clinical',
        p_source_id   := NULL
      );
      v_count := v_count + 1;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Backfill V1.9.104 falhou pra report %: %',
                    v_record.report_id, SQLERRM;
    END;
  END LOOP;

  RAISE NOTICE 'V1.9.104 backfill completo: % reports processados, % pulados (já tinham)',
               v_count, v_skipped;
END $$;

-- Smoke test inline REMOVIDO — rodar separadamente via SQL após COMMIT.
-- Razão: smoke dentro do mesmo BEGIN podia gerar rollback total se houvesse
-- edge case (ex: user_statistics sem row pra patient → INSERT...ON CONFLICT
-- falha → EXCEPTION mascarada no trigger). Smoke separado é mais robusto.

COMMIT;

-- ──────────────────────────────────────────────────────────────────────
-- VERIFICAÇÃO PÓS-DEPLOY (rodar manualmente)
-- ──────────────────────────────────────────────────────────────────────
--
-- 1. Função compute_aec_level disponível:
--    SELECT compute_aec_level(0), compute_aec_level(500),
--           compute_aec_level(1000), compute_aec_level(2000),
--           compute_aec_level(3000), compute_aec_level(5000);
--    -- esperado: INICIANTE, BRONZE, PRATA, OURO, DIAMANTE, DIAMANTE
--
-- 2. Trigger ativo:
--    SELECT trigger_name, event_object_table, action_timing
--      FROM information_schema.triggers
--     WHERE trigger_name = 'trg_ns_award_xp_on_aec';
--
-- 3. Feature flag ligada:
--    SELECT flag, enabled FROM feature_flags WHERE flag = 'points_enabled';
--    -- esperado: enabled = true
--
-- 4. Backfill aplicado (XP retroativo):
--    SELECT user_id, sum(points) AS total_xp,
--           compute_aec_level(sum(points)::int) AS level_now
--      FROM gamification_points
--     WHERE source = 'aec_finalized'
--     GROUP BY user_id
--     ORDER BY total_xp DESC;
