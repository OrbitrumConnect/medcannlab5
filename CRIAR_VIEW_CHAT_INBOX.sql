-- =====================================================
-- CRIAR VIEW v_chat_inbox
-- =====================================================
-- View para listar salas de chat do usuário com informações de última mensagem e contagem de não lidas

-- Remover view se existir
DROP VIEW IF EXISTS v_chat_inbox CASCADE;

-- Criar função RPC para buscar inbox do usuário
-- Views não podem usar auth.uid() diretamente, então usamos uma função RPC
CREATE OR REPLACE FUNCTION get_chat_inbox()
RETURNS TABLE (
  id UUID,
  name TEXT,
  type TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  last_message_at TIMESTAMP WITH TIME ZONE,
  unread_count INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    r.id,
    r.name,
    r.type,
    r.created_by,
    r.created_at,
    (
      SELECT MAX(created_at)
      FROM chat_messages
      WHERE room_id = r.id
    ) AS last_message_at,
    COALESCE((
      SELECT COUNT(*)
      FROM chat_messages m
      WHERE m.room_id = r.id
        AND m.sender_id != auth.uid()
        AND (m.read_at IS NULL OR m.read_at > COALESCE((
          SELECT MAX(created_at)
          FROM chat_messages
          WHERE room_id = r.id
            AND sender_id = auth.uid()
        ), '1970-01-01'::timestamp))
    ), 0)::INTEGER AS unread_count
  FROM chat_rooms r
  INNER JOIN chat_participants cp ON cp.room_id = r.id
  WHERE cp.user_id = auth.uid()
  ORDER BY last_message_at DESC NULLS LAST, r.created_at DESC;
END;
$$;

-- Criar view v_chat_inbox que chama a função RPC
-- A view será uma wrapper que chama a função
CREATE OR REPLACE VIEW v_chat_inbox AS
SELECT * FROM get_chat_inbox();

-- Garantir permissões
GRANT EXECUTE ON FUNCTION get_chat_inbox() TO authenticated;
GRANT SELECT ON v_chat_inbox TO authenticated;

-- Comentário na view
COMMENT ON VIEW v_chat_inbox IS 
  'View que lista todas as salas de chat onde o usuário autenticado é participante, com última mensagem e contagem de não lidas';

-- Garantir que a view seja acessível (sem RLS na view, mas as tabelas subjacentes têm RLS)
GRANT SELECT ON v_chat_inbox TO authenticated;

