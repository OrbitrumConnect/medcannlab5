# 🔐 CONFIGURAR OAUTH NO SUPABASE
## MedCannLab 3.0 - Correção de Autenticação
**Data:** Janeiro 2025

---

## 🎯 **PROBLEMA**

Erro 400 ao tentar login com Google:
```
Failed to load resource: the server responded with a status of 400
```

**Causa:** Redirect URLs não configuradas no Supabase.

---

## ✅ **SOLUÇÃO PASSO A PASSO**

### **PASSO 1: Acessar Configurações de Autenticação**

1. Acesse: https://supabase.com
2. Login → Projeto **MedCannLab 3.0**
3. Menu lateral → **Authentication**
4. Aba **URL Configuration**

---

### **PASSO 2: Adicionar Redirect URLs**

Na seção **"Redirect URLs"**, adicione:

```
https://artedaentrevistaclinicacomnoaespera.vercel.app/**
http://localhost:3001/**
http://localhost:3000/**
https://medcanlab.com.br/**
```

**Formato:** Uma URL por linha, com `/**` no final para permitir todas as rotas.

---

### **PASSO 3: Configurar Google OAuth (se necessário)**

1. **No Supabase:**
   - Authentication → **Providers**
   - Clique em **Google**
   - Habilite se estiver desabilitado

2. **No Google Cloud Console:**
   - Acesse: https://console.cloud.google.com
   - Selecione seu projeto
   - **APIs & Services** → **Credentials**
   - Edite seu OAuth 2.0 Client ID
   - Em **Authorized redirect URIs**, adicione:
     ```
     https://[seu-projeto].supabase.co/auth/v1/callback
     ```

3. **Copiar credenciais:**
   - **Client ID** → Cole no Supabase
   - **Client Secret** → Cole no Supabase
   - Salve no Supabase

---

### **PASSO 4: Verificar Site URL**

No Supabase → Authentication → URL Configuration:

**Site URL** deve ser:
```
https://artedaentrevistaclinicacomnoaespera.vercel.app
```

Ou sua URL de produção principal.

---

## 🧪 **TESTAR**

1. Acesse sua aplicação
2. Tente fazer login com Google
3. Deve redirecionar corretamente

---

## 📝 **URLs IMPORTANTES**

### **Desenvolvimento:**
- `http://localhost:3001`
- `http://localhost:3000`

### **Produção:**
- `https://artedaentrevistaclinicacomnoaespera.vercel.app`
- `https://medcanlab.com.br` (se tiver)

---

## ⚠️ **NOTA**

**Isso não é urgente para executar migrações SQL!**

Você pode:
- ✅ Executar migrações SQL agora (não precisa de OAuth)
- ⏳ Configurar OAuth depois (para login funcionar)

---

**Status:** 🟡 **Não bloqueia migrações, mas deve ser corrigido para produção**

