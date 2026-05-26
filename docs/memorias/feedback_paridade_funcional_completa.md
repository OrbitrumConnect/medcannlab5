---
name: Paridade funcional completa (não "última cascata")
description: Ao replicar fluxo, validar TODOS os campos/efeitos que ele produz, não só o output final. Replicar parte ≠ paridade
type: feedback
originSessionId: 60cf94b7-b5d3-4df1-974d-c1c92082460c
---
**Regra**: paridade funcional = validar TODOS os campos/sub-resultados, não só o output final.

**Why**: replicar parte e dizer "funcionou" é falso positivo. Output final pode estar igual mas dados intermediários (signature, scores, audit logs) podem estar faltando.

**Caso real Gate D' P0b vs handleFinalizeAssessment**:
```
handleFinalizeAssessment (ORIGINAL) popula 14 campos:
  • report.id, content, signature_hash, scores, axes, rationality
  • clinical_qa_runs entry
  • cognitive_events entry
  • appointment.status
  • patient_medical_records entry
  • notification entry
  • ... (14 total)

Gate D' P0b (FALLBACK) populou 6:
  • report.id, content, basic fields
  
"Funcionou" mas faltavam 8 campos críticos:
  ❌ signature_hash (compliance ICP-Brasil quebrada)
  ❌ scores estruturais (KPIs zerados)
  ❌ axes (análise triaxial vazia)
  ❌ rationality (motor desativado)
```

**Regra antes de declarar paridade**:
1. Listar TODOS os campos que o caminho original popula
2. Smoke test valida CAMPO A CAMPO no caminho novo
3. Se algum campo está null/diferente: NÃO é paridade, é simulação parcial

**Frase-âncora**: *"Replicar última cascata não é paridade. Paridade é campo a campo."*

**Refs**: docs/MEMORIAS_CRITICAS_HANDOFF_04_05.md §11.3, Gate D' P0b lição.
