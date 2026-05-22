---
name: State pollution — reutilizar Core Nôa pra funcionalidade técnica polui estado AEC do usuário
description: Anti-padrão arquitetural cristalizado 19/05 após Pedro empiricamente confirmar hipótese via print real. Botão "Síntese IA" em Casos Similares instancia NoaResidentAI e chama processMessage(aggregatorPrompt, userId) — usa o MESMO método do chat conversacional. Intent classifier classifica como CLINICA, FSM AEC inicia IDENTIFICATION pro userId, e quando paciente abre chat depois, AEC já está em COMPLAINT_LIST esperando próxima fala. Saudação "ola noa tudo bem?" vira queixa principal. Anti-padrão exposto apenas quando GPT caiu (quota 19/05) — antes era mascarado pelo polish do GPT que reescrevia/interceptava. Trigger: separar processMessage(input, userId) [stateful, conversacional] de processStateless(input) [zero state, funcional] OU adicionar flag bypassFSM=true nas chamadas técnicas.
type: feedback
originSessionId: 6742fef8-9d20-43d8-a8d8-8853df0c89e9
---

# State Pollution — Core Nôa Reutilizado para Funcionalidade Técnica

## Origem (19/05/2026 ~09h45 BRT)

Após OpenAI quota estourar (insufficient_quota 22h21 BRT 18/05), Pedro tentou usar o sistema cru e gerou um clinical_report com lixo (saudação virou queixa principal). Print:

```
Queixas Identificadas: "ola noa tudo bem?", "nao pedi para fazer aec como voce esta hoje?"
Queixa Principal: "noa encerrar aec! acabou parar"
Localização: "encerrar"
HPP: "prossiga"
```

**Hipótese do Pedro (Material A — declaração direta)**:
> "pq em algum momento iniciou antes mesmo deu entrar no chat possivelmente quando clickei para ver casos similarias usando i.a"

**Audit empírico** confirmou em `src/pages/AdminCasosSimilares.tsx` linhas 847-890:

```ts
// Síntese IA — chama GPT-4o-mini via noaResidentAI com prompt agregador curado
const noa = new NoaResidentAI()
const response = await noa.processMessage(aggregatorPrompt, user?.id, user?.email)
```

## A regra cristalizada

**Reutilizar Core conversacional Nôa para qualquer funcionalidade técnica que passe `userId` causa pollution do estado AEC desse usuário.**

**Why:** `NoaResidentAI.processMessage(input, userId, email)` é o mesmo método usado pelo chat principal. Ele:
1. Lê estado AEC do `userId` (banco/localStorage)
2. Roda intent classifier no input
3. Se classifica como CLINICA → avança FSM AEC (write-before, persist-snapshot)
4. Persiste em `ai_chat_interactions` linkado ao userId

Quando você chama processMessage pra fazer "síntese de casos similares" (passando o aggregatorPrompt com termos clínicos como "rim", "racionalidades"), o intent classifier marca CLINICA e a FSM AEC inicia/avança pro userId — silenciosamente. Quando o usuário volta pro chat, AEC já está em fase intermediária esperando próxima fala.

**How to apply:**
- **Toda chamada técnica de IA** (extração, agregação, tradução, construção de query) que passe `userId` deve passar pelo refator
- **Suspeitos a auditar** (passam `user?.id` pra processMessage ou similar):
  - `AdminCasosSimilares.tsx:847-890` Síntese IA (CONFIRMADO)
  - `lib/gptTermExtractor.ts` (V1.9.369-C extração PT↔EN)
  - `lib/gptQueryBuilder.ts` (V1.9.372 construtor query PubMed)
  - Qualquer outro service novo que instancie `new NoaResidentAI()`

## Fix arquitetural (parqueado)

**Opção A — Separar 2 modos no NoaResidentAI** (mais limpo):

```ts
class NoaResidentAI {
  // Conversacional — mantém estado AEC
  processMessage(input, userId, email): Promise<Response>

  // Funcional — zero state, só chama GPT puro com prompt
  processStateless(input, options?: { model?, temperature? }): Promise<string>
}
```

**Opção B — Flag bypassFSM** (mais cirúrgico):

```ts
processMessage(input, userId, email, opts?: { bypassFSM: true })
// Quando bypassFSM=true: skip intent classifier, skip FSM AEC, só chama GPT direto
```

**Recomendado: B** (menos refator, retro-compatível). ~3 sites pra editar (Casos Similares Síntese + gptTermExtractor + gptQueryBuilder).

## Trigger pra implementar

- OpenAI voltar (sem GPT, impossível testar) +
- Pedro autorizar V1.9.X+N especificamente +
- Smoke test: clicar "Síntese IA" Casos Similares → abrir chat Nôa imediatamente → primeira mensagem do paciente NÃO pode virar queixa AEC

## Por que isso ficou escondido até hoje

Antes da quota estourar 18/05 22h21 BRT, GPT estava ativo. O polish do GPT:
- Reescrevia inputs ambíguos antes de gravar
- Interceptava saudações sociais ("ola noa tudo bem?" vira resposta social)
- Mascarava intent classifier frágil

Sem GPT, o esqueleto fica exposto: FSM determinística + intent classifier por regex/keywords + Failsafe templates. Tudo o que GPT mascarava aparece cru.

**Princípio inverso do antifragile**: o produto VIVO depende de GPT ativo pra parecer maduro. Quando GPT cai, a fragilidade arquitetural aparece. Sem GPT, Nôa preserva forma clínica e perde substância (já cristalizado).

## Anti-padrões evitar

| Anti-padrão | Como evitar |
|---|---|
| Reutilizar `NoaResidentAI` pra qualquer chamada GPT por preguiça de criar wrapper | Criar `processStateless` ou flag `bypassFSM` |
| Passar `user?.id` em chamada técnica "porque tem na hand" | Avaliar: essa chamada precisa de state AEC? Se não, passar `null` ou flag |
| Diagnosticar "saudação virou queixa" como bug do intent classifier | É correlação, não causa raiz. Causa raiz é state pollution upstream |
| Esperar GPT mascarar o bug pra esquecer | Bug existe mesmo com GPT — só fica invisível. Quando OpenAI quota acaba ou modelo muda, reaparece |

## ADENDO 5 — 19/05 ~17h BRT — DIAGNÓSTICO FINAL via audit dos callers `generateAIReport`

Audit empírico via grep + leitura `noaResidentAI.ts:1522-1604` (`checkForAssessmentCompletion`) revelou o **bug arquitetural real em 3 camadas**:

### Camada 1 — Caminho legado vivo `checkForAssessmentCompletion`

Função privada chamada em todo `processMessage` que **detecta conclusão de AEC por keyword textual** ("avaliação concluída", "obrigado pela avaliação", etc). Quando bate, chama `clinicalReportService.generateAIReport(userId, patientName, OBJETO_HARDCODED)`.

**Trigger empírico**: qualquer mensagem do paciente que contenha keyword textual de conclusão. Mesmo após V1.9.25 ter adicionado gate de idempotência (`isReportDispatched`), o gate **só funciona se o pipeline moderno tiver passado primeiro**. Se AEC for interrompida OU GPT falhar no meio do pipeline OU race condition, `dispatchedFlag` NÃO é setada → caminho legado dispara.

### Camada 2 — `generateAIReport` insere stub com `consent_given` NUNCA persistido

`clinicalReportService.ts:130-142` INSERT inclui apenas: `id, patient_id, patient_name, report_type, protocol, content, generated_by, generated_at, status, professional_id, professional_name`. **`consent_given` NÃO está no INSERT** → fica `false` (default coluna) mesmo quando gate LGPD validou consent na FSM em memória.

Explica empíricamente porque 38 stubs órfãos têm `consent_given=false`.

### Camada 3 — Caller legado passa objeto HARDCODED em vez de `flowState.data`

`noaResidentAI.ts:1587-1603` passa literal:
```ts
{
  investigation: 'Investigacao realizada atraves da avaliacao clinica inicial com IA residente',
  methodology: 'Aplicacao da Arte da Entrevista Clinica (AEC) com protocolo IMRE',
  result: 'Avaliacao clinica inicial concluida com sucesso',
  evolution: 'Plano de cuidado personalizado estabelecido',
  recommendations: ['Continuar acompanhamento clinico regular', ...],
  scores: { clinical_score: 50, treatment_adherence: 50, ... }
}
```

**NUNCA passa dados reais de `flowState.data`** — sub-padrão herdado de antes de `clinicalAssessmentFlow` ser stateful.

Comparação:
- `platformFunctionsModule.ts:328` → passa `assessmentState?.data || {}` (dados REAIS, ou `{}` se vazio)
- `noaResidentAI.ts:1584` → passa OBJETO HARDCODED com defaults sempre

### Impacto empírico (audit final via PAT)

| Usuário | Stubs órfãos lifetime | Risco |
|---|---|---|
| Pedro phpg69 | **15** | Admin testing — pré-PMF aceitável |
| **Dr. Ricardo rrvalenca** | **9** | 🚨 **Usuário real auto-testando** — vê 9 reports lixo intercalados |
| casualmusic2021 (paciente desconhecido abr/2026) | 2 | Drift histórico — investigar quem é |
| Outros | 12 | Datas antigas, drift dev |
| **TOTAL** | **38** | Confunde métricas painel V1.9.374-A |

### Fix V1.9.376 final (polir-não-inventar + audit completo)

| Fix | Onde | O quê | Risco |
|---|---|---|---|
| **A** | `noaResidentAI.ts:1584` | Substituir objeto hardcoded por `clinicalAssessmentFlow.getState(userId)?.data \|\| {}` (mesmo padrão de `platformFunctionsModule:328`) | ZERO — usa state real, fallback `{}` mantém comportamento mínimo |
| **B** | `clinicalReportService.ts:130-142` INSERT `saveReport` | Incluir `consent_given: report.consent_given ?? false` no INSERT. ClinicalReport type já tem campo (verificar) | ZERO — aditivo |
| **C** | `clinicalReportService.ts:41` `generateAIReport` (entrada) | Quality gate antes do INSERT: throw `AEC_DATA_INSUFFICIENT` se `lista_indiciaria` vazio AND `queixa_principal` vazio AND `chiefComplaint` vazio | ZERO — aditivo, throw em caso vazio |
| **D** | `rationalityAnalysisService.ts:498` após `processMessage` | Quality gate: throw `GPT_INDISPONIVEL` se `response.metadata?.model` contém 'Deterministic' OR 'Failsafe' OR `tokensUsed=0` | ZERO — aditivo |
| **E** | `AdminCasosSimilares.tsx` | Remover botão "Síntese IA agregadora" + esconder toggle "IA constrói query" no cross-link Literatura | ZERO — remoção decorativa |
| **Limpeza histórica** | SQL via PAT (admin executa) | `UPDATE clinical_reports SET status='deferred_no_data' WHERE generated_by='noa_ai' AND interaction_id IS NULL AND consent_given=false AND (content->>'main_complaint') IS NULL` (38 rows) | ZERO — marca anomalia datada |

### Anti-padrão arquitetural REAL capturado

> **`checkForAssessmentCompletion` em `noaResidentAI.ts:1522` é caminho LEGADO que deveria ter sido aposentado quando `clinicalAssessmentFlow.finalize` virou pipeline moderno. V1.9.25 só adicionou gate de idempotência (band-aid) mas não removeu a função. Quando pipeline moderno falha por qualquer motivo, gate de idempotência não dispara → caminho legado executa com dados hardcoded.**

Princípio: **funções privadas legadas devem ser REMOVIDAS quando pipeline moderno é criado, não silenciadas com gates**. Manter ambas = dupla autoridade = bug latente.

### Decisão pós-audit

Memory está atualizada com diagnóstico final. Fix V1.9.376 mapeado mas **NÃO implementado** — Pedro autorizou continuar audit e resolver depois. Trigger pra ativar implementação: Pedro dar GO específico.

## ADENDO 4 — 19/05 ~16h BRT — CORREÇÃO EMPÍRICA via audit PAT

Audit empírico subsequente via PAT (`clinical_reports` schema completo + 38 stubs órfãos lifetime) **REVELOU que a leitura original era parcialmente incorreta**. Material C aplicado a mim mesmo:

**O que estava ERRADO na hipótese original**:

1. ❌ "Casos Similares Síntese IA cria stub clinical_report upstream" — **EMPÍRICAMENTE FALSO**. `AdminCasosSimilares.tsx:889` chama `noaResidentAI.processMessage` mas NÃO insere em `clinical_reports`. Só grava em `ai_chat_interactions`.

2. ❌ "V1.9.213 dedupe burla quality gate reciclando stubs técnicos" — **PARCIALMENTE FALSO**. Dedupe (em `clinicalReportService.ts:46-81`) está correto. Reusa report do mesmo paciente nos últimos 5min — defesa contra duplicação por reload. Não há "stub técnico" sendo reciclado.

3. ❌ "Single point criador de stub é state pollution Casos Similares" — **INCORRETO**. Único caller de `generateAIReport` é o fluxo AEC pós-conclusão (não Síntese IA).

**O que é VERDADEIRO empíricamente** (descoberto via PAT):

- **38 stubs órfãos** `generated_by='noa_ai' AND interaction_id IS NULL AND consent_given=false` lifetime — fenômeno desde 2026-03-24, NÃO só do 19/05
- **3 stubs lixo do 19/05** são apenas a versão mais recente do mesmo bug crônico
- **Bug arquitetural real**: `generateAIReport` em `clinicalReportService.ts:41-123` insere stub com `status='completed'` ANTES do pipeline narrator V1.9.84 validar consentimento + enriquecer content. Quando narrator falha (GPT down OU outra razão), stub fica órfão "completed" sem conteúdo.
- **`consent_given=false` + `status='completed'`** é estado inconsistente — significa que AEC chamou `generateAIReport` sem ter passado pelo consent na FSM. Race condition ou bypass não-documentado.

**Diagnóstico revisado do bug**:

Não é "state pollution Síntese IA polui AEC". É:

> **`generateAIReport` cria stub `status='completed'` sem quality gate de dados mínimos. Pipeline narrator V1.9.84 deveria enriquecer DEPOIS, mas pode falhar (GPT down, erro intermediário, race condition). Stub órfão fica no banco com `consent_given=false`, `content` quase vazio, mas `status='completed'`. Confunde painéis e métricas.**

**O que continua VERDADEIRO** (validado empíricamente):

- ✅ Quality gate narrator V1.9.84 EXISTE no Edge tradevision-core (pipeline aborta se narrator falha) — validado para Pedro Paciente (`d5e01ead`) que completou AEC pós-quota out: NÃO criou clinical_report novo
- ✅ Racionalidade MTC lixo (`clinical_rationalities` `e13c0b7a-...`) FOI gravada com texto Failsafe — `rationalityAnalysisService.saveAnalysisToReport` SEM quality gate
- ✅ 5 interactions `[CASOS_SIMILARES_AGGREGATION_MODE]` durante quota out gravaram Failsafe em `ai_chat_interactions` — mas SÓ ai_chat_interactions, não criou clinical_report

**Fix revisado** (polir-não-inventar baseado em audit empírico):

| Fix | Onde | O quê |
|---|---|---|
| **V1.9.376-A** | `clinicalReportService.ts:41` `generateAIReport` | Quality gate: validar `hasMinClinicalData` (lista_indiciaria OR queixa_principal OR chiefComplaint) antes de INSERT. Throw `AEC_DATA_INSUFFICIENT` se vazio |
| **V1.9.376-B** | `rationalityAnalysisService.ts:498` após `processMessage` | Quality gate: validar `response.metadata?.model` não é Deterministic/Failsafe E `tokensUsed > 0` antes de retornar análise estruturada |
| **V1.9.376-C** | `AdminCasosSimilares.tsx` | Remover botão "Síntese IA agregadora" (devolve template lixo mesmo com GPT ON conforme print Pedro). Esconder toggle "IA constrói query" no cross-link Literatura (dicionário curado suficiente) |
| **Limpeza histórica** | SQL direto via PAT | `UPDATE clinical_reports SET status='deferred_no_data' WHERE generated_by='noa_ai' AND interaction_id IS NULL AND consent_given=false AND (content->>'main_complaint') IS NULL` — marca os 38 stubs órfãos como anomalia datada, sem deletar |

**Anti-padrão capturado** (lição pra Material A/B/C):

> Minha hipótese original sobre "state pollution Casos Similares" foi formulada após ler logs Edge + grep código FRONTEND sem audit empírico do schema BANCO (`clinical_reports.metadata` que NÃO EXISTE) nem dos stubs órfãos históricos (38 lifetime, não só 3 do incidente). Audit via PAT revelou que o mecanismo era diferente. **Aplicação direta de `feedback_coerencia_e_alinhamento_qualquer_fix_17_05`: nunca codar fix sem audit completo. Hipótese sem dados é Material B mesmo quando vem de Claude.**

**Lição operacional**: ao auditar bug, validar SEMPRE:
1. Schema completo da tabela impactada (colunas que existem)
2. Distribuição histórica do fenômeno (é só hoje ou já existia?)
3. Caminhos no código que CRIAM o objeto bugado (não só leem)
4. Comportamento de comparação (lixo vs bom) via PAT empírico

Sem esses 4, hipótese arquitetural pode estar errada mesmo parecendo sólida.

## ADENDO 3 — 19/05 ~10h05 BRT — rationalityAnalysisService confirmado como 3º site (e SEM quality gate)

Teste empírico: Pedro clicou "Gerar análise (traditional_chinese)" em `report_1779193775144_xceccbss5` (= report lixo Pedro admin). Log Edge confirmou padrão idêntico:

```
[REQUEST] messageLength: 10784, intent: ENSINO, assessmentPhase: "none"
[DOC DETECT] normSnippet="[rationality_analysis_mode]\nanalise este relatorio clinico..."
[OPENAI DOWN] 429 insufficient_quota
[AI RESPONSE] model: "TradeVision-Core-Deterministic", responseLength: 76
[DB SAVED] interaction_id: 0ed10843-...
```

Resultado banco: `clinical_rationalities` row salva com:
```json
{
  "rationality_type": "traditional_chinese",
  "assessment": "Registrado. Posso te ajudar com agenda, pacientes, relatórios ou navegação.",
  "recommendations": ["Registrado. Posso te ajudar com agenda, pacientes, relatórios ou navegação...."]
}
```

**Falha arquitetural 3º caso**: `rationalityAnalysisService.saveAnalysisToReport()` (linha ~539) salva resposta em `clinical_rationalities` (tabela) + `clinical_reports.content.rationalities` (jsonb dual-write) **SEM verificar se a resposta veio de GPT real ou Failsafe**. Não há quality gate diferente do pipeline narrator V1.9.84 (que bloqueou criar report quando GPT falhou).

**Padrão arquitetural identificado**: Pipeline pós-AEC TEM quality gate (narrator V1.9.84 obrigatório). Services individuais (CasosSimilares Síntese, rationalityAnalysisService) **NÃO TÊM** — gravam qualquer resposta.

Fix complementar (parqueado V1.9.X+N): cada service que grava output IA deve validar:
```ts
if (response.model === 'TradeVision-Core-Deterministic' || response.model.includes('Failsafe')) {
  throw new Error('GPT_DOWN_NO_GRAVAR')
}
// ou retornar com status='deferred_no_gpt' + reprocessar quando GPT voltar
```

## ADENDO 19/05 ~10h BRT — State pollution também BURLA quality gate do pipeline

Teste empírico subsequente revelou: pipeline pós-AEC TEM quality gate implícito ("narrator V1.9.84 escriba obrigatório pra criar report novo"). Validado:

- **Pedro Paciente (d5e01ead) AEC limpa pós-quota out**: AEC completou 13 fases via Verbatim First V1.9.86, pipeline disparou, CLEANUP_PASS V1.9.109 ativou fail-safe, **REPORT stage falhou 429 → pipeline abortou → SEM clinical_report criado** ✅ Gate funcionou.

- **Pedro admin (17345b36) AEC poluída via Casos Similares**: state pollution criou stub clinical_report upstream (via Síntese IA → processMessage). AEC completou, pipeline disparou narrator que falhou também, MAS V1.9.213 dedupe **reutilizou o stub existente** (criado "há 17s"). Resultado: 3 reports `status='completed'` com lixo no banco.

**Quality gate burlado pelo dedupe**: V1.9.213 não verifica se stub foi criado por chamada técnica vs AEC real. State pollution não só polui state AEC — ela **insere stub que dedupe vai reciclar mesmo sem narrator**.

**Fix arquitetural complementar (parqueado)**:
1. Stubs criados via processMessage técnica devem ter `metadata.source='technical_call'`
2. V1.9.213 dedupe deve filtrar `metadata.source != 'technical_call'`
3. OU: chamadas técnicas devem usar Edge dedicado, não passar pelo Core conversacional

## Memórias correlatas

- `feedback_material_a_b_c_separacao_19_05` — hipótese Pedro foi Material A (autor direto), confirmação via grep foi Material C (calibração empírica)
- `audit_19_05_subcontagem_custo_painel_v1_9_374` — chamadas técnicas com `userId` provavelmente são parte dos 90.5% sem cost tracking pré-V1.9.238 OU passaram a contar como AEC depois
- `feedback_rag_truncation_endemico_17_05` — relacionado: cada call NoaResidentAI manda contexto enorme (RAG + AEC state + persona); chamadas técnicas herdam esse overhead

## Frase âncora

> *"Reutilizar Core conversacional Nôa pra funcionalidade técnica não é só feio — é state pollution real. Cada chamada técnica passando userId inicia/avança AEC silenciosamente. Bug invisível por meses porque GPT mascarava. Quando quota estourou, o esqueleto apareceu. Princípio: separar Nôa stateful (conversacional) de Nôa stateless (funcional). Trigger pra fix: OpenAI voltar + V1.9.X+N autorizado + smoke test cross-feature."*

— Cristalizado 19/05/2026 ~09h45 BRT após Pedro confirmar empíricamente sua hipótese via teste cru pós-quota.
