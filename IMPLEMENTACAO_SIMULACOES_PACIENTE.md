# Implementação: IA como Paciente em Simulações

## 🎯 Objetivo

Implementar a funcionalidade onde a **IA Nôa Esperança assume o papel de paciente** durante simulações e testes de nivelamento, e depois **analisa a entrevista** de acordo com os parâmetros da Arte da Entrevista Clínica.

## 📋 Funcionalidades Necessárias

### 1. **Modo "Simulação" - IA como Paciente**

Quando o usuário iniciar uma simulação, a IA deve:

1. **Reconhecer o comando de simulação**:
   - "Vou iniciar uma simulação..."
   - "Iniciar simulação de paciente..."
   - Mensagem vinda do botão no AlunoDashboard

2. **Assumir papel de paciente**:
   - IA muda de "Nôa Esperança - IA Residente" para "Paciente Simulado"
   - Responde como paciente, não como IA
   - Mantém contexto do caso clínico

3. **Durante a entrevista**:
   - Responde perguntas como paciente
   - Mantém consistência do caso
   - Não quebra o personagem

4. **Ao final da entrevista**:
   - IA volta ao papel de avaliador
   - Analisa a entrevista conforme AEC
   - Fornece feedback estruturado

### 2. **Sistema de Análise da Entrevista**

A IA deve analisar a performance do entrevistador baseado em:

#### **Abertura Exponencial:**
- ✅ Identificação empática presente?
- ✅ Abertura adequada?
- ✅ Estabelecimento de rapport?

#### **Lista Indiciária:**
- ✅ Fez a pergunta "O que trouxe você aqui hoje?"
- ✅ Repetiu "O que mais?" até esgotar queixas?
- ✅ Identificou a queixa principal?

#### **Desenvolvimento Indiciário:**
- ✅ Usou perguntas cercadoras (aspectuais)?
  - Onde?
  - Quando?
  - Como?
  - O que mais sente?
  - O que melhora/piora?
- ✅ Investigou cada item da lista indiciária?

#### **Fechamento Consensual:**
- ✅ Fez revisão geral?
- ✅ Buscou confirmação ("Você concorda?")?
- ✅ Formulou hipóteses sindrômicas?

### 3. **Feedback Estruturado**

Após a análise, a IA deve fornecer:

```
📊 AVALIAÇÃO DA ENTREVISTA - ARTE DA ENTREVISTA CLÍNICA

✅ PONTOS FORTES:
- Abertura empática bem feita
- Lista indiciária completa
- ...

⚠️ PONTOS DE MELHORIA:
- Faltou explorar mais o aspecto "onde" da queixa
- Poderia ter feito mais perguntas "O que mais?"
- ...

🎯 CLASSIFICAÇÃO:
- Abertura Exponencial: 8/10
- Lista Indiciária: 9/10
- Desenvolvimento Indiciário: 7/10
- Fechamento Consensual: 6/10

📈 SUGESTÕES:
- Pratique mais as perguntas aspectuais
- Explore melhor os fatores não tradicionais
- ...
```

## 🔧 Implementação Técnica

### 1. Estados da IA

Adicionar estados para controlar o modo:

```typescript
type IAState = 
  | 'resident'      // Modo normal (IA Residente)
  | 'patient_simulation'  // Modo paciente (durante simulação)
  | 'evaluator'     // Modo avaliador (após simulação)
  | 'leveling_test' // Modo teste de nivelamento
```

### 2. Detecção de Simulação

No `noaResidentAI.ts`, adicionar:

```typescript
private simulationState: {
  isActive: boolean
  role: 'patient' | 'evaluator' | null
  simulationType?: string
  simulationSystem?: string
  conversationHistory: Array<{role: 'user' | 'patient', content: string}>
  startTime?: Date
} = {
  isActive: false,
  role: null,
  conversationHistory: []
}
```

### 3. Processamento de Mensagens

Quando detectar comando de simulação:

1. **Ativar modo simulação**
2. **Definir papel como "patient"**
3. **Gerar perfil do paciente** baseado no sistema/tipo
4. **Iniciar simulação**

Durante a simulação:

1. **Analisar se é comando para encerrar** ("finalizar entrevista", "terminar simulação")
2. **Se não, responder como paciente**
3. **Armazenar conversa para análise posterior**

Ao finalizar:

1. **Mudar papel para "evaluator"**
2. **Analisar conversa armazenada**
3. **Gerar feedback estruturado**
4. **Voltar ao modo "resident"**

## 📝 Exemplo de Fluxo

### Usuário inicia simulação:
```
Usuário: "Vou iniciar uma simulação de paciente renal"
```

### IA responde (como Residente):
```
"Vou iniciar uma simulação focada em Fatores Renais. 
Você será o profissional de saúde e eu serei o paciente. 
[...]
Vamos começar?"
```

### IA muda para modo Paciente:
```
[IA agora responde como paciente]
"Olá doutor. Estou sentindo muita dor nas costas há alguns meses..."
```

### Durante entrevista:
```
Usuário: "Onde você sente essa dor?"
IA (como paciente): "Sinto principalmente na região lombar, do lado direito..."

Usuário: "Quando começou?"
IA (como paciente): "Começou há uns três meses, mais ou menos..."

[...continua como paciente...]
```

### Usuário finaliza:
```
Usuário: "Acho que finalizei a entrevista. Pode avaliar?"
```

### IA volta como Avaliador:
```
"Vou analisar sua entrevista conforme os parâmetros da Arte da Entrevista Clínica...

📊 AVALIAÇÃO DA ENTREVISTA

✅ PONTOS FORTES:
- Excelente abertura empática
- Lista indiciária bem desenvolvida
[...]
"
```

## 🎯 Comandos de Controle

A IA deve reconhecer:

1. **Iniciar simulação**: Detectado automaticamente
2. **Finalizar entrevista**: 
   - "Finalizar entrevista"
   - "Terminar simulação"
   - "Pode avaliar agora?"
3. **Retomar como paciente**: Se usuário quiser continuar

## 🔄 Integração com Sistema Atual

### Arquivos a Modificar:

1. **`src/lib/noaResidentAI.ts`**:
   - Adicionar estado de simulação
   - Adicionar método para gerar resposta como paciente
   - Adicionar método para analisar entrevista
   - Adicionar método para gerar feedback

2. **`src/hooks/useMedCannLabConversation.ts`**:
   - Detectar quando IA está em modo paciente
   - Tratar mensagens durante simulação

3. **`src/pages/AlunoDashboard.tsx`**:
   - Já tem botão de simulação
   - Precisa garantir que mensagem inicial seja clara

## 📊 Estrutura de Análise

### Critérios de Avaliação:

1. **Abertura Exponencial** (0-10)
   - Identificação empática
   - Estabelecimento de rapport
   - Acolhimento adequado

2. **Lista Indiciária** (0-10)
   - Pergunta inicial adequada
   - Uso repetido de "O que mais?"
   - Identificação da queixa principal

3. **Desenvolvimento Indiciário** (0-10)
   - Uso de perguntas aspectuais
   - Profundidade da investigação
   - Exploração de cada queixa

4. **Fechamento Consensual** (0-10)
   - Revisão geral
   - Busca de confirmação
   - Formulação de hipóteses

### Classificação Final:

- **90-100**: Avançado
- **70-89**: Intermediário
- **0-69**: Iniciante

## 🚀 Próximos Passos

1. Implementar estados de simulação na IA
2. Criar sistema de geração de resposta como paciente
3. Implementar análise da entrevista
4. Criar template de feedback estruturado
5. Integrar com sistema de testes de nivelamento
6. Testar fluxo completo

