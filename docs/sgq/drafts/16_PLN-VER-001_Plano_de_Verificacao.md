# PLN-VER-001 — Plano de Verificação

**Versão draft:** 0.1 (29/05/2026)
**Status:** DRAFT pré-consultora SaMD
**Referência normativa:** ISO 13485:2016 §7.3.6 + IEC 62304:2006 §5.6

---

## 1. Objetivo

Consolidar a **estratégia formal de verificação** do MedCannLab 3.0, distinta da **validação clínica** (POP-VAL-001), explicitando:

- Métodos de verificação adotados
- Critérios de aceitação
- Cadências obrigatórias
- Responsáveis por cada tipo de verificação
- Rastreabilidade com testes (TST-XX) catalogados em TRM-001

## 2. Diferença Verificação vs Validação

| Conceito | Pergunta-chave | Documento mestre |
|---|---|---|
| **Verificação** (§7.3.6) | "O software foi construído **corretamente**?" | PLN-VER-001 (este doc) |
| **Validação** (§7.3.7) | "Construímos o software **certo**?" (atende necessidade clínica?) | POP-VAL-001 |

## 3. Convenção de IDs

```
VER-MET-NN   (Método de verificação)
VER-CRI-NN   (Critério de aceitação)
VER-CAD-NN   (Cadência)
VER-RSP-NN   (Responsável)
```

Cada item rastreável bidirecionalmente via TRM-001.

## 4. Métodos de Verificação (VER-MET-XX)

### VER-MET-01 — Type-check estático TypeScript

**Descrição:** Compilação `npx tsc --noEmit` deve retornar EXIT=0.
**Cobertura:** 363 arquivos `.tsx`/`.ts` em `src/`.
**Ferramenta:** TypeScript 5+ via npm script.
**Mapeia para:** TST-02.

### VER-MET-02 — Smoke PAT empírico do schema

**Descrição:** Validar `information_schema.columns` ANTES de qualquer SELECT/INSERT em script SQL.
**Justificativa:** Princípio cristalizado [[feedback_nao_chutar_uuid_quando_pat_disponivel_29_05]] após incidente FK violation 29/05.
**Mapeia para:** TST-03.

### VER-MET-03 — Smoke ITI para PDFs ICP-Brasil

**Descrição:** `openssl asn1parse` + upload `validar.iti.gov.br` + diff binário vs PDF aprovado.
**Cobertura:** Toda alteração em `sign-pdf-icp/*`.
**Mapeia para:** TST-01.
**Bloqueador de release:** Se smoke falhar, NÃO push.

### VER-MET-04 — Smoke empírico via UI (Pedro + Ricardo + Eduardo)

**Descrição:** Uso real do app por sócios antes de paciente externo.
**Princípio:** [[feedback_validacao_empirica_screenshot_maior_que_plano_teorico_28_05]] — screenshot > teoria.
**Mapeia para:** TST-07.

### VER-MET-05 — `clinical_qa_runs` (framework PMF Audit V1.9.85)

**Descrição:** Audit estruturado com 17 colunas, 4 buckets coloridos:
- 🟢 GREEN_FACTS (validados empíricamente)
- 🟡 YELLOW_HYPOTHESES (razoáveis não validadas)
- 🟠 ORANGE_INTERPRETATIONS (narrativas com alta variância)
- 🔴 RED_BLINDSPOTS (pontos cegos conhecidos)

**Mapeia para:** TST-04.

### VER-MET-06 — Telemetria automática contínua

**Descrição:** Captura passiva via `ai_chat_interactions.metadata` (V1.9.238) + `cron.job_run_details` + `cognitive_events`.
**Mapeia para:** TST-05, TST-09.

### VER-MET-07 — Smoke Matrix Z2 (perguntas-armadilha)

**Descrição:** 5 perguntas pré-codificadas para validar lock V1.9.468-A (cita literal, NÃO sintetiza cross-bulas, NÃO sugere troca, NÃO infere interação não-documentada).
**Mapeia para:** TST-08.

### VER-MET-08 — Smoke auth nas Edges sensíveis

**Descrição:** Hit sem JWT → 401 esperado; hit com JWT inválido → 401 esperado; hit com JWT válido + ownership wrong → 403 esperado.
**Cobertura:** `sign-pdf-icp` (após V1.9.457), `tradevision-core` (após flip pendente).
**Mapeia para:** TST-06.

### VER-MET-09 — Verificação RLS 100% via PAT

**Descrição:** `SELECT COUNT(*) FROM pg_class WHERE relrowsecurity=true AND schema='public'` deve igualar total de tabelas.
**Mapeia para:** TST-10.
**Estado atual:** 144/144 ✅.

### VER-MET-10 — Verificação PII sanitização

**Descrição:** `SELECT COUNT(*) FROM clinical_rationalities WHERE assessment LIKE 'Paciente #%'` deve igualar total.
**Mapeia para:** TST-11.
**Estado atual:** 132/132 ✅.

## 5. Critérios de Aceitação (VER-CRI-XX)

### VER-CRI-01 — Type-check zero erros

**Critério:** EXIT=0 obrigatório pré-commit.
**Hook:** `lint-staged` no `.husky/pre-commit`.
**Bloqueador:** Sim.

### VER-CRI-02 — Smoke ITI PASS

**Critério:** Portal ITI valida assinatura como "AD-RB CONFORME".
**Bloqueador:** Sim (não push se falhar).

### VER-CRI-03 — Latência P95 < 12s

**Critério:** Telemetria semanal mostra P95 abaixo de 12.000ms.
**Bloqueador:** Não, mas dispara investigação.

### VER-CRI-04 — Cron success rate > 99%

**Critério:** `cron.job_run_details` últimos 7d ≥ 99% succeeded.
**Estado atual:** 100% (2.023/2.023) ✅.
**Bloqueador:** Investigar se < 99%.

### VER-CRI-05 — Zero turns IA falhos por hora

**Critério:** `ai_chat_interactions WHERE ai_response IS NULL OR ai_response=''` deve ser 0/hora.
**Bloqueador:** Alerta para Tech Lead se > 5/hora.

### VER-CRI-06 — RLS 100% das tabelas públicas

**Critério:** Toda tabela em `pg_tables WHERE schemaname='public'` deve ter `relrowsecurity=true`.
**Bloqueador:** Sim (não criar tabela sem RLS).

### VER-CRI-07 — PII 100% sanitizada em rationalities

**Critério:** Zero rows com nome real (sem prefixo `Paciente #`) em `clinical_rationalities.assessment`.
**Bloqueador:** Sim (Edge `tradevision-core` deve garantir).

### VER-CRI-08 — Smoke Matrix 5/5 PASS

**Critério:** Todas 5 perguntas-armadilha não disparam síntese cross-bulas / recomendação direta / interação não-documentada.
**Bloqueador:** Sim (lock V1.9.468-A).

### VER-CRI-09 — `clinical_qa_runs` verdict_score ≥ 70

**Critério:** Cada QA run deve registrar `verdict_score ≥ 70` (escala 0-100).
**Bloqueador:** Não, mas dispara CAPA se < 70.

### VER-CRI-10 — Custo OpenAI ≤ $1 USD/AEC (média)

**Critério:** `cost_usd_estimate` médio por AEC completa.
**Estado atual:** ~$0.60/AEC (empírico).
**Bloqueador:** Não, mas alerta se > $1.

## 6. Cadências de Verificação IEC 62304 §5.6 (VER-CAD-XX)

> **Nota:** Esta seção lista apenas cadências de **verificação de software** (item foi construído corretamente?). Cadências de **monitoramento operacional** (telemetria + custos + uso) ficam em §7 — separação solicitada por consultoria externa 29/05 para evitar discussão semântica com auditor mais rígido.

### VER-CAD-01 — Pré-commit

**O que:** Type-check + secretlint.
**Quando:** Toda staged commit.
**Quem:** Hook automático (Husky + lint-staged).

### VER-CAD-02 — Pré-push (futuro)

**O que:** Vitest tests + lint.
**Quando:** Toda push.
**Quem:** Hook automático (a configurar).
**Status atual:** ⚠️ Não implementado — pendência operacional.

### VER-CAD-03 — Por release V1.9.X

**O que:** Smoke empírico via UI no fluxo afetado.
**Quando:** Toda mudança Nível 3+ (vide POP-CTL-007).
**Quem:** Pedro + Ricardo (clínico) + Eduardo (Ensino) conforme escopo.

### VER-CAD-04 — Smoke ITI por alteração em sign-pdf-icp

**O que:** Smoke completo VER-MET-03.
**Quando:** Toda alteração em `supabase/functions/sign-pdf-icp/*`.
**Quem:** Pedro (Tech Lead).
**Bloqueador:** Push proibido sem smoke ITI PASS.

### VER-CAD-05 — `clinical_qa_runs` quinzenal

**O que:** 1 QA run estruturado em report aleatório.
**Quando:** A cada 14 dias.
**Quem:** Rotação Claude (com PAT) → Pedro → Ricardo.
**Estado atual:** ✅ 2 runs em 30 dias = 100% da meta de 2 runs/mês (quantidade OK; qualidade/profundidade ainda precisa subir).
**Meta:** 2 runs/mês mínimo + 1 run por versão V1.9.X que toca código clínico + 1 run obrigatória pré-Marco 2.
**Gap real:** acumulação histórica baixa (2 runs totais) → baseline regulatório frágil. Meta 12+ runs até 31/12/2026.

### VER-CAD-06 — Smoke Matrix Z2 trimestral

**O que:** VER-MET-07 com 5 perguntas-armadilha.
**Quando:** A cada 90 dias OR a cada nova versão Matrix.
**Quem:** Pedro + Ricardo.

### VER-CAD-07 — Audit empírico schema mensal

**O que:** Validar RLS 100%, PII sanitization 100%, contagens de tabelas core.
**Quando:** 1° dia útil de cada mês.
**Quem:** Pedro com auxílio Claude.

## 7. Monitoramento Operacional (MON-CAD-XX)

> **Distinção:** Monitoramento operacional ≠ Verificação IEC 62304. Estes itens são captura passiva contínua + análise periódica de uso real, não validação de que o software foi construído corretamente. Preparam material para futuro Post-Market Surveillance (PROC-PMS-001 parqueado).

### MON-CAD-01 — Telemetria automática contínua

**O que:** Painel AdminAIGovernance + alertas automáticos (latência, custo, falhas).
**Quando:** Contínuo (captura passiva via `ai_chat_interactions.metadata`).
**Quem:** Sistema automatizado.

### MON-CAD-02 — Audit de uso real semanal

**O que:** Quem usou Nôa nos últimos 7d, quanto custou, quais features.
**Quando:** Toda segunda-feira de manhã.
**Quem:** Pedro.

### MON-CAD-03 — Análise mensal de tendências de custo

**O que:** Custo agregado por feature/usuário/eixo + projeção pós-Marco 2.
**Quando:** Último dia útil de cada mês.
**Quem:** Pedro.

### MON-CAD-04 — Cron health check semanal

**O que:** Validar `cron.job_run_details` últimos 7d ≥ 99% success.
**Quando:** Toda segunda-feira.
**Quem:** Pedro.

## 8. Responsáveis (VER-RSP-XX)

### VER-RSP-01 — Tech Lead (Pedro Galluf)

**Responsável por:**
- VER-CAD-01 (type-check) — automatizado
- VER-CAD-04 (smoke ITI)
- VER-CAD-07 (audit schema)
- MON-CAD-02 (audit de uso real semanal)
- MON-CAD-03 (análise mensal de custos)
- MON-CAD-04 (cron health check semanal)
- Selagem de locks V1.9.X (POP-CTL-007 §4)

> **Correção empírica 29/05 20h30 BRT:** versão draft inicial referenciava `VER-CAD-09 (audit uso real)`, ID que não existe — o item migrou para MON-CAD-02 quando §6 foi separado de §7 (sugestão consultoria externa). Bug identificado por auditoria cruzada externa (Claude2) e corrigido empíricamente. Validação do conceito Nível 4 (Auditor IA detectando IDs órfãos).

### VER-RSP-02 — Médico Sócio (Ricardo Valença)

**Responsável por:**
- VER-CAD-03 (smoke release clínico) — apenas escopo clínico
- VER-CAD-05 (clinical_qa_runs) — rotação compartilhada
- VER-CAD-06 (smoke Matrix Z2)
- Aprovação clínica de QA runs (`verdict` final em `clinical_qa_runs`)

### VER-RSP-03 — Coord. Ensino (Eduardo Faveret)

**Responsável por:**
- VER-CAD-03 — apenas escopo Ensino (cursos AEC + simulações)
- Validação metodológica de simulações de paciente

### VER-RSP-04 — Sócio Institucional (João Eduardo Vidal)

**Responsável por:**
- Verificação regulatória externa (CFM / LGPD / ANVISA)
- Validação de conformidade pós-CNPJ

### VER-RSP-05 — RT habilitado (a contratar pós-CNPJ)

**Responsável por:**
- Aprovação formal de documentos SGQ
- Auditoria externa periódica
- Assinatura de relatórios regulatórios

### VER-RSP-06 — Consultora SaMD (a contratar pós-CNPJ)

**Responsável por:**
- Revisão de formato dos documentos
- Submissão regulatória ANVISA
- Auditoria de conformidade ISO 13485 / IEC 62304 / ISO 14971

## 8.1. Cobertura SRS → Método de Verificação

Tabela inversa da TRM (responde diretamente: *"Como cada requisito é verificado?"*).

### Funcionais (SRS-FR-XX)

| SRS | Requisito | Método principal | Cadência |
|---|---|---|---|
| SRS-FR-01 | Regra Hard §1 (Consentimento ≠ Agendamento) | VER-MET-04 (smoke UI) | VER-CAD-03 |
| SRS-FR-02 | COS Kernel 5 portas | VER-MET-04 + VER-MET-05 | VER-CAD-03 + VER-CAD-05 |
| SRS-FR-03 | AEC FSM 13 fases | VER-MET-04 + VER-MET-05 | VER-CAD-03 + VER-CAD-05 |
| SRS-FR-04 | Verbatim First | VER-MET-04 | VER-CAD-03 |
| SRS-FR-05 | AEC Gate V1.5 | VER-MET-04 | VER-CAD-03 |
| SRS-FR-06 | GPT-4o camada 5 | VER-MET-06 (telemetria) | MON-CAD-01 |
| SRS-FR-07 | Pós-processamento | VER-MET-04 | VER-CAD-03 |
| SRS-FR-08 | Pipeline Orchestrator | VER-MET-05 | VER-CAD-05 |
| SRS-FR-09 | Assinatura ICP-Brasil PBAD AD-RB | **VER-MET-03 (smoke ITI)** | VER-CAD-04 (bloqueador) |
| SRS-FR-10 | Auth + ownership check sign-pdf-icp | **VER-MET-08 (smoke 401)** | VER-CAD-04 |
| SRS-FR-11 | Cripto password ICP | VER-MET-04 | VER-CAD-03 |
| SRS-FR-12 | Cron video-call-reminders | VER-MET-06 | MON-CAD-04 |
| SRS-FR-13 | PII sanitization racionalidades | **VER-MET-10 (PII PAT)** | VER-CAD-07 (bloqueador) |
| SRS-FR-14 | Share cross-account | VER-MET-04 | VER-CAD-03 |
| SRS-FR-15 | Cadastro paciente externo offline | VER-MET-04 | VER-CAD-03 |
| SRS-FR-16 | InterruptedAECs visíveis | VER-MET-04 | VER-CAD-03 |
| SRS-FR-17 | Invalidação com motivo | VER-MET-04 | VER-CAD-03 |
| SRS-FR-18 | Separação 3 fontes Evolução | VER-MET-04 | VER-CAD-03 |
| SRS-FR-19 | Toggles Matrix | VER-MET-07 (Matrix Z2) | VER-CAD-06 |
| SRS-FR-20 | FOLLOW_UP em hook longitudinal | VER-MET-04 | VER-CAD-03 |
| SRS-FR-21 | Bula Matrix Z2 | **VER-MET-07 (5/5 perguntas-armadilha)** | VER-CAD-06 (bloqueador) |
| SRS-FR-22 | Modal evolução não-disruptivo | VER-MET-04 | VER-CAD-03 |
| SRS-FR-23 | Receituário CFM 4 tipos | VER-MET-04 + VER-MET-03 | VER-CAD-03 + VER-CAD-04 |
| SRS-FR-24 | Notícias institucionais | VER-MET-04 | VER-CAD-03 |
| SRS-FR-25 | Instrumentos de avaliação | VER-MET-04 | VER-CAD-03 |
| SRS-FR-26 | Mentoria | VER-MET-04 | VER-CAD-03 |
| SRS-FR-27 | Cost tracking IA | VER-MET-06 | MON-CAD-01 |
| SRS-FR-28 | Painel agregado por feature | VER-MET-06 | MON-CAD-01 |
| SRS-FR-29 | RPC anonymize_user_safely | VER-MET-01 (type-check) + VER-MET-02 (PAT) | VER-CAD-01 + VER-CAD-07 |
| SRS-FR-30 | Stats reais Dashboard | VER-MET-01 + VER-MET-04 | VER-CAD-01 + VER-CAD-03 |
| SRS-FR-31 | Atividade Recente derivada | VER-MET-01 + VER-MET-04 | VER-CAD-01 + VER-CAD-03 |

### Não-funcionais (SRS-NFR-XX)

| SRS | Requisito | Método principal | Cadência |
|---|---|---|---|
| SRS-NFR-01 | Latência P50<5s P95<12s | VER-MET-06 | MON-CAD-01 |
| SRS-NFR-02 | Disponibilidade ≥99.5% | VER-MET-06 | MON-CAD-04 |
| SRS-NFR-03 | RLS 100% nas tabelas | **VER-MET-09 (RLS PAT)** | VER-CAD-07 (bloqueador) |
| SRS-NFR-04 | TLS 1.2+ | (Vercel + Supabase nativo) | Contínuo |
| SRS-NFR-05 | Encryption at rest | (Supabase Pro nativo) | Contínuo |
| SRS-NFR-06 | Verify JWT em Edges sensíveis | **VER-MET-08 (smoke auth)** | VER-CAD-04 |
| SRS-NFR-07 | PII sanitização preventiva | **VER-MET-10 (PII PAT)** | VER-CAD-07 (bloqueador) |
| SRS-NFR-08 | Custo OpenAI ≤$0.05/turn médio | VER-MET-06 | MON-CAD-03 |
| SRS-NFR-09 | Versionamento auditável | (Git + tags) | Contínuo |
| SRS-NFR-10 | Backup contínuo | (Supabase Pro nativo) | Contínuo |
| SRS-NFR-11 | Cron success rate >99% | VER-MET-06 | MON-CAD-04 |
| SRS-NFR-12 | Responsivo 360px+ | VER-MET-04 | VER-CAD-03 |
| SRS-NFR-13 | Empty state honesto | VER-MET-04 | VER-CAD-03 |

**Cobertura empírica:** 44/44 SRS com pelo menos 1 método de verificação ou monitoramento mapeado. **Cobertura 100%.**

## 8.2. Release Gate (critério unificado de aprovação)

Uma release V1.9.X só pode ser pushada para `main` se TODAS as condições aplicáveis abaixo PASS:

### Gates BLOQUEADORES (sempre obrigatórios)

| Gate | Condição | Critério | Documentação |
|---|---|---|---|
| **G1** | Sempre | VER-CRI-01 PASS (type-check EXIT=0) | Pré-commit hook |
| **G2** | Sempre | VER-CRI-06 PASS (RLS 100% mantido) | VER-MET-09 |
| **G3** | Sempre | VER-CRI-07 PASS (PII sanitização 100% mantida) | VER-MET-10 |

### Gates CONDICIONAIS (aplicáveis ao escopo)

| Gate | Condição | Critério | Documentação |
|---|---|---|---|
| **G4** | Toca `sign-pdf-icp/*` | VER-CRI-02 PASS (smoke ITI portal) | VER-MET-03 |
| **G5** | Toca Matrix / lock V1.9.468-A | VER-CRI-08 PASS (5/5 perguntas-armadilha) | VER-MET-07 |
| **G6** | Toca AEC FSM / Pipeline / Verbatim | Smoke UI Ricardo PASS | VER-MET-04 |
| **G7** | Toca Edge auth | VER-MET-08 PASS (smoke 401 sem JWT) | VER-MET-08 |
| **G8** | Mudança Nível 3+ (POP-CTL-007) | Smoke empírico documentado em diário | VER-CAD-03 |

### Exceção emergencial

Hotfix emergencial pode pular **G6-G8** mediante:
- Registro síncrono com Médico Sócio (WhatsApp + screenshot)
- Documentação retroativa em até 24h
- Post-mortem em diário do dia seguinte

**Exemplo aplicado:** V1.9.500-A (29/05 12:28 BRT) — coluna inexistente flagrada empíricamente, hotfix em <30min com `clinical_reports.assessment` removido do SELECT. Commit `252cd36` push 4 refs OK.

## 9. Matriz Método × Cadência × Responsável

| Método | Cadência | Responsável principal | Bloqueador |
|---|---|---|---|
| VER-MET-01 (type-check) | VER-CAD-01 (pré-commit) | Hook automático | Sim |
| VER-MET-02 (smoke PAT schema) | Ad-hoc | Pedro | Sim |
| VER-MET-03 (smoke ITI) | VER-CAD-04 | Pedro | Sim |
| VER-MET-04 (smoke UI) | VER-CAD-03 | Pedro + Ricardo + Eduardo | Não |
| VER-MET-05 (clinical_qa_runs) | VER-CAD-05 | Rotação | Não (CAPA se score < 70) |
| VER-MET-06 (telemetria) | VER-CAD-08 (contínuo) | Sistema | Alertas |
| VER-MET-07 (Matrix Z2) | VER-CAD-06 | Pedro + Ricardo | Sim (lock V1.9.468-A) |
| VER-MET-08 (smoke auth) | VER-CAD-04 (sign-pdf-icp) + VER-CAD-09 (tradevision-core pós-flip) | Pedro | Sim |
| VER-MET-09 (RLS PAT) | VER-CAD-07 | Pedro | Sim |
| VER-MET-10 (PII PAT) | VER-CAD-07 | Pedro | Sim |

## 10. Cobertura empírica atual (29/05/2026)

| Item | Status |
|---|---|
| Type-check pré-commit ativo | ✅ Husky + lint-staged |
| Smoke ITI documentado | ✅ V1.9.299 procedure |
| Smoke UI por release | ⚠️ Ad-hoc, não formalizado por release |
| `clinical_qa_runs` cadência mínima | ❌ 2/30d (target 2/mês = 6,7%/mês da meta) |
| Telemetria custo IA | ✅ V1.9.238 + V1.9.374 painel |
| Smoke Matrix Z2 | ✅ Realizado 27/05 V1.9.468-A (5/5 PASS) |
| Smoke auth sign-pdf-icp | ✅ V1.9.457 SMOKE 1+2 PASS |
| Smoke auth tradevision-core | ⏳ Pendente flip (PLAN-FLIP-001) |
| Verificação RLS mensal | ⚠️ Ad-hoc (último: 29/05) |
| Verificação PII mensal | ✅ Por design via V1.9.452 |

## 11. Gaps de cobertura identificados

### Gap V01 — Pré-push hooks não implementados (VER-CAD-02)

**Risco:** Type-check pré-commit não pega regressão multi-arquivo. Vitest tests não rodam automaticamente.
**Plano:** Configurar `.husky/pre-push` rodando `npm run test` + `npm run lint` (~1h).

### Gap V02 — `clinical_qa_runs` acumulação histórica baixa

**Estado real:** Cadência atual está cumprindo meta (2 runs/30d = 100%).
**Gap real:** Apenas 2 runs totais no histórico → baseline empírico para auditor é frágil.
**Risco:** Auditor regulatório pode questionar profundidade da validação clínica documental.
**Plano:** Manter cadência quinzenal + adicionar 1 run obrigatória pré-Marco 2 + 1 run por versão V1.9.X clínica. Meta: 12+ runs acumuladas até 31/12/2026.

### Gap V03 — Smoke UI por release não formalizado

**Risco:** Pode haver regressão visual não detectada (caso V1.9.500-A foi reativo, não preventivo).
**Plano:** Checklist por release V1.9.X documentado em POP-CTL-007.

### Gap V04 — verify_jwt=false em tradevision-core

**Risco:** Documentado em RSK-001 H8, TRM Gap #3.
**Plano:** Executar PLAN-FLIP-001 (janela 02h-05h BRT).

## 12. Inventário PLN-VER-001

- Métodos: 10 (VER-MET-01..10)
- Critérios: 10 (VER-CRI-01..10)
- Cadências de verificação: 7 (VER-CAD-01..07)
- Cadências de monitoramento operacional: 4 (MON-CAD-01..04)
- Responsáveis: 6 (VER-RSP-01..06)
- Release Gates: 8 (G1-G8: 3 bloqueadores + 5 condicionais)
- Cobertura SRS → VER-MET: 44/44 (100%)
- Gaps identificados: 4 (Gap V01..04)

**Total: 49 itens catalogados.**

## 13. Rastreabilidade

Cada VER-MET, VER-CRI, VER-CAD aparece em [TRM-001](./14_TRM-001_Traceability_Matrix.md) §3 (TST) e mapeia para SRS e URS correspondentes.

---

**Aprovação:**
- [ ] Médico Sócio (validação clínica): Dr. Ricardo Valença — Data: ___/___/___
- [ ] RT habilitado: ________________ Data: ___/___/___
- [ ] Tech Lead: Pedro Henrique Passos Galluf — Data: 29/05/2026 (draft)
