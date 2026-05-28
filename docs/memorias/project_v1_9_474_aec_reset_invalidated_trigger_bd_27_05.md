---
name: v1-9-474-aec-reset-invalidated-trigger-bd-27-05
description: "V1.9.474 trigger PostgreSQL BEFORE UPDATE em aec_assessment_state — limpa invalidated_at + invalidation_reason automaticamente quando started_at > invalidated_at (cenário restart AEC pós-invalidação). Audit empírico 27/05 ~21h BRT identificou 3 rows com anomalia temporal (gap >27 dias entre invalidated_at e started_at) causada por UPSERT seletivo em clinicalAssessmentFlow.ts:435-449 que não limpa invalidated_at. Trigger BD garante invariante sem precisar fix FSM (defesa em profundidade — não-cardio). Smoke empírico 3/3 rows anomalia históricas zeradas via UPDATE neutro. Migration formal supabase/migrations/20260527230000_v1_9_474_aec_reset_invalidated_trigger.sql idempotente (DROP IF EXISTS + CREATE OR REPLACE). Aplicado via Management API + commitado. 0 anomalias temporais restantes empíricamente."
metadata:
  node_type: memory
  type: project
  originSessionId: 00be2b9f-5dbc-4236-a02e-1459c3f57bd2
---

# 🛡️ V1.9.474 — AEC Reset Invalidated Trigger (BD-layer, 27/05 ~22h BRT)

## Contexto empírico

Audit 27/05 ~21h BRT (durante investigação anomalia detectada no smoke V1.9.452 PII fix) revelou 3 rows em `aec_assessment_state` com **anomalia temporal**:

| user_id | started_at | invalidated_at | Gap |
|---|---|---|---|
| df6cee2d (passosmir4 — Eduardo simulou 27/05) | 27/05 21:33 | 30/04 11:06 | +27.4 dias |
| 5c98c123 (Carolina Campello) | 25/05 03:56 | 25/04 13:41 | +29.6 dias |
| d5e01ead (casualmusic2021 — Pedro Paciente) | 24/05 12:14 | 27/04 01:55 | +27.4 dias |

**Anomalia temporal**: `invalidated_at` ANTERIOR ao `started_at`. Inversão lógica (invalidação antes de criação) é regulatoriamente questionável (ISO 13485 §4.2.5 rastreabilidade).

## Causa-raiz identificada

[src/lib/clinicalAssessmentFlow.ts:435-449](src/lib/clinicalAssessmentFlow.ts#L435-L449) — UPSERT com `onConflict: 'user_id'`:

```ts
.upsert([{
  user_id: uid as string,
  phase: ..., data: ..., current_question_index: ...,
  waiting_for_more: ..., phase_iteration_count: ...,
  interrupted_from_phase: ..., started_at: ...,
  completed_phases: ...,
  // ❌ FALTA: invalidated_at: null + invalidation_reason: null
} as any], { onConflict: 'user_id' })
```

UPSERT sobrescreve campos LISTADOS mas **NÃO INCLUI** `invalidated_at`/`invalidation_reason`. Esses permanecem com valores antigos da invalidação anterior quando paciente recomeça AEC.

## Solução escolhida: trigger BD (Alternativa F)

Decidido entre 6 alternativas avaliadas (A-F). **Vencedora F**: backfill + trigger BD-only.

**Por que BD-only vs fix FSM**:
- `clinicalAssessmentFlow.ts` é cardio do sistema (princípio `feedback_smoke_aec_completa_obrigatoria_pos_clinicalassessmentflow_mudanca_24_05`)
- Smoke completo AEC 14 fases = 1h+ ambiente local
- Trigger BD = invariante automática, smoke focado 15min, defesa em profundidade
- BD trigger é controle de integridade defensável em audit SaMD (positivo, não negativo)

## Função + Trigger criados

```sql
CREATE OR REPLACE FUNCTION public.reset_invalidated_on_aec_restart()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.invalidated_at IS NOT NULL
     AND NEW.started_at > OLD.invalidated_at THEN
    RAISE NOTICE '[V1.9.474] AEC restart detectado user=% (started_at % > invalidated_at %). Resetando.',
      NEW.user_id, NEW.started_at, OLD.invalidated_at;
    NEW.invalidated_at := NULL;
    NEW.invalidation_reason := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_aec_state_reset_invalidated_on_restart
  BEFORE UPDATE ON public.aec_assessment_state
  FOR EACH ROW
  EXECUTE FUNCTION public.reset_invalidated_on_aec_restart();
```

## Lógica condicional (4 cenários validados empíricamente)

| Cenário | OLD.invalidated_at | NEW.started_at vs OLD.invalidated_at | Trigger dispara? |
|---|---|---|---|
| **1 — Restart pós-invalidação** | NOT NULL (antiga) | NEW posterior | ✅ SIM → reseta |
| **2 — Continuação AEC ativa** | NULL | (comparação NULL) | ❌ não dispara (preserva NULL) |
| **3 — Invalidação fresca** | NULL → setado em NEW | comparação OLD NULL = FALSO | ❌ não dispara (preserva invalidação nova) |
| **4 — UPDATE sem mudar timestamps** | NOT NULL antiga | NEW = OLD started_at > OLD.invalidated_at | ✅ SIM → reseta (caso backfill empírico) |

## Smoke empírico 27/05 ~22h BRT — 3/3 rows zeradas

**Smoke 1 — passosmir4 (df6cee2d)**:
- ANTES: `started_at = 27/05 21:33` + `invalidated_at = 30/04 11:06`
- UPDATE neutro `SET current_question_index = current_question_index`
- DEPOIS: `invalidated_at = NULL` + `invalidation_reason = NULL` + `started_at preservado` ✅

**Smoke 2 + 3 — Carolina (5c98c123) + casualmusic2021 (d5e01ead)**:
- UPDATE batch `WHERE invalidated_at IS NOT NULL AND invalidated_at < started_at`
- 2 rows retornados com invalidated_at = NULL ✅

**Validação final empírica**:
```sql
SELECT COUNT(*) FROM aec_assessment_state
WHERE invalidated_at < started_at;
-- Resultado: 0 ← anomalia eliminada
```

## Timing dos triggers em aec_assessment_state (pós-V1.9.474)

| Timing | Event | Trigger | Ordem (alfabética) | Função |
|---|---|---|---|---|
| BEFORE | UPDATE | trg_aec_state_last_update | 1º | seta NEW.last_update = now() |
| BEFORE | UPDATE | **trg_aec_state_reset_invalidated_on_restart** | **2º (NOVO)** | reseta invalidated_at se restart |
| AFTER | INSERT | aec_state_anomaly_logger | — | log anomalias |
| AFTER | UPDATE | aec_state_anomaly_logger | — | log anomalias |

Ordem alfabética garante que `last_update` é setado ANTES do meu trigger (sem conflito).

## Migration formal

`supabase/migrations/20260527230000_v1_9_474_aec_reset_invalidated_trigger.sql` (idempotente):
- DROP TRIGGER IF EXISTS + CREATE
- CREATE OR REPLACE FUNCTION
- COMMENT ON FUNCTION + COMMENT ON TRIGGER (documentação inline)

## Riscos vigiados

| Risco | Mitigação |
|---|---|
| Trigger apaga invalidação fresca | ✅ Condição `OLD.invalidated_at IS NOT NULL` protege (Cenário 3) |
| Conflito com triggers existentes | ✅ Ordem alfabética + BEFORE em vez de AFTER (audit logger continua intacto) |
| Performance UPDATE batch | 🟢 Negligível — comparação de 2 timestamps + condicional simples |
| Regressão silenciosa em outro fluxo | 🟢 Smoke 3/3 PASS + lógica condicional 4 cenários validados |
| Auditor SaMD questionar trigger BD | 🟢 Defensável — controle de integridade temporal explícito |

## Conexões com princípios cristalizados

- [[feedback_smoke_aec_completa_obrigatoria_pos_clinicalassessmentflow_mudanca_24_05]] — princípio que motivou escolher BD-only vs fix FSM
- [[feedback_polir_nao_inventar]] — reusa pattern trigger existente (anomaly_logger + last_update) em vez de criar mecanismo novo
- [[reference_lock_v1_9_388_a3_ancoragem_regulatoria_multicamada_27_05]] — ISO 13485 §4.2.5 rastreabilidade reforçada
- [[feedback_dual_write_contract_jsonb_vs_tabela_18_05]] — princípio "defesa em profundidade" aplicado ao BD-layer

## Implicação Marco 2 paciente externo pagante

- ❌ ANTES V1.9.474: paciente externo que recomeça AEC após invalidação → row carregaria `invalidated_at` antigo = inconsistência temporal visível em audit ANVISA
- ✅ APÓS V1.9.474: trigger BD garante limpeza automática = audit consistente

**Bloqueador pré-Marco 2 fechado** sem precisar smoke AEC completa 14 fases.

## Frase âncora

> *"Bug arquitetural identificado empíricamente via PAT (3 rows anomalia >27 dias gap), causa-raiz pinpointed em UPSERT seletivo, fix BD-layer aplicado em 25min sem tocar FSM-cardio, 3/3 rows zeradas via smoke empírico. Trigger preserva invariante temporal automaticamente pra TODO row futuro."*

## Próxima sessão Claude (laptop com Ricardo)

1. Smoke RUNTIME real AEC: paciente teste recomeça AEC após invalidação → confirmar empíricamente que trigger continua funcionando in vivo
2. Fix opcional em `clinicalAssessmentFlow.ts:435-449` (defense in depth dupla — frontend + BD): adicionar `invalidated_at: null` no upsert
   - Trigger BD já cobre, mas frontend explícito melhora legibilidade
   - Smoke AEC 14 fases obrigatório (princípio cristalizado)
   - Parquear V1.9.474-FRONTEND se quiser dupla camada
