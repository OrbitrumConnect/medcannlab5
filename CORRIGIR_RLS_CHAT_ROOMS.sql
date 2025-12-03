-- =====================================================
-- CORRIGIR RLS PARA chat_rooms E chat_participants
-- =====================================================
-- Permite que profissionais e admins criem e vejam salas de chat com pacientes

-- Remover políticas antigas de chat_rooms
DROP POLICY IF EXISTS "chat_rooms_select" ON chat_rooms;
DROP POLICY IF EXISTS "chat_rooms_insert" ON chat_rooms;
DROP POLICY IF EXISTS "chat_rooms_update" ON chat_rooms;
DROP POLICY IF EXISTS "chat_rooms_delete" ON chat_rooms;
DROP POLICY IF EXISTS "Users can view chat rooms" ON chat_rooms;
DROP POLICY IF EXISTS "Users can create chat rooms" ON chat_rooms;
DROP POLICY IF EXISTS "Professionals can view chat rooms" ON chat_rooms;
DROP POLICY IF EXISTS "Professionals can create chat rooms" ON chat_rooms;

-- Política de SELECT para chat_rooms: Usuários podem ver salas onde são participantes
CREATE POLICY "Users can view their chat rooms" ON chat_rooms 
  FOR SELECT USING (
    -- Usuário pode ver se é criador da sala
    created_by = auth.uid() OR
    -- Usuário pode ver se é participante da sala
    EXISTS (
      SELECT 1 FROM chat_participants 
      WHERE room_id = chat_rooms.id 
      AND user_id = auth.uid()
    ) OR
    -- Admin pode ver todas (verifica em profiles OU users OU email especial)
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

-- Política de INSERT para chat_rooms: Profissionais e admins podem criar salas
CREATE POLICY "Professionals can create chat rooms" ON chat_rooms 
  FOR INSERT WITH CHECK (
    -- Verifica se é profissional ou admin na tabela profiles
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND type IN ('professional', 'admin')
    ) OR
    -- Verifica se é profissional ou admin na tabela users
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND type IN ('professional', 'admin')
    ) OR
    -- Verifica se é admin por email especial
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND email IN ('rrvalenca@gmail.com', 'rrvlenca@gmail.com', 'profrvalenca@gmail.com', 'iaianoaesperanza@gmail.com')
    ) OR
    -- Qualquer usuário autenticado pode criar sala (para pacientes também)
    auth.uid() = created_by
  );

-- Política de UPDATE para chat_rooms: Apenas criador ou admin pode atualizar
CREATE POLICY "Users can update their chat rooms" ON chat_rooms 
  FOR UPDATE USING (
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

-- Política de DELETE para chat_rooms: Apenas criador ou admin pode deletar
CREATE POLICY "Users can delete their chat rooms" ON chat_rooms 
  FOR DELETE USING (
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

-- Remover políticas antigas de chat_participants
DROP POLICY IF EXISTS "chat_participants_select" ON chat_participants;
DROP POLICY IF EXISTS "chat_participants_insert" ON chat_participants;
DROP POLICY IF EXISTS "chat_participants_update" ON chat_participants;
DROP POLICY IF EXISTS "chat_participants_delete" ON chat_participants;
DROP POLICY IF EXISTS "Users can view chat participants" ON chat_participants;
DROP POLICY IF EXISTS "Users can add chat participants" ON chat_participants;

-- Política de SELECT para chat_participants: Usuários podem ver participantes de salas onde estão
CREATE POLICY "Users can view chat participants" ON chat_participants 
  FOR SELECT USING (
    -- Usuário pode ver se é participante da sala
    user_id = auth.uid() OR
    -- Usuário pode ver se está na sala (verifica se é participante)
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

-- Política de INSERT para chat_participants: Criador da sala ou admin pode adicionar participantes
CREATE POLICY "Users can add chat participants" ON chat_participants 
  FOR INSERT WITH CHECK (
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
      AND email IN ('rrvalenca@gmail.com', 'rrvlenca@gmail.com', 'profrvalenca@gmail.com', 'iaianoaesperanza@gmail.com')
    )
  );

-- Política de UPDATE para chat_participants: Usuário pode atualizar seu próprio registro
CREATE POLICY "Users can update chat participants" ON chat_participants 
  FOR UPDATE USING (
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

-- Política de DELETE para chat_participants: Usuário pode remover a si mesmo, criador ou admin pode remover qualquer um
CREATE POLICY "Users can remove chat participants" ON chat_participants 
  FOR DELETE USING (
    -- Usuário pode remover a si mesmo
    user_id = auth.uid() OR
    -- Criador da sala pode remover participantes
    EXISTS (
      SELECT 1 FROM chat_rooms 
      WHERE id = chat_participants.room_id 
      AND created_by = auth.uid()
    ) OR
    -- Admin pode remover qualquer participante
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

-- Comentários
COMMENT ON POLICY "Users can view their chat rooms" ON chat_rooms IS 
  'Permite que usuários vejam salas onde são participantes ou criadores, e admins vejam todas';

COMMENT ON POLICY "Professionals can create chat rooms" ON chat_rooms IS 
  'Permite que profissionais, admins e qualquer usuário autenticado criem salas de chat';

COMMENT ON POLICY "Users can view chat participants" ON chat_participants IS 
  'Permite que usuários vejam participantes de salas onde estão, criadores vejam todos os participantes, e admins vejam todos';

COMMENT ON POLICY "Users can add chat participants" ON chat_participants IS 
  'Permite que criadores de salas e admins adicionem participantes, e usuários adicionem a si mesmos';

