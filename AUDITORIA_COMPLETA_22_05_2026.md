# 🔍 AUDITORIA COMPLETA — MedCannLab 3.0 — 22/05/2026

**Método**: empírica. Banco via Supabase Management API (PAT), Edge Functions via API, código via leitura direta, cruzado com diários + memórias + CLAUDE.md. Classificação 🟢 ok / 🟡 atenção / 🟠 dívida / 🔴 risco.

**Veredito de uma linha**: sistema **saudável e vivo**, pré-PMF, com RLS universal e governança clínica intacta. As pendências são de **higiene** (sprawl de tabelas, backups, código morto) e **estruturais conhecidas** (consent-loop, dual-write, tradevision-core monolítico) — nenhuma é incêndio. 1 P0 antigo **resolveu sozinho**; 1 achado novo no script de deploy.

---

## §1 — Banco de dados (139 tabelas)

- **RLS: 139/139 tabelas com Row Level Security habilitado** 🟢. Cobertura universal.
- Tabelas com RLS + 0 policies (= acesso só service_role): 3 backups + `rate_limit_*` + `generated_slides_archive`. Estado **seguro** (locked), não é furo.
- **Vital signs (sistema ativo)** 🟢: 23 AECs / 30d · 121 clinical_reports / 30d · 385 interações IA / 7d · 36 video_call_requests / 30d · 15 cfm_prescriptions / 30d.

### 🟡 Sprawl de tabelas duplicadas (dívida de higiene — conhecida, não tratada)
- **Perfil ×4**: `users` (48) canônica · `user_profiles` (47) · `profiles` (34) · `usuarios` (4). As 3 últimas são legacy/órfãs.
- **Mensagens ×5**: `chat_messages` (10), `chat_messages_legacy` (13, enganosamente a "viva"), `global_chat_messages` (0), `messages` (0), `private_messages` (7).
- **Prescrições ×4**: `cfm_prescriptions` (45, oficial) · `prescriptions` (8, legacy vulnerável) · `patient_prescriptions` (0) · `modelos_receituario`.
- **Notícias ×2**: `news` / `news_items`.

### 🟠 Tabelas de backup antigas ainda no banco
- `documents_backup_23_04_2026` — **458 rows** · `clinical_reports_content_backup_24_04` — 64 rows · `clinical_reports_consent_backup_v1_9_39`. Backups de abril ainda ocupando o schema. Candidatos a dump+drop.

### Contagens que contam história
| Tabela | Rows | Leitura |
|---|---|---|
| `subscription_plans` / `user_subscriptions` / `transactions` | 3 / **0 / 0** | Monetização: planos definidos, **zero receita** — pré-PMF confirmado empíricamente |
| `trl_programs` / `trl_events` | 0 / 0 | Eixo Ensino TRL: **zerado** |
| `professional_integrations` / `integration_jobs` | 0 / 0 | Google Calendar: **dormente**, confirmado |
| `forum_posts` / `noa_clinical_cases` / `ranking_history` | 0 / 0 / 0 | F4 Fórum: infra pronta, **0 rows** |
| `physician_research_dossiers` | 10 | F3 dossiê: **em uso real** |
| `base_conhecimento` | 5 | RAG curado hand-crafted (intocável — V1.9.318) |
| `documents` | 42 | Acervo institucional |
| `clinical_reports` / `clinical_assessments` / `clinical_axes` / `clinical_rationalities` | 138 / 67 / 465 / 104 | Núcleo clínico ativo |

---

## §2 — Edge Functions

13 funções ativas. Principais: `tradevision-core` **v407** (core IA Nôa, `verify_jwt:true`), `digital-signature` v65, `wisecare-session` v78, `send-email` v59, `extract-document-text` v59, `video-call-request-notification` v59, `get_chat_history` v8. Todas `status: ACTIVE`.

### 🟠 ACHADO NOVO — script `deploy:tradevision` com flag errada
O script `npm run deploy:tradevision` (criado V1.9.419, na branch do refator) usa `--no-verify-jwt`. Mas a `tradevision-core` em produção está **`verify_jwt:true`**. Deployar com o script **fliparia** verify_jwt true→false — mudança de comportamento na borda. **Corrigir o script** (remover `--no-verify-jwt`) ANTES do deploy do refator.

---

## §3 — Segurança & integridade

- 🟢 **RLS universal** (139/139). **41 views, todas `security_invoker`**.
- 🟢 **P0 RESOLVIDO**: o backlog (`audit_pendencias_um_mes_pos_pbad_20_05`) listava "2 views SECURITY DEFINER" como P0 — **hoje 0 views são definer**. Fechou.
- 🟢 **5 triggers** em `auth.users` (`on_auth_user_created`, `on_auth_user_created_profile`, `on_auth_user_deleted`, `trg_auth_users_to_user_profiles`, `trg_link_existing_user`).
- 🟠 **3 órfãos `auth.users` sem `public.users`** (bug class "consent loop"): `af59920c` (graca11souza62@ — duplicata vazia da Maria das Graças), `46dd5787` (fake confirmado), `3f241baa` (typo confirmado). 0 órfãos novos em 3 semanas → trigger não está espalhando.
- 🟡 **Encryption fallback dev** (`encryption.ts:7`) — chave hardcoded se `VITE_ENCRYPTION_KEY` ausente no Vercel. **Pendência humana**: Pedro verificar o env do Vercel.
- 🟡 **Ricardo UUID hardcoded** (`2135f0c0`) em 4 pontos do `tradevision-core` — bloqueador do Marco 3 (2º médico).
- 🟡 **Dual-write não-formalizado** `clinical_rationalities` (104) ↔ `clinical_reports.content.rationalities` (jsonb) — concordam "por coincidência"; contrato de reconciliação pendente.

---

## §4 — Frontend / código

- 🟢 `npm run type-check` (tsc) **limpo**.
- 🟢 Bug **"consent loop" corrigido hoje** (V1.9.420, `6a653cb`) — `ConsentGuard` agora checa o resultado do update; 0 linhas/erro → mensagem clara, nunca mais loop infinito.
- 🟠 **`tradevision-core/index.ts` = 7036 linhas** (monolito). Refator anti-bus-factor **iniciado e pausado** na branch `refactor/tradevision-core-modular` (V1.9.419+A/B/C/D — proteções + cors/types/triggers extraídos + 109 linhas de código morto removidas; `deno check` baseline verde). NÃO deployado. Aguarda decisão de deploy+smoke+merge.
- 🟡 Pendências de código conhecidas (não verificadas nesta passada, do backlog): AEC em `localStorage`, `esm.sh` sem lockfile, `is_professional_patient_link` v2.

---

## §5 — Aliveness das features (taxonomia 4 classes)

| Classe | Features |
|---|---|
| 🟢 **CORE vivo** | AEC + Pipeline (23 AECs/30d) · Chat Nôa clínico · Assinatura digital ICP-Brasil (PBAD AD-RB) · Prescrições CFM (15/30d) · Vídeo WiseCare (36/30d) · Nôa Matrix + F3 dossiê (10 dossiês) |
| 🟡 **Infra sem adoção** | F4 Fórum (end-to-end pronto, 0 posts) · NFT consent (30 rows, pouca adoção) · Sidecar renal |
| ❄️ **Latente / dormente** | Google Calendar (0/0) · TRL eixo Ensino (0/0) · Monetização (planos prontos, 0 receita) · Ranking/mérito (`ranking_history` 0) |
| ❌ **Morto / descartável** | `messages`/`global_chat_messages` (0) · `patient_prescriptions` (0) · `noa_clinical_cases` (0, órfã) · 3 tabelas backup abril · tabelas perfil legacy (`profiles`/`usuarios`) |

---

## §6 — Reconciliação com o backlog conhecido

| Item | Status 22/05 |
|---|---|
| 2 views SECURITY DEFINER (P0) | 🟢 **RESOLVIDO** (0 definer) |
| Bug consent loop | 🟢 **Código corrigido hoje** (V1.9.420) |
| RLS chat-images | 🟢 fechado (V1.9.98) |
| Encryption fallback `VITE_ENCRYPTION_KEY` | 🟡 aberto — pendência humana (Vercel env) |
| Ricardo UUID hardcoded | 🟡 aberto — bloqueador Marco 3 |
| 72 órfãos bucket `documents` | 🟡 aberto (não re-verificado nesta passada) |
| WiseCare homolog → produção | 🟡 aberto |
| Dual-write contract | 🟡 aberto |
| tradevision-core 7036 linhas | 🟠 refator iniciado/pausado |
| AEC localStorage / esm.sh lockfile | 🟡 abertos |
| Sprawl de tabelas / backups | 🟠 não tratado |

---

## §7 — Prioridades calibradas

🔴 **Nenhum incêndio.** Não há risco ativo de dados/segurança.

🟠 **Antes do deploy do refator**: corrigir o `--no-verify-jwt` do script `deploy:tradevision`.

🟡 **Pendência humana barata** (destrava sozinha): Pedro verificar `VITE_ENCRYPTION_KEY` no Vercel.

🟡 **Higiene quando houver folga** (1 sprint de limpeza): dump+drop dos 3 backups · escolher 1 caminho de perfil/mensagem/prescrição e aposentar o resto · limpar os 3 órfãos `auth.users` (decisão humana — Maria confirma e-mail antes).

🤝 **Destrava o roadmap** (não-código): Marco 1 (CNPJ + cap table) · Ricardo UUID antes do Marco 3 · WiseCare produção antes de paciente externo.

⚪ **Parqueado com gatilho**: refator tradevision-core (2º dev / mudança grande) · F3 dossiê v2 · otimizações de pipeline.

---

## Frase âncora da auditoria

> *"O sistema não tem incêndio — tem higiene pendente. RLS é universal, as views estão todas blindadas (um P0 antigo resolveu sozinho), a governança clínica está intacta e o app é usado de verdade (23 AECs/mês). O que sobra é dívida acumulada visível — sprawl de 139 tabelas, backups de abril, um core de 7 mil linhas — e o de sempre: o gargalo não é mais 'consegue construir?', é 'CNPJ + 1º pagante'. A auditoria empírica achou 1 P0 que se resolveu, 1 bug de script no caminho do refator, e confirmou que quase tudo que parecia risco é, na real, dívida calma."*

— Auditoria 22/05/2026 · 139 tabelas · 13 Edge Functions · 41 views · empírica via PAT · classificada 🟢🟡🟠🔴

---

## ✅ Atualização — Classe A executada no mesmo dia (22/05, tarde)

A "schema hygiene sprint" (Classe A — safe wins) foi executada:

- **Fix `--no-verify-jwt`** — script `deploy:tradevision` corrigido (V1.9.419-E, commit `a7b211f`, branch do refator). Deploy do refator agora preserva `verify_jwt:true`.
- **3 backups arquivados + dropados** — exportados pra `docs/archive_backups_22_05/` (dump JSON + schema, commit `37041ab`) e então `DROP TABLE` (verificado: 0 tabelas "backup" restantes). 139 → 136 tabelas. Reversível pelo arquivo.

Análise profunda confirmou o que **NÃO** atacar: tabelas vazias (`patient_prescriptions`, `noa_clinical_cases`, `messages`…) são referenciadas por código vivo — dropá-las seria regressão. Sprawl de perfil/mensagem/prescrição = migração arquitetural, não higiene. Ficam parqueados como Classe B.

---

## 🔬 Análise profunda — 3 investigações empíricas (22/05, tarde)

Aprofundamento read-only nos concerns que a auditoria de superfície só tocou. Padrão: **2 de 3 deflacionaram, 1 confirmou pequeno.**

### 1. Dual-write — divergência MEDIDA: 4 de 140 reports (~3%)
Comparação `clinical_rationalities` (tabela) × `clinical_reports.content.rationalities` (jsonb):
- 94 consistentes (nos 2 lados) · 42 sem rationalities em nenhum (ok) · **4 divergem** (1 só-jsonb, 3 só-tabela).
- O CLAUDE.md dizia "concordam por coincidência" → **medição real: 96% consistente, 4 driftados.** Os 3 "só-tabela" provavelmente são a latência documentada (edge escreve tabela 1º). Não é emergência (4 linhas, pré-PMF) — mas confirma que o contrato de reconciliação parqueado é necessidade real.

### 2. Qualidade das policies RLS — 🟢 sólida (não só "ligada")
As ~42 policies `USING(true)`/`with_check(true)` triadas: SELECT-true = dado público/catálogo (cursos, lições, TRL, canais) por design; escrita-true `service_*` corretamente escopada a `service_role`. **Nenhuma tabela de dado sensível** (`clinical_*`, `patient_*`, `users`, `prescriptions`, `appointments`) tem policy permissiva. Nitpick trivial: `noa_logs`/`pending_ratings` aceitam INSERT de `authenticated` (risco = poluir log).

### 3. Storage — P0 "72 órfãos no bucket documents" → 🟢 REFUTADO
Bucket `documents`: 132 objetos, **0 com owner deletado, 0 sem owner**. O P0 do backlog antigo está stale/resolvido. (1 arquivo perdido em `chat-audio` — trivial.)

### Atualização do §6 (reconciliação do backlog)
- **72 órfãos bucket `documents`** → 🟢 **resolvido/stale** (0 órfãos reais hoje).
- **Dual-write contract** → 🟡 aberto, mas agora **quantificado** (4/140 ~3%).
- **Qualidade RLS** → 🟢 confirmada sã (não havia sido verificada além de "habilitado").
