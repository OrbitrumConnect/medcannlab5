---
name: Idempotência granular (uma flag por sub-operação)
description: Se uma operação faz N coisas, cada uma precisa flag idempotência separada (não 1 só pra todas). Skip de 1 sinal mascara N-1 gaps
type: feedback
originSessionId: 60cf94b7-b5d3-4df1-974d-c1c92082460c
---
**Regra**: idempotência por componente, não por operação inteira.

**Why**: 1 flag genérica que controla N sub-operações faz com que falha em 1 mascare problemas em N-1. Cada sub-operação precisa rastreabilidade própria.

**Caso real V1.9.123-A** (lembretes 24h+1h):
```
✅ Tem 5 colunas reminder_sent_*:
   - reminder_sent_at_24h
   - reminder_sent_at_1h
   - reminder_sent_at_30min
   - reminder_sent_at_10min
   - reminder_sent_at_1min
   
   Cada janela tem flag própria. Falha 1 não impede outras.
   
❌ NÃO usar:
   reminder_sent (booleano único) — esconde quais janelas falharam
```

**Aplicação**:
- Toda operação multi-passo: 1 flag por passo
- Smoke test valida cada flag, não só "rodou"
- Logs registram qual flag mudou em cada execução

**Refs**: docs/MEMORIAS_CRITICAS_HANDOFF_04_05.md §11.1, V1.9.123-A.
