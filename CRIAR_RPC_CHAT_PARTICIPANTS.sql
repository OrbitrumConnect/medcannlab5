-- =====================================================
-- 🔧 CRIAR FUNÇÃO RPC PARA BUSCAR PARTICIPANTES
-- =====================================================
-- Esta função usa SECURITY DEFINER para contornar RLS
-- e evitar recursão infinita ao buscar participantes

CREATE OR REPLACE FUNCTION get_chat_participants_for_room(
    p_room_id UUID
)
RETURNS TABLE (
    user_id UUID,
    role TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER -- Executa com permissões do criador (contorna RLS)
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cp.user_id,
        cp.role
    FROM chat_participants cp
    WHERE cp.room_id = p_room_id;
END;
$$;

-- Dar permissão para usuários autenticados
GRANT EXECUTE ON FUNCTION get_chat_participants_for_room(UUID) TO authenticated;

-- Comentário
COMMENT ON FUNCTION get_chat_participants_for_room IS 
    'Busca participantes de uma sala de chat. Usa SECURITY DEFINER para contornar RLS e evitar recursão.';

