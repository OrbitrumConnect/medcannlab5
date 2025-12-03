# 📋 QUAL SCRIPT SQL EXECUTAR?
## MedCannLab 3.0 - Identificação do Script Correto

---

## 🎯 **SCRIPT PRINCIPAL RECOMENDADO**

### **`ADICIONAR_COMPARTILHAMENTO_RELATORIOS.sql`**

Este é o script mais completo e atualizado que:
- ✅ Adiciona colunas de compartilhamento (`shared_with`, `shared_at`, `shared_by`, `assessment_id`)
- ✅ Cria funções para compartilhar relatórios
- ✅ Cria políticas RLS corretas
- ✅ Cria triggers para gerar relatórios automaticamente
- ✅ **Ordem correta:** Colunas criadas ANTES das políticas RLS

**Status:** ✅ **Pronto para execução**

---

## 📝 **OUTROS SCRIPTS DISPONÍVEIS**

### **1. `SUPABASE_TABELAS_ADICIONAIS_LIMPO.sql`**
- Adiciona tabelas adicionais
- Pode conter configurações gerais
- Verificar se já foi executado

### **2. Scripts de Migração IMRE:**
- `supabase/migrations/001_imre_complete_schema.sql`
- `supabase/migrations/002_notifications_schema.sql`
- `supabase/migrations/999_VERIFICACAO_POS_MIGRACAO.sql`

---

## ✅ **RECOMENDAÇÃO**

**Execute primeiro:**
1. `ADICIONAR_COMPARTILHAMENTO_RELATORIOS.sql` ← **COMECE AQUI!**

**Depois (se necessário):**
2. Scripts de migração IMRE (se ainda não executou)
3. Scripts de verificação

---

## 🚀 **COMO EXECUTAR**

Siga o guia: `EXECUTAR_SCRIPT_SQL_AGORA.md`

**Arquivo:** `ADICIONAR_COMPARTILHAMENTO_RELATORIOS.sql`

