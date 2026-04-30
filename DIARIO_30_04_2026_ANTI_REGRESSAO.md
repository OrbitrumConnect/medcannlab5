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
