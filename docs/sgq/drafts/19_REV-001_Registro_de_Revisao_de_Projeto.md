# REV-001 — Registro de Revisão de Projeto

**Versão draft:** 0.1 (29/05/2026)
**Status:** DRAFT pré-consultora SaMD
**Referência normativa:** IEC 62304:2006 §5.4 + ISO 13485:2016 §7.3.5

---

## 1. Objetivo

Registrar formalmente as **revisões de projeto** realizadas em momentos críticos de evolução do MedCannLab 3.0, conforme exigência IEC 62304 §5.4 (Design Review).

Este registro **retroativo** documenta decisões já tomadas que não foram formalmente registradas no momento. Após esta data (29/05/2026), revisões serão registradas em tempo real.

## 2. Convenção de IDs

```
REV-NN — Registro de Revisão Nº NN
```

## 3. Registros retroativos

### REV-01 — V1.9.95 (Lock AEC + Relatório + Agendamento)

| Campo | Valor |
|---|---|
| **Data** | 27/04/2026 |
| **Escopo** | Selagem do primeiro lock crítico envolvendo AEC FSM + Pipeline Orchestrator + Agendamento |
| **Trigger** | Após smoke empírico de fluxo AEC completo end-to-end (7 AECs completas validadas) |
| **Participantes** | Pedro Galluf (Tech Lead) + Dr. Ricardo Valença (Médico Sócio remoto) |
| **Material revisado** | DIARIO_27_04_2026 + commits afetando `clinicalAssessmentFlow.ts`, `tradevision-core/index.ts`, AEC Gate |
| **Decisão** | ✅ APROVADO selagem como lock imutável |
| **Tag git resultante** | `v1.9.95-lock-aec-relatorio-agendamento` |
| **Critério atingido** | REGRA HARD §1 ("Consentimento ≠ Agendamento") validada 4 camadas: guard `isAskingConsent`, AEC Gate V1.5, force tags pós-AEC, RACI contract |
| **Próxima revisão prevista** | A cada mudança Nível 4 (constitucional) |

### REV-02 — V1.9.299 (PBAD AD-RB CONFORME ITI)

| Campo | Valor |
|---|---|
| **Data** | 16/05/2026 |
| **Escopo** | Selagem PDF AD-RB v2.4 ICP-Brasil validado pelo Portal ITI |
| **Trigger** | Smoke completo: openssl asn1parse + upload `validar.iti.gov.br` + diff binário vs PDF aprovado mostraram CONFORMIDADE |
| **Participantes** | Pedro Galluf + Dr. Ricardo Valença (cert ICP-Brasil físico de Ricardo usada no teste) |
| **Material revisado** | Edge `sign-pdf-icp/index.ts` + `icp_chain.ts` + constants `PA_AD_RB_V24_OID` + `PA_AD_RB_V24_SIGPOLICYHASH_HEX` |
| **Decisão** | ✅ APROVADO selagem como lock CRÍTICO regulatório — NÃO tocar sem smoke ITI completo |
| **Tag git resultante** | `v1.9.299-pbad-conforme-locked` |
| **Critério atingido** | Portal ITI validou PDF como "AD-RB CONFORME" oficialmente |
| **Risco residual** | Mudança em ITI PA-AD-RB v2.5+ exigirá novo smoke completo |
| **Próxima revisão prevista** | Quando ITI publicar nova PA OR mudança em cert chain ICP |

### REV-03 — V1.9.452 (PII Sanitize)

| Campo | Valor |
|---|---|
| **Data** | 29/05/2026 ~11h BRT |
| **Escopo** | Backfill 132 rows + Edge `tradevision-core` v423 com helper `sanitizeRationalityPII` |
| **Trigger** | Backlog 28d em memória `project_v1_9_452_pii_sanitize_*` + audit empírico 26/05 mostrou 4/5 rows recentes com nome paciente |
| **Participantes** | Pedro Galluf (sozinho — Ricardo não disponível na janela) |
| **Material revisado** | Edge `tradevision-core/index.ts` linhas 1723+2287 + PL/pgSQL backfill function |
| **Decisão** | ✅ APROVADO selagem após smoke bug "Pedro Paciente" detectou e corrigiu (fix v2 exclude list) |
| **Tag git resultante** | `v1.9.452-pii-sanitize-defensivo-final` |
| **Critério atingido** | 132/132 rows backfilled + telemetria `pii_sanitized=true` em metadata |
| **Nuance descoberta 29/05 20h** | Audit cruzada revelou que 19 rows usam genéricos "O paciente" SEM nome real → sanitização não tinha o que substituir. Sem vazamento PII, mas métrica de cobertura foi corrigida em CFG-BASELINE-001 |
| **Próxima revisão prevista** | Quando UI permitir DELETE de rationalities (não implementado) |

### REV-04 — V1.9.468-A (Matrix Z2 + Bula ANVISA)

| Campo | Valor |
|---|---|
| **Data** | 27/05/2026 ~11h BRT |
| **Escopo** | Selagem Matrix Z2 + Bula ANVISA com locks micro-factuais |
| **Trigger** | Smoke 5/5 PASS empírico com Paciente #6ACF + 2 bulas CBD (Prati-Donaduzzi + Ease Labs) + paper Cannabis |
| **Participantes** | Pedro Galluf + Dr. Ricardo Valença (autoria método) |
| **Material revisado** | Matrix RESEARCH_PROMPT + BulaContextPopover V1.9.466 + 5 perguntas-armadilha (qual CBD melhor / compare / posologia / interação CBD farma×natura / sugira CBD) |
| **Decisão** | ✅ APROVADO selagem após 5/5 perguntas-armadilha não dispararem síntese cross-bulas ou recomendação direta |
| **Tag git resultante** | `v1.9.468-A-matrix-bula-locks-final` |
| **Critério atingido** | Princípio "compressão estrutural permitida vs abstração clínica proibida" empíricamente validado (memória `feedback_compressao_estrutural_vs_abstracao_clinica_27_05`) |
| **Próxima revisão prevista** | A cada nova versão Matrix OR a cada 90 dias (smoke trimestral VER-CAD-06) |

### REV-05 — V1.9.502-C (SGQ Operacional + Pasta Consultora)

| Campo | Valor |
|---|---|
| **Data** | 29/05/2026 ~20h08 BRT |
| **Escopo** | Entrega de 16 drafts SGQ + Executive Summary + estrutura pasta executiva 00-09 |
| **Trigger** | 2ª avaliação GPT externa apontou "limiar cruzado de documentação — gargalo agora é verificação formal + governança" |
| **Participantes** | Pedro Galluf + Claude (Anthropic, co-author IA-assisted) |
| **Material revisado** | 16 drafts SGQ + EXECUTIVE_SUMMARY + audit cruzada empírica via PAT + Mapping empírico 5 callers `tradevision-core` |
| **Decisão** | ✅ APROVADO commit `f0aff57` push 4 refs |
| **Critério atingido** | Push Protection PASS (após mascarar PAT exposto no PLAN-FLIP-001) + type-check EXIT=0 + 144/144 RLS confirmado + 42 reports ICP signed + 113/132 rat com pseudônimo explícito |
| **Pendências documentadas** | Sprint A: rotação 3 PATs + flip verify_jwt (PLAN-FLIP-001 pronto pra execução) |
| **Próxima revisão prevista** | Pós-CNPJ + contratação consultora SaMD |

## 4. Princípio empírico aplicado em todas as revisões

> *"Validação empírica via screenshot > plano teórico"* (memória `feedback_validacao_empirica_screenshot_maior_que_plano_teorico_28_05`)

Todos os 5 registros retroativos têm evidência empírica documentada (smoke + PAT + tags git) — nenhuma decisão foi tomada exclusivamente por raciocínio teórico.

## 5. Próximas revisões previstas

### REV-06 (planejada) — Flip verify_jwt em tradevision-core

| Campo | Valor planejado |
|---|---|
| **Trigger esperado** | Decisão Pedro de executar PLAN-FLIP-001 em janela 02h-05h BRT |
| **Smoke pré** | Confirmar verify_jwt=false v423 |
| **Smoke pós** | (1) verify_jwt=true v424, (2) 401 sem JWT, (3) turn IA com JWT válido, (4) 5 turns AEC |
| **Rollback** | `npx supabase functions deploy tradevision-core --no-verify-jwt` (30s) |
| **Tag git esperada** | `v1.9.50X-verify-jwt-flipped` |

### REV-07 (planejada) — Marco 1 (CNPJ ativo + RT contratado)

| Campo | Valor planejado |
|---|---|
| **Trigger esperado** | Contador semana 29/05 OR semana 06/06/2026 |
| **Participantes** | Pedro + Ricardo + Eduardo + João + (futuro) RT habilitado |
| **Decisões críticas** | Estabelecer DPO + cronograma consultora + RACI formal pós-CNPJ |
| **Material esperado** | Contrato consultora SaMD + Termo de Responsabilidade Técnica + LGPD compliance plan |

## 6. Inventário REV-001

- Registros retroativos: 5 (REV-01..05)
- Registros planejados: 2 (REV-06..07)
- Todos com evidência empírica documentada
- Todos com tag git resultante (exceto planejados)

## 7. Cadência de manutenção

- **Atualizar sempre:** Após selagem de lock V1.9.X com impacto Nível 3+
- **Revisão mensal:** Garantir que todos os locks recentes têm REV correspondente

---

**Aprovação:**
- [ ] Pedro Henrique Passos Galluf — Data: 29/05/2026 (draft retroativo)
- [ ] Dr. Ricardo Valença — Data: ___/___/___
- [ ] RT habilitado — Data: ___/___/___ (pós-CNPJ)

**Frase âncora:**

> *"5 registros retroativos de Design Review (V1.9.95, V1.9.299, V1.9.452, V1.9.468-A, V1.9.502-C) documentam que decisões críticas tiveram evidência empírica (smoke + PAT + tag git) — não apenas raciocínio teórico. Auditor IEC 62304 §5.4 quer ver isso explicitamente, agora tem."*
