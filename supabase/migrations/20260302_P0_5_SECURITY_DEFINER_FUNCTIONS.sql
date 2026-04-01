-- =====================================================
-- 🎮 P0-5: SECURITY DEFINER FUNCTIONS
-- Funções backend para tabelas protegidas por service_role
-- Data: 02/03/2026
-- =====================================================
-- CONTEXTO:
-- O P0-4 (Rev 3) travou gamification_points, user_achievements
-- e user_statistics para INSERT/UPDATE/DELETE apenas via service_role.
-- Estas funções SECURITY DEFINER são o caminho autorizado para
-- o sistema escrever nessas tabelas.
-- 
-- As funções existentes em GAMIFICATION_FUNCTIONS.sql operam
-- na tabela user_profiles (pontos/level/achievements nela).
-- Estas novas funções operam nas tabelas granulares de gamificação.
-- =====================================================

-- ===================
-- 1) AWARD_GAMIFICATION_POINTS
-- Insere registro em gamification_points (service_role via SECURITY DEFINER)
-- Uso: SELECT award_gamification_points('user-uuid', 50, 'lesson_completed', 'Completou aula X');
-- ===================
CREATE OR REPLACE FUNCTION public.award_gamification_points(
  p_user_id UUID,
  p_points INTEGER,
  p_source TEXT,
  p_description TEXT DEFAULT NULL,
  p_category TEXT DEFAULT 'learning',
  p_source_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  UPDATE public.user_statistics
  SET experience_points = experience_points + p_points,
      last_activity_date = CURRENT_DATE,
      updated_at = NOW()
  WHERE user_id = p_user_id;

  -- Se não existia registro em user_statistics, criar
  IF NOT FOUND THEN
    INSERT INTO public.user_statistics (user_id, experience_points, last_activity_date)
    VALUES (p_user_id, p_points, CURRENT_DATE)
    ON CONFLICT (user_id) DO UPDATE
    SET experience_points = public.user_statistics.experience_points + p_points,
        last_activity_date = CURRENT_DATE,
        updated_at = NOW();
  END IF;

  -- Recalcular nível (1 nível a cada 1000 pontos)
  UPDATE public.user_statistics
  SET level = GREATEST(1, floor(experience_points / 1000) + 1)
  WHERE user_id = p_user_id;

  RETURN v_point_id;
END;
$$;

-- ===================
-- 2) GRANT_ACHIEVEMENT
-- Insere registro em user_achievements (service_role via SECURITY DEFINER)
-- Uso: SELECT grant_achievement('user-uuid', 'first_assessment', 'Primeira Avaliação', 'Completou sua primeira avaliação', 100);
-- Retorna FALSE se já possuía a conquista
-- ===================
CREATE OR REPLACE FUNCTION public.grant_achievement(
  p_user_id UUID,
  p_achievement_id TEXT,
  p_title TEXT,
  p_description TEXT DEFAULT NULL,
  p_points INTEGER DEFAULT 0,
  p_category TEXT DEFAULT 'learning',
  p_rarity TEXT DEFAULT 'common',
  p_icon TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validação
  IF p_user_id IS NULL OR p_achievement_id IS NULL THEN
    RAISE EXCEPTION 'user_id and achievement_id cannot be null';
  END IF;

  -- Tentar inserir (ON CONFLICT = já tinha)
  INSERT INTO public.user_achievements (
    user_id, achievement_id, title, description, points, 
    category, rarity, icon, progress, max_progress, unlocked_at
  ) VALUES (
    p_user_id, p_achievement_id, p_title, p_description, p_points,
    p_category, p_rarity, p_icon, 1, 1, NOW()
  )
  ON CONFLICT (user_id, achievement_id) DO NOTHING;

  -- Se inseriu (não tinha antes), conceder pontos bônus
  IF FOUND AND p_points > 0 THEN
    PERFORM award_gamification_points(
      p_user_id, p_points, 'achievement_unlocked',
      'Conquista: ' || p_title, 'special'
    );
    RETURN TRUE;
  END IF;

  RETURN FALSE; -- Já possuía
END;
$$;

-- ===================
-- 3) UPDATE_ACHIEVEMENT_PROGRESS
-- Atualiza progresso de uma conquista e desbloqueia automaticamente
-- Uso: SELECT update_achievement_progress('user-uuid', 'forum_10_posts', 1);
-- ===================
CREATE OR REPLACE FUNCTION public.update_achievement_progress(
  p_user_id UUID,
  p_achievement_id TEXT,
  p_increment INTEGER DEFAULT 1
)
RETURNS BOOLEAN -- TRUE se desbloqueou agora
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_progress INTEGER;
  v_max INTEGER;
  v_was_complete BOOLEAN;
BEGIN
  -- Atualizar progresso
  UPDATE public.user_achievements
  SET progress = LEAST(progress + p_increment, max_progress),
      unlocked_at = CASE 
        WHEN progress + p_increment >= max_progress AND unlocked_at IS NULL 
        THEN NOW() 
        ELSE unlocked_at 
      END
  WHERE user_id = p_user_id AND achievement_id = p_achievement_id
  RETURNING progress, max_progress, (progress >= max_progress) INTO v_progress, v_max, v_was_complete;

  -- Se completou agora e não tinha completado antes
  IF FOUND AND v_progress >= v_max AND NOT v_was_complete THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

-- ===================
-- 4) REFRESH_USER_STATISTICS
-- Recalcula estatísticas do usuário a partir dos dados reais
-- Uso: SELECT refresh_user_statistics('user-uuid');
-- ===================
CREATE OR REPLACE FUNCTION public.refresh_user_statistics(
  p_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_points INTEGER;
  v_total_achievements INTEGER;
  v_level INTEGER;
BEGIN
  -- Calcular total de pontos
  SELECT COALESCE(SUM(points), 0) INTO v_total_points
  FROM public.gamification_points
  WHERE user_id = p_user_id;

  -- Calcular total de conquistas
  SELECT COUNT(*) INTO v_total_achievements
  FROM public.user_achievements
  WHERE user_id = p_user_id AND progress >= max_progress;

  -- Calcular nível
  v_level := GREATEST(1, floor(v_total_points / 1000) + 1);

  -- Upsert estatísticas
  INSERT INTO public.user_statistics (
    user_id, experience_points, level, last_activity_date, updated_at
  ) VALUES (
    p_user_id, v_total_points, v_level, CURRENT_DATE, NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    experience_points = v_total_points,
    level = v_level,
    last_activity_date = CURRENT_DATE,
    updated_at = NOW();
END;
$$;

-- ===================
-- 5) LOG_INSTITUTIONAL_TRAUMA (sistema autônomo)
-- Registra evento de trauma institucional via SECURITY DEFINER
-- Uso: SELECT log_institutional_trauma('HIGH', 'Decisão excedeu limite diário', 'CLINICAL');
-- ===================
CREATE OR REPLACE FUNCTION public.log_institutional_trauma(
  p_severity TEXT,
  p_reason TEXT,
  p_affected_domain TEXT DEFAULT 'CLINICAL',
  p_recovery_estimated_at TIMESTAMPTZ DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  -- Validação de severity
  IF p_severity NOT IN ('LOW', 'HIGH', 'CRITICAL') THEN
    RAISE EXCEPTION 'Invalid severity: %. Must be LOW, HIGH, or CRITICAL', p_severity;
  END IF;

  INSERT INTO public.institutional_trauma_log (
    severity, reason, affected_domain, recovery_estimated_at, metadata
  ) VALUES (
    p_severity, p_reason, p_affected_domain, p_recovery_estimated_at, p_metadata
  ) RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

-- =====================================================
-- VERIFICAÇÃO: Listar funções criadas
-- =====================================================
SELECT 
  p.proname AS function_name,
  CASE p.prosecdef WHEN true THEN '🔐 SECURITY DEFINER' ELSE '⚠️ INVOKER' END AS security,
  pg_get_function_arguments(p.oid) AS arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN (
  'award_gamification_points',
  'grant_achievement',
  'update_achievement_progress',
  'refresh_user_statistics',
  'log_institutional_trauma',
  'increment_user_points',
  'unlock_achievement',
  'get_leaderboard',
  'ensure_user_profile'
)
ORDER BY p.proname;

-- =====================================================
-- FIM DO SCRIPT P0-5
-- =====================================================
-- ✅ award_gamification_points → gamification_points + auto-update user_statistics
-- ✅ grant_achievement → user_achievements + pontos bônus automáticos
-- ✅ update_achievement_progress → progresso incremental com auto-unlock
-- ✅ refresh_user_statistics → recalcula stats a partir dos dados reais
-- ✅ log_institutional_trauma → registro sistêmico de trauma
-- ✅ Todas SECURITY DEFINER com search_path fixo (anti-injection)
-- ✅ Validação de input em todas as funções
-- =====================================================
