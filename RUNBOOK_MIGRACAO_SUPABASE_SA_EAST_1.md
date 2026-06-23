# 🚚 RUNBOOK — Migração Supabase `us-east-1` → `sa-east-1` (São Paulo)

**Projeto:** MedCannLab 3.0 ("Nôa Esperanza Med Cann Lab") · **Ref atual:** `itdjkfubfzmvmuxxjoae`
**Objetivo:** **ZERO REGRESSÃO** — cópia FIEL preservando UUIDs · região atual confirmada `us-east-1` (criado 22/10/2025)
**Motivação:** residência de dado no Brasil (LGPD Art. 33, pós-CNPJ, dado médico/cannabis sensível)
**Data do plano:** 22/06/2026 · **Status:** PLANO — nada executado ainda

> ⚠️ **Verdade fundamental:** Supabase **NÃO muda região** de projeto existente. Isto é uma **migração pra projeto novo**, não um toggle. O Pro de $25 não muda isso.
> ⚠️ **Princípio anti-regressão:** **copiar TUDO** (legacy + ativo + futuro), **preservar TODOS os UUIDs**, **não decidir/prunar nada durante a migração**. Limpeza de legacy = passe SEPARADO depois.

---

## 0. INVENTÁRIO EMPÍRICO (fonte de verdade — PAT 22/06, NÃO o CLAUDE.md que estava stale)

| Item | Real (22/06) | CLAUDE.md dizia |
|---|---|---|
| Tabelas (public) | **150** | ~177 |
| Views (public) | **42** | — |
| Extensions | **8** | — |
| **Cron jobs** | **5** | 3 (stale) |
| RLS policies | **479** | 147 |
| Functions | **363** | — |
| Triggers | **95** | — |
| Auth users | **52** | — |
| Storage buckets | **8** | — |
| Storage objects | **217** | — |
| Vault secrets | **1** | — |

→ Os **secrets reais das Edges (OpenAI, Resend, ICP)** vivem nos **Edge Function Secrets** (plataforma), NÃO no vault (vault tem só 1). Não saem em `pg_dump` — **re-setar manualmente** (§6).

### 8 Extensions (habilitar no projeto novo)
`btree_gist 1.7` · `pg_cron 1.6.4` · `pg_net 0.19.5` · `pg_stat_statements 1.11` · `pgcrypto 1.3` · `plpgsql 1.0` · `supabase_vault 0.3.1` · `uuid-ossp 1.1`
→ **pg_cron + pg_net** são essenciais (os 5 crons dependem). Sem pgvector (embeddings off, consistente).

### 5 Cron jobs (recriar TODOS via SQL — não vêm no dump do `public`)
| jobname | schedule | nota |
|---|---|---|
| `video-call-reminders-5min` | `*/5 * * * *` | ativo OK (service_role JWT) |
| `renal-signal-extractor-15min` | `*/15 * * * *` | **não estava no CLAUDE.md** — extractor renal |
| `sgq-health-checks-daily` | `0 9 * * *` (06h BRT) | **não estava no CLAUDE.md** — health checks |
| `expire-renal-suggestions` | `0 2 * * *` | ativo OK |
| `monthly-closing-medcannlab` | `0 3 1 * *` | 💤 **DORMENTE por design** — gamification acoplada; deixar dormente |

### 8 Storage buckets (217 arquivos — migrar binários)
| bucket | público | arquivos | criticidade |
|---|---|---|---|
| `signed_documents` | privado | 21 | 🔴 **PDFs assinados ICP — valor jurídico** |
| `certificates` | privado | 1 | 🔴 **cert ICP** |
| `documents` | privado | 139 | 🟡 corpus + docs |
| `nfts` | privado | 37 | 🟡 NFTs consent |
| `patient_documents` | privado | 9 | 🟡 docs paciente (LGPD) |
| `chat-images` | privado | 3 | 🟢 |
| `avatar` | **público** | 6 | 🟢 |
| `chat-audio` | privado | 1 | 🟢 |

---

## 1. 🔒 LOCKS — NÃO PODEM QUEBRAR (verificar pós-migração)

| Lock | Protege | Dependência crítica na migração |
|---|---|---|
| **V1.9.95** AEC GATE v1.5 | agenda não dispara em AEC ativa (REGRA HARD §1) | lógica em `tradevision-core` (edge) + UUIDs profs |
| **V1.9.299** sign-pdf-icp PBAD AD-RB | assinatura ICP conforme ITI (**21 PDFs assinados reais**) | bucket `certificates` + Edge secrets (cert/senha) + consts `PA_AD_RB_V24_OID`/`_SIGPOLICYHASH_HEX` (NÃO mudar) + **verify_jwt=false** (não trocar) |
| **V1.9.388-A.3** ancoragem regulatória | 8 camadas COS/CFM/LGPD | RLS (479 policies) + funções |
| **V1.9.452/597** PII sanitize | nomes fora de `clinical_rationalities.assessment` | Edge `tradevision-core` v425+ |
| **V1.9.468-B** Matrix Z2 + Bula | sinaliza ≠ diagnostica | `base_conhecimento` (5 entries curadas — NÃO inchar) |
| **V1.9.506** verify_jwt=true | defesa em camadas | 16/17 edges (sign-pdf-icp é a exceção por design) |
| **V1.9.533** create-patient-auth | NUNCA INSERT SQL direto em auth.users | ver gotcha tokens-NULL (§5) |

**Verificação pós-migração:** smoke ICP (openssl asn1parse em 3 PDFs do `signed_documents`) + login + AEC + RLS matrix.

---

## 2. LEGACY vs ATIVO vs FUTURO (copiar TUDO — distinção é só pra não confundir depois)

> Pedro: *"o banco tem coisa legacy E coisa que ainda vamos usar (aulas etc)."* → **A migração copia tudo.** Esta tabela é mapa, não decisão de pruning.

**🏛️ CONSTITUCIONAL / AUDITORIA (COS — Rastreabilidade Total; preservar com INTEGRIDADE, insert-only):** `cognitive_events` (**3.913** — **CEP**, auditabilidade jurídica, hasheado no Kernel COS v5.0) · `noa_logs` (**25.936** — a maior tabela; trace cognitivo/clínico) · `ai_chat_interactions` (**4.421** — interações + intent) · `scheduling_audit_log` (51). → **Espinha jurídica do sistema** (COS princípio #2). Perda = perde a defesa em auditoria. ⚠️ `noa_logs` é a maior tabela → considerar no tempo/tamanho do dump.

**🟢 CANÔNICO/ATIVO (crítico — copiar c/ UUID):** `users` (53) · `clinical_reports` (151, content.rationalities jsonb íntegro) · `cfm_prescriptions` (63) · `clinical_rationalities` (112+) · `patient_exam_requests` (25, signed) · `patient_documents` · `chat_messages_legacy` (15 — **nome enganoso, é a CANÔNICA**) · `appointments` · `aec_assessment_state` · 4 sidecars (`renal_inline_suggestions`/`clinical_neuro_signals`/`clinical_reported_signals`/`cannabis_in_relato_signals`) · `patient_professional_links`.

**💰 ECONOMIA Two-Track (vazias/dormentes — preservar schema):** `gamification_points` · `ranking_history` · `transactions` (referral condicionado a pagamento real; ligadas ao cron `monthly-closing` dormente — Anexo 1 do Magno).

**🔵 FUTURO (Ensino/Pesquisa — zeradas hoje, PRESERVAR schema):** `course_modules` · `lesson_contents` · `student_progress` · `forum_posts`/`forum_responses` (TRL/aulas — Marco 3 com Eduardo). **Vazias mas vão ser usadas — copiar schema.**

**🟠 LEGACY/órfã (copiar mesmo assim — fidelidade; limpar depois):** `chat_messages` (0, shell) · `prescriptions` (8, usar cfm_prescriptions) · `user_profiles` (35, 5 órfãos) · `profiles`/`usuarios` (mortas).

---

## 3. DADOS REAIS vs TESTE (~3% real / ~97% teste — copiar TUDO, não decidir agora)

**🔴 REAL — perda = irreversível:** Maria das Dores Pinto Pitoco (paciente real) · Ricardo (`2135f0c0`) + Eduardo (`f4a62265`) + Lauro (`1f7bfcfa`, novo) · **21 PDFs assinados ICP** (`signed_documents`) · 52 cfm_prescriptions reais · 43 relatórios avaliados.
**⚪ TESTE (~97%):** Carolina (conta-teste Ricardo) · Pedro Paciente · pacientes sintéticos do import wizard. **Copiar mesmo** (fidelidade + auditoria); limpar num passe separado **depois** do go-live.

---

## 4. SEQUÊNCIA DE EXECUÇÃO (cutover)

> Abrir **ticket no Supabase** (Pro) antes — eles têm tooling de backup/restore cross-region e orientam.

### Fase 0 — Pré (Dia −1)
- [ ] `npm run type-check` limpo + `git status` limpo + 8 locks intocados (commit-stat)
- [ ] **Backup completo us-east-1** (pg_dump schema+data + export dos 8 buckets/217 arquivos)
- [ ] Pedro cria **projeto novo `sa-east-1`** + me passa URL + anon key + service_role + PAT novo
- [ ] Reunir **secrets** (§6) — gerar novos (não copiar literal): OpenAI, Resend; cert ICP (o mesmo do Ricardo, re-setar)
- [ ] Janela de manutenção combinada (downtime curto no cutover)

### Fase 1 — Estrutura no projeto novo
- [ ] Habilitar **8 extensions** (pg_cron, pg_net, pgcrypto, btree_gist, uuid-ossp, vault, pg_stat_statements)
- [ ] **Schema:** restaurar do `pg_dump --schema-only` do vivo (fonte de verdade > os 168 arquivos de migration, que podem ter drift). Inclui as 479 RLS, 363 functions, 95 triggers, 42 views.
- [ ] Recriar os **5 cron jobs** via `cron.schedule(...)` (monthly-closing fica criado mas é dormente por design)

### Fase 2 — Dados (preservando UUIDs, ordem de FK)
- [ ] **auth.users + auth.identities** PRIMEIRO — preservar `id` (UUID) + `encrypted_password` (senhas mantidas) · ⚠️ **tratar tokens-NULL** (§5)
- [ ] `public.users` (linka por id = auth.users.id)
- [ ] Demais tabelas `--data-only` com `--disable-triggers` (evita disparos durante carga), reabilitar triggers depois
- [ ] **Storage:** baixar os 217 objetos dos 8 buckets e re-upload no projeto novo (recriar buckets com mesma flag public/private)
- [ ] Recriar o 1 vault secret

### Fase 3 — Edges + secrets
- [ ] `supabase functions deploy <slug> --project-ref <novo>` pras 17 edges (do repo)
- [ ] `supabase secrets set` pra cada secret (§6)
- [ ] Confirmar `verify_jwt`: 16 com true, **sign-pdf-icp com false** (por design)

### Fase 4 — Cutover
- [ ] **Vercel env:** `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` → projeto novo · grep repo por refs hardcoded do projeto velho
- [ ] Redeploy frontend

### Fase 5 — Smoke (cada item tem que passar)
- [ ] **Auth:** login Ricardo (mesmo email/senha) → JWT → dashboard. `SELECT count(*) FROM auth.users WHERE confirmation_token IS NULL` = **0**
- [ ] **ICP (lock):** baixar 3 PDFs do `signed_documents` → `openssl asn1parse` valida assinatura
- [ ] **IA pipeline:** chat livre "Olá" → tradevision-core responde (não 5xx) → confirma OpenAI key OK
- [ ] **AEC + gate:** iniciar avaliação → fluxo segue, agenda NÃO dispara indevidamente (REGRA HARD §1)
- [ ] **RLS matrix:** paciente A não vê dado do paciente B (403)
- [ ] **Crons:** `SELECT status FROM cron.job_run_details ORDER BY start_time DESC LIMIT 5` → succeeded
- [ ] **Email:** trigger Resend → chega
- [ ] **Dados reais:** Maria das Dores renderiza Saúde Renal; 21 signed + 52 cfm_prescriptions presentes; UUIDs Ricardo/Eduardo/Lauro intactos
- [ ] **type EN/PT:** `SELECT DISTINCT type FROM users` consistente (gotcha V1.9.596)

### Fase 6 — Pós (48h)
- [ ] Monitorar logs (zero "column not found"/5xx novos) · rollback us-east-1 disponível <4h
- [ ] Depois (passe separado): limpar dado teste + legacy

---

## 5. ⚠️ GOTCHAS QUE QUEBRAM SILENCIOSAMENTE (cada um = checklist acima)
1. **tokens-NULL em auth.users** (V1.9.533): ao migrar `auth.users`, colunas `confirmation_token`/`recovery_token`/`email_change*`/etc. têm que ser `''` e **não NULL** → senão login dá `500 unexpected_failure`. Auditar pós-migração (=0).
2. **`clinical_reports.id` é TEXT** (não uuid) → FKs (ex: `report_id` nos sidecars) são TEXT. Não assumir uuid.
3. **`content.rationalities` é OBJECT** (por tipo), não array → não medir com `jsonb_array_length`.
4. **type EN/PT** misturado em `users.type` → usar `.in(['professional','profissional'])` (V1.9.596).
5. **`birth_date`** (não `date_of_birth`) (V1.9.625).
6. **sign-pdf-icp verify_jwt=false** por design — **não trocar** (quebraria o PBAD; auth é interna em runtime).
7. **UUIDs hardcoded** no Core (Ricardo/Eduardo/especialidades) → **cópia fiel preserva** (clean-start quebraria o fallback).

---

## 6. SECRETS A RE-SETAR (não saem no dump — plataforma)
| Secret | Usado por | Ação |
|---|---|---|
| `OPENAI_API_KEY` | tradevision-core | nova chave (ou a mesma) → `supabase secrets set` |
| `RESEND_API_KEY` + `RESEND_FROM_EMAIL` | send-email, reminders | domínio já verificado `noreply@medcannlab.com.br` |
| **ICP cert + senha** | sign-pdf-icp, cert-encrypt-password | re-upload bucket `certificates` + secret da senha · **smoke ITI obrigatório** |
| WiseCare token | wisecare-session | ⚠️ migrar homolog→prod (pendência pré-Marco 2) |
| Google OAuth | google-auth (dormindo) | opcional (edge dormente) |
| Service role / anon keys | frontend + edges | do projeto novo → Vercel env |

---

## 7. RISCO & RECOMENDAÇÃO
- **Maior risco:** ICP (lock V1.9.299) — re-validar com smoke ITI. **2º:** auth (tokens-NULL). **3º:** storage (217 binários, esp. signed_documents).
- **Timing a favor:** pré-PMF, ~97% teste, volume baixo = **melhor momento** pra migrar (depois com pacientes reais é muito pior).
- **Execução:** sessão dedicada (provável laptop), passo a passo, **smoke em cada fase**, com a janela de downtime combinada. Eu conduzo cada etapa com você + cruzo via PAT.

**Resumo de 1 linha:** *Cópia fiel us-east-1→sa-east-1 preservando UUIDs: 150 tabelas + 479 RLS + 363 functions + 95 triggers + 42 views + 5 crons + 8 buckets/217 arquivos + 52 auth users + 17 edges + secrets re-setados. Lógica (IA/AEC/gates/locks) não muda (mora no repo). Não quebra se: UUIDs preservados, tokens-NULL tratados, ICP re-validado (smoke ITI), secrets re-setados, env trocado. Copiar tudo (legacy+ativo+futuro); limpar depois.*
