# 🔧 Guia de Execução - Correção RLS IMRE e Notifications

## ⚠️ IMPORTANTE: Execute o arquivo SQL correto!

Você deve executar o arquivo **`CORRIGIR_RLS_IMRE_NOTIFICATIONS.sql`** no Supabase SQL Editor.

**NÃO execute o arquivo `CORRECAO_UPLOAD_E_IA_LER_TODOS_DOCUMENTOS.md`** - esse é apenas um documento de explicação.

---

## 📋 Passos para Executar

1. **Acesse o Supabase Dashboard**
   - Vá para: https://app.supabase.com
   - Selecione seu projeto

2. **Abra o SQL Editor**
   - No menu lateral, clique em "SQL Editor"
   - Clique em "New query"

3. **Abra o arquivo SQL correto**
   - Abra o arquivo: `CORRIGIR_RLS_IMRE_NOTIFICATIONS.sql`
   - **NÃO** abra o arquivo `.md`

4. **Copie e Cole**
   - Copie TODO o conteúdo do arquivo `CORRIGIR_RLS_IMRE_NOTIFICATIONS.sql`
   - Cole no SQL Editor do Supabase
   - Clique em "Run" ou pressione `Ctrl+Enter`

---

## ✅ O que o Script Faz

### Parte 1: Corrigir Notifications (Erro 400)
- Garante que a coluna `is_read` existe
- Remove políticas antigas
- Cria novas políticas RLS

### Parte 2: Corrigir IMRE Assessments (Erro 403)
- Remove todas as políticas antigas (incluindo a que estava causando erro)
- Cria políticas que permitem:
  - Usuários verem suas próprias avaliações
  - Profissionais verem avaliações de pacientes
  - Inserção e atualização baseadas em `user_id`

### Parte 3: Verificação
- Mostra todas as políticas criadas
- Verifica se as colunas existem

---

## 🎯 Resultado Esperado

Após executar o script com sucesso, você verá:
- ✅ Tabelas mostrando as políticas criadas
- ✅ Status das colunas (`is_read` e `user_id`)
- ✅ Sem erros

Os erros 403 e 400 devem desaparecer após a execução.

---

## ⚠️ Se Ainda Houver Erros

Se você receber um erro dizendo que uma política já existe:
1. Execute o script novamente (ele usa `DROP POLICY IF EXISTS`, então é seguro)
2. Ou execute manualmente apenas a parte que está falhando

---

## 📝 Arquivos Relacionados

- ✅ **Execute este:** `CORRIGIR_RLS_IMRE_NOTIFICATIONS.sql` (arquivo SQL)
- 📄 **Leia este:** `CORRECAO_UPLOAD_E_IA_LER_TODOS_DOCUMENTOS.md` (documentação)
- 📄 **Leia este:** `GUIA_CORRECAO_ERROS_403_400.md` (guia detalhado)

