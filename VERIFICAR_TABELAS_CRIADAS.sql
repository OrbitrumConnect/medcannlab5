-- =====================================================
-- ✅ VERIFICAÇÃO: Tabelas Criadas para IA Residente
-- =====================================================
-- Execute este script para verificar se todas as tabelas foram criadas

-- 1. Verificar tabelas principais
SELECT 
  'patient_medical_records' as tabela,
  COUNT(*) as total_registros
FROM patient_medical_records
UNION ALL
SELECT 
  'user_activity_logs' as tabela,
  COUNT(*) as total_registros
FROM user_activity_logs
UNION ALL
SELECT 
  'user_statistics' as tabela,
  COUNT(*) as total_registros
FROM user_statistics
UNION ALL
SELECT 
  'ai_saved_documents' as tabela,
  COUNT(*) as total_registros
FROM ai_saved_documents
UNION ALL
SELECT 
  'patient_insights' as tabela,
  COUNT(*) as total_registros
FROM patient_insights
UNION ALL
SELECT 
  'ai_chat_interactions' as tabela,
  COUNT(*) as total_registros
FROM ai_chat_interactions;

-- 2. Verificar funções RPC criadas
SELECT 
  routine_name as funcao,
  routine_type as tipo
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'get_user_statistics',
    'get_platform_statistics',
    'get_patient_medical_history',
    'update_user_statistics'
  )
ORDER BY routine_name;

-- 3. Verificar políticas RLS habilitadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN (
  'patient_medical_records',
  'user_activity_logs',
  'user_statistics',
  'ai_saved_documents',
  'patient_insights',
  'ai_chat_interactions'
)
ORDER BY tablename, policyname;

-- 4. Verificar índices criados
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN (
  'patient_medical_records',
  'user_activity_logs',
  'user_statistics',
  'ai_saved_documents',
  'patient_insights',
  'ai_chat_interactions'
)
ORDER BY tablename, indexname;

