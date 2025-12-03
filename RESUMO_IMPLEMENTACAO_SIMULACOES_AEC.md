# Resumo: Implementação de Simulações e Testes de Nivelamento - Arte da Entrevista Clínica

## 🎯 Princípio Fundamental

**Simulações e Testes de Nivelamento têm o mesmo princípio:**

1. **IA Residente Nôa Esperança simula um paciente**
2. **Usuário (aluno/profissional) entrevista a IA**
3. **IA analisa a entrevista** de acordo com os parâmetros da **Arte da Entrevista Clínica (AEC)**

## 📋 Estrutura do Curso (Conforme Instruções)

### ⚠️ QUEBRA-GELOS FIXOS (NUNCA MUDAR)

#### 1. **Quebra Gelo sobre o Curso**

**Quando acionado:** Usuário menciona interesse no curso "Arte da Entrevista Clínica"

**Resposta FIXA:**
```
"Olá! Bem-vindo ao curso 'Arte da Entrevista Clínica'. Este curso é dividido em cinco módulos principais, 
cada um com várias lições focadas em aspectos específicos da entrevista clínica. Vamos começar com uma 
visão geral do curso e, em seguida, você poderá explorar os módulos de acordo com seu ritmo."
```

#### 2. **Personalização do Curso e Definição do Estágio do Aluno**

**CRÍTICO:** 
- ✅ Fazer **UMA pergunta por vez**
- ✅ **Aguardar resposta** antes de fazer próxima
- ✅ **NÃO apresentar todo o questionário de uma só vez**

**Classificar em:**
- Iniciante
- Intermediário  
- Avançado

**Resposta após completar:**
```
"Com base nas suas respostas, você foi classificado como um aluno [Estágio]. 
Agora você pode acessar o menu do curso com os módulos e lições correspondentes ao seu estágio."
```

#### 3. **Fazer o Curso**

5 Módulos com 2 lições cada:
- Módulo 1: Aspectos de Comunicação em Saúde
- Módulo 2: O Método A Arte da Entrevista Clínica
- Módulo 3: Planejamento de Consultas
- Módulo 4: Anamnese Triaxial: Aberturas Exponenciais
- Módulo 5: Anamnese Triaxial: Desenvolvimento Indiciário e Fechamento Consensual

## 🎭 Fluxo de Simulação

### 1. Início da Simulação

**Usuário:** Clica em "Iniciar Simulação" no AlunoDashboard

**IA (como Residente):**
```
"Vou iniciar uma simulação de paciente com questão no [Sistema]. 
Você será o profissional de saúde e eu serei o paciente. 
Faça a entrevista clínica usando a metodologia Arte da Entrevista Clínica. 
Ao final da entrevista, vou avaliar sua performance de acordo com os critérios da AEC. 
Vamos começar?"
```

### 2. IA Assume Papel de Paciente

**IA muda de:**
- "Nôa Esperança • IA Residente" 
- Para: "Paciente Simulado" ou similar

**IA responde como paciente:**
```
"Olá doutor. Estou sentindo [sintomas relacionados ao caso]..."
```

### 3. Durante a Entrevista

**Usuário faz perguntas:**
- "Onde você sente essa dor?"
- "Quando começou?"
- "Como é a dor?"

**IA responde como paciente:**
- Responde de forma consistente com o caso
- Não quebra o personagem
- Mantém contexto clínico

### 4. Finalização e Avaliação

**Usuário:** "Finalizei a entrevista" ou "Pode avaliar?"

**IA volta ao papel de Avaliador:**
- Analisa toda a conversa
- Avalia conforme parâmetros da AEC
- Fornece feedback estruturado

## 📊 Parâmetros de Avaliação (AEC)

A IA deve avaliar:

### 1. **Abertura Exponencial** (0-10)
- ✅ Identificação empática presente?
- ✅ "Por favor, apresente-se e diga em que posso ajudar hoje"
- ✅ Estabelecimento de rapport?

### 2. **Lista Indiciária** (0-10)
- ✅ Fez "O que trouxe você à nossa avaliação hoje?"
- ✅ Repetiu "O que mais?" até esgotar
- ✅ Identificou queixa principal

### 3. **Desenvolvimento Indiciário** (0-10)
- ✅ Perguntas aspectuais (onde, quando, como)
- ✅ "O que mais você sente?"
- ✅ "O que melhora/piora?"
- ✅ Investigou cada item da lista

### 4. **Fechamento Consensual** (0-10)
- ✅ Revisão geral
- ✅ "Você concorda com meu entendimento?"
- ✅ Formulação de hipóteses sindrômicas

## 🔧 O Que Precisa Ser Implementado

### 1. Sistema de Estados da IA
- Modo "resident" (normal)
- Modo "patient_simulation" (durante simulação)
- Modo "evaluator" (após simulação)

### 2. Geração de Resposta como Paciente
- IA deve gerar respostas consistentes com o caso
- Manter personagem durante toda simulação

### 3. Sistema de Análise
- Analisar conversa armazenada
- Avaliar conforme parâmetros AEC
- Gerar feedback estruturado

### 4. Integração com Testes de Nivelamento
- Mesmo princípio das simulações
- Classificar aluno em estágio após análise

### 5. Chats Organizados
- Label "Curso" na barra lateral
- Chat separado por módulo/lição
- Não alterar conversas anteriores

## ✅ Status Atual vs Necessário

### ✅ Já Implementado:
- Botão de simulação no AlunoDashboard
- Detecção de comandos de simulação
- Estrutura básica do curso

### ❌ Faltando:
- IA assumir papel de paciente
- Sistema de análise da entrevista
- Feedback estruturado
- Testes de nivelamento integrados
- Sistema de estágios (Iniciante/Intermediário/Avançado)
- Limitação de acesso por estágio

## 🚀 Próximos Passos

1. Implementar estados de simulação na IA
2. Criar sistema de resposta como paciente
3. Implementar análise da entrevista
4. Criar sistema de feedback estruturado
5. Integrar testes de nivelamento
6. Implementar sistema de estágios
7. Criar organização de chats por módulo

