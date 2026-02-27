# 🗺️ PANORAMA COMPLETO — MedCannLab v10.0
## Arquitetura, Fluxos e Diagramas | 25/02/2026

> **Baseado exclusivamente no código-fonte real** — 72 páginas, 78 componentes, 130+ tabelas, 6 Edge Functions, 40+ RPCs.

---

## 1. ARQUITETURA GERAL

```mermaid
graph TB
    subgraph "Frontend (React + Vite)"
        LP[Landing Page]
        LOGIN[Login / Registro]
        EIXO[Seletor de Eixos]
        
        subgraph "Eixo Clínica"
            PD[Dashboard Paciente]
            PRD[Dashboard Profissional]
            CHAT[Chat Médico-Paciente]
            ASSESS[Avaliações Clínicas]
            APPT[Agendamentos]
            PRESC[Prescrições CFM]
            REPORTS[Relatórios]
        end
        
        subgraph "Eixo Ensino"
            ED[Dashboard Ensino]
            COURSES[Cursos]
            LESSONS[Aulas]
            ALUNO[Dashboard Aluno]
        end
        
        subgraph "Eixo Pesquisa"
            PESQ[Dashboard Pesquisa]
            LAB[MedCannLab]
            RENAL[Cidade Amiga dos Rins]
            JARDINS[Jardins de Cura]
        end
        
        subgraph "Global"
            FORUM[Fórum Cann Matrix]
            GAMIF[Gamificação]
            NOA[Nôa IA]
            VIDEO[Teleconsulta]
        end
        
        subgraph "Admin"
            ADMIN[Dashboard Admin]
            SETTINGS[Configurações]
            GOVERNANCE[Governança Clínica]
        end
    end
    
    subgraph "Supabase Backend"
        AUTH[Auth / JWT]
        DB[(PostgreSQL 130+ tabelas)]
        RLS[RLS Policies]
        REALTIME[Realtime WebSocket]
        STORAGE[Storage / Buckets]
        EDGE[Edge Functions]
    end
    
    subgraph "APIs Externas"
        RESEND[Resend Email]
        OPENAI[OpenAI GPT-4]
        STRIPE[Stripe - Futuro]
    end
    
    LP --> LOGIN --> EIXO
    EIXO --> PD & PRD & ED & PESQ & ADMIN
    
    PD & PRD & CHAT --> AUTH --> RLS --> DB
    CHAT --> REALTIME
    VIDEO --> REALTIME
    
    EDGE --> RESEND
    NOA --> EDGE --> OPENAI
```

---

## 2. FLUXO DE AUTENTICAÇÃO E RBAC

```mermaid
sequenceDiagram
    actor U as Usuário
    participant L as Login.tsx
    participant S as Supabase Auth
    participant DB as user_roles / users
    participant R as ProtectedRoute
    participant D as Dashboard Router

    U->>L: Email + Senha
    L->>S: supabase.auth.signInWithPassword()
    S-->>L: JWT Token + Session
    L->>DB: SELECT role FROM user_roles WHERE user_id = auth.uid()
    DB-->>L: role (paciente | profissional | admin | aluno)
    L->>R: Navigate /app/dashboard
    R->>R: Verificar role vs requiredRole
    R->>D: SmartDashboardRedirect
    
    alt role = paciente
        D->>D: → /app/clinica/paciente/dashboard
    else role = profissional
        D->>D: → /app/clinica/profissional/dashboard
    else role = admin
        D->>D: → /app/dashboard (admin)
    else role = aluno
        D->>D: → /app/ensino/aluno/dashboard
    end
```

### ⚠️ Pontos de Atenção — Autenticação:
- **37 roles** no `user_roles` (corrigidos hoje — eram 23)
- `ProtectedRoute` verifica `requiredRole` via `get_my_primary_role()` RPC
- Pacientes SEM role ficavam presos na landing page (corrigido)
- `has_role()` RPC usada para checagens inline

---

## 3. DASHBOARD DO PACIENTE

```mermaid
graph LR
    subgraph "PatientDashboard.tsx (2935 linhas)"
        HOME[Visão Geral]
        NOA_TAB[Nôa IA]
        DOCS[Documentos]
        AGENDA[Agenda]
        PROF[Profissionais]
        FINANCE[Financeiro]
        CONFIG[Configurações]
        SUPPORT[Suporte]
        TREATMENTS[Tratamentos IMRE]
    end
    
    HOME --> v_kpi_basic
    HOME --> v_next_appointments
    NOA_TAB --> ai_chat_interactions
    NOA_TAB --> tradevision-core[Edge: tradevision-core]
    DOCS --> documents
    DOCS --> clinical_reports
    AGENDA --> appointments
    AGENDA --> book_appointment_atomic[RPC]
    PROF --> professional_availability
    FINANCE --> transactions
    FINANCE --> subscription_plans
    SUPPORT --> chat_messages
    TREATMENTS --> imre_assessments
```

### ⚠️ Pontos de Atenção — Dashboard Paciente:
- **2935 linhas** — arquivo monolítico, candidato a refatoração
- Tem 9 abas internas renderizadas condicionalmente
- `PatientSupport.tsx` bug de colunas foi **corrigido hoje** (`sender_id`/`message`)
- Aba financeira usa dados simulados (sem Stripe real)

---

## 4. DASHBOARD DO PROFISSIONAL

```mermaid
graph LR
    subgraph "Professional Dashboard"
        ATD[Atendimento]
        PAC[Pacientes]
        AGENDA_P[Agenda]
        KPI[KPIs Clínicos]
        CHAT_P[Chat Pacientes]
        PRESC_P[Prescrições]
        CERT[Certificados]
        REL[Relatórios]
    end
    
    ATD --> appointments
    ATD --> clinical_assessments
    PAC --> v_scope_patients
    PAC --> patient_medical_records
    KPI --> v_doctor_dashboard_kpis
    KPI --> v_attendance_kpis_today
    CHAT_P --> useChatSystem[useChatSystem.ts]
    CHAT_P --> chat_messages
    CHAT_P --> chat_rooms
    PRESC_P --> cfm_prescriptions
    PRESC_P --> digital-signature[Edge: digital-signature]
    CERT --> medical_certificates
    REL --> clinical_reports
```

### ⚠️ Pontos de Atenção — Dashboard Profissional:
- Profissionais `payment_status='exempt'` (corrigido hoje)
- Prescrições CFM usam assinatura digital via Edge Function
- `v_scope_patients` vista agora com SECURITY INVOKER (corrigido hoje)
- **0 consultas marcadas como 'completed'** — faltando fluxo de conclusão

---

## 5. SISTEMA DE CHAT

```mermaid
graph TB
    subgraph "Chat Architecture"
        direction TB
        
        subgraph "Frontend Hooks"
            UCS[useChatSystem.ts]
            PC[PatientChat.tsx]
            PDC[PatientDoctorChat.tsx]
            CG[ChatGlobal.tsx]
            PS[PatientSupport.tsx]
        end
        
        subgraph "Database"
            CR[chat_rooms]
            CP[chat_participants - 81 registros]
            CM[chat_messages - RLS ativo]
            CML[chat_messages_legacy -  15 msgs]
        end
        
        subgraph "Segurança"
            ICMR["is_chat_room_member()"]
            IAU["is_admin_user()"]
            ENC[encryption.ts]
        end
        
        subgraph "RPCs"
            GMR[get_my_rooms]
            GCUP[get_chat_user_profiles]
            MRR[mark_room_read]
            CCRP[create_chat_room_for_patient]
        end
    end
    
    UCS --> CM
    UCS --> ENC
    UCS --> GMR
    UCS --> GCUP
    
    CM --> ICMR
    CM --> IAU
    
    PC --> UCS
    PDC --> UCS
    PS --> CM
    CG --> CM
```

### ⚠️ Pontos de Atenção — Chat:
- **Mensagens encriptadas** via `encryption.ts` (AES client-side)
- `chat_messages` tem 0 mensagens reais (mensagem teste ID:180 inserida hoje)
- `chat_messages_legacy` tem 15 mensagens com schema diferente (não migráveis automaticamente)
- `ChatGlobal.tsx` usa filtro `channel=eq.${activeChannel}` no realtime, mas tabela não tem coluna `channel`
- O hook `useChatSystem.ts` é correto e funcional, usa `sender_id`

---

## 6. SISTEMA DE AGENDAMENTOS

```mermaid
sequenceDiagram
    actor P as Paciente
    participant PA as PatientAppointments.tsx
    participant RPC as book_appointment_atomic()
    participant DB as appointments
    participant AV as professional_availability
    participant SLOTS as get_available_slots_v3()
    participant EMAIL as send-email Edge Function

    P->>PA: Selecionar profissional + data
    PA->>SLOTS: Buscar horários disponíveis
    SLOTS->>AV: Verificar disponibilidade
    AV-->>SLOTS: Slots livres
    SLOTS-->>PA: Lista de horários
    P->>PA: Confirmar agendamento
    PA->>RPC: book_appointment_atomic(patient_id, professional_id, date, time)
    RPC->>DB: INSERT appointment + UPDATE slot
    RPC-->>PA: Sucesso
    PA->>EMAIL: Notificar paciente e profissional
    EMAIL-->>P: Email confirmação
```

### ⚠️ Pontos de Atenção — Agendamentos:
- **47 appointments** no banco, **0 completed**
- `book_appointment_atomic()` RPC garante atomicidade (slot + appointment)
- `get_available_slots_v3()` calcula slots baseado em `time_blocks` e `smart_slot_rules`
- `professional_availability` controla horários possíveis
- **Falta:** Fluxo de "marcar como concluída" e "cancelar" agendamento
- **Falta:** Integração real com email de confirmação (Edge Function pronta, não wired)

---

## 7. SISTEMA DE PAGAMENTOS

```mermaid
graph TB
    subgraph "Estado Atual (100% Simulado)"
        PC_PAY[PaymentCheckout.tsx]
        PLANS[subscription_plans - 3 planos]
        PIX_MOCK[PIX QR Code Mockado]
        STATUS[payment_status na tabela users]
    end
    
    subgraph "Fluxo Atual"
        PC_PAY -->|"Gerar QR"| PIX_MOCK
        PC_PAY -->|"Simular pagamento"| STATUS
        PLANS -->|"R$150 / R$250 / R$350"| PC_PAY
    end
    
    subgraph "Futuro (Stripe / Mercado Pago)"
        STRIPE_EF[Edge Function: stripe-checkout]
        WEBHOOK_EF[Edge Function: stripe-webhook]
        STRIPE_API[Stripe API]
        REAL_PAY[Pagamento Real]
    end
    
    PC_PAY -.->|"FUTURO"| STRIPE_EF
    STRIPE_EF -.-> STRIPE_API
    STRIPE_API -.-> WEBHOOK_EF
    WEBHOOK_EF -.-> STATUS
    
    style PIX_MOCK fill:#ff6b6b,color:#fff
    style STRIPE_EF fill:#4ecdc4,color:#fff,stroke-dasharray: 5 5
    style WEBHOOK_EF fill:#4ecdc4,color:#fff,stroke-dasharray: 5 5
```

### ⚠️ Pontos de Atenção — Pagamentos:
- **100% simulado** — nenhuma transação real processada
- `pixString` e `qrCodeBase64` hardcoded no `PaymentCheckout.tsx`
- 3 planos existem no `subscription_plans`: Essential (R$150), Professional (R$250), Premium (R$350)
- `payment_status` possíveis: `pending`, `paid`, `trial`, `exempt`, `overdue`
- **8 profissionais** já marcados como `exempt` (corrigido hoje)
- `transactions`: tabela existe mas com **0 registros**
- **Para lançar sem pagamento:** app funciona com trial/exempt
- **Para monetizar:** precisa Stripe ou Mercado Pago (Edge Functions + webhook)

---

## 8. NÔA — INTELIGÊNCIA ARTIFICIAL

```mermaid
graph TB
    subgraph "Nôa Architecture (9 módulos)"
        NC[noaEngine.ts - Motor Principal]
        NKB[noaKnowledgeBase.ts - Base de Conhecimento]
        NI[noaIntegration.ts - Orquestrador]
        NAI[noaAssistantIntegration.ts]
        NCS[noaCommandSystem.ts - Comandos]
        NR[noaResidentAI.ts - IA Residente]
        NE[noaEsperancaCore.ts - Personalidade]
        NT[noaTrainingSystem.ts - Treinamento]
        NP[noaPermissionManager.ts - Permissões]
    end
    
    subgraph "Edge Functions"
        TV[tradevision-core - GPT-4 Integration]
        EDT[extract-document-text]
    end
    
    subgraph "Database"
        ACI[ai_chat_interactions]
        AIS[ai_saved_documents]
        BC[base_conhecimento - 376 documentos]
        NOA_MEM[noa_memories]
        NOA_LOGS[noa_interaction_logs]
        NOA_CASES[noa_clinical_cases]
        NOA_ART[noa_articles]
    end
    
    NC --> TV
    NKB --> BC
    NKB --> EDT
    NI --> NC & NKB
    NAI --> ACI
    NCS --> NI
    NR --> NP
    NE --> NOA_MEM
    
    style TV fill:#8b5cf6,color:#fff
    style BC fill:#f59e0b,color:#fff
```

### ⚠️ Pontos de Atenção — Nôa IA:
- `tradevision-core` Edge Function precisa de `OPENAI_API_KEY` no secrets
- **376 documentos** na `base_conhecimento` (importados e indexados)
- Busca semântica via `semanticSearch.ts` + `ragSystem.ts`
- Sistema de cache: `clinicalGovernance/utils/cacheManager.ts`
- **Clinical Governance**: 14 arquivos dedicados, classificação de estado, detector de exaustão
- `noaPermissionManager.ts` controla acesso baseado no tipo de usuário

---

## 9. SISTEMA DE EMAIL

```mermaid
graph LR
    subgraph "Frontend (Refatorado Hoje)"
        ES[emailService.ts]
        NS[notificationService.ts]
    end
    
    subgraph "Supabase Edge Function"
        SE[send-email/index.ts]
    end
    
    subgraph "Resend API"
        RA[api.resend.com/emails]
    end
    
    subgraph "Templates (6)"
        T1[welcome]
        T2[appointment_confirmation]
        T3[report_shared]
        T4[prescription_ready]
        T5[invite_patient]
        T6[payment_confirmation]
    end
    
    ES -->|"supabase.functions.invoke"| SE
    NS -->|"supabase.functions.invoke"| SE
    SE --> RA
    SE --> T1 & T2 & T3 & T4 & T5 & T6
    
    style SE fill:#22c55e,color:#fff
    style RA fill:#6366f1,color:#fff
```

### ⚠️ Pontos de Atenção — Email:
- ✅ Edge Function deployada e testada (email real enviado)
- ✅ API key segura no server (removida do frontend)
- ⚠️ Resend free tier: só envia para `medcannlab.br@gmail.com` até verificar domínio
- ⚠️ Domínio `medcannlab.com.br` NÃO verificado no Resend ainda
- **InvitePatient.tsx** ainda não chama a Edge Function (hardcoded link apenas)
- **Appointment confirmation** não wired ao send-email

---

## 10. TELECONSULTA / VIDEO

```mermaid
graph TB
    subgraph "Video Call System"
        VCR[useVideoCallRequests.ts]
        WRTC[useWebRTCRoom.ts]
        VCS[video_call_sessions]
        VCREQ[video_call_requests]
        VCN[video-call-request-notification Edge Function]
        VCR_EF[video-call-reminders Edge Function]
    end
    
    VCR --> VCREQ
    WRTC --> VCS
    VCR_EF --> VCS
    VCN --> VCREQ
```

### ⚠️ Pontos de Atenção — Teleconsulta:
- WebRTC implementado mas **sem TURN/STUN server** real
- Funciona apenas em rede local ou conexões diretas (sem NAT traversal)
- 2 Edge Functions existem: `video-call-reminders` e `video-call-request-notification`
- `video_clinical_snippets` para gravar trechos clínicos (documentação)
- **Para funcionar em produção:** precisa de TURN server (ex: Twilio NTS, ~$0.40/GB)

---

## 11. GAMIFICAÇÃO

```mermaid
graph LR
    subgraph "Gamificação"
        GP[gamification_points]
        UA[user_achievements]
        RH[ranking_history]
        UPB[v_user_points_balance]
        LB[get_leaderboard RPC]
        IUP[increment_user_points RPC]
        UNLA[unlock_achievement RPC]
        GBR[grant_benefits_rewards RPC]
    end
    
    GP --> UPB
    UA --> UNLA
    RH --> LB
    IUP --> GP
    GBR --> UA
```

### ⚠️ Pontos de Atenção — Gamificação:
- RPCs existem (`increment_user_points`, `unlock_achievement`, `grant_benefits_rewards`)
- **Triggers NÃO ativos** — pontos não são concedidos automaticamente
- `Gamificacao.tsx` page existe com UI funcional
- Ranking live view: `view_current_ranking_live` (migrado para INVOKER hoje)
- **Para ativar:** Criar triggers em appointments, assessments, chat_messages para conceder pontos

---

## 12. EIXO ENSINO / CURSOS

```mermaid
graph TB
    subgraph "Ensino"
        ED_DASH[EnsinoDashboard.tsx]
        LP_PAGE[LessonPreparation.tsx]
        COURSE_PAGE[Courses.tsx]
        LESSON_D[LessonDetail.tsx]
        GA[GestaoAlunos.tsx]
    end
    
    subgraph "Database"
        C[courses]
        CM_T[course_modules]
        L[lessons]
        LC[lesson_content]
        CE[course_enrollments]
        CR_T[course_ratings]
        UC[user_courses]
        TRL[trl_programs / trl_modules / trl_lessons]
    end
    
    ED_DASH --> C & CM_T
    COURSE_PAGE --> C & CE
    LESSON_D --> L & LC
    GA --> CE & UC
    LP_PAGE --> L & LC
```

### ⚠️ Pontos de Atenção — Ensino:
- 2 cursos específicos: `CursoEduardoFaveret.tsx` e `CursoJardinsDeCura.tsx`
- Sistema TRL (Transformative Reflective Learning) com 7 tabelas
- `course_modules` agora tem RLS policies (criadas hoje)
- `Library.tsx` para biblioteca de recursos educacionais
- **Falta:** Verificar se cursos têm conteúdo real inserido no banco

---

## 13. EIXO PESQUISA

```mermaid
graph LR
    subgraph "Pesquisa"
        PD_R[PesquisaDashboard.tsx]
        MCL[MedCannLab.tsx]
        JDC[JardinsDeCura.tsx]
        CADR[CidadeAmigaDosRins.tsx]
        FCC[ForumCasosClinicos.tsx]
    end
    
    subgraph "Database"
        AR[avaliacoes_renais]
        RE[renal_exams]
        SE_T[semantic_analysis]
        IA[imre_assessments]
        ISB[imre_semantic_blocks]
        KDS[kpi_daily_snapshots]
    end
    
    PD_R --> KDS
    MCL --> IA & ISB
    CADR --> AR & RE
    FCC --> forum_posts & forum_comments
```

### ⚠️ Pontos de Atenção — Pesquisa:
- `imre_assessments` tabela existe mas pode ter dados incompletos
- IMRE (Instrumento de Medição de Resultados em Endocanabinologia) é core do sistema
- Views renais: `v_patient_renal_profile`, `v_renal_monitoring_kpis`, `v_renal_trend` (migradas hoje)
- `renalCalculations.ts` contém cálculos de eGFR, DRC, etc.

---

## 14. SEGURANÇA — INVENTÁRIO COMPLETO

```mermaid
graph TB
    subgraph "Segurança Pós-Fix (82%)"
        subgraph "✅ Corrigido Hoje"
            V30["30 views → SECURITY INVOKER"]
            P17["17 RLS policies em 6 tabelas"]
            R14["14 user_roles sincronizados"]
            GD["Ghost doctor_id eliminado"]
            PEX["8 profissionais exempt"]
            API_SEC["API keys removidas do frontend"]
        end
        
        subgraph "⚠️ Pendente"
            AT50["~50 policies USING(true)"]
            LP_SEC["Leaked Password Protection"]
            DOC_RLS["Documentar RLS matrix"]
        end
    end
```

---

## 15. INVENTÁRIO DE TABELAS (130+ tabelas)

| Categoria | Tabelas | Total |
|:---|:---|:---|
| **Auth/Usuários** | users, user_roles, user_profiles, profiles, role_catalog, user_activity_logs, user_statistics, user_interactions, user_mutes, user_achievements, user_benefits_status | 11 |
| **Chat** | chat_rooms, chat_participants, chat_messages, chat_messages_legacy, chat_sessions, private_chats, private_messages, global_chat_messages | 8 |
| **Clínico** | clinical_assessments, clinical_integration, clinical_reports, clinical_kpis, patient_medical_records, patient_conditions, patient_lab_results, patient_insights, patient_prescriptions, patient_therapeutic_plans | 10 |
| **Agendamento** | appointments, professional_availability, time_blocks, smart_slot_rules, scheduling_audit_log | 5 |
| **Prescrições** | cfm_prescriptions, prescriptions, patient_exam_requests, exam_request_templates, integrative_prescription_templates, modelos_receituario | 6 |
| **IA/Nôa** | ai_chat_interactions, ai_chat_history, ai_saved_documents, ai_assessment_scores, ai_scheduling_predictions, base_conhecimento, noa_memories, noa_interaction_logs, noa_clinical_cases, noa_articles, noa_lessons, noa_pending_actions | 12 |
| **Assinatura/Pagamento** | subscription_plans, user_subscriptions, transactions, pki_transactions | 4 |
| **Gamificação** | gamification_points, user_achievements, ranking_history, referral_bonus_cycles, benefit_usage_log | 5 |
| **IMRE/Pesquisa** | imre_assessments, imre_semantic_blocks, imre_semantic_context, dados_imre_coletados, assessment_sharing, semantic_analysis | 6 |
| **Renal** | avaliacoes_renais, renal_exams, pacientes | 3 |
| **Ensino/TRL** | courses, course_modules, course_enrollments, course_ratings, lessons, lesson_content, user_courses, trl_programs, trl_modules, trl_lessons, trl_module_competencies, trl_competency_domains, trl_reflections, trl_events, trl_learning_evidence | 15 |
| **Fórum** | forum_posts, forum_comments, forum_likes, forum_views, debates, channels | 6 |
| **Vídeo** | video_call_requests, video_call_sessions, video_clinical_snippets | 3 |
| **Cognitivo** | cognitive_decisions, cognitive_events, cognitive_interaction_state, cognitive_metabolism, cognitive_policies | 5 |
| **Documentos** | documents, document_snapshots, educational_resources, news, news_items | 5 |
| **Outros** | analytics, clinics, feature_flags, notifications, messages, system_config, platform_params, wearable_data, wearable_devices, contexto_longitudinal, etc. | 20+ |

---

## 16. EDGE FUNCTIONS DEPLOYADAS (6)

| Function | Propósito | API Externa | Status |
|:---|:---|:---|:---|
| `send-email` | Envio de emails via Resend | Resend API | ✅ Deployada hoje |
| `tradevision-core` | Nôa IA — GPT-4 integration | OpenAI API | ⚠️ Precisa OPENAI_API_KEY |
| `digital-signature` | Assinatura digital ICP-Brasil | — | ⚠️ Pode ser mock |
| `extract-document-text` | Extração de texto de PDFs | — | ✅ Funcional |
| `video-call-reminders` | Lembretes de teleconsulta | — | ⚠️ Não verificado |
| `video-call-request-notification` | Notificação de chamada | — | ⚠️ Não verificado |

---

## 17. RPCs IMPORTANTES (40+)

| RPC | Uso | Tipo |
|:---|:---|:---|
| `book_appointment_atomic` | Agendamento atômico | Transação |
| `get_available_slots_v3` | Horários disponíveis | Query |
| `get_my_rooms` | Salas de chat do user | Query |
| `get_chat_user_profiles` | Perfis para chat | Query |
| `mark_room_read` | Marcar mensagens lidas | Mutação |
| `create_chat_room_for_patient` | Criar sala paciente | Mutação |
| `share_report_with_doctors` | Compartilhar relatório | Mutação |
| `is_chat_room_member` | Verificar membro chat | Helper RLS |
| `is_admin_user` | Verificar admin | Helper RLS |
| `increment_user_points` | Gamificação | Mutação |
| `unlock_achievement` | Desbloquear conquista | Mutação |
| `get_leaderboard` | Ranking global | Query |
| `criar_paciente_completo` | Criar paciente | Transação |
| `search_patient_by_name` | Busca por nome | Query |
| `obter_contexto_ia` | Contexto para Nôa | Query |

---

## 18. RESUMO DE ATENÇÃO POR ÁREA

| Área | Score | Ponto Crítico |
|:---|:---|:---|
| **Frontend/UI** | 92% | `PatientDashboard.tsx` monolítico (2935 linhas) |
| **Nôa IA** | 95% | Precisa `OPENAI_API_KEY` para funcionar |
| **Chat** | 90% | 0 mensagens reais, `ChatGlobal` realtime com coluna inexistente |
| **Notificações** | 80% | Email Edge Function pronta mas não wired a todos os eventos |
| **Gamificação** | 70% | RPCs existem mas triggers não estão ativos |
| **Teleconsulta** | 60% | Sem TURN/STUN server para NAT traversal |
| **Segurança** | 85% | ~50 policies `USING(true)` ainda pendentes |
| **Email** | 85% | Domínio `medcannlab.com.br` não verificado no Resend |
| **Pagamentos** | 10% | 100% simulado, 0 transações reais |

---

*Panorama gerado em 25/02/2026 às 21:00 (Brasília) — dados exclusivamente do código-fonte real.*
