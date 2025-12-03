-- =====================================================
-- 🔧 CORREÇÃO DEFINITIVA RLS PARA chat_rooms E chat_participants
-- =====================================================
-- Este script garante que profissionais e admins possam criar salas de chat
-- SEMPRE verifica tipos em PORTUGUÊS e INGLÊS para compatibilidade

DO $$
BEGIN
    -- =====================================================
    -- 1. REMOVER TODAS AS POLÍTICAS ANTIGAS
    -- =====================================================
    RAISE NOTICE 'Removendo políticas antigas de chat_rooms...';
    
    DROP POLICY IF EXISTS "chat_rooms_select" ON chat_rooms;
    DROP POLICY IF EXISTS "chat_rooms_insert" ON chat_rooms;
    DROP POLICY IF EXISTS "chat_rooms_update" ON chat_rooms;
    DROP POLICY IF EXISTS "chat_rooms_delete" ON chat_rooms;
    DROP POLICY IF EXISTS "Users can view chat rooms" ON chat_rooms;
    DROP POLICY IF EXISTS "Users can create chat rooms" ON chat_rooms;
    DROP POLICY IF EXISTS "Professionals can view chat rooms" ON chat_rooms;
    DROP POLICY IF EXISTS "Professionals can create chat rooms" ON chat_rooms;
    DROP POLICY IF EXISTS "Users can view their chat rooms" ON chat_rooms;
    DROP POLICY IF EXISTS "Users can update their chat rooms" ON chat_rooms;
    DROP POLICY IF EXISTS "Users can delete their chat rooms" ON chat_rooms;
    DROP POLICY IF EXISTS "Authenticated users can view chat rooms" ON chat_rooms;
    DROP POLICY IF EXISTS "Room creators can update chat rooms" ON chat_rooms;
    DROP POLICY IF EXISTS "Admins can delete any chat room" ON chat_rooms;

    -- =====================================================
    -- 2. POLÍTICAS PARA chat_rooms
    -- =====================================================
    RAISE NOTICE 'Criando políticas para chat_rooms...';
    
    -- SELECT: Usuários podem ver salas onde são participantes ou criadores
    CREATE POLICY "chat_rooms_select_policy" ON chat_rooms 
      FOR SELECT 
      USING (
        -- Criador pode ver sua sala
        created_by = auth.uid() OR
        -- Participante pode ver a sala
        EXISTS (
          SELECT 1 FROM chat_participants 
          WHERE room_id = chat_rooms.id 
          AND user_id = auth.uid()
        ) OR
        -- Admin pode ver todas (verifica em português E inglês)
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() 
          AND (type = 'admin' OR type = 'profissional')
        ) OR
        EXISTS (
          SELECT 1 FROM users 
          WHERE id = auth.uid() 
          AND (type = 'admin' OR type = 'profissional' OR type = 'professional')
        ) OR
        EXISTS (
          SELECT 1 FROM auth.users 
          WHERE id = auth.uid() 
          AND (
            email IN ('rrvalenca@gmail.com', 'rrvlenca@gmail.com', 'profrvalenca@gmail.com', 'iaianoaesperanza@gmail.com', 'eduardoscfaveret@gmail.com') OR
            (raw_user_meta_data->>'type') IN ('admin', 'profissional', 'professional')
          )
        )
      );

    -- INSERT: QUALQUER usuário autenticado pode criar sala (mais permissivo)
    -- Isso permite que profissionais criem salas para pacientes
    CREATE POLICY "chat_rooms_insert_policy" ON chat_rooms 
      FOR INSERT 
      WITH CHECK (
        -- Qualquer usuário autenticado pode criar sala
        auth.uid() IS NOT NULL AND
        (
          -- Verifica se é profissional/admin (português ou inglês)
          EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND (type = 'admin' OR type = 'profissional')
          ) OR
          EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND (type = 'admin' OR type = 'profissional' OR type = 'professional')
          ) OR
          EXISTS (
            SELECT 1 FROM auth.users 
            WHERE id = auth.uid() 
            AND (
              email IN ('rrvalenca@gmail.com', 'rrvlenca@gmail.com', 'profrvalenca@gmail.com', 'iaianoaesperanza@gmail.com', 'eduardoscfaveret@gmail.com') OR
              (raw_user_meta_data->>'type') IN ('admin', 'profissional', 'professional')
            )
          ) OR
          -- OU simplesmente permite qualquer usuário autenticado criar sala
          auth.uid() = created_by
        )
      );

    -- UPDATE: Criador ou admin pode atualizar
    CREATE POLICY "chat_rooms_update_policy" ON chat_rooms 
      FOR UPDATE 
      USING (
        created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() AND type = 'admin'
        ) OR
        EXISTS (
          SELECT 1 FROM users 
          WHERE id = auth.uid() AND type = 'admin'
        ) OR
        EXISTS (
          SELECT 1 FROM auth.users 
          WHERE id = auth.uid() 
          AND email IN ('rrvalenca@gmail.com', 'rrvlenca@gmail.com', 'profrvalenca@gmail.com', 'iaianoaesperanza@gmail.com')
        )
      );

    -- DELETE: Criador ou admin pode deletar
    CREATE POLICY "chat_rooms_delete_policy" ON chat_rooms 
      FOR DELETE 
      USING (
        created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() AND type = 'admin'
        ) OR
        EXISTS (
          SELECT 1 FROM users 
          WHERE id = auth.uid() AND type = 'admin'
        ) OR
        EXISTS (
          SELECT 1 FROM auth.users 
          WHERE id = auth.uid() 
          AND email IN ('rrvalenca@gmail.com', 'rrvlenca@gmail.com', 'profrvalenca@gmail.com', 'iaianoaesperanza@gmail.com')
        )
      );

    -- =====================================================
    -- 3. POLÍTICAS PARA chat_participants
    -- =====================================================
    RAISE NOTICE 'Removendo políticas antigas de chat_participants...';
    
    DROP POLICY IF EXISTS "chat_participants_select" ON chat_participants;
    DROP POLICY IF EXISTS "chat_participants_insert" ON chat_participants;
    DROP POLICY IF EXISTS "chat_participants_update" ON chat_participants;
    DROP POLICY IF EXISTS "chat_participants_delete" ON chat_participants;
    DROP POLICY IF EXISTS "Users can view chat participants" ON chat_participants;
    DROP POLICY IF EXISTS "Users can add chat participants" ON chat_participants;
    DROP POLICY IF EXISTS "Users can update chat participants" ON chat_participants;
    DROP POLICY IF EXISTS "Users can remove chat participants" ON chat_participants;

    RAISE NOTICE 'Criando políticas para chat_participants...';
    
    -- SELECT: Usuários podem ver participantes de salas onde estão
    CREATE POLICY "chat_participants_select_policy" ON chat_participants 
      FOR SELECT 
      USING (
        -- Usuário pode ver a si mesmo
        user_id = auth.uid() OR
        -- Usuário pode ver se está na sala
        EXISTS (
          SELECT 1 FROM chat_participants cp2
          WHERE cp2.room_id = chat_participants.room_id
          AND cp2.user_id = auth.uid()
        ) OR
        -- Criador da sala pode ver todos os participantes
        EXISTS (
          SELECT 1 FROM chat_rooms 
          WHERE id = chat_participants.room_id 
          AND created_by = auth.uid()
        ) OR
        -- Admin pode ver todos
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() AND type = 'admin'
        ) OR
        EXISTS (
          SELECT 1 FROM users 
          WHERE id = auth.uid() AND type = 'admin'
        ) OR
        EXISTS (
          SELECT 1 FROM auth.users 
          WHERE id = auth.uid() 
          AND email IN ('rrvalenca@gmail.com', 'rrvlenca@gmail.com', 'profrvalenca@gmail.com', 'iaianoaesperanza@gmail.com')
        )
      );

    -- INSERT: Criador da sala, admin OU o próprio usuário pode adicionar participantes
    CREATE POLICY "chat_participants_insert_policy" ON chat_participants 
      FOR INSERT 
      WITH CHECK (
        -- Usuário pode adicionar a si mesmo
        user_id = auth.uid() OR
        -- Criador da sala pode adicionar participantes
        EXISTS (
          SELECT 1 FROM chat_rooms 
          WHERE id = chat_participants.room_id 
          AND created_by = auth.uid()
        ) OR
        -- Admin pode adicionar participantes
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() AND type = 'admin'
        ) OR
        EXISTS (
          SELECT 1 FROM users 
          WHERE id = auth.uid() AND type = 'admin'
        ) OR
        EXISTS (
          SELECT 1 FROM auth.users 
          WHERE id = auth.uid() 
          AND email IN ('rrvalenca@gmail.com', 'rrvlenca@gmail.com', 'profrvalenca@gmail.com', 'iaianoaesperanza@gmail.com', 'eduardoscfaveret@gmail.com') OR
          (raw_user_meta_data->>'type') IN ('admin', 'profissional', 'professional')
        )
      );

    -- UPDATE: Usuário pode atualizar seu próprio registro, criador ou admin pode atualizar qualquer um
    CREATE POLICY "chat_participants_update_policy" ON chat_participants 
      FOR UPDATE 
      USING (
        user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM chat_rooms 
          WHERE id = chat_participants.room_id 
          AND created_by = auth.uid()
        ) OR
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() AND type = 'admin'
        ) OR
        EXISTS (
          SELECT 1 FROM users 
          WHERE id = auth.uid() AND type = 'admin'
        ) OR
        EXISTS (
          SELECT 1 FROM auth.users 
          WHERE id = auth.uid() 
          AND email IN ('rrvalenca@gmail.com', 'rrvlenca@gmail.com', 'profrvalenca@gmail.com', 'iaianoaesperanza@gmail.com')
        )
      );

    -- DELETE: Usuário pode remover a si mesmo, criador ou admin pode remover qualquer um
    CREATE POLICY "chat_participants_delete_policy" ON chat_participants 
      FOR DELETE 
      USING (
        user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM chat_rooms 
          WHERE id = chat_participants.room_id 
          AND created_by = auth.uid()
        ) OR
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() AND type = 'admin'
        ) OR
        EXISTS (
          SELECT 1 FROM users 
          WHERE id = auth.uid() AND type = 'admin'
        ) OR
        EXISTS (
          SELECT 1 FROM auth.users 
          WHERE id = auth.uid() 
          AND email IN ('rrvalenca@gmail.com', 'rrvlenca@gmail.com', 'profrvalenca@gmail.com', 'iaianoaesperanza@gmail.com')
        )
      );

    RAISE NOTICE '✅ Políticas RLS para chat_rooms e chat_participants criadas com sucesso!';
END $$;

-- Verificar se as políticas foram criadas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('chat_rooms', 'chat_participants')
ORDER BY tablename, policyname;

