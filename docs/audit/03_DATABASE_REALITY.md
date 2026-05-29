# 03_DATABASE_REALITY — Auditoria Banco MedCannLab — 28/05/2026

**Método**: PAT empírico Supabase Management API + cruzamento com `AUDITORIA_COMPLETA_22_05_2026.md` (6 dias atrás).
**Princípio**: polir-não-inventar (reuso) + validação empírica (PAT > inferência).

---

## TL;DR (5 bullets)

1. **140 tabelas** públicas, **142 com RLS** (cobertura > 100% por contar 2 views security_invoker como tabelas RLS-enabled).
2. **64/140 (45%) tabelas com ZERO rows** — sprawl arquitetural massivo. 5 grupos claros: TRL Ensino, Fórum, Cognitivo SQL, Wearable, Legacy.
3. **🔴 ACHADO NOVO CRÍTICO**: `tradevision-core` agora está `verify_jwt: FALSE` (em 22/05 estava `true`). Mudou silenciosamente em 6 dias. Possível execução do deploy:tradevision com `--no-verify-jwt` flag.
4. **🟠 8 órfãos `public.users` SEM `auth.users`** — drift novo desde 22/05 (era 0 ou ≤3). Pacientes que não conseguem logar OU contas zumbi.
5. **89 triggers public + 5 auth + 176 FKs + 451 RLS policies** — base robusta, sem políticas obviamente contraditórias.

---

## §1 — Métricas globais (PAT 28/05 ~21h BRT)

| Métrica | Valor | Delta vs 22/05 | Leitura |
|---|---|---|---|
| Tabelas `public` (BASE TABLE) | 140 | +1 | +`feedback_tickets` (V1.9.486) |
| Tabelas com RLS habilitado | 142 | n/d | Cobertura universal + 2 views RLS |
| Tabelas com 0 rows | **64 (45%)** | n/d (provavelmente +1, `feedback_tickets`=2) | ⚠️ Sprawl arquitetural |
| RLS policies totais | 451 | n/d | Densidade alta |
| Triggers `public` | 89 | n/d | Inclui 13 em appointments, 10 em users |
| Triggers `auth` | 5 | = 22/05 | Preserved |
| FKs total | 176 | n/d | Integridade estrutural OK |

---

## §2 — TOP 30 tabelas por uso real (rows)

| # | Tabela | Rows | Última vacuum | Categoria |
|---|---|---|---|---|
| 1 | `noa_logs` | **17.013** | 21/05 | 🟢 audit master |
| 2 | `patient_medical_records` | 6.070 | 27/04 | 🟢 chat_interaction (NÃO é evolução) |
| 3 | `user_interactions` | 4.303 | 23/04 | 🟢 |
| 4 | `ai_chat_interactions` | 4.137 | 04/05 | 🟢 chat IA principal |
| 5 | `cognitive_events` | 3.789 | 05/05 | 🟢 COS Kernel ativo |
| 6 | `ai_assessment_scores` | 604 | 22/04 | 🟢 |
| 7 | `clinical_axes` | 505 | 25/04 | 🟢 |
| 8 | `generated_slides_archive` | 412 | nunca | 🟡 nunca vacuumed |
| 9 | `notifications` | 274 | 24/05 | 🟢 |
| 10 | `video_call_requests` | 255 | 31/03 | 🟢 (WiseCare) |
| 11 | `clinical_north_star_events` | 214 | nunca | 🟡 |
| 12 | `institutional_trauma_log` | 198 | nunca | 🟢 (COS Kernel porta Trauma) |
| 13 | `chat_participants` | 163 | 10/02 | 🟢 |
| 14 | `noa_pending_actions` | 159 | nunca | 🟢 |
| 15 | `clinical_reports` | 145 | 17/05 | 🟢 NÚCLEO CLÍNICO |
| 16 | `video_call_sessions` | 134 | nunca | 🟢 |
| 17 | `clinical_rationalities` | 132 | nunca | 🟢 NÚCLEO + 🔴 PII vazada (88%) |
| 18 | `chat_rooms` | 93 | 19/02 | 🟢 |
| 19 | `appointments` | 93 | 19/05 | 🟢 + ⚠️ 13 triggers (verificar) |
| 20 | `clinical_assessments` | 76 | 06/03 | 🟢 inclui 18 FOLLOW_UP (Matrix não lê) |
| 21 | `user_roles` | 68 | nunca | 🟢 RBAC |
| 22 | `scheduling_audit_log` | 56 | nunca | 🟢 audit |
| 23 | `cfm_prescriptions` | 52 | nunca | 🟢 NÚCLEO |
| 24 | `users` | **50** | 29/05 | 🟢 canônica (drift: 8 órfãos sem auth) |
| 25 | `user_profiles` | 49 | 18/05 | 🟡 legacy 95% redundante com `users` |
| 26 | `documents` | 42 | 24/04 | 🟢 (RAG V1.9.318 lock) |
| 27 | `gamification_points` | 42 | nunca | 🟡 (gamification flag-off) |
| 28 | `video_call_quality_logs` | 39 | nunca | 🟢 |
| 29 | `patient_nfts` | 36 | nunca | 🟡 baixa adoção |
| 30 | `rate_limit_buckets` | 36 | 28/05 | 🟢 |

---

## §3 — 64 tabelas com ZERO rows (sprawl arquitetural)

### Categoria A — Eixo Ensino TRL completamente dormente (9 tabelas)
`trl_competency_domains`, `trl_events`, `trl_learning_evidence`, `trl_lessons`, `trl_module_competencies`, `trl_modules`, `trl_programs`, `trl_reflections`, `lessons`, `lesson_content`, `modules`, `course_ratings`, `user_courses`, `educational_resources`

→ 14 tabelas ensino = **EIXO INTEIRO ZERADO**. Decisão Pedro+Ricardo: dormir até pós-Marco 3 (Eduardo + Manual v1.1).

### Categoria B — Fórum infra pronta, 0 adoção (3 tabelas + 3 fórum already listed)
`forum_comments`, `forum_likes`, `forum_views`, `noa_clinical_cases`, `noa_articles`, `debates`

→ F4 Fórum end-to-end pronto, esperando trigger empírico.

### Categoria C — Cognitivo SQL não-usado (COS Kernel parcialmente migrado, 3 tabelas)
`cognitive_decisions`, `cognitive_metabolism`, `cognitive_policies`

→ COS Kernel V5.0 está no código (`cos_engine.ts`), mas as tabelas SQL espelhadas estão vazias. **Sugere**: COS roda em memória/code, não persiste decisões/metabolismo. Hot.

### Categoria D — Wearable (2 tabelas, feature não-implementada)
`wearable_data`, `wearable_devices`

→ Roadmap futuro. Sem trigger.

### Categoria E — Legacy mensagens (3 tabelas mortas)
`global_chat_messages`, `messages`, `chat_sessions`

→ Confirmado dead em 22/05. Continua morto.

### Categoria F — Conhecidas dormentes do 22/05
`integration_jobs`, `professional_integrations` (Google Calendar)
`patient_prescriptions` (legacy, fechado V1.9.97-D)
`user_subscriptions`, `transactions` (monetização pré-PMF)
`ranking_history` (sistema ranking dormente)
`news`, `news_items` (duplicidade conhecida)
`noa_memories`, `noa_interaction_logs`, `ai_chat_history`, `ai_saved_documents`, `ai_scheduling_predictions` (legacy IA)
`patient_conditions`, `patient_insights`, `patient_lab_results`, `patient_referrals`, `patient_therapeutic_plans`
`epilepsy_events`, `clinical_kpis`
`friendships`, `user_mutes`, `user_achievements`, `user_activity_logs`, `user_benefits_status`, `benefit_usage_log`, `referral_bonus_cycles`, `payouts`
`smart_slot_rules`, `time_blocks`, `portal_entries`, `permissoes_compartilhamento`, `moderator_requests`, `analytics`, `system_config`, `rate_limit_events`, `video_clinical_snippets`

### Resumo §3
- **64 tabelas vazias** = 45% do schema
- **40-50 são especulativas/dormentes** (sem write em > 30d, sem caller código)
- **Candidatas a `DROP`** após análise: ~25-30 tabelas confirmadas mortas
- **Mantém-se por valor opcional** (Wearable, Fórum, Ranking): ~15 tabelas
- **Custo de manter**: ~~0 (storage barato), MAS confunde auditoria + onboarding novos devs

---

## §4 — Sprawl tabelas duplicadas (do 22/05, status hoje)

### Perfis (×4 originais)
| Tabela | Rows 28/05 | Status |
|---|---|---|
| `users` | **50** | 🟢 canônica |
| `user_profiles` | 49 | 🟡 sincronizada (95% redundante) |
| `profiles` | ? | 🟡 legacy |
| `usuarios` | ? | 🟡 órfã |

→ Inalterado vs 22/05. Decisão futura: dropar `profiles` + `usuarios` após audit completo.

### Mensagens (×5 originais)
Confirmado morto: `global_chat_messages` (0), `messages` (0), `chat_sessions` (0).
Vivos: `chat_messages` (10), `chat_messages_legacy` (13 — canônica enganadora), `private_messages` (7).

→ Drop candidatas: `global_chat_messages` + `messages` + `chat_sessions`.

### Prescrições (×4 originais)
| Tabela | Status |
|---|---|
| `cfm_prescriptions` | 🟢 OFICIAL ATIVA (52 rows hoje vs 45 em 22/05 = +7 prescritas em 6 dias) |
| `prescriptions` | 🟡 legacy 8 rows (RLS fechado V1.9.97-D) |
| `patient_prescriptions` | ❌ 0 rows — morta |
| `modelos_receituario` | n/d |

→ Drop candidata: `patient_prescriptions`.

### Backups (do 22/05)
- `documents_backup_23_04_2026` — 458 rows — 🟠 ainda no schema
- `clinical_reports_content_backup_24_04` — 64 rows — 🟠 ainda no schema
- `clinical_reports_consent_backup_v1_9_39` — ainda no schema

→ Dump + drop pendente.

---

## §5 — Triggers (89 public + 5 auth)

### Tabelas com triggers densos (top 5)
| Tabela | N triggers | Eventos |
|---|---|---|
| `appointments` | **13** | INSERT (5) + UPDATE (8) |
| `users` | 10 | INSERT (6) + UPDATE (4) |
| `clinical_reports` | 7 | INSERT (3) + UPDATE (4) |
| `cfm_prescriptions` | 5 | INSERT + UPDATE |
| `user_profiles` | 4 | INSERT (1) + UPDATE (3) |

### Análise `appointments` (13 triggers)
```
AFTER INSERT:  trg_ai_predict_risk, trg_ns_followup_scheduled, trigger_enqueue_gcal
AFTER UPDATE:  tr_process_appointment_referral_bonus, tr_set_referral_marco_zero,
               trg_appointment_completed, trg_appointment_to_wtx, trigger_enqueue_gcal
BEFORE INSERT: sync_ids_appointments, trigger_compute_slots
BEFORE UPDATE: sync_ids_appointments, trigger_compute_slots, update_appointments_updated_at
```

**Avaliação**: 13 NÃO É DUPLICAÇÃO — são pares funcionais (`sync_ids_appointments` × INSERT/UPDATE, `trigger_compute_slots` × INSERT/UPDATE, `trigger_enqueue_gcal` × INSERT/UPDATE). Empiricamente coerente.

**MAS**: cada `appointments` INSERT executa 5 triggers AFTER — `trg_ai_predict_risk` + `trg_ns_followup_scheduled` + `trigger_enqueue_gcal` × 2 (uma INSERT, uma UPDATE) + outras. Latência cumulativa = candidata a auditoria de performance futura.

### Análise `users` (10 triggers)
- `on_patient_created` + `on_patient_created_triage` (AFTER INSERT) — pode haver overlap
- `tr_set_referral_code`, `trg_set_trial_ends_at`, `tg_auto_exempt_non_patients`, `sync_council_fields_trigger` — múltiplas inicializações
- `trg_prevent_privilege_escalation` (BEFORE UPDATE) — segurança importante ✅

**Achado fraco**: `tg_auto_exempt_non_patients` em INSERT + UPDATE pode ser redundante. Investigar.

---

## §6 — Drift `auth.users` ↔ `public.users` (achado novo crítico)

### 2 órfãos `auth.users` SEM `public.users` (já reportados 22/05 — 3, hoje 2 com `af59920c` resolvido)
| auth.users.id | email | created_at | Status |
|---|---|---|---|
| `46dd5787-fdec-4064-94ef-9ffcc73d64d1` | pedro.valenca@aluno.ceat.org.br | 2026-02-21 | 🟡 fake confirmado 22/05 |
| `3f241baa-2185-42fb-8d85-354893f76d1c` | iaianoaesperana@gmail.com | 2026-01-28 | 🟡 typo confirmado 22/05 |

→ Inalterado.

### 🔴 8 órfãos `public.users` SEM `auth.users` (NOVO drift)
| public.users.id | email | role | created_at |
|---|---|---|---|
| `b6acd8eb-...` | cdo@gmail.com | patient | 2026-05-04 |
| `3eec963a-...` | eawarrak@id.uff.br | patient | 2026-05-01 |
| `b67415b8-...` | miltonluquett@yahoo.com.br | patient | 2026-04-28 |
| `db506f6e-...` | marneserrano@terra.com.br | patient | 2026-04-27 |
| `2a95fc8f-...` | joao.vidal@remederi.com | patient | **2026-01-28** |
| `79700b81-...` | anon-*@anonymized.local | patient | 2025-11-26 |
| `9362c589-...` | anon-*@anonymized.local | patient | 2025-11-23 |
| `aee0215c-...` | anon-*@anonymized.local | patient | 2025-11-23 |

### Diagnóstico
- **3 anonymized** (2025-11) = pós-delete LGPD anonymization ok (não-problema)
- **5 reais** (`cdo`, `eawarrak`, `miltonluquett`, `marneserrano`, `joao.vidal`) = **NÃO CONSEGUEM LOGAR**
- `joao.vidal@remederi.com` é o **João Vidal sócio CNPJ** (Marco 1) — provavelmente cadastro antigo sem auth

### Severidade
- 🟡 **se forem só fantasmas de imports/seeds antigos**
- 🔴 **se forem pacientes externos reais que tentaram logar e não conseguiram** = quebra de uso real

### Recomendação Sprint 3 (uso real)
Investigar se algum desses 5 emails tem appointments / reports / chats associados. Se sim, **caso é grave**.

---

## §7 — 🔴 ACHADO CRÍTICO NOVO: tradevision-core verify_jwt mudou silenciosamente

### Estado em 22/05 (`AUDITORIA_COMPLETA_22_05_2026.md` §2)
> `tradevision-core` **v407** (core IA Nôa, **`verify_jwt:true`**)

### Estado em 28/05 (PAT Management API)
```json
{
  "slug": "tradevision-core",
  "version": 422,
  "verify_jwt": false,    ← ⚠️ MUDOU
  "status": "ACTIVE"
}
```

### Análise
- v407 → v422 em 6 dias (15 versões = ~2-3 deploys/dia)
- `verify_jwt` flipou de `true` → `false`
- **Em 22/05 a auditoria avisou**: *"O script `npm run deploy:tradevision` usa `--no-verify-jwt`. Deployar com o script fliparia verify_jwt true→false — mudança de comportamento na borda. Corrigir o script ANTES do deploy do refator."*
- **EMPÍRICO**: o deploy aconteceu, o script não foi corrigido, e a flag flipou. **A bomba latente avisada em 22/05 explodiu.**

### Impacto
- Sem JWT verify, qualquer chamada com header `Authorization` (ou sem) é aceita pelo Supabase gateway
- O código interno do `tradevision-core` faz `auth.getUser(token)` manualmente (validado 26/05 V1.9.457 pra `sign-pdf-icp`)
- Para `tradevision-core` específicamente, precisa verificar: o handler interno valida JWT? Se sim, o gateway flag não importa empíricamente. Se não, é furo de segurança.

### Recomendação imediata
1. Verificar via grep: `tradevision-core/index.ts` chama `auth.getUser` ou valida token internamente?
2. Se sim: flag flag externa é cosmética, mas ainda assim **deveria voltar a `true`** por defesa em camadas
3. Se não: **🔴 INCIDENTE DE SEGURANÇA REAL** — corrigir hoje

---

## §8 — Edge Functions (lista parcial — verificar Sprint 2)

Da resposta PAT visível:
- `tradevision-core` v422 (verify_jwt **false** ⚠️)
- `get_chat_history` v8 (verify_jwt false)
- `digital-signature` v68 (verify_jwt false)
- `video-call-request-notification` v62

**Pendente** (Sprint 2): listar TODAS + invocations 30d via `pg_cron.job_run_details` + auditoria de quais Edges têm auth manual interna.

---

## §9 — Hierarquia de risco (este sprint)

### 🔐 Irreversíveis
- **`tradevision-core` verify_jwt=false** (achado novo crítico) — pode ser security leak. Validar Sprint 2.
- **V1.9.452 PII em `clinical_rationalities.assessment`** (continua P0 desde 22/05) — 88.5% rows com PHI vazada.

### 🔴 Quebra uso real
- **8 órfãos `public.users` sem `auth.users`** — investigar se algum tem appointment/report tentando usar (Sprint 3).

### 🟡 Atrito de fluxo
- 64 tabelas vazias (sprawl visual, não-quebra)
- 13 triggers `appointments` cumulativos (latência)
- 10 triggers `users` (overlap possível em `tg_auto_exempt_non_patients`)
- Sprawl perfis/mensagens/prescrições (do 22/05, inalterado)

### ⚫ Polish/arquitetura
- 3 backups abril ainda no schema (drop pendente)
- Tabelas TRL Ensino (14) dormentes — eixo inteiro
- COS Kernel tables SQL com 0 rows (decisão arquitetural não-implementada)

---

## §10 — Pendências pra Sprint 2 (FRONTEND_ROUTE_MAP + SECURITY_AND_SECRETS)

1. Verificar handler interno `tradevision-core` faz auth.getUser ou não
2. Listar TODAS as Edges + invocations
3. Verificar `pg_cron.job_run_details` últimos 30d
4. Grep `--no-verify-jwt` no repo (qual outro script tem essa flag?)
5. Auditar `secretlint` config + buscar PATs/keys hardcoded
6. Buckets Storage públicos
7. RLS policies redundantes/contraditórias (`pg_policies` cross-check)

---

## Frase âncora Sprint 1

> *"DB tem 140 tabelas e 451 policies. 45% das tabelas estão vazias (sprawl arquitetural não-fatal). Achado crítico HOJE: tradevision-core verify_jwt flipou silenciosamente de true→false desde 22/05 — exatamente a bomba latente que a auditoria de 22/05 avisou. 8 órfãos public.users sem auth.users (5 reais + 3 anon) — drift novo a investigar. Núcleo clínico (clinical_reports 145, cfm_prescriptions 52, ai_chat_interactions 4137, noa_logs 17013) saudável e crescendo. Sprint 2 valida se tradevision-core tem auth interna OR é leak real."*
