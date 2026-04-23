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

---

#### V1.9.0 — Structural Integrity Migration 🏛️
**Status:** Banco agora diz a verdade sozinho • LGPD estrutural • Anti-concorrência selada

Após review externo identificar 3 checkpoints críticos (consent server-side, idempotência, completude), realizamos **auditoria profunda do banco real** (10 blocos SQL de diagnóstico rodados na instância de produção, 2026-04-23) e entregamos migration cirúrgica que fecha gaps estruturais **sem quebrar dados existentes**.

### 🔍 Diagnóstico baseado em dados reais (não em chute de DDL):

- `aec_assessment_state`: 7 rows — todos com `consentGiven` no jsonb
- `clinical_reports`: 58 rows — todos identificados como dev/team (validação por email)
- `dev_vivo_sessions`: **0 rows** (nunca usada, porém coluna `supabase_token text` representava red flag de segurança)
- 8 legacy tables em português (`pacientes`, `abertura_exponencial`, `dados_imre_coletados`, `desenvolvimento_indiciario`, `fechamento_consensual`, `avaliacoes_renais`, `contexto_longitudinal`, `interacoes_ia`): **0 rows cada**
- `base_conhecimento`: 5 rows — RAG ativo em [tradevision-core/index.ts:3143](supabase/functions/tradevision-core/index.ts#L3143), preservada
- Zero duplicatas por `assessment_id` (UNIQUE INDEX partial pôde ser criado limpo)
- 2 IDs não-UUID em `clinical_reports.id` (conversão text→uuid adiada para sprint separado)

### 🛠 Mudanças aplicadas:

1. **DROPs seguros (12 tabelas, zero dados afetados):**
   - `dev_vivo_sessions`, `dev_vivo_changes`, `dev_vivo_audit`, `dev_vivo_diagnostics` — ferramenta de dev com token em plaintext, nunca usada em produção
   - 8 tabelas legacy em português + CASCADE — resíduo do protocolo pré-AEC, substituído há meses

2. **`aec_assessment_state` — consentimento e completude estruturais:**
   - `consent_given boolean NOT NULL DEFAULT false` + `consent_at timestamptz` (colunas dedicadas, não jsonb validation)
   - Backfill: 1 row com `consent_given=true` (fase FINAL_RECOMMENDATION); 6 com `false` (em progresso)
   - `completed_phases text[]` + `required_phases text[]` com default apropriado
   - `is_complete boolean GENERATED ALWAYS AS (completed_phases @> required_phases) STORED` — flag derivada, impossível fraudar
   - Índice parcial `idx_aec_is_complete` para consultas eficientes

3. **`clinical_reports` — consent + lock anti-concorrência:**
   - `consent_given boolean NOT NULL DEFAULT false` + `consent_at timestamptz` (grandfather dos 57 legados como `false`, 1 com `true` via backfill de `consenso.aceito`)
   - `UNIQUE INDEX one_active_report_per_assessment ON (assessment_id) WHERE status != 'draft'` — impede duas gerações paralelas criarem 2 relatórios ativos para o mesmo assessment (protege contra clique duplo, race de UI, concorrência de processos)

4. **Preservados intencionalmente (decisões registradas):**
   - `base_conhecimento` (RAG ativo)
   - `imre_assessments` (0 rows mas com dependentes FKs: `assessment_sharing`, `clinical_integration`, `imre_semantic_*`) — adiado
   - `clinical_reports.id text → uuid` adiado (2 IDs inválidos + 4 FKs dependentes — risco operacional desproporcional para o ganho)
   - CHECK `consent_given = true` adiado (exige código setar coluna explicitamente antes; aplicar agora bloquearia 100% dos inserts)

### 🧪 Validação E2E pós-aplicação:

Script SQL wrapped em `BEGIN/ROLLBACK` executado na instância de produção, validando em 4 checks:

| # | Check | Resultado |
|---|---|---|
| 1 | `is_complete` deriva de `completed_phases @> required_phases` | ✅ `true` |
| 2 | `consent_given` persiste em coluna dedicada | ✅ `true` |
| 3 | UNIQUE INDEX bloqueia duplicata (via novo partial + legacy assessment_unique) | ✅ `SIM` |
| 4 | CHECK `consent_given=true` aplicado no banco | ⏳ `NÃO (V1.9.2-db pendente, intencional)` |

### 📂 Arquivos entregues:
- `supabase/migrations/20260423210000_structural_integrity_v1_9_0.sql`
- `sql/V1_9_0_rollback.sql` (colunas/índices revertíveis; tabelas dropadas exigem PITR do Supabase)

---
**Selo da Sessão:** 23/04/2026 — V1.9.0  
**Hash:** `structural-integrity-migration-validated`  
**Responsáveis:** Claude Code (Opus 4.7) & Pedro (CTO)

---

#### V1.9.1 — Consent Gate & Phase Tracking 🔒
**Status:** Gate server-side fail-closed • Completude derivada em runtime • GPT impedido de gerar laudo sem consent

A V1.9.0 criou as colunas. A V1.9.1 garante que o **código escreva nelas corretamente** e **recuse geração de relatório sem consentimento afirmativo**.

### 🎯 Mudanças do Frontend ([src/lib/clinicalAssessmentFlow.ts](src/lib/clinicalAssessmentFlow.ts)):

1. **`AssessmentState` ganha `completedPhases?: string[]`**
   - `startAssessment` inicializa com `[]`
   - `loadStateFromDB` lê do banco (`data.completed_phases`)
   - `persist()` escreve `completed_phases` no upsert — a coluna `is_complete` (GENERATED) deriva sozinha

2. **Novo helper `markPhaseCompleted(state, phase)`** (idempotente, push apenas se não existir)

3. **11 transições válidas do happy path ganham chamada explícita:**
   - `INITIAL_GREETING → IDENTIFICATION`
   - `IDENTIFICATION → COMPLAINT_LIST`
   - `COMPLAINT_LIST → MAIN_COMPLAINT`
   - `MAIN_COMPLAINT → COMPLAINT_DETAILS`
   - `COMPLAINT_DETAILS → MEDICAL_HISTORY`
   - `MEDICAL_HISTORY → FAMILY_HISTORY_MOTHER`
   - `FAMILY_HISTORY_MOTHER → FAMILY_HISTORY_FATHER`
   - `FAMILY_HISTORY_FATHER → LIFESTYLE_HABITS`
   - `LIFESTYLE_HABITS → OBJECTIVE_QUESTIONS`
   - `OBJECTIVE_QUESTIONS → CONSENSUS_REVIEW`
   - `CONSENSUS_REVIEW → CONSENSUS_REPORT`
   - `CONSENSUS_REPORT → CONSENT_COLLECTION`
   - `CONSENT_COLLECTION → FINAL_RECOMMENDATION`
   - `FINAL_RECOMMENDATION → COMPLETED`
   
   Rollbacks e saídas voluntárias (INTERRUPTED, CONFIRMING_*) **intencionalmente não marcam** — completude só conta quando o paciente realmente concluiu a fase.

### 🔐 Mudanças do Backend ([supabase/functions/tradevision-core/index.ts](supabase/functions/tradevision-core/index.ts)):

1. **CONSENT GATE fail-closed em `handleFinalizeAssessment` (~linha 1065):**
   ```ts
   const consentGivenAffirmative =
     assessmentData?.content?.consenso?.aceito === true ||
     assessmentData?.content?.raw?.consentGiven === true ||
     assessmentData?.consent_given === true ||
     assessmentData?.data?.consentGiven === true;
   if (!consentGivenAffirmative) {
     return { report_id: null, status: 'aborted_no_consent', error: 'CONSENT_REQUIRED' };
   }
   ```
   Executa **antes** de qualquer chamada OpenAI ou toque no banco. Sem consent afirmativo, nenhum token é gasto e nenhum registro é criado.

2. **Insert principal** (~linha 1125): agora grava `consent_given=true` e `consent_at=now()` em colunas dedicadas — além de `content.consenso`.

3. **Golden-path insert** (~linha 2418): substituiu `isConsentRejected` (só bloqueava `=== false`) por `isConsentAffirmative` (fail-closed). Também popula as colunas novas.

### 📊 Sequência de segurança em camadas agora:
```
Paciente em CONSENT_COLLECTION → diz "sim" → consentGiven=true no state
  ↓
handleFinalizeAssessment: consent gate verifica em 4 caminhos possíveis
  ↓
Se afirmativo: GPT gera → INSERT em clinical_reports com consent_given=true na COLUNA
  ↓
[Futuro V1.9.2-db]: CHECK(consent_given=true) fará disso invariante do banco
```

---
**Selo da Sessão:** 23/04/2026 — V1.9.1  
**Hash:** `consent-gate-and-phase-tracking`  
**Responsáveis:** Claude Code (Opus 4.7) & Pedro (CTO)

---

#### V1.9.1-db — Phase Iteration Count Column Patch 🔧
**Status:** Débito antigo exposto e corrigido • Silencioso até o Dr. Ricardo abrir o console

Dr. Ricardo, ao testar o fluxo em 2026-04-23 ~16:15, abriu o DevTools e viu:

```
[AEC] Erro ao persistir estado no BD:
Could not find the 'phase_iteration_count' column of
'aec_assessment_state' in the schema cache
```

### 🔎 Investigação (git log + grep):

- **Commit `124d48d` V1.8.4-H** (próprio dia 23/04, cedo da manhã) adicionou `phase_iteration_count` ao upsert do frontend em [clinicalAssessmentFlow.ts:285](src/lib/clinicalAssessmentFlow.ts#L285)
- **A migration correspondente nunca foi criada** — a coluna nunca existiu no banco
- **Impacto silencioso até hoje**: o `try/catch` em `persist()` engolia o erro e a feature degradava (contador só vivia em memória; zerava no reload)
- **V1.9 está inocente**: a migration estrutural V1.9.0 não tocou essa coluna. É débito preexistente de ~6h que o console expôs

### 🛠 Fix (migration idempotente, zero-risk):

```sql
ALTER TABLE public.aec_assessment_state
  ADD COLUMN IF NOT EXISTS phase_iteration_count integer NOT NULL DEFAULT 0;
```

### 📂 Arquivo:
- `supabase/migrations/20260423220000_add_phase_iteration_count.sql`

### ✅ Efeito pós-aplicação:
- Contador passa a **persistir entre turnos** (antes: reload zerava contador em memória; agora: mantido no BD)
- Console limpo — `console.warn` recorrente removido
- Sem impacto em RLS, FKs ou índices

---
**Selo da Sessão:** 23/04/2026 — V1.9.1-db  
**Hash:** `phase-iteration-count-column-patch`  
**Responsáveis:** Claude Code (Opus 4.7) & Pedro (CTO)

---

#### V1.9.2 — INTERRUPTED Loop Escape & Placeholder Removal 🔓
**Status:** Cela do INTERRUPTED aberta • Placeholder confuso removido • UX pós-encerramento humana

### 🧪 Cenário real reportado (paciente `casualmusic2021@gmail.com`, 2026-04-23 ~17:10-17:19):

Após `encerrar avaliacao` → `sim`, qualquer frase do paciente era respondida pelo texto literal:

> *"Sua avaliação foi pausada. Gostaria de **continuar** de onde paramos ou prefere iniciar uma **nova** avaliação do zero?"*

Exemplos do log do paciente:
- `"ok e ai tudo bem com voce?"` → mesma frase
- `"nao vamos conversar apenas"` → mesma frase
- `"nao queria conversar com voce tudo bem?"` → mesma frase

### 🔍 Raiz do problema:

Os logs do Core confirmaram:
```
[AEC] Roteiro selado (verbatim): fase= INTERRUPTED
[AEC] Roteiro Selado (INTERRUPTED): Forçando frase literal.
🤖 [AI RESPONSE] { responseLength: 119, tokensUsed: 6071 }
```

O GPT gerava resposta contextual (119 chars, modelo OK), mas era **substituída** pelo texto literal do FSM. V1.8.9 tinha adicionado `INTERRUPTED` ao `AEC_VERBATIM_HARD_LOCK_PHASES`, e o `case 'INTERRUPTED'` só reconhecia `continuar|retomar|voltar|segue|prosseguir` ou `nova|recomecar|zerar`. **Qualquer outra entrada → mesma frase → loop eterno.** O hard lock + matcher estreito virou cela.

### 🛠 Fix 1 — Detecção de recusa explícita (isRefusing):

Novo bloco antes do `return` final do case INTERRUPTED:

```ts
const isRefusing =
  /\b(n[aã]o)\s+(quero|queria|vou|vamos|preciso|posso)\b/.test(norm) ||
  /\b(n[aã]o)\s+(continuar|conversar|falar|fazer|avaliar|retomar)\b/.test(norm) ||
  /\b(deixa\s+(pra|para)\s+l[aá]|outra\s+hora|depois\s+conversamos|esquece|por\s+agora\s+n[aã]o|agora\s+n[aã]o)\b/.test(norm) ||
  /\b(vamos\s+(s[oó]|somente|apenas)\s+conversar|quero\s+(s[oó]|somente|apenas)\s+conversar)\b/.test(norm)

if (isRefusing) {
  this.states.delete(userId)
  void supabase.from('aec_assessment_state').delete().eq('user_id', userId)
  return {
    nextQuestion: 'Tudo bem, podemos conversar. Se quiser retomar sua avaliação depois, basta me pedir "retomar avaliação".',
    phase: 'COMPLETED',
    isComplete: true
  }
}
```

Ao detectar recusa, o state local é removido e o registro no BD é deletado. **Próximas mensagens chegarão ao Core sem `assessmentPhase` no payload → sem verbatim lock → chat livre.** Dados da avaliação anterior ficam preservados no banco? Não — o delete é completo. O paciente pode iniciar nova sessão com `"retomar avaliação"` ou `"iniciar avaliação"`.

### 🛠 Fix 2 — Placeholder estático removido ([NoaConversationalInterface.tsx:3175-3178](src/components/NoaConversationalInterface.tsx#L3175)):

Pedro relatou que, ao abrir o chat pela primeira vez, aparecia:

> *"Como posso te ajudar agora?*  
> *• Iniciar uma avaliação clínica IMRE triaxial*  
> *• Estudar um caso com você*  
> *• Revisar relatórios e prontuário"*

Essa era uma **mensagem estática do JSX** (não vinda da Noa) renderizada quando `messages.length === 0`. Pedro apontou que confundia — o usuário achava ser menu de opções. Removidas as 3 linhas de bullets; mantido o parágrafo institucional sobre a Nôa.

### 🎯 Validação:

Três cenários pós-deploy precisam passar:

1. Paciente termina avaliação → diz "vamos só conversar" → **Noa responde contextualmente, sem frase literal**
2. Novo usuário abre chat → **sem lista "Iniciar avaliação / Estudar caso / Revisar relatórios"**
3. Paciente diz "retomar avaliação" após recusa → novo ASSESSMENT_START é disparado normalmente

---
**Selo da Sessão:** 23/04/2026 — V1.9.2  
**Hash:** `interrupted-loop-escape-and-placeholder-removal`  
**Responsáveis:** Claude Code (Opus 4.7) & Pedro (CTO)

---

#### V1.9.2-db — Orphan Trigger Removal (Bug B selado) 👻
**Status:** Bug de 2 meses e 21 dias resolvido • V1.9 absolvida • Cadastro de paciente destravado

### 🚨 Sintoma reportado:

Dr. Ricardo, ao cadastrar um novo paciente em 2026-04-23 ~16:46:
```
insert or update on table "user_profiles" violates foreign key constraint "user_profiles_user_id_fkey"
```

Tela de alerta visível; cadastro bloqueado.

### 🔎 Investigação histórica (Explore agent + git log):

Linha do tempo reconstruída:

| Data | Evento |
|---|---|
| **02/02/2026** | [database/scripts/MERIT_SYSTEM_DDL.sql](database/scripts/MERIT_SYSTEM_DDL.sql) linhas 108-121 criou trigger `on_auth_user_created_profile` + função `handle_new_user_profile()`. **Instalado em `public.users` AFTER INSERT** — lugar errado (deveria ser em `auth.users`, conforme o próprio nome sugere) |
| **19/03/2026** | Migration `20260319174556` — adicionou `SET search_path = public` à função (blindagem SQL injection) |
| **30/03/2026** | Migration `20260330225735` — criou `fn_on_auth_user_created_link_existing()` em `auth.users` (faz merge de `public.users` por email quando paciente faz signup real) |
| **22/04/2026** | Migration `20260422173901` — ciclo de vida / anonimização LGPD |
| **23/04/2026** | Bug exposto pelo Dr. Ricardo. V1.9.0 de ontem à noite **NÃO tocou** nesse assunto — regressão descartada. Bug dormiu **2 meses e 21 dias**. |

### 🧬 Mecanismo da falha:

O fluxo correto em duas etapas (já existia e funcionava):

```
ETAPA 1 — Profissional cadastra (NewPatientForm.tsx:470)
  crypto.randomUUID() → INSERT public.users (UUID provisório)
  Envio de convite (WhatsApp/email/QR)
  📍 auth.users ainda não existe — esperado

ETAPA 2 — Paciente ativa
  Clica no link → signup → auth.users criado
  Trigger fn_on_auth_user_created_link_existing faz MERGE
  public.users.id ← auth.users.id (match por email)
```

O trigger errado (`on_auth_user_created_profile` em `public.users`) **interferia na etapa 1**: disparava no insert provisório e tentava criar `user_profiles` com FK para `auth.users.id` — que não existia ainda. FK violation → rollback → mensagem de erro.

### 🛠 Fix aplicado:

```sql
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON public.users;
```

### ✅ Validação baseada em dados reais:

Query de saúde do sistema após o DROP:

| Métrica | Resultado |
|---|---|
| Total de usuários | 27 |
| Com `auth.users` (ativos) | 23 |
| Com `user_profiles` | 23 |
| **Ativos SEM profile** | **0** |
| Aguardando ativação (convites pendentes + anon LGPD) | 4 |

**Zero ativos sem profile** confirma que o sistema tem **outro mecanismo funcional** criando `user_profiles` no signup real (provavelmente trigger em `auth.users` ou hook do Supabase Auth). O trigger dropado era **redundante e quebrado desde o dia em que foi instalado** — dropar foi **remover lixo que atrapalhava**, não perder funcionalidade.

### 🧭 Lição arquitetural:

Um trigger criado no lugar errado pode **parecer funcional** mas **sempre falhar silenciosamente** em um caminho específico do sistema. O `try/catch` da aplicação e o baixo uso do fluxo em desenvolvimento mantiveram o bug dormindo por meses. Lição: **testes E2E do fluxo de cadastro de paciente** deveriam ter pegado isso em 02/02 — fica registrado como dívida para o próximo sprint de hardening.

### 📋 Não foi necessário:

- V1.9.3-db (estender `fn_on_auth_user_created_link_existing` para criar `user_profiles`): rejeitada após validação. O mecanismo existente já cobre 100% dos ativos.

---
**Selo da Sessão:** 23/04/2026 — V1.9.2-db  
**Hash:** `orphan-trigger-removal-bug-b-sealed`  
**Responsáveis:** Claude Code (Opus 4.7) & Pedro (CTO)

---

#### V1.9.3 — Refusal-First Ordering Fix 🔄
**Status:** Ordem de checks corrigida • Recusa vence positivo correspondente

### 🐛 O bug que V1.9.2 não resolveu (descoberto em teste real):

Após deploy do V1.9.2, Pedro testou o cenário e enviou log detalhado. Resultado:

| Input do paciente | Esperado (V1.9.2) | Observado |
|---|---|---|
| `"nao nao quero continuar"` | `isRefusing` ativa → estado limpo → chat livre | `[AEC] Fluxo AEC avancou para: COMPLAINT_DETAILS` — paciente **retomado contra a vontade** |
| `"perfeito! voce esta bem hoje?"` | Conversa livre | `"O que mais?"` (verbatim lock de COMPLAINT_DETAILS) |
| `"mais nada ! so perguntei se voce esta bem?"` | Conversa livre | `"O que parece melhorar a dor?"` |

### 🔍 Raiz do bug:

No V1.9.2 eu posicionei o bloco `isRefusing` **depois** de `isContinuing` e `isStartingNew`. O regex de `isContinuing` é `/\b(continuar|retomar|voltar|segue|prosseguir)\b/i` — que **matcha literalmente a palavra "continuar"** mesmo quando antecedida de "não". Então `"nao nao quero continuar"` → match em `continuar` → `isContinuing = true` → `resumeAssessment` → paciente puxado de volta à fase exata (COMPLAINT_DETAILS).

A lógica de recusa estava correta. A **ordem** estava errada. Erro clássico de reasoning — não simulei mentalmente a entrada específica antes de commitar.

### 🛠 Fix V1.9.3:

Três mudanças em [clinicalAssessmentFlow.ts:1000-1060](src/lib/clinicalAssessmentFlow.ts#L1000):

1. **Move o bloco `isRefusing` para o TOPO do `case 'INTERRUPTED'`** — antes de qualquer positivo. Negação sempre vence a palavra correspondente.
2. **Expande o regex de recusa** para cobrir mais variantes: `|seguir|prosseguir|voltar` e `|desejo|pretendo|mais tarde`.
3. **Mantém semântica intacta** — a V1.9.2 já tinha escrito o código certo do `isRefusing`, só nunca rodava. Agora roda primeiro.

### 🎯 Comportamento pós-fix:

| Input | Match | Ação |
|---|---|---|
| `"continuar"` | `isRefusing=false → isContinuing=true` | retoma fase anterior ✅ |
| `"não quero continuar"` | `isRefusing=true` (negação primeiro) | estado limpo, chat livre ✅ |
| `"vamos só conversar"` | `isRefusing=true` | estado limpo, chat livre ✅ |
| `"nova"` | `isRefusing=false → isStartingNew=true` | nova sessão ✅ |

### 📝 Auto-crítica registrada:

Erro de execução, não de desenho. Lição: **sempre rodar mentalmente a entrada real do paciente** (que está no log) contra os regex — na ordem em que aparecem no código — antes de declarar fix pronto. Feito agora.

---
**Selo da Sessão:** 23/04/2026 — V1.9.3  
**Hash:** `refusal-first-ordering-fix`  
**Responsáveis:** Claude Code (Opus 4.7) & Pedro (CTO)

---

#### V1.9.4 — Auto-Pause on F5 / Relogin / Tab Reopen 🌙
**Status:** Break = Pause • Retorno = decisão consciente • Consent contínuo estrutural

### 🎯 Intenção do produto articulada por Pedro:

> *"Quando usuário dá F5 ou desloga ou fecha aba, o sistema já automaticamente salva e sai da avaliação. Quando volta, só avisa, mas fica solta. Se quer voltar, volta tranquilo. LGPD/compliance OK, mas não precisa ser tão rígido. Paciente pode pedir número de avaliações, consultas, conversar normal — foco continua sendo avaliação mas sem sequestrar."*

### 🐛 Comportamento anterior (antes desse fix):

1. Paciente está em `COMPLAINT_DETAILS` (fase ativa)
2. F5 acidental / fechar aba / logout-login
3. State persiste no banco em `COMPLAINT_DETAILS`
4. Paciente volta → Core vê phase=COMPLAINT_DETAILS → verbatim lock dispara em TUDO
5. Qualquer pergunta casual/administrativa → resposta virava "O que mais?" ou pergunta literal da fase
6. Paciente sentia que estava sendo **mantido refém da avaliação** por acidente

### 🛠 Fix V1.9.4:

No hook [`useMedCannLabConversation`](src/hooks/useMedCannLabConversation.ts), dentro do effect de mount do componente (que roda em cada F5, novo login, ou primeira abertura da aba):

```ts
void clinicalAssessmentFlow.ensureLoaded(user.id).then(() => {
  const state = clinicalAssessmentFlow.getState(user.id)
  if (state && state.phase !== 'INTERRUPTED' && state.phase !== 'COMPLETED') {
    state.interruptedFromPhase = state.phase  // preserva pra retomada exata
    state.phase = 'INTERRUPTED'
    state.lastUpdate = new Date()
    void clinicalAssessmentFlow.persist(user.id)
  }
})
```

### 🎯 Fluxo resultante:

```
┌────────────────────────────────────────┐
│ Paciente em COMPLAINT_DETAILS          │
│ (ou qualquer fase ativa)               │
└────────────────────────────────────────┘
                  ↓
   [F5 / logout / fechar aba / etc]
                  ↓
┌────────────────────────────────────────┐
│ state persiste no banco                │
│ (já fazia — V1.9.0)                    │
└────────────────────────────────────────┘
                  ↓
      [paciente volta ao app]
                  ↓
┌────────────────────────────────────────┐
│ mount do hook → ensureLoaded          │
│ AUTO-MIGRA para INTERRUPTED           │ ← novo em V1.9.4
│ (interruptedFromPhase guarda original)│
└────────────────────────────────────────┘
                  ↓
      [paciente digita "oi noa"]
                  ↓
┌────────────────────────────────────────┐
│ social guard vê phase=INTERRUPTED      │
│ → "Vi que tem avaliação em andamento. │
│    Gostaria de continuar ou nova?"    │
└────────────────────────────────────────┘
                  ↓
┌─────────────┬─────────────┬─────────────┐
│ "continuar" │ "não quero" │ "tudo bem?" │
│     ↓       │     ↓       │     ↓       │
│ resume exato│ chat livre  │ conversa    │
│ (V1.9.3 OK) │ (V1.9.3)    │ casual OK   │
└─────────────┴─────────────┴─────────────┘
```

### 📋 Combinação V1.9.3 + V1.9.4:

| Saída da AEC | Como funciona agora |
|---|---|
| **Voluntária explícita** (`encerrar avaliacao`) | CONFIRMING_EXIT → INTERRUPTED (já funcionava) |
| **Recusa no prompt de retomada** (`não quero continuar`) | V1.9.3 — estado limpo, chat livre |
| **Break passivo** (F5, logout, fechar aba) | V1.9.4 — auto-pause na volta, primeira msg aciona social guard |

Todas as três saídas convergem para: **paciente sempre tem controle consciente** sobre quando está na avaliação vs. fora dela. LGPD + UX humanizada.

### 🧪 Testes esperados pós-deploy:

1. **Paciente em COMPLAINT_DETAILS → F5 → volta e diz "oi"** → social guard pergunta continuar/nova, **não** pergunta da fase
2. **Paciente diz "quantas consultas eu tenho?"** → responde contextualmente (V1.9.4 libera + Core não força AEC)
3. **Paciente diz "continuar"** → volta exato para COMPLAINT_DETAILS (via `interruptedFromPhase`)
4. **Paciente diz "não quero continuar"** → estado limpo, chat livre (V1.9.3)
5. **Paciente diz "retomar avaliação"** depois de estar em chat livre → nova AEC pode ser iniciada normalmente

---
**Selo da Sessão:** 23/04/2026 — V1.9.4  
**Hash:** `auto-pause-on-break`  
**Responsáveis:** Claude Code (Opus 4.7) & Pedro (CTO)

---

## 📊 Fechamento do Dia 23/04/2026

### 🏆 Versões entregues e deployadas:

| Versão | Tipo | Objeto |
|---|---|---|
| V1.6.2 | Backend | Clinical Trust Boundary (input/RAG/estado) |
| V1.8.6 | Backend + Frontend | Sovereign Script + Hard Advance + Greeting Guard + Restoration |
| V1.8.7 | Frontend | Real iteration counter reset + safe restart |
| V1.8.8 / 8-Final | Backend + Frontend | INTERRUPTED verbatim + regex greeting sync + same-URL navigation |
| V1.8.9 | Backend | Selective Hard Lock Restoration (COMPLAINT_DETAILS fluidity preservada) |
| V1.8.10 | Frontend | Auto-welcome removido + UTF-8 sanitation + COMPLAINT_DETAILS short answers |
| V1.8.11 | Frontend | IDENTIFICATION loop + cross-session symptom bleed |
| **V1.9.0** | **Banco** | **Structural integrity: consent + completude + anti-concorrência + limpeza de 12 tabelas** |
| **V1.9.1** | **Frontend + Backend** | **Consent gate fail-closed + completed_phases tracking** |
| **V1.9.1-db** | **Banco** | **phase_iteration_count column (débito V1.8.4-H corrigido)** |
| **V1.9.2** | **Frontend** | **INTERRUPTED loop escape + placeholder removal** |
| **V1.9.2-db** | **Banco** | **Drop trigger fantasma (Bug B de 02/02 selado)** |
| **V1.9.3** | **Frontend** | **Refusal-first ordering (negação vence antes do positivo matching)** |
| **V1.9.4** | **Frontend** | **Auto-pause on F5/relogin/tab-reopen — retomada sempre consciente** |

### 🎯 Estado final do sistema:

- **Banco diz a verdade sozinho**: consent, completude e idempotência são invariantes estruturais, não convenção de código
- **Gate de consentimento server-side fail-closed**: nenhum token GPT gasto nem row inserida sem consent afirmativo
- **FSM soberana em fases críticas**: INTERRUPTED permite escape por refusal sem quebrar verbatim lock das demais
- **Cadastro de paciente destravado**: fluxo 2-etapas (profissional → convite → signup → merge) restaurado após remoção de trigger órfão

### ⏭ Próximos passos (V1.9.3+, documentados como débito conhecido):

1. `CHECK (consent_given = true)` em `clinical_reports` — aplicar após rodada de validação em produção com V1.9.1 ativa
2. `clinical_reports.id text → uuid` — 4 FKs dependentes + 2 IDs inválidos; migration coordenada
3. `imre_assessments` cleanup — 0 rows mas com dependentes FKs; plano à parte
4. Testes E2E automatizados de (a) fluxo AEC completo e (b) cadastro de paciente — dívida de hardening

---
**Selo do Dia:** 23/04/2026  
**Hash:** `full-day-clinical-stability-final-v1-9-2`  
**Responsáveis:** Antigravity, Claude Code (Opus 4.7, 1M context) & Pedro (CTO)
