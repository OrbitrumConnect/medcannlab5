# 🔧 Guia de Correção - Erros 403 e 400

## ❌ Problemas Identificados

### 1. Erro 403 em `imre_assessments`
- **Sintoma**: `Failed to load resource: the server responded with a status of 403`
- **Query**: `imre_assessments?select=id&user_id=eq.f4a62265-8982-44db-8282-78129c4d014a&completion_status=eq.completed`
- **Causa**: Políticas RLS não estão permitindo acesso ao usuário

### 2. Erro 400 em `notifications`
- **Sintoma**: `Failed to load resource: the server responded with a status of 400`
- **Query**: `notifications?select=id&user_id=eq.f4a62265-8982-44db-8282-78129c4d014a&is_read=eq.false`
- **Causa**: Coluna `is_read` pode não existir ou query malformada

## ✅ Solução

Execute o script `CORRIGIR_RLS_IMRE_NOTIFICATIONS.sql` no Supabase SQL Editor.

### Passos:

1. **Acesse o Supabase Dashboard**
   - Vá para: https://app.supabase.com
   - Selecione seu projeto

2. **Abra o SQL Editor**
   - No menu lateral, clique em "SQL Editor"
   - Clique em "New query"

3. **Execute o Script**
   - Abra o arquivo `CORRIGIR_RLS_IMRE_NOTIFICATIONS.sql`
   - Copie TODO o conteúdo
   - Cole no SQL Editor
   - Clique em "Run" ou pressione `Ctrl+Enter`

4. **Verificar Resultado**
   - O script deve executar sem erros
   - Você verá tabelas mostrando:
     - Políticas RLS criadas para `imre_assessments`
     - Políticas RLS criadas para `notifications`
     - Status das colunas `is_read` e `user_id`

## 🔍 O que o Script Faz

### Para `imre_assessments`:
- ✅ Remove políticas antigas que podem estar bloqueando
- ✅ Cria políticas que permitem usuários verem suas próprias avaliações
- ✅ Cria políticas que permitem profissionais verem avaliações de pacientes
- ✅ Verifica se a coluna `user_id` existe antes de criar políticas

### Para `notifications`:
- ✅ Garante que a coluna `is_read` existe
- ✅ Remove políticas antigas
- ✅ Cria políticas que permitem usuários verem suas próprias notificações
- ✅ Permite que o sistema insira notificações (para admins)

## 📊 Status Atual

- ✅ **Upload de documentos**: Funcionando! (178 documentos carregados)
- ❌ **Acesso a `imre_assessments`**: Bloqueado (403)
- ❌ **Acesso a `notifications`**: Erro na query (400)

## 🎯 Após Executar o Script

Os erros 403 e 400 devem desaparecer. Você verá:
- ✅ Queries para `imre_assessments` funcionando
- ✅ Queries para `notifications` funcionando
- ✅ Dashboard carregando dados corretamente

## ⚠️ Nota Importante

O script é seguro e idempotente (pode ser executado múltiplas vezes). Ele:
- Remove políticas antigas antes de criar novas
- Verifica existência de colunas antes de usar
- Não afeta dados existentes

