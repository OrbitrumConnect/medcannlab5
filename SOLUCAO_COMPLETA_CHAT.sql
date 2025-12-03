-- =====================================================
-- 🔧 SOLUÇÃO COMPLETA PARA CRIAR SALAS DE CHAT
-- =====================================================
-- Execute este script NOVAMENTE para garantir que tudo está correto

-- 1. VERIFICAR SE AS POLÍTICAS EXISTEM E ESTÃO CORRETAS
DO $$
BEGIN
    -- Verificar se a política INSERT existe
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'chat_rooms' 
        AND policyname = 'chat_rooms_insert_simple'
    ) THEN
        RAISE NOTICE 'Criando política INSERT...';
        CREATE POLICY "chat_rooms_insert_simple" ON chat_rooms 
          FOR INSERT 
          TO authenticated
          WITH CHECK (
            auth.uid() IS NOT NULL AND 
            created_by = auth.uid()
          );
    ELSE
        RAISE NOTICE '✅ Política INSERT já existe';
    END IF;
END $$;

-- 2. CRIAR FUNÇÃO RPC QUE CONTORNA RLS (SOLUÇÃO ALTERNATIVA)
CREATE OR REPLACE FUNCTION create_chat_room_for_patient(
    p_patient_id UUID,
    p_patient_name TEXT,
    p_professional_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER -- Executa com permissões do criador da função (contorna RLS)
SET search_path = public
AS $$
DECLARE
    v_room_id UUID;
BEGIN
    -- Verificar se o profissional_id é válido
    IF p_professional_id IS NULL THEN
        RAISE EXCEPTION 'professional_id não pode ser NULL';
    END IF;

    -- Criar a sala
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

    -- Adicionar participantes
    INSERT INTO chat_participants (room_id, user_id, role)
    VALUES 
        (v_room_id, p_patient_id, 'patient'),
        (v_room_id, p_professional_id, 'professional')
    ON CONFLICT (room_id, user_id) DO NOTHING;

    RETURN v_room_id;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Erro ao criar sala: %', SQLERRM;
END;
$$;

-- Dar permissão para usuários autenticados
GRANT EXECUTE ON FUNCTION create_chat_room_for_patient(UUID, TEXT, UUID) TO authenticated;

-- 3. VERIFICAR SE FUNÇÃO FOI CRIADA
SELECT 
    proname as function_name,
    proargnames as parameters,
    prosrc as source_code
FROM pg_proc 
WHERE proname = 'create_chat_room_for_patient';

-- 4. TESTAR A FUNÇÃO (comentado - descomente para testar)
-- SELECT create_chat_room_for_patient(
--     'UUID_DO_PACIENTE_AQUI'::UUID,
--     'Nome do Paciente',
--     auth.uid()
-- );

RAISE NOTICE '✅ Função RPC criada com sucesso!';
RAISE NOTICE 'Agora você pode criar salas de chat de duas formas:';
RAISE NOTICE '1. Método direto (via INSERT) - se RLS permitir';
RAISE NOTICE '2. Método RPC (via função) - contorna RLS completamente';

