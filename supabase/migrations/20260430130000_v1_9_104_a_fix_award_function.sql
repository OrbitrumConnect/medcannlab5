-- Migration: V1.9.104-A — Fix award_gamification_points (coluna last_activity_date NÃO EXISTE)
-- Data: 30/04/2026 ~14h BRT
--
-- CONTEXTO
-- ────────
-- Bug pré-existente descoberto empiricamente ao tentar usar a função:
--   ERROR 42703: column "last_activity_date" of relation "user_statistics" does not exist
--
-- A coluna real em user_statistics é `last_activity_at` (timestamptz),
-- não `last_activity_date` (date).
--
-- Bug nunca tinha aparecido porque:
--   - feature_flags.points_enabled = false desde 30/12/2025
--   - gamification_points: 0 rows (função nunca chamada em prod)
--   - V1.9.104 ATIVOU o sistema → função executou pela 1a vez → bug exposto
--
-- LOCK PRESERVATION:
--   ❌ NÃO toca handleFinalizeAssessment / FSM / Verbatim / Pipeline
--   ✅ Apenas substitui CREATE OR REPLACE FUNCTION existente
--   ✅ Mantém assinatura idêntica (parâmetros + retorno)
--   ✅ Mantém SECURITY DEFINER + search_path

BEGIN;

CREATE OR REPLACE FUNCTION public.award_gamification_points(
  p_user_id uuid,
  p_points integer,
  p_source text,
  p_description text DEFAULT NULL::text,
  p_category text DEFAULT 'learning'::text,
  p_source_id uuid DEFAULT NULL::uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_point_id UUID;
BEGIN
  -- Validação básica
  IF p_points <= 0 THEN
    RAISE EXCEPTION 'Points must be positive, got %', p_points;
  END IF;

  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id cannot be null';
  END IF;

  -- Inserir registro de pontos
  INSERT INTO public.gamification_points (
    user_id, points, source, source_id, description, category
  ) VALUES (
    p_user_id, p_points, p_source, p_source_id, p_description, p_category
  ) RETURNING id INTO v_point_id;

  -- Atualizar user_statistics (experience_points) se existir registro
  -- V1.9.104-A FIX: coluna correta é `last_activity_at` (timestamptz),
  -- não `last_activity_date` (que não existe).
  UPDATE public.user_statistics
  SET experience_points = experience_points + p_points,
      last_activity_at = NOW(),
      updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Se não existia registro em user_statistics, criar
  IF NOT FOUND THEN
    INSERT INTO public.user_statistics (user_id, experience_points, last_activity_at)
    VALUES (p_user_id, p_points, NOW())
    ON CONFLICT (user_id) DO UPDATE
    SET experience_points = public.user_statistics.experience_points + p_points,
        last_activity_at = NOW(),
        updated_at = NOW();
  END IF;

  -- Recalcular nível (1 nível a cada 1000 pontos — V1.9.104 adiciona compute_aec_level
  -- para mapeamento custom Iniciante/Bronze/Prata/Ouro/Diamante via view/query separada)
  UPDATE public.user_statistics
  SET level = GREATEST(1, floor(experience_points / 1000) + 1)
  WHERE user_id = p_user_id;

  RETURN v_point_id;
END;
$function$;

COMMENT ON FUNCTION public.award_gamification_points IS
  'V1.9.104-A — Concede pontos de gamificação. Fix de bug pré-existente: '
  'coluna last_activity_at (não last_activity_date que não existe).';

-- ──────────────────────────────────────────────────────────────────────
-- Re-rodar backfill V1.9.104 agora que função funciona
-- ──────────────────────────────────────────────────────────────────────
-- Idempotente: NOT EXISTS protege contra duplicação.

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
      RAISE WARNING 'Backfill V1.9.104-A falhou pra report %: %',
                    v_record.report_id, SQLERRM;
    END;
  END LOOP;

  RAISE NOTICE 'V1.9.104-A backfill: % processados, % pulados', v_count, v_skipped;
END $$;

COMMIT;
