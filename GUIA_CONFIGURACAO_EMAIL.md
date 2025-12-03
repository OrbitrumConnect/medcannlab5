# 📧 GUIA DE CONFIGURAÇÃO - SISTEMA DE E-MAIL
## MedCannLab 3.0 - EmailService
**Data:** Janeiro 2025

---

## 🎯 **VISÃO GERAL**

O sistema de e-mail foi implementado com suporte a múltiplos provedores:
- ✅ **Resend** (recomendado - mais moderno e simples)
- ✅ **SendGrid** (alternativa)
- ✅ **Supabase Edge Functions** (fallback)

---

## 🚀 **CONFIGURAÇÃO RÁPIDA**

### **Opção 1: Resend (Recomendado)**

#### **1. Criar conta no Resend**
1. Acesse: https://resend.com
2. Crie uma conta gratuita (100 e-mails/dia)
3. Verifique seu domínio ou use domínio de teste

#### **2. Obter API Key**
1. Vá em **API Keys**
2. Clique em **Create API Key**
3. Copie a chave (formato: `re_...`)

#### **3. Configurar no Projeto**
Crie arquivo `.env.local` na raiz do projeto:

```env
VITE_EMAIL_API_KEY=re_sua_chave_aqui
VITE_EMAIL_FROM=noreply@medcanlab.com.br
VITE_EMAIL_FROM_NAME=MedCannLab 3.0
VITE_APP_URL=https://medcanlab.com.br
```

#### **4. Reiniciar servidor de desenvolvimento**
```bash
npm run dev
```

---

### **Opção 2: SendGrid**

#### **1. Criar conta no SendGrid**
1. Acesse: https://sendgrid.com
2. Crie uma conta gratuita (100 e-mails/dia)

#### **2. Obter API Key**
1. Vá em **Settings > API Keys**
2. Clique em **Create API Key**
3. Copie a chave

#### **3. Configurar no Projeto**
```env
VITE_EMAIL_API_KEY=SG.sua_chave_aqui
VITE_EMAIL_FROM=noreply@medcanlab.com.br
VITE_EMAIL_FROM_NAME=MedCannLab 3.0
VITE_APP_URL=https://medcanlab.com.br
```

**Nota:** SendGrid requer modificação no `emailService.ts` para usar endpoint correto.

---

### **Opção 3: Supabase Edge Functions (Fallback)**

#### **1. Criar Edge Function**
Crie arquivo `supabase/functions/send-email/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const { to, subject, html, text } = await req.json()

  // Integrar com Resend ou SendGrid aqui
  // Ou usar serviço de e-mail do Supabase

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { "Content-Type": "application/json" } }
  )
})
```

#### **2. Deploy da Function**
```bash
supabase functions deploy send-email
```

---

## 📋 **TEMPLATES DISPONÍVEIS**

O sistema inclui 7 templates prontos:

1. **`welcome`** - Boas-vindas ao novo usuário
2. **`password_reset`** - Recuperação de senha
3. **`report_ready`** - Relatório clínico disponível
4. **`appointment_reminder`** - Lembrete de agendamento
5. **`prescription_created`** - Nova prescrição criada
6. **`assessment_completed`** - Avaliação concluída
7. **`notification`** - Notificação genérica

---

## 💻 **COMO USAR**

### **Exemplo 1: Enviar E-mail de Boas-vindas**

```typescript
import { emailService } from './services/emailService'

await emailService.sendTemplateEmail('welcome', 'usuario@email.com', {
  userName: 'Dr. João Silva'
})
```

### **Exemplo 2: Enviar E-mail de Relatório**

```typescript
await emailService.sendTemplateEmail('report_ready', 'profissional@email.com', {
  userName: 'Dr. Maria Santos',
  reportId: 'report_123',
  reportTitle: 'Relatório Clínico - João Silva'
})
```

### **Exemplo 3: E-mail Personalizado**

```typescript
await emailService.sendEmail({
  to: 'usuario@email.com',
  subject: 'Assunto Personalizado',
  html: '<h1>Conteúdo HTML</h1>',
  text: 'Conteúdo texto simples'
})
```

---

## 🔧 **INTEGRAÇÃO COM EVENTOS**

O sistema já está integrado com:

### **1. Relatórios Clínicos**
Quando um relatório é gerado, e-mail é enviado automaticamente (se `sendEmail: true`):

```typescript
// Em clinicalReportService.ts
await this.notifyNewReport(report, true) // true = enviar e-mail
```

### **2. Notificações**
O `NotificationService` pode enviar e-mails:

```typescript
await notificationService.notifyNewReport(
  userId,
  reportId,
  patientName,
  true // enviar e-mail
)
```

---

## ⚙️ **CONFIGURAÇÃO AVANÇADA**

### **Configurar Programaticamente**

```typescript
import { emailService } from './services/emailService'

emailService.configure({
  apiKey: 're_sua_chave',
  fromEmail: 'noreply@medcanlab.com.br',
  fromName: 'MedCannLab 3.0',
  baseUrl: 'https://medcanlab.com.br'
})
```

---

## 🧪 **TESTES**

### **Testar Envio de E-mail**

```typescript
// Em um componente ou console
import { emailService } from './services/emailService'

// Testar template
await emailService.sendTemplateEmail('welcome', 'seu-email@teste.com', {
  userName: 'Teste'
})

// Verificar logs no console
```

---

## 🐛 **TROUBLESHOOTING**

### **Problema: E-mails não estão sendo enviados**

1. **Verificar API Key:**
   ```typescript
   console.log(import.meta.env.VITE_EMAIL_API_KEY)
   ```

2. **Verificar logs:**
   - Abra o console do navegador
   - Procure por erros de e-mail

3. **Verificar domínio:**
   - Resend requer verificação de domínio
   - Use domínio de teste para desenvolvimento

### **Problema: "Email API key não configurada"**

- Verifique se `.env.local` existe
- Verifique se variáveis começam com `VITE_`
- Reinicie o servidor após adicionar variáveis

### **Problema: E-mails vão para spam**

- Verifique SPF/DKIM no domínio
- Use domínio verificado
- Evite palavras-chave de spam no assunto

---

## 📊 **ESTATÍSTICAS E MONITORAMENTO**

### **Resend Dashboard**
- Acesse: https://resend.com/emails
- Veja estatísticas de envio
- Monitore taxa de abertura (se configurado)

### **SendGrid Dashboard**
- Acesse: https://app.sendgrid.com
- Veja estatísticas detalhadas
- Configure webhooks

---

## 🔒 **SEGURANÇA**

### **Boas Práticas:**

1. ✅ **Nunca commite API keys no Git**
2. ✅ **Use variáveis de ambiente**
3. ✅ **Adicione `.env.local` ao `.gitignore`**
4. ✅ **Use domínio verificado em produção**
5. ✅ **Configure rate limiting**

---

## 📝 **PRÓXIMOS PASSOS**

1. ⏳ Configurar domínio verificado (produção)
2. ⏳ Adicionar tracking de abertura (opcional)
3. ⏳ Configurar webhooks para eventos
4. ⏳ Criar mais templates conforme necessário

---

## ✅ **CHECKLIST DE CONFIGURAÇÃO**

- [ ] Conta criada no Resend/SendGrid
- [ ] API Key obtida
- [ ] Variáveis de ambiente configuradas
- [ ] `.env.local` criado
- [ ] Servidor reiniciado
- [ ] Teste de envio realizado
- [ ] Domínio verificado (produção)
- [ ] Templates testados

---

**Status:** ✅ Sistema de e-mail implementado e pronto para uso!

**Próximo passo:** Configurar API Key e testar envio.

