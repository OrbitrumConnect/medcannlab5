# 🧪 Guia de Teste - Sistema de Simulações

## ✅ Pré-requisitos

1. Servidor de desenvolvimento rodando (`npm run dev`)
2. Usuário logado como **aluno** (eixo ensino)
3. Navegador aberto na página do dashboard do aluno

## 🎯 Como Testar

### **Teste 1: Iniciar Simulação Básica**

1. **Acesse o Dashboard do Aluno:**
   - URL: `/app/ensino/aluno/dashboard`
   - Ou: `/app/aluno-dashboard`

2. **Vá para a aba "Simulações":**
   - Clique na aba "Simulações" no dashboard

3. **Selecione Sistema e Tipo:**
   - **Sistema:** Sistema Respiratório
   - **Tipo:** Entrevista Clínica Geral

4. **Clique em "Iniciar Simulação de Paciente"**

5. **O que deve acontecer:**
   - ✅ Chat deve abrir automaticamente
   - ✅ IA deve enviar mensagem inicial como **paciente**:
     - "Olá doutor. Me chamo Paciente Simulado, tenho 45 anos. Estou sentindo Dor há alguns dias."
   - ✅ Interface deve mostrar que é uma simulação ativa

### **Teste 2: Conduzir Entrevista**

1. **Faça perguntas como profissional:**
   - "Onde você sente a dor?"
   - "Quando começou?"
   - "Como é a dor?"
   - "O que mais você sente?"

2. **O que deve acontecer:**
   - ✅ IA deve responder como **paciente**, não como Nôa Esperança
   - ✅ Respostas devem ser consistentes com o caso clínico
   - ✅ Personagem do paciente deve ser mantido

### **Teste 3: Finalizar e Avaliar**

1. **Digite um comando para finalizar:**
   - "Finalizar entrevista"
   - Ou: "Terminar simulação"
   - Ou: "Pode avaliar?"

2. **O que deve acontecer:**
   - ✅ IA deve voltar ao papel de **avaliador**
   - ✅ Deve analisar a entrevista conforme parâmetros da AEC
   - ✅ Deve gerar feedback estruturado com:
     - Pontuação por categoria (Abertura, Lista Indiciária, etc.)
     - Pontos fortes
     - Pontos de melhoria
     - Sugestões

### **Teste 4: Simulação de Fatores Renais**

1. **Selecione:**
   - **Sistema:** Sistema Urinário
   - **Tipo:** Fatores Renais

2. **Inicie simulação**

3. **Verifique:**
   - ✅ Perfil do paciente deve mencionar Doença Renal Crônica
   - ✅ Mensagem inicial deve estar adequada ao tipo

### **Teste 5: Simulação de TEA**

1. **Selecione:**
   - **Sistema:** Sistema Nervoso
   - **Tipo:** Diagnóstico TEA

2. **Inicie simulação**

3. **Verifique:**
   - ✅ Perfil deve ser adequado para diagnóstico de TEA

## 🔍 O Que Verificar

### **Durante a Simulação:**

- [ ] IA responde como paciente, não como Nôa
- [ ] Respostas são consistentes com o caso
- [ ] Histórico da conversa está sendo registrado
- [ ] Personagem do paciente não é quebrado

### **Na Análise:**

- [ ] Feedback é estruturado e claro
- [ ] Pontuação é gerada para cada categoria
- [ ] Sugestões são relevantes e acionáveis
- [ ] Análise está baseada nos parâmetros da AEC

### **Após Finalizar:**

- [ ] Simulação é finalizada corretamente
- [ ] Estado é limpo para nova simulação
- [ ] Não há erros no console

## 🐛 Problemas Comuns

### **Problema 1: IA não inicia como paciente**
**Sintoma:** IA continua respondendo como Nôa Esperança

**Solução:**
- Verificar se mensagem inicial contém "vou iniciar uma simulação"
- Verificar console do navegador por erros
- Verificar se estado de simulação foi criado

### **Problema 2: IA não finaliza simulação**
**Sintoma:** IA continua como paciente mesmo após pedir para finalizar

**Solução:**
- Verificar se comando de finalização foi reconhecido
- Verificar logs no console
- Tentar comando diferente ("finalizar", "terminar", "avaliar")

### **Problema 3: Feedback não é gerado**
**Sintoma:** Simulação finaliza sem análise

**Solução:**
- Verificar se há conversa registrada no histórico
- Verificar logs de análise
- Verificar se método `finalizeSimulation` foi chamado

## 📝 Logs para Verificar

No console do navegador, procure por:

```
🎭 Simulação de paciente iniciada: { simulationType, simulationSystem }
🎭 Simulação ativa detectada, processando como paciente...
✅ Simulação finalizada e analisada
```

## 🎯 Critérios de Sucesso

- ✅ Simulação inicia corretamente
- ✅ IA assume papel de paciente
- ✅ Entrevista pode ser conduzida
- ✅ Simulação pode ser finalizada
- ✅ Análise é gerada com feedback estruturado
- ✅ Pontuação reflete a qualidade da entrevista

## 📊 Exemplo de Teste Completo

```
1. Iniciar simulação (Sistema Respiratório)
2. IA: "Olá doutor. Me chamo Paciente Simulado..."
3. Usuário: "Onde você sente a dor?"
4. IA (como paciente): "Sinto principalmente na região lombar..."
5. Usuário: "Quando começou?"
6. IA (como paciente): "Começou há uns três meses..."
7. Usuário: "Finalizar entrevista"
8. IA (como avaliador): "📊 AVALIAÇÃO DA ENTREVISTA..."
   - Abertura Exponencial: X/10
   - Lista Indiciária: X/10
   - Desenvolvimento Indiciário: X/10
   - Fechamento Consensual: X/10
   - Sugestões: [...]
```

## 🚀 Próximos Passos Após Teste

Se os testes passarem, podemos:
1. Melhorar perfis de paciente (mais realistas)
2. Integrar com Assistant API para respostas mais inteligentes
3. Refinar análise da entrevista (mais detalhada)
4. Adicionar mais tipos de simulação
5. Implementar testes de nivelamento

