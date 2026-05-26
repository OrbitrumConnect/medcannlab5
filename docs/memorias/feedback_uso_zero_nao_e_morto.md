---
name: Uso zero ≠ código morto (validar com produto antes de classificar)
description: Em produto nascendo, "infra pré-uso" parece "morto" se medido só por dados. Validar contra produto/negócio com dono ANTES de classificar
type: feedback
originSessionId: 60cf94b7-b5d3-4df1-974d-c1c92082460c
---
**Regra**: tabela vazia / função sem chamada / Edge Function sem trigger ≠ "morto". Pode ser "infra pré-uso planejada".

**Why**: pré-PMF, métricas de uso são leading indicators de maturação, não de demanda. Classificar como morto e remover mata roadmap.

**Casos reais MedCannLab**:

```
6 cursos cadastrados (4 pagos não publicados):
  Métrica: 0 enrollments nos 4 pagos
  Errado classificar: "morto, deletar"
  Certo classificar: "pré-PMF aguardando gateway de pagamento"

TRL (7 tabelas zeradas):
  Métrica: 0 rows em todas
  Errado classificar: "abandonado"
  Certo classificar: "estrutura pronta aguardando conteúdo Eduardo Faveret"

video_call_reminders Edge Function:
  Métrica: 0 execuções com sucesso (faltava tabela video_call_schedules)
  Errado classificar: "duplicata legacy" → DELETE (erro meu 28/04)
  Certo classificar: "half-impl real, faltava migration" → resgatar V1.9.99
```

**Antes de classificar feature/tabela como morta**:

```
1. Quem é o dono dessa feature? (Pedro, Ricardo, Eduardo, João)
2. Está no produto desejado? (mesmo que ainda não usado)
3. Métrica de uso ZERO é "não usado" ou "não ativado ainda"?
4. Validar com Pedro antes de propor remoção
```

**Hierarquia de tier de tabelas**:
- TIER 0: ATIVA (uso diário) — não tocar
- TIER 1: feature pronta aguardando 1º uso — não tocar
- TIER 2: impl parcial — atacar P0 ou desativar
- TIER 3: dormente verdadeira — só após validação humana

**Refs**: docs/MEMORIAS_CRITICAS_HANDOFF_04_05.md §11.7, lições 26-28/04.
