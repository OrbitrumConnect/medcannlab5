# SRS-001 — Software Requirements Specification

**Versão draft:** 0.1 (29/05/2026)
**Status:** DRAFT pré-consultora SaMD
**Referência normativa:** IEC 62304:2006 §5.2 + ISO 13485:2016 §7.3.3

---

## 1. Objetivo

Catalogar requisitos funcionais (FR) e não-funcionais (NFR) do MedCannLab 3.0 com IDs únicos para rastreabilidade bidirecional via TRM-001. Cada requisito deve derivar de pelo menos 1 URS de [URS-001](./11_URS-001_User_Requirements_Specification.md).

## 2. Convenção de IDs

```
SRS-FR-NN    (Functional Requirement)
SRS-NFR-NN   (Non-Functional Requirement)
```

## 3. Requisitos Funcionais (SRS-FR-XX)

### Pirâmide cognitiva 8 camadas

#### SRS-FR-01 — Regra Hard §1 (constitucional)
**Descrição:** Sistema NÃO PODE interpretar "concordo" durante revisão clínica como autorização de agendamento.
**Implementação:** Guard `isAskingConsent` em `tradevision-core/index.ts` + AEC Gate V1.5.
**URS origem:** URS-PAC-02.
**Lock:** V1.9.95.

#### SRS-FR-02 — COS Kernel v5.0 (5 portas)
**Descrição:** Sistema DEVE filtrar todo input/output através de KillSwitch / Trauma / Metabolismo / ReadOnly / Policy.
**Implementação:** `cos_engine.ts` (selado por Magno 04-06/02/2026).
**URS origem:** URS-GLB-02.

#### SRS-FR-03 — AEC FSM 13+ fases determinísticas
**Descrição:** Sistema DEVE conduzir AEC em sequência FSM: INITIAL_GREETING → IDENTIFICATION → COMPLAINT_LIST → MAIN_COMPLAINT → COMPLAINT_DETAILS → MEDICAL_HISTORY → FAMILY_HISTORY_* → LIFESTYLE_HABITS → OBJECTIVE_QUESTIONS → CONSENSUS_REVIEW → CONSENSUS_REPORT → CONSENT_COLLECTION → COMPLETED.
**Implementação:** `clinicalAssessmentFlow.ts`.
**URS origem:** URS-MED-02, URS-PAC-01.

#### SRS-FR-04 — Verbatim First (V1.9.86)
**Descrição:** Sistema DEVE bypass GPT em hard-lock phases (~46% das fases AEC) com respostas pré-codificadas auditáveis.
**Implementação:** Pipeline camada 3.
**URS origem:** URS-MED-03.
**NFR relacionado:** SRS-NFR-08 (custo OpenAI).

#### SRS-FR-05 — AEC Gate V1.5 reforçado
**Descrição:** Sistema DEVE bloquear novo agendamento enquanto AEC do paciente está ativa (NOT is_complete + invalidated_at IS NULL).
**Implementação:** Camada 4 da pirâmide.
**URS origem:** URS-MED-06.
**Lock:** V1.9.95-A.

#### SRS-FR-06 — GPT-4o-2024-08-06 como camada 5 (não primeira)
**Descrição:** Sistema DEVE chamar GPT-4o APENAS quando camadas 0-4 não resolveram requisição.
**Implementação:** Edge `tradevision-core` v423.
**URS origem:** URS-GLB-04, URS-GLB-05.

#### SRS-FR-07 — Pós-processamento (strip tokens, validate UUID, force tags)
**Descrição:** Sistema DEVE remover tokens internos do output GPT antes de entregar ao usuário.
**Implementação:** Camada 6 da pirâmide.
**URS origem:** URS-PAC-04.

#### SRS-FR-08 — Pipeline Orchestrator (REPORT → SCORES → SIGNATURE → AXES → RATIONALITY → DONE)
**Descrição:** Sistema DEVE executar pipeline pós-AEC em ordem determinística.
**Implementação:** Camada 7 da pirâmide.
**URS origem:** URS-MED-02, URS-MED-04.

### Edge Functions críticas

#### SRS-FR-09 — Assinatura ICP-Brasil PBAD AD-RB v2.4
**Descrição:** Sistema DEVE gerar PDF assinado conforme PA-AD-RB v2.4 do ITI.
**Implementação:** Edge `sign-pdf-icp` v22 + constants `PA_AD_RB_V24_OID`.
**URS origem:** URS-MED-05, URS-PAC-06.
**Lock:** V1.9.299 (validação Portal ITI confirmada).

#### SRS-FR-10 — Auth + ownership check antes de assinar
**Descrição:** Sistema DEVE validar JWT + verificar que `document.professional_id === user.id` (ou admin / SERVICE_ROLE_KEY).
**Implementação:** Edge `sign-pdf-icp` v22 (post V1.9.457).
**URS origem:** URS-GLB-02.

#### SRS-FR-11 — Cripto password ICP
**Descrição:** Sistema DEVE proteger password do certificado ICP do médico antes de armazenar.
**Implementação:** Edge `cert-encrypt-password` v3.
**URS origem:** URS-MED-05.

#### SRS-FR-12 — Cron sweep video-call-reminders
**Descrição:** Sistema DEVE enviar lembrete por email 24h e 1h antes de consulta agendada.
**Implementação:** Edge `video-call-reminders` v31 + cron a cada 5min.
**URS origem:** URS-MED-11.

#### SRS-FR-13 — PII sanitization automática em racionalidades
**Descrição:** Sistema DEVE substituir nome completo do paciente por pseudônimo `Paciente #XXXXXX` antes de INSERT em `clinical_rationalities.assessment`.
**Implementação:** Edge `tradevision-core` v423 (helper `sanitizeRationalityPII`).
**URS origem:** URS-PAC-10.
**Lock:** V1.9.452.

### Cross-account + Compartilhamento

#### SRS-FR-14 — Share de relatório paciente → 2º médico
**Descrição:** Sistema DEVE permitir paciente compartilhar relatório com outro médico cadastrado.
**Implementação:** UI Share + UPDATE `clinical_reports.professional_id`.
**URS origem:** URS-PAC-05, URS-MED-08.
**Observação:** Memória `feedback_share_overwrite_professional_id_*` documenta overwrite (não append) — gap RLS pra 3º médico profissional puro post-Marco 3.

#### SRS-FR-15 — Cadastro de paciente externo offline
**Descrição:** Sistema DEVE permitir médico criar paciente em `public.users` sem auth.users correspondente.
**Implementação:** UI Cadastro Paciente em PatientsManagement.
**URS origem:** URS-MED-01.
**Memória:** `feedback_padrao_orfaos_public_users_validos_29_05`.

### AEC Interrompidas + Workflow Médico

#### SRS-FR-16 — Detecção e listagem de AECs INTERRUPTED órfãs
**Descrição:** Sistema DEVE listar `aec_assessment_state WHERE phase='INTERRUPTED' AND NOT is_complete AND invalidated_at IS NULL` no dashboard médico.
**Implementação:** Hook `useInterruptedAECs` + componente `InterruptedAECsCard`.
**URS origem:** URS-MED-06.
**Lock:** V1.9.500.

#### SRS-FR-17 — Invalidação com motivo obrigatório
**Descrição:** Sistema DEVE exigir motivo (texto não-vazio) ao invalidar AEC, preservando linha pra audit.
**Implementação:** Hook `useInterruptedAECs.invalidate(id, reason)`.
**URS origem:** URS-MED-06.

### Aba Evolução + Matrix Longitudinal

#### SRS-FR-18 — Separação semântica visual de 3 fontes na aba Evolução
**Descrição:** Sistema DEVE distinguir visualmente FOLLOW_UP médico / AEC IA / chat IA.
**Implementação:** PatientsManagement V1.9.487.
**URS origem:** URS-MED-09.

#### SRS-FR-19 — Toggles de fonte no Matrix Nôa
**Descrição:** Sistema DEVE permitir médico filtrar quais fontes Matrix usa (AEC / Evoluções / Racionalidades / Dossiês prévios).
**Implementação:** NoaMatrixView V1.9.488 (4 toggles).
**URS origem:** URS-MED-09.

#### SRS-FR-20 — Carregamento de FOLLOW_UP em hook longitudinal
**Descrição:** Sistema DEVE incluir `clinical_assessments WHERE assessment_type='FOLLOW_UP'` no corpus Matrix.
**Implementação:** `usePatientLongitudinal` V1.9.489.
**URS origem:** URS-MED-09.

### Bulário ANVISA + Matrix Z2

#### SRS-FR-21 — Bula ANVISA como material marcado pelo médico
**Descrição:** Sistema DEVE tratar bula como recurso citável no fluxo de prescrição, sem síntese cross-bulas.
**Implementação:** V1.9.466 BulaContextPopover + V1.9.468-A Matrix Z2 + Bula.
**URS origem:** URS-MED-10.
**Lock:** V1.9.468-A.

### Modal Evolução + Visualização

#### SRS-FR-22 — Modal não-disruptivo de detalhe de evolução
**Descrição:** Sistema DEVE abrir relatório completo em modal ao clicar em card da aba Evolução.
**Implementação:** EvolutionDetailModal V1.9.498.
**URS origem:** URS-MED-09.

### Prescrição CFM

#### SRS-FR-23 — Receituário CFM (Simples / Branca C2 / Azul B1B2 / Amarela A1-A3)
**Descrição:** Sistema DEVE permitir gerar 4 tipos de receituário CFM.
**Implementação:** IntegrativePrescriptions / cfm_prescriptions / Edge sign-pdf-icp.
**URS origem:** URS-MED-05, URS-PAC-06.

### Ensino + Mentoria

#### SRS-FR-24 — Notícias institucionais com categorização
**Descrição:** Sistema DEVE permitir admin criar notícias com 8 categorias válidas (cannabis-medicinal / pesquisa-clinica / metodologia-aec / regulamentacao / nefrologia / clinica / pesquisa / farmacologia).
**Implementação:** `useNewsItems` + NewsItemAdminModal V1.9.495.
**URS origem:** URS-ADM-03.

#### SRS-FR-25 — Instrumentos de avaliação CRUD
**Descrição:** Sistema DEVE permitir admin criar/editar instrumentos com audiência configurável.
**Implementação:** `useEvaluationInstruments` + EvaluationInstrumentAdminModal V1.9.496.
**URS origem:** URS-ADM-04.

#### SRS-FR-26 — Solicitação de mentoria por aluno/paciente
**Descrição:** Sistema DEVE permitir solicitar mentoria com mentor cadastrado em disponibilidade configurada.
**Implementação:** `useMentorship` + MentorshipRequestModal V1.9.497.
**URS origem:** URS-ALU-04.

### Telemetria + Observabilidade

#### SRS-FR-27 — Cost tracking por interação IA
**Descrição:** Sistema DEVE registrar `cost_usd_estimate`, `prompt_tokens`, `completion_tokens`, `model`, `simbologia` em metadata de `ai_chat_interactions`.
**Implementação:** Edge `tradevision-core` (post V1.9.238).
**URS origem:** URS-MED-12, URS-ADM-02, URS-GLB-05.

#### SRS-FR-28 — Painel agregado por feature
**Descrição:** Sistema DEVE exibir cost / latency / users por bucket simbologia.
**Implementação:** AdminAIGovernance V1.9.374.
**URS origem:** URS-ADM-02.

### Anonimização LGPD

#### SRS-FR-29 — RPC anonymize_user_safely
**Descrição:** Sistema DEVE oferecer anonimização preservando agregados estatísticos.
**Implementação:** RPC SQL SECURITY DEFINER.
**URS origem:** URS-PAC-08, URS-ADM-07.

### Dashboard Profissional (V1.9.502)

#### SRS-FR-30 — Stats reais (não mock) no Dashboard Profissional
**Descrição:** Sistema DEVE exibir appointments hoje + reports últimos 7d via query real.
**Implementação:** `useProfessionalDashboard.loadStats()` V1.9.502.
**URS origem:** URS-MED-11.

#### SRS-FR-31 — Atividade Recente derivada de reports últimos 7d
**Descrição:** Sistema DEVE listar top 5 reports recentes na sidebar.
**Implementação:** `useProfessionalDashboard.stats.recentActivity` V1.9.502.
**URS origem:** URS-MED-11.

## 4. Requisitos Não-Funcionais (SRS-NFR-XX)

### Performance

#### SRS-NFR-01 — Latência P50 < 5s, P95 < 12s
**Descrição:** Tempo de resposta Edge `tradevision-core`.
**Verificação:** Métrica `processing_time` em `ai_chat_interactions`.
**URS origem:** URS-GLB-04.

#### SRS-NFR-02 — Disponibilidade ≥ 99.5% mensal
**Descrição:** Uptime Vercel + Supabase + Edge.
**Verificação:** Monitor Vercel + Supabase status.

### Segurança

#### SRS-NFR-03 — RLS habilitado em 100% das tabelas públicas
**Descrição:** 144/144 tabelas com Row Level Security ON.
**Verificação:** Empírico PAT 29/05 — 144/144 confirmado.
**URS origem:** URS-GLB-02.

#### SRS-NFR-04 — Conexão TLS 1.2+ em trânsito
**Descrição:** HTTPS obrigatório em todos os endpoints.
**Verificação:** Vercel cert + Supabase cert.
**URS origem:** URS-GLB-02.

#### SRS-NFR-05 — Encryption at rest em Postgres
**Descrição:** Supabase Pro + Cloudflare encryption.
**URS origem:** URS-GLB-02.

#### SRS-NFR-06 — Verify JWT em Edges sensíveis a auth
**Descrição:** Edges devem validar JWT antes de processar.
**⚠️ Estado atual:** `tradevision-core` v423 ainda com `verify_jwt=false` em produção — pendente decisão Sprint A após validação de callers.
**URS origem:** URS-GLB-02.

### Privacidade (LGPD)

#### SRS-NFR-07 — Sanitização preventiva de PII em texto livre IA
**Descrição:** Nenhum INSERT em campo de texto livre deve conter nome completo de paciente.
**Verificação:** V1.9.452 helper + backfill 132 rows.
**URS origem:** URS-PAC-10.

### Custo

#### SRS-NFR-08 — Custo OpenAI por turn ≤ $0.05 USD (média)
**Descrição:** Custo aceitável pra escala Marco 3.
**Verificação:** Empírico 29/05 — Matrix $0.019/turn, Escuta Clínica ~$0.014/turn, Simulação ~$0.026/turn.
**URS origem:** URS-GLB-05.

### Conformidade

#### SRS-NFR-09 — Versionamento auditável V1.9.X
**Descrição:** Toda mudança rastreável por tag git + diário + memória.
**Verificação:** 649 commits/30d, 11 tags imutáveis, 66 diários, 284 memórias.
**URS origem:** URS-GLB-03.

#### SRS-NFR-10 — Backup contínuo (WAL-G + diário)
**Descrição:** Recovery point objective < 1h.
**Verificação:** Supabase Pro plan.

#### SRS-NFR-11 — Logs cron 100% success rate
**Descrição:** Cron jobs devem completar sem erro.
**Verificação:** `cron.job_run_details` últimos 7d = 100% (2.023 runs).

### Usabilidade

#### SRS-NFR-12 — Responsivo até 360px de largura
**Descrição:** Mobile básico suportado.
**Verificação:** Tailwind breakpoints.

#### SRS-NFR-13 — Empty state honesto (sem dados fake)
**Descrição:** Componentes devem mostrar "Sem registros" em vez de mock data.
**Verificação:** V1.9.502 polish ProfessionalDashboard.
**URS origem:** URS-GLB-03.

## 5. Inventário SRS

- Funcionais: 31 (SRS-FR-01..31)
- Não-funcionais: 13 (SRS-NFR-01..13)

**Total: 44 SRS catalogados.**

## 6. Rastreabilidade

Cada SRS aparece em [TRM-001](./14_TRM-001_Traceability_Matrix.md) mapeado para URS, SAD, RSK, TST, EVD.

---

**Aprovação:**
- [ ] Médico Sócio (validação clínica): Dr. Ricardo Valença — Data: ___/___/___
- [ ] RT habilitado: ________________ Data: ___/___/___
- [ ] Tech Lead: Pedro Henrique Passos Galluf — Data: 29/05/2026 (draft)
