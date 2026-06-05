---
name: feedback_nunca_documentar_valor_real_pat_secret_em_memoria_05_06
description: "Princípio operacional cravado por Pedro 05/06 noite após eu repetir anti-padrão V1.9.604 (PAT real em exemplo de memória deploy Edge). Quando uso credencial ativa (PAT/JWT/service_role/API key) em sessão Claude headless, NUNCA documentar o VALOR REAL em memória, diário ou doc. Eu sei usar via env var no ambiente — exemplo só precisa de placeholder. Anti-padrão: 'documentar como uso' inclui o segredo real. Pedro: 'so nao subir a pat ue vc ja usa ela pra que documentar hahaha'. Vetor de risco: secret scanning bloqueia push origin + commit fica em hub público + rotação obrigatória + descasamento branches."
type: feedback
---

# NUNCA documentar valor real de PAT/secret em memória ou doc

## A regra

Quando eu uso credencial ativa (PAT, JWT, service_role key, API key, deploy token, OAuth token) numa sessão Claude headless, **NUNCA documentar o VALOR REAL** em:
- Memórias persistentes (`docs/memorias/`)
- Diários (`DIARIO_*.md`)
- CLAUDE.md
- Arquivos de doc (README, INVESTMENT_KIT, etc.)
- Code comments
- Migration files
- Test fixtures versionadas

**Padrão correto**: usar placeholder explicitamente delimitado:
- `<PAT_DO_DONO_DO_PROJETO>`
- `<SERVICE_ROLE_KEY>`
- `<MANAGEMENT_API_PAT>`
- `sbp_***REDACTED***`

## Why (caso empírico V1.9.604 → V1.9.605)

**05/06 ~19h BRT** — codei memória `reference_deploy_edge_supabase_access_token_env_var_05_06.md` documentando pattern de deploy Edge via env var. Incluí o **PAT real Pedro** no exemplo bash:

```bash
SUPABASE_ACCESS_TOKEN="sbp_91883cd43..." npx supabase functions deploy ...
```

**Consequências cascateadas**:
1. Commit `090af13` aceito em hub (Push Protection laptop ausente)
2. Origin (medcannlab5) **REJEITOU** com `secret-scanning` block
3. Sanitize commit V1.9.604-A (`d848bd9`) NÃO RESOLVEU porque 090af13 segue na história
4. **Descasamento hub vs origin permanente** até bypass URL / squash history / rotação completa
5. **Próximo commit V1.9.605 (`e06d662`) também bloqueado em origin** (mesmo motivo cascateado)
6. Rotação PAT virou pendência URGENTE (`risco alto #1` no checklist)

**05/06 noite após push hub OK + origin bloqueado** — Pedro recalibrou direto:

> *"so nao subir a pat ue vc ja usa ela pra que documentar hahaha"*

**Lição cristalizada**: documentar PATTERN não inclui o SECRET. Eu já uso a credencial via env var no ambiente headless — o exemplo na memória só precisa mostrar a SHAPE do comando, não o valor.

## How (aplicação correta)

### Caso de uso 1 — documentar deploy

❌ Errado:
```bash
SUPABASE_ACCESS_TOKEN="sbp_91883cd43a..." npx supabase functions deploy core
```

✅ Correto:
```bash
SUPABASE_ACCESS_TOKEN="<PAT_DO_DONO>" npx supabase functions deploy core
```

### Caso de uso 2 — documentar invocação curl

❌ Errado:
```bash
PAT="sbp_91883cd43a..."; curl -H "Authorization: Bearer ${PAT}" ...
```

✅ Correto:
```bash
PAT="<MANAGEMENT_API_PAT>"; curl -H "Authorization: Bearer ${PAT}" ...
```

### Caso de uso 3 — documentar configuração

❌ Errado em qualquer config commitado:
```yaml
supabase_access_token: sbp_91883cd43a...
```

✅ Correto:
```yaml
supabase_access_token: ${SUPABASE_ACCESS_TOKEN}  # env var
```

### Caso de uso 4 — execução em bash inline

A execução EM BASH durante a sessão pode usar o valor real (sandbox local, não commitado):
```bash
PAT="sbp_91883cd43a..."; curl ... # OK aqui, é runtime
```

MAS o **registro do que foi feito** em memória/diário/doc usa placeholder:
```markdown
Rodei query via Management API:
`PAT="<PAT>"; curl -H "Authorization: Bearer ${PAT}" ...`
```

## Quando aplicar

- ✅ **SEMPRE** ao escrever memória que mostra invocação de credencial
- ✅ **SEMPRE** ao escrever diário que cita pattern de deploy/auth
- ✅ **SEMPRE** ao incluir bash/curl/env vars em CLAUDE.md
- ✅ **SEMPRE** em INVESTMENT_KIT, README, docs/sgq/

## Quando NÃO aplicar (exceções)

- ❌ Não tem exceção. Mesmo se Pedro mandou PAT no chat agora (é apropriado pra eu usar no runtime), NÃO copio pro arquivo versionado.
- ❌ "Mas vai ser rotacionado mesmo" não é justificativa — secret scanning ainda bloqueia + commit fica eternamente na história git.

## Anti-padrões a vigiar (auto-correção pré-Write)

Antes de chamar Write/Edit tool com conteúdo que inclui credencial, perguntar:

1. **Existe `sbp_`, `eyJ`, `sk_`, `pk_`, `ghp_` no texto?** → REDIGIR pra placeholder
2. **Existe valor real de `SUPABASE_ACCESS_TOKEN`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_KEY`, `OPENAI_API_KEY`?** → REDIGIR
3. **Estou colando output de bash que retornou secret no JSON?** → SUBSTITUIR campo
4. **Eu mesmo gerei valor secreto via tool (uuid + crypto)?** → tratar como secret real

## Conexões

- `feedback_doc_institucional_sem_pat_nao_e_valido_23_05` — Ricardo cravou: doc institucional sem PAT cruzar não é válido. Aqui é o INVERSO: PAT cruzar É obrigatório mas SEU VALOR não vai pro doc.
- `feedback_nunca_criar_auth_users_sql_direto_tokens_null_31_05` — anti-padrão paralelo (operação destrutiva sem aval).
- `reference_deploy_edge_supabase_access_token_env_var_05_06` — memória onde o anti-padrão aconteceu (V1.9.604), depois sanitizada V1.9.604-A.
- V1.9.604 / V1.9.604-A → V1.9.605 cascata de bloqueios cravada em `project_estado_final_sessao_laptop_05_06_pos_reuniao_ricardo_eduardo` + `CHECKLIST_AVANCOS_RISCOS_05_06_POS_REUNIAO`

## Frase ancora

> *"05/06 noite Pedro recalibrou: 'so nao subir a pat ue vc ja usa ela pra que documentar hahaha'. Princípio cristalizado: PAT/secret que eu uso ATIVAMENTE via env var em runtime NUNCA vai em arquivo versionado — só placeholder. Exemplo na memória mostra a SHAPE do comando, NUNCA o VALOR. Anti-padrão V1.9.604: PAT real no exemplo bash gerou cascata (Push Protection bloqueia origin + d848bd9 sanitize não resolveu pq 090af13 segue na história + V1.9.605 também bloqueado em origin + rotação obrigatória + descasamento branches permanente). Auto-checagem pré-Write: existe sbp_/eyJ/sk_/ghp_ no texto? REDIGIR."*
