# PLN-IEC-001 — Plano de Desenvolvimento de Software Médico Classe B

**Versão draft:** 0.1 (29/05/2026)
**Status:** DRAFT pré-consultora SaMD
**Referência normativa:** IEC 62304:2006 §5.1 (Plano de Desenvolvimento)

---

## 1. Classificação de software

**MedCannLab 3.0** = **Classe B** (IEC 62304:2006 §4.3)

Justificativa de classificação:

- **Não é Classe A** porque influencia decisão diagnóstica/terapêutica (AEC + relatórios + racionalidades)
- **Não é Classe C** porque NÃO controla diretamente equipamento crítico nem decide autonomamente prescrição (médico mantém soberania conforme lock V1.9.388-A.3)

**Lock V1.9.388-A.3** explicita: *"Sistema NÃO PODE eticamente: substituir decisão médica, prescrever autonomamente, modificar conduta sem médico no loop."*

## 2. Arquitetura cognitiva — Pirâmide 8 camadas

```
0. REGRA HARD §1 (constitucional)        "Consentimento ≠ Agendamento" — anti-kevlar §1
1. COS KERNEL v5.0 (cos_engine.ts*)      5 portas: KillSwitch / Trauma / Metabolismo / ReadOnly / Policy
2. AEC FSM (clinicalAssessmentFlow.ts)   13+ fases determinísticas
3. VERBATIM FIRST (V1.9.86)              ~46% bypass GPT em hard-lock phases
4. AEC GATE V1.5 (V1.9.95-A reforçado)   Bloqueia agendamento durante AEC ativa
5. GPT-4o-2024-08-06 / gpt-4o-mini       Só chamado se nada acima resolveu
6. PÓS-PROCESSAMENTO                     Strip tokens, validate UUID, force tags pós-AEC
7. PIPELINE ORCHESTRATOR                 REPORT → SCORES → SIGNATURE → AXES → RATIONALITY → DONE
```

Conformidade IEC 62304 §5.2.1 (Requisitos de software): pirâmide acima já implementa controles de risco em **múltiplas camadas** (defense in depth — princípio cristalizado).

## 3. Decomposição de itens de software (IEC 62304 §5.3)

### 3.1. Frontend (React + TypeScript + Vite)
- **3.500+ linhas TypeScript** (29/05/2026)
- Componentes principais: AlunoDashboard, PatientsManagement, ProfessionalDashboard, ResearchWorkstation, MedicalRecord
- Estado: 363 arquivos `.tsx`/`.ts` em `src/`

### 3.2. Backend (Supabase Postgres + Edge Functions Deno)
- **15 Edge Functions** ativas (29/05/2026)
- **144 tabelas** Postgres com RLS habilitado em 100%
- **3 Cron Jobs** pg_cron (video-call-reminders / monthly-closing / expire-renal-suggestions)

### 3.3. Edge Functions críticas (ranking por risco)

| Edge | Versão atual | Risco IEC 62304 | Lock associado |
|---|---|---|---|
| tradevision-core | v423 | A1 (decisão clínica) | V1.9.388-A.3 |
| sign-pdf-icp | v22 | A1 (assinatura jurídica) | V1.9.299 ICP-Brasil |
| digital-signature | v65 | A1 (CFM 3 levels) | V1.9.299 |
| cert-encrypt-password | v3 | A2 (cripto) | V1.9.299 |
| video-call-reminders | v31 | B (operacional) | V1.9.99-B |
| send-email | v62 | B (comunicação) | — |
| extract-document-text | v59 | C (utilitário) | — |

## 4. Processo de desenvolvimento (IEC 62304 §5.4)

### 4.1. Pipeline Diário → Magno (princípio meta-arquitetural)

```
HIPÓTESE → EXPERIMENTO → VALIDAÇÃO → CRISTALIZAÇÃO
(diário)   (sprint)      (uso real)   (Livro Magno)
```

- **Diário** = laboratório operacional, WIP, registra tudo
- **Memórias persistentes** = aprendizados intermediários
- **Livro Magno** = museu institucional, só absorve o que provou valor empírico repetível (3-6 semanas uso real sem regressão)

### 4.2. Princípio "polir, não inventar" (Princípio 8 cristalizado)

Antes de criar código novo: **buscar mecanismo equivalente que já existe no codebase**. Reutilizar > criar paralelo.

Exemplo aplicado: V1.9.452 PII sanitize **reusou** `pseudonymizePatientReferences` (V1.9.407 `casePseudonymization.ts`) em vez de criar algoritmo novo.

### 4.3. Validação empírica obrigatória (Princípio Meta 28/05)

> *"Antes de codar refatoração, validar empíricamente (screenshot/execução) que melhora estado atual."*

Cristalizado após 5 iterações falhadas Card Neuro/Renal V1.9.475-A-D + V1.9.476-A. Aplicável a TODA refatoração futura.

## 5. Verificação de software (IEC 62304 §5.6)

### 5.1. Métodos empíricos validados

1. **Smoke PAT via Supabase Management API** — validação de schema, contagens, integridade referencial
2. **Type-check `npx tsc --noEmit`** — validação sintática TypeScript (obrigatório pré-commit)
3. **Smoke clinical_qa_runs** — framework PMF Audit Memo 28/04 (17 colunas estruturadas)
4. **Smoke empírico via UI** — Pedro/Ricardo flagam regressões antes do user externo
5. **Cron telemetria** — `cron.job_run_details` últimos 7d = 2.023 runs / 100% succeeded

### 5.2. Cadência mínima `clinical_qa_runs` (princípio cristalizado 26/05)

- **1 QA run por nova versão V1.9.X que toca código clínico** (AEC FSM / Pipeline / Verbatim / signature / RAG)
- **1 QA run quinzenal** num report aleatório (rotação Claude/Pedro/Ricardo)
- **1 QA run OBRIGATÓRIA pré-Marco 2** em report do 1º paciente externo pagante

## 6. Gerenciamento de configuração (IEC 62304 §8)

Detalhado em [POP-CTL-001 Controle de Documentos](./01_POP-CTL-001_Controle_de_Documentos.md).

Resumo:
- Git como SCM primário
- Versionamento V1.9.X com sub-letras
- Tags imutáveis pra locks críticos (8 atuais)
- Push obrigatório 4 referências (2 remotes × main + master)

## 7. Gerenciamento de problemas (IEC 62304 §9)

Detalhado em [PROC-CAPA-001 Ação Corretiva e Preventiva](./08_PROC-CAPA-001_CAPA.md).

Resumo:
- Bugs flagrados via UI (Pedro empírico) → diário → memória → fix → smoke
- Memórias `feedback_*` = lessons learned formalizadas
- 284 memórias cristalizadas em 30 dias de operação

## 8. Modelo de ciclo de vida adotado

**Modelo evolucionário com selagem incremental** (aderente IEC 62304 §5.1.1).

Justificativa: ambiente HealthTech em fase pré-PMF exige iteração rápida com validação clínica empírica em loop curto. Modelo waterfall puro seria inadequado (memória `feedback_drift_historico_dev_aceitavel_pre_pmf_18_05`).

Estabilização para waterfall pós-Marco 2 (paciente externo pagante) garantirá conformidade plena para submissão regulatória.

## 9. Marcos formais de desenvolvimento

| Marco | Critério | Status |
|---|---|---|
| Marco 1 | CNPJ ativo + RT contratado | ⏳ Em andamento (semana 29/05/2026) |
| Marco 2 | 1º paciente externo pagante real validando | ❌ Pendente |
| Marco 2.5 | 2º médico independente externo no smoke | ❌ Pendente |
| Marco 3 | 20-30 pacientes externos pagantes (PMF) | ❌ Pendente |
| Marco 4 | Petição ANVISA Classe IIa submetida | ❌ Pós-Marcos 1-3 |

## 10. Equipe de desenvolvimento (RACI)

| Papel | Pessoa | Responsabilidade IEC 62304 |
|---|---|---|
| Tech Lead | Pedro Henrique Passos Galluf | Arquitetura geral + selagem locks |
| Médico Sócio (Clínica) | Dr. Ricardo Valença | Validação clínica + criador método AEC |
| Coordenador Ensino | Dr. Eduardo Faveret | Validação metodológica eixo Ensino |
| Sócio Institucional | João Eduardo Vidal | CNPJ + parcerias + regulatório |
| RT habilitado | A contratar pós-CNPJ | Assinatura formal documental |
| Consultora SaMD | A contratar pós-CNPJ | Revisão formato + submissão ANVISA |

---

**Aprovação:**
- [ ] RT habilitado: ________________ Data: ___/___/___
- [ ] Consultora SaMD: ________________ Data: ___/___/___
- [ ] Tech Lead: Pedro Henrique Passos Galluf — Data: 29/05/2026 (draft)
