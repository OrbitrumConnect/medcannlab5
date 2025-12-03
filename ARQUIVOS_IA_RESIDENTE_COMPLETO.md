# 🧠 ARQUIVOS DA IA RESIDENTE NÔA ESPERANÇA
## Estrutura Completa do Sistema

**Versão:** 3.0  
**Data:** Dezembro 2024  
**Propósito:** Documentação completa de todos os arquivos que compõem a IA Residente

---

## 📋 ÍNDICE

1. [Core da IA Residente](#core-da-ia-residente)
2. [Componentes de Interface](#componentes-de-interface)
3. [Hooks e Lógica de Conversação](#hooks-e-lógica-de-conversação)
4. [Contextos e Estado Global](#contextos-e-estado-global)
5. [Integrações e Serviços](#integrações-e-serviços)
6. [Sistemas Auxiliares](#sistemas-auxiliares)
7. [Páginas que Utilizam a IA](#páginas-que-utilizam-a-ia)

---

## 🎯 CORE DA IA RESIDENTE

### 1. **`src/lib/noaResidentAI.ts`** ⭐ **ARQUIVO PRINCIPAL**
**Descrição:** Classe principal que implementa toda a lógica da IA Residente Nôa Esperança.

**Funcionalidades Principais:**
- Processamento de mensagens do usuário
- Detecção de intenções (greeting, assessment, appointment, etc.)
- Protocolo IMRE Triaxial completo
- Geração de relatórios clínicos
- Integração com Assistant API da OpenAI
- Preservação da fala espontânea do paciente
- Análise triaxial (Abertura Exponencial, Desenvolvimento Indiciário, Fechamento Consensual)
- Sistema de memória e contexto
- Códigos de ativação individualizados

**Classes e Interfaces:**
- `NoaResidentAI` - Classe principal
- `AIResponse` - Interface de resposta da IA
- `AIMemory` - Interface de memória
- `ResidentAIConfig` - Configuração da IA
- `IMREAssessmentState` - Estado da avaliação IMRE

**Métodos Principais:**
- `processMessage()` - Processa mensagens do usuário
- `processAssessment()` - Processa avaliações clínicas
- `processInvestigationStep()` - Fase de investigação
- `processMethodologyStep()` - Fase de metodologia
- `processResultStep()` - Fase de resultado
- `processEvolutionStep()` - Fase de evolução
- `generateAndSaveReport()` - Gera e salva relatórios
- `detectIntent()` - Detecta intenção da mensagem
- `composeAssistantPrompt()` - Monta prompt para Assistant API
- `getAssistantResponse()` - Obtém resposta do Assistant

**Linhas de Código:** ~2,700 linhas

---

### 2. **`src/lib/noaEsperancaCore.ts`**
**Descrição:** Core do sistema Nôa Esperança com configurações base e personalidade.

**Funcionalidades:**
- Configuração do avatar Nôa
- Personalidade empática, técnica e educativa
- Expertise em Cannabis Medicinal, AEC, IMRE Triaxial
- Estilo de comunicação adaptativo

**Interfaces:**
- `NoaEsperancaConfig` - Configuração base
- `NoaInteraction` - Interface de interação

**Classe Principal:**
- `NoaEsperancaCore` - Core do sistema

---

### 3. **`src/lib/noaEngine.ts`**
**Descrição:** Engine de processamento da IA.

**Funcionalidades:**
- Processamento de linguagem natural
- Análise semântica
- Geração de respostas

---

### 4. **`src/lib/noaTrainingSystem.ts`**
**Descrição:** Sistema de treinamento e contextualização da IA.

**Funcionalidades:**
- Identificação de usuário por código único
- Memória persistente
- Simulações de pacientes
- Contexto da plataforma
- Chat inteligente contextualizado

---

### 5. **`src/lib/noaAssistantIntegration.ts`**
**Descrição:** Integração híbrida com OpenAI Assistant API.

**Funcionalidades:**
- Comunicação com Assistant API (`asst_CAW142M53uLBLbVzERZMa7HF`)
- Criação e gerenciamento de threads
- Fallback para sistema local
- Limpeza de estrutura de raciocínio
- Processamento de avaliações clínicas completas

**Classe Principal:**
- `NoaAssistantIntegration` - Integração com Assistant API

**Métodos Principais:**
- `sendMessage()` - Envia mensagem ao Assistant
- `createThread()` - Cria thread de conversa
- `runAssistant()` - Executa assistant
- `getLastMessage()` - Obtém última mensagem
- `processInitialAssessment()` - Processa avaliação inicial completa

---

### 6. **`src/lib/noaCommandSystem.ts`**
**Descrição:** Sistema de comandos especiais da IA.

**Funcionalidades:**
- Processamento de comandos especiais
- Integração com Patient Dashboard API
- Comandos disponíveis para a IA

---

### 7. **`src/lib/noaKnowledgeBase.ts`**
**Descrição:** Integração com base de conhecimento.

**Funcionalidades:**
- Busca semântica em documentos
- Acesso à biblioteca compartilhada
- Integração com documentos da plataforma

---

### 8. **`src/lib/noaPermissionManager.ts`**
**Descrição:** Gerenciamento de permissões da IA.

**Funcionalidades:**
- Controle de acesso
- Permissões por tipo de usuário
- Validação de ações

---

### 9. **`src/lib/noaIntegration.ts`**
**Descrição:** Integrações gerais da IA.

**Funcionalidades:**
- Integração com outros sistemas
- Comunicação entre módulos

---

### 10. **`src/lib/platformFunctionsModule.ts`**
**Descrição:** Módulo de funções da plataforma integrado à IA.

**Funcionalidades:**
- Detecção de intenções de plataforma
- Execução de ações (iniciar avaliação, gerar relatório, etc.)
- Integração com funcionalidades do sistema

---

## 🎨 COMPONENTES DE INTERFACE

### 1. **`src/components/NoaConversationalInterface.tsx`** ⭐ **COMPONENTE PRINCIPAL**
**Descrição:** Interface conversacional completa com entrada de texto e voz.

**Funcionalidades:**
- Chat multimodal (texto e voz)
- Reconhecimento de voz (Speech Recognition API)
- Síntese de voz (Text-to-Speech)
- Upload de arquivos
- Histórico de mensagens
- Indicadores visuais (typing, speaking, listening)
- Controle de microfone (15s máximo, 5s inatividade)
- Delay antes de desligar microfone quando IA fala (800ms)

**Estados Principais:**
- `isListening` - Microfone ativo
- `isSpeaking` - IA falando
- `isProcessing` - Processando mensagem
- `messages` - Histórico de mensagens
- `showUploadModal` - Modal de upload

**Hooks Utilizados:**
- `useMedCannLabConversation` - Hook principal de conversação

---

### 2. **`src/components/NoaEsperancaAvatar.tsx`**
**Descrição:** Avatar visual da Nôa Esperança com animações.

**Funcionalidades:**
- Avatar animado
- Indicadores de atividade (typing, speaking, listening)
- Sistema IMRE com indicadores dos 3 eixos
- Chat inteligente integrado
- Interface responsiva

---

### 3. **`src/components/NoaAvatar.tsx`**
**Descrição:** Avatar básico da Nôa.

**Funcionalidades:**
- Representação visual da IA
- Estados de animação

---

### 4. **`src/components/NoaAnimatedAvatar.tsx`**
**Descrição:** Avatar com animações avançadas.

**Funcionalidades:**
- Animações suaves
- Transições de estado
- Feedback visual

---

### 5. **`src/components/NoaCapabilities.tsx`**
**Descrição:** Componente que exibe as capacidades da IA.

**Funcionalidades:**
- Lista de capacidades
- Indicadores visuais
- Estatísticas em tempo real

---

### 6. **`src/components/NoaPermissions.tsx`**
**Descrição:** Componente de gerenciamento de permissões.

**Funcionalidades:**
- Visualização de permissões
- Controle de acesso

---

### 7. **`src/components/NOAChatBox.tsx`**
**Descrição:** Caixa de chat da Nôa.

**Funcionalidades:**
- Interface de chat simplificada
- Entrada de mensagens
- Exibição de respostas

---

### 8. **`src/components/ChatAIResident.tsx`**
**Descrição:** Chat específico para IA Residente.

**Funcionalidades:**
- Interface de chat dedicada
- Integração com IA Residente

---

### 9. **`src/components/ClinicalAssessmentChat.tsx`**
**Descrição:** Chat específico para avaliação clínica.

**Funcionalidades:**
- Interface para avaliação IMRE
- Protocolo pausado (uma pergunta por vez)
- Preservação da narrativa do paciente
- Geração de relatórios

**Características Especiais:**
- Modal com altura ajustada (85vh, max 800px)
- Texto com quebra de linha (`whitespace-pre-wrap`)
- Scroll automático para última mensagem

---

### 10. **`src/components/MicrophoneButton.tsx`**
**Descrição:** Botão de microfone para entrada de voz.

**Funcionalidades:**
- Ativação/desativação do microfone
- Indicadores visuais de estado
- Feedback de áudio

---

### 11. **`src/components/MobileChatInput.tsx`**
**Descrição:** Input de chat otimizado para mobile.

**Funcionalidades:**
- Layout responsivo
- Entrada de texto e voz
- Adaptação para telas pequenas

---

## 🪝 HOOKS E LÓGICA DE CONVERSAÇÃO

### 1. **`src/hooks/useMedCannLabConversation.ts`** ⭐ **HOOK PRINCIPAL**
**Descrição:** Hook principal que gerencia toda a lógica de conversação com a IA.

**Funcionalidades:**
- Gerenciamento de estado da conversa
- Integração com `NoaResidentAI`
- Síntese de voz (TTS)
- Reconhecimento de voz (STT)
- Controle de microfone
- Processamento de mensagens
- Salvamento de interações

**Estados Gerenciados:**
- Mensagens da conversa
- Estado do microfone
- Estado de processamento
- Estado de fala da IA

**Funções Principais:**
- `sendMessage()` - Envia mensagem para IA
- `startListening()` - Inicia escuta de voz
- `stopListening()` - Para escuta de voz
- `handleVoiceInput()` - Processa entrada de voz

---

### 2. **`src/hooks/useNOAChat.ts`**
**Descrição:** Hook específico para chat com Nôa.

**Funcionalidades:**
- Gerenciamento de chat
- Integração com NOA Engine
- Mensagens de boas-vindas

---

### 3. **`src/hooks/useMicrophone.ts`**
**Descrição:** Hook para controle de microfone.

**Funcionalidades:**
- Ativação/desativação do microfone
- Controle de permissões
- Gerenciamento de estado de áudio

---

### 4. **`src/hooks/useChatSystem.ts`**
**Descrição:** Hook genérico para sistema de chat.

**Funcionalidades:**
- Gerenciamento de mensagens
- Estado de conexão
- Funcionalidades básicas de chat

---

## 🌐 CONTEXTOS E ESTADO GLOBAL

### 1. **`src/contexts/NoaContext.tsx`** ⭐ **CONTEXTO PRINCIPAL**
**Descrição:** Contexto React que fornece acesso à IA Residente em toda a aplicação.

**Funcionalidades:**
- Provider da IA Residente
- Instância singleton de `NoaResidentAI`
- Acesso global à IA
- Gerenciamento de estado global

**Hooks Fornecidos:**
- `useNoa()` - Hook para acessar a IA Residente

---

### 2. **`src/contexts/NoaPlatformContext.tsx`**
**Descrição:** Contexto que gerencia dados da plataforma integrados à IA.

**Funcionalidades:**
- Carregamento de dados da plataforma
- Sincronização com Supabase
- Dados de pacientes, relatórios, notificações
- Tratamento de erros robusto

**Estados Gerenciados:**
- Pacientes
- Relatórios clínicos
- Notificações
- Avaliações IMRE

---

### 3. **`src/contexts/RealtimeContext.tsx`**
**Descrição:** Contexto para atualizações em tempo real.

**Funcionalidades:**
- Sincronização em tempo real
- Notificações instantâneas
- Atualizações de chat

---

## 🔌 INTEGRAÇÕES E SERVIÇOS

### 1. **`src/services/knowledgeBaseIntegration.ts`**
**Descrição:** Integração com base de conhecimento da plataforma.

**Funcionalidades:**
- Busca semântica em documentos
- Integração com Supabase Storage
- Acesso a documentos da biblioteca
- Categorização e tags

**Classe Principal:**
- `KnowledgeBaseIntegration` - Classe de integração

---

### 2. **`src/services/noaKnowledgeBase.ts`**
**Descrição:** Serviço específico de base de conhecimento para Nôa.

**Funcionalidades:**
- Busca de documentos
- Integração com IA
- Contexto para respostas

---

### 3. **`src/lib/clinicalReportService.ts`**
**Descrição:** Serviço de geração e gerenciamento de relatórios clínicos.

**Funcionalidades:**
- Geração de relatórios IMRE
- Salvamento em Supabase
- Estrutura de relatórios completa
- Análise triaxial

**Classe Principal:**
- `ClinicalReportService` - Serviço de relatórios

**Interface:**
- `ClinicalReport` - Interface de relatório clínico

---

### 4. **`src/lib/patientDashboardAPI.ts`**
**Descrição:** API para integração com dashboard do paciente.

**Funcionalidades:**
- Processamento de relatórios completos
- Registro no dashboard
- Geração de NFT (hash)
- Histórico do paciente

---

## 🛠️ SISTEMAS AUXILIARES

### 1. **`src/lib/responsibilityTransferSystem.ts`**
**Descrição:** Sistema de transferência de responsabilidades.

**Funcionalidades:**
- Transferência de responsabilidades do assistant
- Protocolo de transferência
- Relatórios de transferência

---

### 2. **`src/lib/filePermissionTransferSystem.ts`**
**Descrição:** Sistema de transferência de permissões de arquivos.

**Funcionalidades:**
- Transferência de permissões
- Operações de arquivos
- Relatórios de permissões

---

### 3. **`src/lib/ragSystem.ts`**
**Descrição:** Sistema RAG (Retrieval-Augmented Generation).

**Funcionalidades:**
- Busca de documentos relevantes
- Geração aumentada com contexto
- Integração com base de conhecimento

**Classe Principal:**
- `RAGSystem` - Sistema RAG

---

### 4. **`src/lib/localLLM.ts`**
**Descrição:** Integração com modelos de linguagem locais.

**Funcionalidades:**
- Processamento local
- Fallback quando Assistant API não disponível
- Modelos alternativos

---

## 📄 PÁGINAS QUE UTILIZAM A IA

### 1. **`src/pages/PatientNOAChat.tsx`** ⭐ **PÁGINA PRINCIPAL**
**Descrição:** Página principal de chat com Nôa Esperança para pacientes.

**Funcionalidades:**
- Chat completo com IA
- Inicialização automática de avaliação
- Integração com agendamentos
- Interface responsiva

**Rotas:**
- `/app/chat-noa-esperanca`
- `/app/clinica/paciente/avaliacao-clinica`

---

### 2. **`src/pages/ClinicalAssessment.tsx`**
**Descrição:** Página de avaliação clínica inicial.

**Funcionalidades:**
- Protocolo IMRE completo
- Interface de avaliação
- Geração de relatórios

**Rota:**
- `/app/clinical-assessment`

---

### 3. **`src/pages/PatientChat.tsx`**
**Descrição:** Chat genérico para pacientes.

**Funcionalidades:**
- Chat básico
- Integração com IA

---

### 4. **`src/pages/ChatGlobal.tsx`**
**Descrição:** Chat global da plataforma.

**Funcionalidades:**
- Fórum geral
- Discussões colaborativas
- Integração com IA para contexto

---

## 📊 ESTRUTURA DE DADOS

### Tabelas Supabase Relacionadas:

1. **`chat_messages`**
   - Armazena todas as mensagens do chat
   - Campos: `id`, `user_id`, `content`, `role`, `created_at`

2. **`clinical_assessments`**
   - Avaliações clínicas gerais
   - Campos: `id`, `user_id`, `patient_id`, `data`, `status`, `created_at`

3. **`imre_assessments`**
   - Avaliações IMRE específicas
   - Campos: `id`, `user_id`, `patient_id`, `triaxial_data`, `semantic_context`, `completion_status`

4. **`clinical_reports`**
   - Relatórios clínicos gerados
   - Campos: `id`, `patient_id`, `doctor_id`, `content`, `generated_at`

5. **`documents`**
   - Documentos da base de conhecimento
   - Campos: `id`, `title`, `content`, `category`, `file_url`, `ai_relevance`

---

## 🔄 FLUXO DE PROCESSAMENTO

### 1. **Entrada do Usuário**
```
Usuário → NoaConversationalInterface → useMedCannLabConversation → NoaResidentAI
```

### 2. **Processamento**
```
NoaResidentAI → detectIntent() → processMessage() → getAssistantResponse() → Assistant API
```

### 3. **Resposta**
```
Assistant API → NoaResidentAI → generateResponse() → useMedCannLabConversation → TTS → Usuário
```

### 4. **Avaliação Clínica**
```
Usuário → processAssessment() → processInvestigationStep() → processMethodologyStep() → 
processResultStep() → processEvolutionStep() → generateAndSaveReport() → Supabase
```

---

## 🎯 ARQUIVOS CRÍTICOS (PRIORIDADE ALTA)

### ⭐ **Arquivos Essenciais:**

1. **`src/lib/noaResidentAI.ts`** - Core da IA (2,700 linhas)
2. **`src/components/NoaConversationalInterface.tsx`** - Interface principal
3. **`src/hooks/useMedCannLabConversation.ts`** - Hook de conversação
4. **`src/contexts/NoaContext.tsx`** - Contexto global
5. **`src/lib/noaAssistantIntegration.ts`** - Integração com Assistant API

### 📚 **Arquivos de Suporte:**

6. **`src/lib/platformFunctionsModule.ts`** - Funções da plataforma
7. **`src/lib/clinicalReportService.ts`** - Serviço de relatórios
8. **`src/services/knowledgeBaseIntegration.ts`** - Base de conhecimento
9. **`src/components/ClinicalAssessmentChat.tsx`** - Chat de avaliação
10. **`src/pages/PatientNOAChat.tsx`** - Página principal

---

## 📝 DOCUMENTAÇÃO RELACIONADA

- `DOCUMENTO_MESTRE_PLATAFORMA_COMPLETO.md` - Documento mestre completo
- `NOA_RESIDENT_AI_INTEGRATION.md` - Documentação de integração
- `NOA_ESPERANCA_IMPLEMENTATION.md` - Documentação de implementação
- `SISTEMA_TREINAMENTO_NOA.md` - Sistema de treinamento

---

## 🔧 CONFIGURAÇÕES E VARIÁVEIS

### Variáveis de Ambiente:
- `VITE_OPENAI_API_KEY` - Chave da API OpenAI (para Assistant)
- `VITE_SUPABASE_URL` - URL do Supabase
- `VITE_SUPABASE_ANON_KEY` - Chave anônima do Supabase

### Configurações do Assistant:
- **Assistant ID**: `asst_CAW142M53uLBLbVzERZMa7HF`
- **Vector Store**: `vs_9E2EHezIrrXTL9MHT2LJ8m41`
- **Documento Mestre**: `documentoMestreResumo.md`

---

## 📈 ESTATÍSTICAS

- **Total de Arquivos**: ~25 arquivos principais
- **Linhas de Código**: ~15,000+ linhas
- **Componentes React**: 10+
- **Hooks Customizados**: 4
- **Contextos**: 3
- **Serviços**: 3+
- **Classes TypeScript**: 8+

---

**Documento gerado em:** Dezembro 2024  
**Versão da Plataforma:** MedCannLab 3.0  
**Última atualização:** Dezembro 2024

