# 🗺️ MAPA COMPLETO: NÔA ESPERANÇA + TRADEVISION CORE
> **O Cérebro Vivo do MedCannLab 3.0: Arquitetura, Inteligência e Estratégia**
> *Documento Consolidado - Versão Final Janeiro 2026*

---

## 📊 1. ESTATÍSTICAS GLOBAIS (DEVELOPER INSIGHT)
| Módulo | Arquivo | Linhas | Funções |
| :--- | :--- | :--- | :--- |
| **TradeVision Core** | `supabase/functions/tradevision-core/index.ts` | 493 | 4 handlers |
| **NoaResidentAI** | `src/lib/noaResidentAI.ts` | 1.637 | 43 |
| **NoaEsperancaCore** | `src/lib/noaEsperancaCore.ts` | 368 | 27 |
| **NOAIntegration** | `src/lib/noaIntegration.ts` | 497 | 48 |
| **NoaConversationalInterface** | `src/components/NoaConversationalInterface.tsx` | 2.534 | 25 |
| **TOTAL** | **5 módulos** | **5.529** | **147+** |

---

## 🏗️ 2. ARQUITETURA EM CAMADAS (THE STACK)
O sistema opera em um modelo de 5 camadas, garantindo soberania e resiliência:

- **CAMADA 5: PERSISTÊNCIA** (Supabase, `ai_chat_interactions`, `clinical_reports`)
- **CAMADA 4: INTELIGÊNCIA** (GPT-4o, Vector Store/Embeddings)
- **CAMADA 3: EDGE (SERVER-SIDE)** (TradeVision Core - Bypass RLS, Lógica Pesada)
- **CAMADA 2: MOTOR LOCAL** (NoaResidentAI, NoaEsperancaCore, NOAIntegration - AEC/IMRE)
- **CAMADA 1: INTERFACE** (NoaConversationalInterface, Widgets, Speech/TTS)

---

## 🎯 3. TRADEVISION CORE (EDGE ORCHESTRATOR)
*O cérebro invisível que processa na borda do servidor.*

### Handlers Disponíveis
- **finalize_assessment**: Salva avaliação final (Bypass RLS para garantir integridade).
- **predict_scheduling_risk**: Predição de no-show (Estatística + IA).
- **Chat Normal**: Roteamento inteligente de personas (Clínico vs. Ensino).

### Gatilhos Inteligentes (Smart Triggers)
- **Agendamento**: Detecta "agendar", "marcar", "horário" → Ativa `APPOINTMENT_CREATE`.
- **Ensino**: Detecta "nivelamento", "prova", "simulação" → Ativa `TESTE_NIVELAMENTO`.
- **Doutor**: Identifica menções a "Ricardo" ou "Eduardo" para context swapping.

---

## 🤖 4. NOARESIDENTAI (MOTOR PRINCIPAL)
*Responsável pelo processamento lógico e fluxo IMRE.*

### Funções Chave (43 total):
- `processMessage()`: O ponto de entrada de toda interação.
- `detectIntent()`: Classificação entre Clínica, Administrativa ou Técnica.
- `processAssessment()`: O "maestro" do protocolo IMRE/AEC.
- `generateClinicalSummary()`: Extração de valor a partir da conversa desestruturada.

---

## 💚 5. NOAESPERANCACORE (ALMA AEC & ANTROPOLOGIA)
*Implementação do método desenvolvido pelo Dr. Ricardo Valença.*

### Metodologia AEC (Arte da Entrevista Clínica):
- `realizarEntrevistaClinica()`: Condução das 10 etapas fundamentais.
- `estabelecerRapport()`: Lógica de empatia linguística.
- `analisarSemanticamente()`: Ocupa-se do significado profundo da dor do paciente.

### Análise IMRE (Sistêmica):
- **Domínio Físico**: Localização, intensidade e sintomas.
- **Domínio Psíquico**: Estado emocional, cognição e humor.
- **Domínio Social**: Relações, família e trabalho.

---

## 🔗 6. NOAINTEGRATION (MULTIMODAL & SEMÂNTICA)
*A capacidade sensorial e interpretativa da IA.*

- **Multimodalidade**: Processamento de Texto, Áudio e Vídeo (`transcribeAudio`, `processVideoInput`).
- **Contexto Emocional**: Cálculo de **Valência**, **Arousal** e **Intensidade** para entender o estado de espírito do usuário.
- **Complexity Analysis**: Avalia a complexidade do discurso para adaptar a resposta.

---

## 🖥️ 7. NOACONVERSATIONALINTERFACE (UX/UI)
*Onde a IA encontra o toque humano.*

- **SchedulingWidget**: Agendamento inline sem trocar de tela.
- **Voice UX**: `flush()`, `scheduleFlush()` e `Speech Recognition` para conversa fluída.
- **Smart Tools**: PDF Upload para leitura de exames via IA.

---

## � 8. FLUXO DE SINERGIA (COMO TUDO SE CONECTA)
1. **Usuário** fala/digita → **UI** captura.
2. **NoaResidentAI** detecta a intenção e consulta o **Knowledge Base**.
3. Se necessário (pessistência/risco), invoca o **TradeVision Core**.
4. **TradeVision** consulta o GPT-4o e o Banco Master via Edge.
5. A **Resposta** volta com Metadados (Intents/Triggers) para atualizar a UI em tempo real.

---

## 🎪 9. APLICAÇÕES POSSÍVEIS (AMBIENTE VIVO)
| Área | Capacidade | Status |
| :--- | :--- | :--- |
| **Avaliação Clínica** | Protocolo AEC 10 etapas | ✅ **Ativo** |
| **Agendamento IA** | Widget inline + predição no-show | ✅ **Ativo** |
| **Ensino Médico** | 20 pacientes simulados | ✅ **Ativo** |
| **Triagem Ativa** | Sugestão de horário baseada em risco | 🔶 **Preparado** |
| **Prescrição IA** | Sugestão de fitoterápicos/dosagens | 🔜 **Próximo** |
| **Análise Emocional** | Monitoramento de depressão/ansiedade | ✅ **Ativo** |

---

## 🏁 CONCLUSÃO: O LEGADO DA INTELIGÊNCIA
Este ecossistema de **5.529 linhas** de código dedicado exclusivamente à inteligência torna o MedCannLab uma plataforma **soberana e viva**. A fusão das 147 funções garante que o app não apenas armazene dados, mas entenda o ser humano por trás de cada pixel.

**Documento selado e auditado. Janeiro de 2026.** 🦾💎🚀
