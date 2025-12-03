# 📧 Guia de Configuração de Email com Domínio Registro.br

## 🎯 Visão Geral

Para usar emails com seu domínio registrado no registro.br (ex: `medcanlab.com.br`), você precisa:

1. **Configurar DNS no registro.br** (adicionar registros SPF, DKIM, DMARC)
2. **Verificar domínio no Resend** (ou outro serviço)
3. **Configurar variáveis de ambiente** no projeto

---

## 📋 Passo a Passo Completo

### **Passo 1: Criar Conta no Resend**

1. Acesse: https://resend.com
2. Crie uma conta gratuita
3. Faça login no dashboard

### **Passo 2: Adicionar Domínio no Resend**

1. No dashboard do Resend, vá em **Domains**
2. Clique em **Add Domain**
3. Digite seu domínio (ex: `medcanlab.com.br`)
4. Clique em **Add**

### **Passo 3: Configurar DNS no Registro.br**

O Resend vai fornecer os registros DNS que você precisa adicionar. Siga estes passos:

#### **3.1. Acessar Gerenciamento de DNS**

1. Acesse: https://registro.br
2. Faça login na sua conta
3. Vá em **Meus Domínios**
4. Clique no seu domínio (ex: `medcanlab.com.br`)
5. Vá em **DNS** ou **Gerenciar DNS**

#### **3.2. Adicionar Registros DNS**

O Resend vai fornecer algo como:

**Registro SPF (TXT):**
```
Nome/Host: @ (ou deixar em branco)
Tipo: TXT
Valor: v=spf1 include:_spf.resend.com ~all
TTL: 3600
```

**Registro DKIM (TXT):**
```
Nome/Host: resend._domainkey (ou o que o Resend fornecer)
Tipo: TXT
Valor: [chave longa fornecida pelo Resend]
TTL: 3600
```

**Registro DMARC (TXT):**
```
Nome/Host: _dmarc
Tipo: TXT
Valor: v=DMARC1; p=none; rua=mailto:dmarc@medcanlab.com.br
TTL: 3600
```

#### **3.3. No Registro.br:**

1. Clique em **Adicionar Registro** ou **Novo Registro**
2. Para cada registro acima:
   - **Nome/Host:** Deixe em branco para `@` ou use o subdomínio fornecido
   - **Tipo:** Selecione **TXT**
   - **Valor:** Cole o valor fornecido pelo Resend
   - **TTL:** 3600 (ou padrão)
3. Salve cada registro

### **Passo 4: Verificar Domínio no Resend**

1. Volte ao dashboard do Resend
2. Na página do domínio, clique em **Verify Domain**
3. Aguarde alguns minutos (pode levar até 24h, mas geralmente é rápido)
4. Quando verificado, você verá um ✅ verde

### **Passo 5: Obter API Key do Resend**

1. No dashboard do Resend, vá em **API Keys**
2. Clique em **Create API Key**
3. Dê um nome (ex: `MedCannLab Production`)
4. Copie a chave (formato: `re_...`)
5. ⚠️ **IMPORTANTE:** Guarde esta chave, ela só aparece uma vez!

### **Passo 6: Configurar no Projeto**

#### **6.1. Criar arquivo `.env.local`**

Na raiz do projeto, crie o arquivo `.env.local`:

```env
# Email Configuration - Resend
VITE_EMAIL_API_KEY=re_sua_chave_aqui
VITE_EMAIL_FROM=noreply@medcanlab.com.br
VITE_EMAIL_FROM_NAME=MedCannLab 3.0
VITE_APP_URL=https://medcanlab.com.br
```

**Substitua:**
- `re_sua_chave_aqui` → A chave que você copiou do Resend
- `noreply@medcanlab.com.br` → Seu domínio (pode usar qualquer subdomínio)
- `https://medcanlab.com.br` → Sua URL de produção

#### **6.2. Configurar no Vercel (Produção)**

1. Acesse: https://vercel.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings** → **Environment Variables**
4. Adicione as mesmas variáveis:
   - `VITE_EMAIL_API_KEY` = `re_sua_chave_aqui`
   - `VITE_EMAIL_FROM` = `noreply@medcanlab.com.br`
   - `VITE_EMAIL_FROM_NAME` = `MedCannLab 3.0`
   - `VITE_APP_URL` = `https://medcanlab.com.br`
5. Marque para **Production**, **Preview** e **Development**
6. Clique em **Save**

### **Passo 7: Testar**

#### **7.1. Teste Local**

No console do navegador (após reiniciar o servidor):

```javascript
import('./utils/testEmail').then(m => m.testEmailSend('seu-email@teste.com'))
```

#### **7.2. Verificar Logs**

- Console do navegador: deve mostrar `✅ E-mail enviado com sucesso!`
- Dashboard do Resend → **Emails**: deve aparecer o email enviado

---

## 🔍 Troubleshooting

### **Problema: Domínio não verifica**

**Soluções:**
1. Aguarde até 24h (propagação DNS)
2. Verifique se os registros DNS estão corretos
3. Use ferramenta de verificação DNS: https://mxtoolbox.com/spf.aspx
4. No Resend, clique em **Re-verify**

### **Problema: Emails vão para spam**

**Soluções:**
1. Verifique se SPF está configurado corretamente
2. Adicione registro DMARC
3. Use um subdomínio específico (ex: `mail.medcanlab.com.br`)

### **Problema: "Email API key não configurada"**

**Soluções:**
1. Verifique se `.env.local` existe na raiz do projeto
2. Reinicie o servidor (`npm run dev`)
3. Verifique se as variáveis começam com `VITE_`
4. No Vercel, verifique se as variáveis estão configuradas

### **Problema: Erro 401/403 no Resend**

**Soluções:**
1. Verifique se a API key está correta
2. Verifique se o domínio está verificado
3. Verifique se está usando o email do domínio verificado em `VITE_EMAIL_FROM`

---

## 📊 Checklist de Configuração

- [ ] Conta criada no Resend
- [ ] Domínio adicionado no Resend
- [ ] Registros DNS adicionados no registro.br:
  - [ ] SPF (TXT)
  - [ ] DKIM (TXT)
  - [ ] DMARC (TXT)
- [ ] Domínio verificado no Resend (✅ verde)
- [ ] API Key criada e copiada
- [ ] Arquivo `.env.local` criado com variáveis
- [ ] Variáveis configuradas no Vercel
- [ ] Teste de envio realizado com sucesso

---

## 🎯 Exemplo de Configuração Completa

### **No Registro.br (DNS):**

```
Tipo: TXT | Nome: @ | Valor: v=spf1 include:_spf.resend.com ~all
Tipo: TXT | Nome: resend._domainkey | Valor: [chave DKIM do Resend]
Tipo: TXT | Nome: _dmarc | Valor: v=DMARC1; p=none; rua=mailto:dmarc@medcanlab.com.br
```

### **No `.env.local`:**

```env
VITE_EMAIL_API_KEY=re_abc123xyz789...
VITE_EMAIL_FROM=noreply@medcanlab.com.br
VITE_EMAIL_FROM_NAME=MedCannLab 3.0
VITE_APP_URL=https://medcanlab.com.br
```

### **No Vercel:**

Mesmas variáveis acima, configuradas em **Environment Variables**.

---

## 📚 Recursos Úteis

- **Resend Dashboard:** https://resend.com/domains
- **Registro.br DNS:** https://registro.br/meus-dominios
- **Verificação DNS:** https://mxtoolbox.com/spf.aspx
- **Documentação Resend:** https://resend.com/docs

---

## ✅ Pronto!

Após seguir todos os passos, seu sistema de email estará configurado e funcionando com seu domínio do registro.br!

**Tempo estimado:** 30-60 minutos (incluindo propagação DNS)

