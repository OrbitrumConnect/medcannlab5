# 📓 DIÁRIO 23/06/2026 — Migração Supabase (runbook) + núcleo constitucional + arco de ~1 ano

**HEAD entrada:** `ea7fe6d` (V1.9.643 + pitches do laptop) · **Tipo:** deep-dive / planejamento de migração / consolidação histórica
**Contexto:** holding pattern (sem código desde 10/06, esperando CNPJ). Sessão de **compreensão profunda**: descoberta da região do servidor, runbook de migração, leitura do Livro Magno, e o **arco completo de ~1 ano** do projeto. PAT nova viva (cruzamento empírico ao longo do dia).
**Objetivo:** documentar tudo pra não faltar nada quando formos executar a migração.

---

# BLOCO A — 🚚 MIGRAÇÃO SUPABASE us-east-1 → sa-east-1 (São Paulo)

## Descoberta
Confirmado via Management API: o projeto está em **`us-east-1` (EUA, Virgínia)**, criado 22/10/2025 — **não** São Paulo. Ricardo "sem querer botou fora" do BR. Com CNPJ vindo + dado médico/cannabis sensível, **residência de dado no Brasil é o certo** (LGPD Art. 33).

## A verdade dura
🔴 **Supabase NÃO muda região de projeto existente** (não tem toggle; o Pro de $25 não muda). É **migração pra projeto novo** em sa-east-1 + copiar tudo. **Timing a favor:** pré-PMF, ~97% dado teste, volume baixo = melhor momento (depois com pacientes reais piora muito).

## Princípio anti-regressão (cravado)
**Copiar TUDO** (legacy + ativo + futuro), **preservar TODOS os UUIDs**, **não prunar nada durante a migração**. Limpeza de legacy = passe separado depois. → garante zero regressão.

## Inventário empírico do banco vivo (fonte de verdade — corrigiu CLAUDE.md stale)
| Item | Real (22-23/06) | CLAUDE.md dizia |
|---|---|---|
| Tabelas public | **150** | ~177 |
| Views | **42** | — |
| Extensions | **8** | — |
| **Crons** | **5** | 3 (stale!) |
| RLS policies | **479** | 147 |
| Functions | **363** | — |
| Triggers | **95** | — |
| Auth users | **52** | — |
| Buckets / objetos | **8 / 217** | — |
| Vault secrets | **1** (resto nas Edges) | — |

- **5 crons** (apareceram 2 não documentados): `video-call-reminders-5min`, `renal-signal-extractor-15min`, `sgq-health-checks-daily`, `expire-renal-suggestions`, `monthly-closing-medcannlab` (dormente).
- **8 extensions:** btree_gist, pg_cron, pg_net, pg_stat_statements, pgcrypto, plpgsql, supabase_vault, uuid-ossp (sem pgvector — embeddings off).
- **8 buckets:** `signed_documents` (21 PDFs ICP jurídicos 🔴), `certificates` (cert ICP 🔴), `documents` (139), `nfts` (37), `patient_documents` (9), `chat-images` (3), `avatar` (6, público), `chat-audio` (1).

## Respostas-chave (perguntas do Pedro)
- **"Quebra o pipeline IA / AEC / gates?"** → **Não na lógica** (mora no repo+edges, não muda). Os 4 asteriscos a tratar (senão a CONEXÃO falha, não a lógica): **(1)** secrets re-setar · **(2)** URL+keys/env Vercel · **(3)** ICP cert+vault re-validar (smoke ITI) · **(4)** JWT por-projeto → usuários re-logam 1×.
- **"Migra os usuários ou entram de novo?"** → **Migram, não re-cadastram.** `public.users` + `auth.users` + **hash de senha** preservados → mantêm a senha. Só **re-logam 1×** (sessão é por-projeto). ⚠️ tratar gotcha tokens-NULL (V1.9.533: tokens = `''` não NULL).
- **"Por que o Core guarda os UUIDs deles?"** → são a **equipe oficial** (Ricardo/Eduardo) = âncora de fallback determinística por especialidade. **Os outros profissionais funcionam normal** (carregados dinâmicos do banco por UUID real). Preservar UUIDs na cópia = oficiais e demais idênticos + dado intacto.

## Deliverable
✅ **`RUNBOOK_MIGRACAO_SUPABASE_SA_EAST_1.md`** criado — 7 fases (pré → estrutura → dados → edges/secrets → cutover → smoke → pós), checklist de smoke (foco ICP + auth + pipeline), legacy-vs-ativo-vs-futuro, gotchas, secrets. Pra executar preciso: **projeto novo sa-east-1 (URL+keys+PAT)** + **secrets** (OpenAI, Resend, cert ICP).

---

# BLOCO B — 🔬 Achados empíricos do dia

## Estado/atividade (7 dias)
11 interações · 3 usuários ativos · 1 agendamento · 0 AEC nova · 0 report · **3 usuários NOVOS reais (18/06)**. App intacto, crons 2.702 runs / **0 falhas**.

## Lauro Pontes (profissional novo — médico/psicólogo amigo da galera, conceituado)
Conta **correta e funcional**: `type=professional` + role `profissional` + onboarding OK + especialidade "Clínico e neurociência" + **CRP 26654/RJ**. **Aparece pros pacientes** (loader puxa type IN profissional/professional). Único detalhe: é **CRP (psicólogo)** → não prescreve controlado (correto); faz chat/AEC/relatório/atestado (conselho sai CRP via fallback V1.9.637). Os 2 pacientes novos (Anthonny/Allan silva vieira) provável mesma família. Todos `paid` mas **0 subscription real** (manual, Stripe off). **Bom sinal de tração orgânica.**

## Card Renal "Nenhuma sugestão pendente" — NÃO é regressão
A view `v_renal_suggestions_active` mostra **pendentes sempre + revisadas só 30 dias**. A única sugestão (Maria das Dores, `approved` revisada **17/05**) está **36 dias atrás** → saiu da janela de 30d → card vazio. Em 07/06 (21 dias) aparecia; hoje envelheceu. **Dado intacto, comportamento correto.** Fundo: o pipeline auto renal quase nunca gera pendentes (1 captation no banco; a da Maria foi manual) — limitação conhecida (neuro-do-report é mais robusto). Empty state em si é melhoria (V1.9.624, antes sumia com `return null`).

---

# BLOCO C — 🏛️ Núcleo constitucional (Livro Magno) + gap fechado

## O que o Magno (canônico v1.0, 06/02) deu
- **COS v5.0 — 5 princípios:** Não-Execução · **Rastreabilidade Total** · Auditoria Ontológica · Autonomia Graduada · Falibilidade Declarada (+ SYSTEM_SEALING: constituição congelada, Magno hasheado no Kernel).
- **Non-Goals** (não substitui julgamento clínico, não executa sem humano, não age só por linguagem natural) — ouro regulatório.
- **Política de evolução controlada · RACI · Economia Two-Track · Mérito.**

## 2 confirmações importantes
1. **Bug da AEC = bugfix, não anti-kevlar:** o Magno diz "fala ≠ ação" e "contratos de trigger clínico não mudam sem novo Magno". O bug FERE isso; corrigir RESTAURA. ✅
2. **Migração = INFRA, não toca constituição** → permitida sem novo Magno (COS/contratos/RACI idênticos; só muda região). ✅

## GAP fechado no runbook
O **`cognitive_events` (CEP)** — log insert-only, **auditabilidade jurídica, hasheado no Kernel** — eu não tinha destacado. Adicionei o **núcleo constitucional/auditoria** ao runbook (preservar com integridade insert-only):
- `cognitive_events` **3.913** (CEP) · `noa_logs` **25.936** (maior tabela, trace cognitivo) · `ai_chat_interactions` **4.421** · `scheduling_audit_log` **51**. → espinha jurídica do COS (princípio Rastreabilidade Total). Perder = perder a defesa em auditoria.
- Economia Two-Track (`gamification_points`/`ranking_history`/`transactions`): vazias/dormentes, preservar schema.

## ⚠️ Magno oficial está ~4 meses stale
O oficial é **06/02/2026 (v1.0)**; o V17 (15/05) é "**Preparado, não cristalizado**" (data-gated: ≥30 AECs externas, ≥5 pagantes). A constituição está **viva no CÓDIGO** (8 locks enforçam), mas o DOCUMENTO não é re-cristalizado desde fev. → quando vier escala (pós-Marco 2), cristalizar **V18** absorvendo abr–jun (sidecars, vínculo, longitudinal, FHIR).

---

# BLOCO D — 🗺️ ARCO COMPLETO DE ~1 ANO (set/2025 → jun/2026)

> Descoberta meta: o **git desta repo só vai até 16/04/2026** (1201 commits: abr 395 · mai 651 · jun 155) — re-inicializado, sem gênese. A história set/2025–mar/2026 vive nos **diários/timelines**, não no git. Único pedaço fino: **set–nov/2025 (Lovable no-code)** — os docs só começam em 21/12/2025; esse trecho vive na memória do Pedro.

## As fases
| Fase | Virada | Marco-âncora |
|---|---|---|
| **Set–dez/2025** | App genérico → jornada de cuidado | 21/12: Vitrine + Trava IMRE + Nôa contextual |
| **Jan/2026** | Assistente → Nôa Residente | **15/01 "Vitória": 1ª AEC completa** (10 fases, sem alucinar) |
| **Fev/2026** | "fala = ação" → **"fala ≠ ação"** | **02/02 COS v3→v5 SYSTEM_SEALING** (cognitive_events) |
| **Fev–mar/2026** | Segurança = features → camada estrutural | **176 → 10 findings** (92%, 19/03); backdoor removido |
| **Mar/2026** | Dashboards por celebridade → identidade adaptativa | 20/03: −8.689 LOC (mata Ricardo/Eduardo Dashboard hardcoded) |
| **Abr/2026** | Prompt = verdade → **dados = verdade** | 02/04: agenda vem de RPC, não do "folclore" do LLM |
| **Mai/2026** | Estabilidade → pre-go-live + tiers | PDF ICP real (V1.9.299), Matrix Z2, Audience Contract; mês de 651 commits |
| **Jun/2026** | Verticalização clínica | 4 sidecars cognitivos, vínculo-sem-AEC, FHIR, atestado, CNPJ |

## O DNA do projeto (3 pivôs filosóficos = o moat)
1. **"fala ≠ ação"** (COS) — IA escuta/sugere; humano + plataforma executam.
2. **"dados ≠ prompt"** — verdade vem de RPC/banco, não do que o LLM "acha".
3. **"segurança é camada, não checklist"** — 176→10, RLS em tudo.
São **postura**, não features — é o que separa dos concorrentes (que têm camadas melhor financiadas, sem a integridade). Lastro forte pro pitch: ~1 ano de endurecimento, não MVP.

---

# BLOCO E — ⚠️ Inconsistência a reconciliar (cap table)
Os docs divergem: **Livro Mestre (04/05) = 25% cada (4×25%=100%)** vs **Dossiê Paulo = 20% cada + 20% Tesouraria**. **Incompatíveis.** É o mesmo problema do pool de Tesouraria (não cabe em contrato de Ltda). **Reconciliar antes do contrato social** (recomendado: 25% cada + pool tratado no acordo de quotistas).

---

# BLOCO F — Estado + pendências
- **Repo:** `ea7fe6d` sincronizado + (após este commit) runbook + diário 23.
- **Holding pattern:** gargalo = Marco 1 CNPJ (documentos 4 sócios + 4 decisões + Pix).
- **Pendências técnicas (atrás de PAT/CNPJ/janela):** migração sa-east-1 (runbook pronto) · bug AEC intent (fix laptop + Ricardo) · Fase 3 CRM backfill · smokes · unificar agendamento slot-picker · WiseCare homolog→prod.
- **Decisões humanas:** CNPJ · cap table reconciliar · 2º médico · 20-30 pagantes · acordo v2.1 · Magno V18 (data-gated).

---

## 🚀 FRASE ÂNCORA 23/06
> *"Dia de profundidade, não de código. Descobri que o servidor está em us-east-1 (EUA) — e que Supabase não muda região: é migração pra projeto novo em São Paulo, com timing a favor (pré-PMF, ~97% teste). Montei o runbook completo (cópia fiel preservando UUIDs, 150 tabelas + 479 RLS + 5 crons + 8 buckets/217 arquivos + núcleo constitucional cognitive_events/noa_logs + secrets re-setados + smoke ICP/auth/pipeline). Li o Livro Magno e fechei o gap do CEP. E vi o ARCO de ~1 ano: o projeto é a destilação de 3 pivôs — 'fala ≠ ação', 'dados ≠ prompt', 'segurança é camada' — que são POSTURA, o moat real. A lógica (IA/AEC/gates/locks) não quebra na migração porque mora no repo; o que precisa é UUIDs preservados + tokens tratados + ICP revalidado + secrets + env. Nada falta pra planejar a migração. Locks 8 intocados. Pendência-mãe segue o CNPJ."*

---

## Próximo passo
1. **Commitar** runbook + este diário (push 4 refs) → disponível no laptop pra execução.
2. Quando Pedro decidir a janela + criar o projeto sa-east-1 + passar secrets → **executar a migração juntos, fase a fase, com smoke**.
3. Reconciliar cap table (25% cada) antes do contrato social.
