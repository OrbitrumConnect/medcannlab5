-- =====================================================
-- 🔧 FUNÇÃO RPC PARA CRIAR SALA DE CHAT
-- =====================================================
-- Esta função usa SECURITY DEFINER para contornar RLS
-- Execute este script APÓS executar CORRIGIR_RLS_CHAT_SIMPLES.sql

CREATE OR REPLACE FUNCTION create_chat_room_for_patient(
    p_patient_id UUID,
    p_patient_name TEXT,
    p_professional_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER -- Importante: executa com permissões do criador da função
AS $$
DECLARE
    v_room_id UUID;
BEGIN
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
END;
$$;

-- Dar permissão para usuários autenticados usarem a função
GRANT EXECUTE ON FUNCTION create_chat_room_for_patient(UUID, TEXT, UUID) TO authenticated;

-- Comentário
COMMENT ON FUNCTION create_chat_room_for_patient IS 
    'Cria uma sala de chat para um paciente e adiciona o profissional como participante. Usa SECURITY DEFINER para contornar RLS.';

