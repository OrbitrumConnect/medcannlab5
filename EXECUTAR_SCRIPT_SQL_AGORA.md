# ⚡ EXECUTAR SCRIPT SQL AGORA
## MedCannLab 3.0 - Guia Rápido
**Tempo:** 5-10 minutos

---

## 🎯 **O QUE FAZER**

Executar o script SQL `VERIFICAR_E_CONFIGURAR_SUPABASE_LIMPO.sql` no Supabase.

---

## 🚀 **PASSO A PASSO**

### **1. Abrir Supabase SQL Editor** (1 min)

1. Acesse: **https://supabase.com/dashboard**
2. Faça login
3. Selecione o projeto: **MedCannLab 3.0**
4. No menu lateral, clique em **"SQL Editor"**
5. Clique em **"New query"**

✅ **Pronto? Continue para o próximo passo**

---

### **2. Localizar o Script** (1 min)

1. No VS Code, abra o arquivo:
   - **`VERIFICAR_E_CONFIGURAR_SUPABASE_LIMPO.sql`** ← **ARQUIVO CORRETO PARA EXECUTAR!**
2. **Selecione tudo:** `Ctrl+A`
3. **Copie:** `Ctrl+C`

✅ **Pronto? Continue para o próximo passo**

---

### **3. Executar no Supabase** (3-5 min)

1. Volte para o Supabase SQL Editor
2. **Cole:** `Ctrl+V`
3. Clique em **"Run"** (ou pressione `Ctrl+Enter`)
4. ⏳ **Aguarde 10-30 segundos**

**Resultado esperado:**
- ✅ Mensagens de sucesso
- ✅ "ALTER TABLE" executado
- ✅ "CREATE POLICY" executado
- ✅ "CREATE INDEX" executado
- ✅ Sem erros

✅ **Pronto? Continue para verificação**

---

### **4. Verificar Execução** (1 min)

Execute esta query no SQL Editor para confirmar:

```sql
-- Verificar se RLS está habilitado
SELECT 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'clinical_reports', 'clinical_assessments', 'notifications')
ORDER BY tablename;

-- Verificar políticas RLS criadas
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('users', 'clinical_reports', 'clinical_assessments', 'notifications')
ORDER BY tablename, policyname;
```

**Deve mostrar:**
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

## 🐛 **SE DER ERRO**

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
2. Abrir arquivo: VERIFICAR_E_CONFIGURAR_SUPABASE_LIMPO.sql
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

## 🎯 **PRÓXIMO PASSO APÓS EXECUTAR**

1. Testar servidor: `npm run dev`
2. Verificar conexão com Supabase
3. Configurar API Key de e-mail (opcional)

---

**Status:** 🟢 **Script pronto! Execute no Supabase SQL Editor!**

**Tempo total:** 5-10 minutos

