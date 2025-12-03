# 🧪 GUIA DE TESTE - AVALIAÇÃO CLÍNICA INICIAL

## 📋 Pré-requisitos

1. **Aplicação rodando**
   - Execute `npm run dev` ou `yarn dev`
   - Acesse: `http://localhost:5173` (ou a porta configurada)

2. **Usuário de teste criado**
   - Você precisa estar logado como paciente
   - Se não tiver, crie uma conta na página de registro

---

## 🎯 PASSO A PASSO PARA TESTAR

### **OPÇÃO 1: Via Página de Agendamento** (Recomendado)

1. **Acesse a página de agendamento**
   - Faça login como paciente
   - Navegue para: `/app/clinica/paciente/agendamentos`
   - Ou clique em "Agendar Consulta" no dashboard

2. **Inicie a avaliação**
   - Na página de agendamento, você verá um card azul com:
     - **"🧠 Avaliação Clínica Inicial"**
     - Botão: **"Iniciar Avaliação Clínica"**
   - Clique no botão

3. **A IA iniciará automaticamente**
   - Você será redirecionado para o chat da Nôa Esperança
   - A IA enviará automaticamente a mensagem de início da avaliação
   - Aguarde 1-2 segundos para a mensagem aparecer

4. **Responda as perguntas da IA**
   - A IA fará **UMA pergunta por vez** (protocolo pausado)
   - Responda cada pergunta antes de continuar
   - Exemplo de respostas:
     ```
     Pergunta 1: "Por favor, apresente-se e diga em que posso ajudar hoje."
     Resposta: "Olá, sou João Silva, tenho 35 anos e estou com dores de cabeça frequentes."
     
     Pergunta 2: "Quando começaram esses sintomas?"
     Resposta: "Há cerca de 3 meses."
     
     Pergunta 3: "Onde você sente essas dores?"
     Resposta: "Principalmente na região frontal e nas têmporas."
     ```

5. **Continue respondendo**
   - A IA fará perguntas sobre:
     - Motivo principal da consulta
     - Sintomas e quando começaram
     - História médica
     - História familiar
     - Medicações atuais
     - Hábitos de vida

6. **Finalização**
   - Quando a IA concluir todas as fases (I-M-R-E), ela dirá:
     ```
     ✅ AVALIAÇÃO CLÍNICA INICIAL CONCLUÍDA COM SUCESSO!
     
     Seu relatório clínico foi gerado e salvo no seu dashboard.
     ```

---

### **OPÇÃO 2: Via Dashboard do Paciente**

1. **Acesse o dashboard**
   - Faça login como paciente
   - Navegue para: `/app/clinica/paciente/dashboard`

2. **Encontre o card de avaliação**
   - Procure pelo card roxo/azul com:
     - **"🤖 Avaliação Clínica Inicial pela IA Residente"**
     - Botão: **"Iniciar avaliação clínica"**

3. **Clique no botão**
   - Você será redirecionado para o chat da Nôa Esperança

4. **Inicie manualmente**
   - Digite no chat: `"Iniciar Avaliação Clínica Inicial IMRE Triaxial"`
   - Ou: `"Quero fazer uma avaliação clínica inicial"`

5. **Siga os passos 4-6 da Opção 1**

---

### **OPÇÃO 3: Via Chat Direto**

1. **Acesse o chat da Nôa**
   - Navegue para: `/app/chat-noa-esperanca`

2. **Inicie a conversa**
   - Digite: `"Iniciar Avaliação Clínica Inicial IMRE Triaxial"`
   - Ou: `"Quero fazer uma avaliação clínica inicial"`

3. **Siga os passos 4-6 da Opção 1**

---

## ✅ VERIFICAÇÃO DO TESTE

### **1. Verificar se a avaliação está funcionando**

Durante o teste, verifique:
- ✅ A IA faz apenas UMA pergunta por vez
- ✅ A IA aguarda sua resposta antes de continuar
- ✅ As perguntas são adaptadas às suas respostas anteriores
- ✅ O tom é empático e acolhedor

### **2. Verificar se o relatório foi gerado**

Após a conclusão:

1. **No chat da IA**
   - Você verá a mensagem de confirmação
   - A mensagem incluirá o ID do relatório

2. **No dashboard do paciente**
   - Acesse: `/app/clinica/paciente/dashboard`
   - Procure pelo card de relatórios clínicos
   - Você deve ver:
     - Data de geração do relatório
     - Botão "Compartilhar com profissional"
     - Botão "Ver relatório completo"

3. **No banco de dados** (opcional)
   - Acesse o Supabase
   - Vá para a tabela `clinical_reports`
   - Verifique se há um registro com:
     - `patient_id` = seu ID de usuário
     - `status` = 'completed'
     - `report_type` = 'initial_assessment'

---

## 🐛 PROBLEMAS COMUNS E SOLUÇÕES

### **Problema: A IA não inicia automaticamente**

**Solução:**
- Aguarde 2-3 segundos após clicar no botão
- Se não iniciar, digite manualmente: `"Iniciar Avaliação Clínica Inicial IMRE Triaxial"`

### **Problema: A IA faz múltiplas perguntas de uma vez**

**Solução:**
- Isso não deveria acontecer com as correções implementadas
- Se acontecer, recarregue a página e tente novamente
- Verifique o console do navegador (F12) para erros

### **Problema: O relatório não aparece no dashboard**

**Solução:**
- Aguarde alguns segundos após a conclusão
- Recarregue a página do dashboard
- Verifique se a avaliação foi realmente concluída (mensagem de confirmação)
- Verifique o console do navegador para erros

### **Problema: Erro ao salvar no banco**

**Solução:**
- Verifique se a tabela `clinical_reports` existe no Supabase
- Verifique as permissões RLS (Row Level Security)
- Verifique o console do navegador para detalhes do erro

---

## 📊 CHECKLIST DE TESTE

Use este checklist para garantir que tudo está funcionando:

- [ ] Consegui acessar a página de agendamento
- [ ] O botão "Iniciar Avaliação Clínica" está visível
- [ ] Ao clicar, fui redirecionado para o chat da Nôa
- [ ] A IA iniciou a conversa automaticamente
- [ ] A IA fez apenas UMA pergunta por vez
- [ ] Respondi todas as perguntas
- [ ] A avaliação foi concluída com sucesso
- [ ] Recebi mensagem de confirmação
- [ ] O relatório aparece no dashboard
- [ ] Consigo ver os detalhes do relatório
- [ ] Consigo compartilhar o relatório com profissional

---

## 🎯 TESTE RÁPIDO (5 minutos)

Para um teste rápido:

1. Login como paciente
2. Vá para `/app/clinica/paciente/agendamentos`
3. Clique em "Iniciar Avaliação Clínica"
4. Responda apenas as primeiras 3-4 perguntas
5. Verifique se a IA está fazendo uma pergunta por vez
6. Verifique se está funcionando corretamente

---

## 📝 NOTAS IMPORTANTES

- ⚠️ **Avaliação completa leva 10-15 minutos**
- ⚠️ **Responda com sinceridade** para um teste mais realista
- ⚠️ **Não feche o navegador** durante a avaliação
- ⚠️ **Aguarde a conclusão** antes de verificar o relatório

---

**Bons testes! 🌬️**

