-- =====================================================
-- 🔧 SOLUÇÃO DEFINITIVA PARA CHAT - SEM RECURSÃO
-- =====================================================
-- Este script resolve TODOS os problemas de uma vez:
-- 1. Remove políticas que causam recursão
-- 2. Cria políticas simples sem recursão
-- 3. Cria função RPC que contorna RLS completamente

DO $$
BEGIN
    RAISE NOTICE '🔧 Iniciando correção definitiva do chat...';
    
    -- =====================================================
    -- 1. REMOVER TODAS AS POLÍTICAS PROBLEMÁTICAS
    -- =====================================================
    RAISE NOTICE 'Removendo políticas antigas...';
    
    -- Remover políticas de chat_participants (que causam recursão)
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
-- 2. CRIAR POLÍTICAS SIMPLES SEM RECURSÃO
-- =====================================================
-- CRÍTICO: NUNCA verificar chat_participants dentro da política de chat_participants!

-- SELECT: Usuário pode ver SE É PARTICIPANTE (verifica apenas chat_rooms)
CREATE POLICY "cp_select_no_recursion" ON chat_participants 
  FOR SELECT 
  TO authenticated
  USING (
    -- Usuário pode ver a si mesmo
    user_id = auth.uid() OR
    -- Criador da sala pode ver participantes (verifica apenas chat_rooms, NÃO chat_participants)
    EXISTS (
      SELECT 1 FROM chat_rooms cr
      WHERE cr.id = chat_participants.room_id 
      AND cr.created_by = auth.uid()
    )
  );

-- INSERT: Criador da sala OU o próprio usuário pode adicionar
CREATE POLICY "cp_insert_no_recursion" ON chat_participants 
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    -- Usuário pode adicionar a si mesmo
    user_id = auth.uid() OR
    -- Criador da sala pode adicionar (verifica apenas chat_rooms)
    EXISTS (
      SELECT 1 FROM chat_rooms cr
      WHERE cr.id = chat_participants.room_id 
      AND cr.created_by = auth.uid()
    )
  );

-- UPDATE: Usuário pode atualizar seu próprio registro OU criador pode atualizar qualquer um
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

-- DELETE: Usuário pode remover a si mesmo OU criador pode remover qualquer um
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

-- =====================================================
-- 3. CRIAR FUNÇÃO RPC QUE CONTORNA RLS COMPLETAMENTE
-- =====================================================
CREATE OR REPLACE FUNCTION create_chat_room_for_patient(
    p_patient_id UUID,
    p_patient_name TEXT,
    p_professional_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER -- Executa com permissões do criador (contorna RLS)
SET search_path = public
AS $$
DECLARE
    v_room_id UUID;
BEGIN
    -- Validar parâmetros
    IF p_professional_id IS NULL THEN
        RAISE EXCEPTION 'professional_id não pode ser NULL';
    END IF;
    
    IF p_patient_id IS NULL THEN
        RAISE EXCEPTION 'patient_id não pode ser NULL';
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

-- =====================================================
-- 4. VERIFICAÇÃO FINAL
-- =====================================================
DO $$
BEGIN
    -- Verificar políticas criadas
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'chat_participants' 
        AND policyname LIKE 'cp_%_no_recursion'
    ) THEN
        RAISE NOTICE '✅ Políticas criadas sem recursão';
    ELSE
        RAISE WARNING '⚠️ Políticas não foram criadas corretamente';
    END IF;
    
    -- Verificar função RPC
    IF EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'create_chat_room_for_patient'
    ) THEN
        RAISE NOTICE '✅ Função RPC criada';
    ELSE
        RAISE WARNING '⚠️ Função RPC não foi criada';
    END IF;
    
    RAISE NOTICE '✅ Correção completa! Agora você pode criar salas sem erro de recursão.';
END $$;

-- Mostrar políticas finais
DO $$
BEGIN
    RAISE NOTICE '📋 Políticas finais criadas:';
END $$;

SELECT 
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename IN ('chat_rooms', 'chat_participants')
ORDER BY tablename, policyname;

