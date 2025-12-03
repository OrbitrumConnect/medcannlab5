-- =====================================================
-- 🚨 EXECUTE ESTE SCRIPT AGORA NO SUPABASE SQL EDITOR
-- =====================================================
-- Este script corrige o erro de recursão infinita
-- que está impedindo a criação de salas de chat

DO $$
BEGIN
    RAISE NOTICE '🔧 Removendo políticas problemáticas...';
    
    -- Remover TODAS as políticas de chat_participants que podem causar recursão
    DROP POLICY IF EXISTS "chat_participants_select_simple" ON chat_participants;
    DROP POLICY IF EXISTS "chat_participants_insert_simple" ON chat_participants;
    DROP POLICY IF EXISTS "chat_participants_update_simple" ON chat_participants;
    DROP POLICY IF EXISTS "chat_participants_delete_simple" ON chat_participants;
    DROP POLICY IF EXISTS "chat_participants_select_fixed" ON chat_participants;
    DROP POLICY IF EXISTS "chat_participants_insert_fixed" ON chat_participants;
    DROP POLICY IF EXISTS "chat_participants_update_fixed" ON chat_participants;
    DROP POLICY IF EXISTS "chat_participants_delete_fixed" ON chat_participants;
    DROP POLICY IF EXISTS "Users can view chat participants" ON chat_participants;
    DROP POLICY IF EXISTS "Users can add chat participants" ON chat_participants;
    DROP POLICY IF EXISTS "Users can update chat participants" ON chat_participants;
    DROP POLICY IF EXISTS "Users can remove chat participants" ON chat_participants;
    DROP POLICY IF EXISTS "cp_select_no_recursion" ON chat_participants;
    DROP POLICY IF EXISTS "cp_insert_no_recursion" ON chat_participants;
    DROP POLICY IF EXISTS "cp_update_no_recursion" ON chat_participants;
    DROP POLICY IF EXISTS "cp_delete_no_recursion" ON chat_participants;
    
    RAISE NOTICE '✅ Políticas antigas removidas';
END $$;

-- Criar políticas SIMPLES sem recursão
-- CRÍTICO: NÃO verificar chat_participants dentro da política de chat_participants!

CREATE POLICY "cp_select_no_recursion" ON chat_participants 
  FOR SELECT 
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM chat_rooms cr
      WHERE cr.id = chat_participants.room_id 
      AND cr.created_by = auth.uid()
    )
  );

CREATE POLICY "cp_insert_no_recursion" ON chat_participants 
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM chat_rooms cr
      WHERE cr.id = chat_participants.room_id 
      AND cr.created_by = auth.uid()
    )
  );

CREATE POLICY "cp_update_no_recursion" ON chat_participants 
  FOR UPDATE 
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM chat_rooms cr
      WHERE cr.id = chat_participants.room_id 
      AND cr.created_by = auth.uid()
    )
  );

CREATE POLICY "cp_delete_no_recursion" ON chat_participants 
  FOR DELETE 
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM chat_rooms cr
      WHERE cr.id = chat_participants.room_id 
      AND cr.created_by = auth.uid()
    )
  );

-- Verificar se funcionou
DO $$
BEGIN
    RAISE NOTICE '✅ Políticas criadas sem recursão!';
    RAISE NOTICE 'Agora teste criando uma sala de chat.';
END $$;

