# 📓 Diário — 22/04/2026 (Pacote A + Doctor Resolution)
## Hardening Cirúrgico do Pipeline AEC

> Decisão: **Pacote A** (mínimo cirúrgico) com **fix isolado do `doctor_id`** no caminho do GATEWAY. Sem nova tabela, sem state machine, sem mexer em prompts. Só remover ruído arquitetural e plugar visibilidade real.

---

## 1. Diagnóstico Frio (com dados, não opinião)

Query no banco no início da sessão:

| Métrica | Valor |
|---|---|
| `clinical_reports` total | 20 |
| Último report | `a217252e...` (22/04 18:47) ✅ pós-fix |
| `interaction_id` populado | 1/20 (só o último, primeiro da história) |
| `clinical_axes` | 5 (do último report) |
| `clinical_rationalities` | 1 (do último report) |
| Índice `idx_clinical_reports_interaction_id` | UNIQUE parcial ATIVO |
| Constraint `clinical_axes (report_id, axis_name)` | UNIQUE ATIVA |
| Constraint `clinical_rationalities (report_id, rationality_type)` | UNIQUE ATIVA |

**Conclusão:** o pipeline downstream **funcionou**. O crítico do GPT errou ao dizer "axes vazio". O que ele acertou foi o ruído arquitetural.

---

## 2. Mudanças Aplicadas

### 2.1. `supabase/functions/tradevision-core/index.ts` (handleFinalizeAssessment)

| Antes | Depois |
|---|---|
| Time-lock de 1h por `patient_id+report_type` (mascarava bug) | Janela 30s + log `[PIPELINE_REDUNDANT_TRIGGER]` para investigar causa raiz no cliente |
| `doctor_id` cai direto no Ricardo se `professionalId === 'system-global'` | Hierarquia: request → último appointment do paciente → `profiles.preferred_doctor_id` → fallback Ricardo |
| Logs soltos `[FINALIZE_PIPELINE]`, `[NARRATOR]`, `[INTELLIGENCE_LAYER]` | Logs estruturados `[PIPELINE_STAGE] START → REPORT → AXES → RATIONALITY → DONE` com `interaction_id` em cada um |
| `reportError` sempre lançava | Erro `23505` em `interaction_id` agora vira warn `[PIPELINE_REDUNDANT_TRIGGER]` (idempotência funcionando, não falha) |
| `clinical_axes`/`clinical_rationalities` insert sem captura de erro | `error` capturado e logado por stage; pipeline continua sem abortar |

### 2.2. `src/lib/clinicalAssessmentFlow.ts` (debounce de fase)

- Novo método privado `shouldDebounceAdvance(userId, phase, userTurn)`
- Chamado no início de `processResponse`
- Bloqueia avanço se o **mesmo turno curto** (≤16 chars) chegar **2× em <2s** na **mesma fase**
- Quando bloqueia, repete a pergunta atual via `getPhaseResumePrompt` (não muda fase, não chama IA)
- Resolve cenário "ok ok ok ok" pulando 4 fases sem querer

### 2.3. NÃO mexido (de propósito)

- Schema do banco (sem migração)
- Prompts da IA / verbatim lock
- Ordem do pipeline (já está correta: GATEWAY → await `handleFinalizeAssessment` → REPORT → AXES → RATIONALITY)
- Lógica de `meansNoMore` / regex de saída (já cirúrgicas após sessão anterior)

---

## 3. Por que NÃO o Pacote B (state machine)

Tabela `pipeline_state(interaction_id, stage, status)` faria sentido se houvesse falhas parciais reais em produção. Hoje o `await` no GATEWAY (L1181) garante execução completa ou erro total, e o último report tem **5 axes + 1 rationality** persistidos. Engenharia prematura. Reabrir só se logs `[PIPELINE_STAGE]` mostrarem stage que para no meio.

---

## 4. Por que NÃO mexer no consumo de tokens (11k–13k)

O extractor já roda com `gpt-4o-mini`. Reduzir prompt exige chunking de turnos antigos — mudança de comportamento, não de hardening. Fica para o Pacote C quando houver evidência de truncamento (axes/rationality persistiram, então não há truncamento crítico hoje).

---

## 5. Como Validar no Próximo Teste E2E

1. Login `phpg69@gmail.com`, fazer AEC completa até "autorizo" + "sim"
2. Em `tradevision-core` logs, esperado nesta ordem:
   ```
   🧠 [PIPELINE_STAGE] START
   🩺 [DOCTOR_RESOLUTION] Vínculo via appointments: <uuid>   ← ou via preferred_doctor_id, ou fallback
   🧠 [PIPELINE_STAGE] REPORT (narrator)
   ✅ [PIPELINE_STAGE] REPORT_GENERATED
   🧠 [PIPELINE_STAGE] AXES
   ✅ [PIPELINE_STAGE] AXES_SYNCED
   🧠 [PIPELINE_STAGE] RATIONALITY
   ✅ [PIPELINE_STAGE] RATIONALITY_SYNCED
   ✅ [PIPELINE_STAGE] DONE
   ```
3. **AUSÊNCIA** de `⚠️ [PIPELINE_REDUNDANT_TRIGGER]` (se aparecer, há bug de duplo disparo no cliente — investigar)
4. Query: `SELECT id, doctor_id, interaction_id FROM clinical_reports ORDER BY created_at DESC LIMIT 1` deve mostrar `interaction_id != NULL` e `doctor_id` real do vínculo (não necessariamente Ricardo)
5. Mandar "ok" 4× rápido na mesma fase deve gerar 1 avanço + 3 logs `[AEC_DEBOUNCE]`

---

## 6. Pendências (continuam)

- ⚠️ Warning `forwardRef` em providers — cosmético
- ⚠️ Pacote B só se logs `[PIPELINE_STAGE]` mostrarem stage parando no meio
- ⚠️ Pacote C (resolver doctor_id no início da sessão + chunking de tokens) só após E2E validar Pacote A

---

*Selado em 22/04/2026 — Pacote A aplicado. Próximo: teste E2E com novos logs.*
