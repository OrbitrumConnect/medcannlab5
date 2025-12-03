# 📋 GUIA DE EXECUÇÃO - MIGRAÇÃO IMRE
## MedCannLab 3.0 - Passo a Passo

---

## ✅ **O QUE FOI CRIADO**

Script SQL completo e consolidado: `supabase/migrations/001_imre_complete_schema.sql`

**Conteúdo:**
- ✅ 5 tabelas IMRE completas
- ✅ Índices para performance
- ✅ Triggers para atualização automática
- ✅ RLS (Row Level Security) configurado
- ✅ Funções auxiliares
- ✅ Views para análise
- ✅ Verificação automática

---

## 🚀 **COMO EXECUTAR**

### **Opção 1: Via Supabase Dashboard (Recomendado)**

1. **Acesse o Supabase Dashboard**
   - URL: https://supabase.com/dashboard
   - Faça login na sua conta

2. **Navegue até o SQL Editor**
   - No menu lateral, clique em **"SQL Editor"**
   - Ou acesse diretamente: `https://supabase.com/dashboard/project/[SEU_PROJECT_ID]/sql`

3. **Crie uma nova query**
   - Clique em **"New query"**

4. **Cole o conteúdo do script**
   - Abra o arquivo: `supabase/migrations/001_imre_complete_schema.sql`
   - Copie TODO o conteúdo (Ctrl+A, Ctrl+C)
   - Cole no editor SQL (Ctrl+V)

5. **Execute o script**
   - Clique no botão **"Run"** ou pressione `Ctrl+Enter`
   - Aguarde a execução (pode levar alguns segundos)

6. **Verifique o resultado**
   - Você deve ver mensagens de sucesso
   - Procure por: `✅ Todas as 5 tabelas IMRE foram criadas com sucesso!`

---

### **Opção 2: Via Supabase CLI (Avançado)**

```bash
# Instalar Supabase CLI (se ainda não tiver)
npm install -g supabase

# Fazer login
supabase login

# Linkar ao projeto
supabase link --project-ref [SEU_PROJECT_REF]

# Executar migração
supabase db push
```

---

## ✅ **VERIFICAÇÃO PÓS-EXECUÇÃO**

### **1. Verificar Tabelas Criadas**

Execute no SQL Editor:

```sql
SELECT 
  table_name,
  row_security as rls_enabled
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'imre_assessments',
  'imre_semantic_blocks',
  'imre_semantic_context',
  'noa_interaction_logs',
  'clinical_integration'
)
ORDER BY table_name;
```

**Resultado esperado:** 5 linhas, todas com `rls_enabled = true`

---

### **2. Verificar Índices**

```sql
SELECT 
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN (
  'imre_assessments',
  'imre_semantic_blocks',
  'imre_semantic_context',
  'noa_interaction_logs',
  'clinical_integration'
)
ORDER BY tablename, indexname;
```

**Resultado esperado:** Múltiplos índices por tabela

---

### **3. Verificar Políticas RLS**

```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN (
  'imre_assessments',
  'imre_semantic_blocks',
  'imre_semantic_context',
  'noa_interaction_logs',
  'clinical_integration'
)
ORDER BY tablename, policyname;
```

**Resultado esperado:** Múltiplas políticas por tabela

---

### **4. Testar Inserção de Dados**

```sql
-- Teste básico de inserção
INSERT INTO imre_assessments (
  user_id,
  triaxial_data,
  semantic_context
) VALUES (
  auth.uid(), -- Use seu user_id real
  '{"emotional": {}, "cognitive": {}, "behavioral": {}}'::jsonb,
  '{}'::jsonb
)
RETURNING id, created_at;
```

**Resultado esperado:** Uma linha inserida com sucesso

---

## 🐛 **RESOLUÇÃO DE PROBLEMAS**

### **Erro: "relation already exists"**

**Causa:** Tabelas já existem no banco

**Solução:**
```sql
-- Verificar se as tabelas existem
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'imre%';

-- Se existirem, você pode:
-- 1. Deletar e recriar (CUIDADO: perde dados!)
DROP TABLE IF EXISTS clinical_integration CASCADE;
DROP TABLE IF EXISTS noa_interaction_logs CASCADE;
DROP TABLE IF EXISTS imre_semantic_context CASCADE;
DROP TABLE IF EXISTS imre_semantic_blocks CASCADE;
DROP TABLE IF EXISTS imre_assessments CASCADE;

-- 2. Ou executar apenas as partes que faltam do script
```

---

### **Erro: "permission denied"**

**Causa:** Sem permissões adequadas

**Solução:**
- Verifique se está usando a conta de administrador do Supabase
- Ou use a Service Role Key para operações administrativas

---

### **Erro: "function already exists"**

**Causa:** Funções já foram criadas anteriormente

**Solução:** O script usa `CREATE OR REPLACE`, então deve funcionar. Se persistir:
```sql
DROP FUNCTION IF EXISTS calculate_semantic_stability(UUID);
DROP FUNCTION IF EXISTS get_latest_semantic_context(UUID);
DROP FUNCTION IF EXISTS update_imre_updated_at();
DROP FUNCTION IF EXISTS update_semantic_context_updated_at();
```

---

## 📊 **ESTRUTURA DAS TABELAS**

### **1. imre_assessments**
Armazena avaliações IMRE completas
- **Campos principais:** `triaxial_data`, `semantic_context`, `completion_status`
- **Relacionamentos:** `user_id`, `patient_id`

### **2. imre_semantic_blocks**
Blocos semânticos individuais (37 blocos)
- **Campos principais:** `semantic_content`, `emotional_weight`, `cognitive_complexity`
- **Relacionamentos:** `assessment_id`

### **3. imre_semantic_context**
Contexto semântico persistente
- **Campos principais:** `semantic_memory`, `emotional_patterns`
- **Relacionamentos:** `user_id`

### **4. noa_interaction_logs**
Logs de interação com IA Nôa
- **Campos principais:** `interaction_content`, `noa_response`
- **Relacionamentos:** `user_id`, `assessment_id`

### **5. clinical_integration**
Integração com dados clínicos
- **Campos principais:** `imre_clinical_correlations`, `risk_assessment`
- **Relacionamentos:** `user_id`, `assessment_id`

---

## ✅ **CHECKLIST DE EXECUÇÃO**

- [ ] Script SQL copiado e colado no Supabase SQL Editor
- [ ] Script executado com sucesso
- [ ] Mensagem de sucesso apareceu
- [ ] Verificação de tabelas executada (5 tabelas encontradas)
- [ ] Verificação de índices executada
- [ ] Verificação de RLS executada
- [ ] Teste de inserção executado com sucesso
- [ ] Sistema IMRE funcionando no código

---

## 🎯 **PRÓXIMOS PASSOS**

Após executar a migração:

1. **Testar no código:**
   - Verificar se `UnifiedAssessmentSystem` consegue inserir dados
   - Testar criação de avaliação IMRE completa
   - Verificar visualização no dashboard

2. **Fase 1.3:**
   - Verificar fluxo completo do protocolo IMRE
   - Testar: Investigação → Metodologia → Resultado → Evolução

---

## 📞 **SUPORTE**

**Arquivo do script:** `supabase/migrations/001_imre_complete_schema.sql`  
**Documentação:** Este guia  
**Status:** ✅ Pronto para execução

---

**Última atualização:** Janeiro 2025

