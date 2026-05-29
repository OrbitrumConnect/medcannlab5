# SAD-001 — Software Architecture Document

**Versão draft:** 0.1 (29/05/2026)
**Status:** DRAFT pré-consultora SaMD
**Referência normativa:** IEC 62304:2006 §5.3 (Software Architectural Design)

---

## 1. Objetivo

Documentar a arquitetura de software do MedCannLab 3.0, mapeando componentes, interfaces, fluxos de dados e decisões arquiteturais críticas com IDs únicos rastreáveis via TRM-001.

## 2. Convenção de IDs

```
SAD-COMP-NN  (Component)
SAD-IFACE-NN (Interface)
SAD-FLOW-NN  (Data Flow)
SAD-DEC-NN   (Architecture Decision)
```

## 3. Visão geral da arquitetura

### 3.1. Estilo arquitetural adotado

**Híbrido**: Client-side rich SPA + Serverless functions + Managed Postgres + Pipeline cognitivo determinístico em camadas.

### 3.2. Diagrama lógico (alto nível)

```
┌─────────────────────────────────────────────────────────────────┐
│                       FRONTEND (Vercel)                          │
│  React 18 + TypeScript + Vite + Tailwind + shadcn/ui            │
│  363 arquivos .tsx/.ts em src/                                  │
└─────────────────────┬───────────────────────────────────────────┘
                      │ HTTPS + supabase-js
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│              SUPABASE (projeto itdjkfubfzmvmuxxjoae)             │
│                                                                  │
│  ┌──────────┐  ┌─────────────────┐  ┌─────────────────────┐    │
│  │ Auth     │  │ Postgres        │  │ Edge Functions Deno │    │
│  │ JWT      │  │ 144 tabelas     │  │ 15 funções ativas   │    │
│  │ RLS      │  │ RLS 100%        │  │                     │    │
│  └──────────┘  └────────┬────────┘  └──────────┬──────────┘    │
│                         │                      │                │
│  ┌──────────┐  ┌────────▼────────┐  ┌─────────▼──────────┐    │
│  │ Storage  │  │ pg_cron         │  │ Telemetria         │    │
│  │ buckets  │  │ 3 jobs ativos   │  │ ai_chat_inter*     │    │
│  └──────────┘  └─────────────────┘  └────────────────────┘    │
└──────┬──────────────────┬──────────────────────┬───────────────┘
       │                  │                      │
       ▼                  ▼                      ▼
   ┌────────┐         ┌─────────┐          ┌─────────┐
   │ OpenAI │         │ Resend  │          │  ITI    │
   │ GPT-4o │         │ Email   │          │ ICP-BR  │
   └────────┘         └─────────┘          └─────────┘
```

## 4. Componentes principais

### Frontend

#### SAD-COMP-01 — Single Page Application (Vercel)
**Stack:** React 18 + TypeScript + Vite + Tailwind + shadcn/ui.
**Volume:** 363 arquivos `.tsx`/`.ts` em `src/`.
**Deploy:** Auto on push para `main`.
**Implementa:** SRS-FR-01..31, SRS-NFR-12, SRS-NFR-13.

#### SAD-COMP-02 — NoaConversationalInterface
**Caminho:** `src/components/NoaConversationalInterface.tsx`.
**Função:** Chat orquestrador único da IA Residente Nôa Esperança.
**Consumido por:** Dashboards (Aluno / Profissional / Admin) via `useNoaPlatform`.
**Implementa:** SRS-FR-03 (AEC FSM), SRS-FR-06 (GPT-4o).

#### SAD-COMP-03 — MedicalRecord
**Caminho:** `src/components/MedicalRecord.tsx`.
**Função:** Prontuário completo do paciente com 7 tabs (Visão Geral / Analytics / Evolução / Prescrição / Exames / Agenda / Arquivos / Recebimentos / Gráficos).
**Implementa:** SRS-FR-18, SRS-FR-22.

#### SAD-COMP-04 — ResearchWorkstation + NoaMatrixView
**Função:** Pesquisa científica + Matrix de consciência longitudinal.
**Implementa:** SRS-FR-19, SRS-FR-20.

#### SAD-COMP-05 — IntegrativePrescriptions
**Caminho:** `src/components/IntegrativePrescriptions.tsx`.
**Função:** Gestão de prescrição CFM com 4 tipos de receituário + protocolos pré-definidos.
**Implementa:** SRS-FR-23.

#### SAD-COMP-06 — InterruptedAECsCard
**Caminho:** `src/components/InterruptedAECsCard.tsx`.
**Função:** UI médico decide destino de AECs órfãs.
**Implementa:** SRS-FR-16, SRS-FR-17.

#### SAD-COMP-07 — EvolutionDetailModal
**Caminho:** `src/components/EvolutionDetailModal.tsx`.
**Função:** Modal não-disruptivo de detalhe (post V1.9.500-A hotfix).
**Implementa:** SRS-FR-22.

#### SAD-COMP-08 — RichClinicalReportView (SOBERANO V1.9.86+)
**Função:** Renderização imutável de relatório AEC com estética bloqueada.
**Reusado por:** `EvolutionDetailModal`, `ClinicalReports`, PDF gen.
**Implementa:** SRS-FR-08 (output Pipeline).

#### SAD-COMP-09 — AdminAIGovernance (Observabilidade IA)
**Caminho:** `src/pages/AdminAIGovernance.tsx`.
**Função:** Painel agregado custo / latency / users por feature.
**Implementa:** SRS-FR-28.

#### SAD-COMP-10 — EnsinoDashboard (Sprint E)
**Função:** Notícias / Avaliações / Mentoria com hooks reais.
**Implementa:** SRS-FR-24, SRS-FR-25, SRS-FR-26.

### Backend — Edge Functions

#### SAD-COMP-11 — Edge tradevision-core (v423)
**Tipo:** Edge Function Deno (slug `tradevision-core`).
**Função:** Core IA Nôa principal — implementa pirâmide cognitiva 8 camadas.
**Volume:** ~6.700 linhas.
**verify_jwt:** ⚠️ false (gap conhecido — RSK-001 H8).
**Implementa:** SRS-FR-01..08, SRS-FR-13, SRS-FR-27.

#### SAD-COMP-12 — Edge sign-pdf-icp (v22)
**Função:** Assinatura ICP-Brasil PBAD AD-RB v2.4 CONFORME ITI.
**Auth check:** ✅ V1.9.457 (JWT + ownership).
**Implementa:** SRS-FR-09, SRS-FR-10.
**Lock:** V1.9.299.

#### SAD-COMP-13 — Edge digital-signature (v65)
**Função:** Assinatura CFM 3 levels.
**Implementa:** SRS-FR-09.

#### SAD-COMP-14 — Edge cert-encrypt-password (v3)
**Função:** Cripto password ICP do médico.
**Implementa:** SRS-FR-11.

#### SAD-COMP-15 — Edge wisecare-session (v81)
**Função:** Provedor vídeo V4H homolog.
**⚠️ Status:** Homolog — migrar pra produção (Marco 1+).

#### SAD-COMP-16 — Edge send-email (v62)
**Função:** Envio email via Resend.
**verify_jwt:** ✅ true.

#### SAD-COMP-17 — Edge video-call-reminders (v31)
**Função:** Sweep cron 5min + lembretes 24h e 1h via Resend.
**Implementa:** SRS-FR-12.

#### SAD-COMP-18 — Edge extract-document-text (v59)
**Função:** OCR via pdfjs-serverless.

#### SAD-COMP-19 — Edges restantes (video-call-request-notification, generate-nft-from-report, renal-signal-extractor, google-auth, sync-gcal, get_chat_history)
**Função:** Funcionalidades adjacentes ou dormindo.

### Backend — Database

#### SAD-COMP-20 — Postgres Supabase (144 tabelas)
**Estado:** RLS habilitado em 100% (144/144).
**Implementa:** SRS-NFR-03.

##### Tabelas core do domínio clínico
- `public.users` (canônica de perfil — 47 users)
- `public.clinical_reports` (42 ICP-Brasil signed)
- `public.clinical_assessments` (FOLLOW_UP médico)
- `public.clinical_rationalities` (132 rows, 100% sanitizadas V1.9.452)
- `public.aec_assessment_state` (FSM AEC state machine)
- `public.cfm_prescriptions` (oficiais CFM)
- `public.appointments` (93 total)
- `public.patient_medical_records` (chat IA + outros registros)

##### Tabelas core de telemetria
- `public.ai_chat_interactions` (instrumentação V1.9.238 — 1.756 em 30d)
- `public.cognitive_events` (audit trail)
- `public.clinical_qa_runs` (framework PMF Audit — 17 cols, 2 runs)

##### Tabelas core de Ensino (Sprint E V1.9.495-497)
- `public.news_items`
- `public.evaluation_instruments` + `evaluation_submissions`
- `public.mentors` + `mentorship_requests`

#### SAD-COMP-21 — pg_cron (3 jobs ativos)
**Jobs:**
- `video-call-reminders-5min` (a cada 5min)
- `monthly-closing-medcannlab` (dia 1 às 3h)
- `expire-renal-suggestions` (todo dia às 2h)
**Telemetria 7d:** 2.023 runs / 100% success.
**Implementa:** SRS-NFR-11.

#### SAD-COMP-22 — Auth (Supabase Auth)
**Mecanismo:** Email + magic link (Google deployed mas não usado).
**JWT:** RS256 com rotação automática.
**Implementa:** SRS-NFR-04, SRS-NFR-06.

#### SAD-COMP-23 — Storage (buckets)
**Buckets críticos:**
- `chat-images` (privado pós V1.9.98)
- `documents` (institucional)
- `patient_documents` (RLS por paciente)
- `pdfs-icp` (assinaturas ICP-Brasil)

### Integrações externas

#### SAD-COMP-24 — OpenAI (GPT-4o-2024-08-06 + gpt-4o-mini)
**Função:** Camada 5 da pirâmide cognitiva.
**Custo médio:** $0.019 USD/turn Matrix.
**Implementa:** SRS-FR-06.

#### SAD-COMP-25 — Resend
**Função:** Email transacional.
**Domínio:** `noreply@medcannlab.com.br` (verified 28/04).

#### SAD-COMP-26 — ITI (ICP-Brasil)
**Função:** Cadeia de certificados pra validação PBAD AD-RB.
**Implementa:** SRS-FR-09.
**Lock:** V1.9.299.

## 5. Interfaces principais

### SAD-IFACE-01 — Frontend ↔ Supabase (supabase-js)
**Protocolo:** HTTPS REST + WebSocket Realtime.
**Auth:** JWT no header `Authorization`.
**RLS:** Filtragem automática no banco baseada em `auth.uid()`.

### SAD-IFACE-02 — Edge Functions ↔ Postgres
**Protocolo:** PostgREST com SERVICE_ROLE_KEY interno.
**Bypass RLS:** Sim, com auditoria via `cognitive_events`.

### SAD-IFACE-03 — Edge tradevision-core ↔ OpenAI
**Protocolo:** HTTPS REST (`https://api.openai.com/v1/chat/completions`).
**Modelo:** `gpt-4o-2024-08-06` (chat) + `gpt-4o-mini` (Escriba V1.9.84).
**Token mgmt:** Cap 60k tokens (V1.9.61).

### SAD-IFACE-04 — Edge sign-pdf-icp ↔ ITI
**Protocolo:** OCSP validation cadeia ICP.
**Output:** PDF AD-RB válido em `validar.iti.gov.br`.

### SAD-IFACE-05 — Cron ↔ Edge video-call-reminders
**Protocolo:** `pg_cron` chama `net.http_post`.
**Schedule:** `*/5 * * * *`.

## 6. Fluxos de dados críticos

### SAD-FLOW-01 — AEC completa (paciente → relatório assinado)

```
Paciente abre app
    │
    ▼
Edge tradevision-core
    │  pirâmide 8 camadas
    ▼  (camadas 0-4 → bypass GPT se aplicável)
GPT-4o (camada 5) ← APENAS se nada acima resolveu
    │
    ▼
Pós-processamento (camada 6)
    │
    ▼
Pipeline Orchestrator (camada 7):
    REPORT → SCORES → SIGNATURE → AXES → RATIONALITY → DONE
    │
    ▼
INSERT clinical_reports (status='completed', signed_at=NULL)
INSERT clinical_rationalities (assessment SANITIZED V1.9.452)
    │
    ▼
Médico revisa (URS-MED-03)
    │
    ▼
Médico chama Edge sign-pdf-icp
    │  auth + ownership check (V1.9.457)
    ▼
PDF AD-RB v2.4 gerado
UPDATE clinical_reports SET signed_at=NOW(), signature_hash=...
    │
    ▼
Paciente recebe acesso (URS-PAC-04, URS-PAC-06)
```

### SAD-FLOW-02 — Cron lembrete de consulta

```
pg_cron */5 * * * *
    │
    ▼
SELECT appointments WHERE status='scheduled'
   AND now() BETWEEN appointment_date - 24h AND appointment_date - 1h
    │
    ▼
Edge video-call-reminders sweep
    │
    ▼
POST send-email via Resend
    │
    ▼
UPDATE appointments SET reminder_sent_at=NOW()
```

### SAD-FLOW-03 — Telemetria custo IA

```
Edge tradevision-core processa turn
    │
    ▼
Calcula cost_usd_estimate:
   (prompt_tokens × $5/1M) + (completion_tokens × $15/1M)
    │
    ▼
INSERT ai_chat_interactions (
   user_id, patient_id, user_message, ai_response,
   metadata: { simbologia, model, prompt_tokens, completion_tokens, cost_usd_estimate, ... }
)
    │
    ▼
AdminAIGovernance agrega por simbologia + 14d window
```

## 7. Decisões arquiteturais críticas

### SAD-DEC-01 — Pirâmide cognitiva 8 camadas (defense in depth)
**Decisão:** GPT é o último a falar e o primeiro a ser checado.
**Justificativa:** Riscos H1 (Babylon) + H5 (alucinação) mitigados em múltiplas camadas.
**Selada por:** Magno (versões 04-06/02/2026).

### SAD-DEC-02 — Edge `sign-pdf-icp` desacoplada
**Decisão:** Assinatura ICP-Brasil isolada em Edge dedicada com lock V1.9.299.
**Justificativa:** Risco regulatório alto justifica isolamento + auditoria smoke ITI obrigatória.

### SAD-DEC-03 — Source of truth para racionalidades
**Decisão:** `clinical_reports.content.rationalities` (jsonb) é source da UI; `clinical_rationalities` (tabela) é espelho analítico.
**Trade-off:** Divergência controlada documentada em `feedback_dual_write_contract_jsonb_vs_tabela_18_05`.

### SAD-DEC-04 — Verbatim First (V1.9.86) reduz custo + risco
**Decisão:** ~46% das fases AEC bypass GPT com respostas pré-codificadas.
**Justificativa:** Reduz alucinação + custo + latência simultaneamente.

### SAD-DEC-05 — `aec_assessment_state.is_complete` é coluna gerada
**Decisão:** Computado automaticamente (não-INSERTável).
**Justificativa:** Impede inconsistência manual.

### SAD-DEC-06 — Pseudonimização em runtime + backfill histórico
**Decisão:** V1.9.452 sanitiza no INSERT + backfill 132 rows.
**Justificativa:** Não confiar em prompt-level — defense in depth LGPD.

### SAD-DEC-07 — Frontend lê só do jsonb (snapshot), nunca da tabela analítica
**Decisão:** UI paciente derivada de `clinical_reports.content.*` sempre.
**Justificativa:** Imutabilidade do que paciente viu naquele momento.

### SAD-DEC-08 — Cron jobs preferidos a webhooks para tarefas periódicas
**Decisão:** `pg_cron` em vez de serviço externo de scheduling.
**Justificativa:** Reduzir dependência + telemetria nativa via `cron.job_run_details`.

### SAD-DEC-09 — Push 4 refs (2 remotes × main + master)
**Decisão:** Política operacional obrigatória.
**Justificativa:** Redundância de remoto sem custo.

### SAD-DEC-10 — Matrix Z2 trata bula como material marcado, não corpus sintetizável
**Decisão:** Cita literal, NUNCA sintetiza cross-bulas.
**Justificativa:** Lock V1.9.468-A — anti-deriva farmacológica.

## 8. Restrições arquiteturais

### SAD-DEC-11 — Não fazer DELETE em dados clínicos
**Decisão:** Soft-delete ou invalidate-with-reason.
**Justificativa:** Audit LGPD + retenção 5 anos.

### SAD-DEC-12 — Não mexer no Lock V1.9.299 sem smoke ITI
**Decisão:** Qualquer alteração em `sign-pdf-icp/*` exige openssl asn1parse + validar.iti.gov.br + diff binário.

### SAD-DEC-13 — `tradevision-core` verify_jwt em produção (gap conhecido)
**Decisão pendente:** Flippar pra `verify_jwt=true` após validação de callers.
**Status:** RSK-001 H8 — Sprint A.

## 9. Inventário SAD

- Componentes: 26 (SAD-COMP-01..26)
- Interfaces: 5 (SAD-IFACE-01..05)
- Fluxos: 3 (SAD-FLOW-01..03)
- Decisões arquiteturais: 13 (SAD-DEC-01..13)

**Total: 47 itens SAD catalogados.**

## 10. Rastreabilidade

Cada SAD aparece em [TRM-001](./14_TRM-001_Traceability_Matrix.md) mapeado para URS, SRS, RSK, TST, EVD.

---

**Aprovação:**
- [ ] Médico Sócio (validação clínica): Dr. Ricardo Valença — Data: ___/___/___
- [ ] RT habilitado: ________________ Data: ___/___/___
- [ ] Tech Lead: Pedro Henrique Passos Galluf — Data: 29/05/2026 (draft)
