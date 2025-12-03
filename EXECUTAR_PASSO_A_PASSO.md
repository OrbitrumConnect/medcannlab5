# 🎯 EXECUTAR PASSO A PASSO - MIGRAÇÕES SQL
## MedCannLab 3.0 - Guia Visual Simplificado
**Siga este guia na ordem!**

---

## 📍 **VOCÊ ESTÁ AQUI**

✅ Você tem o arquivo `001_imre_complete_schema.sql` aberto  
✅ Commit e push realizados com sucesso  
✅ Tudo pronto para executar migrações

---

## 🚀 **EXECUÇÃO - 5 PASSOS SIMPLES**

### **📍 PASSO 1: Abrir Supabase SQL Editor**

**O que fazer:**
1. Abra: https://supabase.com
2. Faça login (email/senha)
3. Selecione projeto: **MedCannLab 3.0**
4. Menu lateral → **SQL Editor**
5. Clique em **"New query"**

**✅ Pronto? → Vá para Passo 2**

---

### **📍 PASSO 2: Verificação Pré-Migração**

**Arquivo:** `supabase/migrations/000_VERIFICACAO_PRE_MIGRACAO.sql`

**Ações:**
1. Abra o arquivo no VS Code
2. **Ctrl+A** (selecionar tudo)
3. **Ctrl+C** (copiar)
4. Volte para Supabase SQL Editor
5. **Ctrl+V** (colar)
6. Clique **"Run"** (ou Ctrl+Enter)

**Resultado esperado:**
- Mostra status das tabelas
- Se não existem = ✅ Pronto!

**✅ Pronto? → Vá para Passo 3**

---

### **📍 PASSO 3: Migração IMRE** ⬅️ **VOCÊ JÁ TEM ABERTO!**

**Arquivo:** `supabase/migrations/001_imre_complete_schema.sql`

**Ações:**
1. Você já tem este arquivo aberto! ✅
2. **Ctrl+A** (selecionar tudo)
3. **Ctrl+C** (copiar)
4. Volte para Supabase SQL Editor
5. **Ctrl+V** (colar)
6. Clique **"Run"** (Ctrl+Enter)
7. ⏳ Aguarde 10-30 segundos

**Resultado esperado:**
- ✅ "Success. No rows returned"

**Se der erro:**
- `relation already exists` = ✅ OK (pode continuar)
- Outro erro = Anote e me avise

**✅ Pronto? → Vá para Passo 4**

---

### **📍 PASSO 4: Migração Notificações**

**Arquivo:** `supabase/migrations/002_notifications_schema.sql`

**Ações:**
1. Abra o arquivo no VS Code
2. **Ctrl+A** (selecionar tudo)
3. **Ctrl+C** (copiar)
4. Volte para Supabase SQL Editor
5. **Ctrl+V** (colar)
6. Clique **"Run"**
7. ⏳ Aguarde 5-15 segundos

**Resultado esperado:**
- ✅ "Success. No rows returned"

**✅ Pronto? → Vá para Passo 5**

---

### **📍 PASSO 5: Verificação Final**

**Arquivo:** `supabase/migrations/999_VERIFICACAO_POS_MIGRACAO.sql`

**Ações:**
1. Abra o arquivo no VS Code
2. **Ctrl+A** (selecionar tudo)
3. **Ctrl+C** (copiar)
4. Volte para Supabase SQL Editor
5. **Ctrl+V** (colar)
6. Clique **"Run"**
7. ⏳ Aguarde 10-20 segundos

**Resultado esperado:**
- ✅ "✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!"
- ✅ Mostra 5 tabelas IMRE
- ✅ Mostra 1 tabela notifications
- ✅ RLS habilitado
- ✅ Políticas configuradas

**✅ Pronto? → Vá para Verificação Rápida**

---

## ✅ **VERIFICAÇÃO RÁPIDA**

Execute esta query no SQL Editor:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (
    table_name LIKE 'imre%' 
    OR table_name = 'notifications'
)
ORDER BY table_name;
```

**Deve mostrar 6 tabelas:**
- ✅ `imre_assessments`
- ✅ `imre_semantic_blocks`
- ✅ `imre_semantic_context`
- ✅ `noa_interaction_logs`
- ✅ `clinical_integration`
- ✅ `notifications`

---

## 🎉 **SUCESSO!**

Se todas as 6 tabelas aparecerem, as migrações foram bem-sucedidas!

**Próximo passo:** Testar sistema completo

---

## 🐛 **TROUBLESHOOTING RÁPIDO**

| Erro | Solução |
|------|---------|
| `relation already exists` | ✅ OK - Tabela já existe, pode continuar |
| `permission denied` | Verificar se está logado como admin |
| `syntax error` | Verificar se copiou TODO o conteúdo |
| Timeout | Aguardar mais tempo e tentar novamente |

---

## 📊 **CHECKLIST DE EXECUÇÃO**

- [ ] Passo 1: SQL Editor aberto
- [ ] Passo 2: Verificação pré-migração executada
- [ ] Passo 3: Migração IMRE executada
- [ ] Passo 4: Migração Notificações executada
- [ ] Passo 5: Verificação final executada
- [ ] Verificação rápida: 6 tabelas encontradas

---

## 🎯 **RESUMO**

**Arquivos (nesta ordem):**
1. `000_VERIFICACAO_PRE_MIGRACAO.sql`
2. `001_imre_complete_schema.sql` ← **Você já tem!**
3. `002_notifications_schema.sql`
4. `999_VERIFICACAO_POS_MIGRACAO.sql`

**Tempo:** 10-15 minutos  
**Dificuldade:** ⭐⭐ (Fácil)

---

**Status:** 🟢 **Pronto! Comece pelo Passo 1!**

