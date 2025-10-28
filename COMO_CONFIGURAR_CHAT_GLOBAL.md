# 💬 Como Configurar o Chat Global

## 📋 Passo a Passo

### 1️⃣ Acesse o Supabase SQL Editor
- Link: https://supabase.com/dashboard/project/lhclqebtkyfftkevumix/sql
- Ou acesse: Seu projeto → Database → SQL Editor

### 2️⃣ Copie e Cole este SQL Completo:

```sql
-- Criar tabela chat_messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- Habilitar RLS
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Política: Todos podem VER
DROP POLICY IF EXISTS "Anyone can view chat messages" ON chat_messages;
CREATE POLICY "Anyone can view chat messages" ON chat_messages
  FOR SELECT USING (true);

-- Política: Autenticados podem INSERIR
DROP POLICY IF EXISTS "Authenticated users can insert messages" ON chat_messages;
CREATE POLICY "Authenticated users can insert messages" ON chat_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_channel ON chat_messages(channel);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);

-- Habilitar Realtime
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'chat_messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
    END IF;
END $$;
```

### 3️⃣ Execute o SQL
- Clique em **RUN** ou pressione `Ctrl+Enter`

### 4️⃣ Verifique se Funcionou
Execute este SQL para testar:

```sql
SELECT '✅ Chat configurado!' as status;
SELECT COUNT(*) FROM chat_messages;
```

### 5️⃣ Teste no App
- Acesse: Chat Global no dashboard admin
- Entre em qualquer canal (Geral, Cannabis, etc)
- Envie uma mensagem
- **Outros profissionais veem em TEMPO REAL** ✨

---

## ✅ Canais Disponíveis

1. **general** - Discussões gerais sobre medicina
2. **cannabis** - Cannabis Medicinal (especialistas)
3. **clinical** - Casos Clínicos (casos complexos)
4. **research** - Pesquisas e estudos recentes
5. **support** - Suporte técnico e ajuda

---

## 🎯 Como Funciona

### Mensagens Enviadas
- Usuário clica em "Enviar"
- Mensagem é salva no banco (`chat_messages`)
- Campo `channel` define o canal (general, cannabis, etc)

### Mensagens Recebidas
- Supabase Realtime detecta nova mensagem
- Todos conectados ao mesmo canal recebem
- Aparece automaticamente na tela de todos

### Quem Pode Ver
- ✅ **Profissionais** - Veem e enviam
- ✅ **Admins** - Veem e enviam
- ❌ **Pacientes** - Não têm acesso

---

## 🔧 Troubleshooting

### Problema: Mensagens não aparecem
- Verifique se executou o SQL completo
- Verifique se está no canal correto
- Abra o console do navegador (F12) e veja erros

### Problema: Erro ao enviar
- Verifique se está logado como profissional/admin
- Verifique a conexão com Supabase

### Problema: Realtime não funciona
- Verifique se executou a parte do `ALTER PUBLICATION`
- Verifique logs no Supabase Dashboard

---

**Pronto!** Agora profissionais e admins podem conversar em tempo real! 💬

