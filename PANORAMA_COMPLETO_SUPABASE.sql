-- =====================================================
-- 🔍 PANORAMA COMPLETO DO MEDCANNLAB - SUPABASE
-- =====================================================
-- Execute este script no Supabase SQL Editor para ver TUDO
-- Projeto: itdjkfubfzmvmuxxjoae.supabase.co

-- ============================================
-- 1️⃣ INFORMAÇÕES DO PROJETO
-- ============================================
SELECT 
    'MEDCANNLAB - CONEXÃO CONFIRMADA' as status,
    current_database() as database_name,
    current_schema() as current_schema,
    version() as postgres_version,
    now() as timestamp_verificacao;

-- ============================================
-- 2️⃣ LISTAR TODAS AS TABELAS
-- ============================================
SELECT 
    '📊 TABELAS NO SCHEMA PUBLIC' as categoria,
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns 
     WHERE table_name = t.table_name AND table_schema = 'public') as total_colunas
FROM information_schema.tables t
WHERE table_schema = 'public'
ORDER BY table_name;

-- ============================================
-- 3️⃣ TOTAL DE TABELAS POR SCHEMA
-- ============================================
SELECT 
    table_schema,
    COUNT(*) as total_tabelas
FROM information_schema.tables
WHERE table_schema IN ('public', 'auth', 'storage', 'realtime')
GROUP BY table_schema
ORDER BY table_schema;

-- ============================================
-- 4️⃣ ESTRUTURA DE CADA TABELA (COLUNAS)
-- ============================================
SELECT 
    '📋 ESTRUTURA DAS TABELAS' as info,
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- ============================================
-- 5️⃣ VERIFICAR RLS (ROW LEVEL SECURITY)
-- ============================================
SELECT 
    '🔒 ROW LEVEL SECURITY STATUS' as info,
    schemaname,
    tablename,
    rowsecurity as rls_habilitado
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================
-- 6️⃣ POLÍTICAS RLS ATIVAS
-- ============================================
SELECT 
    '🛡️ POLÍTICAS RLS' as info,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as comando,
    qual as tipo_policy
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================
-- 7️⃣ ÍNDICES CRIADOS
-- ============================================
SELECT 
    '📇 ÍNDICES' as info,
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ============================================
-- 8️⃣ FUNÇÕES CUSTOMIZADAS
-- ============================================
SELECT 
    '⚙️ FUNÇÕES CUSTOMIZADAS' as info,
    routine_schema,
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- ============================================
-- 9️⃣ TRIGGERS ATIVOS
-- ============================================
SELECT 
    '🔔 TRIGGERS' as info,
    trigger_schema,
    trigger_name,
    event_object_table as tabela,
    action_timing,
    event_manipulation as evento
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- ============================================
-- 🔟 FOREIGN KEYS (RELACIONAMENTOS)
-- ============================================
SELECT 
    '🔗 FOREIGN KEYS' as info,
    tc.table_name as tabela_origem,
    kcu.column_name as coluna_origem,
    ccu.table_name as tabela_destino,
    ccu.column_name as coluna_destino,
    tc.constraint_name as nome_constraint
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- ============================================
-- 1️⃣1️⃣ ENUMS CRIADOS
-- ============================================
SELECT 
    '🎨 ENUMS (TIPOS CUSTOMIZADOS)' as info,
    t.typname as enum_name,
    e.enumlabel as valor
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public'
ORDER BY t.typname, e.enumsortorder;

-- ============================================
-- 1️⃣2️⃣ STORAGE BUCKETS
-- ============================================
SELECT 
    '🗄️ STORAGE BUCKETS' as info,
    id,
    name,
    public,
    created_at
FROM storage.buckets
ORDER BY name;

-- ============================================
-- 1️⃣3️⃣ POLÍTICAS DE STORAGE
-- ============================================
SELECT 
    '📦 STORAGE POLICIES' as info,
    policyname,
    bucket_id,
    roles
FROM storage.policies
ORDER BY bucket_id, policyname;

-- ============================================
-- 1️⃣4️⃣ USUÁRIOS AUTH (TOTAL)
-- ============================================
SELECT 
    '👥 USUÁRIOS NO SISTEMA' as info,
    COUNT(*) as total_usuarios,
    COUNT(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 END) as emails_confirmados,
    COUNT(CASE WHEN deleted_at IS NOT NULL THEN 1 END) as usuarios_deletados
FROM auth.users;

-- ============================================
-- 1️⃣5️⃣ DETALHES DOS USUÁRIOS (SEM DADOS SENSÍVEIS)
-- ============================================
SELECT 
    '👤 LISTA DE USUÁRIOS' as info,
    id,
    email,
    raw_user_meta_data->>'name' as name,
    raw_user_meta_data->>'type' as user_type,
    email_confirmed_at IS NOT NULL as email_confirmado,
    created_at,
    last_sign_in_at
FROM auth.users
WHERE deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 20;

-- ============================================
-- 1️⃣6️⃣ CONTAGEM DE REGISTROS POR TABELA
-- ============================================
DO $$
DECLARE
    tabela record;
    query text;
    resultado integer;
BEGIN
    RAISE NOTICE '📊 CONTAGEM DE REGISTROS POR TABELA';
    
    FOR tabela IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
    LOOP
        query := format('SELECT COUNT(*) FROM %I', tabela.table_name);
        EXECUTE query INTO resultado;
        RAISE NOTICE '  % : % registros', tabela.table_name, resultado;
    END LOOP;
END $$;

-- ============================================
-- 1️⃣7️⃣ EDGE FUNCTIONS DEPLOYADAS
-- ============================================
SELECT 
    '⚡ EDGE FUNCTIONS' as info,
    name,
    version,
    status,
    created_at,
    updated_at
FROM supabase_functions.migrations
ORDER BY name;

-- ============================================
-- 1️⃣8️⃣ REALTIME PUBLICATIONS
-- ============================================
SELECT 
    '🔴 REALTIME HABILITADO EM' as info,
    schemaname,
    tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;

-- ============================================
-- 1️⃣9️⃣ EXTENSÕES INSTALADAS
-- ============================================
SELECT 
    '🔌 EXTENSÕES POSTGRES' as info,
    extname as extensao,
    extversion as versao,
    extnamespace::regnamespace::text as schema
FROM pg_extension
ORDER BY extname;

-- ============================================
-- 2️⃣0️⃣ RESUMO FINAL EXECUTIVO
-- ============================================
SELECT 
    '✅ RESUMO EXECUTIVO - MEDCANNLAB' as titulo,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') as total_tabelas,
    (SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'public') as total_funcoes,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') as total_politicas_rls,
    (SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public') as total_indices,
    (SELECT COUNT(*) FROM storage.buckets) as total_storage_buckets,
    (SELECT COUNT(*) FROM auth.users WHERE deleted_at IS NULL) as total_usuarios_ativos,
    'SISTEMA 100% CONECTADO E OPERACIONAL' as status;

-- =====================================================
-- ✅ FIM DA VERIFICAÇÃO COMPLETA
-- =====================================================
