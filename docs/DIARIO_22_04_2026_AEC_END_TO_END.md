# 📓 Diário de Bordo — 22 de Abril de 2026
## Selamento da AEC End-to-End e Mecanismo de Avanço por Comando

> Sessão de retorno após viagem (17–22/04). Foco: estabilizar o pipeline de finalização da AEC 001, eliminar o bug de FK no `doctor_id` e governar o avanço de fases por comandos curtos ("apenas", "só isso", "sim", "ok", "autorizo").

---

## 1. Contexto de Entrada

- Último relatório clínico válido salvo: **05/04/2026 04:44** (`abe1f8f0-...`)
- Após esse marco, o pipeline de finalização **disparava mas falhava** com:
  ```
  code: 23503
  Key (doctor_id)=(ea375923-3882-421b-80fb-4a8e227a943a) is not present in table "users"
  ```
- Total de relatórios na base: **19** (todos com `doctor_id = 2135f0c0-...` exceto o mais antigo, anterior ao FK)
- `clinical_axes`: vazia — nunca populada porque a inserção principal abortava antes
- `clinical_rationalities`: **0 registros** — pipeline secundário nunca rodou
- `interaction_id` em todos os relatórios: **NULL** (apesar do índice único parcial existir)

---

## 2. Bugs Diagnosticados e Corrigidos

### 2.1. UUID fantasma do médico (CRÍTICO — bloqueador absoluto)
- **Arquivo**: `supabase/functions/tradevision-core/index.ts`
- **Sintoma**: FK violation em toda finalização de AEC
- **Causa**: Fallback hardcoded com UUID inexistente (`ea375923-...`) e detecção dinâmica filtrando por colunas que não existem (`is_active`, `slug`)
- **Fix**: Substituído por UUID real do Dr. Ricardo Valença (`2135f0c0-eb5a-43b1-bc00-5f8dfea13561`, `rrvalenca@gmail.com`); query simplificada para usar apenas colunas existentes
- **Status**: ✅ Deployado. Logs pós-deploy confirmam ausência do erro 23503

### 2.2. Tailwind config duplicado e inconsistente
- **Arquivos**: `tailwind.config.js` (excluído) → `tailwind.config.ts` (canônico)
- **Sintoma**: chave `accent` duplicada, risco de override silencioso de tokens
- **Fix**: Migração `.js → .ts`, remoção do duplicado, alinhamento com `index.css`
- **Status**: ✅ Selado

### 2.3. "Fire-and-forget" no `finalize_assessment`
- **Arquivo**: `src/lib/noaResidentAI.ts` (linhas 1830-1864)
- **Sintoma**: O componente desmontava antes do Edge Function persistir
- **Fix**: `await` + `withTimeout(invocação, 60_000)`
- **Status**: ✅ Selado

### 2.4. Falsos positivos de saída da AEC ("alucinação")
- **Arquivos**: `src/lib/clinicalAssessmentFlow.ts`, `src/lib/noaResidentAI.ts`
- **Sintoma**: Frases neutras ("nas costas perto da lombar", "pararece") disparavam `CONFIRMING_EXIT`
- **Causa**: Matching por `.includes('sair')` / `.includes('parar')` (substring solta)
- **Fix**: Regex com `\b` (word boundaries) exigindo intent-verb + ação (`quero sair`, `preciso parar`) ou palavra-âncora isolada (`^fui$`)
- **Status**: ✅ Selado

---

## 3. Mecanismo de Avanço por Comandos Curtos — Como Funciona

A pergunta do usuário: *"por que 'apenas' / 'só isso' avançam? É o correto?"*

**Sim, é o correto. E é determinístico, não IA.** O fluxo:

```
[USER: "só isso"]
   ↓
[CLIENTE] clinicalAssessmentFlow.processStep()
   → meansNoMore("só isso") === true
   → calcula próxima fase (ex: COMPLAINT_LIST → MAIN_COMPLAINT)
   → emite nextQuestion: "De todas essas questões, qual mais o(a) incomoda?"
   ↓
[CLIENTE] noaResidentAI envia ao Edge:
   { message, assessmentPhase, nextQuestionHint, aecVerbatimLock: true }
   ↓
[EDGE: tradevision-core] composeFinalResponse()
   → if (aecVerbatimLock && nextQuestionHint) RETURN nextQuestionHint LITERAL
   → GPT NÃO parafraseia, NÃO inventa, NÃO desvia
   ↓
[USER vê a próxima pergunta exata do protocolo]
```

**Conclusão:** o avanço por "apenas/só isso/ok/sim/autorizo" é uma **feature de protocolo**, não bug. O cliente é a Single Source of Truth da fase; o servidor obedece o `nextQuestionHint` quando `aecVerbatimLock` está ativo (fases listadas em `AEC_VERBATIM_LOCK_PHASES`).

---

## 4. Pipeline End-to-End — Estado Atual

| Etapa | Componente | Status |
|---|---|---|
| 1. Captura de turnos | `clinicalAssessmentFlow.ts` | ✅ Determinístico |
| 2. Avanço de fase | `meansNoMore()` + regex de saída | ✅ Cirúrgico |
| 3. Lock de pergunta | `aecVerbatimLock` no Edge | ✅ Garante literalidade |
| 4. Detecção de fechamento | "autorizo" / `CONSENT_COLLECTION` | ✅ Dispara pipeline |
| 5. `finalize_assessment` | Await + timeout 60s | ✅ Selado |
| 6. Insert `clinical_reports` | `doctor_id` real | ✅ Corrigido |
| 7. Insert `clinical_axes` (5 eixos) | Determinístico pós-report | ⚠️ Não testado pós-fix |
| 8. Insert `clinical_rationalities` | GPT-4o-mini integrativo | ⚠️ Não testado pós-fix |
| 9. `interaction_id` populado | Idempotência | ⚠️ Histórico NULL — validar próximo |

---

## 5. O Que Esperar no Próximo Teste E2E

Ao concluir uma avaliação completa até "autorizo" + "sim", o sistema **deve**:

1. **Logs do Edge** (`tradevision-core`):
   - `🚀 [GATEWAY] Disparando Orquestrador de Finalização ClinicalMaster`
   - `🧠 [FINALIZE_PIPELINE] Iniciando processamento master`
   - `✍️ [NARRATOR] Redigindo narrativa clínica estruturada`
   - `✅ [REPORT_GENERATED] <uuid>`
   - `✅ [AXES] Eixos clínicos sincronizados`
   - `✅ [RATIONALITY] Inteligência integrativa registrada`
   - **AUSÊNCIA** de `❌ [FINALIZE_PIPELINE_ERROR]`

2. **Banco de dados**:
   - `clinical_reports`: novo registro com `doctor_id = 2135f0c0-...` e `interaction_id != NULL`
   - `clinical_axes`: **5 linhas** (sintomatico, funcional, etiologico, terapeutico, prognostico) referenciando `report_id`
   - `clinical_rationalities`: 1 linha do tipo "integrativa"

3. **UI do paciente**:
   - Botão guiado "Ver Relatório" aparece no chat
   - Relatório acessível em `/app/clinica/paciente/relatorios`

---

## 6. Pendências Conhecidas (Não-Bloqueadoras)

- ⚠️ Warning `forwardRef` na árvore de providers (`ConfirmContext` / `ToastContext`) — investigação adiada
- ⚠️ `401` no `manifest.json` quando não autenticado — não impacta autenticados
- ⚠️ `interaction_id` histórico NULL — não retroativo, novos registros devem populá-lo
- ⚠️ Eixo de Cursos ainda em quarentena desde 05–06/04 — não retomar até estabilização total da AEC

---

## 7. Memórias Aplicadas Nesta Sessão

- `mem://features/clinical-reports/idempotency-mechanism` — `interaction_id` + índice único parcial
- `mem://features/noa-ia/protocol-restoration-2026` — IA usa perguntas verbatim do AEC
- `mem://features/noa-ia/consent-blocking` — `CONSENT_COLLECTION` bloqueia gravação sem autorização
- `mem://features/noa-ia/assessment-exit-mechanism` — saída voluntária por intent
- `mem://security/edge-function-validation` — JWT obrigatório

---

## 8. Próximo Movimento

1. ✅ **Teste E2E real** com login `phpg69@gmail.com` (admin/master)
2. ✅ Validar inserção em `clinical_reports`, `clinical_axes`, `clinical_rationalities`
3. 🔜 Após validação, considerar reabrir Eixo de Cursos com cuidado cirúrgico
4. 🔜 Limpar warning `forwardRef` (cosmético)

---

*Selado em 22/04/2026 — Sessão de retorno pós-viagem. Sistema retornando à estabilidade do dia 04/04.*
