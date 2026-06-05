---
name: reference_deploy_edge_supabase_access_token_env_var_05_06
description: "Pattern canônico de deploy Edge Function via SUPABASE_ACCESS_TOKEN env var quando CLI não está autenticado interativamente. Mesmo PAT da Management API serve. V1.9.603 validou empíricamente: tradevision-core v427→v428 deployed sem npx supabase login. Smoke matriz 3/3 PASS (versão incrementou + verify_jwt preservado + curl 401 sem JWT). Aplicável a qualquer Edge sem precisar autenticar terminal."
type: reference
---

# Pattern deploy Edge via SUPABASE_ACCESS_TOKEN env var (CLI sem `supabase login`)

## A regra

Quando `npx supabase functions deploy ...` retornar **401 Unauthorized** porque CLI não foi autenticado via `supabase login`, usar `SUPABASE_ACCESS_TOKEN` env var com mesmo PAT da Management API:

```bash
SUPABASE_ACCESS_TOKEN="sbp_..." npx supabase functions deploy <slug> --project-ref <ref>
```

PAT do Pedro/Project Owner serve perfeitamente. Funciona em sessões Claude (CLI não-interativo) sem precisar abrir browser pra OAuth.

## Why (caso empírico V1.9.603)

**05/06/2026 ~19h BRT** — sessão laptop, tentei deploy de `tradevision-core` (Edge Core) após commit V1.9.603 (fix type EN/PT bilíngue). Primeira tentativa **falhou 401**:

```bash
npx supabase functions deploy tradevision-core --project-ref itdjkfubfzmvmuxxjoae
# unexpected deploy status 401: {"message":"Unauthorized"}
```

**Diagnóstico**: CLI não estava autenticado (`supabase login` requer browser, não funciona em sessão Claude headless).

**Solução**: usar mesmo PAT da Management API via env var:

```bash
SUPABASE_ACCESS_TOKEN="<PAT_DO_DONO_DO_PROJETO>" \
  npx supabase functions deploy tradevision-core --project-ref itdjkfubfzmvmuxxjoae
# Deployed Functions on project itdjkfubfzmvmuxxjoae: tradevision-core ✅
```

Versão incrementou v427 → **v428** automaticamente.

## How (passos canônicos)

### 1. Pré-deploy: validar código no git
```bash
git status                        # working tree limpo após commit
git log -1 --oneline              # HEAD = commit do fix
npm run type-check                # verde
```

### 2. Deploy
```bash
SUPABASE_ACCESS_TOKEN="<PAT>" npx supabase functions deploy <slug> --project-ref <ref>
```

### 3. Smoke matriz pós-deploy (3 checks)
```bash
PAT="<PAT>"
PROJ="<ref>"

# Smoke 1: versão incrementou + status ACTIVE
curl -sS "https://api.supabase.com/v1/projects/${PROJ}/functions/<slug>" \
  -H "Authorization: Bearer ${PAT}" | grep -oE '"(version|status|verify_jwt)":[^,}]+'

# Smoke 2: curl sem JWT deve retornar 401 (defesa em camadas)
curl -sS -X POST "https://${PROJ}.supabase.co/functions/v1/<slug>" \
  -H "Content-Type: application/json" -d '{"smoke":"test"}' -w "\nHTTP: %{http_code}\n"
# Esperado: HTTP 401 UNAUTHORIZED_NO_AUTH_HEADER

# Smoke 3: verify_jwt=true preservado (não regrediu V1.9.506)
curl -sS "https://api.supabase.com/v1/projects/${PROJ}/functions" \
  -H "Authorization: Bearer ${PAT}" | grep -oE '"slug":"<slug>"[^}]+verify_jwt[^,]+'
```

## Quando NÃO usar

- ❌ Deploy de Edge crítica em produção sem **slug-test paralelo prévio** quando mudança é estrutural (lógica/auth/RLS). Pattern V1.9.506/V1.9.566 para essas: deploy `<slug>-test` paralelo primeiro, smoke 4-5 papéis, FLIP produção depois.
- ❌ Mudanças que tocam pirâmide 8 camadas (Verbatim First / Pipeline / RAG / Audience Contract / REGRA HARD §1) sem aval Pedro+Ricardo.
- ❌ Quando há cron pg_cron consumindo a Edge — verify_jwt flip pode quebrar cron sem service_role JWT (lição V1.9.520-526 batch).

## Quando aplicar diretamente (caso V1.9.603)

- ✅ Mudança **aditiva/superset** (não remove filtro existente, só amplia)
- ✅ Pattern já validado em N spots (V1.9.596 validou em 9 spots frontend → 2 spots Core idênticos)
- ✅ Type-check verde garantido
- ✅ Zero mudança de lógica/comportamento clínico
- ✅ Locks 8 intocados

## Casos empíricos

| Versão | Edge | Tipo | Slug-test? |
|---|---|---|---|
| V1.9.506 (30/05) | tradevision-core | Camada 0 (verify_jwt flip) | ✅ obrigatório |
| V1.9.520-526 (30/05) | 7 Edges batch | Camada 0 (verify_jwt flip) | ✅ obrigatório |
| V1.9.566 (02/06) | tradevision-core | Sanitize PII (mudança lógica) | ✅ obrigatório |
| V1.9.580 (03/06) | tradevision-core | Guard anti-leak RAG (lógica) | ✅ obrigatório |
| V1.9.582 (04/06) | tradevision-core | Dead code remove | ⚠️ pode pular (alcançabilidade já provada) |
| **V1.9.603 (05/06)** | tradevision-core | Filtro aditivo (.eq → .in) | ❌ direto (aditivo, sem regressão por design) |

## Anti-padroes

❌ **NUNCA** hardcoded PAT no diretório do projeto (`.supabase/access-token` ou similar). Sempre env var na invocação.
❌ **NUNCA** commitar PAT em `.env` ou config files do repo.
❌ **NUNCA** deploy de mudança lógica/auth sem slug-test paralelo (pattern V1.9.506/566).
❌ **NUNCA** deploy sem smoke matriz 3 checks pós (versão + 401 + verify_jwt).

## Conexoes

- [[feedback_pattern_powershell_utf8_curl_data_binary_02_06]] — pattern UTF-8 PAT (Management API REST)
- [[project_v1_9_506_sprint_a_verify_jwt_restaurado_30_05]] — slug-test paralelo pattern
- [[feedback_authz_uuid_singleton_substitui_email_includes_05_06]] — V1.9.601 frontend equivalente (não precisa deploy Edge)
- DIARIO_05_06_2026_PARTE_2_LAPTOP_SANEAMENTO_AUTHZ.md §F+L — execução completa V1.9.601 + V1.9.603

## Frase ancora

> *"05/06: deploy de tradevision-core v427→v428 via SUPABASE_ACCESS_TOKEN env var com mesmo PAT da Management API. Primeira tentativa npx supabase functions deploy falhou 401 (CLI não autenticado). Workaround: prefix env var na invocação. Pattern reusável: PAT do dono do projeto serve perfeitamente como token de deploy sem precisar supabase login interativo (browser). Smoke 3/3 PASS pós-deploy (v428 ACTIVE + curl 401 + verify_jwt=true preservado). Aplicável em sessões Claude headless sem terminal interativo."*
