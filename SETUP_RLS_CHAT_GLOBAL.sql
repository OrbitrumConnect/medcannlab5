-- =====================================================
-- 💬 POLÍTICAS RLS PARA CHAT GLOBAL
-- =====================================================
-- Execute no Supabase SQL Editor

-- 1️⃣ HABILITAR RLS
ALTER TABLE global_chat_messages ENABLE ROW LEVEL SECURITY;

-- 2️⃣ REMOVER POLÍTICAS ANTIGAS (se existirem)
DROP POLICY IF EXISTS "Anyone can view chat messages" ON global_chat_messages;
DROP POLICY IF EXISTS "Authenticated users can insert messages" ON global_chat_messages;
DROP POLICY IF EXISTS "Users can update own messages" ON global_chat_messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON global_chat_messages;

-- 3️⃣ TODOS AUTENTICADOS PODEM VER
CREATE POLICY "Authenticated users can view messages" ON global_chat_messages
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- 4️⃣ TODOS AUTENTICADOS PODEM INSERIR
CREATE POLICY "Authenticated users can insert messages" ON global_chat_messages
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- 5️⃣ USUÁRIOS PODEM ATUALIZAR SUAS PRÓPRIAS MENSAGENS
CREATE POLICY "Users can update own messages" ON global_chat_messages
  FOR UPDATE
  USING (auth.uid() = user_id);

-- 6️⃣ USUÁRIOS PODEM DELETAR SUAS PRÓPRIAS MENSAGENS
CREATE POLICY "Users can delete own messages" ON global_chat_messages
  FOR DELETE
  USING (auth.uid() = user_id);

-- 7️⃣ ADMINS E PROFISSIONAIS PODEM MODERAR (não precisa filtrar por email, todos autenticados podem)
-- Esta política é opcional - pode comentar se quiser que todos tenham mesmos direitos
-- CREATE POLICY "Admins can manage all messages" ON global_chat_messages
--   FOR ALL
--   USING (auth.role() = 'authenticated');

-- ✅ VERIFICAR POLÍTICAS CRIADAS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'global_chat_messages';

-- ✅ TESTAR
SELECT '✅ Políticas RLS configuradas com sucesso!' as status;

