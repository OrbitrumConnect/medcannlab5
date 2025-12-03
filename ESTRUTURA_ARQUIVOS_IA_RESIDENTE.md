# 🌳 ESTRUTURA DE ARQUIVOS - IA RESIDENTE NÔA ESPERANÇA

## 📁 Estrutura Completa em Árvore

```
medcanlab3.0/
│
├── 📘 DOCUMENTAÇÃO
│   ├── DOCUMENTO_MESTRE_PLATAFORMA_COMPLETO.md ⭐
│   ├── ARQUIVOS_IA_RESIDENTE_COMPLETO.md ⭐
│   ├── ESTRUTURA_ARQUIVOS_IA_RESIDENTE.md (este arquivo)
│   ├── NOA_RESIDENT_AI_INTEGRATION.md
│   ├── NOA_ESPERANCA_IMPLEMENTATION.md
│   └── SISTEMA_TREINAMENTO_NOA.md
│
├── 🧠 CORE DA IA (src/lib/)
│   │
│   ├── ⭐ noaResidentAI.ts (2,700 linhas) - ARQUIVO PRINCIPAL
│   │   ├── Classe: NoaResidentAI
│   │   ├── Interface: AIResponse, AIMemory, IMREAssessmentState
│   │   ├── Métodos principais:
│   │   │   ├── processMessage()
│   │   │   ├── processAssessment()
│   │   │   ├── processInvestigationStep()
│   │   │   ├── processMethodologyStep()
│   │   │   ├── processResultStep()
│   │   │   ├── processEvolutionStep()
│   │   │   ├── generateAndSaveReport()
│   │   │   ├── detectIntent()
│   │   │   ├── composeAssistantPrompt()
│   │   │   └── getAssistantResponse()
│   │   └── Protocolo IMRE Triaxial completo
│   │
│   ├── noaEsperancaCore.ts
│   │   ├── Classe: NoaEsperancaCore
│   │   ├── Interface: NoaEsperancaConfig, NoaInteraction
│   │   └── Configuração base e personalidade
│   │
│   ├── noaEngine.ts
│   │   └── Engine de processamento da IA
│   │
│   ├── noaTrainingSystem.ts
│   │   ├── Sistema de treinamento
│   │   ├── Memória persistente
│   │   └── Simulações de pacientes
│   │
│   ├── ⭐ noaAssistantIntegration.ts
│   │   ├── Classe: NoaAssistantIntegration
│   │   ├── Assistant ID: asst_CAW142M53uLBLbVzERZMa7HF
│   │   ├── Métodos:
│   │   │   ├── sendMessage()
│   │   │   ├── createThread()
│   │   │   ├── runAssistant()
│   │   │   └── getLastMessage()
│   │   └── Integração híbrida OpenAI
│   │
│   ├── noaCommandSystem.ts
│   │   └── Sistema de comandos especiais
│   │
│   ├── noaKnowledgeBase.ts
│   │   └── Integração com base de conhecimento
│   │
│   ├── noaPermissionManager.ts
│   │   └── Gerenciamento de permissões
│   │
│   ├── noaIntegration.ts
│   │   └── Integrações gerais
│   │
│   ├── ⭐ platformFunctionsModule.ts
│   │   ├── Detecção de intenções de plataforma
│   │   ├── Execução de ações
│   │   └── Integração com funcionalidades
│   │
│   ├── ⭐ clinicalReportService.ts
│   │   ├── Classe: ClinicalReportService
│   │   ├── Interface: ClinicalReport
│   │   └── Geração e salvamento de relatórios
│   │
│   ├── patientDashboardAPI.ts
│   │   └── API para dashboard do paciente
│   │
│   ├── responsibilityTransferSystem.ts
│   │   └── Transferência de responsabilidades
│   │
│   ├── filePermissionTransferSystem.ts
│   │   └── Permissões de arquivos
│   │
│   ├── ragSystem.ts
│   │   ├── Classe: RAGSystem
│   │   └── Retrieval-Augmented Generation
│   │
│   └── localLLM.ts
│       └── Modelos de linguagem locais
│
├── 🎨 COMPONENTES (src/components/)
│   │
│   ├── ⭐ NoaConversationalInterface.tsx - COMPONENTE PRINCIPAL
│   │   ├── Chat multimodal (texto + voz)
│   │   ├── Speech Recognition (STT)
│   │   ├── Text-to-Speech (TTS)
│   │   ├── Upload de arquivos
│   │   ├── Controle de microfone (15s max, 5s inatividade)
│   │   └── Delay 800ms antes de desligar microfone
│   │
│   ├── ⭐ ClinicalAssessmentChat.tsx
│   │   ├── Chat para avaliação IMRE
│   │   ├── Protocolo pausado (1 pergunta por vez)
│   │   └── Preservação da narrativa
│   │
│   ├── NoaEsperancaAvatar.tsx
│   │   ├── Avatar animado
│   │   ├── Indicadores de atividade
│   │   └── Sistema IMRE visual
│   │
│   ├── NoaAvatar.tsx
│   │   └── Avatar básico
│   │
│   ├── NoaAnimatedAvatar.tsx
│   │   └── Avatar com animações avançadas
│   │
│   ├── NoaCapabilities.tsx
│   │   └── Exibição de capacidades
│   │
│   ├── NoaPermissions.tsx
│   │   └── Gerenciamento de permissões
│   │
│   ├── NOAChatBox.tsx
│   │   └── Caixa de chat simplificada
│   │
│   ├── ChatAIResident.tsx
│   │   └── Chat específico para IA Residente
│   │
│   ├── MicrophoneButton.tsx
│   │   └── Botão de microfone
│   │
│   └── MobileChatInput.tsx
│       └── Input otimizado para mobile
│
├── 🪝 HOOKS (src/hooks/)
│   │
│   ├── ⭐ useMedCannLabConversation.ts - HOOK PRINCIPAL
│   │   ├── Gerenciamento de conversa
│   │   ├── Integração com NoaResidentAI
│   │   ├── TTS e STT
│   │   ├── Controle de microfone
│   │   └── Salvamento de interações
│   │
│   ├── useNOAChat.ts
│   │   └── Hook específico para chat Nôa
│   │
│   ├── useMicrophone.ts
│   │   └── Controle de microfone
│   │
│   └── useChatSystem.ts
│       └── Sistema genérico de chat
│
├── 🌐 CONTEXTOS (src/contexts/)
│   │
│   ├── ⭐ NoaContext.tsx - CONTEXTO PRINCIPAL
│   │   ├── Provider da IA Residente
│   │   ├── Instância singleton
│   │   └── Hook: useNoa()
│   │
│   ├── ⭐ NoaPlatformContext.tsx
│   │   ├── Dados da plataforma
│   │   ├── Sincronização Supabase
│   │   └── Pacientes, relatórios, notificações
│   │
│   └── RealtimeContext.tsx
│       └── Atualizações em tempo real
│
├── 🔌 SERVIÇOS (src/services/)
│   │
│   ├── ⭐ knowledgeBaseIntegration.ts
│   │   ├── Classe: KnowledgeBaseIntegration
│   │   ├── Busca semântica
│   │   └── Integração com documentos
│   │
│   └── noaKnowledgeBase.ts
│       └── Serviço específico Nôa
│
├── 📄 PÁGINAS (src/pages/)
│   │
│   ├── ⭐ PatientNOAChat.tsx - PÁGINA PRINCIPAL
│   │   ├── Rota: /app/chat-noa-esperanca
│   │   ├── Rota: /app/clinica/paciente/avaliacao-clinica
│   │   └── Chat completo com IA
│   │
│   ├── ClinicalAssessment.tsx
│   │   ├── Rota: /app/clinical-assessment
│   │   └── Avaliação clínica inicial
│   │
│   ├── PatientChat.tsx
│   │   └── Chat genérico para pacientes
│   │
│   └── ChatGlobal.tsx
│       └── Chat global da plataforma
│
└── 📚 DADOS (src/lib/data/)
    │
    └── documentoMestreResumo.md
        └── Documento mestre institucional
```

---

## 🎯 ARQUIVOS PRINCIPAIS POR FUNÇÃO

### 🧠 **Processamento de IA**
1. `src/lib/noaResidentAI.ts` ⭐ (Core)
2. `src/lib/noaEsperancaCore.ts` (Base)
3. `src/lib/noaEngine.ts` (Engine)
4. `src/lib/noaTrainingSystem.ts` (Treinamento)

### 🔌 **Integrações**
1. `src/lib/noaAssistantIntegration.ts` ⭐ (OpenAI Assistant)
2. `src/lib/platformFunctionsModule.ts` ⭐ (Plataforma)
3. `src/services/knowledgeBaseIntegration.ts` ⭐ (Base de Conhecimento)

### 🎨 **Interface do Usuário**
1. `src/components/NoaConversationalInterface.tsx` ⭐ (Principal)
2. `src/components/ClinicalAssessmentChat.tsx` ⭐ (Avaliação)
3. `src/components/NoaEsperancaAvatar.tsx` (Avatar)

### 🪝 **Lógica de Conversação**
1. `src/hooks/useMedCannLabConversation.ts` ⭐ (Principal)
2. `src/hooks/useNOAChat.ts` (Chat Nôa)
3. `src/hooks/useMicrophone.ts` (Microfone)

### 🌐 **Estado Global**
1. `src/contexts/NoaContext.tsx` ⭐ (Principal)
2. `src/contexts/NoaPlatformContext.tsx` ⭐ (Plataforma)
3. `src/contexts/RealtimeContext.tsx` (Tempo Real)

### 📊 **Relatórios e Dados**
1. `src/lib/clinicalReportService.ts` ⭐ (Relatórios)
2. `src/lib/patientDashboardAPI.ts` (Dashboard)

### 📄 **Páginas**
1. `src/pages/PatientNOAChat.tsx` ⭐ (Principal)
2. `src/pages/ClinicalAssessment.tsx` (Avaliação)

---

## 🔄 FLUXO DE DADOS

```
┌─────────────────────────────────────────────────────────────┐
│                    USUÁRIO                                  │
└────────────────────┬──────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│     NoaConversationalInterface.tsx (Componente UI)           │
│     - Entrada texto/voz                                     │
│     - Exibição de mensagens                                 │
└────────────────────┬──────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│     useMedCannLabConversation.ts (Hook)                    │
│     - Gerenciamento de estado                               │
│     - TTS/STT                                               │
└────────────────────┬──────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│     NoaContext.tsx (Contexto)                               │
│     - Instância singleton                                   │
└────────────────────┬──────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│     noaResidentAI.ts (Core)                                 │
│     - processMessage()                                      │
│     - detectIntent()                                        │
│     - processAssessment()                                    │
└────────────────────┬──────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
         ▼                       ▼
┌──────────────────┐   ┌──────────────────────────────┐
│ Assistant API    │   │ platformFunctionsModule.ts    │
│ (OpenAI)         │   │ - Ações da plataforma         │
└──────────────────┘   └──────────────────────────────┘
         │                       │
         └───────────┬───────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│     knowledgeBaseIntegration.ts                             │
│     - Busca semântica                                       │
│     - Documentos relevantes                                 │
└────────────────────┬──────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│     clinicalReportService.ts                                │
│     - Geração de relatórios                                 │
│     - Salvamento em Supabase                                │
└────────────────────┬──────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE                                │
│     - chat_messages                                         │
│     - clinical_reports                                      │
│     - imre_assessments                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 ESTATÍSTICAS

- **Arquivos Core**: 12 arquivos
- **Componentes**: 10 componentes
- **Hooks**: 4 hooks
- **Contextos**: 3 contextos
- **Serviços**: 2 serviços
- **Páginas**: 4 páginas
- **Total de Linhas**: ~15,000+ linhas
- **Arquivo Maior**: `noaResidentAI.ts` (2,700 linhas)

---

## ⭐ ARQUIVOS CRÍTICOS (MUST READ)

1. **`src/lib/noaResidentAI.ts`** - Toda a lógica da IA
2. **`src/components/NoaConversationalInterface.tsx`** - Interface principal
3. **`src/hooks/useMedCannLabConversation.ts`** - Lógica de conversação
4. **`src/lib/noaAssistantIntegration.ts`** - Integração OpenAI
5. **`src/contexts/NoaContext.tsx`** - Contexto global

---

**Documento gerado em:** Dezembro 2024  
**Versão:** MedCannLab 3.0

