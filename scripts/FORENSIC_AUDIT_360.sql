-- AUDITORIA FORENSE COMPLETA (360 GRAUS)
-- Análise cruzada de Segurança, Engajamento, Qualidade da IA e Integridade de Dados.

-- ================================================================================================
-- 1. ANÁLISE COMPORTAMENTAL E ENGAJAMENTO (Quem usa e como?)
-- ================================================================================================

-- Top Usuários por Volume de Interação (Quem são os 'Power Users'?)
SELECT 
    au.email,
    au.raw_user_meta_data->>'name' as nome,
    COUNT(ci.id) as total_mensagens,
    MAX(ci.created_at) as ultimo_uso
FROM auth.users au
LEFT JOIN public.ai_chat_interactions ci ON au.id = ci.user_id
GROUP BY au.id, au.email
ORDER BY total_mensagens DESC
LIMIT 5;

-- ================================================================================================
-- 2. QUALIDADE DA IA E SCORES (A IA está performando bem?)
-- ================================================================================================

-- Média de Tokens e Tempo de Resposta (Custo vs. Performance)
-- *Nota: 'tokens_used' e 'processing_time' são extraídos do metadado JSON se existirem
SELECT 
    AVG((metadata->>'tokensUsed')::numeric) as media_tokens_por_msg,
    AVG((metadata->>'responseLength')::numeric) as tamanho_medio_resposta,
    COUNT(CASE WHEN ai_response ILIKE '%Desculpe%' OR ai_response ILIKE '%erro%' THEN 1 END) as respostas_com_pedidos_desculpa
FROM public.ai_chat_interactions;

-- Últimas 5 Intenções Detectadas (O que os usuários estão pedindo?)
SELECT 
    intent as intencao_detectada,
    COUNT(*) as frequencia
FROM public.ai_chat_interactions
WHERE intent IS NOT NULL
GROUP BY intent
ORDER BY frequencia DESC
LIMIT 5;

-- ================================================================================================
-- 3. AUDITORIA DE SEGURANÇA (Risco e Vulnerabilidade)
-- ================================================================================================

-- Usuários sem MFA (Multi-Factor Auth) ou com Senhas Antigas (Proxy via last_sign_in)
SELECT 
    email,
    created_at as data_criacao,
    last_sign_in_at as ultimo_login,
    CASE WHEN confirmed_at IS NULL THEN '⚠️ NÃO CONFIRMADO' ELSE 'OK' END as status_email
FROM auth.users
WHERE last_sign_in_at < NOW() - INTERVAL '30 days' OR confirmed_at IS NULL
ORDER BY last_sign_in_at ASC;

-- Tentativas de Acesso em Áreas Restritas (Logs de Auditoria)
SELECT 
    action as acao_suspeita,
    COUNT(*) as ocorrencias,
    MAX(created_at) as ultima_tentativa
FROM public.medcannlab_audit_logs
WHERE action ILIKE '%denied%' OR action ILIKE '%unauthorized%'
GROUP BY action;

-- ================================================================================================
-- 4. INTEGRIDADE CLÍNICA (Dados Médicos)
-- ================================================================================================

-- Pacientes com Prontuários "Orfãos" (Sem médico responsável vinculado)
SELECT 
    p.name as paciente,
    COUNT(mr.id) as qtd_prontuarios
FROM public.profiles p
JOIN public.patient_medical_records mr ON p.user_id = mr.patient_id
WHERE mr.report_id IS NULL -- Exemplo de inconsistência (record sem report vinculado)
GROUP BY p.name;

-- Agendamentos "Zumbis" (Passados mas ainda com status 'scheduled')
SELECT 
    id, 
    appointment_date, 
    status 
FROM public.appointments
WHERE status = 'scheduled' AND appointment_date < NOW()
ORDER BY appointment_date DESC;

-- FIM DA ANÁLISE FORENSE
