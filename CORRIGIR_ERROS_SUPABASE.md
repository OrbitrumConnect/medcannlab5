# 🔧 CORRIGIR ERROS SUPABASE
## MedCannLab 3.0 - Solução de Problemas
**Data:** Janeiro 2025

---

## 🐛 **ERROS IDENTIFICADOS**

### **Erro 1: "The message port closed before a response was received"**
- **Tipo:** Erro do navegador (não crítico)
- **Causa:** Extensões do navegador ou comunicação entre workers
- **Impacto:** Baixo - geralmente não afeta funcionalidade

### **Erro 2: "Failed to load resource: 400" (OAuth Google)**
- **Tipo:** Erro de autenticação OAuth
- **Causa:** Redirect URL não configurada no Supabase
- **Impacto:** Alto - impede login com Google

---

## ✅ **SOLUÇÕES**

### **SOLUÇÃO 1: Erro "message port closed"**

Este erro geralmente é causado por extensões do navegador. **Não é crítico** e não afeta as migrações SQL.

**O que fazer:**
1. Ignorar este erro (não afeta funcionalidade)
2. Ou testar em modo anônimo/incógnito
3. Ou desabilitar extensões temporariamente

**Não é necessário corrigir para executar migrações SQL.**

---

### **SOLUÇÃO 2: Erro OAuth 400 (Google)**

Este erro indica que a URL de redirecionamento não está configurada no Supabase.

#### **Passo 1: Verificar URL de Redirecionamento**

A URL que está falhando:
```
https://artedaentrevistaclinicacomnoaespera.vercel.app/...
```

#### **Passo 2: Configurar no Supabase**

1. **Acesse Supabase Dashboard:**
   - https://supabase.com → Login
   - Selecione projeto **MedCannLab 3.0**

2. **Vá em Authentication:**
   - Menu lateral → **Authentication**
   - Aba **URL Configuration**

3. **Adicione Redirect URLs:**
   ```
   https://artedaentrevistaclinicacomnoaespera.vercel.app/**
   http://localhost:3001/**
   http://localhost:3000/**
   ```

4. **Vá em Providers:**
   - Aba **Providers**
   - Clique em **Google**
   - Verifique se está habilitado
   - Verifique se **Client ID** e **Client Secret** estão configurados

5. **Adicione Authorized Redirect URIs:**
   - No Google Cloud Console (se usando Google OAuth)
   - Adicione: `https://artedaentrevistaclinicacomnoaespera.vercel.app/**`

---

## 🚀 **PARA EXECUTAR MIGRAÇÕES SQL**

**IMPORTANTE:** Esses erros NÃO impedem a execução das migrações SQL!

Você pode executar as migrações mesmo com esses erros:

1. **Acesse SQL Editor diretamente:**
   - https://supabase.com → Login
   - Projeto: **MedCannLab 3.0**
   - Menu: **SQL Editor** (não precisa de autenticação OAuth)

2. **Execute os scripts SQL normalmente:**
   - Os erros de OAuth não afetam o SQL Editor
   - Você pode executar as migrações agora mesmo

---

## 🔍 **VERIFICAÇÃO RÁPIDA**

### **Teste 1: Acessar SQL Editor**
- ✅ Se consegue acessar SQL Editor = Pode executar migrações
- ❌ Se não consegue acessar = Problema de login (resolver OAuth primeiro)

### **Teste 2: Executar Query Simples**
```sql
SELECT version();
```

- ✅ Se retorna versão do PostgreSQL = Tudo OK para migrações
- ❌ Se dá erro = Verificar permissões

---

## 📋 **CHECKLIST DE CORREÇÃO**

### **Para Executar Migrações (URGENTE):**
- [ ] Acessar SQL Editor (funciona mesmo com erros OAuth)
- [ ] Executar scripts de migração
- [ ] Verificar criação das tabelas

### **Para Corrigir OAuth (Pode fazer depois):**
- [ ] Adicionar redirect URLs no Supabase
- [ ] Configurar Google OAuth (se necessário)
- [ ] Testar login com Google

---

## 🎯 **RECOMENDAÇÃO**

### **AGORA (Para continuar):**
1. ✅ **Ignore os erros** (não afetam SQL Editor)
2. ✅ **Execute as migrações SQL** normalmente
3. ✅ **Continue com o processo**

### **DEPOIS (Para corrigir OAuth):**
1. ⏳ Configure redirect URLs no Supabase
2. ⏳ Teste login com Google
3. ⏳ Verifique outras URLs de produção

---

## 💡 **NOTA IMPORTANTE**

**Os erros que você viu são de AUTENTICAÇÃO (login), não de BANCO DE DADOS.**

**Para executar migrações SQL:**
- ✅ Não precisa de OAuth funcionando
- ✅ Não precisa fazer login com Google
- ✅ Só precisa acessar SQL Editor (que funciona com login normal do Supabase)

---

## 🚀 **PRÓXIMO PASSO**

**Continue executando as migrações SQL normalmente!**

Os erros não impedem:
- ✅ Acesso ao SQL Editor
- ✅ Execução de scripts SQL
- ✅ Criação de tabelas
- ✅ Configuração de RLS

**Siga o guia:** `INICIO_RAPIDO_MIGRACOES.md` ou `EXECUTAR_MIGRACOES_COMPLETO.md`

---

**Status:** 🟢 **Pode continuar! Os erros não bloqueiam as migrações.**

