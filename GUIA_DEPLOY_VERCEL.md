# 🚀 GUIA - DEPLOY NO VERCEL E LINK PARA COMPARTILHAR

## ❌ PROBLEMA IDENTIFICADO

O erro `ERR_CONNECTION_CLOSED` em `medcanlab1.0.vercel.app` indica que:
- O projeto pode não estar deployado no Vercel
- O nome do projeto pode estar incorreto
- O projeto pode ter sido removido ou pausado

---

## ✅ SOLUÇÃO: FAZER DEPLOY NO VERCEL

### **OPÇÃO 1: Deploy via Vercel Dashboard (Mais Fácil)**

1. **Acesse o Vercel:**
   - Vá para: https://vercel.com
   - Faça login com sua conta (GitHub, GitLab ou email)

2. **Importe o Projeto:**
   - Clique em **"Add New..."** → **"Project"**
   - Conecte seu repositório GitHub/GitLab
   - OU faça upload do código diretamente

3. **Configure o Projeto:**
   - **Framework Preset:** Vite
   - **Root Directory:** `./` (raiz)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

4. **Configure Variáveis de Ambiente:**
   - Vá em **Settings** → **Environment Variables**
   - Adicione:
     ```
     VITE_SUPABASE_URL=https://itdjkfubfzmvmuxxjoae.supabase.co
     VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0ZGprZnViZnptdm11eHhqb2FlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNjUyOTAsImV4cCI6MjA3Njc0MTI5MH0.j9Kfff56O2cWs5ocInVHaUFcaNTS7lrUNwsKBh2KIFM
     ```

5. **Deploy:**
   - Clique em **"Deploy"**
   - Aguarde o build completar (2-5 minutos)
   - Anote a URL gerada (ex: `medcanlab-3-0.vercel.app`)

---

### **OPÇÃO 2: Deploy via CLI (Recomendado)**

1. **Instalar Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Fazer login:**
   ```bash
   vercel login
   ```

3. **Fazer deploy:**
   ```bash
   vercel
   ```
   
   - Primeira vez: seguir as perguntas
   - Escolher: Production
   - Confirmar configurações

4. **Deploy de produção:**
   ```bash
   vercel --prod
   ```

5. **A URL será exibida após o deploy:**
   ```
   ✅ Production: https://seu-projeto.vercel.app
   ```

---

## 🔍 COMO ENCONTRAR A URL CORRETA

### **Após fazer deploy:**

1. **No Vercel Dashboard:**
   - Acesse: https://vercel.com/dashboard
   - Clique no projeto
   - A URL estará no topo da página
   - Formato: `https://nome-do-projeto.vercel.app`

2. **Verificar Domínios:**
   - Vá em **Settings** → **Domains**
   - Você verá:
     - Domínio padrão: `projeto.vercel.app`
     - Domínios personalizados (se configurados)

---

## 📱 LINK PARA COMPARTILHAR COM PACIENTES

### **Após o deploy, o link será:**

```
https://seu-projeto.vercel.app
```

**Exemplos de URLs possíveis:**
- `https://medcanlab-3-0.vercel.app`
- `https://medcanlab3-0.vercel.app`
- `https://medcanlab1-0.vercel.app`
- OU seu domínio personalizado se configurado

---

## 🧪 TESTAR ANTES DE COMPARTILHAR

### **Checklist de Teste:**

1. **Acesse a URL:**
   - Abra o link no navegador
   - Deve carregar a landing page

2. **Teste Login:**
   - Tente fazer login
   - Verifique se redireciona corretamente

3. **Teste PWA:**
   - No mobile: deve aparecer opção "Adicionar à Tela Inicial"
   - No desktop: deve aparecer ícone de instalação

4. **Teste Funcionalidades:**
   - Chat com IA funciona?
   - Avaliação clínica funciona?
   - Dashboard carrega?

---

## 🔧 ALTERNATIVA: USAR LOCALHOST PARA DESENVOLVIMENTO

Se você quiser testar localmente primeiro:

1. **Iniciar servidor local:**
   ```bash
   npm run dev
   ```

2. **Acessar:**
   ```
   http://localhost:3000
   ```

3. **Para compartilhar localmente (apenas na mesma rede):**
   - Descubra seu IP local: `ipconfig` (Windows) ou `ifconfig` (Mac/Linux)
   - Compartilhe: `http://SEU-IP-LOCAL:3000`
   - ⚠️ **Limitação:** Só funciona na mesma rede Wi-Fi

---

## 📋 MENSAGEM PARA ENVIAR AOS PACIENTES

### **Após confirmar a URL correta:**

```
Olá!

Você foi convidado para usar a plataforma MedCannLab 3.0.

📱 Para instalar o app:
1. Abra: https://SUA-URL-AQUI.vercel.app
2. Procure por "Adicionar à Tela Inicial" ou "Instalar App"
3. Clique e confirme
4. O app aparecerá na sua tela inicial

Pronto! Agora você pode acessar sua avaliação clínica pelo app.

Dúvidas? Entre em contato.
```

---

## 🐛 TROUBLESHOOTING

### **Erro: "Project not found"**
- Verifique se o projeto está conectado ao Vercel
- Confirme o nome do projeto no dashboard

### **Erro: "Build failed"**
- Verifique os logs de build no Vercel
- Confirme que todas as dependências estão no `package.json`
- Verifique se as variáveis de ambiente estão configuradas

### **Erro: "Domain not found"**
- O projeto pode não estar deployado
- Faça um novo deploy
- Verifique se o projeto não foi removido

### **PWA não aparece opção de instalar**
- Verifique se está usando HTTPS (obrigatório)
- Confirme que `manifest.json` está na pasta `public/`
- Teste em diferentes navegadores

---

## ✅ PRÓXIMOS PASSOS

1. [ ] Fazer deploy no Vercel
2. [ ] Anotar a URL gerada
3. [ ] Testar todas as funcionalidades
4. [ ] Testar instalação PWA
5. [ ] Atualizar o link nos documentos
6. [ ] Compartilhar com pacientes

---

**🚀 Após fazer o deploy, você terá uma URL como:**
`https://seu-projeto.vercel.app`

**Use essa URL para compartilhar com os pacientes!**

