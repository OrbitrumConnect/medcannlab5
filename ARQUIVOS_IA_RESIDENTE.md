# 📋 ARQUIVOS DA IA RESIDENTE - NÔA ESPERANÇA

## 🎯 ARQUIVOS PRINCIPAIS (Core)

### 1. **`src/lib/noaResidentAI.ts`** ⭐ **ARQUIVO PRINCIPAL**
   - **Classe `NoaResidentAI`**: Lógica central da IA
   - **System Prompt**: Instruções e personalidade da Nôa
   - **Detecção de Intenções**: Greeting, assessment, appointment, etc.
   - **Processamento de Mensagens**: `processMessage()`
   - **Avaliação Clínica IMRE**: `processAssessment()`, `processInvestigationStep()`
   - **Salvamento de Dados**: `saveChatInteractionToPatientRecord()`, `saveDocument()`, etc.
   - **Acesso a Dados**: `getPlatformData()`, `logUserActivity()`, etc.

### 2. **`src/components/NoaConversationalInterface.tsx`** ⭐ **INTERFACE DO CHAT**
   - Componente principal do chat com a IA
   - Microfone e reconhecimento de voz
   - Input de texto
   - Exibição de mensagens
   - Controle de estado (isProcessing, isSpeaking, isListening)

### 3. **`src/hooks/useMedCannLabConversation.ts`** ⭐ **HOOK DE CONVERSAÇÃO**
   - Gerenciamento de mensagens
   - Integração com `NoaResidentAI`
   - Text-to-Speech (voz da IA)
   - Timeouts e recuperação de erros
   - Estado de processamento

---

## 🔧 ARQUIVOS DE INTEGRAÇÃO

### 4. **`src/lib/noaAssistantIntegration.ts`**
   - Integração com OpenAI Assistant API
   - Fallback para processamento local
   - Gerenciamento de erros CORS

### 5. **`src/lib/noaTrainingSystem.ts`**
   - Sistema de treinamento local
   - Respostas para instruções
   - Detecção de saudações

### 6. **`src/lib/noaEsperancaCore.ts`**
   - Core do sistema Nôa Esperança
   - Configuração do avatar
   - Sistema IMRE Triaxial

### 7. **`src/lib/noaIntegration.ts`**
   - Integração NOA
   - Análise de conteúdo cognitivo
   - Geração de respostas contextuais

---

## 🎨 COMPONENTES DE INTERFACE

### 8. **`src/components/NoaAnimatedAvatar.tsx`**
   - Avatar animado da Nôa
   - Indicadores visuais de status

### 9. **`src/components/NoaEsperancaAvatar.tsx`**
   - Avatar completo da Nôa Esperança
   - Interface multimodal

### 10. **`src/pages/PatientNOAChat.tsx`**
   - Página dedicada ao chat com a IA
   - Inicialização automática de avaliações

### 11. **`src/components/ClinicalAssessmentChat.tsx`**
   - Chat específico para avaliação clínica
   - Interface de avaliação IMRE

---

## 📚 CONTEXTOS E HOOKS

### 12. **`src/contexts/NoaContext.tsx`**
   - Contexto React para a IA
   - Provider de dados da plataforma

### 13. **`src/contexts/NoaPlatformContext.tsx`**
   - Contexto de dados da plataforma
   - Estatísticas e informações em tempo real

### 14. **`src/hooks/useNOAChat.ts`**
   - Hook alternativo para chat NOA
   - Funcionalidades de chat básicas

---

## 🗄️ SERVIÇOS E DADOS

### 15. **`src/services/knowledgeBaseIntegration.ts`**
   - Integração com base de conhecimento
   - Busca de documentos

### 16. **`src/services/noaKnowledgeBase.ts`**
   - Base de conhecimento específica da NOA
   - Gerenciamento de documentos

### 17. **`src/lib/noaKnowledgeBase.ts`**
   - Biblioteca de conhecimento
   - Processamento de documentos

### 18. **`DOCUMENTO_MESTRE_COMPLETO_2025.md`**
   - Documento mestre com todas as funcionalidades
   - Usado pelo `systemPrompt` da IA

### 19. **`src/lib/data/documentoMestreResumo.md`**
   - Resumo do documento mestre (não usado mais)

---

## 🔐 PERMISSÕES E COMANDOS

### 20. **`src/lib/noaPermissionManager.ts`**
   - Gerenciamento de permissões
   - Controle de acesso

### 21. **`src/lib/noaCommandSystem.ts`**
   - Sistema de comandos
   - Processamento de comandos especiais

### 22. **`src/components/NoaPermissions.tsx`**
   - Interface de permissões
   - Componente visual

---

## 🎯 ARQUIVOS DE FUNCIONALIDADES ESPECÍFICAS

### 23. **`src/lib/noaEngine.ts`**
   - Engine da NOA
   - Processamento avançado

### 24. **`src/lib/noaPlatformFunctions.ts`** (referenciado em noaResidentAI.ts)
   - Funções da plataforma
   - Ações específicas (agendamento, navegação, etc.)

---

## 📊 RESUMO POR CATEGORIA

### **Core (Essenciais)**
1. `src/lib/noaResidentAI.ts` - ⭐ **MAIS IMPORTANTE**
2. `src/components/NoaConversationalInterface.tsx` - ⭐ **INTERFACE**
3. `src/hooks/useMedCannLabConversation.ts` - ⭐ **HOOK PRINCIPAL**

### **Integração**
4. `src/lib/noaAssistantIntegration.ts`
5. `src/lib/noaTrainingSystem.ts`
6. `src/lib/noaEsperancaCore.ts`

### **Interface**
7. `src/components/NoaAnimatedAvatar.tsx`
8. `src/pages/PatientNOAChat.tsx`
9. `src/components/ClinicalAssessmentChat.tsx`

### **Dados e Conhecimento**
10. `DOCUMENTO_MESTRE_COMPLETO_2025.md` - ⭐ **DOCUMENTO MESTRE**
11. `src/services/knowledgeBaseIntegration.ts`

### **Contextos**
12. `src/contexts/NoaContext.tsx`
13. `src/contexts/NoaPlatformContext.tsx`

---

## 🚀 PARA MODIFICAR A IA RESIDENTE

### **Para alterar o comportamento da IA:**
- Edite: `src/lib/noaResidentAI.ts` (linha 85-176: `systemPrompt`)

### **Para alterar a interface do chat:**
- Edite: `src/components/NoaConversationalInterface.tsx`

### **Para alterar o processamento de mensagens:**
- Edite: `src/hooks/useMedCannLabConversation.ts`

### **Para atualizar o conhecimento da IA:**
- Edite: `DOCUMENTO_MESTRE_COMPLETO_2025.md`
- A IA lê este arquivo automaticamente

---

## 📝 NOTAS IMPORTANTES

- **`noaResidentAI.ts`** é o arquivo mais crítico - contém toda a lógica da IA
- **`NoaConversationalInterface.tsx`** é a interface que o usuário vê
- **`DOCUMENTO_MESTRE_COMPLETO_2025.md`** é carregado automaticamente no `systemPrompt`
- A IA usa **OpenAI Assistant API** como backend principal
- Há **fallback local** quando a API falha

