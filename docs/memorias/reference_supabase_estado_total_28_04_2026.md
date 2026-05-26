---
name: Estado total do Supabase em 28/04/2026 (audit profundo)
description: Snapshot consolidado pós-auditoria. 12 schemas, 130+ tabelas public, 76+ triggers, 80+ RPCs, 11 Edge Functions, 4 buckets. Substitui reference_supabase.md que era superficial
type: reference
originSessionId: 60cf94b7-b5d3-4df1-974d-c1c92082460c
---
Auditado em 28/04/2026 madrugada. Project ref: `itdjkfubfzmvmuxxjoae`. PAT: `sbp_419b3389d0642b252af20235daf0df6ce4250976`.

## Schemas (12 reais)

```
auth                  → 28 users, 26 identities, 1 provider (email), 0 sessões ativas
backup                → 7 snapshots tabela de 10/11/2025
extensions            → 7 extensions
graphql + graphql_public  → endpoint GraphQL (não usado)
net                   → pg_net (HTTP from SQL)
pgbouncer             → connection pool
public                → 130+ tabelas (eixo principal)
realtime              → 11 tabelas com publish
storage               → 4 buckets (133 files, 127 MB)
supabase_migrations   → histórico migrations
vault                 → vazio (secrets em Edge Function env vars)
```

## Extensions (7)

- `pgcrypto` 1.3 (signature_hash)
- `uuid-ossp` 1.1 (UUIDs)
- `pg_net` 0.19.5 (HTTP requests dentro de SQL)
- `pg_stat_statements` 1.11 (query stats)
- `btree_gist` 1.7 (índices avançados)
- `supabase_vault` 0.3.1
- `plpgsql` 1.0

🚨 **`pg_cron` NÃO instalado** — schedules são externos.

## Roles RBAC (4 enums em `app_role`)

```
admin (5), profissional (13), paciente (30), aluno (1)
```

## Auth state

```
auth.users:               28
public.users:             30   (6 órfãos sem auth — 3 reais + 3 anonimizados LGPD)
identities providers:     {email}  (zero Google apesar de Edge Function existir)
active sessions:          0
ativos 7d:                7
```

## Storage (4 buckets, 133 files, 127 MB)

```
documents:    128 files,  118 MB  (PDFs/DOCX clínicos do Dr. Ricardo + 72 órfãos)
avatar:         3 files,    6 MB   (público)
chat-images:    1 file,    3.3 MB  (público SEM filtro — P0)
chat-audio:     1 file,    0.6 MB  (filtrado por owner)
```

🚨 **72 files órfãos** (~67 MB) de owners que não existem em users (3 owners deletados).

## Realtime (11 tabelas com publish)

`ai_chat_interactions, appointments, chat_messages, chat_messages_legacy, chat_participants, chat_rooms, global_chat_messages, noa_interaction_logs, user_courses, user_profiles, video_call_requests`

## Triggers SQL (76+ ativos)

Top tabelas por trigger count:
- `users`: 8
- `appointments`: 10 (inclui `trg_ai_predict_risk` — IA prediz risco no INSERT!)
- `clinical_reports`: 5
- `wallet_transactions`: 3
- `aec_assessment_state`: 2 (anomaly_logger + last_update)

Triggers chave:
- `trg_prevent_privilege_escalation` (users) — anti-escalação
- `trg_appointment_to_wtx` (appointments) — gera wallet transaction automática
- `trg_ai_predict_risk` (appointments) — IA prediz risco
- `aec_state_anomaly_logger` (aec_assessment_state) — rastreio profundo
- `tg_sync_user_roles_from_profile` (user_profiles) — sincroniza role

## Tabelas em uso real (top por volume)

```
patient_medical_records  → 4.328 rows (interações Nôa)
noa_logs                 → 3.008 rows
generated_slides_archive →   412 rows (slides Nôa)
video_call_requests      →   220 rows
notifications            →   140 rows
noa_pending_actions      →   142 rows
chat_participants        →   135 rows
video_call_sessions      →   114 rows
chat_rooms               →    80 rows
clinical_reports         →    80+ rows (38 do Pedro Paciente apenas)
patient_exam_requests    →    11 rows (mas patient_lab_results = 0 — workflow incompleto)
ai_chat_interactions     → ~305 rows nas últimas 4h (alto throughput)
appointments             → ~10 rows recentes
cfm_prescriptions        →    32 prescrições
courses                  →     6 cursos + 12 enrollments
```

## Tabelas zeradas mas estruturadas (não classificar sem auditoria funcional)

- TRL (7 tabelas): `trl_programs/modules/lessons/competency_domains/module_competencies/events/learning_evidence/reflections`
- Forum: `forum_posts/comments/likes/views`
- `debates`, `noa_clinical_cases`, `noa_articles`
- `patient_therapeutic_plans`, `patient_lab_results`, `renal_exams`, `medical_certificates`
- `gamification_points`, `user_achievements`
- `wearable_data`, `wearable_devices`
- `transactions`, `payouts`, `user_subscriptions`
- `noa_memories`, `ai_saved_documents`

## Edge Functions (11) — ver `reference_edge_functions_catalogo_completo.md`

7 funcionais, 1 legacy (deletar), 3 half-implemented (tabelas ausentes).

## RPCs customizadas (~80)

Categorias: AEC, Auth lifecycle, Booking, Chat, Renal/CKD, Wallet/Pagto, Gamification, Subscription, Referral, Trauma/COS, Audit, API key, AI Risk, Dev em produção, Compartilhamento.

Ver memory `reference_cheatsheet_supabase_operacional.md` pra queries comuns.

## Migrations (~80 arquivos)

Padrão: timestamp + UUID auto-gerado (Supabase CLI) ou nome descritivo com versão V1.9.x.

Marcos chave:
- 02/2026: P0_4_FIX_RLS, P0_5_SECURITY_DEFINER
- 13/04: seal_clinical_infrastructure
- 14/04: hardened_view_and_cors
- 23/04: structural_integrity v1.9.0
- 25/04: clinical_reports_policy_unificada v1.9.47, enable_rls_backups v1.9.48
- 27/04: clinical_qa_runs v1.9.88, **scheduling_hardening v1.9.97** (atual)

## Atualização vs memory anterior

Substitui `reference_supabase.md` que era superficial. Conteúdo agora baseado em:
- 25+ queries SQL via Management API
- Audit profundo de 28/04 madrugada
- Cruzado com Livro Magno + diários históricos

Cobertura Supabase atualizada: ~95% (era ~50% na memory antiga).
