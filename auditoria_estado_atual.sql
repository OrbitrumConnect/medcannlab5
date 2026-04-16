-- ==========================================
-- 🩺 MEDCANNLAB 3.0: AUDITORIA DE STATUS MESTRE
-- Copie este script inteiro e rode no "SQL Editor" do Supabase
-- Ele não apaga nada, apenas traz o "Raio-X" da sua estrutura.
-- ==========================================

-- 1. VERIFICAR COMO ESTÃO SEUS LOGS DE INTELIGÊNCIA (O ERRO DE ABRIL RESOLVIDO)
-- Isso mostra se a Nôa tem memória na tabela principal e na de fallback.
SELECT 
    'ai_chat_interactions' as tabela, 
    COUNT(*) as total_mensagens, 
    MAX(created_at) as ultimo_registro
FROM public.ai_chat_interactions
UNION ALL
SELECT 
    'noa_logs' as tabela, 
    COUNT(*) as total_mensagens, 
    MAX(timestamp) as ultimo_registro
FROM public.noa_logs;

-- 2. VERIFICAR OS AGENDAMENTOS (AGENDA)
-- Confere se a tabela existe e quantos agendamentos reais já foram feitos
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' AND table_name = 'appointments'
) as "tabela_appointments_existe",
(SELECT COUNT(*) FROM appointments) as total_agendamentos_cadastrados;


-- 3. ESBURECAR A TABELA DE AGENDAMENTOS
-- Retorna as colunas que você tem hoje para sabermos se falta algo para o Google Calendar
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'appointments'
ORDER BY ordinal_position;


-- 4. VERIFICAR AS COLUNAS DA TABELA DE USUÁRIOS
-- Vamos ver se já existe alguma coluna de "créditos" ou se precisamos da 'user_limits'
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND (column_name LIKE '%limit%' OR column_name LIKE '%free%' OR column_name LIKE '%plan%');


-- 5. VERIFICAR ONDE AS INTEGRAÇÕES SERÃO SALVAS
-- Queremos descobrir se a tabela 'google_integrations' ou 'professional_integrations' já existe
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (table_name LIKE '%integration%' OR table_name LIKE '%google%');


-- 6. AUDITAR OS LAUDOS CLÍNICOS E CONSENTIMENTO
-- Revela quantos relatórios existem blindados com o AES-256 e LGPD
SELECT 
  id,
  patient_id,
  created_at,
  -- Mostra se o consentimento está gravado dentro do JSON
  content->'consenso' as log_consenso
FROM clinical_reports
ORDER BY created_at DESC
LIMIT 5;
