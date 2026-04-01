# INVENTÁRIO FASE 1 — MedCannLab Clinical OS
**Data:** 02 de abril de 2026  
**Método:** Leitura completa do repositório + queries ao Supabase remoto  
**Objetivo:** Mapear estado real sem criar artefatos novos  

---

## 1. STACK FRONT (Vite + React 18 + TS)

### 1.1 Rotas principais (App.tsx — 334 linhas)
| Eixo | Rota canônica | Componente |
|------|---------------|------------|
| Clínica/Profissional | `/app/clinica/profissional/dashboard` | `ProfessionalDashboardRouter` |
| Clínica/Paciente | `/app/clinica/paciente/dashboard` | `PatientDashboard` |
| Clínica/Paciente | `/app/clinica/paciente/avaliacao-clinica` | `ClinicalAssessment` |
| Clínica/Paciente | `/app/clinica/paciente/relatorios` | `Reports` |
| Clínica/Paciente | `/app/clinica/paciente/chat-noa` | `PatientNOAChat` |
| Ensino/Prof | `/app/ensino/profissional/dashboard` | `EnsinoDashboard` |
| Ensino/Aluno | `/app/ensino/aluno/dashboard` | `AlunoDashboard` |
| Pesquisa/Prof | `/app/pesquisa/profissional/dashboard` | `PesquisaDashboard` |
| Admin | `/app/admin` | `AdminDashboardWrapper` |

**73 páginas** no total. Redirecionamentos legados preservados (Navigate replace).

### 1.2 Contextos ativos (10)
`AuthContext`, `NoaContext`, `NoaPlatformContext`, `RealtimeContext`, `UserViewContext`, `ClinicalGovernanceContext`, `VideoCallContext`, `ToastContext`, `ConfirmContext`, `DashboardTriggersContext`

---

## 2. FLUXO AEC — Passo a Passo com Ficheiros e Tabelas

```
PASSO → FICHEIRO → TABELA → ECRÃ
──────────────────────────────────────────────

1. Paciente abre chat Nôa
   → PatientNOAChat.tsx → NoaConversationalInterface.tsx
   → useMedCannLabConversation.ts → NoaResidentAI.ts

2. Detecção de intent ASSESSMENT_START
   → noaResidentAI.ts::detectIntent()
   → clinicalAssessmentFlow.ts::startAssessment(userId)
   → Estado persistido em **localStorage** (key: medcannlab_aec_states_v1) ⚠️

3. Fases AEC (10 etapas + estados controlo)
   → clinicalAssessmentFlow.ts::processResponse()
   Fases: INITIAL_GREETING → IDENTIFICATION → COMPLAINT_LIST → MAIN_COMPLAINT
        → COMPLAINT_DETAILS → MEDICAL_HISTORY → FAMILY_HISTORY_MOTHER
        → FAMILY_HISTORY_FATHER → LIFESTYLE_HABITS → OBJECTIVE_QUESTIONS
        → CONSENSUS_REVIEW → CONSENSUS_REPORT → CONSENSUS_CONFIRMATION
        → FINAL_RECOMMENDATION → COMPLETED

4. Fechamento (duas vias possíveis):
   a) Via noaResidentAI.ts (front → Edge): Quando fase = COMPLETED,
      chama clinicalAssessmentFlow.generateReport() que invoca
      tradevision-core Edge Function com action='finalize_assessment'
   b) Via tradevision-core (Edge): Detecta [ASSESSMENT_COMPLETED],
      grava em clinical_reports via service role

5. Persistência do relatório
   → Tabela: **clinical_reports** (BD)
   → Campos: id, patient_id, patient_name, report_type, protocol,
     content (JSONB), generated_by, generated_at, status, professional_id

6. Leitura pelo paciente
   → PatientDashboard.tsx → usePatientDashboard.ts
     → clinicalReportService.getPatientReports(patientId)
     → SELECT * FROM clinical_reports WHERE patient_id = ?
   → ClinicalReports.tsx (componente reutilizado)
   → Reports.tsx (rota /app/clinica/paciente/relatorios)
```

---

## 3. BACK NO REPO

### 3.1 Edge Functions (7)
| Função | Ficheiro | Linhas | Papel |
|--------|----------|--------|-------|
| `tradevision-core` | index.ts + cos_kernel.ts | 3069+ | Motor de governança, GPT, AEC server-side |
| `digital-signature` | index.ts | — | Assinatura digital CFM |
| `extract-document-text` | index.ts | — | Extração OCR/PDF |
| `send-email` | index.ts | — | Envio via Resend |
| `video-call-reminders` | index.ts | — | Lembretes de vídeo |
| `video-call-request-notification` | index.ts | — | Notificação de solicitação |
| `wisecare-session` | index.ts | — | Sessão WiseCare (vídeo) |

### 3.2 Migrações versionadas: **61 ficheiros** em supabase/migrations/

### 3.3 Tabelas no Supabase remoto: **~140+** (tabelas + views)

---

## 4. DUPLICAÇÕES E NOMES ALTERNATIVOS

| Conceito | Nome 1 (existe) | Nome 2 (existe) | Comentário |
|----------|-----------------|-----------------|------------|
| Avaliação AEC | `imre_assessments` (tabela) | `clinical_assessments` (tabela) | `clinicalAssessmentService.ts` tenta `imre_assessments` com fallback para `clinical_assessments` |
| Avaliação (view) | `patient_assessments` (VIEW, sem RLS) | — | Expõe dados de ambas as tabelas? |
| Relatório clínico | `clinical_reports` (tabela) | `v_clinical_reports` (VIEW, sem RLS) | View não tem proteção |
| Serviço de relatório | `clinicalReportService.ts` (singleton, grava em `clinical_reports`) | `clinicalAssessmentService.ts` (grava em `imre_assessments`/`clinical_assessments`) | **Dois serviços** com sobreposição |
| Usuários | `users` (tabela pública) | `profiles` (tabela) + `user_profiles` (tabela) + `usuarios` (tabela legada) + `users_compatible` (VIEW) | **4 nomes** para conceito de utilizador |
| Chat | `chat_messages` (tabela) + `chat_messages_legacy` (tabela) + `global_chat_messages` (tabela) + `messages` (tabela) | — | **4 tabelas** de mensagens |
| Prescrições | `prescriptions` (tabela) + `cfm_prescriptions` (tabela) + `patient_prescriptions` (tabela) | — | 3 tabelas |

---

## 5. GAPS NUMERADOS (sem criar artefatos)

### Segurança (S)

| ID | Gap | Severidade | Referência Plano Mestre |
|----|-----|------------|-------------------------|
| **S1** | **8 views sem RLS** expostas no Supabase: `users_compatible`, `patient_assessments`, `v_next_appointments`, `active_subscriptions`, `v_clinical_reports`, `v_prescriptions_queue`, `v_auth_activity`, `v_user_points_balance` — todas com `rls_on = false` | 🔴 CRÍTICO | §3 S1 |
| **S2** | Storage buckets: ownership policies por auditar (não verificável via query, requer dashboard) | 🟡 ALTO | §3 S2 |
| **S3** | **Estado AEC em localStorage** — `clinicalAssessmentFlow.ts` linha 76-104 persiste dados clínicos (queixas, histórico médico, medicações, alergias) em texto claro no browser | 🔴 CRÍTICO | §3 S3 |
| **S4** | **JWT não validado no tradevision-core** — linha 751: `createClient(url, serviceKey)` sem verificar `Authorization` header. O `user.id` vem do body (`patientData.user.id`) e pode ser falsificado | 🔴 CRÍTICO | §3 S4 |
| **S5** | **OpenAI key**: Não há `VITE_OPENAI_API_KEY` no frontend ✅ — chamadas vão via Edge Function + `Deno.env.get('OPENAI_API_KEY')`. Porém, `api/tradevision.ts` (ficheiro legado?) referencia `process.env.OPENAI_API_KEY` | 🟡 VERIFICAR | §3 S5 |
| **S6** | **ConsentGuard existe** (`src/components/ConsentGuard.tsx`) — verifica `consent_accepted_at` em `users`. Porém **não está wrapping o fluxo AEC especificamente** (só wraps o Layout geral). Falta consentimento **clínico específico** antes do AEC | 🟡 PARCIAL | §3 S6 |
| **S7** | **Workflow de revisão médica**: `clinicalReportService.ts` grava status `completed` diretamente; campo `reviewed` existe na interface mas **não há fluxo** para transição `draft → reviewed` com assinatura profissional | 🔴 CRÍTICO | §3 S7 |
| **S8** | **Ciclo AEC → paciente**: O `PatientDashboard.tsx` importa `ClinicalReports` e `usePatientDashboard` que chama `clinicalReportService.getPatientReports()`. O SELECT funciona **se** RLS na tabela `clinical_reports` permitir. A view `v_clinical_reports` não tem RLS | 🟡 VERIFICAR | §3 S8 |
| **S9** | **`filterAppCommandsByRole` unknown → retorna tudo** — `tradevision-core/index.ts` linha 509-510: `return commands` (lista completa). Deveria retornar `[]` | 🟡 ALTO | §3 S9 |

### Clínico / Produto (C)

| ID | Gap | Severidade |
|----|-----|------------|
| **C1** | **Sem estado formal do assessment na BD** — Fases AEC (collecting → ready_to_close → closed → report_generated → reviewed) só existem no localStorage, não há coluna `status` controlada server-side | 🔴 CRÍTICO |
| **C2** | **Idempotência**: `clinicalReportService.generateAIReport()` gera `id = report_${Date.now()}_random` — sem constraint única por `assessment_id` — pode duplicar relatórios | 🟡 ALTO |
| **C3** | **UX "identifique-se"**: O prompt AEC (linha 155 de noaResidentAI.ts) pede "apresente-se" mesmo quando o usuário já está autenticado com nome no perfil | 🟡 MÉDIO |
| **C4** | **Dois serviços de relatório**: `clinicalReportService.ts` vs `clinicalAssessmentService.ts` — confusão sobre qual é canônico; ambos gravam em tabelas diferentes | 🟡 ALTO |
| **C5** | **`api/tradevision.ts`** — ficheiro legado na raiz `api/` que importa OpenAI e Supabase via `process.env`. Não é Edge Function, não é usado no Vite build. Potencial confusão | 🟢 BAIXO |

---

## 6. DIAGRAMA AEC RESUMIDO

```
┌─────────────┐     ┌──────────────────┐     ┌───────────────────┐
│ PatientNOA   │────▶│ NoaResidentAI    │────▶│ ClinicalAssessment│
│ Chat.tsx     │     │ .ts (1897 linhas)│     │ Flow.ts (807 ln)  │
└─────────────┘     └───────┬──────────┘     └──────┬────────────┘
                            │                       │
                    detectIntent()          processResponse()
                            │               persist() → localStorage ⚠️
                            │                       │
                    ┌───────▼──────────┐    ┌───────▼────────────┐
                    │ tradevision-core │◀───│ generateReport()   │
                    │ (Edge Function)  │    │ → invoke('finalize │
                    │ 3069 linhas      │    │   _assessment')    │
                    └───────┬──────────┘    └────────────────────┘
                            │
                    INSERT INTO clinical_reports
                    (via service_role)
                            │
                    ┌───────▼──────────┐
                    │ clinical_reports │
                    │ (tabela BD)      │
                    └───────┬──────────┘
                            │
                    ┌───────▼──────────┐
                    │ PatientDashboard │ ← clinicalReportService.getPatientReports()
                    │ / Reports.tsx    │
                    └──────────────────┘
```

---

## 7. TABELA "JÁ EXISTE / NOME ALTERNATIVO / GAP"

| Funcionalidade | Já existe? | Ficheiro/Tabela | Gap? |
|----------------|-----------|-----------------|------|
| Fluxo AEC 10 etapas | ✅ | `clinicalAssessmentFlow.ts` | S3 (localStorage) |
| Persistência relatório | ✅ | `clinical_reports` (tabela) | C1 (sem estado server-side) |
| Leitura paciente | ✅ | `PatientDashboard` + `ClinicalReports` | S8 (RLS view) |
| Consentimento LGPD | ✅ parcial | `ConsentGuard.tsx` | S6 (falta AEC-específico) |
| Revisão médica | ❌ | Interface existe, workflow não | S7 |
| JWT validation Edge | ❌ | `tradevision-core` usa service key | S4 |
| Estado formal BD | ❌ | Só localStorage | C1 |
| Idempotência relatório | ❌ | ID timestamp-based | C2 |
| `filterAppCommands` unknown | ⚠️ bug | `tradevision-core` L509 | S9 |
| Triggers/tokens selados | ✅ | 16 triggers + governance | — |
| Agendamento dinâmico | ✅ | `get_available_slots_v3` + Core | — |
| Chat profissional 1:1 | ✅ | `PatientDoctorChat` + `chat_rooms` | — |
| Gamificação | ✅ parcial | `gamification_points`, `user_achievements` | Triggers reais desconectados |
| Vídeo WiseCare | ✅ | `wisecare-session` Edge + `VideoCall.tsx` | TURN ausente |

---

## 8. ZERO NOVOS ARTEFATOS CRIADOS
Este documento é **puramente descritivo**. Nenhuma tabela, função, rota ou componente foi criado ou modificado.

---

## 9. PRÓXIMO PASSO (FASE 2 — após aprovação)
Propor **diffs mínimos** na seguinte ordem (alinhada ao §9 do Plano Mestre):

1. **S9** — `filterAppCommandsByRole` unknown → `return []` (1 linha)
2. **S4** — Validação JWT no `tradevision-core` (extrair `sub` do token)
3. **S3/C1** — Migrar estado AEC de localStorage para tabela Supabase
4. **S1** — Views expostas → `SECURITY INVOKER` ou policies
5. **S7** — Workflow mínimo `draft → reviewed` em `clinical_reports`
6. **C2** — Constraint única + idempotência
7. **C3** — UX: usar nome do perfil no AEC em vez de pedir identificação

---

*Fim do Inventário Fase 1. Aguardando aprovação para Fase 2.*
