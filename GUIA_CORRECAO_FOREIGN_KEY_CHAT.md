# 🔧 Guia de Correção: Foreign Key Chat Participants

## Problema Identificado

Ao tentar criar um canal de chat para o paciente "João Eduardo Vidal", ocorre o erro:

```
Erro ao criar sala de chat: insert or update on table "chat_participants" 
violates foreign key constraint "chat_participants_user_id_fkey"
```

## Causa do Problema

A tabela `chat_participants` tem uma foreign key `user_id` que pode estar:
1. Referenciando `auth.users` ao invés de `users`
2. O paciente pode não existir na tabela referenciada
3. A foreign key pode estar mal configurada

## Solução

### Passo 1: Executar Script SQL de Correção

Execute o script `database/CORRIGIR_FOREIGN_KEY_CHAT_PARTICIPANTS.sql` no Supabase SQL Editor.

Este script:
- ✅ Remove a foreign key antiga se estiver incorreta
- ✅ Cria nova foreign key referenciando `users.id` (não `auth.users.id`)
- ✅ Atualiza a função RPC `create_chat_room_for_patient` com validação
- ✅ Verifica se o paciente existe antes de criar o canal

### Passo 2: Verificar se o Paciente Existe

O script também verifica se o paciente "João Eduardo Vidal" existe na tabela `users`. Se não existir, você verá um aviso listando todos os pacientes disponíveis.

### Passo 3: Código Atualizado

O código em `src/pages/PatientsManagement.tsx` foi atualizado para:
- ✅ Usar a função RPC `create_chat_room_for_patient` (recomendado)
- ✅ Validar se o paciente existe antes de inserir (fallback)
- ✅ Mostrar mensagem de erro mais clara se o paciente não existir

## Como Usar

1. **Execute o script SQL** no Supabase:
   ```sql
   -- Copie e cole o conteúdo de database/CORRIGIR_FOREIGN_KEY_CHAT_PARTICIPANTS.sql
   -- no Supabase SQL Editor e execute
   ```

2. **Verifique se o paciente existe**:
   ```sql
   SELECT id, name, email, type 
   FROM users 
   WHERE LOWER(name) LIKE '%joão eduardo vidal%' 
      OR LOWER(name) LIKE '%joao eduardo vidal%';
   ```

3. **Se o paciente não existir**, você precisa:
   - Criar o paciente na tabela `users` primeiro
   - Ou verificar se o nome está correto

4. **Tente criar o canal novamente** - agora deve funcionar!

## Estrutura Esperada

Após executar o script, a foreign key deve estar assim:

```sql
chat_participants.user_id → users.id (ON DELETE CASCADE)
```

## Função RPC Atualizada

A função `create_chat_room_for_patient` agora:
- ✅ Valida se o paciente existe antes de criar
- ✅ Valida se o profissional existe antes de criar
- ✅ Retorna mensagens de erro mais claras
- ✅ Contorna problemas de RLS usando `SECURITY DEFINER`

## Troubleshooting

### Erro: "Paciente não encontrado na tabela users"
- Verifique se o paciente está cadastrado na tabela `users`
- Verifique se o `id` do paciente está correto
- Execute a query de verificação acima

### Erro: "Foreign key constraint violation"
- Execute o script `CORRIGIR_FOREIGN_KEY_CHAT_PARTICIPANTS.sql` novamente
- Verifique se a foreign key está referenciando `users.id` e não `auth.users.id`

### Erro: "Function create_chat_room_for_patient does not exist"
- Execute o script `SOLUCAO_DEFINITIVA_CHAT.sql` primeiro
- Depois execute `CORRIGIR_FOREIGN_KEY_CHAT_PARTICIPANTS.sql`

## Arquivos Modificados

1. ✅ `database/CORRIGIR_FOREIGN_KEY_CHAT_PARTICIPANTS.sql` - Script SQL de correção
2. ✅ `src/pages/PatientsManagement.tsx` - Código atualizado para usar função RPC

## Próximos Passos

Após executar o script SQL:
1. Tente criar o canal novamente
2. Se ainda houver erro, verifique os logs do Supabase
3. Verifique se o paciente está cadastrado corretamente

