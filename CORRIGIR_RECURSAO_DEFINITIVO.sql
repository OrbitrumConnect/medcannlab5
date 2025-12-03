-- =====================================================
-- 🔧 CORREÇÃO DEFINITIVA: RECURSÃO INFINITA EM chat_participants
-- =====================================================
-- Este script remove COMPLETAMENTE a recursão nas políticas RLS
-- Execute este script no Supabase SQL Editor

DO $$
BEGIN
    RAISE NOTICE '🔧 Iniciando correção definitiva da recursão em chat_participants...';
    
    -- =====================================================
    -- 1. REMOVER TODAS AS POLÍTICAS EXISTENTES
    -- =====================================================
    RAISE NOTICE 'Removendo todas as políticas existentes de chat_participants...';
    
    -- Lista completa de todas as políticas possíveis que podem existir
    DROP POLICY IF EXISTS "chat_participants_select_simple" ON chat_participants;
    DROP POLICY IF EXISTS "chat_participants_insert_simple" ON chat_participants;
    DROP POLICY IF EXISTS "chat_participants_update_simple" ON chat_participants;
    DROP POLICY IF EXISTS "chat_participants_delete_simple" ON chat_participants;
    DROP POLICY IF EXISTS "chat_participants_select_fixed" ON chat_participants;
    DROP POLICY IF EXISTS "chat_participants_insert_fixed" ON chat_participants;
    DROP POLICY IF EXISTS "chat_participants_update_fixed" ON chat_participants;
    DROP POLICY IF EXISTS "chat_participants_delete_fixed" ON chat_participants;
    DROP POLICY IF EXISTS "cp_select_no_recursion" ON chat_participants;
    DROP POLICY IF EXISTS "cp_insert_no_recursion" ON chat_participants;
    DROP POLICY IF EXISTS "cp_update_no_recursion" ON chat_participants;
    DROP POLICY IF EXISTS "cp_delete_no_recursion" ON chat_participants;
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
    
    RAISE NOTICE '✅ Todas as políticas antigas removidas';
END $$;

-- =====================================================
-- 2. CRIAR POLÍTICAS SIMPLES SEM RECURSÃO
-- =====================================================
-- CRÍTICO: NUNCA verificar chat_participants dentro da política de chat_participants!
-- Usar apenas chat_rooms para verificar permissões

-- SELECT: Usuário pode ver participantes onde:
--   - É o próprio participante (user_id = auth.uid())
--   - É o criador da sala (verifica apenas chat_rooms, NÃO chat_participants)
CREATE POLICY "cp_select_no_recursion_v2" ON chat_participants 
  FOR SELECT 
  TO authenticated
  USING (
    -- Usuário pode ver a si mesmo como participante
    user_id = auth.uid() OR
    -- Criador da sala pode ver participantes (verifica apenas chat_rooms)
    EXISTS (
      SELECT 1 FROM chat_rooms cr
      WHERE cr.id = chat_participants.room_id 
      AND cr.created_by = auth.uid()
    )
  );

-- INSERT: Criador da sala OU o próprio usuário pode adicionar participantes
CREATE POLICY "cp_insert_no_recursion_v2" ON chat_participants 
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    -- Usuário pode adicionar a si mesmo
    user_id = auth.uid() OR
    -- Criador da sala pode adicionar participantes (verifica apenas chat_rooms)
    EXISTS (
      SELECT 1 FROM chat_rooms cr
      WHERE cr.id = chat_participants.room_id 
      AND cr.created_by = auth.uid()
    )
  );

-- UPDATE: Usuário pode atualizar seu próprio registro OU criador pode atualizar qualquer um
CREATE POLICY "cp_update_no_recursion_v2" ON chat_participants 
  FOR UPDATE 
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM chat_rooms cr
      WHERE cr.id = chat_participants.room_id 
      AND cr.created_by = auth.uid()
    )
  )
  WITH CHECK (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM chat_rooms cr
      WHERE cr.id = chat_participants.room_id 
      AND cr.created_by = auth.uid()
    )
  );

-- DELETE: Usuário pode remover a si mesmo OU criador pode remover qualquer um
CREATE POLICY "cp_delete_no_recursion_v2" ON chat_participants 
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

-- =====================================================
-- 3. VERIFICAÇÃO FINAL
-- =====================================================
DO $$
BEGIN
    -- Verificar políticas criadas
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'chat_participants' 
        AND policyname LIKE 'cp_%_no_recursion_v2'
    ) THEN
        RAISE NOTICE '✅ Políticas criadas sem recursão';
    ELSE
        RAISE WARNING '⚠️ Políticas não foram criadas corretamente';
    END IF;
    
    RAISE NOTICE '✅ Correção completa! Agora você pode usar chat sem erro de recursão.';
END $$;

-- Mostrar políticas finais
SELECT 
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename = 'chat_participants'
ORDER BY policyname;

