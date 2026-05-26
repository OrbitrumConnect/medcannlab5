---
name: Princípio clínico — invalidate vs DELETE (sistema clínico nunca destrói dado)
description: Sistema clínico NUNCA destrói dado, mesmo inconsistente. Snapshot + invalidate + restart controlado. Triângulo mitigate → detect → prevent
type: feedback
originSessionId: 60cf94b7-b5d3-4df1-974d-c1c92082460c
---
**Regra fundamental**: sistema clínico NUNCA destrói dado, mesmo quando dado está inconsistente.

**Why**: dados clínicos têm valor médico-legal (LGPD + CFM + auditoria). DELETE de registro pode mascarar evidência ou perder contexto que será necessário no futuro. Sempre invalidate + razão registrada.

**Princípio operacional**:

```
❌ DELETE FROM aec_assessment_state WHERE id = X
✅ UPDATE aec_assessment_state 
   SET invalidated_at = now(), invalidation_reason = 'motivo'
   WHERE id = X
```

**Triângulo de qualidade clínica**:
1. **Mitigate** — quando bug acontece, contornar imediato sem destruir dado
2. **Detect** — instrumentar pra capturar quando o bug ocorre de novo
3. **Prevent** — fix de raiz que impede recorrência

**Caso real bug Carolina state ressuscitado (04/05)**:
- Sintoma: AEC completa mas dashboard mostra "Iniciar Avaliação" novamente
- Causa raiz: UPDATE em row com `invalidated_at` preenchido sem limpar o flag
- Por isso: invalidate funcionou, mas algum path UPDATE depois reativou registro sem limpar `invalidated_at`
- `loadStateFromDB` filtra `invalidated_at IS NULL`, não acha state ativo → mostra botão de iniciar

**Fix #1 cirúrgico (5min SQL)**:
```sql
UPDATE aec_assessment_state
SET invalidated_at = NULL, invalidation_reason = NULL
WHERE id = 'abce92b0-5f75-44f3-9484-5f107808ef1d'
  AND is_complete = true 
  AND phase = 'FINAL_RECOMMENDATION';
```

⚠️ **Não aplicar sem autorização Pedro.** Audit code path UPDATE invalidated_at em paralelo (~1h).

**Frase-âncora**: *"Sistema clínico não deleta. Invalida com razão, audita o ressuscitamento."*

**Refs**: docs/MEMORIAS_CRITICAS_HANDOFF_04_05.md §1.9 + §3.1, bug Carolina 04/05.
