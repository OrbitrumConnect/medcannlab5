-- =====================================================
-- 💬 SETUP CHAT GLOBAL - MEDCANLAB 3.0
-- =====================================================
-- Execute este script COMPLETO no Supabase SQL Editor
-- Link: https://supabase.com/dashboard/project/lhclqebtkyfftkevumix/sql

-- =====================================================
-- 1. CRIAR TABELA DE MENSAGENS
-- =====================================================
CREATE TABLE IF NOT EXISTS global_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  user_avatar TEXT DEFAULT 'U',
  message TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'general',
  crm TEXT,
  specialty TEXT,
  type TEXT DEFAULT 'text',
  reactions JSONB DEFAULT '{"heart": 0, "thumbs": 0, "reply": 0}',
  is_pinned BOOLEAN DEFAULT FALSE,
  is_online BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. HABILITAR RLS (ROW LEVEL SECURITY)
-- =====================================================
ALTER TABLE global_chat_messages ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 3. CRIAR POLÍTICAS DE ACESSO
-- =====================================================
-- Todos podem VER mensagens
DROP POLICY IF EXISTS "Anyone can view chat messages" ON global_chat_messages;
CREATE POLICY "Anyone can view chat messages" ON global_chat_messages
  FOR SELECT USING (true);

-- Usuários autenticados podem INSERIR mensagens
DROP POLICY IF EXISTS "Authenticated users can insert messages" ON global_chat_messages;
CREATE POLICY "Authenticated users can insert messages" ON global_chat_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Usuários podem ATUALIZAR suas próprias mensagens
DROP POLICY IF EXISTS "Users can update own messages" ON global_chat_messages;
CREATE POLICY "Users can update own messages" ON global_chat_messages
  FOR UPDATE USING (auth.uid() = user_id);

-- Usuários podem DELETAR suas próprias mensagens
DROP POLICY IF EXISTS "Users can delete own messages" ON global_chat_messages;
CREATE POLICY "Users can delete own messages" ON global_chat_messages
  FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 4. CRIAR ÍNDICES PARA PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_global_chat_messages_channel ON global_chat_messages(channel);
CREATE INDEX IF NOT EXISTS idx_global_chat_messages_created_at ON global_chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_global_chat_messages_user_id ON global_chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_global_chat_messages_created_at_desc ON global_chat_messages(created_at DESC NULLS LAST);

-- =====================================================
-- 5. HABILITAR REALTIME
-- =====================================================
-- Verificar se já está na publicação antes de adicionar
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'global_chat_messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE global_chat_messages;
    END IF;
END $$;

-- =====================================================
-- 6. INSERIR MENSAGENS DE TESTE (OPCIONAL)
-- =====================================================
-- Mensagens de teste DESABILITADAS (use IDs de usuários reais)
-- INSERT INTO global_chat_messages (user_id, user_name, user_avatar, message, channel, crm, specialty, type, reactions, is_pinned, is_online, created_at) VALUES
-- ('00000000-0000-0000-0000-000000000001', 'Dr. Admin MedCannLab', 'AM', 'Bem-vindos ao Chat Global!', 'general', 'CRM123456', 'Administrador', 'text', '{"heart": 5, "thumbs": 8, "reply": 2}', false, true, NOW());

-- =====================================================
-- 7. VERIFICAR SE FUNCIONOU
-- =====================================================
SELECT 
  '✅ Tabela criada: global_chat_messages' as status,
  COUNT(*) as total_messages,
  COUNT(DISTINCT channel) as total_channels,
  COUNT(DISTINCT user_id) as total_users
FROM global_chat_messages;

SELECT 
  channel,
  COUNT(*) as messages,
  COUNT(DISTINCT user_id) as users,
  MAX(created_at) as ultima_mensagem
FROM global_chat_messages 
GROUP BY channel
ORDER BY messages DESC;

-- =====================================================
-- ✅ PRONTO! CHAT GLOBAL CONFIGURADO
-- =====================================================
-- Canais disponíveis:
-- 1. general - Discussões gerais sobre medicina
-- 2. cannabis - Cannabis Medicinal (especialistas)
-- 3. clinical - Casos Clínicos (casos complexos)
-- 4. research - Pesquisas e estudos recentes
-- 5. support - Suporte técnico e ajuda
--
-- Como funciona:
-- ✅ Profissionais e admins podem enviar mensagens
-- ✅ Todos veem mensagens em TEMPO REAL
-- ✅ Mensagens são salvas no banco de dados
-- ✅ Realtime ativo com Supabase
-- ✅ RLS configurado para segurança
--
-- Teste agora no Chat Global! 💬

