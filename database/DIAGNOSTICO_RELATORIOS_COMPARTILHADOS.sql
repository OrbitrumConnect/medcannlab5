-- =====================================================
-- DIAGNÓSTICO: Relatórios Compartilhados
-- Execute este script para verificar o que está faltando
-- =====================================================

-- 1. VERIFICAR SE A FUNÇÃO RPC EXISTE
-- =====================================================
SELECT 
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public'
  AND routine_name = 'get_shared_reports_for_doctor';

-- Se retornar vazio, a função não existe!

-- 2. VERIFICAR COLUNAS DE COMPARTILHAMENTO
-- =====================================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'clinical_reports'
  AND column_name IN ('shared_with', 'shared_at', 'shared_by', 'status')
ORDER BY ordinal_position;

-- Se alguma coluna não aparecer, ela não existe!

-- 3. VERIFICAR RELATÓRIOS NO BANCO
-- =====================================================
SELECT 
  COUNT(*) as total_relatorios,
  COUNT(CASE WHEN shared_with IS NOT NULL THEN 1 END) as com_shared_with,
  COUNT(CASE WHEN status = 'shared' THEN 1 END) as status_shared,
  COUNT(CASE WHEN shared_at IS NOT NULL THEN 1 END) as com_shared_at
FROM clinical_reports;

-- 4. VERIFICAR RELATÓRIOS COMPARTILHADOS (DETALHADO)
-- =====================================================
SELECT 
  id,
  patient_id,
  patient_name,
  status,
  shared_with,
  shared_at,
  shared_by,
  created_at,
  updated_at
FROM clinical_reports
WHERE shared_with IS NOT NULL
  AND array_length(shared_with, 1) > 0
ORDER BY shared_at DESC NULLS LAST
LIMIT 10;

-- 5. VERIFICAR NOTIFICAÇÕES DE RELATÓRIOS
-- =====================================================
SELECT 
  id,
  type,
  title,
  message,
  data->>'report_id' as report_id,
  user_id,
  created_at,
  read
FROM notifications
WHERE type = 'report_shared'
ORDER BY created_at DESC
LIMIT 10;

-- 6. VERIFICAR POLÍTICAS RLS
-- =====================================================
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'clinical_reports'
ORDER BY policyname;

-- 7. VERIFICAR SE EXISTE RELATÓRIO COM NOTIFICAÇÃO MAS SEM SHARED_WITH
-- =====================================================
SELECT 
  n.id as notification_id,
  n.data->>'report_id' as report_id,
  n.user_id as notified_user_id,
  cr.id as report_exists,
  cr.shared_with,
  cr.status
FROM notifications n
LEFT JOIN clinical_reports cr ON cr.id = n.data->>'report_id'
WHERE n.type = 'report_shared'
ORDER BY n.created_at DESC;

-- 8. VERIFICAR ESTRUTURA DA TABELA CLINICAL_REPORTS
-- =====================================================
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'clinical_reports'
ORDER BY ordinal_position;

-- =====================================================
-- INTERPRETAÇÃO DOS RESULTADOS
-- =====================================================
-- 
-- Se a função RPC não existe:
--   → Execute: ADICIONAR_COMPARTILHAMENTO_RELATORIOS.sql
--
-- Se as colunas shared_with, shared_at, shared_by não existem:
--   → Execute: ADICIONAR_COMPARTILHAMENTO_RELATORIOS.sql
--
-- Se há notificações mas não há relatórios com shared_with:
--   → O compartilhamento não foi executado corretamente
--   → Verifique se a função share_report_with_doctors existe
--
-- Se há relatórios mas não aparecem na interface:
--   → Verifique as políticas RLS
--   → Verifique se o user_id na notificação corresponde ao ID em shared_with
--

