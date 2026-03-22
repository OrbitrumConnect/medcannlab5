-- ╔══════════════════════════════════════════════════════════════════════╗
-- ║  SCRIPT DE AUDITORIA COMPLETA — MedCannLab 3.0                     ║
-- ║  Execute no Supabase SQL Editor (Dashboard → SQL Editor → New Query)║
-- ║  Copie o resultado inteiro e cole na IA auditora.                   ║
-- ║  Data: 21/03/2026 | Autor: Antigravity                             ║
-- ╚══════════════════════════════════════════════════════════════════════╝

-- =============================================================================
-- PARTE 1: INVENTÁRIO DE TABELAS (nome, colunas, tipos, defaults, nullable)
-- =============================================================================
SELECT '## 📋 PARTE 1: INVENTÁRIO DE TABELAS' AS section;

SELECT
  '### Tabela: ' || c.table_name AS info,
  string_agg(
    '- `' || c.column_name || '` ' || c.data_type ||
    CASE WHEN c.character_maximum_length IS NOT NULL THEN '(' || c.character_maximum_length || ')' ELSE '' END ||
    CASE WHEN c.is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
    CASE WHEN c.column_default IS NOT NULL THEN ' DEFAULT ' || c.column_default ELSE '' END,
    E'\n' ORDER BY c.ordinal_position
  ) AS columns
FROM information_schema.columns c
WHERE c.table_schema = 'public'
  AND c.table_name NOT LIKE 'pg_%'
  AND c.table_name NOT LIKE '__%'
GROUP BY c.table_name
ORDER BY c.table_name;

-- =============================================================================
-- PARTE 2: CONTAGEM DE LINHAS POR TABELA (dimensionamento)
-- =============================================================================
SELECT '## 📊 PARTE 2: CONTAGEM ESTIMADA DE LINHAS POR TABELA' AS section;

SELECT
  relname AS table_name,
  n_live_tup AS estimated_row_count
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;

-- =============================================================================
-- PARTE 3: PRIMARY KEYS E UNIQUE CONSTRAINTS
-- =============================================================================
SELECT '## 🔑 PARTE 3: PRIMARY KEYS E UNIQUE CONSTRAINTS' AS section;

SELECT
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) AS columns
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
WHERE tc.table_schema = 'public'
  AND tc.constraint_type IN ('PRIMARY KEY', 'UNIQUE')
GROUP BY tc.table_name, tc.constraint_name, tc.constraint_type
ORDER BY tc.table_name, tc.constraint_type;

-- =============================================================================
-- PARTE 4: FOREIGN KEYS (relacionamentos entre tabelas)
-- =============================================================================
SELECT '## 🔗 PARTE 4: FOREIGN KEYS' AS section;

SELECT
  tc.table_name AS from_table,
  kcu.column_name AS from_column,
  ccu.table_name AS to_table,
  ccu.column_name AS to_column,
  tc.constraint_name,
  rc.update_rule,
  rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints rc
  ON rc.constraint_name = tc.constraint_name
  AND rc.constraint_schema = tc.constraint_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- =============================================================================
-- PARTE 5: CHECK CONSTRAINTS
-- =============================================================================
SELECT '## ✅ PARTE 5: CHECK CONSTRAINTS' AS section;

SELECT
  tc.table_name,
  tc.constraint_name,
  cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc
  ON tc.constraint_name = cc.constraint_name
  AND tc.constraint_schema = cc.constraint_schema
WHERE tc.table_schema = 'public'
  AND tc.constraint_type = 'CHECK'
  AND cc.check_clause NOT LIKE '%IS NOT NULL%'  -- Exclui NOT NULL implícitos
ORDER BY tc.table_name;

-- =============================================================================
-- PARTE 6: INDEXES (performance)
-- =============================================================================
SELECT '## ⚡ PARTE 6: INDEXES' AS section;

SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- =============================================================================
-- PARTE 7: RLS STATUS POR TABELA (ativo/inativo)
-- =============================================================================
SELECT '## 🛡️ PARTE 7: RLS STATUS POR TABELA' AS section;

SELECT
  c.relname AS table_name,
  CASE WHEN c.relrowsecurity THEN '✅ RLS ATIVO' ELSE '❌ RLS INATIVO' END AS rls_status,
  CASE WHEN c.relforcerowsecurity THEN '🔒 FORCE RLS' ELSE '' END AS force_rls
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'  -- Apenas tabelas (não views)
ORDER BY c.relrowsecurity DESC, c.relname;

-- =============================================================================
-- PARTE 8: TODAS AS POLICIES RLS (detalhe completo)
-- =============================================================================
SELECT '## 🔐 PARTE 8: TODAS AS POLICIES RLS' AS section;

SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles::text,
  cmd,
  qual::text AS using_expression,
  with_check::text AS with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =============================================================================
-- PARTE 9: POLICIES SUSPEITAS (always-true, sem filtro)
-- =============================================================================
SELECT '## ⚠️ PARTE 9: POLICIES SUSPEITAS (ALWAYS-TRUE / SEM FILTRO)' AS section;

SELECT
  tablename,
  policyname,
  cmd,
  qual::text AS using_expression,
  with_check::text AS with_check_expression,
  '🚨 POLICY SEM FILTRO REAL' AS warning
FROM pg_policies
WHERE schemaname = 'public'
  AND (
    qual::text = 'true'
    OR qual::text = '(true)'
    OR qual::text IS NULL
    OR with_check::text = 'true'
    OR with_check::text = '(true)'
  )
ORDER BY tablename;

-- =============================================================================
-- PARTE 10: TABELAS SEM NENHUMA POLICY RLS (vulneráveis se RLS ativo)
-- =============================================================================
SELECT '## 🚨 PARTE 10: TABELAS COM RLS ATIVO MAS SEM POLICIES' AS section;

SELECT
  c.relname AS table_name,
  '❌ RLS ATIVO SEM POLICIES — BLOQUEIO TOTAL' AS warning
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relrowsecurity = true
  AND NOT EXISTS (
    SELECT 1 FROM pg_policies p
    WHERE p.tablename = c.relname
      AND p.schemaname = 'public'
  )
ORDER BY c.relname;

-- =============================================================================
-- PARTE 11: TODAS AS FUNCTIONS/RPCs (com security type)
-- =============================================================================
SELECT '## ⚙️ PARTE 11: FUNCTIONS E RPCs' AS section;

SELECT
  p.proname AS function_name,
  pg_get_function_arguments(p.oid) AS arguments,
  pg_get_function_result(p.oid) AS return_type,
  CASE p.prosecdef
    WHEN true THEN '🔴 SECURITY DEFINER'
    ELSE '🟢 SECURITY INVOKER'
  END AS security_type,
  l.lanname AS language,
  pg_get_functiondef(p.oid) AS full_definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
JOIN pg_language l ON l.oid = p.prolang
WHERE n.nspname = 'public'
  AND p.prokind = 'f'  -- Apenas functions (não aggregates)
ORDER BY p.proname;

-- =============================================================================
-- PARTE 12: FUNCTIONS COM SECURITY DEFINER (risco elevado)
-- =============================================================================
SELECT '## 🔴 PARTE 12: FUNCTIONS SECURITY DEFINER (RISCO ELEVADO)' AS section;

SELECT
  p.proname AS function_name,
  pg_get_function_arguments(p.oid) AS arguments,
  CASE
    WHEN p.proconfig IS NOT NULL AND array_to_string(p.proconfig, ',') LIKE '%search_path%'
    THEN '✅ search_path definido'
    ELSE '⚠️ SEM search_path — RISCO DE SCHEMA POISONING'
  END AS search_path_status,
  p.proconfig::text AS config
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.prosecdef = true  -- SECURITY DEFINER apenas
ORDER BY p.proname;

-- =============================================================================
-- PARTE 13: FUNCTIONS SEM search_path (todas, não só DEFINER)
-- =============================================================================
SELECT '## ⚠️ PARTE 13: FUNCTIONS SEM search_path CONFIGURADO' AS section;

SELECT
  p.proname AS function_name,
  CASE p.prosecdef
    WHEN true THEN '🔴 DEFINER'
    ELSE '🟢 INVOKER'
  END AS security_type,
  '⚠️ Sem search_path' AS warning
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.prokind = 'f'
  AND (p.proconfig IS NULL OR NOT (array_to_string(p.proconfig, ',') LIKE '%search_path%'))
ORDER BY p.prosecdef DESC, p.proname;

-- =============================================================================
-- PARTE 14: VIEWS (definição completa)
-- =============================================================================
SELECT '## 👁️ PARTE 14: VIEWS' AS section;

SELECT
  table_name AS view_name,
  view_definition
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;

-- =============================================================================
-- PARTE 15: TRIGGERS (todos)
-- =============================================================================
SELECT '## ⚡ PARTE 15: TRIGGERS' AS section;

SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing,
  action_orientation,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- =============================================================================
-- PARTE 16: ENUMS/TYPES CUSTOMIZADOS
-- =============================================================================
SELECT '## 🏷️ PARTE 16: ENUMS E TYPES CUSTOMIZADOS' AS section;

SELECT
  t.typname AS type_name,
  string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) AS enum_values
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
JOIN pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public'
GROUP BY t.typname
ORDER BY t.typname;

-- =============================================================================
-- PARTE 17: GRANT/PERMISSÕES DAS TABELAS
-- =============================================================================
SELECT '## 🔓 PARTE 17: PERMISSÕES (GRANTS) POR TABELA' AS section;

SELECT
  grantee,
  table_name,
  string_agg(DISTINCT privilege_type, ', ' ORDER BY privilege_type) AS privileges
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND grantee IN ('anon', 'authenticated', 'service_role')
GROUP BY grantee, table_name
ORDER BY table_name, grantee;

-- =============================================================================
-- PARTE 18: GRANT/PERMISSÕES DAS FUNCTIONS
-- =============================================================================
SELECT '## 🔓 PARTE 18: PERMISSÕES (GRANTS) POR FUNCTION' AS section;

SELECT
  routine_name,
  grantee,
  privilege_type
FROM information_schema.routine_privileges
WHERE routine_schema = 'public'
  AND grantee IN ('anon', 'authenticated', 'service_role')
ORDER BY routine_name, grantee;

-- =============================================================================
-- PARTE 19: STORAGE BUCKETS (se existirem)
-- =============================================================================
SELECT '## 📦 PARTE 19: STORAGE BUCKETS' AS section;

SELECT
  id,
  name,
  public AS is_public,
  file_size_limit,
  allowed_mime_types::text
FROM storage.buckets
ORDER BY name;

-- =============================================================================
-- PARTE 20: STORAGE POLICIES
-- =============================================================================
SELECT '## 📦 PARTE 20: STORAGE POLICIES' AS section;

SELECT
  tablename,
  policyname,
  permissive,
  roles::text,
  cmd,
  qual::text AS using_expression,
  with_check::text AS with_check_expression
FROM pg_policies
WHERE schemaname = 'storage'
ORDER BY tablename, policyname;

-- =============================================================================
-- PARTE 21: RESUMO EXECUTIVO (contagens)
-- =============================================================================
SELECT '## 📊 PARTE 21: RESUMO EXECUTIVO' AS section;

SELECT 'Total de tabelas public' AS metric,
  COUNT(*)::text AS value
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r'
UNION ALL
SELECT 'Tabelas com RLS ativo',
  COUNT(*)::text
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relrowsecurity = true
UNION ALL
SELECT 'Tabelas SEM RLS',
  COUNT(*)::text
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relrowsecurity = false
UNION ALL
SELECT 'Total de policies RLS',
  COUNT(*)::text
FROM pg_policies WHERE schemaname = 'public'
UNION ALL
SELECT 'Policies always-true (suspeitas)',
  COUNT(*)::text
FROM pg_policies
WHERE schemaname = 'public'
  AND (qual::text IN ('true', '(true)') OR qual IS NULL)
UNION ALL
SELECT 'Total de functions public',
  COUNT(*)::text
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.prokind = 'f'
UNION ALL
SELECT 'Functions SECURITY DEFINER',
  COUNT(*)::text
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.prokind = 'f' AND p.prosecdef = true
UNION ALL
SELECT 'Functions sem search_path',
  COUNT(*)::text
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.prokind = 'f'
  AND (p.proconfig IS NULL OR NOT (array_to_string(p.proconfig, ',') LIKE '%search_path%'))
UNION ALL
SELECT 'Total de views',
  COUNT(*)::text
FROM information_schema.views WHERE table_schema = 'public'
UNION ALL
SELECT 'Total de triggers',
  COUNT(*)::text
FROM information_schema.triggers WHERE trigger_schema = 'public'
UNION ALL
SELECT 'Total de foreign keys',
  COUNT(*)::text
FROM information_schema.table_constraints
WHERE table_schema = 'public' AND constraint_type = 'FOREIGN KEY'
UNION ALL
SELECT 'Total de indexes',
  COUNT(*)::text
FROM pg_indexes WHERE schemaname = 'public';

-- =============================================================================
-- FIM DO SCRIPT — Cole o resultado completo na IA auditora
-- =============================================================================
SELECT '## ✅ FIM DA AUDITORIA — 21 partes extraídas' AS section;
SELECT 'Cole TODO o resultado acima no prompt da IA auditora junto com o código-fonte (src/ + supabase/functions/).' AS instrucao;
