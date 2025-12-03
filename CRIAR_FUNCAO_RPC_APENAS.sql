-- =====================================================
-- 🔧 CRIAR APENAS A FUNÇÃO RPC (SEM TOCAR NAS POLÍTICAS)
-- =====================================================
-- Execute este script se as políticas já existem mas ainda há erro

-- Criar ou substituir função RPC que contorna RLS
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
    -- Verificar se o professional_id é válido
    IF p_professional_id IS NULL THEN
        RAISE EXCEPTION 'professional_id não pode ser NULL';
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

-- Verificar se função foi criada
SELECT 
    proname as function_name,
    proargnames as parameters
FROM pg_proc 
WHERE proname = 'create_chat_room_for_patient';

