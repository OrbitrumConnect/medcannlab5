# 🔍 COMO VERIFICAR SE AS MENSAGENS ESTÃO SENDO ENVIADAS E RECEBIDAS

## ✅ O QUE FUNCIONA AGORA

1. **Chat criado com Maria Souza** ✅
2. **Mensagem enviada** ✅
3. **Sistema de Realtime configurado** ✅

---

## 🔍 VERIFICAÇÕES

### 1. **Verificar se a mensagem foi salva no banco**

No Supabase SQL Editor, execute:

```sql
-- Ver últimas mensagens enviadas
SELECT 
  id,
  room_id,
  sender_id,
  message,
  created_at,
  read_at
FROM chat_messages
ORDER BY created_at DESC
LIMIT 10;
```

**O que esperar:**
- Deve aparecer sua mensagem com `created_at` recente
- O `room_id` deve corresponder à sala criada
- O `sender_id` deve ser seu ID de usuário

---

### 2. **Verificar se Maria Souza está na sala**

```sql
-- Ver participantes da sala
SELECT 
  cp.room_id,
  cp.user_id,
  cp.role,
  u.name,
  u.email
FROM chat_participants cp
JOIN users u ON cp.user_id = u.id
WHERE cp.room_id = 'ID_DA_SALA_AQUI'; -- Substitua pelo ID da sala
```

**O que esperar:**
- Deve ter 2 participantes:
  - Você (role: 'professional' ou 'admin')
  - Maria Souza (role: 'patient')

---

### 3. **Verificar se o Realtime está habilitado**

No Supabase Dashboard:
1. Vá em **Database** → **Replication**
2. Verifique se `chat_messages` está na lista de tabelas replicadas
3. Se não estiver, clique em **Enable Replication** para `chat_messages`

---

### 4. **Verificar logs no console do navegador**

Abra o **Console do navegador** (F12) e procure por:

**Quando você envia uma mensagem:**
```
📤 Enviando mensagem: { roomId: '...', senderId: '...', message: '...' }
✅ Mensagem salva no banco: { messageId: '...', createdAt: '...' }
✅ Mensagens recarregadas após envio
```

**Quando uma nova mensagem chega (Realtime):**
```
📨 Nova mensagem recebida em tempo real: { event: 'INSERT', ... }
✅ Inscrito no canal de chat: [room_id]
```

---

## 🎯 POR QUE A PACIENTE PODE NÃO ESTAR VENDO?

### Possíveis causas:

1. **Realtime não habilitado no Supabase**
   - **Solução:** Habilitar Replication para `chat_messages` no Supabase Dashboard

2. **Paciente não está na mesma sala**
   - **Solução:** Verificar participantes com SQL acima

3. **Paciente não está logada ou não está na página do chat**
   - **Solução:** Confirmar que Maria Souza está logada e na página `/app/chat-clinico`

4. **Subscription do Realtime não está funcionando**
   - **Solução:** Verificar logs no console. Se não aparecer "✅ Inscrito no canal", há problema na subscription

---

## 🧪 TESTE RÁPIDO

1. **Envie uma mensagem** no chat com Maria Souza
2. **Abra o console** (F12) e verifique os logs
3. **Execute o SQL** para verificar se a mensagem foi salva
4. **Peça para Maria Souza recarregar a página** (F5) se ela não viu a mensagem

---

## 📝 PRÓXIMOS PASSOS

Se a mensagem foi salva mas Maria Souza não viu:
1. Verificar se Realtime está habilitado no Supabase
2. Verificar se ela está na mesma sala (participantes)
3. Verificar se ela está logada e na página correta
4. Pedir para ela recarregar a página

Se a mensagem NÃO foi salva:
1. Verificar erros no console do navegador
2. Verificar RLS policies para `chat_messages`
3. Verificar se você tem permissão para inserir mensagens

