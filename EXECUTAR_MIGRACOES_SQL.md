# 📊 GUIA RÁPIDO - EXECUTAR MIGRAÇÕES SQL
## MedCannLab 3.0 - Supabase
**Data:** Janeiro 2025

---

## 🚀 **EXECUÇÃO RÁPIDA (5 MINUTOS)**

### **1. Acessar Supabase SQL Editor**
1. https://supabase.com → Login
2. Selecione projeto **MedCannLab 3.0**
3. Menu lateral → **SQL Editor**
4. Clique em **"New query"**

### **2. Executar Migração IMRE**
1. Abra: `supabase/migrations/001_imre_complete_schema.sql`
2. **Copie TODO** o conteúdo
3. Cole no SQL Editor
4. Clique **"Run"** (Ctrl+Enter)
5. ✅ Aguarde: "Success. No rows returned"

### **3. Executar Migração Notificações**
1. Abra: `supabase/migrations/002_notifications_schema.sql`
2. **Copie TODO** o conteúdo
3. Cole no SQL Editor
4. Clique **"Run"**
5. ✅ Aguarde: "Success. No rows returned"

### **4. Verificar Criação**
Execute no SQL Editor:
```sql
-- Verificar tabelas IMRE
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'imre%'
ORDER BY table_name;

-- Verificar tabela notifications
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'notifications';
```

**Resultado esperado:**
- ✅ 5 tabelas IMRE
- ✅ 1 tabela notifications

---

## ✅ **VERIFICAÇÃO RLS**

Execute:
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  'imre_assessments', 
  'imre_semantic_blocks', 
  'imre_semantic_context',
  'noa_interaction_logs',
  'clinical_integration',
  'notifications'
);
```

**Todos devem ter:** `rowsecurity = true`

---

## 🎯 **PRONTO!**

Após executar, as migrações estarão completas e o sistema estará pronto para uso.

**Tempo estimado:** 5 minutos

