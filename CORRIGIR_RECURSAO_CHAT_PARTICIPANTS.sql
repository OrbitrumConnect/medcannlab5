-- =====================================================
-- 🔧 CORREÇÃO URGENTE: RECURSÃO INFINITA EM chat_participants
-- =====================================================
-- Este erro acontece quando uma política RLS verifica a própria tabela
-- dentro da verificação, causando loop infinito

DO $$
BEGIN
    -- REMOVER TODAS AS POLÍTICAS DE chat_participants QUE CAUSAM RECURSÃO
    RAISE NOTICE 'Removendo políticas que causam recursão...';
    
    DROP POLICY IF EXISTS "chat_participants_select_simple" ON chat_participants;
    DROP POLICY IF EXISTS "chat_participants_insert_simple" ON chat_participants;
    DROP POLICY IF EXISTS "chat_participants_update_simple" ON chat_participants;
    DROP POLICY IF EXISTS "chat_participants_delete_simple" ON chat_participants;
    DROP POLICY IF EXISTS "Users can view chat participants" ON chat_participants;
    DROP POLICY IF EXISTS "Users can add chat participants" ON chat_participants;
    DROP POLICY IF EXISTS "Users can update chat participants" ON chat_participants;
    DROP POLICY IF EXISTS "Users can remove chat participants" ON chat_participants;
    DROP POLICY IF EXISTS "chat_participants_select" ON chat_participants;
    DROP POLICY IF EXISTS "chat_participants_insert" ON chat_participants;
    DROP POLICY IF EXISTS "chat_participants_update" ON chat_participants;
    DROP POLICY IF EXISTS "chat_participants_delete" ON chat_participants;
    DROP POLICY IF EXISTS "chat_participants_select_policy" ON chat_participants;
    DROP POLICY IF EXISTS "chat_participants_insert_policy" ON chat_participants;
    DROP POLICY IF EXISTS "chat_participants_update_policy" ON chat_participants;
    DROP POLICY IF EXISTS "chat_participants_delete_policy" ON chat_participants;
    
    RAISE NOTICE '✅ Políticas antigas removidas';
END $$;

-- =====================================================
-- CRIAR POLÍTICAS SIMPLES SEM RECURSÃO
-- =====================================================
-- IMPORTANTE: NÃO verificar chat_participants dentro da própria política!

-- SELECT: Usuário pode ver SE É PARTICIPANTE (verifica apenas chat_rooms, não chat_participants)
CREATE POLICY "chat_participants_select_fixed" ON chat_participants 
  FOR SELECT 
  TO authenticated
  USING (
    -- Usuário pode ver a si mesmo como participante
    user_id = auth.uid() OR
    -- Criador da sala pode ver participantes (verifica apenas chat_rooms)
    EXISTS (
      SELECT 1 FROM chat_rooms 
      WHERE id = chat_participants.room_id 
      AND created_by = auth.uid()
    )
    -- NÃO verificar se usuário está em chat_participants (isso causa recursão!)
  );

-- INSERT: Criador da sala OU o próprio usuário pode adicionar participantes
CREATE POLICY "chat_participants_insert_fixed" ON chat_participants 
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    -- Usuário pode adicionar a si mesmo
    user_id = auth.uid() OR
    -- Criador da sala pode adicionar participantes (verifica apenas chat_rooms)
    EXISTS (
      SELECT 1 FROM chat_rooms 
      WHERE id = chat_participants.room_id 
      AND created_by = auth.uid()
    )
  );

-- UPDATE: Usuário pode atualizar seu próprio registro OU criador pode atualizar qualquer um
CREATE POLICY "chat_participants_update_fixed" ON chat_participants 
  FOR UPDATE 
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM chat_rooms 
      WHERE id = chat_participants.room_id 
      AND created_by = auth.uid()
    )
  );

-- DELETE: Usuário pode remover a si mesmo OU criador pode remover qualquer um
CREATE POLICY "chat_participants_delete_fixed" ON chat_participants 
  FOR DELETE 
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM chat_rooms 
      WHERE id = chat_participants.room_id 
      AND created_by = auth.uid()
    )
  );

-- Verificar se as políticas foram criadas
SELECT 
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename = 'chat_participants'
ORDER BY policyname;

RAISE NOTICE '✅ Políticas corrigidas - SEM RECURSÃO!';
RAISE NOTICE 'Agora você pode criar salas de chat sem erro de recursão.';

