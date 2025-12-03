# 🚀 GUIA DE EXECUÇÃO - PRÓXIMOS PASSOS
## MedCannLab 3.0 - Configuração e Migrações
**Data:** Janeiro 2025

---

## 📋 **CHECKLIST DE EXECUÇÃO**

### **1. CONFIGURAR SISTEMA DE E-MAIL** ⏱️ 15-20 minutos

#### **Passo 1.1: Criar Conta no Resend**
1. Acesse: https://resend.com
2. Clique em **"Sign Up"** ou **"Get Started"**
3. Crie conta com seu e-mail
4. Verifique seu e-mail (verifique spam se necessário)

#### **Passo 1.2: Obter API Key**
1. Após login, vá em **"API Keys"** no menu lateral
2. Clique em **"Create API Key"**
3. Dê um nome (ex: "MedCannLab Development")
4. Selecione permissões: **"Sending access"**
5. Clique em **"Add"**
6. **COPIE A CHAVE** (formato: `re_xxxxxxxxxxxxx`)
   - ⚠️ **IMPORTANTE:** Você só verá a chave uma vez!

#### **Passo 1.3: Configurar Variáveis de Ambiente**
1. Na raiz do projeto, copie o arquivo de exemplo:
   ```bash
   # Windows PowerShell
   Copy-Item .env.local.example .env.local
   
   # Linux/Mac
   cp .env.local.example .env.local
   ```

2. Abra `.env.local` e preencha:
   ```env
   VITE_EMAIL_API_KEY=re_sua_chave_aqui
   VITE_EMAIL_FROM=noreply@medcanlab.com.br
   VITE_EMAIL_FROM_NAME=MedCannLab 3.0
   VITE_APP_URL=http://localhost:3001
   ```

3. **Substitua `re_sua_chave_aqui`** pela chave copiada do Resend

#### **Passo 1.4: Testar Envio de E-mail**
1. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

2. Abra o console do navegador (F12)

3. Execute o teste:
   ```javascript
   // No console do navegador
   import('./src/utils/testEmail').then(m => 
     m.testEmailSend('seu-email@teste.com')
   )
   ```

4. **Substitua `seu-email@teste.com`** pelo seu e-mail real

5. Verifique:
   - ✅ Console mostra "✅ E-mail enviado com sucesso!"
   - ✅ E-mail chega na caixa de entrada (ou spam)

---

### **2. EXECUTAR MIGRAÇÕES SQL** ⏱️ 10-15 minutos

#### **Passo 2.1: Acessar Supabase SQL Editor**
1. Acesse: https://supabase.com
2. Faça login na sua conta
3. Selecione o projeto **MedCannLab 3.0**
4. No menu lateral, clique em **"SQL Editor"**
5. Clique em **"New query"**

#### **Passo 2.2: Executar Migração IMRE**
1. Abra o arquivo: `supabase/migrations/001_imre_complete_schema.sql`
2. **Copie TODO o conteúdo** do arquivo
3. Cole no SQL Editor do Supabase
4. Clique em **"Run"** (ou pressione Ctrl+Enter)
5. Aguarde a execução (pode levar 10-30 segundos)
6. Verifique se aparece: **"Success. No rows returned"**

#### **Passo 2.3: Verificar Tabelas IMRE Criadas**
Execute esta query no SQL Editor:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'imre%'
ORDER BY table_name;
```

**Resultado esperado:**
- `imre_assessments`
- `imre_semantic_blocks`
- `imre_semantic_context`
- `noa_interaction_logs`
- `clinical_integration`

#### **Passo 2.4: Executar Migração Notificações**
1. Abra o arquivo: `supabase/migrations/002_notifications_schema.sql`
2. **Copie TODO o conteúdo** do arquivo
3. Cole no SQL Editor do Supabase
4. Clique em **"Run"**
5. Aguarde a execução

#### **Passo 2.5: Verificar Tabela Notificações**
Execute esta query:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'notifications';
```

**Resultado esperado:** `notifications`

#### **Passo 2.6: Verificar RLS (Row Level Security)**
Execute esta query:
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('imre_assessments', 'imre_semantic_blocks', 'notifications');
```

**Resultado esperado:** Todas com `rowsecurity = true`

---

### **3. TESTAR SISTEMA COMPLETO** ⏱️ 10-15 minutos

#### **Passo 3.1: Testar Notificações**
1. Acesse a plataforma: http://localhost:3001
2. Faça login
3. Verifique se o ícone de notificações aparece no Header
4. Clique no ícone (sino)
5. Verifique se o painel de notificações abre

#### **Passo 3.2: Testar Integração IA-Plataforma**
1. Acesse o dashboard principal
2. Abra a IA Nôa (botão flutuante)
3. Digite: "Quantos pacientes temos?"
4. Verifique se a IA responde com dados reais

#### **Passo 3.3: Testar Geração de Relatório**
1. Acesse: Avaliação Clínica
2. Complete uma avaliação
3. Verifique se:
   - ✅ Relatório é gerado
   - ✅ Notificação aparece
   - ✅ E-mail é enviado (se configurado)

---

## ✅ **VERIFICAÇÃO FINAL**

### **Checklist de Sucesso:**

- [ ] E-mail de teste enviado e recebido
- [ ] 5 tabelas IMRE criadas no Supabase
- [ ] Tabela `notifications` criada
- [ ] RLS habilitado em todas as tabelas
- [ ] Notificações aparecem no Header
- [ ] IA Nôa responde com dados da plataforma
- [ ] Relatórios geram notificações

---

## 🐛 **TROUBLESHOOTING**

### **Problema: E-mail não envia**

**Solução:**
1. Verifique se API Key está correta no `.env.local`
2. Verifique se servidor foi reiniciado após adicionar variáveis
3. Verifique console do navegador para erros
4. Teste com domínio de teste do Resend primeiro

### **Problema: Erro ao executar SQL**

**Solução:**
1. Verifique se está no projeto correto do Supabase
2. Execute as queries uma de cada vez
3. Verifique se não há tabelas duplicadas (DROP TABLE se necessário)
4. Verifique logs de erro no Supabase

### **Problema: Notificações não aparecem**

**Solução:**
1. Verifique se tabela `notifications` foi criada
2. Verifique RLS policies
3. Verifique console do navegador
4. Verifique se usuário está logado

---

## 📊 **PRÓXIMOS PASSOS APÓS CONFIGURAÇÃO**

1. ⏳ Refatorar `RicardoValencaDashboard.tsx` (5192 → <1000 linhas)
2. ⏳ Melhorar integração Base de Conhecimento
3. ⏳ Executar testes completos
4. ⏳ Criar documentação técnica

---

## 🎯 **RESULTADO ESPERADO**

Após completar todos os passos:

- ✅ Sistema de e-mail funcionando
- ✅ Todas as tabelas IMRE criadas
- ✅ Sistema de notificações operacional
- ✅ Integração IA-Plataforma em tempo real
- ✅ Plataforma 80%+ funcional

---

**Status:** 🟢 **Pronto para execução!**

**Tempo total estimado:** 35-50 minutos

