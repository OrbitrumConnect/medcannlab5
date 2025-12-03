# ✅ CHECKLIST DE EXECUÇÃO - MIGRAÇÕES SQL
## MedCannLab 3.0 - Supabase
**Data:** Janeiro 2025  
**Tempo total:** 10-15 minutos

---

## 📋 **CHECKLIST VISUAL**

### **🔍 FASE 1: PREPARAÇÃO** (2 minutos)

- [ ] Acessei https://supabase.com e fiz login
- [ ] Selecionei o projeto **MedCannLab 3.0**
- [ ] Abri o **SQL Editor** (menu lateral)
- [ ] Criei uma nova query (**"New query"**)

---

### **🔍 FASE 2: VERIFICAÇÃO PRÉ-MIGRAÇÃO** (2 minutos)

- [ ] Abri arquivo: `supabase/migrations/000_VERIFICACAO_PRE_MIGRACAO.sql`
- [ ] Copiei TODO o conteúdo do arquivo
- [ ] Colei no SQL Editor do Supabase
- [ ] Cliquei em **"Run"** (ou Ctrl+Enter)
- [ ] Verifiquei o resultado:
  - [ ] ✅ Nenhuma tabela encontrada = Pronto para migração
  - [ ] ⚠️ Tabelas existem = Decidir se recria ou atualiza

**Resultado:** _________________________________

---

### **📊 FASE 3: MIGRAÇÃO IMRE** (3-5 minutos)

- [ ] Abri arquivo: `supabase/migrations/001_imre_complete_schema.sql`
- [ ] Copiei TODO o conteúdo (arquivo grande - ~430 linhas)
- [ ] Colei no SQL Editor do Supabase
- [ ] Cliquei em **"Run"** (Ctrl+Enter)
- [ ] Aguardei execução (10-30 segundos)
- [ ] Verifiquei resultado:
  - [ ] ✅ "Success. No rows returned"
  - [ ] ❌ Erro (anotar abaixo)

**Resultado:** _________________________________  
**Erro (se houver):** _________________________________

---

### **🔔 FASE 4: MIGRAÇÃO NOTIFICAÇÕES** (2-3 minutos)

- [ ] Abri arquivo: `supabase/migrations/002_notifications_schema.sql`
- [ ] Copiei TODO o conteúdo (~250 linhas)
- [ ] Colei no SQL Editor do Supabase
- [ ] Cliquei em **"Run"**
- [ ] Aguardei execução (5-15 segundos)
- [ ] Verifiquei resultado:
  - [ ] ✅ "Success. No rows returned"
  - [ ] ❌ Erro (anotar abaixo)

**Resultado:** _________________________________  
**Erro (se houver):** _________________________________

---

### **✅ FASE 5: VERIFICAÇÃO PÓS-MIGRAÇÃO** (3-5 minutos)

- [ ] Abri arquivo: `supabase/migrations/999_VERIFICACAO_POS_MIGRACAO.sql`
- [ ] Copiei TODO o conteúdo
- [ ] Colei no SQL Editor do Supabase
- [ ] Cliquei em **"Run"**
- [ ] Aguardei execução (10-20 segundos)
- [ ] Verifiquei resultados:
  - [ ] ✅ 5 tabelas IMRE criadas
  - [ ] ✅ 1 tabela notifications criada
  - [ ] ✅ RLS habilitado em todas
  - [ ] ✅ Políticas RLS configuradas
  - [ ] ✅ Índices criados
  - [ ] ✅ Funções auxiliares criadas
  - [ ] ✅ Testes de inserção passaram
  - [ ] ✅ Mensagem: "✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!"

**Resultado Final:** _________________________________

---

## 🔍 **VERIFICAÇÃO MANUAL RÁPIDA**

Execute estas queries para confirmação:

### **Query 1: Verificar Tabelas**
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

**Resultado obtido:** _________________________________

---

### **Query 2: Verificar RLS**
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

**Resultado obtido:** _________________________________

---

## 🎯 **RESULTADO FINAL**

- [ ] ✅ Todas as migrações executadas com sucesso
- [ ] ✅ Todas as tabelas criadas
- [ ] ✅ RLS habilitado e configurado
- [ ] ✅ Sistema pronto para uso

---

## 📝 **NOTAS**

**Data de execução:** _________________  
**Hora de início:** _________________  
**Hora de conclusão:** _________________  
**Tempo total:** _________________  

**Problemas encontrados:**  
_________________________________  
_________________________________  
_________________________________  

**Soluções aplicadas:**  
_________________________________  
_________________________________  
_________________________________  

---

## 🎉 **PRÓXIMOS PASSOS**

Após migrações bem-sucedidas:

1. ⏳ Testar notificações no Header da plataforma
2. ⏳ Testar criação de avaliações IMRE
3. ⏳ Testar integração IA-Plataforma
4. ⏳ Executar script de seed (opcional)

---

**Status:** 🟢 **Pronto para execução!**

**Guia completo:** `EXECUTAR_MIGRACOES_COMPLETO.md`

