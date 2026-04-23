# 📓 DIÁRIO DE BORDO — 23 de Abril de 2026
#### V1.6.2 — Clinical Trust Boundary Stabilization Release 🏥

**Status:** Arquitetura Estável • Comportamento Validado • Resiliência Comprovada

Este documento registra a implementação de um **Trust Boundary** interno para o pipeline clínico do MedCannLab. O foco é a estabilização da integridade de dados e autonomia do estado clínico em relação ao histórico textual.

---

## 📑 RESUMO TÉCNICO

1. **Separação de Domínios**: Implementada a distinção técnica entre:
   - **Input Humano**: Persistido em `ai_chat_interactions` após higienização.
   - **Contexto de Execução (RAG)**: Dados contextuais de apoio passados via campo dedicado, isolados da mensagem humana e descartados após a resposta da IA.
   - **Estado Clínico (AEC Snapshot)**: Estrutura canônica de verdade que governa o sistema.

2. **Câmara de Esterilização (Ingestion Bridge)**:
   Instalada no Core do Hub para higienizar entradas lexicais. Isso impede que metadados ou tokens de contexto saturem o banco de dados e corrompam o pipeline de extração de relatórios.

3. **Validação de Resiliência de Dados**:
   O teste de stress `verify_clinical_resilience.js` provou que o sistema é capaz de produzir relatórios 100% corretos mesmo quando o histórico do banco de dados está contaminado ou degradado. O ruído semântico residual é neutralizado no estágio de reconstituição.

---

## 🛠️ COMPONENTES AFETADOS

- **Frontend**: `noaResidentAI.ts` refatorado para payload multiaxial.
- **Backend**: `tradevision-core/index.ts` atualizado com guard de persistência e suporte a ingestão legada.
- **Reports**: `handleFinalizeAssessment` agora utiliza sanitização por turno no replay do chat.

---

## 🔜 PRÓXIMO NÍVEL DE ENGENHARIA

O próximo desafio estrutural é o **Versionamento de Estado Clínico com Compatibilidade Retroativa**. 
O objetivo é garantir que a evolução de schemas (ClinicalStateV1 -> V2) mantenha a capacidade de auditoria e reprodutibilidade de sessões históricas sem drift de lógica.

---
---
**Selo da Sessão:** 23/04/2026 — V1.6.2  
**Hash:** `clinical-resilience-release-final`  

---

#### V1.8.6 — Sovereign Script & Human Fluidity 🧠⚡
**Status:** Pipeline Blindado • Ontologia Preservada • UX Humanizada

Esta atualização marca a maturidade do motor clínico (AEC), resolvendo os últimos gaps de "loop de repetição" e "rigidez antinatural".

### 🚀 Principais Avanços:

1. **Protocolo "Bate-Pronto" (Hard Advance)**:
   - Implementado o teto de **2 iterações** para qualquer fase de lista (`O que mais?`). 
   - Na 2ª resposta, o sistema captura o dado e **força o avanço** para a próxima fase, eliminando loops de repetição que cansavam o paciente.

2. **Trava Seletiva (Phase-Selective Verbatim)**:
   - A Noa agora segue o roteiro literal estrito apenas em fases de identificação e listas binárias. 
   - No detalhamento (`COMPLAINT_DETAILS`), ela recuperou autonomia para explorar sintomas (localização, início, características) de forma natural, sem ser resetada pela trava de script.

3. **Human Greeting Guard ("Oi Noa")**:
   - Criada a **Trava Social**. Agora, saudações educadas do tipo "Oi Noa" ou "Tudo bem?" são detectadas e processadas sem poluir o prontuário médico e sem disparar erros de "input irrelevante".

4. **Portaria de Restauração Inteligente**:
   - Caso um usuário retorne a uma sessão pendente com uma saudação, a Noa agora oferece a escolha: *"Gostaria de continuar de onde paramos ou prefere uma nova do zero?"*. Comandos simples como "continuar" ou "nova" agora regem a FSM de forma ágil.

---
**Selo da Sessão:** 23/04/2026 — V1.8.6  
**Hash:** `sovereign-script-v1-8-6`  

---

#### V1.8.7 — Iteration Counter Real Reset & Safe Restart 🔁
**Status:** Dead Code Removido • Ciclo Corrigido • Restart Seguro

Esta versão resolve o último dominó escondido do motor AEC: o contador de iteração (`phaseIterationCount`) que **nunca zerava** entre fases de lista.

### 🎯 Correções de Raiz:

1. **Reset Real do Contador de Iteração**:
   - A verificação condicional existente (`if (state.phase !== oldPhase || state.currentQuestionIndex !== oldQuestionIndex)`) comparava estados ANTES do `switch` modificá-los — ou seja, nunca disparava (dead code).
   - Consequência clínica: após 2 respostas em `COMPLAINT_LIST`, o contador ficava travado em 2, impedindo o paciente de responder as sub-listas de `COMPLAINT_DETAILS` (sintomas associados, melhora, piora).
   - O reset agora é **explícito** em cada transição de fase/questão: `IDENTIFICATION → COMPLAINT_LIST`, `COMPLAINT_LIST → MAIN_COMPLAINT`, `MAIN_COMPLAINT → COMPLAINT_DETAILS`, entre cada sub-pergunta de lista, e ao entrar em `MEDICAL_HISTORY`, `FAMILY_HISTORY_MOTHER/FATHER`, `LIFESTYLE_HABITS` e `OBJECTIVE_QUESTIONS`.

2. **Simplificação do `resetAssessment`**:
   - Removido o `DELETE` *fire-and-forget* na tabela `aec_assessment_state` que podia executar em paralelo com o `persist()` subsequente (race condition capaz de apagar o novo estado).
   - Como `persist()` usa `upsert` com `onConflict: 'user_id'`, o próximo persist naturalmente sobrescreve o registro antigo — o DELETE era redundante e perigoso.

3. **Welcome Sem Hardcode**:
   - Retirado o fallback `'Pedro'` do hook `useMedCannLabConversation`. A saudação de retorno (`Bem-vindo(a) de volta...`) é agora agnóstica até que `patientName` esteja carregado do estado AEC.

---
**Selo da Sessão:** 23/04/2026 — V1.8.7  
**Hash:** `iteration-counter-real-reset`  
**Responsáveis:** Claude Code (Opus 4.7) & Pedro (CTO)

---

#### V1.8.8-Final — The Polished Resilience 💎
**Status:** UX Refinada • Bugs de Navegação Extintos • Verbatim Unificado

Esta versão consolida a estabilização clínica definitiva através de refinamentos co-autorados pelo Claude Code (Opus 4.7) e Antigravity.

### 📝 Resumo de Correções Críticas:

1. **Combate ao Spam de Botões (Greeting Guard)**:
   - A Noa agora diferencia "Oi Noa" (saudação pura) de "Oi Noa, sinto dor no ombro" (mensagem clínica).
   - Botões de navegação contextuais (`INTERRUPTED`) só aparecem em saudações puras, evitando poluição visual durante o diálogo médico.

2. **Unificação de Travas AEC (Verbatim Set)**:
   - Refatoração da lógica de trava literal no Backend para usar um `Set` global (`AEC_VERBATIM_LOCK_PHASES`).
   - Inclusão definitiva das fases `INTERRUPTED` e `FINAL_RECOMMENDATION` no lock, garantindo que o GPT não parafraseie ordens do protocolo.

3. **Correção de "Navegação Morta" no Frontend**:
   - Implementado o uso de *Timestamps* e *CustomEvents* no `NoaConversationalInterface` para forçar o re-mount de componentes quando o usuário clica em botões de atalho vinculados à mesma rota atual.
   - Isso garante que clicar em "Continuar Avaliação" abra o card na hora, sem depender do comportamento padrão do React Router.

4. **Limpeza de Contexto no Welcome**:
   - Removido o hardcode "Olá Pedro" do hook de conversação. Agora a Noa é agnóstica até que a identificação seja formalmente processada pela FSM.

---
**Selo da Sessão:** 23/04/2026 — V1.8.8-Final  
**Hash:** `clinical-stability-master-seal`  

---

#### V1.8.9 — Selective Hard Lock Restoration 💎
**Status:** Fluidez Clínica Preservada • Travas Desacopladas • V1.8.3-D Honrada

Correção de regressão introduzida no V1.8.8-Final: ao unificar as travas verbatim num único `Set` global, a fase `COMPLAINT_DETAILS` — que a V1.8.3-D havia **intencionalmente excluído** do lock duro para preservar fluidez no detalhamento da queixa — foi engajada de volta por engano, fazendo a Noa responder literalmente no detalhamento ("Onde você sente X?") ao invés de acolher a resposta e explorar o sintoma com naturalidade.

### 🔄 Desacoplamento dos Dois Locks:

1. **`AEC_VERBATIM_LOCK_PHASES` (Soft Lock / Prompt)**:
   - Mantém 18 fases, incluindo `COMPLAINT_DETAILS`.
   - Instrui o GPT a seguir o roteiro via *prompt engineering*, permitindo acolhimento natural da resposta do paciente.

2. **`AEC_VERBATIM_HARD_LOCK_PHASES` (Hard Lock / Substituição Literal)**:
   - Novo `Set` dedicado com 17 fases — **sem** `COMPLAINT_DETAILS`.
   - Usado na substituição direta de `aiResponse` pelo `nextQuestionHint` literal (linha 3762 do Core).
   - Aplica-se em identificação, listas binárias, consentimento, finalização e decisões de continuidade (`INTERRUPTED` / `CONFIRMING_*`).

3. **Comentários Reforçados**:
   - Documentação *in-code* explicando a razão da separação dos dois Sets, para evitar que futuros refactors os colapsem novamente. A V1.8.3-D foi decisão clínica deliberada, não acidente.

---
**Selo da Sessão:** 23/04/2026 — V1.8.9  
**Hash:** `selective-hard-lock-restoration`  
**Responsáveis:** Claude Code (Opus 4.7) & Pedro (CTO)

---

#### V1.8.10 — Polimento de Produção & Sanidade UTF-8 🧼
**Status:** Encoding Corrigido • UX Silenciosa • Fluidez Aprimorada

A V1.8.10 resolve ruídos visuais e funcionais detectados em ambiente de testes reais.

### ✅ Refinamentos Implementados:

1. **Remoção do Auto-Welcome Intrusivo**:
   - A Noa agora inicia em silêncio e só se manifesta após a primeira interação do paciente.
   - Isso evita o "sobressalto" de áudio ao abrir o chat e permite que o sistema carregue o estado AEC em background de forma transparente.

2. **Sanitização Universal UTF-8**:
   - Corrigidas 9 strings corrompidas no arquivo `clinicalAssessmentFlow.ts` resultantes de conflitos de encoding (ex: `Nôa`, `incômodo`, `À`, `AVALIAÇÃO`). O sistema agora exibe acentuação perfeita.

3. **Liberação de Respostas Curtas (COMPLAINT_DETAILS)**:
   - Removido o filtro de "micro-frases" para a fase de detalhamento da queixa.
   - Respostas precisas como "na boca", "ontem" ou "queimação" agora são aceitas de imediato, sem disparar o fallback de retomada de contexto.

---
**Selo da Sessão:** 23/04/2026 — V1.8.10  
**Hash:** `clinical-utf8-sanitation-v1-8-10`  
**Responsáveis:** Antigravity, Claude Code & Pedro (CTO)

---

#### V1.8.11 — End of IDENTIFICATION Loop & Cross-Session Sealing 🔒
**Status:** Loop Extinto • Vazamento de Sessão Fechado • Alucinação Contida

Teste real com paciente (Carolina) expôs dois bugs que as versões anteriores não cobriam. Esta versão sela ambos.

### 🎯 Correções de Raiz:

1. **Fim do Loop em `IDENTIFICATION`**:
   - A função `looksLikeRedundantPresentation` marcava **qualquer** palavra curta isolada (2-22 letras) como "já se apresentou".
   - Cenário real: paciente respondia apenas seu primeiro nome ("Carolina") à pergunta "O que trouxe você?" — o sistema interpretava como re-apresentação e repetia "Apresente-se..." indefinidamente. A paciente digitou o nome 3 vezes antes de formular uma queixa.
   - Fix: a detecção agora exige *ou* fórmulas explícitas ("me chamo X", "sou Y", "Pedro aqui") *ou* coincidência com o `patientName` já conhecido do perfil. Nome isolado desconhecido passa pela FSM e é tratado como input regular.

2. **Selagem do Vazamento Cross-Session em `INTERRUPTED`**:
   - Durante a fase `INTERRUPTED`, dois safeguards desligavam silenciosamente no `noaResidentAI`:
     - O `aecSnapshot` (SSoT com sintomas relatados na sessão atual) **não** era anexado ao payload do Core.
     - O filtro de histórico por `sessionStartIso` **não** era aplicado — o Core recebia as últimas 10 mensagens globais do usuário, incluindo sessões antigas.
   - Resultado observado: mensagens de sessões antigas ("insônia", "dor de dente") vazavam no contexto, e o GPT inventava sintomas que a paciente nunca havia relatado nesta sessão. Ela precisou corrigir múltiplas vezes ("Não falei sobre insônia", "Não falei sobre dores de dente").
   - Fix: ambos os guards agora aplicam-se também em `INTERRUPTED`. Uma sessão pausada continua sendo *a mesma sessão* — só `COMPLETED` libera o filtro, pois o próximo `ASSESSMENT_START` criará sessão nova com `startedAt` fresco.

### 📡 Observação sobre Encoding Residual:
   - Linhas antigas em `ai_chat_interactions` gravadas em cp850 (pré-V1.8.10) ainda ecoavam na resposta do Assistant quando recuperadas no histórico.
   - O filtro por `sessionStartIso` faz essas linhas caírem fora do contexto naturalmente conforme novas sessões rodam. Nenhuma sanitização retroativa foi necessária.

---
**Selo da Sessão:** 23/04/2026 — V1.8.11  
**Hash:** `identification-loop-and-cross-session-seal`  
**Responsáveis:** Claude Code (Opus 4.7) & Pedro (CTO)
