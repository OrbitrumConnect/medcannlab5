-- =====================================================
-- 🔧 CORREÇÃO: FOREIGN KEY CHAT_PARTICIPANTS
-- =====================================================
-- Este script corrige o problema de foreign key constraint
-- quando tenta criar um canal de chat para um paciente
-- 
-- Problema: chat_participants.user_id pode estar referenciando
-- auth.users, mas o paciente pode estar apenas em users
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '🔧 Iniciando correção de foreign key para chat_participants...';
END $$;

-- =====================================================
-- 1. VERIFICAR ESTRUTURA ATUAL DA TABELA
-- =====================================================
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'chat_participants'
  AND kcu.column_name = 'user_id';

-- =====================================================
-- 2. REMOVER FOREIGN KEY ANTIGA SE EXISTIR
-- =====================================================
DO $$
BEGIN
    -- Remover constraint se referenciar auth.users
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'chat_participants_user_id_fkey'
        AND table_name = 'chat_participants'
    ) THEN
        ALTER TABLE chat_participants 
        DROP CONSTRAINT IF EXISTS chat_participants_user_id_fkey;
        RAISE NOTICE '✅ Foreign key antiga removida';
    END IF;
END $$;

-- =====================================================
-- 3. CRIAR FOREIGN KEY CORRETA REFERENCIANDO users (não auth.users)
-- =====================================================
-- IMPORTANTE: chat_participants deve referenciar users.id, não auth.users.id
-- porque os pacientes estão na tabela users, não necessariamente em auth.users

DO $$
BEGIN
    -- Verificar se a tabela users existe
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        -- Criar foreign key referenciando users.id
        ALTER TABLE chat_participants
        ADD CONSTRAINT chat_participants_user_id_fkey
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE;
        
        RAISE NOTICE '✅ Foreign key criada referenciando users.id';
    ELSE
        RAISE WARNING '⚠️ Tabela users não encontrada. Verifique se ela existe.';
    END IF;
END $$;

-- =====================================================
-- 4. VERIFICAR SE O PACIENTE "JOÃO EDUARDO VIDAL" EXISTE
-- =====================================================
DO $$
DECLARE
    v_patient_id UUID;
    v_patient_name TEXT;
BEGIN
    -- Buscar paciente por nome (case insensitive)
    SELECT id, name INTO v_patient_id, v_patient_name
    FROM users
    WHERE LOWER(name) LIKE '%joão eduardo vidal%'
       OR LOWER(name) LIKE '%joao eduardo vidal%'
    LIMIT 1;
    
    IF v_patient_id IS NOT NULL THEN
        RAISE NOTICE '✅ Paciente encontrado: % (ID: %)', v_patient_name, v_patient_id;
    ELSE
        RAISE WARNING '⚠️ Paciente "João Eduardo Vidal" não encontrado na tabela users.';
        RAISE NOTICE '📋 Listando todos os pacientes disponíveis:';
        
        -- Listar todos os pacientes
        FOR v_patient_name IN 
            SELECT name FROM users WHERE type = 'patient' ORDER BY name
        LOOP
            RAISE NOTICE '   - %', v_patient_name;
        END LOOP;
    END IF;
END $$;

-- =====================================================
-- 5. ATUALIZAR FUNÇÃO RPC PARA GARANTIR QUE USER_ID EXISTE
-- =====================================================
CREATE OR REPLACE FUNCTION create_chat_room_for_patient(
    p_patient_id UUID,
    p_patient_name TEXT,
    p_professional_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_room_id UUID;
    v_patient_exists BOOLEAN;
    v_professional_exists BOOLEAN;
BEGIN
    -- Validar parâmetros
    IF p_professional_id IS NULL THEN
        RAISE EXCEPTION 'professional_id não pode ser NULL';
    END IF;
    
    IF p_patient_id IS NULL THEN
        RAISE EXCEPTION 'patient_id não pode ser NULL';
    END IF;

    -- Verificar se o paciente existe na tabela users
    SELECT EXISTS(SELECT 1 FROM users WHERE id = p_patient_id) INTO v_patient_exists;
    IF NOT v_patient_exists THEN
        RAISE EXCEPTION 'Paciente com ID % não encontrado na tabela users. Verifique se o paciente está cadastrado.', p_patient_id;
    END IF;

    -- Verificar se o profissional existe na tabela users
    SELECT EXISTS(SELECT 1 FROM users WHERE id = p_professional_id) INTO v_professional_exists;
    IF NOT v_professional_exists THEN
        RAISE EXCEPTION 'Profissional com ID % não encontrado na tabela users.', p_professional_id;
    END IF;

    -- Criar a sala (contorna RLS porque usa SECURITY DEFINER)
    INSERT INTO chat_rooms (
        name,
        type,
        created_by
    ) VALUES (
        'Canal de cuidado • ' || COALESCE(p_patient_name, 'Paciente'),
        'patient',
        p_professional_id
    )
    RETURNING id INTO v_room_id;

    -- Adicionar participantes (também contorna RLS)
    -- IMPORTANTE: Agora garantimos que ambos os user_ids existem
    INSERT INTO chat_participants (room_id, user_id, role)
    VALUES 
        (v_room_id, p_patient_id, 'patient'),
        (v_room_id, p_professional_id, 'professional')
    ON CONFLICT (room_id, user_id) DO NOTHING;

    RETURN v_room_id;
EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE EXCEPTION 'Erro de foreign key: Verifique se os IDs do paciente (%) e profissional (%) existem na tabela users.', p_patient_id, p_professional_id;
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Erro ao criar sala: %', SQLERRM;
END;
$$;

-- Dar permissão para usuários autenticados
GRANT EXECUTE ON FUNCTION create_chat_room_for_patient(UUID, TEXT, UUID) TO authenticated;

-- =====================================================
-- 6. VERIFICAÇÃO FINAL
-- =====================================================
DO $$
BEGIN
    -- Verificar foreign key
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'chat_participants_user_id_fkey'
        AND table_name = 'chat_participants'
    ) THEN
        RAISE NOTICE '✅ Foreign key chat_participants_user_id_fkey está configurada corretamente';
    ELSE
        RAISE WARNING '⚠️ Foreign key não foi criada. Verifique os erros acima.';
    END IF;
    
    -- Verificar função RPC
    IF EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'create_chat_room_for_patient'
    ) THEN
        RAISE NOTICE '✅ Função RPC atualizada com validação de user_id';
    ELSE
        RAISE WARNING '⚠️ Função RPC não foi criada';
    END IF;
    
    RAISE NOTICE '✅ Correção completa! Agora você pode criar salas de chat sem erro de foreign key.';
    RAISE NOTICE '📋 IMPORTANTE: Certifique-se de que o paciente está cadastrado na tabela users antes de criar o canal.';
END $$;

-- Mostrar estrutura final
SELECT 
    'chat_participants' as tabela,
    constraint_name,
    table_name,
    column_name,
    foreign_table_name,
    foreign_column_name
FROM (
    SELECT 
        tc.constraint_name, 
        tc.table_name, 
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
    FROM information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY' 
      AND tc.table_name = 'chat_participants'
) AS fk_info;

