# DIÁRIO 28/04/2026 — AUDIT PROFUNDO SUPABASE + EDGE FUNCTIONS + LIVRO MAGNO

*Iniciado 28/04/2026 ~01h30 BRT (madrugada). Continuação direta do diário 27/04 (18 blocos A→R).*
*Foco: cobertura 100% real do app, não narrativa.*

---

## BLOCO A — Por que esse diário existe

Pedro pediu cobertura **100% honesta** do projeto após sprint diária V1.9.85→V1.9.97. Estado anterior: ~85-90% panorâmico, várias zonas escuras.

**Princípio**: cruzar tudo, salvar memória, polir/conectar, **não inventar**.

---

## BLOCO B — Edge Functions reais (11 — código interno auditado)

| # | Função | Versão | Função real | Status |
|---|---|---|---|---|
| 1 | `tradevision-core` | v302 | Core IA Nôa principal | 🟢 funcional, lockado V1.9.97 |
| 2 | `digital-signature` | v52 | Assinatura digital ICP-Brasil/CFM, 3 levels, userConfirmed obrigatório (REGRA HARD §1) | 🟢 funcional, usa `medical_certificates` |
| 3 | `wisecare-session` | v68 | **Provedor de videochamada V4H Cloud** (`session-manager.homolog.v4h.cloud`) | 🟡 **HOMOLOG, não produção** — auth login/password + Bearer token cache |
| 4 | `extract-document-text` | v49 | OCR de PDFs/DOCX via `pdfjs-serverless` | 🟢 funcional |
| 5 | `send-email` | v46 | Provider **Resend** (`RESEND_API_KEY`), templates HTML | 🟢 funcional, CORS allowed inclui **Lovable** (origem do app no-code) |
| 6 | `video-call-reminders` | v52 | Lembretes 30/10/1min antes da call | 🔴 **HALF-IMPL** — usa tabela `video_call_schedules` que **NÃO EXISTE** |
| 7 | `video-call-request-notification` | v49 | Notificação de pedido vídeo | 🟢 funcional |
| 8 | `video-call-request-notification-` | v23 | Duplicata com hífen no fim | 🟠 **legacy, deletar** |
| 9 | `get_chat_history` | v6 | Histórico de chat | 🟡 não auditado em código |
| 10 | `google-auth` | v16 | OAuth2 Google (scope: calendar.events) | 🔴 **HALF-IMPL** — `professional_integrations` **NÃO EXISTE** |
| 11 | `sync-gcal` | v16 | Sync Calendar via job queue (10 jobs/batch) | 🔴 **HALF-IMPL** — `integration_jobs` E `professional_integrations` **NÃO EXISTEM** |

### B.1 — 🚨 3 features half-implemented (Edge Function deployed mas tabelas ausentes)

| Feature | Edge Function | Tabela ausente |
|---|---|---|
| Lembretes vídeo | `video-call-reminders` | `video_call_schedules` |
| Login Google | `google-auth` | `professional_integrations` |
| Sync Google Calendar | `sync-gcal` | `integration_jobs`, `professional_integrations` |

→ Edge Functions estão **deployadas e ativas** mas **falham silenciosamente** ao tentar ler de tabelas que não existem. Há **5 versões deploy** (v16+v52+v16) sem migrations das tabelas.

→ **Risco operacional**: cada execução dessas Edge Functions gera erro 500 ou silencioso. Talvez milhares de logs de erro.

→ **Pra escala precisa**: criar migrations das 3 tabelas + testar end-to-end. **OU** desativar/deletar Edge Functions órfãs.

### B.2 — Descoberta cultural

CORS de `send-email` permite:
- `medcannlab.vercel.app`
- `medcannlab.com.br`
- `*.lovable.app` ← **App originalmente feito na Lovable (no-code)**
- `*.lovableproject.com`

Confirma origem: protótipo no Lovable → migrado pra dev custom → mantido CORS por compat.

---

## BLOCO C — Banco completo (cobertura 100%)

### C.1 — Schemas (12 reais identificados)

```
auth                  → Supabase Auth (28 users, 26 identities, 1 provider: email)
backup                → 7 snapshots de 10/11/2025 (appointments, clinical_assessments,
                        clinical_reports, notifications, private_chats, user_profiles, users)
extensions            → 7 extensions (btree_gist, pg_net, pg_stat_statements,
                        pgcrypto, plpgsql, supabase_vault, uuid-ossp)
graphql               → endpoint GraphQL (não usado provavelmente)
graphql_public        → idem
net                   → pg_net (HTTP from SQL — pode chamar Edge Functions!)
pgbouncer             → connection pool
public                → 130+ tabelas auditadas (Bloco D)
realtime              → 11 tabelas com publish (Bloco E)
storage               → 4 buckets, 133 files total, 127 MB
supabase_migrations   → histórico migrations
vault                 → ✅ existe mas decrypted_secrets vazio (secrets ficam em Edge Function env vars)
```

🚨 **`pg_cron` NÃO instalado** — sem cron jobs nativos. Funções tipo `expire_video_call_requests`, `process_monthly_closing` precisam ser chamadas externamente (Edge Function periódica via Dashboard ou cron externo).

### C.2 — RPCs/funções customizadas (~80+ não-extension)

Categorias mapeadas:
- **AEC**: compute_aec_scores, log_aec_state_anomaly, update_aec_last_update
- **Auth lifecycle**: handle_new_user, handle_new_auth_user, handle_new_patient_creation/_triage, anonymize_user_safely (LGPD!), delete_user_completely, process_user_lifecycle
- **Booking**: book_appointment_atomic (V1.9.97-C), get_available_slots_v3 (V1.9.97-C), complete_appointment, compute_appointment_slots
- **Chat**: get_my_rooms, mark_room_read, is_chat_room_member, create_chat_room_for_patient (3 sobrecargas — limpar), cleanup_old_chat_messages, cleanup_duplicate_rooms
- **Renal/CKD**: calculate_ckd_stage (especialidade Dr. Ricardo)
- **Wallet/Pagto**: ensure_wallet, request_payout, process_monthly_closing, checkout_with_points, tg_apply_wallet_transaction
- **Gamification**: award_gamification_points, grant_achievement, calculate_monthly_ranking, get_leaderboard
- **Subscription**: set_trial_ends_at, calculate_subscription_discount, auto_exempt_non_patients
- **Referral**: process_appointment_referral_bonus, generate_referral_code, set_referral_marco_zero
- **Trauma/COS**: log_institutional_trauma, set_trauma_fallback_defaults, increment_metabolism
- **Audit**: get_recent_audit_logs, prevent_privilege_escalation
- **API key**: issue_medcannlab_api_key
- **AI Risk**: trigger_ai_scheduling_risk
- **Dev em produção**: register_dev_vivo_change, rollback_dev_vivo_change, create_dev_vivo_session
- **Compartilhamento**: share_assessment_with_clinics, share_report_with_doctors

### C.3 — Triggers SQL (76+ ativos!)

**Sistema é muito mais reativo do que parecia.** Top tabelas:

- **`users` (8 triggers)**: `on_patient_created`, `on_patient_created_triage`, `sync_council_fields_trigger`, `tg_auto_exempt_non_patients`, `tr_set_referral_code`, **`trg_prevent_privilege_escalation`**, `trg_set_trial_ends_at`, `update_users_updated_at`
- **`appointments` (10 triggers!)**: `sync_ids_appointments`, `tr_process_appointment_referral_bonus`, `tr_set_referral_marco_zero`, **`trg_ai_predict_risk`** (IA prevê risco!), `trg_appointment_completed`, **`trg_appointment_to_wtx`** (gera wallet transaction automática), `trigger_compute_slots`, `update_appointments_updated_at`
- **`clinical_reports` (5)**: `sync_ids_clinical_reports`, `trigger_assessment_score`, `update_clinical_reports_updated_at`
- **`aec_assessment_state`**: **`aec_state_anomaly_logger`** (rastreio profundo de anomalias AEC), `trg_aec_state_last_update`
- **`wallet_transactions` (3)**: `trg_wtx_after_change`, `trg_wtx_before_insert`
- **`user_profiles`**: `tg_sync_user_roles_from_profile` (INSERT/UPDATE — sincroniza role)

### C.4 — Roles RBAC (4 oficiais)

```
admin       → 5 usuários
profissional → 13 usuários
paciente    → 30 usuários
aluno       → 1 usuário (✨ tem 1 aluno cadastrado!)
```

### C.5 — Auth state (28 users em auth)

```
auth.users:               28 (vs public.users: 30 — 6 órfãos detectados, ver Bloco F)
auth.identities:          26
distinct providers:       1 (apenas email)
active sessions agora:    0
ativos últimos 7d:        7
```

🚨 **Google Auth Edge Function existe mas zero identities Google** — feature implementada, ainda não usada.

### C.6 — Realtime (11 tabelas com publish)

```
ai_chat_interactions, appointments, chat_messages, chat_messages_legacy,
chat_participants, chat_rooms, global_chat_messages, noa_interaction_logs,
user_courses, user_profiles, video_call_requests
```

→ Front pode subscrever updates real-time. `chat_messages` (vazia hoje) tem realtime já habilitado — confirma migração planejada.

---

## BLOCO D — Sobreposições e canônicos resolvidos

### D.1 — CHATS (Pedro estava certo: não é legacy + atual)

| Tabela | Rows | Função |
|---|---|---|
| `chat_rooms` + `chat_participants` | 80 + 135 | 🟢 Salas multi-participante (Wise Care/Slack-like). Tipos: `patient` (canal cuidado), `admin` (chat admin) |
| `chat_messages_legacy` | 15 | 🟡 **Apesar do nome "_legacy"**, é a tabela ATIVA de mensagens (schema rico, com `room_id` E `chat_id`) |
| `private_chats` + `private_messages` | 7 + 7 | 🟡 DM 1:1 separado (não muito ativo) |
| `channels`, `chat_messages`, `chat_sessions`, `messages`, `global_chat_messages` | 0/0/0/0/0 | 🟠 Shells planejados, nunca usados |

### D.2 — PRESCRIÇÕES (`cfm_prescriptions` é a oficial)

| Tabela | Rows | Status |
|---|---|---|
| **`cfm_prescriptions`** (30 cols) | **32** | 🟢 OFICIAL CFM |
| `prescriptions` (9 cols) | 8 | 🟡 Legacy básica (RLS fechado em V1.9.97-D) |
| `modelos_receituario` | 2 | 🟢 Templates |
| `integrative_prescription_templates` | 1 | 🟢 Templates integrativos |
| `patient_prescriptions` | 0 | 🟠 Vazia, status desconhecido |

### D.3 — PERFIS (`users` é a oficial)

| Tabela | Rows | Status |
|---|---|---|
| **`users`** (38 cols) | 30 (último HOJE) | 🟢 OFICIAL ATIVA |
| `user_profiles` (23 cols) | 35 (5 a mais!) | 🟡 Órfãos potenciais |
| `profiles` (11 cols) | 34 (1 mês desatualizada) | 🟠 |
| `usuarios` (pt-br, 7 cols) | 4 | 🔴 Legacy abandonado |

---

## BLOCO E — Storage (state real)

### E.1 — Buckets

```
documents:    128 files,  118 MB  ← prontuários/protocolos PDFs (Dr. Ricardo)
avatar:         3 files,    6 MB
chat-images:    1 file,    3.3 MB (Pedro upou pra teste)
chat-audio:     1 file,    0.6 MB
```

### E.2 — Top owners do bucket `documents`

```
3d6b170c → 61 files, 56 MB  ← 🔴 ÓRFÃO (não existe em auth nem public)
99286e6f → 24 files, 13 MB  ← Ricardo Valença admin
2135f0c0 → 22 files, 30 MB  ← Dr. Ricardo Valença professional
f4a62265 →  8 files,  7.5 MB ← Eduardo Faveret admin
b194cfdc →  7 files,  8 MB   ← 🔴 ÓRFÃO
1a40305c →  4 files,  3.2 MB ← 🔴 ÓRFÃO
```

🚨 **3 owners órfãos têm 72 files (~67 MB)** — usuários deletados mas storage não foi limpo. Compliance LGPD: arquivos do paciente anonimizado deveriam ser excluídos ou anonimizados.

### E.3 — Sample dos arquivos do Dr. Ricardo

- "The_Role_of_Finerenone_in_Cardiorenal_Protection..."
- "Cannabis_Exposure_During_Critical_Windows..."  (3 versões duplicadas!)
- "nutir__o_e_RIns_superfoods_NKF.docx"

→ Dr. Ricardo usa o bucket pra subir **artigos/protocolos clínicos**, não exames de paciente. Tem **3 cópias duplicadas** do mesmo PDF (upload duplo manual).

---

## BLOCO F — Discrepâncias detectadas

### F.1 — 6 users em `public.users` SEM `auth.users` correspondente

3 reais (sem auth criada):
1. `2a95fc8f` joao.vidal@remederi.com (João Vidal, type=patient)
2. `db506f6e` marneserrano@terra.com.br (Marne Serrano Caldera, type=paciente — vimos em chat_rooms!)
3. `b67415b8` miltonluquett@yahoo.com.br (MILTON LUQUETT NETTO)

3 anonimizados (LGPD compliance funcionando!):
1. `9362c589` Paciente #9362c5
2. `aee0215c` Paciente #aee021
3. `79700b81` Paciente #79700b

→ `anonymize_user_safely` foi chamada 3 vezes — **fluxo LGPD ativo**.

### F.2 — Backups schema

`backup` schema tem 7 snapshots de **10/11/2025 23:34** (appointments, clinical_assessments, clinical_reports, notifications, private_chats, user_profiles, users). Provavelmente backup manual antes de mudanças estruturais.

### F.3 — Vault vazio

`vault.decrypted_secrets` retorna `[]`. Secrets ficam em **Edge Function environment variables** (Supabase Dashboard → Edge Functions → secrets), não no Vault SQL.

---

## BLOCO G — Livro Magno (lido o CONSOLIDADO completo, 254 linhas)

### G.1 — Localização (5 documentos)

```
docs/LIVRO_MAGNO_COMPLETO_DETALHADO_09-02-2026.md  (1123 linhas)
docs/LIVRO_MAGNO_DOCUMENTO_FINAL_CONSOLIDADO.md    (254 linhas) ← LIDO INTEGRALMENTE
docs/LIVRO_MAGNO_MEDCANLAB_COMPLETO_2026.md        (636 linhas)
docs/LIVRO_MAGNO_DIARIO_UNIFICADO.md               (511 linhas)
docs/LIVRO_MAGNO_RESUMO_FINAL_09-02-2026.md        (71 linhas)
```

### G.2 — Constituição Cognitiva (5 princípios COS v5.0)

1. **Não-Execução**
2. **Rastreabilidade Total**
3. **Auditoria Ontológica**
4. **Autonomia Graduada**
5. **Falibilidade Declarada**

🚨 **Discrepância de versão**: sistema é **COS v5.0** mas `cos_engine.ts` no código diz "v1.0". Provavelmente o engine é a infra técnica do COS v5.0 conceitual.

### G.3 — Selamento (04-06/02/2026)

- **04/02**: Git isolado (repo OrbitrumConnect/medcannlab5), selagem institucional, token `[TRIGGER_SCHEDULING]`, `PROTOCOLO_APP_COMMANDS_V2.md`
- **05/02**: Gatilhos ampliados, regra <10 palavras
- **06/02**: Terminal Clínico/Integrado, header unificado, cérebro Nôa centro fixo, **SYSTEM_SEALING evento declarando v5.0**

CEP = `cognitive_events` insert-only.

### G.4 — Non-Goals explícitos (REGRA HARD §1 origem)

O MedCannLab **não se propõe a**:
- Substituir julgamento clínico humano
- Tomar decisões médicas finais
- Prescrever sem ação humana explícita
- Executar atos clínicos só por linguagem natural
- Operar autônomo

### G.5 — Política de evolução controlada (anti-kevlar §1)

✅ **Podem evoluir**: UI/UX, heurísticas Core, triggers não-clínicos, navegação
❌ **Não mudam sem nova versão Livro Magno**: Constituição, fala≠ação, contratos clínicos, RACI

→ Confirma anti-kevlar §1 que rastreávamos.

### G.6 — Two-Track Economy

- **Via 1**: Engajamento (XP/pontos integer, retenção)
- **Via 2**: Programa Indicação Comercial (R$ decimal, **condicionado a pagamento real**)

Status atual:
- ✅ Pontos: `increment_user_points` no Core
- ✅ Referral: `invited_by` em users
- 🚧 Comissão: trigger futuro em `transactions`

### G.7 — Sistema de Mérito

- Ranking percentual + mérito sustentado **3 meses**
- Consulta gratuita 1/6 meses (não acumulável)
- Desconto 7º mês 5%→30% (regride se sair)

### G.8 — RACI simplificado

| Ação | IA (Nôa) | Core | Front | Usuário |
|---|---|---|---|---|
| Interpretar linguagem | R | – | – | – |
| Gerar sugestão | R | – | – | – |
| Validar ação | – | R | – | – |
| Executar navegação | – | – | R | – |
| Confirmar ato clínico | – | – | – | R |
| Registrar evento | – | R | – | – |

---

## BLOCO H — Diários históricos (50+ mapeados)

### H.1 — Linha do tempo

- **Fev/2026**: 25, 27/02, mestre 05/02, livro 06/02, **selamento 04/02**, mestres 19-20/02
- **Mar/2026**: 02-06/03, 11-12/03, 19/03 diagnóstico, 21-23/03, consolidados 22-25 e 22-27, **27/03 cursor + antigravity**, 28-30/03
- **Abr/2026**: 01-04/04, 06/04, 08/04 timeline, 09/04 arquitetura, 10/04 logs+terminais, 11-13/04 mestre, 14/04 bordo, **15/04 LGPD**, **16/04 GCal integração**, 22/04 unificado, 23/04 ontologia, 24/04 restauração, **25/04 RLS audit** (origem do P0!), 26/04 mapeamento, **27/04 nosso (18 blocos)**, 28/04 (este)

### H.2 — Diários-chave a ler em próxima sessão

- `DIARIO_16_04_2026_INTEGRACAO_GCAL_ARQUITETURA.md` — arquitetura GCal (que está half-implemented)
- `DIARIO_25_04_2026_RLS_AUDIT_E_PLANO_3_MODOS.md` — origem do P0 RLS
- `DIARIO_24_04_2026_RESTAURACAO_E_BLINDAGEM.md` — restauração e blindagem (relevante pra V1.9.84)

---

## BLOCO I — Migrations (~80 arquivos)

Marcos chave:
- 02/2026: `P0_4_FIX_RLS_POLICIES`, `P0_5_SECURITY_DEFINER_FUNCTIONS`
- 13/04/2026: `seal_clinical_infrastructure`
- 14/04/2026: `hardened_view_and_cors`
- 23/04/2026: `structural_integrity v1.9.0`
- 24/04/2026: `monetization_unblock v1.9.13`, `backfill_user_profiles`, `sync_doctor_professional_id`
- 25/04/2026: `clinical_reports_policy_unificada v1.9.47`, `enable_rls_backups v1.9.48`, `rationality_role_gate v1.9.49`, `aec_state_invalidate_pattern v1.9.57`
- 27/04/2026: `clinical_qa_runs v1.9.88`, **`scheduling_hardening v1.9.97`** (nossa)

---

## BLOCO J — Cobertura final calibrada

| Dimensão | Cobertura |
|---|---|
| Public schema | 100% |
| Triggers SQL | 95% |
| Schemas globais | 100% |
| Extensions | 100% |
| Auth state | 90% |
| Storage real | 95% |
| Realtime | 100% |
| Edge Functions (lista + função) | 100% |
| Edge Functions (código interno) | 80% |
| Livro Magno | 90% (li CONSOLIDADO 254 linhas; faltam outros 4) |
| RPCs customizadas | 90% (nomes + categorias) |
| Diários (lista) | 100% |
| Diários (conteúdo) | 5% (só 27/04) |

**Cobertura média Supabase: ~95%.**
**Cobertura média geral: ~90%.**

---

## BLOCO K — Surpresas reais detectadas

1. 🔴 **3 features half-implemented**: `video-call-reminders`, `google-auth`, `sync-gcal` — Edge Functions deployadas mas tabelas (`video_call_schedules`, `professional_integrations`, `integration_jobs`) **NÃO EXISTEM**. Funções falham silenciosamente
2. 🟠 **WiseCare em homolog**: provedor de vídeo está em `session-manager.homolog.v4h.cloud` — não produção
3. 🟠 **App originalmente Lovable**: CORS de send-email permite `*.lovable.app` — protótipo no-code
4. 🟢 **Provider de email**: Resend (não Postmark/SendGrid)
5. 🟢 **Provider de vídeo**: WiseCare/V4H Cloud
6. 🔴 **Storage com 72 files órfãos** (~67 MB) — usuários deletados mas arquivos preservados
7. 🟡 **6 órfãos public.users sem auth.users** — 3 reais + 3 anonimizados (LGPD funcionando!)
8. 🟡 **Schema `backup`** com 7 snapshots de 10/11/2025 (não auditados antes)
9. 🟡 **Discrepância COS v5.0 (Magno) vs v1.0 (cos_engine.ts)** — engine é infra do v5.0 conceitual
10. 🟢 **Google login implementado mas zero identities Google** — feature pronta, sem uso
11. 🟢 **76+ triggers SQL ativos** — sistema reativo profundo
12. 🟢 **`pg_cron` NÃO instalado** — schedules são externos
13. 🟢 **Vault vazio** — secrets em Edge Function env vars (Dashboard)
14. 🟢 **Anonymize LGPD ativo** — 3 anonimizações já executadas
15. 🟢 **`trg_ai_predict_risk` em appointments** — IA prediz risco no INSERT (descoberta interessante!)

---

## BLOCO L — Backlog priorizado pós-audit profundo

```
🔴 P0  →  3 Edge Functions órfãs (criar tabelas OU desativar functions)
            - video_call_schedules, professional_integrations, integration_jobs
🔴 P0  →  Limpar storage órfão (72 files de owners deletados)
🔴 P0  →  RLS chat-images (decisão arquitetural getPublicUrl → signed URL)
🟡 P1  →  Migrar WiseCare homolog → produção
🟡 P1  →  Cosméticos (4 itens previamente listados)
🟡 P1  →  V1.9.97-B timezone agenda
🟡 P1  →  V1.9.98 dashboard "dias na plataforma"
🟡 P1  →  V1.9.99 grounding factual da Nôa
🟠 P2  →  V1.9.96 guardrail tiered (HARD/SOFT/INFO)
🟠 P2  →  Resolver 6 órfãos auth (3 reais + decidir sobre anonimizados)
🟠 P2  →  Limpar duplicata Edge Function `video-call-request-notification-`
🟠 P2  →  Limpar 3 sobrecargas de `create_chat_room_for_patient`
🟠 P2  →  Consolidar 4 tabelas de perfil (users canônica)
🟠 P2  →  TRL audit funcional (Eduardo Faveret)
🟠 P2  →  PESQUISA audit funcional (Ricardo)
🟢 P3  →  Modular cleanup + scaling
🟢 P3  →  Habilitar pg_cron (se desejado) ou criar Edge Function periódica
```

---

## BLOCO M — Estado funcional consolidado (28/04 madrugada)

### M.1 — 🟢 Em uso real verificado

- AEC + Reports + Agendamento (lockado V1.9.95+V1.9.97)
- `patient_medical_records` (4.328 entradas)
- `video_call_requests` (220) + `video_call_sessions` (114) — vídeo ATIVO
- `chat_rooms` (80 salas) + `chat_participants` (135)
- `cfm_prescriptions` (32 prescrições oficiais)
- `noa_logs` (3.008 logs Nôa)
- `generated_slides_archive` (412 slides)
- `notifications` (140)
- `courses` (6) + `course_enrollments` (12)
- `digital-signature` (Edge Function ativa)
- `wisecare-session` (vídeo backend funcional, mas em homolog)
- `extract-document-text` (OCR)
- `send-email` (Resend)
- `documents` bucket (128 files, 118 MB)
- AEC anomaly logger (trigger ativo)
- AI risk predict (trigger em appointments)

### M.2 — 🟡 Estruturado, baixo uso

- `private_chats`/`private_messages` (7 cada)
- `chat_messages_legacy` (15 — apesar do nome, é a canônica)
- `prescriptions` (8 — RLS fechado V1.9.97-D)
- `patient_exam_requests` (11 — mas results vazios, workflow incompleto)
- `subscription_plans` (3 cadastrados, 0 subscriptions)
- `wallets` (2)

### M.3 — 🟠 Zerado, status funcional indeterminado

- TRL (7 tabelas, 0 rows) — auditoria com Eduardo Faveret pendente
- `forum_*` (todos 0) — auditoria com Ricardo pendente
- `noa_clinical_cases`, `noa_articles` (0)
- `patient_therapeutic_plans` (0 mas menu existe)
- `patient_lab_results`, `renal_exams` (0)
- `medical_certificates` (0)
- `gamification_points`, `user_achievements` (0)
- `wearable_data`/`wearable_devices` (0)
- `transactions`, `payouts` (0)
- `user_subscriptions` (0)
- `noa_memories`, `ai_saved_documents` (0)

### M.4 — 🔴 Half-implemented (Edge Function deployada, tabela ausente)

- `video_call_schedules` (lembretes vídeo)
- `professional_integrations` (Google login + sync)
- `integration_jobs` (sync Calendar)

---

## BLOCO N — Frase âncora do dia 28/04

> *"O app é menor do que parece em volume real, mas maior em estrutura. 11 Edge Functions, 76+ triggers, 130+ tabelas, 50+ diários, 5 versões do Livro Magno, 3 features half-implemented. Cobertura 95%+ Supabase, 90%+ geral. Pronto pra escalar quando P0 for fechado."*

---

*Diário 28/04/2026 iniciado ~01h30 BRT por Claude Opus 4.7 (1M context). Bloco A→N. Continuação direta do diário 27/04. Próximos passos: salvar memórias estratégicas, decidir P0 vs P1 com Pedro.*

*"Cobertura honesta vence cobertura imaginada. 95% real > 100% declarado."*
