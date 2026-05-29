# TRM-001 — Traceability Matrix

**Versão draft:** 0.1 (29/05/2026)
**Status:** DRAFT pré-consultora SaMD
**Referência normativa:** IEC 62304:2006 §5.1.3 + ISO 13485:2016 §7.3.4

---

## 1. Objetivo

Estabelecer rastreabilidade bidirecional entre **Necessidade do usuário (URS) → Requisito (SRS) → Arquitetura (SAD) → Risco (RSK) → Controle (CTL) → Teste (TST) → Evidência (EVD)**.

Princípio cristalizado (sessão 29/05): *"O auditor não procura conhecimento distribuído. Ele procura conhecimento indexado."*

## 2. Convenção de IDs (consolidação)

| Prefixo | Significado | Documento mestre |
|---|---|---|
| `URS-MED/PAC/ALU/ADM/GLB-NN` | Necessidades do usuário | URS-001 |
| `SRS-FR-NN` / `SRS-NFR-NN` | Requisitos funcionais / não-funcionais | SRS-001 |
| `SAD-COMP/IFACE/FLOW/DEC-NN` | Componentes / Interfaces / Fluxos / Decisões | SAD-001 |
| `RSK-HNN` | Hazards de risco | RSK-001 |
| `CTL-NN` | Controles implementados | (este doc) |
| `TST-NN` | Testes / verificações | (este doc) |
| `EVD-NN` | Evidências empíricas | (este doc) |

## 3. Catálogo de CONTROLES (CTL-XX)

### CTL-01 — Guard `isAskingConsent`
**Implementação:** `tradevision-core/index.ts`.
**Verifica:** SRS-FR-01.

### CTL-02 — COS Kernel 5 portas
**Implementação:** `cos_engine.ts`.
**Verifica:** SRS-FR-02.

### CTL-03 — AEC FSM 13 fases
**Implementação:** `clinicalAssessmentFlow.ts`.
**Verifica:** SRS-FR-03.

### CTL-04 — Verbatim First (bypass GPT)
**Implementação:** Camada 3 pirâmide.
**Verifica:** SRS-FR-04.

### CTL-05 — AEC Gate V1.5
**Implementação:** Camada 4 pirâmide.
**Verifica:** SRS-FR-05.

### CTL-06 — PII sanitize Edge tradevision-core v423
**Implementação:** `sanitizeRationalityPII` + backfill 132 rows.
**Verifica:** SRS-FR-13, SRS-NFR-07.

### CTL-07 — Auth + ownership check Edge sign-pdf-icp
**Implementação:** V1.9.457 Edge v22.
**Verifica:** SRS-FR-10, SRS-NFR-06 (parcial — só sign-pdf-icp).

### CTL-08 — PBAD AD-RB v2.4 constants OID + SIGPOLICYHASH
**Implementação:** `PA_AD_RB_V24_OID` + `PA_AD_RB_V24_SIGPOLICYHASH_HEX`.
**Verifica:** SRS-FR-09.

### CTL-09 — RLS 100% nas 144 tabelas
**Implementação:** Migration + audit periódico.
**Verifica:** SRS-NFR-03.

### CTL-10 — Telemetria custo IA (V1.9.238)
**Implementação:** Metadata em `ai_chat_interactions`.
**Verifica:** SRS-FR-27, SRS-NFR-08.

### CTL-11 — pg_cron jobs com `cron.job_run_details`
**Implementação:** 3 jobs ativos.
**Verifica:** SRS-FR-12, SRS-NFR-11.

### CTL-12 — Cap tokens 60k (V1.9.61)
**Implementação:** Limite em Edge.
**Verifica:** SRS-FR-06 (proteção custo / loop).

### CTL-13 — RPC `anonymize_user_safely` SECURITY DEFINER
**Implementação:** Função SQL.
**Verifica:** SRS-FR-29.

### CTL-14 — Versionamento V1.9.X disciplinado + tags imutáveis
**Implementação:** Política operacional (CLAUDE.md).
**Verifica:** SRS-NFR-09.

### CTL-15 — Backup WAL-G + diário (Supabase Pro)
**Implementação:** Supabase Pro plan.
**Verifica:** SRS-NFR-10.

### CTL-16 — Type-check pre-commit
**Implementação:** Hook lint-staged.
**Verifica:** SRS-NFR-09 (qualidade código).

### CTL-17 — Push 4 refs obrigatório
**Implementação:** Política operacional.
**Verifica:** SRS-NFR-09 (redundância).

## 4. Catálogo de TESTES (TST-XX)

### TST-01 — Smoke ITI validar.iti.gov.br
**Método:** `openssl asn1parse` + upload no portal ITI + diff binário.
**Verifica:** CTL-08 → SRS-FR-09.
**Cadência:** A cada alteração em `sign-pdf-icp/*`.

### TST-02 — Type-check `npx tsc --noEmit`
**Método:** EXIT=0 obrigatório pré-commit.
**Verifica:** CTL-16.

### TST-03 — Smoke PAT schema empírico
**Método:** `information_schema.columns` antes de INSERT/SELECT.
**Verifica:** Princípio cristalizado `feedback_nao_chutar_uuid_quando_pat_disponivel_29_05`.

### TST-04 — `clinical_qa_runs` (framework PMF Audit V1.9.85)
**Método:** Audit estruturado 17 colunas com 4 buckets coloridos.
**Verifica:** Validação clínica de relatórios.
**Cadência atual:** 2/30d (target: 2/mês).

### TST-05 — Telemetria latency P50/P95/P99
**Método:** Percentile sobre `processing_time` em `ai_chat_interactions`.
**Verifica:** CTL-10 → SRS-NFR-01.
**Estado:** Painel AdminAIGovernance V1.9.374 já operacional.

### TST-06 — Smoke 401 sem JWT em Edge sign-pdf-icp
**Método:** Requisição sem header `Authorization` → 401 esperado.
**Verifica:** CTL-07 → SRS-FR-10.
**Smoke validado:** V1.9.457 SMOKE 1+2 PASS.

### TST-07 — Smoke empírico UI (Pedro + Ricardo + Eduardo)
**Método:** Uso real do app antes de paciente externo.
**Verifica:** Regressão funcional / visual.

### TST-08 — Smoke 5/5 Matrix Z2 + Bula (V1.9.468-A)
**Método:** 5 perguntas-armadilha (qual CBD melhor / compare / posologia / interação / sugira).
**Verifica:** CTL relacionado a Matrix.
**Smoke PASS:** 27/05/2026.

### TST-09 — `cron.job_run_details` success rate
**Método:** Query agregada `state='succeeded'` últimos 7d.
**Verifica:** CTL-11 → SRS-NFR-11.
**Estado:** 2.023/2.023 = 100%.

### TST-10 — Validação RLS via PAT empírico
**Método:** `pg_class.relrowsecurity` em todas tabelas.
**Verifica:** CTL-09 → SRS-NFR-03.
**Estado:** 144/144 confirmado 29/05.

### TST-11 — Smoke 132 rows PII sanitizadas
**Método:** Query empírica `clinical_rationalities WHERE assessment LIKE 'Paciente #%'`.
**Verifica:** CTL-06 → SRS-FR-13.
**Estado:** 132/132 confirmado V1.9.452 backfill.

## 5. Catálogo de EVIDÊNCIAS (EVD-XX)

Cada EVD é uma tag git imutável, commit, ou registro empírico verificável.

### EVD-01 — Lock V1.9.95 (AEC + Relatório + Agendamento)
**Tag:** `v1.9.95-lock-aec-relatorio-agendamento`.
**Mensagem:** "LOCK V1.9.95 — AEC + Relatório + Agendamento".

### EVD-02 — Lock V1.9.99 (Resend production)
**Tag:** `v1.9.99-resend-prod-locked`.
**Mensagem:** "LOCK V1.9.99 — Resend production-ready (28/04/2026 ~15h45 BRT)".

### EVD-03 — Lock V1.9.113 (AEC + Pipeline + Analisar Paciente)
**Tag:** `v1.9.113-locked`.
**Mensagem:** "v1.9.113-locked — Selo AEC + Pipeline + Analisar Paciente estavel".

### EVD-04 — Lock V1.9.299 (PBAD AD-RB CONFORME ITI)
**Tag:** `v1.9.299-pbad-conforme-locked`.
**Mensagem:** "🏆 V1.9.299-FINAL — PBAD AD-RB CONFORME validado oficialmente ITI ✅".
**Importância:** Crítica regulatória — não tocar sem smoke ITI.

### EVD-05 — Lock V1.9.418 (Fórum Cann Matrix)
**Tag:** `v1.9.418-forum-cann-matrix-checkpoint`.

### EVD-06 — Lock V1.9.452 (PII sanitize)
**Tag:** `v1.9.452-pii-sanitize-defensivo-final`.
**Mensagem:** "V1.9.452 PII sanitize defensivo em clinical_rationalities — LGPD reforco pre-Marco 2".

### EVD-07 — Lock V1.9.455 (exam_request PDF ICP wiring)
**Tag:** `v1.9.455-exam-pdf-wiring`.

### EVD-08 — Lock V1.9.457 (sign-pdf-icp auth + ownership)
**Tag:** `v1.9.457-sign-pdf-icp-auth-ownership`.
**Mensagem:** "Nucleo PBAD AD-RB V1.9.299 INTOCADO. Smoke 1+2 validados (401).".

### EVD-09 — Lock V1.9.468-A (Matrix Z2 + Bula)
**Tag:** `v1.9.468-A-matrix-bula-locks-final`.
**Mensagem:** "Matrix Z2 + Bula ANVISA locks micro-factuais (smoke 5/5 PASS empirico)".

### EVD-10 — Lock V1.9.474 (AEC reset invalidated_at)
**Tag:** `v1.9.474-aec-reset-invalidated-trigger`.

### EVD-11 — Lock V1.9.475 (Card Neuro embrião)
**Tag:** `v1.9.475-card-neuro-embriao`.

### EVD-12 — 42 reports ICP-Brasil signed
**Fonte:** `SELECT COUNT(*) FROM clinical_reports WHERE signed_at IS NOT NULL AND signature_hash IS NOT NULL`.
**Estado:** 42 confirmado PAT 29/05.

### EVD-13 — 132 rationalities PII sanitizadas (backfill V1.9.452)
**Fonte:** `SELECT COUNT(*) FROM clinical_rationalities` = 132 (= total = todas sanitizadas).

### EVD-14 — 144 tabelas com RLS 100%
**Fonte:** PAT empírico 29/05.

### EVD-15 — 2.023 runs cron / 100% success em 7d
**Fonte:** `cron.job_run_details`.

### EVD-16 — 649 commits/30d
**Fonte:** `git log --since="30 days ago"`.

### EVD-17 — 284 memórias cristalizadas
**Fonte:** `ls ~/.claude/projects/*/memory/*.md`.

### EVD-18 — 66 diários DIARIO_*.md
**Fonte:** `ls DIARIO_*.md`.

### EVD-19 — 6 Livros Magno
**Fonte:** `ls docs/LIVRO_MAGNO_*.md` (versões variadas).

### EVD-20 — Painel AdminAIGovernance ativo
**Fonte:** `src/pages/AdminAIGovernance.tsx` V1.9.374.

### EVD-21 — Smoke Eduardo Faveret operacional
**Fonte:** Memória `project_eduardo_faveret_no_app_sharing_validado_27_05`.

### EVD-22 — Smoke 4 órfãos AEC visíveis (V1.9.500)
**Fonte:** Solange (32d) / Thiago (24d) / Pedro (7d) / João (4d) flagrados empíricamente.

### EVD-23 — 2 clinical_qa_runs (cadência mínima ativa)
**Fonte:** `SELECT COUNT(*) FROM clinical_qa_runs` = 2.

## 6. Matriz de rastreabilidade (núcleo crítico)

### 6.1. Cadeia URS → SRS → SAD → RSK → CTL → TST → EVD

| URS | SRS | SAD | RSK | CTL | TST | EVD |
|---|---|---|---|---|---|---|
| URS-PAC-02 | SRS-FR-01 | SAD-COMP-11 SAD-DEC-01 | RSK-H03 | CTL-01 CTL-05 | TST-07 | EVD-01 |
| URS-GLB-02 | SRS-FR-02 | SAD-DEC-01 | (geral) | CTL-02 | (auditoria) | EVD-01 |
| URS-MED-02 URS-PAC-01 | SRS-FR-03 | SAD-COMP-02 SAD-COMP-11 | RSK-H05 | CTL-03 | TST-07 | EVD-03 |
| URS-MED-03 | SRS-FR-04 SRS-FR-07 | SAD-COMP-11 SAD-DEC-04 | RSK-H05 | CTL-04 | TST-07 | EVD-01 |
| URS-MED-06 | SRS-FR-05 SRS-FR-16 SRS-FR-17 | SAD-COMP-06 | RSK-H03 | CTL-05 | TST-07 | EVD-22 |
| URS-MED-05 URS-PAC-06 | SRS-FR-09 SRS-FR-10 | SAD-COMP-12 SAD-DEC-02 | RSK-H04 RSK-H10 | CTL-07 CTL-08 | TST-01 TST-06 | EVD-04 EVD-08 EVD-12 |
| URS-MED-11 | SRS-FR-12 | SAD-COMP-17 SAD-COMP-21 SAD-IFACE-05 | RSK-H09 | CTL-11 | TST-09 | EVD-02 EVD-15 |
| URS-PAC-10 | SRS-FR-13 SRS-NFR-07 | SAD-COMP-11 SAD-DEC-06 | RSK-H02 | CTL-06 | TST-11 | EVD-06 EVD-13 |
| URS-MED-08 URS-PAC-05 | SRS-FR-14 | SAD-COMP-03 | RSK-H07 | (RLS overwrite — gap Marco 3) | TST-10 | (smoke 28/05 manhã) |
| URS-MED-01 | SRS-FR-15 | SAD-COMP-03 SAD-COMP-20 | (n/a pattern válido) | (validação 3 queries) | TST-10 | (memória feedback_padrao_orfaos_*) |
| URS-MED-09 | SRS-FR-18 SRS-FR-19 SRS-FR-20 | SAD-COMP-03 SAD-COMP-04 | RSK-H05 | CTL-03 | TST-07 | EVD-09 |
| URS-MED-10 | SRS-FR-21 | SAD-COMP-04 SAD-DEC-10 | RSK-H05 | (Matrix Z2 lock) | TST-08 | EVD-09 |
| URS-PAC-04 URS-PAC-09 | SRS-FR-22 | SAD-COMP-07 SAD-COMP-08 | (n/a) | (RichClinicalReportView soberano) | TST-07 | (hotfix V1.9.500-A documentado) |
| URS-ADM-02 URS-MED-12 URS-GLB-05 | SRS-FR-27 SRS-FR-28 | SAD-COMP-09 SAD-COMP-11 | RSK-H05 | CTL-10 | TST-05 | EVD-20 |
| URS-PAC-08 URS-ADM-07 | SRS-FR-29 | SAD-COMP-20 | (LGPD) | CTL-13 | (manual) | (RPC SQL definida) |
| URS-GLB-02 | SRS-NFR-03 SRS-NFR-06 | SAD-COMP-20 SAD-COMP-22 | RSK-H07 RSK-H08 | CTL-09 | TST-10 | EVD-14 |
| URS-GLB-03 | SRS-NFR-09 SRS-NFR-13 | (transversal) | (n/a) | CTL-14 CTL-16 CTL-17 | TST-02 | EVD-16 EVD-17 EVD-18 EVD-19 |
| URS-GLB-04 | SRS-NFR-01 | SAD-COMP-11 SAD-COMP-24 | RSK-H09 | CTL-12 | TST-05 | EVD-20 |

### 6.2. Cobertura empírica (29/05/2026)

| Métrica | Valor | Observação |
|---|---:|---|
| URS catalogados | 41 | URS-001 §9 |
| SRS catalogados | 44 | SRS-001 §5 (31 FR + 13 NFR) |
| SAD itens | 47 | SAD-001 §9 (26 COMP + 5 IFACE + 3 FLOW + 13 DEC) |
| RSK hazards | 10 | RSK-001 §2 |
| CTL controles | 17 | (este doc §3) |
| TST testes | 11 | (este doc §4) |
| EVD evidências | 23 | (este doc §5) |
| **Total de itens rastreáveis** | **193** | |
| URS com mapeamento completo URS→EVD | ~18 | ~44% — gap em 23 URS |
| Evidências com lock git imutável | 11 | Tags v1.9.* |

### 6.3. Gaps de rastreabilidade conhecidos

1. **URS-ALU-05 (feedback estruturado pós-simulação)** — sem `simulation_runs` formal. Gap parqueado pós-Marco 3.
2. **URS-MED-08 / URS-PAC-05 (Share cross-account)** — pattern overwrite documentado mas sem RLS pra 3º médico profissional puro. Gap Marco 3.
3. **SRS-NFR-06 (verify_jwt em Edges)** — `tradevision-core` ainda `verify_jwt=false`. Gap Sprint A.
4. **SRS-FR-15 (Cadastro paciente externo offline)** — pattern válido CFM mas sem UI de "remover paciente cadastrado por engano". Gap operacional.

## 7. Inventário TRM

- Controles: 17 (CTL-01..17)
- Testes: 11 (TST-01..11)
- Evidências: 23 (EVD-01..23)
- Linhas da matriz: 18 cadeias URS→EVD completas
- Itens totais rastreáveis: **193**

## 8. Como usar este documento

### 8.1. Pergunta típica de auditor

> *"Mostre como vocês garantem que a assinatura ICP-Brasil é confiável."*

**Cadeia de resposta via TRM:**
1. URS-MED-05 (necessidade do médico)
2. SRS-FR-09 + SRS-FR-10 (requisitos)
3. SAD-COMP-12 + SAD-DEC-02 (componente e decisão arquitetural)
4. RSK-H04 (hazard identificado)
5. CTL-07 + CTL-08 (controles)
6. TST-01 + TST-06 (testes empíricos)
7. EVD-04 + EVD-08 + EVD-12 (evidências: tag git V1.9.299 + V1.9.457 + 42 PDFs signed)

### 8.2. Pergunta típica regulatória

> *"Onde está demonstrada a conformidade com LGPD Art. 11?"*

**Cadeia de resposta:**
- URS-PAC-10 → SRS-FR-13 + SRS-NFR-07 → SAD-COMP-11 + SAD-DEC-06 → RSK-H02 → CTL-06 → TST-11 → EVD-06 + EVD-13.

## 9. Manutenção da matriz

A TRM deve ser atualizada a cada:

- **Lock V1.9.X** selado (acrescenta EVD)
- **Novo URS / SRS / SAD** documentado
- **Novo RSK** identificado em RSK-001
- **Novo TST** validado empíricamente

Responsabilidade primária: Tech Lead (Pedro). Revisão: RT habilitado pós-CNPJ.

---

**Aprovação:**
- [ ] Médico Sócio (validação clínica): Dr. Ricardo Valença — Data: ___/___/___
- [ ] RT habilitado: ________________ Data: ___/___/___
- [ ] Tech Lead: Pedro Henrique Passos Galluf — Data: 29/05/2026 (draft)

---

## Frase âncora

> *"193 itens rastreáveis (41 URS + 44 SRS + 47 SAD + 10 RSK + 17 CTL + 11 TST + 23 EVD) consolidam num único mapa o conhecimento que estava distribuído entre 11 locks + 66 diários + 284 memórias + 649 commits. TRM-001 não cria informação — indexa o que já existe pra auditor navegar em segundos."*
