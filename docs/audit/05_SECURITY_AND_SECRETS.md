# 05_SECURITY_AND_SECRETS — Auditoria Segurança + Secretos — 29/05/2026

**Método**: PAT empírico Edges/RLS/Storage + grep secretos em `src/`.

---

## TL;DR (6 bullets)

1. **🔐 14 Edges ativas**: 12 com `verify_jwt=FALSE` + apenas 2 com `verify_jwt=TRUE` (`extract-document-text` v62, `send-email` v62). **Crítico**: `tradevision-core` v422 mudou silenciosamente de `true→false` desde 22/05 (bomba latente cumprida)
2. **🟢 Sem secretos hardcoded em `src/`** — grep `sbp_/service_role/SERVICE_ROLE_KEY` = 0 matches em código fonte
3. **🟢 `.claude/settings.local.json` no `.gitignore`** — 2 PATs hardcoded **NÃO vazaram** pro GitHub
4. **🟢 8 Storage buckets**: 7 privados + 1 público (`avatar`, esperado)
5. **🟠 Vulnerabilidade conhecida documentada** em `tradevision-core/index.ts` linha 2567-2574 — comentário do dev: *"Authorization header com email: 'phpg69@gmail.com' no body conseguia... Mudanças 1 (remover --no-verify-jwt no CI)"* — ack mas NÃO corrigido
6. **🔐 1 PAT em sessão atual** (`sbp_cc2afa...`) ainda ativo após 12h+, exposto via Push Protection log GitHub manhã → **rotar AGORA**

---

## §1 — Edge Functions verify_jwt status (14 ativas)

| # | Edge | Version | verify_jwt | Status | Auth manual interna? |
|---|---|---|---|---|---|
| 1 | `tradevision-core` | **v422** | **FALSE** ⚠️ | ACTIVE | ✅ linha 1799 `auth.getUser()` |
| 2 | `get_chat_history` | v8 | FALSE | ACTIVE | ❓ verificar |
| 3 | `digital-signature` | v68 | FALSE | ACTIVE | ❓ verificar |
| 4 | `video-call-request-notification` | v62 | FALSE | ACTIVE | ❓ verificar |
| 5 | `extract-document-text` | v62 | **TRUE** ✅ | ACTIVE | n/a (gateway protege) |
| 6 | `send-email` | v62 | **TRUE** ✅ | ACTIVE | n/a |
| 7 | `wisecare-session` | v81 | FALSE | ACTIVE | ❓ verificar |
| 8 | `google-auth` | v29 | FALSE | ACTIVE (dormente) | ❓ |
| 9 | `sync-gcal` | v29 | FALSE | ACTIVE (dormente) | ❓ |
| 10 | `video-call-reminders` | v31 | FALSE | ACTIVE (cron) | n/a (cron interno) |
| 11 | `cert-encrypt-password` | v6 | FALSE | ACTIVE | ❓ |
| 12 | `generate-nft-from-report` | v6 | FALSE | ACTIVE | ❓ |
| 13 | `sign-pdf-icp` | v22 | FALSE | ACTIVE | ✅ V1.9.457 fechou auth interna |
| 14 | `renal-signal-extractor` | v4 | FALSE | ACTIVE | ❓ |

### Resumo
- **2/14 (14%)** com gateway JWT protection
- **12/14 (86%)** dependem de auth interna manual ou são internas (cron)
- **2/14 com auth interna confirmada**: `tradevision-core` + `sign-pdf-icp`
- **10/14 sem confirmação interna** = AUDITORIA EXPANDIDA NECESSÁRIA Sprint pós-Marco 2

### Vulnerabilidade ativa conhecida (não-corrigida)
`tradevision-core/index.ts` linhas 2567-2574 (comentário literal do dev):
> *"Authorization header com `email: 'phpg69@gmail.com'` no body conseguia [bypass]. NOTA: este é fix DEFENSIVO. Mudanças 1 (remover --no-verify-jwt no CI) e 2..."*

**Estado**: o vetor de ataque está coberto pela camada interna `auth.getUser()` (linha 1799), mas o vetor de defesa-em-camadas (gateway JWT) NÃO foi restaurado.

**Recomendação**: corrigir script `npm run deploy:tradevision` removendo `--no-verify-jwt` ANTES do próximo deploy. Custo: 1 linha de código.

---

## §2 — Secrets em `src/` (grep)

| Padrão buscado | Matches em `src/` |
|---|---|
| `sbp_` (PAT Supabase) | **0** ✅ |
| `service_role` | **0** ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | **0** ✅ |

→ Frontend limpo. Apenas `VITE_SUPABASE_ANON_KEY` exposto (esperado — ele é anon).

---

## §3 — Secrets fora de `src/` (auditoria escopo expandido)

### `.claude/settings.local.json` (NÃO commited)
**2 PATs hardcoded** (valores mascarados):
- `sbp_990e2423...8949144b736` (Supabase PAT #1)
- `sbp_6ca2f018...742722bf` (Supabase PAT #2)

**Confirmação `.gitignore`**: `.claude/` listado → ✅ não vazou pro GitHub.

**Risco residual**: PATs no disco local de Pedro. Se laptop comprometido, atacante tem `SUPABASE_ACCESS_TOKEN` ativo + permissão de deployar `tradevision-core` com `--no-verify-jwt`.

**Recomendação**: rotar AMBOS via Supabase Dashboard → Account → Access Tokens → Revoke + Generate new.

### Sessão atual Claude (PAT em uso)
- `sbp_cc2afa...4630b` (mascarado) — 12h+ ativo
- Exposto no log Push Protection do GitHub HOJE (commit `e7f6cdb`, depois amend pra mascarar)
- **Rotação URGENTE** — princípio cristalizado "PAT rotation fim de sessão" virou "PAT exposto, rotar AGORA"

---

## §4 — Storage Buckets (8)

| Bucket | Public? | Status | Observação |
|---|---|---|---|
| `avatar` | **TRUE** | OK | Esperado pra avatars (sem PHI) |
| `certificates` | FALSE | ✅ | ICP-Brasil PKI |
| `chat-audio` | FALSE | ✅ | |
| `chat-images` | FALSE | ✅ | V1.9.98 fechou |
| `documents` | FALSE | ✅ | RAG + acervo institucional |
| `nfts` | FALSE | ✅ | NFT consent V1.9.311 |
| `patient_documents` | FALSE | ✅ | RLS por patient_id |
| `signed_documents` | FALSE | ✅ | PDFs assinados ICP |

→ Estrutura saudável. Único público é `avatar` (correto).

**Pendente** (Sprint 3): policies por bucket — quem pode upload, quem pode read.

---

## §5 — RLS Audit (451 policies em 142 tabelas)

**De 22/05** (confirmado válido):
- 139/139 tabelas com RLS ON (hoje 142/140 — view inclusion)
- 41 views todas `security_invoker` (não `security_definer`) — sem bypass de RLS via view

**Não-auditado hoje** (pendente Sprint pós-Marco 2):
- Policies redundantes (mesma operação coberta 2x com lógica idêntica)
- Policies contraditórias (uma allow + outra deny no mesmo path)
- UUIDs hardcoded em policies (Eduardo `f4a62265` + admin Pedro `17345b36` + admin Ricardo `99286e6f` em `clinical_reports` policy — descoberto 28/05)

---

## §6 — Auth & MFA

**Não-auditado** via PAT este sprint:
- MFA habilitado por user (manualmente?)
- Sessões ativas / refresh tokens
- Rate limiting (`rate_limit_buckets` tem 36 rows — ativo)
- Captcha em login

**Recomendação Sprint pós-Marco 2**: validar MFA elegibilidade pra admin (Pedro, Ricardo admin, Eduardo).

---

## §7 — Hierarquia de risco (security)

### 🔐 Irreversíveis (atenção máxima)
1. **PAT sessão atual `sbp_cc2afa...`** — rotar AGORA (exposto via Push Protection log)
2. **2 PATs `.claude/settings.local.json`** — rotar HOJE (não-commited mas no disco local)
3. **`tradevision-core` verify_jwt=false** — comportamento OK por auth interna, mas defesa-em-camadas quebrada. **Restaurar verify_jwt=true via correção do script `deploy:tradevision`**

### 🔴 Quebra uso real
- Nenhum incidente confirmado

### 🟡 Atrito de fluxo
- 10/14 Edges sem confirmação de auth interna manual — auditar pós-Marco 2
- UUIDs hardcoded em RLS `clinical_reports` (Eduardo + 2 admins) — bloqueador de escalar pra 3º médico não-admin

### ⚫ Polish/arquitetura
- MFA opcional pra admin
- Storage policies auditadas individualmente
- RLS redundância

---

## §8 — Frase âncora

> *"Frontend limpo (0 secretos hardcoded em src/). 7/8 buckets privados (avatar público esperado). 12/14 Edges com verify_jwt=false — bomba latente do 22/05 cumprida (tradevision-core v407 → v422 com flag flipada). 2 PATs no disco local + 1 em sessão exposto via Push Protection = rotar HOJE. Auth interna manual cobre 2/14 confirmados (tradevision-core + sign-pdf-icp); 10/14 não-verificados ainda. RLS 142/140 cobertura universal (saudável)."*
