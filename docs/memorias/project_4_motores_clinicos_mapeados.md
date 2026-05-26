---
name: 4 motores clínicos mapeados (1 ATIVO + 1 GATED + 4 DORMENTES)
description: AEC FSM ATIVO em prod. Rationality Engine GATED pós-relatório. 4 motores DORMENTES (IMRE Score, Triaxial, CIL, IMRE Triaxial Dashboard). Não são órfãos — são "implementado/não testado"
type: project
originSessionId: 60cf94b7-b5d3-4df1-974d-c1c92082460c
---
## 4 motores clínicos no codebase (categorizados)

### 1️⃣ ATIVO em produção

```
AEC FSM (clinicalAssessmentFlow.ts)
  - 13+ fases (16 incluindo sub-fases) determinísticas
  - IDENTIFICATION → COMPLAINT_LIST → MAIN_COMPLAINT → COMPLAINT_DETAILS →
    MEDICAL_HISTORY → FAMILY_* → LIFESTYLE → ALLERGIES → MEDS →
    REVIEW → CONSENSUS_* → CONSENT_COLLECTION → COMPLETED
  - V1.9.86 Verbatim First (~46% bypass GPT em hard-lock phases)
  - Lockado V1.9.95+97+98+99-B
  - Em produção desde fevereiro/2026
```

### 2️⃣ GATED (ativa pós-relatório)

```
Rationality Engine (rationalityAnalysisService.ts)
  - Roda APÓS handleFinalizeAssessment
  - Estágio "RATIONALITY" no pipeline (REPORT→SCORES→SIGNATURE→AXES→RATIONALITY→DONE)
  - Análise multi-racional do relatório clínico
  - V1.9.49 rationality_role_gate
```

### 3️⃣ DORMENTES (4 — implementados, não testados)

```
1. IMRE Score (motor scoring)
   - Estrutura mapeada em audit
   - Não rodando em prod
   
2. Triaxial Analysis
   - Anamnese Triaxial = 3 eixos × 4 dim + 37 blocos
   - Mencionado no Documento Mestre / Livro Magno
   - Sem ativação real
   
3. Clinical Integration Layer (CIL)
   - Camada de integração entre motores
   - Estrutura prevista
   - Não conectada
   
4. IMRE Triaxial Dashboard
   - UI prevista
   - Sem componente ativo no front
```

## ⚠️ NÃO são órfãos

**Princípio**: estes 4 motores são **"implementado/não testado"**, não código morto.

**Decisão Ricardo+Eduardo futura**:
- Revive: ativar quando AEC + Verbatim provarem sustentabilidade
- Deprecar: se AEC FSM cobre necessidade clínica integralmente

**Quando atacar**: pós-PMF, com Ricardo conduzindo (camada 2 da pirâmide intocável sem Ricardo presente).

## Mapeamento pra navegação rápida

```
codebase:
  src/lib/clinicalAssessmentFlow.ts          ← AEC FSM (ATIVO)
  src/services/rationalityAnalysisService.ts ← Rationality (GATED)
  
banco:
  clinical_axes (dormente)                   ← Triaxial
  clinical_rationalities                      ← Rationality storage
  clinical_kpis                               ← IMRE Score storage
  
docs/:
  AEC documentado em LIVRO_MAGNO + DIARIO_*
  IMRE em docs/AUDITORIA_COS_5_0_FINAL.md
```

**Refs**: docs/MEMORIAS_CRITICAS_HANDOFF_04_05.md §12.2, project_4_clinical_engines_map_24_04 (memória original).
