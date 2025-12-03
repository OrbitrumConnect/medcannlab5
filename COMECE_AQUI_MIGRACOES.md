# 🎯 COMECE AQUI - EXECUTAR MIGRAÇÕES
## MedCannLab 3.0 - Guia Simplificado
**Você já tem o arquivo aberto! Vamos executar!**

---

## ⚡ **EXECUÇÃO RÁPIDA (4 SCRIPTS)**

### **SCRIPT 1: Verificação Pré-Migração** (2 min)
📁 `supabase/migrations/000_VERIFICACAO_PRE_MIGRACAO.sql`
- Copie TODO → Cole no Supabase SQL Editor → Run

### **SCRIPT 2: Migração IMRE** (3-5 min) ⬅️ **VOCÊ JÁ TEM ABERTO!**
📁 `supabase/migrations/001_imre_complete_schema.sql`
- **Você já tem este arquivo aberto!**
- Selecione TODO (Ctrl+A) → Copie (Ctrl+C)
- Cole no Supabase SQL Editor → Run
- ✅ Aguarde: "Success. No rows returned"

### **SCRIPT 3: Migração Notificações** (2-3 min)
📁 `supabase/migrations/002_notifications_schema.sql`
- Copie TODO → Cole no Supabase SQL Editor → Run

### **SCRIPT 4: Verificação Final** (3-5 min)
📁 `supabase/migrations/999_VERIFICACAO_POS_MIGRACAO.sql`
- Copie TODO → Cole no Supabase SQL Editor → Run
- ✅ Deve mostrar: "✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!"

---

## 🚀 **PASSO A PASSO AGORA**

### **1. Abrir Supabase SQL Editor**
1. https://supabase.com → Login
2. Projeto: **MedCannLab 3.0**
3. Menu: **SQL Editor** → **New query**

### **2. Executar Scripts (nesta ordem)**
1. `000_VERIFICACAO_PRE_MIGRACAO.sql`
2. `001_imre_complete_schema.sql` ← **Você já tem!**
3. `002_notifications_schema.sql`
4. `999_VERIFICACAO_POS_MIGRACAO.sql`

**Para cada script:**
- Abra o arquivo
- Ctrl+A (selecionar tudo)
- Ctrl+C (copiar)
- Cole no SQL Editor
- Clique **Run** (ou Ctrl+Enter)

### **3. Verificar Resultado**
Execute esta query:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (table_name LIKE 'imre%' OR table_name = 'notifications')
ORDER BY table_name;
```

**Deve mostrar 6 tabelas!**

---

## ✅ **RESULTADO ESPERADO**

Após executar todos os scripts:
- ✅ 6 tabelas criadas
- ✅ RLS habilitado
- ✅ Sistema pronto

---

## 🐛 **SE DER ERRO**

- `relation already exists` = ✅ OK (tabela já existe)
- `permission denied` = Verificar se está logado como admin
- `syntax error` = Verificar se copiou tudo

---

**Tempo:** 10-15 minutos  
**Dificuldade:** ⭐⭐ (Fácil)

**Status:** 🟢 **Pronto! Comece pelo Passo 1 acima!**

