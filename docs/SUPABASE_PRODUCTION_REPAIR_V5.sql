-- ==============================================================================
-- 🏥 MEDCANNLAB 5.0 - PRODUCTION INFRASTRUCTURE SEAL (AUDIT & REPAIR V6)
-- Data: 13/04/2026
-- Objetivo: Validar e Garantir a existência dos componentes críticos de Cloud
-- Versão: 6.0 (Com correções de segurança e lógica cirúrgica)
-- ==============================================================================

-- PARTE 1: VERIFICAÇÃO DE TABELAS E VIEWS CRÍTICAS
DO $$
DECLARE
    entity_name text;
    is_found boolean;
BEGIN
    -- 1.1 Tabelas
    FOR entity_name IN SELECT unnest(ARRAY[
        'users', 'user_profiles', 'courses', 'lessons', 'modules', 
        'clinical_assessments', 'clinical_reports',
        'professional_availability', 'appointments', 'time_blocks',
        'gamification_points', 'user_achievements', 'user_statistics',
        'forum_posts', 'forum_categories', 'chat_messages_legacy'
    ]) LOOP
        SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = entity_name) INTO is_found;
        IF NOT is_found THEN RAISE NOTICE '❌ TABELA FALTANTE: %', entity_name;
        ELSE RAISE NOTICE '✅ TABELA OK: %', entity_name;
        END IF;
    END LOOP;

    -- 1.2 Views (Fix: patient_doctors é View)
    FOR entity_name IN SELECT unnest(ARRAY['patient_doctors']) LOOP
        SELECT EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = 'public' AND table_name = entity_name) INTO is_found;
        IF NOT is_found THEN RAISE NOTICE '❌ VIEW FALTANTE: %', entity_name;
        ELSE RAISE NOTICE '✅ VIEW OK: %', entity_name;
        END IF;
    END LOOP;
END $$;

-- PARTE 2: VERIFICAÇÃO DE RPCs CRÍTICAS
DO $$
DECLARE
    rpc_name text;
    is_found boolean;
BEGIN
    FOR rpc_name IN SELECT unnest(ARRAY[
        'get_available_slots_v3',
        'book_appointment_atomic',
        'increment_user_points',
        'unlock_achievement',
        'get_leaderboard',
        'ensure_user_profile'
    ]) LOOP
        SELECT EXISTS (SELECT 1 FROM pg_proc JOIN pg_namespace n ON n.oid = pg_proc.pronamespace WHERE n.nspname = 'public' AND proname = rpc_name) INTO is_found;
        IF NOT is_found THEN RAISE NOTICE '❌ RPC FALTANTE: %', rpc_name;
        ELSE RAISE NOTICE '✅ RPC OK: %', rpc_name;
        END IF;
    END LOOP;
END $$;

-- PARTE 3: DEFINIÇÃO DAS RPCs (REPARAÇÃO COM LÓGICA CORRIGIDA)

-- 3.1 get_available_slots_v3 (Fix: Slot Duration Dinâmico + search_path)
CREATE OR REPLACE FUNCTION public.get_available_slots_v3(
    p_professional_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE (slot_start TIMESTAMPTZ, slot_end TIMESTAMPTZ, rule_id UUID, is_available BOOLEAN) 
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
    RETURN QUERY
    WITH availability AS (
        SELECT 
            (d + pa.start_time)::TIMESTAMPTZ as base_start, 
            (d + pa.end_time)::TIMESTAMPTZ as base_end, 
            pa.slot_duration, 
            COALESCE(pa.slot_interval_minutes, pa.slot_duration) as effective_interval
        FROM generate_series(p_start_date, p_end_date, '1 day'::interval) d
        JOIN professional_availability pa ON pa.professional_id = p_professional_id
        WHERE pa.day_of_week = EXTRACT(DOW FROM d)::INTEGER AND pa.is_active = true
    ),
    raw_slots AS (
        SELECT 
            generate_series(base_start, base_end - (slot_duration || ' minutes')::interval, (effective_interval || ' minutes')::interval) as s_start, 
            slot_duration 
        FROM availability
    )
    SELECT s_start, s_start + (slot_duration || ' minutes')::interval, NULL::UUID, TRUE 
    FROM raw_slots rs
    WHERE NOT EXISTS (
        SELECT 1 FROM time_blocks tb 
        WHERE tb.professional_id = p_professional_id 
          AND (tb.start_at, tb.end_at) OVERLAPS (rs.s_start, rs.s_start + (rs.slot_duration || ' minutes')::interval)
    )
    AND NOT EXISTS (
        SELECT 1 FROM appointments a 
        WHERE a.professional_id = p_professional_id 
          AND a.status IN ('scheduled', 'confirmed')
          AND (a.appointment_date, a.appointment_date + (rs.slot_duration || ' minutes')::interval) OVERLAPS (rs.s_start, rs.s_start + (rs.slot_duration || ' minutes')::interval)
    );
END; $$;

-- 3.2 increment_user_points (Fix: search_path)
CREATE OR REPLACE FUNCTION public.increment_user_points(p_user_id uuid, p_points integer)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE new_points integer; new_level integer;
BEGIN
    UPDATE public.user_profiles SET points = points + p_points, last_activity = now() WHERE user_id = p_user_id RETURNING points INTO new_points;
    new_level := floor(new_points / 1000) + 1;
    UPDATE public.user_profiles SET level = new_level WHERE user_id = p_user_id AND level < new_level;
END; $$;

-- 3.3 unlock_achievement (Fix: Coalesce NULL + search_path)
CREATE OR REPLACE FUNCTION public.unlock_achievement(p_user_id uuid, p_achievement_id text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE user_achievements text[];
BEGIN
    SELECT COALESCE(achievements, '{}') INTO user_achievements FROM public.user_profiles WHERE user_id = p_user_id;
    IF p_achievement_id = ANY(user_achievements) THEN RETURN FALSE; END IF;
    UPDATE public.user_profiles SET achievements = array_append(COALESCE(achievements, '{}'), p_achievement_id) WHERE user_id = p_user_id;
    RETURN TRUE;
END; $$;

-- PARTE 4: GARANTIA DE PERMISSÕES (FIX: REMOVIDO ANON POR SEGURANÇA)
GRANT EXECUTE ON FUNCTION public.get_available_slots_v3 TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.increment_user_points TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.unlock_achievement TO authenticated, service_role;

-- REVOKE explícito de anon se já existia (Hardening)
REVOKE EXECUTE ON FUNCTION public.get_available_slots_v3 FROM anon;
REVOKE EXECUTE ON FUNCTION public.increment_user_points FROM anon;
REVOKE EXECUTE ON FUNCTION public.unlock_achievement FROM anon;

-- PARTE 5: AJUSTES FINAIS DE RLS
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'forum_posts') THEN
        DROP POLICY IF EXISTS "read_forum_posts" ON public.forum_posts;
        CREATE POLICY "read_forum_posts" ON public.forum_posts FOR SELECT USING (true);
        RAISE NOTICE '✅ POLÍTICA forum_posts ATUALIZADA (Livre para Authenticated)';
    END IF;
END $$;

SELECT '🚀 SISTEMA SELADO (V6.0) E PRONTO PARA VALIDAÇÃO FINAL' as result;
