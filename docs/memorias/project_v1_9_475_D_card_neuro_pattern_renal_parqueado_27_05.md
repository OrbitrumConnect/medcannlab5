---
name: v1-9-475-d-card-neuro-pattern-renal-parqueado-27-05
description: "V1.9.475-D PARQUEADO empíricamente 27/05 ~22h45 BRT. Refatorar Card Neuro pra replicar pattern Renal EXATO (grid responsivo 1→5 cols + paginação 5/página + card-paciente unitário + modal expandido com sinais). Pedro autorizou go D inicialmente MAS após ver V1.9.475-C atual renderizado no Dashboard (4 sinais TDAH com fala literal + confiança colorida), validou empíricamente que V1.9.475-D PERDE VALOR VISUAL no estado atual: 1 paciente único em grid 5-cols = espaço desperdiçado + 4 sinais escondidos em modal = perde detalhamento atual. Anti-cristalização-prematura aplicado. 2 triggers explícitos pra desparquear (Eduardo trazer Fase B 2-3 casos reais OR Fase D codada com Edge real fetch DB). Inconsistência Eduardo vs Ricardo é momentânea aceita (pré-PMF com 1 paciente real). Reconhecimento meta: validação empírica via screenshot > plano teórico apresentado verbalmente."
metadata:
  node_type: memory
  type: project
  originSessionId: 00be2b9f-5dbc-4236-a02e-1459c3f57bd2
---

# 🧠 V1.9.475-D Card Neuro Pattern Renal PARQUEADO (27/05 ~22h45 BRT)

## Contexto empírico

Sessão Claude desktop 27/05 ~22h30 BRT: Pedro perguntou empíricamente:
> *"a questao e o card que aparece para ricardo ao lado podem aparecer mais? se o card neuro entrar ali e aba tiver mais categoria o card nao entra ao lado do card de maria porem neuro duvida so"*

Tradução: Card Neuro V1.9.475-C atual NÃO replica pattern grid responsivo do Renal V1.9.309 (`grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5` + paginação 5/página). Eduardo NÃO vê mesma UX que Ricardo.

## Proposta V1.9.475-D inicial

Refatorar Card Neuro pra estrutura espelhada Renal:

| Elemento | Pattern Renal espelhado |
|---|---|
| Card-paciente unitário | nome + report_id + count sinais + categoria predominante |
| Grid externo | `grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5 gap-3` |
| Paginação | `PER_PAGE = 5` + DotPagination lateral |
| Modal expandido | Lista sinais com fala literal + confiança colorida (V1.9.475-C visual movido pra modal) |

## Mudança de direção empírica via screenshot

Pedro autorizou `go V1.9.475-D` inicialmente. ANTES de eu começar refatoração, ele mandou screenshot do Dashboard atual com V1.9.475-C renderizado + mensagem *"veja"*.

Após analisar empíricamente o screenshot, identifiquei trade-off real:

| Aspecto | V1.9.475-C (atual) | V1.9.475-D (proposto) |
|---|---|---|
| 1 paciente único (estado atual real) | ✅ Mostra 4 sinais detalhados com fala literal | ⚠️ Mini-card único em grid 5-cols (4 espaços vazios) |
| Detalhes sinais | ✅ Visíveis direto no card (badge confiança + categoria + fala) | ❌ Escondidos em modal "Ver detalhes" |
| Valor visual hoje | 🟢 Alto | 🟡 Baixo (mini-card solitário) |
| Escalabilidade futura | ⚠️ Lista cresce vertical | ✅ Grid responsivo lateral |
| Consistência institucional Renal | ❌ Estrutura diferente | ✅ Pattern espelhado |

**Conclusão honesta**: V1.9.475-D fazia sentido **antes de ver estado atual renderizado**. Olhando empíricamente: 1 paciente único em grid 5-cols = espaço desperdiçado + 4 sinais escondidos em modal = **perde valor visual atual**.

## Decisão final 27/05 ~22h45 BRT — PARQUEADO

**MANTÉM V1.9.475-C** (Card lista detalhada de sinais).
**PARQUEIA V1.9.475-D** (refatoração pattern Renal) com triggers explícitos.

## 2 triggers EXPLÍCITOS pra desparquear V1.9.475-D

### Trigger 1 — Eduardo trazer Fase B (2-3 casos reais)
- Quando Eduardo trouxer 2-3 casos neuro anonimizados (TEA puro + TDAH puro + comorbidade)
- 3 pacientes em grid 2-col já tem valor visual (não-vazio)
- Refatoração V1.9.475-D faz sentido empíricamente
- Custo: ~45min-1h pattern Renal espelhado

### Trigger 2 — Fase D codada (Edge `neuro-signal-extractor` real)
- Quando codar Edge fetch DB real (Fase D do roadmap)
- Substitui array hardcoded por fetch real `clinical_neuro_signals`
- Volume dinâmico → grid responsivo é necessário
- Refatoração V1.9.475-D feita JUNTO com Fase D Edge
- Custo combinado: ~4-5h (Edge + tabela + refator card)

## Princípios meta cristalizados nesta decisão

### Anti-cristalização-prematura (reforço)
- V1.9.475-D era plano teórico apresentado verbalmente
- Validação empírica via screenshot revelou que estado atual JÁ é ponto cirúrgico
- NÃO over-engineering pra escalabilidade futura ainda especulativa

### Validação empírica > plano teórico
- Pedro mandou "go" baseado em descrição verbal V1.9.475-D
- Mas screenshot do estado atual revelou que V1.9.475-C tem mais valor visual
- Princípio: ANTES de codar refatoração, validar empíricamente que ela é melhoria
- Aplicação meta: este princípio se aplica a TODA refatoração futura

### Inconsistência momentânea aceitável
- Eduardo vê UX diferente que Ricardo HOJE (V1.9.475-C lista sinais; Renal V1.9.309 grid pacientes)
- Aceita até dados escalarem (Fase B Eduardo)
- Pré-PMF tolerable: 1 paciente real (passosmir4 teste Eduardo simulou)
- Consistência institucional materializa quando volume escalar

### Reconhecimento honesto (Claude voltou atrás)
- Plano V1.9.475-D apresentado com confiança técnica
- Apos screenshot, identifiquei que perderia valor visual
- Voltei atrás antes de codar = anti-overclaim + ciclo de iteração correto
- Pedro confirmou parqueamento empírico

## Não precisa commit de código (V1.9.475-D parqueado)

- Apenas commit dessa memory cristalizada (registro institucional)
- `git status` deve mostrar working tree limpo após commit memory
- Card V1.9.475-C atual permanece em produção

## Frase âncora

> *"Validação empírica via screenshot > plano teórico apresentado verbalmente. V1.9.475-D fazia sentido em descrição; estado real renderizado mostrou que V1.9.475-C atual entrega MAIS valor visual pra 1 paciente único. Refatoração faz sentido empíricamente quando 3+ pacientes existirem (Fase B Eduardo) — anti-cristalização-prematura aplicado."*

## Conexões com princípios cristalizados

- [[feedback_engenharia_perfeita_pode_produzir_semanticamente_inadequado_24_05]] — analogia: refatoração teoricamente correta pode produzir UX visualmente pior em estado atual
- [[feedback_polir_nao_inventar]] — V1.9.475-C funciona bem, não inventar pattern novo enquanto não precisar
- [[feedback_mapear_universo_vetores_antes_de_codar_guardrail_24_05]] — princípio análogo: mapear antes de codar
- [[project_v1_9_475_card_neuro_embriao_27_05]] — memory pai (V1.9.475 inicial + A/B/C iterações)

## Trigger reativação check-list

Quando Eduardo trouxer Fase B OU codificar Fase D, próxima sessão Claude deve:

1. Ler ESTA memory
2. Confirmar trigger materializado (3+ pacientes OR Edge real)
3. Refatorar Card Neuro seguindo pattern Renal:
   - `grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5 gap-3`
   - `PER_PAGE = 5` + DotPagination
   - Card-paciente unitário (resumo + clique modal)
   - Modal preserva visual V1.9.475-C (lista 4 sinais com fala literal)
4. Reusar `<DotPagination />` de `./ui/DotPagination` (já existe em RenalSuggestionsCard linha 25)
5. Smoke responsivo: 1/2/3/5 cards em viewports diferentes
6. Type-check + commit V1.9.475-D + push 4 refs
7. Atualizar este memory com `STATUS: REATIVADO empíricamente DD/MM/AAAA`
