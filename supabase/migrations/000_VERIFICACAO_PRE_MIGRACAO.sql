-- =====================================================
-- VERIFICAÇÃO PRÉ-MIGRAÇÃO - MEDCANLAB 3.0
-- =====================================================
-- Execute este script ANTES das migrações para verificar o estado atual
-- Data: Janeiro 2025

-- =====================================================
-- 1. VERIFICAR TABELAS EXISTENTES
-- =====================================================
SELECT 
    table_name,
    table_type
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
-- 2. VERIFICAR SE TABELAS JÁ EXISTEM
-- =====================================================
DO $$
DECLARE
    imre_exists BOOLEAN;
    notifications_exists BOOLEAN;
BEGIN
    -- Verificar imre_assessments
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'imre_assessments'
    ) INTO imre_exists;
    
    -- Verificar notifications
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'notifications'
    ) INTO notifications_exists;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'STATUS DAS TABELAS:';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'imre_assessments: %', CASE WHEN imre_exists THEN '✅ EXISTE' ELSE '❌ NÃO EXISTE' END;
    RAISE NOTICE 'notifications: %', CASE WHEN notifications_exists THEN '✅ EXISTE' ELSE '❌ NÃO EXISTE' END;
    RAISE NOTICE '========================================';
    
    IF imre_exists THEN
        RAISE NOTICE '⚠️ ATENÇÃO: Tabelas IMRE já existem!';
        RAISE NOTICE '   Se quiser recriar, execute DROP TABLE antes das migrações.';
    END IF;
    
    IF notifications_exists THEN
        RAISE NOTICE '⚠️ ATENÇÃO: Tabela notifications já existe!';
        RAISE NOTICE '   Se quiser recriar, execute DROP TABLE antes das migrações.';
    END IF;
END $$;

-- =====================================================
-- 3. VERIFICAR RLS (ROW LEVEL SECURITY)
-- =====================================================
SELECT 
    tablename,
    rowsecurity as rls_enabled
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
-- 4. CONTAR REGISTROS EXISTENTES (se tabelas existirem)
-- =====================================================
DO $$
DECLARE
    count_imre INTEGER := 0;
    count_notifications INTEGER := 0;
BEGIN
    -- Tentar contar imre_assessments
    BEGIN
        EXECUTE 'SELECT COUNT(*) FROM imre_assessments' INTO count_imre;
    EXCEPTION WHEN OTHERS THEN
        count_imre := -1;
    END;
    
    -- Tentar contar notifications
    BEGIN
        EXECUTE 'SELECT COUNT(*) FROM notifications' INTO count_notifications;
    EXCEPTION WHEN OTHERS THEN
        count_notifications := -1;
    END;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'REGISTROS EXISTENTES:';
    RAISE NOTICE '========================================';
    IF count_imre >= 0 THEN
        RAISE NOTICE 'imre_assessments: % registros', count_imre;
    ELSE
        RAISE NOTICE 'imre_assessments: Tabela não existe';
    END IF;
    
    IF count_notifications >= 0 THEN
        RAISE NOTICE 'notifications: % registros', count_notifications;
    ELSE
        RAISE NOTICE 'notifications: Tabela não existe';
    END IF;
    RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- RESULTADO ESPERADO (se tabelas não existem):
-- =====================================================
-- ✅ Nenhuma tabela encontrada = Pronto para migração
-- ⚠️ Tabelas existem = Decidir se recria ou atualiza
-- =====================================================

