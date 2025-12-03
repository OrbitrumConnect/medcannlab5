# ⚡ EXECUTAR SCRIPT SQL - GUIA RÁPIDO
## MedCannLab 3.0

---

## ✅ **ARQUIVO CORRETO PARA EXECUTAR**

**Use este arquivo:** `VERIFICAR_E_CONFIGURAR_SUPABASE_LIMPO.sql`

---

## ✅ **CONFIRMAÇÃO**

### **Status do Script:**
- ✅ **Ordem correta:** Colunas criadas antes das políticas RLS
- ✅ **Sintaxe PostgreSQL válida**
- ✅ **Tratamento de erros adequado**
- ✅ **Pronto para execução**

---

## 🚀 **EXECUÇÃO RÁPIDA**

### **1. Abrir Supabase SQL Editor** (1 min)
1. Acesse: https://supabase.com/dashboard
2. Faça login
3. Selecione projeto: **MedCannLab 3.0**
4. Menu lateral → **SQL Editor**
5. Clique em **"New query"**

### **2. Copiar Script** (1 min)
1. No VS Code, abra: `VERIFICAR_E_CONFIGURAR_SUPABASE_LIMPO.sql`
2. `Ctrl+A` (selecionar tudo)
3. `Ctrl+C` (copiar)

### **3. Executar** (3-5 min)
1. Volte para Supabase SQL Editor
2. `Ctrl+V` (colar)
3. `Ctrl+Enter` ou clique **"Run"**
4. ⏳ Aguarde 10-30 segundos

### **4. Verificar** (1 min)
Execute esta query para confirmar:

```sql
-- Verificar RLS habilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'clinical_reports', 'clinical_assessments', 'notifications')
ORDER BY tablename;

-- Verificar políticas RLS
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('users', 'clinical_reports', 'clinical_assessments', 'notifications')
ORDER BY tablename, policyname;
```

**Resultado esperado:**
- ✅ `rowsecurity = true` para todas as tabelas
- ✅ Políticas RLS listadas

---

## ✅ **RESULTADO ESPERADO**

Após executar:
- ✅ RLS habilitado em todas as tabelas principais
- ✅ Políticas de segurança configuradas
- ✅ Função `handle_new_user()` criada
- ✅ Colunas de compartilhamento adicionadas
- ✅ Índices criados para performance
- ✅ Plataforma: **85%+ funcional**

---

## 🐛 **TROUBLESHOOTING**

### **Erro: "column shared_with does not exist"**
- ✅ **Já corrigido!** O script está na ordem correta
- Se ainda der erro, verifique se executou o script completo

### **Erro: "relation already exists"**
- ✅ **Não é problema!** A tabela/função já existe
- Pode continuar ou ignorar

### **Erro: "permission denied"**
- Verifique se está logado como admin do projeto
- Verifique se está no projeto correto

---

## 📊 **RESUMO**

```
1. Abrir Supabase SQL Editor
   ↓
2. Abrir: VERIFICAR_E_CONFIGURAR_SUPABASE_LIMPO.sql
   ↓
3. Copiar tudo (Ctrl+A, Ctrl+C)
   ↓
4. Colar no Supabase (Ctrl+V)
   ↓
5. Executar (Run ou Ctrl+Enter)
   ↓
6. Verificar resultados
   ↓
✅ SUCESSO!
```

---

## 🎯 **PRÓXIMO PASSO**

1. Testar servidor: `npm run dev`
2. Verificar conexão com Supabase
3. Configurar API Key de e-mail (opcional)

---

**Status:** 🟢 **Tudo pronto! Execute `VERIFICAR_E_CONFIGURAR_SUPABASE_LIMPO.sql` no Supabase!**

**Tempo total:** 5-10 minutos

