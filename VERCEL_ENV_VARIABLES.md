# 🔐 VARIÁVEIS DE AMBIENTE - VERCEL

## 📋 **VARIÁVEIS NECESSÁRIAS**

Configure estas variáveis no painel do Vercel em: **Settings → Environment Variables**

---

## 1️⃣ **OPENAI API KEY**

```bash
VITE_OPENAI_API_KEY=sk-proj-sua_chave_openai_aqui
```

**Como obter:**
1. Acesse: https://platform.openai.com/api-keys
2. Crie uma nova API Key
3. Copie a chave (começa com `sk-proj-`)

---

## 2️⃣ **SUPABASE CONFIGURATION**

```bash
VITE_SUPABASE_URL=https://itdjkfubfzmvmuxxjoae.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0ZGprZnViZnptdm11eHhqb2FlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNjUyOTAsImV4cCI6MjA3Njc0MTI5MH0.j9Kfff56O2cWs5ocInVHaUFcaNTS7lrUNwsKBh2KIFM
```

**Status:** ✅ Já estão hardcoded no código, mas recomendado adicionar como variáveis de ambiente

---

## 3️⃣ **API BASE URL (Opcional)**

```bash
VITE_API_BASE_URL=https://api.medcannlab.com
VITE_API_KEY=sua_api_key_aqui
```

**Onde usar:**
- Patient Dashboard API
- Integrações futuras

---

## 4️⃣ **MERCADO PAGO (Opcional - Futuro)**

```bash
VITE_MERCADO_PAGO_PUBLIC_KEY=TEST-sua_chave_publica
VITE_MERCADO_PAGO_ACCESS_TOKEN=TEST-sua_chave_acesso
```

**Como obter:**
1. Acesse: https://www.mercadopago.com.br/developers
2. Crie uma aplicação
3. Obtenha as chaves de teste/produção

---

## 🚀 **COMO CONFIGURAR NO VERCEL**

### **Método 1: Via Painel Web**

1. Acesse: https://vercel.com/dashboard
2. Selecione seu projeto
3. Vá em: **Settings** → **Environment Variables**
4. Clique em: **Add New**
5. Adicione cada variável:
   - **Key:** `VITE_OPENAI_API_KEY`
   - **Value:** `sk-proj-sua_chave_aqui`
   - **Environment:** Selecionar (Production, Preview, Development)
6. Repita para todas as variáveis
7. Clique em **Save**

### **Método 2: Via CLI**

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Adicionar variáveis
vercel env add VITE_OPENAI_API_KEY production
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
```

---

## 📝 **ARQUIVO .env.example (Para Desenvolvimento Local)**

Crie um arquivo `.env` na raiz do projeto:

```env
# OpenAI
VITE_OPENAI_API_KEY=sk-proj-sua_chave_openai_aqui

# Supabase
VITE_SUPABASE_URL=https://itdjkfubfzmvmuxxjoae.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0ZGprZnViZnptdm11eHhqb2FlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNjUyOTAsImV4cCI6MjA3Njc0MTI5MH0.j9Kfff56O2cWs5ocInVHaUFcaNTS7lrUNwsKBh2KIFM

# API
VITE_API_BASE_URL=https://api.medcannlab.com
VITE_API_KEY=sua_api_key_aqui

# Mercado Pago (opcional)
VITE_MERCADO_PAGO_PUBLIC_KEY=TEST-sua_chave_publica
VITE_MERCADO_PAGO_ACCESS_TOKEN=TEST-sua_chave_acesso
```

---

## ⚠️ **IMPORTANTE**

### **Segurança:**
- ✅ **NUNCA** commite o arquivo `.env` no Git
- ✅ O arquivo `.env` está no `.gitignore`
- ✅ Use variáveis de ambiente no Vercel

### **Validação:**
Após configurar, verifique se as variáveis estão sendo lidas:

```bash
# Rodar local
npm run dev

# Verificar no console do navegador
console.log(import.meta.env.VITE_OPENAI_API_KEY)
```

### **Deploy:**
Após adicionar as variáveis, faça novo deploy:

```bash
git push
# O Vercel irá detectar e fazer novo deploy automaticamente
```

---

## 🔍 **VARIÁVEIS ATUALMENTE EM USO**

### **Verificadas no Código:**
- ✅ `VITE_OPENAI_API_KEY` - usada em `noaAssistantIntegration.ts`
- ✅ `VITE_API_BASE_URL` - usada em `patientDashboardAPI.ts`
- ✅ `VITE_API_KEY` - usada em `patientDashboardAPI.ts`

### **Hardcoded (recomendado migrar para env):**
- ⚠️ Supabase URL e Key (em `supabase.ts`)

---

## 📞 **SUPORTE**

Se tiver dúvidas sobre as variáveis:
1. Verifique os logs do Vercel
2. Teste localmente com `.env`
3. Verifique a documentação: https://vercel.com/docs/environment-variables

---

**✅ CONFIGURAÇÃO COMPLETA!**

