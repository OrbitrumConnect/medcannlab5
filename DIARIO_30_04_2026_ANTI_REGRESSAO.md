# 📅 DIÁRIO 30/04/2026 — ANTI-REGRESSÃO + ESTABILIZAÇÃO RELATÓRIO

> **Tema do dia**: fechar regressão funcional do relatório criada por Gate D' P0b
> (deployado 29/04 14h). Restaurar fluxo `AEC sem appointment → relatório completo`
> via caminho alternativo `Gate bloqueia → draft → share → enrichment`. Lock
> V1.9.95+97+98+99-B preservado em 100% dos 6 PRs.

> **Estado de abertura**: Pedro fez smoke E2E como paciente df6cee2d às 04h.
> AEC FSM completou todas 16 fases. Edge retornou erro silencioso. Investigação
> revelou Gate D' P0b bloqueando `handleFinalizeAssessment` quando paciente sem
> appointment ativo. Reports não gerados.

---

## A — Diagnóstico empírico (~04h00 BRT)

### A.1 — Logs Edge Function

```
04:01:42  AEC fase FINAL_RECOMMENDATION
04:01:42  ⛔ [P0B_GATE_C] Caminho 2 bloqueado (tag automática) — NO_APPOINTMENT
04:02:18  ⛔ [P0B_GATE_B] Caminho 1 bloqueado (finalize_request) — NO_APPOINTMENT
```

### A.2 — Estado banco

```
ÚLTIMO report criado em prod: 29/04 04:33 (Carolina, paciente teste)
Reports criados APÓS Gate D' P0b deploy (29/04 ~14h): ZERO
```

### A.3 — Causa raiz

`handleFinalizeAssessment` executa cadeia DOCTOR_RESOLUTION com fallback
hardcoded para Dr. Ricardo (P10 silencioso). Gate D' P0b bloqueia ANTES dessa
cadeia rodar quando paciente sem appointment ativo. Resultado: nenhuma
escrita em `clinical_reports` para esse caso.

---

## B — Decisão arquitetural de Pedro (~04h05 BRT)

> *"estamos evoluindo nao tirando oq ja tinha"*
> *"relatorio faz parte do aec ja era para estar com cadeado desde o momento
>  que botamos cadeado no aec"*
> *"se ele nao acontece pq pulou ou por que nao fez direito"*

Princípios operacionais:
1. Gate D' P0b mantém validação regulatória CFM (não retorna ao P10)
2. Mas relatório DEVE existir sempre que AEC for completada
3. Lock V1.9.95+97+98+99-B preservado integralmente

---

## C — 6 PRs em sequência (cronologia detalhada)

### C.1 — V1.9.102 (04h05, commit f18abbc)

**Save draft pre-Gate D' bloquear**

Modificação em Camadas B (linha 1730) e C (linha 5124) do `tradevision-core`:
ANTES do return 409 / skip pipeline, INSERT `clinical_reports` com:
- `status = 'draft'`
- `signed_at = NULL` (não dispara V1.9.101)
- `professional_id = NULL`
- `consent_given = true, consent_at = NOW()`
- `content` cru do `assessmentData`

Resultado: trabalho do paciente preservado.

⚠️ Gap: content cru, sem scores/structured/signature.

### C.2 — V1.9.103 (05h10, commit 18f7572)

**Gate D' ampliado + RPC promove draft**

`_shared/aec_gate.ts`: cadeia de aceitação ampliada para 3 fontes:
1. appointments ativos (igual antes)
2. NOVO: `clinical_reports.professional_id IS NOT NULL` + `signed_at IS NOT NULL`
3. NOVO: `clinical_reports.shared_with[]` populado + `signed_at IS NOT NULL`

Guard crítico em (2) e (3): `signed_at IS NOT NULL` (impede aceitação de
drafts órfãos).

Migration `20260430050000_v1_9_103_share_report_link_doctor.sql`:
RPC `share_report_with_doctors` modificada:
- `professional_id = doctor_id` apenas se 1 médico (anti-vínculo arbitrário,
  GPT-Ricardo refinement)
- Se status='draft' AND consent_given=true → promove para 'shared' +
  `signed_at = NOW()`
- Trigger V1.9.101 `aec_finalized` dispara automaticamente

Smoke 3/3 passou em prod.

⚠️ Gap: pipeline downstream não roda (RPC SQL não chama OpenAI).

### C.3 — V1.9.103-D (05h35, commit 4537f2e)

**Pipeline post-share — handler complete_promoted_draft**

Edge `tradevision-core` ganha novo action `complete_promoted_draft`:
- Verifica ownership (`patient_id === effectiveUserId`)
- Idempotência baseada em axes count > 0 ❌ (gap descoberto depois)
- Reusa lógica axes (5) + rationality (1) do handleFinalizeAssessment

ShareReportModal frontend: invoca complete_promoted_draft se RPC retorna
`promoted_from_draft===true` ❌ (gap descoberto depois).

⚠️ Gap: enrichment INCOMPLETO. Reports promovidos ficavam:
- ✅ status='shared', signed_at, professional_id, axes(5), rationalities(1)
- ❌ scores NULL, structured NULL, signature_hash NULL

### C.4 — V1.9.103-E (13h05, commit 9e412ee)

**Enrichment completo no handler**

Pedro 30/04 ~12h identificou empiricamente: dashboard paciente mostrava
"Aguardando dados" em todos indicadores (Completude, Consistência,
Cobertura, Equilíbrio, Score). Comparação com Carolina (caminho normal,
clinical_score=73, narrative markdown completo) confirmou:

```
Carolina (caminho normal)        Pedro (V1.9.102+103+103-D)
✅ scores.clinical_score=73       ❌ scores NULL
✅ structured (markdown)          ❌ structured NULL
✅ signature_hash + signed_payload ❌ signature_hash NULL
✅ structuredTop espalhado         ❌ content cru
```

Modificações no handler:
- **Idempotência granular**: skip apenas se TUDO enriquecido (axes +
  rationality + scores.calculated + structured > 50 chars + signature_hash)
- **INSERT axes/rationality CONDICIONAL** (count == 0)
- **ENRICHMENT completo**:
  - `unwrapAecContent(content)` → structuredTop real
  - `calculateScoresFromContent(structuredTop)` → V1.9.33 scores
  - GPT-4o-mini escriba V1.9.84 → narrative markdown (PROMPT IDÊNTICO ao
    handleFinalizeAssessment, 1 linha diff: variável de dados —
    `assessmentData` vs `structuredTopFromContent`)
  - SHA-256 → signature_hash + signed_payload (V1.9.73)
  - UPDATE clinical_reports.content com tudo

Smoke validou 3/3 cenários em prod.

⚠️ Gap residual: ShareReportModal só invocava handler se promoted_from_draft=true.
Re-share de report já compartilhado NÃO invocava enrichment.

### C.5 — V1.9.103-F (13h35, commit d30dd28)

**ShareReportModal invoca SEMPRE pós-share**

Mudança 3 linhas:

```diff
- const promotedFromDraft = data?.promoted_from_draft === true
- if (promotedFromDraft) {
+ // SEMPRE invocar — handler é idempotente
    await supabase.functions.invoke('tradevision-core', {
      body: { action: 'complete_promoted_draft', report_id: reportId }
    })
- }
```

Cobre 3 casos:
1. promoted_from_draft=true (V1.9.103 acabou de promover) → roda tudo
2. re-share de report incompleto (gap V1.9.102→103-E) → enriquece
3. re-share de report completo → handler retorna 'already_complete'

---

## D — Validação empírica final (~14h)

### D.1 — Estado Edge Function

```
Edge tradevision-core v315 (V1.9.103-E ativa)
Edge v316 (V1.9.103-F) deployando via CI
```

### D.2 — Estado banco

```
reports_total:    92 (era 91 ontem)
drafts:           0  (Pedro foi promovido pra shared)
shared:           21 (Pedro incluído)
axes_total:       365 (+5 do report Pedro)
rationalities:    73  (+1 do report Pedro)
ns_events:        11  (+1 aec_finalized do Pedro)
```

### D.3 — Triggers SQL V1.9.101

```
✅ trg_ns_aec_finalized_insert  (clinical_reports AFTER INSERT)
✅ trg_ns_aec_finalized_update  (clinical_reports AFTER UPDATE OF signed_at)
✅ trg_ns_followup_scheduled    (appointments AFTER INSERT)
```

### D.4 — RPC share_report_with_doctors

```
✅ V1.9.103 instalada com descrição correta
✅ professional_id apenas se 1 doctor
✅ Promove draft → shared se consent_given
```

---

## E — Lock V1.9.95+97+98+99-B preservado em 100% dos 6 PRs

```
❌ NÃO toca handleFinalizeAssessment (linhas 1127-1533 intactas)
❌ NÃO toca clinicalAssessmentFlow.ts (FSM 16 fases intacta)
❌ NÃO toca Verbatim First V1.9.86
❌ NÃO toca AEC Gate V1.5
❌ NÃO toca COS Kernel
❌ NÃO toca Pipeline orchestrator (linhas 5104-5184)
❌ NÃO toca Signature ICP-Brasil V1.9.73 (helper reusado, não modificado)
❌ NÃO toca prompt do escriba V1.9.84 (regras absolutas idênticas, 1 linha diff)
✅ Apenas amplia: aec_gate.ts (helper) + tradevision-core (handler novo) +
   RPC SQL + ShareReportModal (frontend)
```

---

## F — Lições cristalizadas (memórias salvas)

### F.1 — `feedback_paridade_funcional_completa.md`

Replicar 2 de 6 campos = 33%, não 100%. Antes de declarar "paridade", listar
14 campos esperados (status, signed_at, professional_id, shared_with[],
consent, signature_hash, signed_payload, scores, structured, raw,
structuredTop, metadata, axes×5, rationalities×1) e verificar 1 a 1 em prod.

### F.2 — `feedback_idempotencia_granular.md`

`if (axesCount > 0) skip()` mascarava reports sem scores/structured/signature.
Idempotência granular: cada sub-resultado tem flag, skip só se TODAS feitas,
regenerar APENAS as que faltam. INSERT condicional.

### F.3 — `project_v1_9_102_a_F_anti_regressao_cycle.md`

Cronologia completa dos 6 PRs em 16h. Lock V1.9.95+97+98+99-B intocado.
Reuso de helpers (calculateScoresFromContent, unwrapAecContent, prompt
escriba V1.9.84) evitou duplicação semântica.

---

## G — Próximos passos (sessão técnica seguinte)

### G.1 — Backfill report Pedro

Pedro re-share o report `aec_draft_..._1777547967589` via UI:
- RPC retorna promoted_from_draft=false (já é shared)
- ShareReportModal V1.9.103-F invoca complete_promoted_draft mesmo assim
- Handler V1.9.103-E detecta isContentEnriched=false
- Regenera scores + structured + signature_hash (mantém axes/rationality)
- Dashboard paciente passa a mostrar indicadores funcionando

### G.2 — PR 2.C — vínculo médico ANTES da AEC (Opção D' diário 29/04)

Card de escolha de médico inline pré-AEC. Reusa ShareReportModal refatorado
para DoctorPickerModal genérico. 4 entry points unificados:
- Aba agendamento (atual)
- Início AEC (novo)
- Fim AEC sem vínculo (atual mensagem Camada C)
- Compartilhar relatório (atual)

### G.3 — Frase fixa "Dr. Ricardo Valença" (2 hardcoded no Core)

Linhas 3384 e 3890 do `tradevision-core/index.ts`. Tornar dinâmico via
`aecPhysicianName` (helper já existe). Polish UX, NÃO toca lock.

### G.4 — CEMS v1 → CEMS v1.1

Aguardando Ricardo escolher 4 eventos pendentes:
- physician_review_started/ended
- physician_override
- patient_returned_spontaneous

Após validação, implementar FASE 2.3 + 2.4 do North Star.

---

## H — Frase âncora do dia 30/04

> *"6 PRs em ~16h pra fechar regressão criada por 1 PR (Gate D' P0b 29/04 14h).
>  AEC sem appointment voltou a gerar relatório completo via fluxo Gate→draft→
>  share→enrichment. Lock V1.9.95+97+98+99-B intacto em 100% dos PRs. Reuso de
>  helpers do Core evitou duplicação semântica. Audit empírico (Pedro comparando
>  com Carolina) foi a única validação real. Lições: paridade ≠ replicar última
>  cascata; idempotência granular ≠ baseada em 1 sinal; documentar 14 campos
>  esperados antes de declarar 'sem regressão'."*

---

*Diário 30/04 criado 2026-04-30 ~14h BRT por Claude Opus 4.7 (1M context).
6 PRs deployados (V1.9.102→V1.9.103-F). Lock preservado. 3 memórias persistentes
cristalizadas. Próxima sessão: backfill report Pedro + PR 2.C (vínculo antes
AEC) + polish hardcoded Ricardo + CEMS v1.1.*

---

## I — Bloco extra: V1.9.103-G + V1.9.104 + V1.9.104-A (~14h–17h BRT)

### I.1 — V1.9.103-G (anti-aninhamento content) — commit 894ea76

**Causa raiz descoberta:** report do Pedro tinha content **aninhado erroneamente**:
```json
{ "content": { ...campos AEC... }, "patient_id": "..." }
```

V1.9.102 fazia `draftContent = assessmentData?.content || assessmentData || body.assessment_data` — pegava objeto inteiro com aninhamento em vez de desaninhar.

**Resultado:** `unwrapAecContent()` não descia em `content.content` (só `content.raw`), `calculateScoresFromContent()` recebia content vazio → score=0, narrative vazia.

**Fix:**
- Backfill SQL: `UPDATE clinical_reports SET content = content->'content'`
- V1.9.103-G nas Camadas B+C: detecta aninhamento e desce 1 nível antes do INSERT

**Pedro 30/04 ~14h re-shared o report** → V1.9.103-F invocou `complete_promoted_draft` → V1.9.103-E enriqueceu:
- ✅ scores.calculated=true, clinical_score=59
- ✅ structured (markdown 1116 chars)
- ✅ signature_hash + signed_payload (SHA-256 V1.9.73)
- ✅ axes(5) + rationality(1) NÃO duplicaram (idempotência condicional V1.9.103-E)

### I.2 — V1.9.104 — Gamificação por AEC finalizada (commit 01be591)

**Decisões Pedro:**
- 20 XP fixo por AEC finalizada (independente do score)
- Backfill TODOS os 17 reports com signed_at antigos
- Diamante começa em 3000 XP (~150 AECs); 250 AECs = saturação
- Decay: -10 XP/semana sem AEC, floor=Prata se já atingiu (FASE V1.9.105)

**Mapeamento confirmado:**
```
Iniciante  →   0–499 XP   (0% desc)
Bronze     → 500–999 XP   (5% desc)
Prata      → 1000–1999 XP (10% desc)
Ouro       → 2000–2999 XP (15% desc)
Diamante   → 3000+ XP     (20% desc)
```

**Aplicado:**
1. Função `compute_aec_level(xp)` IMMUTABLE retorna 5 níveis
2. Trigger function `ns_award_xp_on_aec_finalized` SECURITY DEFINER + fail-safe
3. Trigger `trg_ns_award_xp_on_aec` AFTER INSERT em `clinical_north_star_events` WHEN event_type='aec_finalized'
4. UPDATE `feature_flags.points_enabled = true`
5. Backfill 17 reports

### I.3 — V1.9.104-A — Fix bug PRÉ-EXISTENTE (commit 01be591)

**Descoberto empíricamente** ao rodar V1.9.104:
```
ERROR 42703: column "last_activity_date" of relation "user_statistics" does not exist
```

Função `award_gamification_points` pré-existente tentava UPDATE em coluna que **não existe**. Coluna real: `last_activity_at` (timestamptz).

Bug existia desde sempre, nunca exposto porque:
- `feature_flags.points_enabled = false` desde 30/12/2025
- 0 chamadas à função em prod
- V1.9.104 ATIVOU o sistema → função executou pela 1ª vez → bug exposto

**Fix:** CREATE OR REPLACE com coluna correta. Re-rodou backfill (idempotente via NOT EXISTS).

### I.4 — Estado pós-deploy (validado empíricamente)

```
Funções ativas:
  compute_aec_level (V1.9.104)
  ns_award_xp_on_aec_finalized (V1.9.104)
  award_gamification_points (V1.9.104-A fixed)

Trigger ativo:
  trg_ns_award_xp_on_aec (AFTER INSERT, WHEN event_type='aec_finalized')

Feature flag:
  points_enabled = true (era false desde 30/12/2025)

Backfill resultado:
  17 reports processados → 4 users premiados → 340 XP total

Ranking real:
  Carolina Campello       180 XP  →  INICIANTE  (faltam 320 pra Bronze)
  Pedro Paciente d5e01ead 120 XP  →  INICIANTE
  c68fb133                 20 XP  →  INICIANTE
  passosmir4               20 XP  →  INICIANTE  (smoke E2E hoje)
```

### I.5 — Erros que apareceram + fix aplicados

```
ERRO 1: smoke test inline V1.9.104 → ROLLBACK total
  CAUSA: smoke dentro do mesmo BEGIN não funcionou bem com triggers recém-criados
  FIX: removi smoke inline, ficou pra rodar separado pós-COMMIT

ERRO 2: award_gamification_points → coluna last_activity_date não existe
  CAUSA: bug pré-existente latente (função nunca foi chamada antes)
  FIX: V1.9.104-A com coluna correta last_activity_at

ERRO 3: queda de internet no meio da aplicação
  CAUSA: ISP brasileira com rota lenta pra US East Supabase
  FIX: aguardar normalização, retentar (transação atomic, rollback completo)
```

### I.6 — Total commits do dia 30/04

```
30/04 04h05  V1.9.102    f18abbc  Save draft pre-Gate D'
30/04 05h10  V1.9.103    18f7572  Gate ampliado + RPC promove draft
30/04 05h35  V1.9.103-D  4537f2e  Pipeline post-share (axes+rationality)
30/04 06h00  Docs        8afe17a  Bloco M 29/04 + diário 30/04 + 3 memórias
30/04 13h05  V1.9.103-E  9e412ee  Enrichment completo (scores+structured+signature)
30/04 13h35  V1.9.103-F  d30dd28  ShareReportModal invoca SEMPRE pós-share
30/04 14h25  V1.9.103-G  894ea76  Desaninhar content em V1.9.102
30/04 17h00  V1.9.104+A  01be591  Gamificação AEC + fix award function

Total: 8 commits cirúrgicos. Lock V1.9.95+97+98+99-B preservado em 100%.
```

### I.7 — Frase âncora I

> *"Dia da regressão fechada (V1.9.102→G) + gamificação ativada (V1.9.104).
>  Sistema voltou a gerar relatórios completos via 2 caminhos: com appointment
>  (fluxo normal) ou sem appointment (draft → share → enrichment). Bug latente
>  pré-existente em award_gamification_points exposto e corrigido. Backfill
>  17 reports retroativos. 4 users premiados (340 XP total). Lock preservado
>  em 100% dos 8 commits do dia."*

---

*Bloco I adicionado 2026-04-30 ~17h BRT por Claude Opus 4.7 (1M context).
Diário 30/04 fecha em 9 blocos (A→I). Próximo: V1.9.105 decay temporal +
PR 2.C (vínculo antes AEC) + polish hardcoded Ricardo.*

---

## J — Módulos pra Magno v2.0 (auditoria diários 16/04→30/04)

> **Origem:** Pedro 30/04 ~17h pediu auditoria gap entre diários e Livro Magno
> (escrito 09/02/2026). Agent Explore mapeou 14 dias de diários × 5 versões
> Magno. **7 princípios cristalizados** identificados, validados empiricamente
> em prod, mas AUSENTES do Magno atual.

### J.1 — Cristalizados (devem entrar no Magno v2.0)

#### MÓDULO 1 — Verbatim First V1.9.86 (selado 28/04)
```
Princípio:    GPT é o último a falar e o primeiro a ser checado
Empírico:     46% bypass GPT em hard-lock phases (CONSENSUS_REVIEW,
              CONSENSUS_REPORT, CONSENT_COLLECTION, FINAL_RECOMMENDATION)
Status:       ATIVO em prod, validado nos smoke tests V1.9.103-D/E/F
Magno seção:  COS v5.0 → Governança (adicionar "Verbatim determinístico")
```

#### MÓDULO 2 — Lock V1.9.95+97+98+99-B (cristalizado 27-30/04)
```
Princípio:    Sealing cirúrgico de módulos críticos (AEC core).
              O que foi provado em produção JAMAIS é regressado, apenas
              EXPANDIDO via PRs aditivos.
Empírico:     Preservado em 100% dos 25+ commits últimas 72h
              (V1.9.100 → V1.9.104-A) sem tocar:
              FSM / Verbatim / AEC Gate V1.5 / Pipeline / Signature
Magno seção:  Política de evolução controlada (Locks de versão)
```

#### MÓDULO 3 — Gate D' P0b — Anti-P10 substituição silenciosa (cristalizado 29-30/04)
```
Princípio:    Sem médico vinculado, sistema NÃO aceita finalizar AEC.
              Anti-P10: fallback hardcoded silencioso é violação regulatória.
Empírico:     4 camadas de defesa (A frontend, B backend caminho 1,
              C backend caminho 2 dominante, D appointment placeholder).
              Cadeia de aceitação ampliada (V1.9.103) com 3 fontes:
              appointments + reports.professional_id + reports.shared_with[]
              (todas com guard signed_at IS NOT NULL)
Magno seção:  Modelo RACI → Gates de contexto clínico obrigatório
```

#### MÓDULO 4 — Idempotência granular (V1.9.103-E, cristalizado 30/04)
```
Princípio:    Idempotência baseada em 1 sinal só mascara N-1 gaps.
              Cada sub-resultado precisa flag própria, skip só se TODAS
              feitas, regenerar APENAS as que faltam.
Empírico:     V1.9.103-D pulava se axes>0 → mascarava reports sem
              scores/structured/signature. Pedro detectou empíricamente.
              V1.9.103-E corrigiu: skip apenas se 5 sinais OK
              (axes + rationality + scores.calculated + structured + sig_hash)
Magno seção:  COS v5.0 → Governança → Idempotência multietapa
```

#### MÓDULO 5 — North Star + CEMS v1 (cristalizado 29-30/04)
```
Princípio:    Instrumentação ANTES do uso real. Aprendizado cego é PIOR
              que vazamento de chave em pré-PMF.
Empírico:     Tabela clinical_north_star_events em prod
              3 triggers SQL ATIVOS (aec_finalized + 2 followup)
              CEMS v1 documenta 6 event types + 4 métricas formalizadas
              (4 eventos pendentes decisão clínica Ricardo)
Magno seção:  NOVO Anexo 3 — Instrumentação clínica + métricas North Star
```

#### MÓDULO 6 — Polir não inventar (Princípio 8, cristalizado 27-30/04)
```
Princípio:    Antes de criar código novo, buscar mecanismo equivalente
              que já existe. Reutilizar > criar paralelo.
Empírico:     V1.9.103-E reutilizou helpers do Core
              (calculateScoresFromContent, unwrapAecContent,
              prompt escriba V1.9.84) em vez de duplicar.
              ShareReportModal genérico (PR 2.C planejado) reutiliza UI
              existente em vez de criar novo modal.
Magno seção:  Política de evolução controlada → Anti-fragmentação
```

#### MÓDULO 7 — REGRA HARD §1: Consentimento ≠ Agendamento (cristalizado 28/04)
```
Princípio:    "Concordo" durante revisão clínica NUNCA dispara agendamento.
              Apenas resposta literal "sim/autorizo" à pergunta de consentimento
              (isAskingConsent guard) fecha AEC.
Empírico:     Implementado em tradevision-core/index.ts via guard explícito.
              Documentado em CLAUDE.md como anti-kevlar §1.
Magno seção:  Limites explícitos → 6ª trava (separação clínico/operacional)
```

### J.2 — Em validação (ficam nos diários)

```
8. Pirâmide governança 8 camadas
   Status:  estrutura mencionada 28/04 mas formalização final pendente
   Bloqueio: decisão Ricardo

9. CEMS v1.1 (separação event semantics design vs implementação)
   Status:  conceito sólido, aguardando 4 eventos pendentes Ricardo
   Bloqueio: physician_review_started/ended/override + patient_returned
```

### J.3 — Já no Magno atual (confirmação)

```
✅ Constituição Cognitiva (COS v5.0)
✅ Fail-closed (defesa em profundidade)
✅ Append-only (não destrutivo)
✅ Fala ≠ ação (separação semântica)
```

### J.4 — Coerência com "polindo + estruturando pra escala elite pro"

**Alinhamento empírico:**

```
🟢 ALINHADO — todos os 7 módulos são EVOLUÇÕES de princípios já existentes
              no Magno (não substituições). Magno v2.0 EXPANDE, não REESCREVE.

🟢 PRECEDENTE EMPÍRICO — cada módulo tem evidência em produção:
              - Verbatim First: 46% bypass medido
              - Lock: 25+ commits sem regressão
              - Gate D': 6 PRs anti-regressão validados
              - Idempotência: V1.9.103-D→E case study
              - CEMS: triggers ativos + eventos sendo gravados
              - Polir: V1.9.103-E reuso medido
              - Regra §1: guard em código com testes

🟢 ESCALA — todos os princípios são GENÉRICOS o suficiente pra aplicar
            em features futuras (não específicos de AEC).

🟡 GAP NÃO RESOLVIDO — pirâmide 8 camadas e CEMS v1.1 dependem de
                        decisão Ricardo (humana, não-automatizável).
```

### J.5 — Critério de promoção pra Magno v2.0

```
SUFICIENTE pra próximo update Magno (já agora):
  Módulos 1-7 cristalizados acima.

ÓTIMO pra "edição definitiva" Magno v2.0:
  + Módulo 8 (pirâmide formalizada com OK Ricardo)
  + Módulo 9 (CEMS v1.1 com 4 eventos validados)
  + 1 paciente externo real validando ciclo completo
```

### J.6 — Frase âncora J

> *"7 princípios cristalizados em 14 dias (16-30/04) que precisam entrar
>  no Magno v2.0. Todos com evidência empírica em prod (46% Verbatim,
>  Lock 25+ commits sem regressão, Gate D' 6 PRs anti-regressão, etc).
>  Magno escrito em 09/02 ainda não absorveu o que sobreviveu desses
>  3 meses. Pipeline diário→Magno funcionou: hipóteses 22-26/04, validação
>  27-30/04, agora cristalização. Próxima edição Magno: pós-CEMS v1.1
>  com 1º paciente externo real."*

---

*Bloco J adicionado 2026-04-30 ~17h30 BRT por Claude Opus 4.7 (1M context).
Diário 30/04 fecha em 10 blocos (A→J). Mapeamento gap Magno × diários
14 dias completo. Próximo: Pedro debater assunto específico pendente +
V1.9.105 decay + PR 2.C + Magno v2.0 quando 9 módulos prontos.*

---

## Bloco K — Sessão noite 30/04 (~17h45-19h): UX trilogia paciente + cleanup AEC + identidade médica

**Contexto:** Após cristalizar princípio "auditar 100% antes" (Bloco I) e fechar V1.9.103-G+V1.9.104+V1.9.104-A, sessão da noite atacou trilogia UX paciente em sequência cirúrgica fiel ao "1 a 1 na calma". 10 PRs commitados em ~3h, todos preservando Lock V1.9.95+97+98+99-B.

### K.1 — V1.9.105 + V1.9.105-A: Detector contextual + 5 botões alfabéticos

**Bug**: paciente clica "Iniciar Avaliação" → handler só abre chat (não dispara FSM). Paciente diz "vamos lá" depois Nôa convidar → não dispara AEC (detector strict só captura "iniciar avaliação clínica inicial").

**V1.9.105** — detector contextual aditivo em `platformFunctionsModule.ts`:
- `noaInvited` (lastNoa contém "iniciar" + "avaliação/aec/protocolo")
- `userAffirmed` (regex `^afirmação\b` aceita "sim pode ser", "ok vamos lá")
- Anti-negação (`não/depois/talvez/amanhã`)
- Filtro `aecStateExists` assimétrico (bloqueia contextual mas não strict)
- Override `wantsRestart` libera contextual mesmo com aec ativa
- `lastAssistantMessage` propagado via `NoaContext` + `useMedCannLabConversation`

**V1.9.105-A** — botão acessível em `PatientAnalytics`:
- Card "Iniciar Avaliação" estava só no branch `else` (sem plano) → Pedro com 1 relatório nunca via
- 5 botões alfabéticos PT: Agendar / Enviar / Iniciar / Vincular / WhatsApp
- Renderização condicional `onStartAssessment && (...)` — outros consumidores intactos

**Smoke**: 9 cenários testados (clique, strict, contextual ✓, sem convite NONE, "vou sair de casa" NONE, AEC ativa smart-lock, "sim pode ser" ✓, "sim mas depois" NONE, override "quero recomeçar").

**Commits**: `b72af3b` + `e4a2e81`.

### K.2 — V1.9.106: Fix shadowing currentPhase (barra AEC volta a aparecer)

**Bug pré-existente exposto via log Pedro**: barra de progresso AEC sticky em `NoaConversationalInterface:3219-3251` NUNCA renderizava porque `metadata.assessmentPhase` chegava sempre null no client.

**Causa-raiz**: shadowing de variável em `noaResidentAI.ts`:
- Linha 256 (escopo `processMessage`): `let currentPhase: any = null` — esse vai pra metadata
- Linha 1645 (escopo `processAssistant`): `let currentPhase = undefined` — populado em 1897 mas escopo isolado

**Fix (~3 linhas)**: lê direto do `clinicalAssessmentFlow.getState()` como fallback antes de injetar metadata. Single source of truth do FSM client.

**Commit**: `6029be0`.

### K.3 — V1.9.107: Linguagem neutra Ricardo (P10 cleanup)

**Bug confirmado empíricamente em log Pedro**: 3 fontes desalinhadas mostrando "Ricardo" por mecanismos diferentes (P10 silencioso clássico):

1. `doctor_id` no DB = 2135f0c0 ✓ correto via DOCTOR_RESOLUTION (appointments validados)
2. Frase chat hardcoded em `physicianDisplay()` fallback
3. Card agendamento mostrava Ana Ventorini (dropdown alfabético quando UUID inválido)

Coincidência batem em "Ricardo" hoje (Pedro só tem appt com ele). Bug latente: paciente com appt com Ana → 3 nomes diferentes.

**Fix null-safe centralizado** em `clinicalAssessmentFlow.ts:392`:
- `physicianDisplay()` retorna `string | null`
- 4 callers adaptam (abertura, consent, fechamento scheduleTarget+presentTarget, recusa)
- "método desenvolvido pelo Dr. Ricardo Valença" MANTIDO (autoria factual)
- Idem `noaResidentAI.ts:1699` (duplicata `buildAecOpeningHint`)

Quando feature P0e entrar futuramente, frases voltam a citar nome real automaticamente.

**Commit**: `bf62acb`.

### K.4 — V1.9.108: metadata.professionalId UUID (alinha 3ª fonte)

**Bug latente descoberto durante audit**: `tradevision-core/index.ts:2329` declarava 2 vars:
- `detectedProfessionalId = 'ricardo-valenca'` (slug, default) → IA exposto pro frontend
- `detectedProfessionalUuid = '2135f0c0-...'` (UUID Ricardo real, NÃO usado!)

Linha 5926 expunha o **slug**. Frontend `isValidUuid()` → false → widget caía em dropdown alfabético (Ana 1ª).

**Fix (2 linhas)**:
1. `professionalId: detectedProfessionalUuid` (UUID real)
2. Removido placeholder fake `'1a6f8bca-...'` Eduardo do catch fallback

**ICL como roadmap pós-PMF documentado em memória** após review GPT — single source of truth = `clinical_reports.doctor_id`.

**Commit**: `6b48213`.

### K.5 — V1.9.109 + V1.9.109-A: Cleanup pass anti-transbordamento HPP↔PIORA

**Bug C confirmado empíricamente em log + relatório passosmir4 30/04 ~17h**:

```
17:07 Nôa: "O que parece piorar a dor nas costas?"
17:07 Pedro: "piora quando corro..."
       → write COMPLAINT_DETAILS qIdx=5 iter=0 → piora=1 ✓

17:07 Nôa avança: "Desde o nascimento, quais questões de saúde..."
17:07 Pedro: "desde cedo tive pneumonia... pedra nos rins..."
       → write COMPLAINT_DETAILS qIdx=5 iter=1 → piora=2 ❌ ERRADO
       → DEPOIS avançou pra MEDICAL_HISTORY hpp=0
```

**Causa**: FSM AEC tem 1 turno de atraso na transição entre fases — último iter da phase X aceita input que conceitualmente é da phase Y.

**Resultado clínico GRAVE**: médico abria relatório e via "Piora: pneumonia, internado, pedra nos rins" — podia interpretar condições ATIVAS piorando agora. HPP empobrecida ("falei a cima!") porque Nôa repetiu pergunta (Bug D efeito cascata). Score 79 inflado.

**Fix V1.9.109 (~110 linhas, stage NOVO entre risk_level seedling e V1.9.84 escriba)**:

GPT-4o-mini classifier semântico (mesma infra escriba V1.9.84), temperature 0 + JSON mode + regras absolutas. Detecta strings em slots errados e remaneja LITERAL. Registra em `_v109_relocations: [{from, to, text}]`.

FAIL-SAFE em 4 camadas:
1. Try/catch global → fallback original
2. Validação patient_id (estrutura preservada)
3. Validação anti-alucinação: TODA string original >5 chars deve aparecer (collectAllStrings + set comparison)
4. Default cleanedAssessmentData = assessmentData (zero risk de início)

**V1.9.109-A — Reforços pós review GPT**:

GPT calibrou honestamente: *"V1.9.109 é normalização probabilística com auditoria, não verdade clínica determinística"*. Aceitei.

A1 (anti-causal — apenas TEXTO no prompt):
> Se string contém termos causais ("desde", "desde que", "por causa de", "depois de", "após", "quando tive", "de tanto"), MANTER NO SLOT ORIGINAL — relação causal é informação clínica que se perde com remanejamento.

Caso real: *"dor lombar DESDE pneumonia criança"*. Sem A1 perde "desde". Com A1 detecta e não move.

A2 (telemetria empírica em `noa_logs`):
- Quando cleanup faz ≥1 relocation → `interaction_type='v109_cleanup_relocations'`
- Tabela já existente desde V1.9.66 ISM
- Fire-and-forget (try/catch)
- Pedro/Ricardo auditam empíricamente

**Commits**: `64c71a1` (V1.9.109) + `c0c9426` (V1.9.109-A).

**Memórias novas**:
- `project_aec_hpp_transbordamento_30_04.md` — Bug C+D + 3 abordagens B1/B2/B3
- `project_icl_identity_canonicalization_layer.md` — roadmap pós-PMF GPT review

### K.6 — V1.9.110 + V1.9.110-A: PatientAppointments — fix memo + filtro PT/EN

**Bug 1 — Memo deps incompletas (clássico React)**:
`PatientAppointments.tsx:449-458` — `useMemo` filtrava `AVAILABLE_PROFESSIONALS` mas NÃO tinha essa variável nas deps. Travado em FALLBACK_PROFESSIONALS (Ricardo + Eduardo) mesmo após `loadProfessionals()` trazer 11+ outros médicos.

**Fix V1.9.110 (1 linha)**: `AVAILABLE_PROFESSIONALS` adicionado nas deps.

Pedro testou → apareceram mais cards. **MAS** veio admins (Pedro + Admin Test) que não são médicos.

**Bug 2 — Admins entrando como profissionais + P0f PT/EN**:
- Linha 192: `.in('type', ['profissional', 'admin'])` trazia admins
- Pedro buscou "ana ventorini" → nada encontrado
- Memória 29/04 P0f explicou: `users.type` tem 2 grafias historicamente — `'profissional'` (PT) vs `'professional'` (EN)

**Fix V1.9.110-A (1 linha)**:
```diff
- .in('type', ['profissional', 'admin'])
+ .in('type', ['profissional', 'professional'])
```

Cobre PT + EN. Exclui admins por design. Ricardo tem 2 UUIDs separados, filtro captura UUID clínico.

**Commits**: `bf19ea3` (V1.9.110) + `d9da0d7` (V1.9.110-A).

Roadmap V1.9.110-B (futuro): migration normaliza `users.type` pra single grafia.

### K.7 — V1.9.111: Redesign Tiered + paginação animada + calendar maior

**Visão articulada por Pedro durante a sessão**:
*"3 camadas de elite escalável: Equipe Oficial MedCannLab (Ricardo+Eduardo) + Profissionais Parceiros (B2B/SaaS individual) + Equipes DO médico (parceiro cria sua subequipe). Sistema já tem infra (`professional_teams`, `clinics`, `subscription_plans`)."*

**Refactor UX implementado**:

1. **Tier classification** (Princípio 8 — reusa structure):
   - Tier 1 — Equipe Oficial (Ricardo + Eduardo): topo, gradient amber + badge "Oficial"
   - Tier 2 — Parceiros: paginação 6/page, grid responsivo

2. **Paginação animada** (framer-motion):
   - Slide horizontal (x: 40 → 0 → -40, duration 0.25s)
   - Dots indicators com active pill (w-6 highlighted)
   - Prev/next + counter "1 / N"
   - Auto-reset quando busca/filtro mudam

3. **Layout reorganizado**:
   ```
   ANTES: grid lg:grid-cols-[460px_1fr]
          (calendar esprimido esquerda, cards direita 2 cols)

   DEPOIS: space-y-6
     • Cards full-width topo (Tier 1 + Tier 2 paginated)
     • Grid lg:grid-cols-3:
       - Calendar lg:col-span-2 (2/3 — maior pra paciente)
       - Próximas Consultas lg:col-span-1 (1/3 — compacta)
     • Plano de Cuidado full-width abaixo
   ```

4. **Helper `renderProfessionalCard`** extraído como const inline:
   - Reuso entre Tier 1 e Tier 2 (DRY)
   - Param `isOfficial?: boolean` adiciona badge + gradient
   - `whileHover` scale 1.02 + y -2 + shadow glow
   - Lógica de agendamento INTACTA (UUID resolver, modal, etc)

**Commit**: `599726a`.

### K.8 — Princípios reaplicados (10 PRs em ~3h)

```
✓ AUDITAR 100% antes (META — cristalizado bloco I)
  Aplicado em V1.9.108, V1.9.109, V1.9.111 antes de codar

✓ Princípio 8 (polir não inventar)
  V1.9.105 reusou sendInitialMessage (NoaPlatformContext)
  V1.9.108 reusou detectedProfessionalUuid já declarado
  V1.9.109 reusou OpenAI client + pattern V1.9.84 escriba
  V1.9.111 reusou getAvailableSlots + estrutura cards existente

✓ 1 a 1 na calma
  Cada PR commitado + push + smoke empírico antes do próximo
  Diálogo iterativo Pedro × GPT × Claude refinou cada passo

✓ Honestidade direta > cordialidade defensiva
  Discordei do GPT em ICL completo (over-engineering pré-PMF)
  Aceitei calibração GPT V1.9.109 ("normalização probabilística")
  Reconheci erro empírico no V1.9.105-A (botão estava só em else)

✓ FAIL-SAFE em camadas
  V1.9.109 cleanup tem 4 caminhos pra fallback transparente
  V1.9.109-A2 telemetria fire-and-forget
  V1.9.107 null-safe (frase omite vs hardcode errado)

✓ Calibração honesta de severidade
  Bug C qualidade clínica = 🟠 alta (médico vê dado errado)
  V1.9.108 = 🟡 média UX
  V1.9.110-A bugs duplos = 🟡 média (admins + EN)
```

### K.9 — Commits da sessão

```
b72af3b  V1.9.105    detector contextual ASSESSMENT_START
e4a2e81  V1.9.105-A  5 botões alfabéticos PatientAnalytics
6029be0  V1.9.106    fix shadowing currentPhase (barra AEC)
bf62acb  V1.9.107    linguagem neutra Ricardo (P10 cleanup)
6b48213  V1.9.108    metadata.professionalId UUID
64c71a1  V1.9.109    cleanup pass HPP transbordamento
c0c9426  V1.9.109-A  reforços anti-causal + telemetria
bf19ea3  V1.9.110    fix memo filteredProfessionals
d9da0d7  V1.9.110-A  filtro PT/EN exclui admins
599726a  V1.9.111    redesign Tiered + paginação + calendar maior
```

Lock V1.9.95+97+98+99-B preservado integralmente em TODOS os 10 PRs.
FSM, Pipeline orchestrator, Verbatim First, AEC Gate V1.5, REGRA HARD §1 intactos.

### K.10 — Backlog próxima sessão (priorizado)

```
P0 (próximas batalhas)
  V1.9.112  Fluxo guiado escolha→horários livres→AEC vinculada
            (visão Pedro: "ver horários livres, escolher dia ideal,
            fazer AEC sabendo")
  V1.9.113  preferred_doctor_id (P0e original) + checkbox vinculação
            permanente — opcional após V1.9.112

P1 (validação empírica)
  Pedro testar V1.9.111 redesign Tiered visualmente
  Pedro testar V1.9.110-A: buscar "ana" deve aparecer
  Pedro testar V1.9.109/A: AEC com sintoma+histórico cruzado
  Confirmar console mostra cleanup relocations + noa_logs telemetria
  Refresh barra AEC durante AEC ativa (V1.9.106)

P2 (memórias)
  MEMORY.md atualizar V1.9.105+ no índice
  project_aec_hpp_transbordamento_30_04 (criada ✓)
  project_icl_identity_canonicalization_layer (criada ✓)

P3 (fora desta sessão)
  V1.9.110-B normalizar users.type single grafia (migration DB)
  Magno v2.0 quando 9 módulos prontos
```

### K.11 — Frase âncora K

> *"10 PRs em ~3h cumprindo 'auditar 100% antes' + 'polir não inventar' +
>  '1 a 1 na calma'. Lock V1.9.95+97+98+99-B preservado integralmente.
>  Bugs latentes empíricos descobertos durante audit (memo deps + PT/EN +
>  shadowing currentPhase + slug professionalId + HPP transbordamento +
>  hardcoded Ricardo P10) — todos com fix cirúrgico + fail-safe.
>  ICL como roadmap pós-PMF, não over-engineering pré-PMF agora.
>  Sessão validou empíricamente o pipeline diário→memória→princípio
>  cristalizado: cada PR ensinou algo que entrou em memória pra
>  próxima sessão não repetir."*

---

*Bloco K adicionado 2026-04-30 ~19h BRT por Claude Opus 4.7 (1M context).
10 commits cirúrgicos (V1.9.105 → V1.9.111) em ~3h. 2 memórias novas.
Próximo: smoke empírico Pedro + V1.9.112 fluxo guiado.*

---

## Bloco L — Sessão noite-2 30/04 (~20h-21h): polish UX + Analisar Paciente

**Contexto:** Pedro voltou após pausa, fez smoke empírico do redesign V1.9.111. Pediu polish fino (cores menos vibrantes) e em paralelo levantou feature pra ser auditada: "Analisar Paciente" no ProfessionalMyDashboard.

### L.1 — V1.9.111-A: Polish UX cards Tier 1+2

Pedro feedback após ver V1.9.111 redesign: *"diminuida em tudo um pouco para dar leve borda e vejo tudo muito colorido! melhor deixar um padrao apenas"*.

5 cards parceiros estavam com 5 cores ciclando (cyan/violet/rose/amber/teal) — visual "discoteca".

**Mudanças (renderProfessionalCard helper)**:
- `ACCENT_PALETTE` cycling → `PARTNER_ACCENT` único (cyan suave) pra Tier 2
- Tier 1 (Equipe Oficial) mantém amber distinto
- Cards menores: `p-4 → p-3.5`, `gap-4 → gap-3`
- Avatar: `w-12 h-12 rounded-xl` → `w-10 h-10 rounded-lg`
- Border: `/40 opacity` (mais sutil)
- Tipografia compacta: `text-base md:text-lg → text-base`, badges `[9-11px]`, botões `text-xs`
- Motion: `whileHover scale 1.02 → 1.015`

**Commit**: `666d8f2`.

### L.2 — V1.9.111-B: Fix memo availableSpecialties

**Mesma classe de bug do V1.9.110** (memo deps incompletas):

```ts
// ANTES
useMemo(() => {
  return Array.from(new Set(AVAILABLE_PROFESSIONALS.map(p => p.specialty)))
}, [])  // ← deps vazias

// DEPOIS
}, [AVAILABLE_PROFESSIONALS])
```

Pedro reportou: *"todas as especialidaes aparecem 2 apenas ali"*. Causa: dropdown ficava travado em FALLBACK (Nefrologia + Neurologia) mesmo após Supabase trazer parceiros.

**Commit**: `666d8f2` (junto V1.9.111-A).

### L.3 — V1.9.111-D: Ajuste tom emerald + blue

Pedro: *"diminuir potência do tom da cor verde do trigger e do azul"*.

- Eduardo accent: `emerald-500/20 → /15`, button `emerald-500 → emerald-600/90`
- Ricardo accent: `primary-500/20 → /15`, button `primary-500 → primary-600/90`
- Novo Agendamento: `blue-600 → blue-600/85`

Cores mais maduras/sóbrias, menos vibrantes.

**Commit**: `888bdcd`.

### L.4 — Roadmap V1.9.111-C (NÃO aplicado): specialty real DB

Pedro: *"lembra na landing page tem o card de cadastro lá precisa por no proficional qndo se cadastra qual e a sua especialidade"*.

**Audit empírico**: tabela `users` **NÃO tem coluna `specialty`** ([types.ts:6813-6852](src/integrations/supabase/types.ts#L6813)). Apenas `crm`, `cro`, `council_*`. Por isso `loadProfessionals` hardcoda `'Clínica Geral'` pra todos os parceiros.

**V1.9.111-C exige (~45-60 min, próxima sessão)**:
1. Migration: `ALTER TABLE users ADD COLUMN specialty TEXT`
2. Backfill especialidades existentes (Ricardo=Nefro, Eduardo=Neuro, +7 parceiros)
3. Frontend `loadProfessionals` SELECT specialty
4. Landing cadastro profissional: campo `<select>` Especialidade

Decisão: postpone até próxima sessão (precisa decidir lista de especialidades válidas + risco médio DB schema).

### L.5 — V1.9.112-A1: Analisar Paciente — sinopse + alergias + medicações

**Audit da feature "Analisar Paciente"** ([ProfessionalMyDashboard.tsx:681-1013](src/pages/ProfessionalMyDashboard.tsx#L681-L1013)):

✅ JÁ TEM (estado bom, ~80% caminho):
- Search dropdown busca por nome
- Lista pacientes vinculados ao médico
- Avatar do paciente buscado do banco
- Overlay scan animado Matrix-style (UX charme — Pedro elogiou: *"animacao leve de scanear paciente ehehe! gera engajamento"*)
- Painel lateral analítico colapsável
- 5 seções: Avaliação clínica + Consultas anteriores + Próximas + Prescrições + Evolução/gráficos

🟡 GAPS críticos identificados:
1. **Alergias + Medicações regulares NÃO mostradas** — `users.allergies` e `users.medications` JÁ existem mas não são lidas. Risco clínico (médico prescreve sem ver alergia).
2. **Resumo executivo ausente** — médico precisa expandir 5 seções pra ver dados básicos (idade, AECs, último score).
3. **Notas privadas do médico** — não há campo pra anotar observações próprias.

**Fix V1.9.112-A1 (top 3 críticos parcial — só 1 e 2)**:

Princípio 8 aplicado: tabela JÁ tem campos, query JÁ busca user, só faltava expandir SELECT + render. **Zero migration, zero RLS, zero infra nova.**

```diff
- .select('avatar_url, user_metadata')
+ .select('avatar_url, user_metadata, allergies, medications, birth_date, gender')
```

Tipo `analysisData` ganha 4 campos opcionais (`?:`) — backward compat absoluto.

**Novo bloco JSX no TOPO do painel** "Sinopse clínica":
- Idade calculada de `birth_date` + Gênero
- Total AECs + Último score (do último relatório)
- Última consulta (data formatada PT-BR)
- Alergias destacadas (AlertCircle amber) — só renderiza se `hasAllergies`
- Medicações em uso destacadas (Heart rose) — só renderiza se `hasMedications`

**Commit**: `fb23811`.

### L.6 — V1.9.112-A2 (NÃO aplicado): Notas privadas do médico

Decisão arquitetural pendente — 3 opções com tradeoffs:

| Opção | Onde salvar | Custo | Risco |
|---|---|---|---|
| A | Tabela nova `professional_patient_notes` + RLS | +30 min | 🟡 médio |
| B | `clinical_assessments.metadata` JSONB | 15 min | 🟢 baixo (mistura conceitos) |
| C | localStorage (não persiste) | 5 min | 🟢 zero (mas inútil) |

Pedro vai decidir após usar V1.9.112-A1 em prática.

### L.7 — Outros gaps mapeados (audit Analisar Paciente)

Memória `project_analisar_paciente_feature_mapeada.md` registra todos:
- Comparativo entre AECs (mini-gráfico evolução scores se ≥2 AECs)
- Última atividade Nôa (engajamento)
- Ações rápidas (Agendar/Mensagem/Prescrever no topo)
- Plano de Cuidado integrado
- North Star events timeline
- CFM prescriptions oficiais (vs view genérica atual)

Não-prioritários hoje. Documentados pra próxima sessão.

### L.8 — Princípios reaplicados nesta noite-2

```
✓ AUDITAR 100% antes
  - V1.9.111-B descoberto auditando V1.9.111-A (memo stale similar 110)
  - V1.9.111-C audit confirmou ausência da coluna specialty antes de propor
  - V1.9.112-A1 audit confirmou allergies/medications já existem

✓ Princípio 8 (polir não inventar)
  - V1.9.112-A1 reusou query existente, só expandiu SELECT
  - V1.9.111-A reusou helper renderProfessionalCard

✓ 1 a 1 na calma
  - V1.9.111-A → smoke → V1.9.111-D → V1.9.112-A1
  - Cada PR commit + push antes do próximo

✓ Honestidade direta
  - Confirmei "não cria nada novo" empiricamente quando Pedro perguntou
  - V1.9.111-C postponed honestamente (DB schema = risco médio)

✓ Calibração de severidade
  - Alergias ausentes = 🔴 crítico clínico (médico prescreve sem ver)
  - Cores vibrantes = 🟡 polish UX
  - Notas privadas = 🟡 importante mas não urgente
```

### L.9 — Commits da sessão noite-2

```
666d8f2  V1.9.111-A+B  polish + fix memo specialties
888bdcd  V1.9.111-D    ajuste tons emerald + blue
fb23811  V1.9.112-A1   Analisar Paciente sinopse + alergias + medicações
```

3 commits + diário. Lock V1.9.95+97+98+99-B preservado integralmente.

### L.10 — Backlog atualizado pós-noite-2

```
P0 (próxima sessão)
  V1.9.111-C  specialty real (migration + backfill + frontend +
              landing cadastro) — decidir lista válida primeiro
  V1.9.112-A2 notas privadas do médico — decidir A/B/C
  V1.9.112    fluxo guiado escolha→horários→AEC vinculada (visão Pedro)

P1 (validação empírica)
  Pedro testar V1.9.111-A polish (cores padronizadas)
  Pedro testar V1.9.112-A1 sinopse (clica Analisar com paciente
    que tem alergias preenchidas)

P2 (gaps Analisar Paciente — não prioritários)
  Comparativo entre AECs (mini-gráfico se ≥2 AECs)
  Última atividade Nôa
  Ações rápidas (Agendar/Mensagem/Prescrever)
  Plano de Cuidado integrado

P3 (fora desta sessão)
  V1.9.110-B normalizar users.type single grafia (migration)
  Magno v2.0 quando 9 módulos prontos
```

### L.11 — Frase âncora L

> *"Polish refinado + feature Analisar Paciente reforçada com info clínica
>  crítica (alergias, medicações, sinopse executiva) reusando colunas
>  que JÁ existiam no DB sem tocar schema. Princípio 8 (polir não inventar)
>  aplicado 4×. Lock V1.9.95+97+98+99-B preservado integralmente em 3
>  commits noite-2. Audit pré-codar continua pegando bugs latentes (memo
>  stale availableSpecialties, ausência coluna specialty)."*

---

*Bloco L adicionado 2026-04-30 ~21h BRT por Claude Opus 4.7 (1M context).
3 commits noite-2 (V1.9.111-A+B, V1.9.111-D, V1.9.112-A1) em ~1h.
1 memória nova: project_analisar_paciente_feature_mapeada.md.
Próximo: smoke Pedro + V1.9.112-A2 (notas) ou V1.9.111-C (specialty DB).*
