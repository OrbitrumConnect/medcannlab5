---
name: V1.9.456 — Histórico observacional longitudinal no modal de review do médico (caso Carolina)
description: Implementação cirúrgica 26/05 — bloco "Histórico observacional" no modal de detalhe do report em ClinicalReports.tsx. Mostra padrão de queixas anteriores + sintomas novos hoje. Origem caso Carolina 25/05 (queixa "saco cheio") + insight Ricardo "AEC não puxa longitudinal — deveria". AEC FSM intocada. Reusa usePatientLongitudinal V1.9.382
type: project
originSessionId: 4a984140-7091-42ce-a9d3-75298afef276
---
# V1.9.456 — Histórico observacional longitudinal no modal de report

## Origem empírica (caso Carolina 25/05)

- Carolina escolheu "O saco cheio das coisas" como queixa principal (Etapa 3 AEC)
- Lista indiciária: dores nas pernas + turvação visão + saco cheio (NOVOS sintomas)
- Ricardo abriu report e viu queixa ISOLADA — sem contexto de 8 AECs em maio (padrão dominante: dor cabeça 5x, cansaço 5x, ansiedade 1x)
- Ricardo na reunião: *"AEC não puxa dado longitudinal — deveria"*
- Pedro: confirmou gap empírico, autorizou implementação

## O que faz

**Bloco visual no modal de detalhe do report** (entre faixa devolução clínica e conteúdo do report):

```
┌─ 📊 Histórico observacional desta paciente (últimas 30d) ─┐
│  ℹ️ Recortes longitudinais (até últimos 5 relatórios).    │
│     AEC desta sessão preserva escuta fenomenológica.       │
│                                                             │
│  📋 8 AECs em maio                                         │
│  Padrão dominante: dor cabeça 5x · cansaço 5x             │
│  Hoje (25/05) — sintomas novos: pernas, turvação visão    │
│  ─────────────────────────────────────────────────────    │
│  Queixa principal HOJE: "O saco cheio das coisas"         │
│  (escolha da paciente na Etapa 3)                          │
└────────────────────────────────────────────────────────────┘
```

## Arquitetura cirúrgica

**1 arquivo modificado**: `src/components/ClinicalReports.tsx` (167 linhas adicionadas)

1. Import `usePatientLongitudinal` (hook em produção desde V1.9.382 NoaMatrixView — princípio polir-não-inventar)
2. Chamada do hook SÓ quando `showReportModal && selectedReport && !isPatient` (guard duplo Audience Contract V1.9.330-A)
3. `useMemo longitudinalSummary` calcula:
   - Reports anteriores (filter id !== selectedReport.id)
   - Queixas cronológicas (data + queixa literal, unidades narrativas separadas)
   - Top queixas agrupadas (dedup lowercase + count)
   - Sintomas novos hoje (lista atual MINUS união de listas históricas)
4. Render condicional: bloco aparece SÓ se `!isPatient && longitudinalSummary && otherReports > 0`

## Princípios meta respeitados

| Princípio | Aplicação |
|---|---|
| `feedback_queixa_nao_e_sintoma_aec_e_abertura_fenomenologica_24_05` | Contexto observacional ≠ inferência diagnóstica. Médico interpreta, não a IA. Mexe na CAMADA OPERACIONAL POSTERIOR (review do médico), NÃO na AEC. |
| `feedback_locks_macro_vs_micro_matrix_alucinacao_completiva_25_05` | Dados LITERAIS (datas, queixas, contagens). Zero interpolação. Sintomas novos = comparação exata de strings, não "padrão inflamatório". |
| `feedback_duas_vertentes_uma_matriz_epistemologica_constituicao_medcannlab_25_05` | Fidelidade > Completude (cada queixa cronológica é citação literal). |
| Audience Contract V1.9.330-A | Guard duplo `!isPatient` (paciente NÃO vê bloco). |
| polir-não-inventar | 0 hook novo, 0 query nova, 0 RPC nova, 0 schema novo. Hook V1.9.382 reusado. |

## Anti-regressão garantida

| Camada | Status |
|---|---|
| AEC FSM (clinicalAssessmentFlow.ts) | INTOCADA |
| tradevision-core Edge | INTOCADO |
| Verbatim First V1.9.86 | INTOCADO |
| AEC GATE V1.5 | INTOCADO |
| Pipeline pós-AEC | INTOCADO |
| Lock V1.9.95+97+98+99-B+299 PBAD | INTOCADOS |
| NoaMatrixView (Nôa Matrix) | INTOCADA (mesmo hook, callers isolados) |
| Type-check | VERDE |

## Carolina amanhã

- AEC ao vivo: IDÊNTICA ao funcionamento de hoje (zero diferença)
- Modal report: GANHA bloco contexto longitudinal (só HCP vê)
- 2 mundos completamente separados (chat paciente vs review médico)

## Smoke esperado (Ricardo abre report Carolina 25/05)

Bloco aparece com:
- 7 queixas anteriores cronológicas (datas DD/MM)
- Top: "Dor de cabeça 4×"
- Sintomas novos chips: "dores nas pernas" + "Uma turvação da visão"
- Ricardo lê "saco cheio" COM contexto, decide conduta empírica

## Commit + push

```
HEAD: eea38f5
Push 4 refs: hub/main + hub/master + origin/main + origin/master ✓
Vercel auto-deploy ~2-3min
```

## Conexão com sequência Eduardo (TEA)

V1.9.456 cobre **50% da necessidade neuro/TEA do Eduardo** (sequência Fase A → B → C documentada em `project_reuniao_4_socios_26_05_eduardo_engajando_marco_3_destravando`). Eduardo abre paciente Joaninha → vê padrão observacional sem KPI estruturado ainda. Sidecar TEA (Fase B) complementa quando volume justificar.

## Cristalizado

Diário 26/05 BLOCO F (implementação). Caso Carolina 25/05 = origem empírica. Insight Ricardo cristalizado em fluxo cirúrgico ~30min, zero risco arquitetural.
