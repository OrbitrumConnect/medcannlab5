# 🚨 CORRIGIR ERRO DE RECURSÃO INFINITA - CHAT PARTICIPANTS

## ❌ ERRO ATUAL

```
infinite recursion detected in policy for relation "chat_participants"
```

Este erro acontece porque as políticas RLS de `chat_participants` estão verificando `chat_participants` dentro da própria verificação, criando um loop infinito.

---

## ✅ SOLUÇÃO

Execute **DOIS scripts SQL** no Supabase SQL Editor, nesta ordem:

### **1. PRIMEIRO: Corrigir Recursão**
**Arquivo:** `CORRIGIR_RECURSAO_DEFINITIVO.sql`

Este script:
- Remove TODAS as políticas problemáticas
- Cria políticas SIMPLES sem recursão
- Usa apenas `chat_rooms` para verificar permissões (nunca `chat_participants`)

### **2. SEGUNDO: Criar Função RPC**
**Arquivo:** `CRIAR_RPC_CHAT_PARTICIPANTS.sql`

Este script:
- Cria função RPC `get_chat_participants_for_room` que contorna RLS
- Usa `SECURITY DEFINER` para ignorar políticas RLS
- Permite buscar participantes sem recursão

---

## 🎯 COMO EXECUTAR

1. **Abra Supabase Dashboard**
2. **Vá em SQL Editor**
3. **Execute PRIMEIRO:** `CORRIGIR_RECURSAO_DEFINITIVO.sql`
4. **Execute SEGUNDO:** `CRIAR_RPC_CHAT_PARTICIPANTS.sql`
5. **Recarregue a página** (F5)

---

## ✅ VERIFICAÇÃO

Após executar, você deve ver:
- ✅ Mensagens de sucesso no console
- ✅ Lista de políticas criadas (4 políticas com nome `cp_%_no_recursion_v2`)
- ✅ Função RPC listada

Verificar políticas:
```sql
SELECT policyname FROM pg_policies WHERE tablename = 'chat_participants';
```

Verificar função RPC:
```sql
SELECT proname FROM pg_proc WHERE proname = 'get_chat_participants_for_room';
```

---

## 🧪 TESTE

1. **Recarregue a página** do chat (F5)
2. **Clique em qualquer paciente** para criar/abrir chat
3. **Deve funcionar SEM ERRO!** ✅

---

## 💡 POR QUE FUNCIONA AGORA?

1. **Políticas sem recursão:** Não verificam `chat_participants` dentro de `chat_participants`
2. **Função RPC:** Usa `SECURITY DEFINER` que contorna RLS completamente
3. **Código atualizado:** Tenta RPC primeiro, depois fallback para query direta

---

## ⚠️ SE AINDA NÃO FUNCIONAR

1. Verifique se ambos os scripts foram executados completamente (sem erros)
2. Verifique se as políticas foram criadas:
   ```sql
   SELECT policyname FROM pg_policies WHERE tablename = 'chat_participants';
   ```
   Deve ver 4 políticas com nomes `cp_%_no_recursion_v2`

3. Verifique se a função RPC existe:
   ```sql
   SELECT proname FROM pg_proc WHERE proname = 'get_chat_participants_for_room';
   ```

4. Limpe o cache do navegador (Ctrl+Shift+Delete)

---

## 🎉 RESULTADO ESPERADO

Após executar os scripts:
- ✅ Clicar em paciente cria/abre sala instantaneamente
- ✅ Sem erro de recursão
- ✅ Sem erro de RLS
- ✅ Chat funciona perfeitamente
- ✅ Participantes são carregados corretamente

