---
name: AUDITAR 100% antes de qualquer mudança (META-princípio)
description: Origem 30/04 ~17h após V1.9.102→F (6 PRs em 16h fechando 1 PR sem auditoria). Antes de tocar 1 linha de código, fazer auditoria empírica completa. 30 min antes economiza 16h depois.
type: feedback
originSessionId: 60cf94b7-b5d3-4df1-974d-c1c92082460c
---
**Origem**: Pedro 30/04/2026 ~17h, após jornada V1.9.102→F (6 PRs em 16h fechando 1 PR sem auditoria adequada).

**Why**: skip de qualquer passo da auditoria leva a regressão silenciosa. Pedro perdeu tempo + energia + confiança do time fixando 5 vezes a mesma coisa.

**Regra única absoluta — sequência obrigatória antes de tocar código**:

```
1. Ler memórias relacionadas (MEMORY.md + CLAUDE.md)
2. Mapear TODAS as tabelas/funções/triggers afetadas
3. Identificar referência empírica em prod (caso normal funcionando)
4. Listar TODOS os campos/sub-resultados que devem permanecer iguais
5. SÓ ENTÃO propor mudança
6. Smoke test valida CAMPO A CAMPO (não count > 0)
7. Comparar empiricamente: novo caminho == referência?

Se algum dos 7 passos é skippado: provável regressão silenciosa.
```

**O que pular (eficiência sem regressão)**:
- ✅ Mudanças de TEXTO em UI/mensagens — sem audit
- ✅ Polish CSS/visual sem lógica — sem audit
- ✅ Documentação (memórias, diários) — sem audit
- ⚠️ Mudanças com qualquer impacto em DATA FLOW exigem 100% audit

**Frase-âncora**: *"30 min de audit ANTES economiza 16h de fix DEPOIS. Reuso > criação. Paridade campo a campo, não 'última cascata'."*

**Refs**: docs/MEMORIAS_CRITICAS_HANDOFF_04_05.md §1.1, V1.9.102→F sprint 30/04.
