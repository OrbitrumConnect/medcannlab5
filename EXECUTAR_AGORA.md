# ⚡ EXECUTAR AGORA - MIGRAÇÕES SQL
## MedCannLab 3.0 - Passo a Passo Simplificado
**Tempo:** 10-15 minutos

---

## 🎯 **VOCÊ ESTÁ AQUI**

Você tem o arquivo `001_imre_complete_schema.sql` aberto. Perfeito!

---

## 🚀 **EXECUÇÃO EM 4 PASSOS**

### **PASSO 1: Abrir Supabase SQL Editor** (1 min)

1. Acesse: https://supabase.com
2. Faça login (email/senha - não precisa de Google)
3. Selecione projeto: **MedCannLab 3.0**
4. Menu lateral → **SQL Editor**
5. Clique em **"New query"**

✅ **Pronto? Vá para Passo 2**

---

### **PASSO 2: Executar Verificação Pré-Migração** (2 min)

1. Abra: `supabase/migrations/000_VERIFICACAO_PRE_MIGRACAO.sql`
2. **Selecione TODO** (Ctrl+A)
3. **Copie** (Ctrl+C)
4. **Cole** no SQL Editor do Supabase (Ctrl+V)
5. Clique em **"Run"** (ou Ctrl+Enter)
6. Aguarde resultado

**Resultado esperado:**
- Mostra status das tabelas existentes
- Se não existem tabelas = ✅ Pronto para migração

✅ **Pronto? Vá para Passo 3**

---

### **PASSO 3: Executar Migração IMRE** (3-5 min)

1. Você já tem o arquivo aberto: `001_imre_complete_schema.sql`
2. **Selecione TODO** (Ctrl+A)
3. **Copie** (Ctrl+C)
4. **Cole** no SQL Editor do Supabase (Ctrl+V)
5. Clique em **"Run"** (Ctrl+Enter)
6. ⏳ Aguarde 10-30 segundos
7. ✅ Deve aparecer: **"Success. No rows returned"**

**Se der erro:**
- `relation already exists` = Tabela já existe (pode continuar)
- Outro erro = Anote e me avise

✅ **Pronto? Vá para Passo 4**

---

### **PASSO 4: Executar Migração Notificações** (2-3 min)

1. Abra: `supabase/migrations/002_notifications_schema.sql`
2. **Selecione TODO** (Ctrl+A)
3. **Copie** (Ctrl+C)
4. **Cole** no SQL Editor do Supabase (Ctrl+V)
5. Clique em **"Run"**
6. ⏳ Aguarde 5-15 segundos
7. ✅ Deve aparecer: **"Success. No rows returned"**

✅ **Pronto? Vá para Passo 5**

---

### **PASSO 5: Verificação Final** (3-5 min)

1. Abra: `supabase/migrations/999_VERIFICACAO_POS_MIGRACAO.sql`
2. **Selecione TODO** (Ctrl+A)
3. **Copie** (Ctrl+C)
4. **Cole** no SQL Editor do Supabase (Ctrl+V)
5. Clique em **"Run"**
6. ⏳ Aguarde 10-20 segundos
7. ✅ Deve aparecer: **"✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!"**

**Verifique se mostra:**
- ✅ 5 tabelas IMRE criadas
- ✅ 1 tabela notifications criada
- ✅ RLS habilitado
- ✅ Políticas configuradas

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

## 🎉 **PRONTO!**

Se todas as 6 tabelas aparecerem, as migrações foram bem-sucedidas!

---

## 🐛 **SE DER ERRO**

### **Erro: "relation already exists"**
- ✅ **Não é problema!** A tabela já existe
- Pode continuar com próximo script
- Ou execute `DROP TABLE` se quiser recriar

### **Erro: "permission denied"**
- Verifique se está logado como admin do projeto
- Verifique se está no projeto correto

### **Erro: "syntax error"**
- Verifique se copiou TODO o conteúdo
- Tente copiar novamente

---

## 📞 **PRECISA DE AJUDA?**

Se encontrar algum erro que não consegue resolver:
1. Anote a mensagem de erro completa
2. Anote em qual passo ocorreu
3. Me avise e eu ajudo a resolver

---

## 🎯 **RESUMO**

**Arquivos para executar (nesta ordem):**
1. `000_VERIFICACAO_PRE_MIGRACAO.sql`
2. `001_imre_complete_schema.sql` ← **Você já tem aberto!**
3. `002_notifications_schema.sql`
4. `999_VERIFICACAO_POS_MIGRACAO.sql`

**Tempo total:** 10-15 minutos

**Dificuldade:** ⭐⭐ (Fácil - só copiar e colar)

---

**Status:** 🟢 **Pronto para executar!**

**Comece pelo Passo 1 acima!**

