-- =====================================================
-- VERIFICAÇÃO PÓS-MIGRAÇÃO - MEDCANLAB 3.0
-- =====================================================
-- Execute este script DEPOIS das migrações para verificar se tudo foi criado corretamente
-- Data: Janeiro 2025

-- =====================================================
-- 1. VERIFICAR TODAS AS TABELAS CRIADAS
-- =====================================================
SELECT 
    table_name,
    CASE 
        WHEN table_name LIKE 'imre%' THEN '✅ IMRE'
        WHEN table_name = 'notifications' THEN '✅ Notificações'
        ELSE '✅ Outra'
    END as categoria
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (
    table_name LIKE 'imre%' 
    OR table_name = 'notifications'
    OR table_name = 'clinical_integration'
    OR table_name = 'noa_interaction_logs'
)
ORDER BY table_name;

-- =====================================================
-- 2. VERIFICAR ESTRUTURA DAS TABELAS PRINCIPAIS
-- =====================================================

-- Estrutura de imre_assessments
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'imre_assessments'
ORDER BY ordinal_position;

-- Estrutura de notifications
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'notifications'
ORDER BY ordinal_position;

-- =====================================================
-- 3. VERIFICAR RLS (ROW LEVEL SECURITY)
-- =====================================================
SELECT 
    tablename,
    CASE 
        WHEN rowsecurity THEN '✅ Habilitado'
        ELSE '❌ Desabilitado'
    END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'imre_assessments',
    'imre_semantic_blocks',
    'imre_semantic_context',
    'noa_interaction_logs',
    'clinical_integration',
    'notifications'
)
ORDER BY tablename;

-- =====================================================
-- 4. VERIFICAR POLÍTICAS RLS
-- =====================================================
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
AND tablename IN (
    'imre_assessments',
    'imre_semantic_blocks',
    'imre_semantic_context',
    'noa_interaction_logs',
    'clinical_integration',
    'notifications'
)
ORDER BY tablename, policyname;

-- =====================================================
-- 5. VERIFICAR ÍNDICES
-- =====================================================
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN (
    'imre_assessments',
    'imre_semantic_blocks',
    'imre_semantic_context',
    'noa_interaction_logs',
    'clinical_integration',
    'notifications'
)
ORDER BY tablename, indexname;

-- =====================================================
-- 6. VERIFICAR FUNÇÕES AUXILIARES
-- =====================================================
SELECT 
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
    'calculate_semantic_stability',
    'get_latest_semantic_context',
    'get_unread_notifications_count',
    'mark_all_notifications_read'
)
ORDER BY routine_name;

-- =====================================================
-- 7. VERIFICAR VIEWS
-- =====================================================
SELECT 
    table_name as view_name,
    view_definition
FROM information_schema.views
WHERE table_schema = 'public'
AND table_name IN (
    'imre_user_summary',
    'clinical_correlations'
)
ORDER BY table_name;

-- =====================================================
-- 8. TESTE DE INSERÇÃO (OPCIONAL - PODE SER REMOVIDO DEPOIS)
-- =====================================================
DO $$
DECLARE
    test_user_id UUID;
    test_assessment_id UUID;
    test_notification_id UUID;
BEGIN
    -- Buscar um usuário de teste (se existir)
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    IF test_user_id IS NULL THEN
        RAISE NOTICE '⚠️ Nenhum usuário encontrado para teste';
        RETURN;
    END IF;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'TESTE DE INSERÇÃO:';
    RAISE NOTICE '========================================';
    
    -- Testar inserção em imre_assessments
    BEGIN
        INSERT INTO imre_assessments (
            user_id,
            assessment_type,
            triaxial_data,
            semantic_context,
            completion_status
        ) VALUES (
            test_user_id,
            'triaxial',
            '{"test": true}'::jsonb,
            '{"test": true}'::jsonb,
            'completed'
        ) RETURNING id INTO test_assessment_id;
        
        RAISE NOTICE '✅ imre_assessments: Inserção OK (ID: %)', test_assessment_id;
        
        -- Limpar teste
        DELETE FROM imre_assessments WHERE id = test_assessment_id;
        RAISE NOTICE '   Registro de teste removido';
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ imre_assessments: Erro na inserção - %', SQLERRM;
    END;
    
    -- Testar inserção em notifications
    BEGIN
        INSERT INTO notifications (
            user_id,
            title,
            message,
            type,
            priority
        ) VALUES (
            test_user_id,
            'Teste de Notificação',
            'Esta é uma notificação de teste',
            'info',
            'normal'
        ) RETURNING id INTO test_notification_id;
        
        RAISE NOTICE '✅ notifications: Inserção OK (ID: %)', test_notification_id;
        
        -- Limpar teste
        DELETE FROM notifications WHERE id = test_notification_id;
        RAISE NOTICE '   Registro de teste removido';
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ notifications: Erro na inserção - %', SQLERRM;
    END;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ TESTES CONCLUÍDOS';
    RAISE NOTICE '========================================';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Erro geral nos testes: %', SQLERRM;
END $$;

-- =====================================================
-- RESUMO FINAL
-- =====================================================
DO $$
DECLARE
    total_tables INTEGER;
    total_policies INTEGER;
    total_indexes INTEGER;
    total_functions INTEGER;
BEGIN
    -- Contar tabelas
    SELECT COUNT(*) INTO total_tables
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND (
        table_name LIKE 'imre%' 
        OR table_name = 'notifications'
        OR table_name = 'clinical_integration'
        OR table_name = 'noa_interaction_logs'
    );
    
    -- Contar políticas RLS
    SELECT COUNT(*) INTO total_policies
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename IN (
        'imre_assessments',
        'imre_semantic_blocks',
        'imre_semantic_context',
        'noa_interaction_logs',
        'clinical_integration',
        'notifications'
    );
    
    -- Contar índices
    SELECT COUNT(*) INTO total_indexes
    FROM pg_indexes
    WHERE schemaname = 'public'
    AND tablename IN (
        'imre_assessments',
        'imre_semantic_blocks',
        'imre_semantic_context',
        'noa_interaction_logs',
        'clinical_integration',
        'notifications'
    );
    
    -- Contar funções
    SELECT COUNT(*) INTO total_functions
    FROM information_schema.routines
    WHERE routine_schema = 'public'
    AND routine_name IN (
        'calculate_semantic_stability',
        'get_latest_semantic_context',
        'get_unread_notifications_count',
        'mark_all_notifications_read'
    );
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RESUMO DA MIGRAÇÃO:';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Tabelas criadas: %', total_tables;
    RAISE NOTICE 'Políticas RLS: %', total_policies;
    RAISE NOTICE 'Índices criados: %', total_indexes;
    RAISE NOTICE 'Funções criadas: %', total_functions;
    RAISE NOTICE '========================================';
    
    IF total_tables >= 5 AND total_policies > 0 THEN
        RAISE NOTICE '✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!';
    ELSE
        RAISE NOTICE '⚠️ VERIFIQUE OS RESULTADOS ACIMA';
    END IF;
    
    RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- FIM DA VERIFICAÇÃO
-- =====================================================

