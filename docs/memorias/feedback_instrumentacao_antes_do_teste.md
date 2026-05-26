---
name: Instrumentação ANTES do teste
description: Antes de fazer smoke test, instrumentar logs/métricas que vão validar empiricamente. Sem isso, "deu certo" vira chute
type: feedback
originSessionId: 60cf94b7-b5d3-4df1-974d-c1c92082460c
---
**Regra**: antes de rodar smoke test, criar logs/métricas que provam o que aconteceu. Sem instrumentação, "deu certo" é chute.

**Why**: smoke test sem telemetria = "rodou e não explodiu" — não prova que comportamento foi correto. Pode ter rodado caminho A em vez de caminho B esperado.

**Caso real V1.9.99 video-call-reminders sweep mode**:
```
Antes: Edge Function rodava, sem como saber o que aconteceu.

Depois: noa_logs.video_call_reminders_sweep registra cada execução com:
  - scanned (quantos appointments foram avaliados)
  - reminders_sent (quantos lembretes foram enviados)
  - emails_sent (quantos emails saíram via Resend)
  - errors (quais falharam)
  - timestamp + execution_id

Smoke test agora valida: SELECT FROM noa_logs WHERE source='video_call_reminders_sweep'
```

**Antes de fazer smoke test, perguntar**:
1. Como vou validar empiricamente que o caminho certo rodou?
2. Existe log/métrica que prova isso?
3. Se não existe: instrumentar primeiro, testar depois

**Aplicação**:
- Edge Functions: log estruturado em `noa_logs` ou tabela dedicada
- RPCs: RAISE NOTICE com payload JSON
- Triggers: UPDATE em coluna de audit (created_by_trigger, etc)
- Front: console.log com prefix identificável

**Refs**: docs/MEMORIAS_CRITICAS_HANDOFF_04_05.md §11.2, V1.9.99 sweep.
