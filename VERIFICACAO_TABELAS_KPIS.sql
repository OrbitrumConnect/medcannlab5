-- =====================================================
-- VERIFICAÇÃO DAS TABELAS E FUNÇÕES DE KPIs CLÍNICOS
-- =====================================================
-- Execute este script para verificar se tudo foi criado corretamente

-- 1. VERIFICAR SE AS TABELAS EXISTEM
SELECT 
  'imre_assessments' as tabela,
  CASE 
    WHEN EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'imre_assessments')
    THEN '✅ Existe'
    ELSE '❌ Não existe'
  END as status
UNION ALL
SELECT 
  'clinical_assessments' as tabela,
  CASE 
    WHEN EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'clinical_assessments')
    THEN '✅ Existe'
    ELSE '❌ Não existe'
  END as status;

-- 2. VERIFICAR ESTRUTURA DAS TABELAS
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name IN ('imre_assessments', 'clinical_assessments')
ORDER BY table_name, ordinal_position;

-- 3. VERIFICAR SE AS FUNÇÕES EXISTEM
SELECT 
  routine_name as funcao,
  CASE 
    WHEN routine_name IN (
      'count_preserved_narratives',
      'count_multirational_analyses',
      'count_primary_data_blocks',
      'count_identified_correlations'
    )
    THEN '✅ Existe'
    ELSE '⚠️ Não encontrada'
  END as status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'count_preserved_narratives',
    'count_multirational_analyses',
    'count_primary_data_blocks',
    'count_identified_correlations'
  );

-- 4. TESTAR AS FUNÇÕES (mesmo que retornem 0, é normal se não houver dados)
SELECT 
  'Narrativas Preservadas' as kpi,
  count_preserved_narratives() as valor
UNION ALL
SELECT 
  'Análises Multirracionais' as kpi,
  count_multirational_analyses() as valor
UNION ALL
SELECT 
  'Blocos de Dados Primários' as kpi,
  count_primary_data_blocks() as valor
UNION ALL
SELECT 
  'Correlações Identificadas' as kpi,
  count_identified_correlations() as valor;

-- 5. VERIFICAR ÍNDICES
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('imre_assessments', 'clinical_assessments')
ORDER BY tablename, indexname;

-- 6. VERIFICAR POLÍTICAS RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('imre_assessments', 'clinical_assessments')
ORDER BY tablename, policyname;

-- 7. CONTAR REGISTROS (pode retornar 0 se não houver dados ainda)
SELECT 
  'imre_assessments' as tabela,
  COUNT(*) as total_registros
FROM imre_assessments
UNION ALL
SELECT 
  'clinical_assessments' as tabela,
  COUNT(*) as total_registros
FROM clinical_assessments;

-- =====================================================
-- RESULTADO ESPERADO:
-- =====================================================
-- Se tudo estiver correto, você verá:
-- ✅ Tabelas existem
-- ✅ Colunas corretas (triaxial_data, semantic_context, etc.)
-- ✅ Funções existem e retornam valores (mesmo que 0)
-- ✅ Índices criados
-- ✅ Políticas RLS configuradas
-- ✅ Contagem de registros (pode ser 0 se não houver dados ainda)
--
-- Se alguma coisa estiver faltando, execute novamente o script
-- SUPABASE_ATUALIZACAO_KPIS_CLINICOS.sql

