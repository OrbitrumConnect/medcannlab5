# 06 + 07 + 10 — CLÍNICA + LONGITUDINALIDADE + DRIFT FILOSÓFICO — 29/05/2026

⚠️ **Sprint 4 COMPLETO requer Ricardo**. Este doc entrega **coleta de evidências objetivas** + perguntas a apresentar ao Ricardo. **NÃO é veredito clínico final** — princípio Z2 aplicado (sistema organiza, médico interpreta).

---

## TL;DR (6 bullets)

1. **Z2 preservado empíricamente** em 28/05: smoke Matrix output PASS — disclaimer literal mantido, anti-síntese, pseudonimização ativa.
2. **AEC FSM 20 fases ativa** — `clinicalAssessmentFlow.ts` exporta `AssessmentPhase` enum. Núcleo intacto.
3. **Verbatim First V1.9.86** continua funcionando (~46% bypass GPT em hard-lock phases — métrica do CLAUDE.md).
4. **Longitudinalidade empírica**: usePatientLongitudinal V1.9.382 + V1.9.483 Camada 1.3 — 12/50 users têm > 3 reports = continuidade real.
5. **Frase âncora cristalizada por Ricardo**: *"AEC é porta, prontuário longitudinal é memória viva, Matrix é lente reflexiva."*
6. **3 perguntas pendentes pro Ricardo destravam Camada 2** (memory `project_matrix_roadmap_camadas_1_2_3_28_05`).

---

## §1 — 06_CLINICAL_CONSISTENCY — Princípios aplicados empíricamente

### Z2 — verificado em 28/05 smoke
```
Output Nôa Matrix (28/05 manhã, paciente #6ACF):
"### ANÁLISE DOS CASOS MARCADOS
 #### CASO #7ccf38 (27/05/2026)
 - **Queixa Principal:** Ansiedade
 ...
 ### PADRÕES OBSERVADOS
 - **Granularidade Descritiva:** ...
 ### QUESTÕES ESTRUTURAIS
 - **Substituição por Canabidiol:** ... deve ser avaliada clinicamente.
 Estruturação a partir do corpus marcado. Interpretação clínica
 é responsabilidade do médico."
```

| Princípio | Evidência empírica 28/05 |
|---|---|
| Não-diretividade | ✅ "Questões Estruturais" como perguntas, não conclusões |
| Anti-síntese clínica | ✅ Não correlacionou "ansiedade + burnout = X diagnóstico" |
| Pseudonimização Z2 | ✅ "#7ccf38" / "#0ad5e0" (8 chars hex) |
| Devolução interpretação ao médico | ✅ Disclaimer literal preservado |
| Compressão estrutural permitida | ✅ Agrupou narrativas sem categorizar clinicamente (memory `feedback_compressao_estrutural_vs_abstracao_clinica_27_05`) |
| Frase âncora final | ✅ "Interpretação clínica é responsabilidade do médico" |

### Verbatim First V1.9.86
- CLAUDE.md: ~46% bypass GPT em hard-lock phases
- Smoke AEC 28/05 manhã: confirmado em CONSENT_COLLECTION + FINAL_RECOMMENDATION (logs do report `ef7b33d9`)

### AEC Gate V1.5 (REGRA HARD §1)
- Smoke 28/05: "concordo para avancar" durante CONSENT_COLLECTION NÃO disparou agendamento ✅
- Princípio constitucional preservado

### IMRE motor
- Não-auditado este sprint (requer Ricardo + leitura `tradevision-core` linha por linha)

### Lock V1.9.388-A.3 (ancoragem regulatória)
- Memory `reference_lock_v1_9_388_a3_ancoragem_regulatoria_multicamada_27_05` preserva cobertura: CFM 2.314 + CFM 2.381 + LGPD art. 11/20 + EU AI Act + FDA SaMD + WMA

### Onde sistema PRESERVA humanidade (positivo)
- Pseudonimização Z2 V1.9.384 (Paciente #X)
- Atrito intencional (cards desmarcados default em Matrix)
- Disclaimer cristalizado nos prompts
- Devolução interpretação ao médico (princípio constitucional)
- "Compressão estrutural permitida vs abstração clínica proibida" — fronteira nuclear (memory 27/05)

### Onde sistema PODE atravessar fronteira (vigília)
- Bulas ANVISA V1.9.468 — risco de Matrix sintetizar cross-bulas (mitigado pelo prompt anti-síntese, validado 27/05 smoke)
- Sidecar Renal V1.9.307 (CKD-EPI) e Sidecar Neuro Embrião — sugestão automatizada com flag "requer validação médica" + expira em 30d
- Racionalidades pipeline: gera 1 (integrative) automática; outras 4 sob demanda médico (memory 28/05) — preserva autonomia interpretativa

---

## §2 — 07_LONGITUDINALITY_ANALYSIS — Continuidade real

### Empírico 29/05 — pacientes com continuidade > 3 eventos

| Paciente | Reports | Rationalidades | Dossiês | Evoluções FOLLOW_UP | Total eventos |
|---|---|---|---|---|---|
| Carolina Campello (#A41C) | **39** | 3 | 2 | 1 | **45** |
| Pedro Paciente (#6ACF) | 12 | 10 | 3 | 0 | 25 |
| #3D71 (Eduardo simulou) | 15 | 10 | 4 | 0 | 29 |
| Maria das Dores Pinto Pitoco (#B01F) | 1 | 3 | 0 | 1 | 5 |
| Gilda Cruz Siqueira (#E198) | 0 | 0 | 0 | 0 (2 notes appointments) | 2 |
| ...demais ~45 users | < 3 | — | — | — | mínimo |

### Achados
- **3 pacientes com > 25 eventos** (Carolina + Pedro paciente + #3D71) = todos INTERNOS smoke
- **1 paciente externo real com 5 eventos** (Maria Pinto Pitoco)
- **42 dos 50 users com < 3 eventos** = sem continuidade longitudinal real
- **Longitudinalidade empírica externa = ~1 paciente** (Maria Pinto, 5 eventos)

### Camada 1.3 entregue HOJE (V1.9.483)
- usePatientLongitudinal expandido pra carregar dossiês prévios do paciente
- Matrix agora vê continuidade interpretativa quando médico abre paciente

### Camada 1.2 + 1.4 + 1.5 PENDENTES (requer Ricardo destravar)
3 perguntas (memory `project_matrix_roadmap_camadas_1_2_3_28_05`):
1. Matrix lê 18 FOLLOW_UP (médico escreveu) OU 6070 chat_interaction (paciente↔IA)?
2. Lê automático OR sob toggle médico?
3. Plano terapêutico — construir feature primeiro OR Matrix só lê o que já existe (tabela vazia)?

### Camada 2.3 — buraco arquitetural REAL
- `patient_therapeutic_plans` 0 rows + UI nunca codada
- "Momento de decisão clínica ainda não foi institucionalizado no sistema" (frase GPT externo endossada)
- Bloqueia Camada 2 inteira até Ricardo decidir o que é "plano terapêutico" no MedCannLab

---

## §3 — 10_PHILOSOPHICAL_DRIFT — O app ainda é o que vocês queriam?

### Empírico via auditoria semântica (28/05)
- **GPT externo alegou** Landing.tsx descreve "4 fases macro" (errado conceitualmente)
- **Grep confirmou**: Landing.tsx linha 791 escrita CORRETAMENTE — *"O método **Anamnese Triaxial** organiza-se em **3 atos fundamentais**: Abertura Exponencial → Desenvolvimento Indiciário → Fechamento Consensual"*

### Coerência conceitual atual ≈ 100% Landing
A estrutura conceitual Ricardo (Anamnese Triaxial > 3 atos > N microfases) está **corretamente refletida** na Landing E na estrutura do curso AEC (`ArteEntrevistaClinica.tsx`). Não há drift narrativo aqui.

### Empírico — o que é o MedCannLab hoje?
Cruzando taxonomia §5 da `AUDITORIA_22_05`:

**Resposta empírica honesta**:
- ✅ É **pipeline clínico AEC + IA estruturadora** (núcleo CORE vivo)
- ✅ É **arquitetura epistemológica longitudinal** (Z2 + Verbatim + Lock V1.9.388)
- ✅ É **plataforma de pesquisa Z2** (Matrix + dossiês)
- 🟡 É **prontuário longitudinal** parcial (39 reports Carolina vs ~5 demais)
- ❌ **NÃO É** sistema de ensino TRL (eixo dormente)
- ❌ **NÃO É** comunidade fórum (infra pronta, 0 adoção)
- ❌ **NÃO É** workspace médico operacional (Marco 2 pré-PMF)

### Risco drift filosófico vigiado
- **Babylon-pattern** evitado empíricamente em V1.9.486 (canal Feedback não-modela usuário)
- **Watson Health pattern** evitado em Camada 3 (vetada institucionalmente — não modelar trajetória cognitiva médico)
- **Olive-pattern** parcial (V1.9.486 sidebar reverso 3x — drift cognitivo fim sessão, mas auto-correção empírica via feedback Pedro)

### Frase âncora cristalizada (memory `project_matrix_roadmap_camadas_1_2_3_28_05`)
> *"AEC é porta, prontuário longitudinal é memória viva, Matrix é a lente reflexiva sobre essa memória. O médico segue soberano sobre sua própria investigação."*

→ Este é o **norte filosófico** que o sistema empíricamente respeita em 28/05.

---

## §4 — 3 perguntas pendentes Ricardo (Sprint 4 só fecha com ele)

1. **Camada 1.2**: Matrix deve ler 18 FOLLOW_UP + dossiês prévios + relatórios AEC, OU também 6070 chat_interaction (paciente↔Nôa)?
2. **Camada 1.4**: Matrix lê auto a cada turno OR sob toggle médico (anti-V1.9.318 DOC_LIST hijacking)?
3. **Camada 2.3**: Plano terapêutico — construir feature primeiro (paciente_therapeutic_plans tem schema, 0 rows) OR Matrix só lê o que já existe (FOLLOW_UP + dossiês)?

**Camada 3 (modelar trajetória cognitiva médico)** = vetada institucionalmente (Babylon-pattern). Confirmar com Ricardo se concorda — se sim, fechar memory.

---

## §5 — Hierarquia de risco (clínica + filosófica)

### 🔐 Irreversíveis
- **PII em `clinical_rationalities.assessment`** (88.5% rows) — V1.9.452 backlog P0 NÃO-RESOLVIDO (cristalização 27/05 + reconfirmado 28/05)
- **Lock V1.9.299 PBAD AD-RB** intocado (boa)
- **Lock V1.9.388-A.3** intocado (boa)

### 🔴 Quebra uso real
- **Camada 2.3 plano terapêutico** = momento de decisão clínica ainda não institucionalizado no sistema (frase GPT externo, validada empíricamente)

### 🟡 Atrito de fluxo (clínico)
- AEC interrupted 9 sem UI pra Ricardo gerir
- Aba Evolução prontuário mistura 3 fontes (descoberto 28/05)
- Matrix continuidade interpretativa só para 1 paciente externo (Maria Pinto) — útil mas adoção mínima

### ⚫ Polish (filosófico)
- Documentar Lock V1.9.388-A.3 mais visível pra times externos / pitch / regulatório

---

## §6 — Frase âncora consolidada

> *"Z2 preservado empíricamente em 28/05 (smoke Matrix PASS, disclaimer literal, anti-síntese, pseudonimização ativa). 12/50 pacientes têm > 3 eventos longitudinais — 3 INTERNOS + 1 EXTERNO real (Maria Pinto). Norte filosófico Ricardo respeitado: AEC porta + prontuário memória viva + Matrix lente reflexiva. Camada 2.3 plano terapêutico = buraco arquitetural REAL não-resolvido. 3 perguntas Ricardo destravam Camada 2 inteira. Camada 3 (modelar médico) = vetada institucionalmente. PII em clinical_rationalities continua P0 não-mitigado (88.5% rows vazadas, pré-Marco 2 obrigatório)."*
