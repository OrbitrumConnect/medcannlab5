---
name: v1-9-517-get-chat-history-jwt-flip-observacao-48h-30-05
description: "30/05/2026 ~15h BRT — V1.9.517 flip verify_jwt false→true na Edge get_chat_history v8 (snake_case orfa, criada 21/jan/2026 com tradevision-core ja operacional). Estrategia opcao (A) consolidada Claude+GPT externo+Pedro+Claudio: nao deletar antes de observar consumidor externo escondido. Smoke pos-flip via curl: sem JWT=401 + JWT invalido=401 ambos PASS. Defesa em camadas restaurada. **Janela de observacao 48-72h**: se ZERO erro 401 inesperado em Supabase Functions logs (panel manual) ate 01/jun (segunda) 15h BRT → autorizado V1.9.518 hard-delete via Management API DELETE. Se aparecer 401 com user_agent identificado → investigar consumidor + decidir restaurar/comunicar antes de deletar. **Timeline empirica corrigida**: Edge NAO antecede core (tradevision-core 12/jan; get_chat_history 21/jan = 9 dias DEPOIS); v8 com 7 atualizacoes em 5 meses sugere uso historico real que ficou orfao em algum refator nao-documentado entre jan-mai 2026. PATCH Management API zero risco arquitetural (Lock V1.9.299 sign-pdf-icp INTOCADO, tradevision-core INTOCADO, todas 13 outras Edges INTOCADAS)."
metadata:
  node_type: memory
  type: project
  originSessionId: 00be2b9f-5dbc-4236-a02e-1459c3f57bd2
---

# V1.9.517 — get_chat_history flip verify_jwt + observacao 48h

## A acao executada

**Endpoint alvo**: `https://itdjkfubfzmvmuxxjoae.supabase.co/functions/v1/get_chat_history`

**Mudanca aplicada**: PATCH Management API → `verify_jwt: false` → `verify_jwt: true`

**Comando reproducivel**:
```bash
curl -s -X PATCH "https://api.supabase.com/v1/projects/itdjkfubfzmvmuxxjoae/functions/get_chat_history" \
  -H "Authorization: Bearer $PAT" \
  -H "Content-Type: application/json" \
  -d '{"verify_jwt":true}'
```

**Resposta empirica**: `{"slug":"get_chat_history","version":8,"status":"ACTIVE","verify_jwt":true}` ✅

## Smoke validation 2/2 PASS

| Teste | Comando | Esperado | Real |
|---|---|---|---|
| Sem JWT | `curl URL` (sem Authorization header) | 401 | **401** ✅ |
| JWT invalido | `curl URL -H "Authorization: Bearer eyJfake.invalid.token"` | 401 | **401** ✅ |

Edge agora rejeita anonimo no ingress (camada Supabase) antes de chegar ao codigo Deno — defesa em camadas restaurada igual padrao V1.9.506 Sprint A em tradevision-core.

## Timeline empirica corrigida (importante)

Pergunta de Pedro originalmente: *"foi criado em janeiro antes de todo core entao nao afeta nada nem foi usado?"*

**Resposta empirica via PAT Management API**:
- `tradevision-core` v1: criada **12/jan/2026**
- `ai_chat_interactions`: comeca a popular **15/jan/2026** (41 rows) — chat operacional via core
- `get_chat_history` v1: criada **21/jan/2026** = **9 dias DEPOIS** do core estar operacional

Logo: Edge **NAO antecede o core**. Foi criada PARALELA, provavelmente como adjunct de memoria curta (frontend chama get_chat_history → monta contexto → envia pro core → LLM). Em algum refator nao-documentado entre jan-mai/2026, core absorveu essa funcionalidade internamente e Edge ficou orfa.

**v8 ACTIVE = 7 atualizacoes em ~5 meses** sugere uso historico real em algum periodo. Nao foi abandonada em v1.

## Por que flip primeiro + esperar 48h em vez de deletar direto

**Anti-padrao healthtech**: deletar Edge ACTIVE sem smoke porque 5 evidencias internas (grep src/ + grep supabase/ + cron.job + types.ts + body PASSIVA) deram "zero callers".

**Calibracao empirica chave** (Claude2 externo + GPT externo + Claudio convergiram):
> *"Nao encontramos callers no codigo NAO eh equivalente a nao existe caller."*

Grep so prova:
- ✅ ninguem no repositorio atual chama

Nao prova:
- ❌ que algum cliente externo nunca chamou (Postman saved Ricardo / script curl manual / deploy frontend antigo Vercel cacheado / debug CI/CD esquecido)

**Flip verify_jwt=true PRIMEIRO** = smoke test natural de graca:
- Se consumidor externo escondido existir → comeca a receber 401 em 0-48h
- Erro aparece em Supabase Functions panel + Vercel logs + alertas
- Pedro descobre + decide se restaura (`PATCH verify_jwt=false` em 30s) OU se confirma orfaneza
- Se zero 401 inesperado em 48-72h → V1.9.518 hard-delete autorizado

**Mesmo padrao validado** em V1.9.506 Sprint A (tradevision-core) com slug-test paralelo + smoke matriz 4/4 antes de flip producao. Patten cristalizado: bombas latentes de seguranca exigem mitigacao empirica antes de remover.

## Janela de observacao definida

| Data/hora | Acao |
|---|---|
| **30/05/2026 ~15h00 BRT** | V1.9.517 flip executado (esta acao) |
| **30/05-01/06 (48-72h)** | Observacao passiva via Supabase Functions panel logs |
| **01/06/2026 ~15h BRT (segunda)** | Decisao: se ZERO 401 inesperado → V1.9.518 hard-delete autorizado; se 401 com user_agent identificado → investigar + comunicar antes |

**Mecanismo de observacao**: manual via panel Supabase Functions logs (`get_chat_history` filter). Pedro abre dashboard segunda 15h e verifica error rate.

**Possivel cron Check 8 futuro** (NAO construido hoje por anti-Babylon-recalibrado — uma observacao manual de 48h nao justifica nova feature): query SQL no analytics endpoint Supabase pra detectar 401 spike em Edges nao-monitoradas. Parquear ate Marco 2 ou trigger empirico (2a Edge precisando observacao).

## Locks e regressao

✅ Lock V1.9.299 PBAD CONFORME ITI (sign-pdf-icp v22) — INTOCADO
✅ Lock V1.9.388-A.3 ancoragem regulatoria multi-camada — INTOCADO
✅ Lock V1.9.452 PII sanitize tradevision-core v424 — INTOCADO
✅ Lock V1.9.468-B Matrix Z2 + Bula — INTOCADO
✅ Lock V1.9.506 verify_jwt restaurado tradevision-core — INTOCADO (mesma logica aplicada agora aqui)
✅ 13 outras Edges Functions — INTOCADAS

Zero migration SQL. Zero edit de codigo. Apenas PATCH config via Management API.

## Reversao se necessario (~30s)

Caso aparecer 401 com user_agent legitimo nos logs proximas 48h:
```bash
curl -X PATCH "https://api.supabase.com/v1/projects/itdjkfubfzmvmuxxjoae/functions/get_chat_history" \
  -H "Authorization: Bearer $PAT" \
  -H "Content-Type: application/json" \
  -d '{"verify_jwt":false}'
```

Volta ao estado v8 pre-V1.9.517 instantaneamente.

## Conexoes

- [[project_v1_9_506_sprint_a_verify_jwt_restaurado_30_05]] — mesma logica aplicada em tradevision-core hoje manha (bomba latente 8 dias)
- [[feedback_doc_institucional_sem_pat_nao_e_valido_23_05]] — principio mae validacao empirica
- [[feedback_auditoria_externa_cruzada_gpt_claude2_29_05]] — Claudio + GPT externo + Pedro convergiram em (A)
- DIARIO_30_05_2026_PARTE_2 — BLOCO I a adicionar
- CLAUDE.md — atualizar tabela Edge Functions (verify_jwt mudou)

## Frase ancora

> *"30/05 ~15h: V1.9.517 flip verify_jwt false→true em get_chat_history v8 (smoke 2/2 PASS). Defesa em camadas restaurada zero risco zero downtime. Janela 48-72h observacao manual via Supabase Functions panel. Decisao V1.9.518 hard-delete em 01/jun (segunda) ~15h: zero 401 inesperado = autoriza delete; algum 401 com user_agent legitimo = investigar antes. Empirico corrigiu hipotese: Edge NAO antecede core (criada 9 dias depois, v8 com 7 atualizacoes em 5 meses = uso historico real que ficou orfao). Mesmo padrao V1.9.506 hoje manha — 'nao encontramos callers' != 'nao existe caller'."*
