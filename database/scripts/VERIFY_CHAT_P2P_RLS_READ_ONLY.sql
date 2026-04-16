-- =============================================================================
-- VERIFICAÇÃO (SÓ LEITURA) — Chat P2P: RLS, participantes, função membro
-- Colar no SQL Editor do Supabase (projeto canónico). Não altera dados.
-- Base: migrations + database/scripts/FIX_CHAT_RLS_RECURSION_* (fev/2026)
-- =============================================================================

-- 1) Políticas atuais em chat_messages (INSERT deve exigir sender_id = auth.uid()
--    e is_chat_room_member(room_id, auth.uid()))
SELECT policyname, cmd, with_check AS with_check_expression
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'chat_messages'
ORDER BY cmd, policyname;

-- 2) RLS ligado?
SELECT tablename, rowsecurity AS rls_on
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('chat_messages', 'chat_participants', 'chat_rooms');

-- 3) Salas sem o created_by como participante (causa típica de INSERT bloqueado)
SELECT cr.id AS room_id, cr.name, cr.created_by,
       (SELECT COUNT(*) FROM chat_participants cp WHERE cp.room_id = cr.id) AS n_participants
FROM chat_rooms cr
WHERE cr.created_by IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM chat_participants cp
    WHERE cp.room_id = cr.id AND cp.user_id = cr.created_by
  )
ORDER BY cr.created_at DESC NULLS LAST
LIMIT 50;

-- 4) Salas com participantes mas 0 mensagens (amostra)
SELECT cr.id AS room_id,
       (SELECT COUNT(*) FROM chat_participants cp WHERE cp.room_id = cr.id) AS participants,
       (SELECT COUNT(*) FROM chat_messages cm WHERE cm.room_id = cr.id) AS messages
FROM chat_rooms cr
WHERE EXISTS (SELECT 1 FROM chat_participants cp WHERE cp.room_id = cr.id)
  AND NOT EXISTS (SELECT 1 FROM chat_messages cm WHERE cm.room_id = cr.id)
ORDER BY cr.created_at DESC NULLS LAST
LIMIT 30;

-- 5) Função helper existe e é SECURITY DEFINER? (esperado para evitar recursão RLS)
SELECT p.proname,
       p.prosecdef AS security_definer,
       pg_get_function_identity_arguments(p.oid) AS args
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.proname IN ('is_chat_room_member', 'is_admin_user');

-- 6) Testar is_chat_room_member com dados REAIS (não uses texto "SALA_UUID" — não é UUID válido)
--    Esperado: is_member_fn = true para cada linha de chat_participants
SELECT
  cp.room_id,
  cp.user_id,
  public.is_chat_room_member(cp.room_id, cp.user_id) AS is_member_fn
FROM chat_participants cp
ORDER BY cp.joined_at DESC NULLS LAST
LIMIT 25;

-- 6b) O created_by da sala é membro? Se false, quem cria a sala pode não conseguir INSERT em chat_messages
SELECT
  cr.id AS room_id,
  cr.created_by,
  public.is_chat_room_member(cr.id, cr.created_by) AS creator_counts_as_member
FROM chat_rooms cr
WHERE cr.created_by IS NOT NULL
ORDER BY cr.created_at DESC NULLS LAST
LIMIT 25;

-- 7) Contagens globais (cruzar com o teu relatório Lovable)
SELECT
  (SELECT COUNT(*) FROM chat_messages) AS chat_messages,
  (SELECT COUNT(*) FROM chat_messages_legacy) AS chat_messages_legacy,
  (SELECT COUNT(*) FROM chat_rooms) AS chat_rooms,
  (SELECT COUNT(*) FROM chat_participants) AS chat_participants;
