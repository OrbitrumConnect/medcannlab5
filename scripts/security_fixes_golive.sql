-- ==============================================================================
-- 🔒 FIXES DE SEGURANÇA CRÍTICOS — MEDCANNLAB (SOFT LAUNCH)
-- Data: 21 de Março de 2026
-- ==============================================================================

-- 1. CORREÇÃO "SECURITY DEFINER" (Prevenção de Injeção de Path)
-- A função calculate_monthly_ranking estava sem search_path.
-- Isso é exigido pelo Supabase para qualquer função Security Definer.
ALTER FUNCTION public.calculate_monthly_ranking() SET search_path = public;

-- 2. CORREÇÃO DE POLÍTICAS "ALWAYS-TRUE" (Restringindo escritas)
-- Tabelas que estavam com USING (true) e WITH CHECK (true) abertas para a internet:
-- cognitive_decisions, gamification_points, institutional_trauma_log, interacoes_ia, 
-- user_achievements, user_statistics

-- 2.1 cognitive_decisions
DROP POLICY IF EXISTS "Permitir inserção global de decisões" ON public.cognitive_decisions;
CREATE POLICY "Permitir inserção de decisões via auth" ON public.cognitive_decisions
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 2.2 gamification_points
DROP POLICY IF EXISTS "Permitir alteração global" ON public.gamification_points;
CREATE POLICY "Permitir alteração de pontos via auth" ON public.gamification_points
  FOR ALL USING (auth.role() = 'authenticated' AND user_id = auth.uid());

-- 2.3 institutional_trauma_log
DROP POLICY IF EXISTS "Permitir log global" ON public.institutional_trauma_log;
CREATE POLICY "Permitir log trauma auth" ON public.institutional_trauma_log
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 2.4 interacoes_ia
DROP POLICY IF EXISTS "Enable insert for all users" ON public.interacoes_ia;
CREATE POLICY "Enable insert for authenticated users only" ON public.interacoes_ia
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 2.5 user_achievements
DROP POLICY IF EXISTS "Enable insert for all users" ON public.user_achievements;
CREATE POLICY "Enable insert for authenticated users only" ON public.user_achievements
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 2.6 user_statistics
DROP POLICY IF EXISTS "Enable all operations for all users" ON public.user_statistics;
CREATE POLICY "Enable operations for authenticated user only" ON public.user_statistics
  FOR ALL USING (auth.role() = 'authenticated' AND user_id = auth.uid());

-- ==============================================================================
-- 📜 DIREITO AO ESQUECIMENTO (LGPD - Art. 18, VI)
-- ==============================================================================

-- Função RPC para exclusão completa da trilha do paciente
CREATE OR REPLACE FUNCTION public.delete_all_patient_data(target_user_id UUID)
RETURNS boolean AS $$
BEGIN
    -- Verifica se o usuário tentando deletar é o dono ou admin
    IF auth.uid() != target_user_id AND 
       NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin') THEN
        RAISE EXCEPTION 'Acesso negado para excluir estes dados.';
    END IF;

    -- Deleta em cascata (se houver foreign keys corretas, o delete no profiles basta, 
    -- mas vamos forçar por segurança caso o ON DELETE CASCADE falhe em algo)
    DELETE FROM public.messages WHERE sender_id = target_user_id OR receiver_id = target_user_id;
    DELETE FROM public.prescriptions WHERE patient_id = target_user_id;
    DELETE FROM public.patient_assessments WHERE patient_id = target_user_id;
    DELETE FROM public.interacoes_ia WHERE paciente_id = target_user_id;
    DELETE FROM public.video_call_requests WHERE caller_id = target_user_id OR receiver_id = target_user_id;
    DELETE FROM public.gamification_points WHERE user_id = target_user_id;
    DELETE FROM public.user_roles WHERE user_id = target_user_id;
    DELETE FROM public.profiles WHERE id = target_user_id;
    
    -- Nota: A exclusão da entrada em auth.users não pode ser feita via RPC comum do public schema
    -- por segurança da GoTrue. Ela deve ser feita via dashboard ou Edge Function usando admin key.
    
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Permissão para rodar o direito ao esquecimento
GRANT EXECUTE ON FUNCTION public.delete_all_patient_data(UUID) TO authenticated;
