---
name: Anomalia ≠ bug (perguntar antes de "consertar")
description: Cristalizado 28/04 após V1.9.78/79 erro: vi invalidated_at órfão, inventei bug, criei 2 fixes que pioraram. Pedro só tinha PERGUNTADO sobre dados
type: feedback
originSessionId: 60cf94b7-b5d3-4df1-974d-c1c92082460c
---
**Cristalizado**: 28/04/2026 — V1.9.78/79 episódio. Pedro perguntou sobre dados estranhos no banco. Eu interpretei como pedido de fix, criei 2 fixes que pioraram a situação. Pedro só queria entender, não conserto.

**Why**: dado estranho no banco não é automaticamente bug. Fix prematuro vira regressão.

**Regra**: dado estranho pode ser:
- Design intencional (ex: 2 contas Ricardo: admin + profissional — INTENCIONAL, decidido)
- Anomalia conhecida documentada
- Lixo histórico aceito
- Trigger antigo
- Ou bug REAL (minoria dos casos)

**Antes de fixar**: confirmar com Pedro **explicitamente** que é bug + tem autorização pra fix.

**Pergunta diagnóstica antes de propor fix**:
1. Pedro pediu fix ou só perguntou?
2. Existe contexto que explica o "estranho"?
3. Validei com memória/diário se é design intencional?

**Frase-âncora**: *"Anomalia não é bug. Pergunte primeiro, conserte depois."*

**Refs**: docs/MEMORIAS_CRITICAS_HANDOFF_04_05.md §1.5, V1.9.78/79 erro 28/04.
