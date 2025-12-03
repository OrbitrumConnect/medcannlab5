# 🚀 INÍCIO RÁPIDO - EXECUTAR MIGRAÇÕES
## MedCannLab 3.0 - 3 Passos Simples
**Tempo:** 10-15 minutos

---

## ⚡ **EXECUÇÃO RÁPIDA (3 PASSOS)**

### **PASSO 1: Abrir Supabase SQL Editor** (1 min)
1. Acesse: https://supabase.com
2. Login → Selecione projeto **MedCannLab 3.0**
3. Menu lateral → **SQL Editor**
4. Clique em **"New query"**

---

### **PASSO 2: Executar Scripts** (8-12 min)

#### **2.1 Verificação Pré-Migração** (2 min)
- Abra: `supabase/migrations/000_VERIFICACAO_PRE_MIGRACAO.sql`
- **Copie TODO** → Cole no SQL Editor → **Run**

#### **2.2 Migração IMRE** (3-5 min)
- Abra: `supabase/migrations/001_imre_complete_schema.sql`
- **Copie TODO** → Cole no SQL Editor → **Run**
- ✅ Aguarde: "Success. No rows returned"

#### **2.3 Migração Notificações** (2-3 min)
- Abra: `supabase/migrations/002_notifications_schema.sql`
- **Copie TODO** → Cole no SQL Editor → **Run**
- ✅ Aguarde: "Success. No rows returned"

#### **2.4 Verificação Pós-Migração** (3-5 min)
- Abra: `supabase/migrations/999_VERIFICACAO_POS_MIGRACAO.sql`
- **Copie TODO** → Cole no SQL Editor → **Run**
- ✅ Deve mostrar: "✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!"

---

### **PASSO 3: Verificar** (1 min)

Execute esta query rápida:
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

## ✅ **PRONTO!**

Se todas as 6 tabelas aparecerem, as migrações foram bem-sucedidas!

---

## 📚 **GUIAS DETALHADOS**

- **Guia completo:** `EXECUTAR_MIGRACOES_COMPLETO.md`
- **Checklist visual:** `CHECKLIST_EXECUCAO_MIGRACOES.md`
- **Guia rápido:** `EXECUTAR_MIGRACOES_SQL.md`

---

## 🐛 **SE DER ERRO**

1. Verifique se copiou TODO o conteúdo
2. Verifique se está no projeto correto
3. Veja troubleshooting em `EXECUTAR_MIGRACOES_COMPLETO.md`

---

**Tempo total:** 10-15 minutos  
**Dificuldade:** ⭐⭐ (Fácil)

