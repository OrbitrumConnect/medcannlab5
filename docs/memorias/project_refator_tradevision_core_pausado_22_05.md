---
name: project_refator_tradevision_core_pausado_22_05
description: "Refator anti-bus-factor do tradevision-core — PAUSADO numa branch não-deployada (22/05). 5 commits verificados (deno check baseline). Retomar = deploy+smoke+merge do que está pronto."
metadata:
  node_type: memory
  type: project
  originSessionId: 6742fef8-9d20-43d8-a8d8-8853df0c89e9
---

Em 22/05/2026 (madrugada) começou o refator anti-bus-factor do `tradevision-core/index.ts` (7036 linhas). **Pausado por decisão do Pedro** numa branch que **NÃO foi deployada nem merjada** — produção roda o código antigo, idêntico.

## Estado da branch `refactor/tradevision-core-modular`

5 commits (à frente do `main` em `b0dfd18`):
- `9d7490a` V1.9.419 — proteções: sentinel comment load-bearing no topo do index.ts + script `npm run deploy:tradevision`
- `c6461ea` V1.9.419-A — extrai `cors.ts`
- `1edceb4` V1.9.419-B — extrai `types.ts` (NoaUiCommand/AppCommandV1/PendingActionCandidate)
- `ea4910e` V1.9.419-C — extrai `triggers.ts` (GPT_TRIGGERS, parseTriggers..., etc.)
- `ba34783` V1.9.419-D — remove bloco aec-governance MORTO (~109 linhas)

`index.ts` 7036 → ~6640. **`deno check` verde (baseline = 5 erros pré-existentes, zero novos) em CADA passo.** Deno 2.7.14 instalado local em `~/.deno/bin/deno.exe` (só pra `deno check`; a edge roda no Supabase).

## Método (Bloco Q do DIARIO_21_05)

Incremental, mecânico (move código, não muda comportamento), `deno check` por passo, 1 commit por passo. Baseline dos 5 erros capturado ANTES — gate = "mesmos 5, zero novos".

## Constraint load-bearing (cicatriz V1.9.35)

Deploy do `tradevision-core` **SEMPRE via CLI** (`npm run deploy:tradevision`), **nunca pelo dashboard** — o dashboard sobe só o index.ts e descarta os módulos importados → quebra produção. `cos_kernel.ts` já é importado e funciona → CLI bundla imports. Score calculator fica INLINE de propósito (não modularizar).

## Achado: código morto removido (V1.9.419-D)

`applyAecGovernanceGate` ("Guard Rail v2") + splitTrailingAecTags, hintAllowsWhatMore, isStrayWhatMoreOnlyOutput, normalizeAecPlain, mainComplaintLooksLikeListContinuation — confirmado morto 4×: contagem fechada, não exportado, logs `[AEC:Gate]` nunca disparam em produção, git mostra nascido no commit kevlar `a4c706c` sem nunca ter call-site. A governança AEC viva é inline no `Deno.serve` (Verbatim First V1.9.86 + PHASE LOCK + AEC GATE V1.5). `sanitizeAIResponse` (único vivo) preservado.

## Parqueado

`doc-detection`, `commands`, `handleFinalizeAssessment` + o handler `Deno.serve` (~5280 linhas, o elefante real) — NÃO extraídos. Gatilho de retomada desses = 2º dev pra onboardar OU mudança grande no core.

**Why:** uma branch de refator não-deployada apodrece — `main` evolui e o merge fica caro. O trabalho feito é verificado e de baixo risco; deixar em limbo é o pior estado.

**How to apply:** retomar = **deploy+smoke+merge só do que está pronto** (Pedro decide pós-sono 22/05). Protocolo: `npm run deploy:tradevision` → smoke (AEC real + log) → limpo: merge; falhou: rollback da tag `v1.9.418-forum-cann-matrix-checkpoint` (= core pré-refator exato, ~1 min). Pré-PMF, blast radius mínimo. Conecta com [[feedback_lock_v1_9_299_pbad_nao_tocar_16_05]] (rigor em edge crítica) e o Bloco Q do `DIARIO_21_05`.
