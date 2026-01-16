-- DIAGNÓSTICO PROFUNDO DO SISTEMA (DEEP DIVE Analysis)
-- Este script revela detalhes operacionais, performance e segurança.

-- 1. QUEM ESTÁ NO COMANDO? (Verificar tipos de usuário reais)
SELECT 
    email, 
    raw_user_meta_data->>'type' as tipo_declarado,
    raw_user_meta_data->>'name' as nome,
    last_sign_in_at as ultimo_login
FROM auth.users
ORDER BY last_sign_in_at DESC NULLS LAST
LIMIT 10;

-- 2. SAÚDE DA INTELIGÊNCIA ARTIFICIAL (Taxa de Erro e Performance)
WITH ChatStats AS (
    SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN ai_response IS NULL OR ai_response = '' THEN 1 END) as falhas_vazias,
        AVG(processing_time) as tempo_medio_ms,
        MAX(processing_time) as tempo_maximo_ms
    FROM public.ai_chat_interactions
)
SELECT 
    'Performance IA' as Categoria,
    total as Total_Interacoes,
    falhas_vazias as Respostas_Falhas,
    ROUND(tempo_medio_ms, 2) as Latencia_Media_ms
FROM ChatStats;

-- 3. QUEM SÃO AS "CLÍNICAS FANTASMAS"? (Clínicas sem dono ou inativas)
SELECT 
    id, 
    name, 
    is_active, 
    CASE WHEN doctor_id IS NULL THEN 'SEM DONO' ELSE 'OK' END as status_dono
FROM public.clinics;

-- 4. O QUE A IA ESTÁ LENDO? (Top Categorias da Biblioteca)
SELECT 
    category as Categoria_Doc,
    COUNT(*) as Qtd_Arquivos
FROM public.documents
GROUP BY category
ORDER BY Qtd_Arquivos DESC
LIMIT 5;

-- 5. AUDITORIA DE SEGURANÇA (Admins Reais vs. Flags)
-- Verifica se tem alguém com flag de admin mas sem o type correto
SELECT 
    email,
    raw_user_meta_data->>'flag_admin' as flag_admin_meta,
    raw_user_meta_data->>'type' as type_meta
FROM auth.users
WHERE (raw_user_meta_data->>'flag_admin')::boolean = true;
