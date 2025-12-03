# 📧 TESTE RÁPIDO DE E-MAIL
## MedCannLab 3.0 - EmailService
**Data:** Janeiro 2025

---

## 🚀 **TESTE EM 3 PASSOS (2 MINUTOS)**

### **Passo 1: Configurar .env.local**
```bash
# Copiar arquivo de exemplo
Copy-Item .env.local.example .env.local

# Editar e adicionar sua API Key do Resend
# VITE_EMAIL_API_KEY=re_sua_chave_aqui
```

### **Passo 2: Reiniciar Servidor**
```bash
npm run dev
```

### **Passo 3: Testar no Console do Navegador**
```javascript
// Abra o console (F12) e execute:
import('./src/utils/testEmail').then(m => 
  m.testEmailSend('seu-email@teste.com')
)
```

**Substitua `seu-email@teste.com` pelo seu e-mail real**

---

## ✅ **RESULTADO ESPERADO**

Console mostra:
```
🧪 Testando envio de e-mail...
📧 Destinatário: seu-email@teste.com
✅ API Key configurada
📨 Enviando e-mail de teste (template: welcome)...
✅ E-mail enviado com sucesso!
📬 Verifique sua caixa de entrada (e spam)
```

E você recebe um e-mail de boas-vindas!

---

## 🐛 **SE NÃO FUNCIONAR**

1. Verifique se API Key está correta
2. Verifique se servidor foi reiniciado
3. Verifique console para erros
4. Veja `GUIA_CONFIGURACAO_EMAIL.md` para mais detalhes

---

**Tempo estimado:** 2 minutos

