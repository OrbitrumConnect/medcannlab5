-- SCRIPT DE DIAGNÓSTICO DO SISTEMA (RAIO-X)
-- Rode este script para ver a contagem real de dados no seu banco hoje.

WITH UserStats AS (
    SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN raw_user_meta_data->>'type' = 'admin' THEN 1 END) as admins,
        COUNT(CASE WHEN raw_user_meta_data->>'type' = 'professional' THEN 1 END) as n_medicos,
        COUNT(CASE WHEN raw_user_meta_data->>'type' = 'patient' THEN 1 END) as n_pacientes
    FROM auth.users
)
SELECT '1. USUÁRIOS' as Categoria, 'Total Cadastrados' as Item, total::text as Quantidade FROM UserStats
UNION ALL
SELECT '1. USUÁRIOS', 'Admins', admins::text FROM UserStats
UNION ALL
SELECT '1. USUÁRIOS', 'Médicos', n_medicos::text FROM UserStats
UNION ALL
SELECT '1. USUÁRIOS', 'Pacientes', n_pacientes::text FROM UserStats

UNION ALL

SELECT '2. INTELIGÊNCIA (IA)', 'Conversas Salvas (Chat)', COUNT(*)::text FROM public.ai_chat_interactions
UNION ALL
SELECT '2. INTELIGÊNCIA (IA)', 'Métricas Diárias (Snapshots)', COUNT(*)::text FROM public.kpi_daily_snapshots

UNION ALL

SELECT '3. CLÍNICA', 'Agendamentos', COUNT(*)::text FROM public.appointments
UNION ALL
SELECT '3. CLÍNICA', 'Prontuários / Reports', COUNT(*)::text FROM public.clinical_reports
UNION ALL
SELECT '3. CLÍNICA', 'Clínicas Ativas', COUNT(*)::text FROM public.clinics WHERE is_active = true

UNION ALL

SELECT '4. CONTEÚDO', 'Documentos na Biblioteca', COUNT(*)::text FROM public.documents
UNION ALL
SELECT '4. CONTEÚDO', 'Aulas/Módulos', COUNT(*)::text FROM public.noa_lessons;
