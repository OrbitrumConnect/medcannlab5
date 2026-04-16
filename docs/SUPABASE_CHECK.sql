-- 🕵️ SCRIPT DE AUDITORIA SUPABASE - MEDCANNLAB 5.0
-- Este script verifica a integridade do banco de dados e aponta discrepâncias críticas.

-- 1. VERIFICAÇÃO DE ESTRUTURA CRÍTICA (is_official)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='is_official') THEN
        RAISE NOTICE '❌ CRÍTICO: Coluna is_official falta na tabela public.users. A VIEW patient_doctors irá falhar.';
    ELSE
        RAISE NOTICE '✅ OK: Coluna is_official presente em public.users.';
    END IF;
END $$;

-- 2. VERIFICAÇÃO DA VIEW patient_doctors
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'patient_doctors';
-- Nota: Se 'is_official' não aparecer acima, a migração não foi aplicada corretamente.

-- 3. VERIFICAÇÃO DE POLÍTICAS DE ACESSO (RLS)
SELECT tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename IN ('forum_posts', 'users', 'appointments', 'clinical_reports');

-- 4. LISTAGEM DE TABELAS ATIVAS (Para comparação com o "Gap de 27 tabelas")
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 5. VERIFICAÇÃO DE FUNÇÕES RPC CRÍTICAS (AEC & Scheduling)
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('get_available_slots_v3', 'increment_user_points', 'unlock_achievement');

-- 6. STATUS DE EDGE FUNCTIONS (Referência manual necessária via CLI)
-- tradevision-core: Verificar se AI_MODEL_NAME_CHAT e AI_MODEL_NAME_RISK estão setadas.
