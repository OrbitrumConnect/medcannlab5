# 🚀 EXECUTAR MIGRAÇÕES SQL - GUIA COMPLETO
## MedCannLab 3.0 - Supabase
**Data:** Janeiro 2025  
**Tempo estimado:** 10-15 minutos

---

## 📋 **CHECKLIST DE EXECUÇÃO**

### **PASSO 1: VERIFICAÇÃO PRÉ-MIGRAÇÃO** ⏱️ 2 minutos

1. **Acessar Supabase SQL Editor**
   - https://supabase.com → Login
   - Selecione projeto **MedCannLab 3.0**
   - Menu lateral → **SQL Editor**
   - Clique em **"New query"**

2. **Executar Verificação Pré-Migração**
   - Abra: `supabase/migrations/000_VERIFICACAO_PRE_MIGRACAO.sql`
   - **Copie TODO** o conteúdo
   - Cole no SQL Editor
   - Clique em **"Run"** (Ctrl+Enter)
   - **Verifique o resultado:**
     - ✅ Se não existem tabelas = Pronto para migração
     - ⚠️ Se existem tabelas = Decidir se recria ou atualiza

---

### **PASSO 2: EXECUTAR MIGRAÇÃO IMRE** ⏱️ 3-5 minutos

1. **Abrir Script de Migração**
   - Abra: `supabase/migrations/001_imre_complete_schema.sql`
   - **Copie TODO** o conteúdo (é um arquivo grande!)

2. **Executar no Supabase**
   - Cole no SQL Editor
   - Clique em **"Run"** (Ctrl+Enter)
   - ⏳ Aguarde execução (10-30 segundos)
   - ✅ Deve aparecer: **"Success. No rows returned"**

3. **Verificar Erros**
   - Se aparecer erro, anote a mensagem
   - Erros comuns:
     - `relation already exists` = Tabela já existe
     - `permission denied` = Verificar permissões
     - `syntax error` = Verificar se copiou tudo

---

### **PASSO 3: EXECUTAR MIGRAÇÃO NOTIFICAÇÕES** ⏱️ 2-3 minutos

1. **Abrir Script de Migração**
   - Abra: `supabase/migrations/002_notifications_schema.sql`
   - **Copie TODO** o conteúdo

2. **Executar no Supabase**
   - Cole no SQL Editor
   - Clique em **"Run"**
   - ⏳ Aguarde execução (5-15 segundos)
   - ✅ Deve aparecer: **"Success. No rows returned"**

---

### **PASSO 4: VERIFICAÇÃO PÓS-MIGRAÇÃO** ⏱️ 3-5 minutos

1. **Executar Verificação Completa**
   - Abra: `supabase/migrations/999_VERIFICACAO_POS_MIGRACAO.sql`
   - **Copie TODO** o conteúdo
   - Cole no SQL Editor
   - Clique em **"Run"**
   - ⏳ Aguarde execução (pode levar 10-20 segundos)

2. **Verificar Resultados**
   - ✅ **Tabelas criadas:** Deve mostrar 5 tabelas IMRE + 1 notifications
   - ✅ **RLS habilitado:** Todas as tabelas devem ter `rls_enabled = true`
   - ✅ **Políticas RLS:** Deve mostrar várias políticas criadas
   - ✅ **Índices:** Deve mostrar índices criados
   - ✅ **Funções:** Deve mostrar funções auxiliares
   - ✅ **Testes de inserção:** Deve mostrar sucesso

3. **Verificar Mensagens Finais**
   - Deve aparecer: **"✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!"**
   - Se aparecer aviso, verifique os resultados acima

---

## ✅ **VERIFICAÇÃO MANUAL RÁPIDA**

Execute estas queries para verificação rápida:

### **1. Verificar Tabelas Criadas**
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

**Resultado esperado:**
- `imre_assessments`
- `imre_semantic_blocks`
- `imre_semantic_context`
- `noa_interaction_logs`
- `clinical_integration`
- `notifications`

### **2. Verificar RLS**
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

**Resultado esperado:** Todas com `rowsecurity = true`

---

## 🐛 **TROUBLESHOOTING**

### **Erro: "relation already exists"**

**Solução:**
```sql
-- Se quiser recriar, execute antes:
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS clinical_integration CASCADE;
DROP TABLE IF EXISTS noa_interaction_logs CASCADE;
DROP TABLE IF EXISTS imre_semantic_context CASCADE;
DROP TABLE IF EXISTS imre_semantic_blocks CASCADE;
DROP TABLE IF EXISTS imre_assessments CASCADE;
```

⚠️ **ATENÇÃO:** Isso apagará todos os dados existentes!

---

### **Erro: "permission denied"**

**Solução:**
- Verifique se está logado como admin do projeto
- Verifique se está no projeto correto do Supabase
- Tente executar como Service Role (cuidado!)

---

### **Erro: "syntax error"**

**Solução:**
- Verifique se copiou TODO o conteúdo do arquivo
- Verifique se não há caracteres especiais corrompidos
- Tente copiar novamente do arquivo original

---

### **Tabelas não aparecem após migração**

**Solução:**
1. Verifique se está no schema `public`
2. Execute: `SELECT * FROM information_schema.tables WHERE table_schema = 'public'`
3. Verifique logs do Supabase para erros

---

## 📊 **RESULTADO ESPERADO**

Após executar todas as migrações:

- ✅ **6 tabelas criadas** (5 IMRE + 1 notifications)
- ✅ **RLS habilitado** em todas as tabelas
- ✅ **Políticas RLS** configuradas
- ✅ **Índices** criados para performance
- ✅ **Funções auxiliares** criadas
- ✅ **Views** criadas para análise
- ✅ **Triggers** configurados

---

## 🎯 **PRÓXIMOS PASSOS**

Após migrações bem-sucedidas:

1. ⏳ Testar notificações no Header
2. ⏳ Testar criação de avaliações IMRE
3. ⏳ Testar integração IA-Plataforma
4. ⏳ Executar script de seed (opcional)

---

## ✅ **CHECKLIST FINAL**

- [ ] Verificação pré-migração executada
- [ ] Migração IMRE executada com sucesso
- [ ] Migração Notificações executada com sucesso
- [ ] Verificação pós-migração executada
- [ ] Todas as tabelas criadas
- [ ] RLS habilitado
- [ ] Testes de inserção passaram

---

**Status:** 🟢 **Pronto para execução!**

**Tempo total:** 10-15 minutos

**Arquivos necessários:**
- `000_VERIFICACAO_PRE_MIGRACAO.sql`
- `001_imre_complete_schema.sql`
- `002_notifications_schema.sql`
- `999_VERIFICACAO_POS_MIGRACAO.sql`

