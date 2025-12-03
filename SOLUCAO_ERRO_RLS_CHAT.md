# 🔧 SOLUÇÃO: Erro RLS ao Criar Sala de Chat

## ❌ PROBLEMA

Ao clicar em "Maria Souza" (ou qualquer paciente sem sala), aparece o erro:
```
Erro ao criar sala de chat: new row violates row-level security policy for table "chat_rooms"
```

## ✅ SOLUÇÃO

### 1. Execute o Script SQL no Supabase

Execute o arquivo `CORRIGIR_RLS_CHAT_ROOMS_DEFINITIVO.sql` no SQL Editor do Supabase.

Este script:
- Remove todas as políticas antigas conflitantes
- Cria políticas que permitem profissionais criar salas
- Verifica tipos em PORTUGUÊS (`'profissional'`) e INGLÊS (`'professional'`) para compatibilidade
- Permite que qualquer usuário autenticado crie salas (mais permissivo)

### 2. Verificar se Funcionou

Após executar o script, teste novamente:
1. Clique em um paciente sem sala (ex: "Maria Souza")
2. A sala deve ser criada sem erros
3. Você deve ser redirecionado para o chat com o paciente

### 3. Se Ainda Não Funcionar

Verifique no Supabase:
1. Vá em **Authentication > Users**
2. Encontre seu usuário (Dr. Ricardo ou Dr. Eduardo)
3. Verifique o campo `raw_user_meta_data.type`
4. Deve ser `'profissional'` ou `'professional'` ou `'admin'`

Se estiver diferente, execute:
```sql
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{type}', 
    '"profissional"'::jsonb
)
WHERE email = 'seu-email@exemplo.com';
```

## 📋 VERIFICAÇÃO DO CHAT

Para verificar se o chat está funcionando:

1. **Como Profissional:**
   - Acesse `/app/clinica/profissional/chat`
   - Clique em um paciente
   - Envie uma mensagem
   - A mensagem deve aparecer no chat

2. **Como Paciente:**
   - Acesse `/app/clinica/paciente/chat` ou `/app/clinica/paciente/dashboard`
   - Você deve ver as salas onde está participando
   - Mensagens do profissional devem aparecer

3. **Verificar Mensagens no Banco:**
```sql
SELECT 
    cm.id,
    cm.message,
    cm.created_at,
    cr.name as room_name,
    u.name as sender_name
FROM chat_messages cm
JOIN chat_rooms cr ON cm.room_id = cr.id
JOIN users u ON cm.sender_id = u.id
ORDER BY cm.created_at DESC
LIMIT 20;
```

## 🎯 PRÓXIMOS PASSOS

Após executar o script SQL:
1. Recarregue a página do chat
2. Tente criar uma sala novamente
3. Se funcionar, o problema estava nas políticas RLS
4. Se não funcionar, verifique os logs do console do navegador para mais detalhes

