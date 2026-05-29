# 09_UNUSED_ARCHITECTURE — Tabelas / Features / Edges sem uso real — 29/05/2026

**Método**: PAT empírico + cruzamento com `AUDITORIA_COMPLETA_22_05_2026.md` + `RETROSPECTIVA_MENSAL`.
**Princípio**: empirismo > assumption. Tabela com 0 rows há > 30d + sem caller frontend = candidata a `DROP`.

---

## TL;DR (5 bullets)

1. **64 de 140 tabelas (45%) com 0 rows** — sprawl arquitetural histórico
2. **Eixo Ensino TRL inteiro dormente** (14 tabelas, 0 rows, 0 calls)
3. **Fórum infra pronta sem adoção** (6 tabelas, 0 rows, 0 posts)
4. **COS Kernel SQL persiste 0 decisões** (3 tabelas) — kernel roda em memória/code, não persiste
5. **Recomendação consolidada**: ~25 tabelas confirmadas mortas (candidatas a `DROP`) · ~15 dormentes opcionais (manter) · ~24 com baixo uso (auditar Sprint 3 caso-a-caso)

---

## §1 — Catálogo das 64 tabelas vazias

### A) Eixo Ensino TRL — DORMENTE INTEIRO (14 tabelas) 💤

```
trl_competency_domains    trl_events    trl_learning_evidence
trl_lessons               trl_modules   trl_module_competencies
trl_programs              trl_reflections
lessons                   lesson_content  modules
course_ratings            user_courses    educational_resources
```

**Status histórico**: decisão arquitetural Pedro+Ricardo+Eduardo = dormir TRL até pós-Marco 3 (Eduardo operacional + Manual v1.1 aprovado).
**Custo manter**: zero (storage).
**Risco drop**: alto (perde infra pronta).
**Recomendação**: **MANTER** dormente até trigger Eduardo + Manual.

### B) Fórum F4 (5 tabelas) 💤

```
forum_comments    forum_likes    forum_views
noa_clinical_cases    debates
```

(`forum_posts` tem 2 pending_review confirmados — não está nessa lista.)

**Status**: end-to-end pronto, 0 adoção (decisão deliberada — aguarda 2-3 médicos).
**Recomendação**: **MANTER** dormente.

### C) COS Kernel SQL espelho (3 tabelas) ⚠️

```
cognitive_decisions    cognitive_metabolism    cognitive_policies
```

**Estado**: tabelas criadas pra persistir decisões/metabolismo do COS Kernel v5.0 (Magno selou 04-06/02/2026).
**Empírico**: `cos_engine.ts` no código roda kernel em memória mas **NÃO PERSISTE** em SQL.
**`cognitive_events`** SIM tem 3.789 rows — esse é o output ativo.
**Risco**: se algum dia o kernel quiser audit/replay de decisões passadas, precisa das tabelas.
**Recomendação**: **AUDITAR Sprint 4 (com Ricardo/Magno)** se vale persistir OU dropar.

### D) Wearable (2 tabelas) 💤

```
wearable_data    wearable_devices
```

**Roadmap futuro**, sem implementação.
**Recomendação**: **MANTER** (custo zero).

### E) Legacy mensagens (3 mortas)

```
global_chat_messages    messages    chat_sessions
```

**Status**: confirmado morto 22/05.
**Vivos no sistema**: `chat_messages` (10), `chat_messages_legacy` (13, canônica enganadora), `private_messages` (7).
**Recomendação**: 🟢 **DROP candidatas** (após `pg_dump` de segurança).

### F) Integration Jobs / Google Calendar (2 tabelas) 💤

```
integration_jobs    professional_integrations
```

**Estado**: schemas criados V1.9.99-B (28/04), 0 rows, 0 callers frontend/backend.
**Recomendação**: **MANTER** — reativação requer só callers, infra OK.

### G) Patient extensions (5 tabelas) ❌

```
patient_conditions      patient_insights        patient_lab_results
patient_referrals       patient_therapeutic_plans
patient_prescriptions
```

**Análise individual**:
- `patient_lab_results`: pipeline OCR documentado parqueado (memory `project_pipeline_patient_documents_ocr_lab_results_parqueado_26_05`), aguarda trigger
- `patient_therapeutic_plans`: **buraco arquitetural REAL** (descoberta 28/05 — memory `project_matrix_roadmap_camadas_1_2_3_28_05`). Feature plano terapêutico nunca codada UI. Schema completo.
- `patient_referrals`: feature parqueada (memory `project_referral_multidisciplinar_sidecar_parqueado_28_05`)
- `patient_prescriptions`: 🟢 **DROP** (legacy, RLS fechado V1.9.97-D, substituída por `cfm_prescriptions`)
- `patient_conditions`, `patient_insights`: não-claros, investigar Sprint 4

### H) Monetização (3 tabelas) 💤 pré-PMF

```
user_subscriptions    transactions    payouts
```

**Empírico**: 3 planos cadastrados, 0 assinaturas, 0 receita. Pré-PMF confirmado.
**Recomendação**: **MANTER** dormente.

### I) Gamification / Ranking (5 tabelas) 💤

```
ranking_history    user_achievements    user_benefits_status
benefit_usage_log    referral_bonus_cycles
```

**Status**: gamification flag-off (CLAUDE.md). Cron `monthly-closing-medcannlab` alimentava — pausado.
**Recomendação**: **MANTER** + revisar cron.

### J) IA Legacy órfãs (5 tabelas) ❌

```
noa_articles    noa_clinical_cases    noa_interaction_logs
noa_memories    ai_chat_history    ai_saved_documents
ai_scheduling_predictions
```

**Análise**:
- `noa_articles`, `noa_clinical_cases`: forum-related, 0 adoção
- `noa_interaction_logs` × `ai_chat_interactions` (4.137 rows ativos) — uma das duas é redundante
- `noa_memories` — ?? (memória GPT antigo??)
- `ai_chat_history` × `ai_chat_interactions` (4.137 ativa) — legacy mortal
- `ai_saved_documents` × `documents` (42 rows ativos) — legacy mortal
- `ai_scheduling_predictions` — feature preditiva não-implementada

**Recomendação**: 🟢 **DROP candidatas** `ai_chat_history`, `ai_saved_documents`, `ai_scheduling_predictions` após pg_dump.

### K) Misc órfãs (12 tabelas)

```
news    news_items    epilepsy_events    clinical_kpis
friendships    user_mutes    user_activity_logs
smart_slot_rules    time_blocks    portal_entries
permissoes_compartilhamento    moderator_requests
analytics    system_config    rate_limit_events    video_clinical_snippets
```

**Análise rápida**:
- `news` × `news_items` — duplicata conhecida 22/05
- `epilepsy_events` — feature específica ausente
- `clinical_kpis` — KPI dashboard descontinuado??
- Outras: investigar Sprint 4

---

## §2 — Edge Functions sem uso confirmado

**Pendente Sprint 2** — listar TODAS + invocations 30d via `pg_cron.job_run_details` ou logs.

Conhecidas 22/05:
- 13 Edges ativas
- 2 Edges Google Calendar (`google-auth`, `sync-gcal`) dormindo intencional

---

## §3 — Frontend code morto (pendente Sprint 2 — grep)

Componentes/páginas declarados sem mount confirmado.

---

## §4 — Hierarquia de drop (prioridade)

### 🟢 SAFE TO DROP (após pg_dump backup) — ~10 tabelas
- `global_chat_messages` (0 rows, 0 callers)
- `messages` (0 rows)
- `chat_sessions` (0 rows)
- `patient_prescriptions` (0 rows, substituída)
- `ai_chat_history` (legacy redundante com `ai_chat_interactions`)
- `ai_saved_documents` (legacy redundante com `documents`)
- `ai_scheduling_predictions` (feature não-implementada)
- 3 tabelas backup abril (`documents_backup_23_04`, `clinical_reports_content_backup_24_04`, `clinical_reports_consent_backup_v1_9_39`)

### 🟡 MANTER DORMENTE (decisão arquitetural deliberada) — ~30 tabelas
- TRL Ensino 14 tabelas
- Fórum 5 tabelas
- Wearable 2 tabelas
- Integration Jobs 2 tabelas
- Monetização 3 tabelas
- Gamification 5 tabelas

### 🔵 AUDITAR INDIVIDUALMENTE (Sprint 4) — ~15 tabelas
- COS Kernel SQL (3 tabelas)
- Patient extensions ambíguas (5 tabelas)
- Misc órfãs sem decisão clara (7 tabelas)

### ⚠️ Risco de manter
- Confunde auditoria futura (esta cresce a cada audit)
- Onboarding novo dev demora 2-4h só pra entender o que é vivo vs morto
- `pg_dump` total cresce desnecessariamente (storage barato, mas tempo de restore aumenta)

---

## §5 — Recomendação operacional

### Sprint pós-Marco 2
Quando 1º paciente externo pagante entrar:
1. **`pg_dump` completo** snapshot pré-cleanup
2. **`DROP` em batch** das ~10 confirmadas safe
3. **`ALTER TABLE ... RENAME TO _zz_legacy_X`** das ~15 ambíguas (prefix `_zz_` esconde no autocomplete + facilita revert)
4. **Auditoria pós-cleanup** — quantas tabelas hoje vivas vs 140 atuais

### Não fazer hoje
- Drop sem backup
- Decisão sem Ricardo (pra TRL/Cognitivo/Clinical KPIs)
- Limpeza sem trigger empírico Marco 2 (anti-cristalização-prematura)

---

## Frase âncora

> *"Sistema tem 140 tabelas, 64 (45%) vazias. Sprawl não é fatal mas confunde. ~10 tabelas confirmadas safe-to-drop pós-Marco 2 (após `pg_dump`). ~30 mantidas dormentes por decisão arquitetural. ~15 ambíguas requerem Sprint 4 com Ricardo. NÃO dropar hoje (anti-cristalização-prematura) — trigger pra cleanup é Marco 2 OU auditoria 60d pós Marco 2 com novos dados."*
