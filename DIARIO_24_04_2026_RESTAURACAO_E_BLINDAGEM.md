# DIÁRIO 24/04/2026 — Restauração da Qualidade Clínica + Blindagem Estrutural

> **Marco:** uma semana sem a Nôa me identificar corretamente como admin; hoje o sistema respondeu "Olá Pedro Henrique Passos Galluf, conexão administrativa confirmada para a MedCannLab 3.0". Volta do comportamento esperado após ~7 dias de regressão acumulada.

---

## 1. Resumo Executivo

O dia começou 09h com o Pedro usando o chat da Nôa e encontrando 3 bugs perceptíveis:
- "Quantos usuários temos no app?" → Nôa respondia contagem de **documentos**.
- Pediu "1" pra selecionar um doc → sistema travou em prompt de "avaliação pausada".
- Percepção geral: app piorou desde a sessão de 23/04 manhã.

Ao fim do dia, **11 versões foram commitadas e deployadas** (V1.9.11 → V1.9.21), o chat voltou a identificar o usuário corretamente, a estrutura de `clinical_reports` foi restaurada ao padrão pré-refactor de 22/04, e a dívida técnica das colunas `doctor_id`/`professional_id` foi imobilizada sem remoção.

Princípio reafirmado: **"polir e melhorar, não reinventar"** — registrado em memória para sessões futuras.

---

## 2. Timeline do Dia (V1.9.11 → V1.9.21)

| Versão | Título | Impacto |
|---|---|---|
| **V1.9.11** | Fix trigger órfão "Iniciar Avaliação Clínica" | Regex amplo casava "entrevista" genérica; role guard + regex precisa |
| **V1.9.12** | Filtro `category='slides'` na biblioteca | 412 slides gerados pela LessonPreparation não poluem mais a biblioteca principal |
| Limpeza DB | Biblioteca 458 → 46 docs reais | Backup em `documents_backup_23_04_2026` + `generated_slides_archive` |
| **V1.9.13** | Destrava monetização (COALESCE doctor_id/professional_id + notifications.id default) | 45 reports desde 22/04 tinham `professional_id=NULL`; fluxo completo validado end-to-end |
| **V1.9.14** | Bloco A polimento | Aluno abre docs, botão "Baixar" no chat viewer, send-email com verify_jwt, backfill 27 user_profiles |
| **V1.9.15** | `buildProfessionalContext` | Nôa responde factualmente: agenda, pacientes ativos, prescrições, wallet |
| **V1.9.16** | `buildAdminContext` | Métricas plataforma: users by role, pending txs, biblioteca, atividade 24h |
| **V1.9.17** | `buildStudentContext` | Fecha conjunto de context enrichment por role |
| **V1.9.18** | Regex `detectDocumentCountRequest` tightened | "quantos usuários temos" não cai mais no handler de documentos |
| **V1.9.19** | Role guard no FSM | Admin/pro/aluno não ficam trancados por `aec_state` residual |
| **V1.9.20** | Dual-write inteligente — restaura schema de reports | `lista_indiciaria`, `identificacao`, `consenso` voltam direto em `content.*` (como 02-05/04); `professional_id` populado |
| **V1.9.21** | Sync trigger `doctor_id ↔ professional_id` + backfill | 60 appointments + 56 reports + 24 kpis normalizados; divergência futura impossível |

---

## 3. Descobertas Importantes do Dia

### 3.1 Regressão real desde commit `7a7e33a` (23/04 09:06)
Commit "fix(pipeline): enable single-orchestrator architecture" removeu 72 linhas do frontend que montavam `contentPayload` estruturado para `finalize_assessment`. Backend passou a tentar extrair via GPT. Resultado:
- **Reports de 02-05/04:** 6/6 com `professional_id` populado, lista_indiciaria direto em `content.*`
- **Reports 22-23/04:** 0/45 com professional_id, dados aninhados em `content.raw.content.*`
- Frontend já tinha adaptação para desembrulhar, mas a regressão afetava consumidores que esperavam estrutura plana.

**Fix (V1.9.20):** frontend volta a montar `aecFinalizationData` estruturado e envia no mesmo round-trip; backend faz spread do `content` no topo mantendo `content.raw` pra retrocompat.

### 3.2 412 slides gerados automaticamente em `documents`
LessonPreparation.tsx:373 insere em `documents` com `category='slides'` (feature legítima de preparação docente). Mas 412 registros poluíam a biblioteca quando listada. Ninguém apareceu como uploader em 406 desses (registros de sistema ou user órfão).

**Decisão (V1.9.12):** filtrar `category != 'slides'` na biblioteca (filtro, não remoção). Slides arquivados em `generated_slides_archive`. Feature LessonPreparation continua funcionando via query direta com `.eq('category','slides')`.

### 3.3 FALLBACK_DOCTOR_ID hardcoded
`handleFinalizeAssessment` tem fallback institucional: `'2135f0c0-eb5a-43b1-bc00-5f8dfea13561'` (Dr. Ricardo Valença rrvalenca). Desde 22/04, 45 reports caíram nesse fallback — nenhum resolvia o médico real via request/appointment/preferred.

**Dívida aceita:** resolver este ponto depende de ter `patient_doctor_binding` explícito (documentado em diários anteriores como plano futuro). Não mexemos hoje.

### 3.4 4 usuários não-paciente com `aec_assessment_state` órfão
Admin/pro que testaram AEC como paciente deixaram state em INTERRUPTED/IDENTIFICATION/COMPLAINT_DETAILS. Resultado: qualquer mensagem desses usuários era interpretada como resposta ao FSM, trancando a conversa.

**Fix:**
- Cleanup pontual (DELETE dos 4 órfãos)
- V1.9.19 aplica role guard no frontend: FSM só carrega state se role=patient

### 3.5 5 triggers redundantes em `auth.users`
- `on_auth_user_created` + `on_auth_user_created_profile` + `trg_auth_users_to_user_profiles` + `trg_handle_new_auth_user` + `trg_link_existing_user`
- Dois chamam a MESMA função (`handle_new_auth_user`) — duplicação direta.
- Três inserem em `user_profiles` com `ON CONFLICT DO NOTHING` — primeiro alfabético (`handle_new_user_profile`) ganha e só insere `points/level`, deixando email/full_name/role NULL.

**Estado observado (antes do backfill):** 34 user_profiles totais, 0 com full_name, 10 sem email, 15 sem role. **Pós-backfill:** 27/27 com email+full_name+role.

**Proposta de consolidação** documentada em `docs/ANALISE_TRIGGERS_AUTH_USERS_24_04_2026.md` — aguarda decisão (signup é crítico, precisa testes antes).

### 3.6 Sync-gcal é feature intencional, não lixo
Infra completa codificada:
- `sync-gcal` Edge Function (cron com exponential backoff)
- `google-auth` Edge Function (fluxo OAuth)
- `sprint_1_gcal_setup.sql` (tabelas `professional_integrations` + `integration_jobs` + trigger `enqueue_gcal_job` + colunas gcal em appointments)

**Status:** nunca rodou em produção. Decisão: preservar, ativar quando houver demanda do profissional. Não é "quarto vazio pra demolir".

---

## 4. Timeline Arquitetural (puxando diários anteriores)

### Fevereiro 2026 — Fundação
- `DIARIO_DE_BORDO_MESTRE_2026-02-19.md` / `02-20` — estabelecimento da arquitetura base: Supabase + React + Deno Edge Functions; primeiros protocolos clínicos IMRE.
- `DIARIO_LIVRO_MAGNO_06-02-2026.md` — documentação mestre do modelo proposto (3 eixos: Clínica, Ensino, Pesquisa).

### Março 2026 — Consolidação de Governança
- `DIARIO_MESTRE_02_03_2026.md`, `DIARIO_CONSOLIDADO_22_27_MARCO_2026.md` — maturação do Core (tradevision-core), triggers imutáveis, AEC como protocolo soberano.
- Supabase Seal V6.0 (RLS hardening, CORS dinâmico, smoke tests).

### Abril 2026 — Estabilidade Clínica e Blindagem
- **02-05/04** — AEC em forma: reports com `content.lista_indiciaria/identificacao` direto, `professional_id` populado (o padrão que V1.9.20 restaurou hoje).
- **08-09/04** — `DIARIO_09_04_2026_ARQUITETURA_E_COMPLIANCE.md`: `noa_lessons` tabela-rainha para conteúdo educacional; preservação de `courses/modules/lessons` legados.
- **10/04** — `DIARIO_10_04_2026_AUDITORIA_LOGS.md`, `DIARIO_10_04_2026_MAPA_TERMINAIS_EIXOS.md`: auditoria de terminais e mapa de eixos.
- **13/04** — `DIARIO_MESTRE_CONSOLIDADO_13_04_2026.md`: Supabase Seal V6.0; forum RLS liberado; reconhecimento de bug do trigger órfão dormindo 2m21d "testes E2E deveriam ter pegado em 02/02".
- **15/04** — `DIARIO_15_04_2026_ENDURECIMENTO_E_LGPD.md`: endurecimento LGPD, `anonymize_user_safely`.
- **16/04** — `DIARIO_16_04_2026_INTEGRACAO_GCAL_ARQUITETURA.md`: Google Calendar — cofre de tokens (WebCrypto AES-GCM), outbox pattern, exponential backoff. "Prédio seco, chaves na nuvem, fios da rua para plugar". Backend + DB concluídos, UI pendente.
- **22-23/04** — `DIARIO_22_04_2026_UNIFICADO.md`, `DIARIO_23_04_2026_ESTABILIDADE_CLINICA_ONTOLOGIA_ESTRITA.md`: single-orchestrator refactor, consent gate fail-closed server-side, V1.9.1 completude derivada, V1.9.8 context enrichment do paciente. 25+ commits em um dia — o dia que depois precisou de acabamento.
- **24/04 (hoje)** — Restauração e blindagem (este diário).

---

## 5. Visão Arquitetural Consolidada (estado atual)

### 5.1 Produto
**MedCannLab** — marketplace clínico cognitivo sobre 3 eixos:
- **Clínica** — Dr. Ricardo Valença (fundador médico), AEC 001, DRC, prescrição CFM
- **Ensino** — Dr. Eduardo Faveret (fundador ensino), LessonPreparation, conteúdo educacional
- **Pesquisa** — base de 46 documentos curados (research + protocols + ai-documents + multimedia + cases + protocolo_clinico)

### 5.2 Arquitetura de Runtime
- **Frontend:** React + Vite + TypeScript, hospedado via Lovable
- **Backend:** Supabase (Postgres + Edge Functions Deno)
  - 9 Edge Functions: `tradevision-core` (Core Nôa), `digital-signature`, `send-email`, `sync-gcal`, `google-auth`, `wisecare-session`, `video-call-*`, `extract-document-text`
- **IA:** OpenAI GPT-4o-mini orquestrada pelo Core Nôa

### 5.3 Nôa Esperança (IA Residente) — Orquestração
Não é monólito. Camadas no frontend:
- `src/lib/noaResidentAI.ts` — entrypoint, monta payload + dispatcher
- `src/lib/noaCommandSystem.ts` — triggers de comando
- `src/lib/noaPermissionManager.ts` — governança por role
- `src/lib/noaEsperancaCore.ts` — identidade/voz
- `src/lib/buildPatientContext.ts` + Professional + Admin + Student — **context enrichment por role** (V1.9.8/15/16/17)
- `src/lib/clinicalAssessmentFlow.ts` — FSM AEC (state machine, 17 fases)
- `src/lib/clinicalGovernance/*` (11 arquivos) — submódulo de governança clínica
- `src/lib/medcannlab/*` (8 arquivos) — integrações

### 5.4 Core Backend (tradevision-core)
- 4268 linhas; governança central
- Responsável por:
  - Detecção de intent (regex precisos + prompt GPT)
  - Injeção de `userContext` no prompt com regras não-negociáveis
  - Orquestração de finalização AEC (handleFinalizeAssessment)
  - Comandos de plataforma (`app_commands`, filtrados por role)
  - Idempotência via `noa_pending_actions` e UNIQUE em `interaction_id`

### 5.5 Banco de Dados
- **130+ tabelas com RLS** | **403 policies** | **76 triggers ativos** | **90+ funções SECURITY DEFINER**
- Core clínico: `aec_assessment_state`, `clinical_reports` (64 total), `cognitive_events` (1.445+ audit), `cfm_prescriptions`
- Monetização: `appointments`, `wallets`, `wallet_transactions`, `referral_bonus_cycles`, `transactions`
  - 4 triggers em completed: `handle_appointment_completed`, `set_referral_marco_zero`, `process_appointment_referral_bonus`, `tg_appointment_to_transaction`
  - BEFORE INSERT em wallet_transactions: `tg_apply_wallet_transaction` calcula split 70/30 automático
  - AFTER INSERT/UPDATE: `tg_wallet_balance_sync` atualiza `balance_available`/`balance_pending`
- Integridade nova (V1.9.21): `sync_doctor_professional_id` BEFORE em appointments/clinical_reports/clinical_kpis
- Conformidade LGPD: `anonymize_user_safely`, soft delete whitelist

### 5.6 Fluxo Clínico Completo (validado hoje)
1. Paciente conversa com Nôa (context enrichment injeta dias no app, próxima consulta, trial)
2. Nôa conduz AEC 001 via FSM (17 fases); estado persiste em `aec_assessment_state`
3. Ao chegar em CLOSING/CONSENT_COLLECTION, frontend monta `aecFinalizationData` estruturado (V1.9.20)
4. Backend detecta `[ASSESSMENT_COMPLETED]`, chama `handleFinalizeAssessment`
5. Consent gate server-side fail-closed valida `content.consenso.aceito`
6. Narrador GPT gera markdown estruturado
7. Persiste `clinical_reports` com `content.{lista_indiciaria, identificacao, consenso, ...}` direto + `content.raw` + `content.structured`
8. Emite app_commands: "Ver Relatório", "Agendar Consulta"
9. Paciente agenda via widget; `appointment` criado com `professional_id` (sync trigger garante `doctor_id` também)
10. Profissional completa consulta → `status='completed'` dispara 4 triggers → `wallet_transaction` criada com split 70/30

---

## 6. Visão Proposta (o que ainda falta)

### 6.1 Alta prioridade — antes de abrir público
- **Testes automatizados E2E** — FSM AEC, consent gate, triggers de monetização. Diários próprios admitem ter faltado (trigger órfão dormiu 2m21d). Rede de segurança pra todos os refactors futuros.
- **Decisão Stripe Connect vs Mercado Pago** — infra financeira pronta termina em `status='pending'`. Falta plugar o gateway real.
- **Assinatura digital AC real** — `digital-signature` hoje gera fake; prescrições CFM sem validade jurídica externa. Irrelevante enquanto só admins testam, crítico ao abrir.
- **WiseCare produção** — session_id hardcoded em homolog.

### 6.2 Média prioridade — polimento de feature
- **UI "Conectar Google Agenda"** — infra deployada em 16/04, falta botão no dashboard do profissional.
- **Consolidação triggers `auth.users`** — análise em `docs/ANALISE_TRIGGERS_AUTH_USERS_24_04_2026.md`, 5 triggers em 1 função unificada.
- **Idempotência de reports** — 9 reports em 2h pra mesma paciente (23/04); janela de 30s do `handleFinalizeAssessment` não pegou.
- **`patient_doctor_binding` explícito** — tabela de vínculo paciente-profissional como fonte de verdade (plano documentado); remove dependência do fallback hardcoded.

### 6.3 Baixa prioridade — decisões de produto
- **Ativar ou parar:** `forum_posts` (0 rows), `gamification_points` (0 rows), `lessons` (0 rows) — cada um com decisão explícita.
- **3 motores clínicos** — `clinicalAssessmentFlow` + `unifiedAssessment` + `clinicalReportService` coexistem como camadas (decisão 23/04). Eventual unificação depende de valor mensurado.
- **Fase 4 (DROP `doctor_id`)** — só após testes E2E + 2 semanas de observação sem escrita na coluna legada.

### 6.4 Princípios arquiteturais afirmados hoje
1. **Append-only por padrão** — nada foi removido em V1.9.21 (sync trigger preserva ambas colunas).
2. **Investigar antes de remover** — 412 slides pareciam lixo, mas descobriu-se origem em LessonPreparation (feature real).
3. **Observabilidade sobre silêncio** — `RAISE LOG` no trigger de sync torna divergência futura auditável.
4. **Polir, não reinventar** — diretriz Pedro afirmada hoje, registrada em memória.

---

## 7. Lições do Dia

- **Regex catch-all no Core é bug surface** — "quantos temos" casava com detector de documentos. Todos os detectores precisam exigir termo explícito no 2º predicado.
- **Refactors "single orchestrator" precisam cobrir o CONTRATO de persistência**, não só a invocação — perdemos `lista_indiciaria` estruturada em 22/04 porque o backend passou a extrair via GPT em vez de receber o payload pronto.
- **Deploy manual da Edge Function é gargalo real** — fixes V1.9.11→V1.9.20 só surtem efeito após `supabase functions deploy tradevision-core`. Fluxo automatizado seria mais seguro.
- **Token de Supabase exposto em chat = compromisso** — mesmo quando já vazou, rotacionar é obrigatório (ação pendente do Pedro).
- **Diários mostram construção, sistema mostra realidade** — hoje precisei validar cada suposição dos diários contra queries reais; encontrei 3 discrepâncias (órfãos auth já resolvido, imre dropada, features dormentes com intenção original).

---

## 8. Pendências Registradas

| Item | Status |
|---|---|
| Rotação do PAT `sbp_5b10cf6d...` | **Pendente Pedro** — revogar + `npx supabase login` |
| Testes automatizados E2E | Pendente — próxima prioridade arquitetural |
| Consolidação `auth.users` triggers | Documentada, aguarda autorização pra executar |
| Decisão sobre features dormentes | Pendente discussão com Ricardo/Eduardo |
| Bug idempotência reports (9/2h) | Mapeado, não atacado ainda |
| Stripe/Mercado Pago | Pendente decisão de produto |
| Assinatura AC + WiseCare produção | Pendente (irrelevante sem paciente externo) |

---

## 9. Fecho

Uma semana atrás o sistema me identificava como "Usuário" genérico. Hoje ele respondeu "Pedro Henrique Passos Galluf, conexão administrativa confirmada". Entre um e outro: 3 bugs visíveis identificados, 11 versões entregues, 1 migração versionada, 1 princípio reafirmado.

O coração da arquitetura continua o mesmo — Core + FSM AEC + RLS + triggers de monetização. O que mudou hoje foi a camada em volta: regex precisos, role guards, context enrichment, schema de reports restaurado, colunas legadas blindadas.

**Amanhã:** a escolha será entre atacar a rede de segurança (testes E2E) ou seguir polindo camadas (idempotência, features dormentes, UI gcal). O coração aguenta ambos.

— Registro gerado a 4 mãos: Pedro (CTO) e IA assistente (Claude Opus 4.7, sessão 24/04/2026).
