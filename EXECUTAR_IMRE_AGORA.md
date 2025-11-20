# 🚀 EXECUTAR IMRE 3.0 → 5.0 UNIFICATION - AGORA!

## ✅ **O QUE JÁ FOI FEITO**

1. ✅ SQL completo criado (`IMRE_UNIFICATION_3.0_TO_5.0_COMPLETE.sql`)
2. ✅ Plano de implementação criado
3. ✅ Estrutura completa definida

---

## 🎯 **AGORA - EXECUTAR O SQL**

### **PASSO 1: Acessar Supabase**

1. Abra: https://supabase.com/dashboard
2. Faça login na sua conta
3. Selecione o projeto: **MedCannLab** (ou o nome do seu projeto)
4. No menu lateral, clique em **SQL Editor**

### **PASSO 2: Executar o Script**

1. No SQL Editor, clique em **New Query**
2. Abra o arquivo: `IMRE_UNIFICATION_3.0_TO_5.0_COMPLETE.sql`
3. **Copie TODO o conteúdo** do arquivo
4. **Cole no SQL Editor** do Supabase
5. Clique em **Run** (ou pressione `Ctrl+Enter`)

### **PASSO 3: Verificar Execução**

Após executar, você deve ver:
- ✅ Mensagem de sucesso
- ✅ Notificação: "✅ Todas as 5 tabelas IMRE foram criadas com sucesso!"
- ✅ Resultado da verificação das tabelas

---

## 🔍 **VERIFICAÇÃO MANUAL**

Execute esta query no SQL Editor para verificar:

```sql
-- Verificar tabelas criadas
SELECT 
    tablename,
    schemaname
FROM pg_tables 
WHERE tablename IN (
    'imre_assessments', 
    'imre_semantic_blocks', 
    'imre_semantic_context', 
    'noa_interaction_logs', 
    'clinical_integration'
)
ORDER BY tablename;
```

**Resultado esperado**: 5 linhas (uma para cada tabela)

---

## ✅ **CHECKLIST RÁPIDO**

Após executar o SQL, verifique:

- [ ] 5 tabelas criadas
- [ ] RLS habilitado (verificar na aba "Authentication" > "Policies")
- [ ] Índices criados
- [ ] Funções auxiliares criadas
- [ ] Views criadas

---

## 🧪 **TESTE RÁPIDO**

Execute esta query para testar se está funcionando:

```sql
-- Teste: Criar uma avaliação de teste
INSERT INTO imre_assessments (
    user_id,
    triaxial_data,
    semantic_context,
    completion_status
) VALUES (
    auth.uid(), -- Seu ID de usuário
    '{"emotionalAxis": {"intensity": 0.5}}'::JSONB,
    '{"test": true}'::JSONB,
    'in_progress'
) RETURNING id;
```

Se funcionar, você verá um ID retornado! ✅

---

## 📝 **PRÓXIMOS PASSOS (Após SQL)**

1. **Atualizar Código TypeScript**
   - Verificar `src/lib/imreMigration.ts`
   - Atualizar serviços se necessário

2. **Testar no Frontend**
   - Acessar página de avaliação clínica
   - Criar uma avaliação de teste
   - Verificar salvamento

3. **Migrar Dados (se houver)**
   - Se tiver dados no IndexedDB
   - Usar função de migração

---

## 🆘 **SE DER ERRO**

### **Erro: "relation already exists"**
- Algumas tabelas já existem
- Execute: `DROP TABLE IF EXISTS imre_assessments CASCADE;` (e outras)
- Depois execute o script novamente

### **Erro: "permission denied"**
- Verifique se está logado como admin
- Verifique permissões do projeto

### **Erro: "function already exists"**
- As funções já existem
- O script usa `CREATE OR REPLACE`, então deve funcionar
- Se não funcionar, execute `DROP FUNCTION` primeiro

---

## 🎯 **RESUMO - O QUE FAZER AGORA**

1. ✅ **ABRIR** Supabase SQL Editor
2. ✅ **COPIAR** conteúdo de `IMRE_UNIFICATION_3.0_TO_5.0_COMPLETE.sql`
3. ✅ **COLAR** no SQL Editor
4. ✅ **EXECUTAR** (Run)
5. ✅ **VERIFICAR** se as 5 tabelas foram criadas
6. ✅ **TESTAR** com query de teste

---

## 📞 **PRECISA DE AJUDA?**

Se tiver algum problema:
1. Copie a mensagem de erro
2. Verifique qual tabela/função deu erro
3. Execute as queries de verificação
4. Me avise qual erro apareceu!

---

**🚀 VAMOS LÁ! Execute o SQL agora e me avise o resultado!**

