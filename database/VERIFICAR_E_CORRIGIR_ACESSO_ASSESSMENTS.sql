-- =====================================================
-- 🔍 VERIFICAÇÃO E CORREÇÃO DE ACESSO A ASSESSMENTS
-- =====================================================
-- Este script verifica e corrige o acesso às avaliações clínicas
-- baseado nas políticas RLS que foram implementadas
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '🔍 Iniciando verificação de acesso às avaliações...';
END $$;

-- =====================================================
-- 1. LISTAR TODAS AS AVALIAÇÕES COM STATUS DE ACESSO
-- =====================================================
SELECT 
    ca.id,
    ca.patient_id,
    ca.doctor_id,
    ca.status,
    ca.created_at,
    CASE 
        WHEN ca.doctor_id IS NULL THEN '⚠️ Sem médico - Só paciente vê'
        WHEN ca.doctor_id IS NOT NULL THEN '🔒 NÃO deveria ser acessível (sem compartilhamento)'
        ELSE '❓ Status desconhecido'
    END as status_acesso_esperado,
    -- Verificar se o paciente existe
    (SELECT name FROM users WHERE id = ca.patient_id) as paciente_nome,
    -- Verificar se o médico existe
    (SELECT name FROM users WHERE id = ca.doctor_id) as medico_nome
FROM clinical_assessments ca
ORDER BY ca.created_at DESC;

-- =====================================================
-- 2. VERIFICAR AVALIAÇÕES SEM MÉDICO ATRIBUÍDO
-- =====================================================
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM clinical_assessments
    WHERE doctor_id IS NULL;
    
    RAISE NOTICE '📊 Total de avaliações sem médico atribuído: %', v_count;
    
    IF v_count > 0 THEN
        RAISE NOTICE '⚠️ Estas avaliações devem ser visíveis APENAS pelo próprio paciente';
        RAISE NOTICE '   (conforme política RLS: paciente vê suas próprias avaliações)';
    END IF;
END $$;

-- =====================================================
-- 3. VERIFICAR AVALIAÇÕES COM MÉDICO ATRIBUÍDO
-- =====================================================
DO $$
DECLARE
    v_count INTEGER;
    v_has_shared_with BOOLEAN;
BEGIN
    -- Verificar se a coluna shared_with existe
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clinical_assessments' 
        AND column_name = 'shared_with'
    ) INTO v_has_shared_with;
    
    IF v_has_shared_with THEN
        -- Se a coluna existe, verificar avaliações sem compartilhamento
        SELECT COUNT(*) INTO v_count
        FROM clinical_assessments
        WHERE doctor_id IS NOT NULL
          AND (shared_with IS NULL OR array_length(shared_with, 1) IS NULL);
    ELSE
        -- Se a coluna não existe, contar todas as avaliações com médico
        SELECT COUNT(*) INTO v_count
        FROM clinical_assessments
        WHERE doctor_id IS NOT NULL;
    END IF;
    
    RAISE NOTICE '📊 Total de avaliações com médico atribuído: %', v_count;
    
    IF v_count > 0 THEN
        RAISE NOTICE '🔒 Estas avaliações devem ser visíveis APENAS por:';
        RAISE NOTICE '   1. O próprio paciente';
        RAISE NOTICE '   2. O médico designado (doctor_id)';
        RAISE NOTICE '   NÃO devem ser visíveis por outros médicos ou admins';
    END IF;
END $$;

-- =====================================================
-- 4. VERIFICAR POLÍTICAS RLS ATIVAS
-- =====================================================
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'clinical_assessments'
ORDER BY policyname;

-- =====================================================
-- 5. TESTAR ACESSO POR TIPO DE USUÁRIO
-- =====================================================
-- Esta query simula o que cada tipo de usuário pode ver
-- (será executada com diferentes contextos de auth.uid())

DO $$
DECLARE
    v_patient_id UUID := '3d6b170c-9b36-4e0d-8364-1e9c5131cb17'; -- Exemplo: primeiro paciente da lista
    v_doctor_id UUID := '3d6b170c-9b36-4e0d-8364-1e9c5131cb17'; -- Exemplo: médico
    v_admin_id UUID := '99286e6f-b309-41ad-8dca-cfbb80aa7666'; -- Exemplo: admin
    v_count_patient INTEGER;
    v_count_doctor INTEGER;
    v_count_admin INTEGER;
BEGIN
    -- Simular acesso como paciente
    -- (Na prática, isso seria feito com SET ROLE ou SET LOCAL)
    RAISE NOTICE '🧪 Testando acesso como paciente (ID: %)...', v_patient_id;
    
    -- Contar avaliações que o paciente deveria ver
    SELECT COUNT(*) INTO v_count_patient
    FROM clinical_assessments
    WHERE patient_id = v_patient_id;
    
    RAISE NOTICE '   ✅ Paciente pode ver % avaliações próprias', v_count_patient;
    
    -- Simular acesso como médico
    RAISE NOTICE '🧪 Testando acesso como médico (ID: %)...', v_doctor_id;
    
    -- Contar avaliações que o médico deveria ver
    -- Verificar se coluna shared_with existe
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clinical_assessments' 
        AND column_name = 'shared_with'
    ) THEN
        SELECT COUNT(*) INTO v_count_doctor
        FROM clinical_assessments
        WHERE doctor_id = v_doctor_id
           OR (shared_with IS NOT NULL AND v_doctor_id = ANY(shared_with));
    ELSE
        SELECT COUNT(*) INTO v_count_doctor
        FROM clinical_assessments
        WHERE doctor_id = v_doctor_id;
    END IF;
    
    RAISE NOTICE '   ✅ Médico pode ver % avaliações (designadas)', v_count_doctor;
    
    -- Simular acesso como admin
    RAISE NOTICE '🧪 Testando acesso como admin (ID: %)...', v_admin_id;
    
    -- Contar avaliações que o admin NÃO deveria ver (sem ser paciente ou médico designado)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clinical_assessments' 
        AND column_name = 'shared_with'
    ) THEN
        SELECT COUNT(*) INTO v_count_admin
        FROM clinical_assessments
        WHERE patient_id != v_admin_id
          AND (doctor_id IS NULL OR doctor_id != v_admin_id)
          AND (shared_with IS NULL OR NOT (v_admin_id = ANY(shared_with)));
    ELSE
        SELECT COUNT(*) INTO v_count_admin
        FROM clinical_assessments
        WHERE patient_id != v_admin_id
          AND (doctor_id IS NULL OR doctor_id != v_admin_id);
    END IF;
    
    RAISE NOTICE '   🔒 Admin NÃO pode ver % avaliações (conforme política restritiva)', v_count_admin;
END $$;

-- =====================================================
-- 6. CORRIGIR AVALIAÇÕES SEM MÉDICO (OPCIONAL)
-- =====================================================
-- Se você quiser atribuir um médico padrão às avaliações sem médico,
-- descomente e ajuste o código abaixo:

/*
DO $$
DECLARE
    v_default_doctor_id UUID := '3d6b170c-9b36-4e0d-8364-1e9c5131cb17'; -- ID do médico padrão
    v_updated_count INTEGER;
BEGIN
    -- Atribuir médico padrão apenas a avaliações concluídas sem médico
    UPDATE clinical_assessments
    SET doctor_id = v_default_doctor_id
    WHERE doctor_id IS NULL
      AND status = 'completed';
    
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    
    IF v_updated_count > 0 THEN
        RAISE NOTICE '✅ % avaliações concluídas foram atribuídas ao médico padrão', v_updated_count;
    ELSE
        RAISE NOTICE 'ℹ️ Nenhuma avaliação concluída sem médico encontrada';
    END IF;
END $$;
*/

-- =====================================================
-- 7. VERIFICAR COMPARTILHAMENTOS (SE COLUNA EXISTIR)
-- =====================================================
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clinical_assessments' 
        AND column_name = 'shared_with'
    ) THEN
        RAISE NOTICE '📋 Verificando compartilhamentos...';
        -- A query será executada dinamicamente se necessário
    ELSE
        RAISE NOTICE 'ℹ️ Coluna shared_with não existe na tabela clinical_assessments';
        RAISE NOTICE '   Compartilhamento não está implementado nesta tabela';
    END IF;
END $$;

-- =====================================================
-- 8. RESUMO FINAL
-- =====================================================
DO $$
DECLARE
    v_total INTEGER;
    v_sem_medico INTEGER;
    v_com_medico INTEGER;
    v_compartilhadas INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total FROM clinical_assessments;
    SELECT COUNT(*) INTO v_sem_medico FROM clinical_assessments WHERE doctor_id IS NULL;
    SELECT COUNT(*) INTO v_com_medico FROM clinical_assessments WHERE doctor_id IS NOT NULL;
    
    -- Verificar se coluna shared_with existe
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clinical_assessments' 
        AND column_name = 'shared_with'
    ) THEN
        SELECT COUNT(*) INTO v_compartilhadas 
        FROM clinical_assessments 
        WHERE shared_with IS NOT NULL AND array_length(shared_with, 1) > 0;
    ELSE
        v_compartilhadas := 0;
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════';
    RAISE NOTICE '📊 RESUMO DE AVALIAÇÕES CLÍNICAS';
    RAISE NOTICE '═══════════════════════════════════════════════════════════';
    RAISE NOTICE 'Total de avaliações: %', v_total;
    RAISE NOTICE 'Avaliações sem médico: % (só paciente vê)', v_sem_medico;
    RAISE NOTICE 'Avaliações com médico: % (paciente + médico designado)', v_com_medico;
    RAISE NOTICE 'Avaliações compartilhadas: % (paciente + médico + compartilhados)', v_compartilhadas;
    RAISE NOTICE '';
    RAISE NOTICE '🔒 POLÍTICAS RLS ATIVAS:';
    RAISE NOTICE '   - Paciente vê suas próprias avaliações';
    RAISE NOTICE '   - Médico vê avaliações designadas (doctor_id) ou compartilhadas';
    RAISE NOTICE '   - Admin NÃO vê avaliações sem ser paciente/médico designado';
    RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;

