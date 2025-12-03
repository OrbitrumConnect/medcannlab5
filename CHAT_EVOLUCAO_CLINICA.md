# 💬 Chat Clínico → Evolução Clínica Automática

## 🎯 **FUNCIONALIDADE PRINCIPAL**

O chat clínico agora **integra automaticamente** todas as conversas entre profissional e paciente ao **histórico de evoluções clínicas** do paciente, eliminando a necessidade de copiar e colar manualmente conversas do WhatsApp.

## ✨ **RECURSOS IMPLEMENTADOS**

### 1. **Salvamento Automático de Conversas**
- ✅ Conversas são salvas automaticamente como evoluções clínicas
- ✅ Formato estruturado com timestamps e identificação de remetentes
- ✅ Registro completo da sessão de conversa

### 2. **Salvamento Manual**
- ✅ Botão "Salvar conversa no prontuário do paciente" visível para profissionais
- ✅ Permite salvar manualmente a qualquer momento
- ✅ Feedback visual durante o processo de salvamento

### 3. **Salvamento Automático por Inatividade**
- ✅ Após 30 minutos sem mensagens, a sessão é salva automaticamente
- ✅ Garante que nenhuma conversa seja perdida

### 4. **Salvamento ao Trocar de Sala**
- ✅ Ao mudar de paciente, a conversa anterior é salva automaticamente
- ✅ Evita perda de dados ao navegar entre pacientes

### 5. **Formatação Inteligente**
- ✅ Conversas formatadas com timestamps
- ✅ Identificação clara de quem enviou cada mensagem
- ✅ Relatório clínico estruturado gerado automaticamente

## 📋 **ESTRUTURA DOS DADOS SALVOS**

### Tabela: `clinical_assessments`

```json
{
  "patient_id": "uuid-do-paciente",
  "doctor_id": "uuid-do-profissional",
  "assessment_type": "FOLLOW_UP",
  "data": {
    "type": "chat_conversation",
    "source": "chat_clinico",
    "conversation": "[timestamp] Profissional: mensagem...",
    "session_start": "2025-01-XX...",
    "session_end": "2025-01-XX...",
    "message_count": 15,
    "room_id": "uuid-da-sala"
  },
  "clinical_report": "=== REGISTRO DE CONVERSA CLÍNICA ===\n..."
}
```

## 🔧 **ARQUIVOS CRIADOS/MODIFICADOS**

### Novo Serviço
- `src/services/chatEvolutionService.ts`
  - `saveChatAsEvolution()` - Salva conversa como evolução
  - `saveSessionOnInactivity()` - Salva após período de inatividade
  - `shouldSaveAsEvolution()` - Filtra mensagens administrativas

### Hooks Modificados
- `src/hooks/useChatSystem.ts`
  - Integração com `ChatEvolutionService`
  - Timer de inatividade para salvamento automático

### Componentes Modificados
- `src/pages/PatientDoctorChat.tsx`
  - Botão para salvar manualmente
  - Salvamento automático ao trocar de sala
  - Interface melhorada

## 🎨 **INTERFACE**

### Botão de Salvamento
- Localização: Acima do campo de mensagens
- Visibilidade: Apenas para profissionais/admins
- Estado: Mostra "Salvando..." durante o processo
- Cor: Verde esmeralda para destacar importância

### Mensagem Informativa
- "Esta conversa será registrada automaticamente como evolução clínica"
- Ajuda profissionais a entenderem a funcionalidade

## 📊 **BENEFÍCIOS**

1. **Registro Completo**: Nada se perde - todas as conversas ficam registradas
2. **Economia de Tempo**: Não precisa copiar/colar do WhatsApp
3. **Rastreabilidade**: Histórico completo de comunicação com timestamps
4. **Dado Primário Preservado**: Conversas originais mantidas integralmente
5. **Compliance**: Registro clínico adequado para fins legais

## 🚀 **COMO USAR**

### Para Profissionais:

1. **Conversar normalmente** com o paciente no chat
2. **Salvar manualmente** clicando no botão verde quando desejar
3. **Trocar de paciente** - a conversa anterior será salva automaticamente
4. **Aguardar 30 minutos** - salvamento automático por inatividade

### Para Pacientes:

- Conversas são automaticamente registradas no seu prontuário
- Podem visualizar o histórico completo em "Evoluções"

## 🔍 **MONITORAMENTO**

- Logs no console: `✅ Conversa do chat salva como evolução clínica`
- Verificação: Evoluções aparecem na aba "Evolução" do paciente
- Tipo: `assessment_type = 'FOLLOW_UP'` e `data.type = 'chat_conversation'`

## ⚠️ **OBSERVAÇÕES**

- Mensagens muito curtas ou apenas administrativas podem não ser salvas automaticamente
- Salvamento automático ocorre após 30 minutos de inatividade
- Profissionais podem salvar manualmente a qualquer momento
- Todas as conversas são preservadas como dado primário

---

**Esta funcionalidade transforma o chat clínico em uma ferramenta completa de registro médico, eliminando a necessidade de sistemas externos como WhatsApp para comunicação com pacientes.**

