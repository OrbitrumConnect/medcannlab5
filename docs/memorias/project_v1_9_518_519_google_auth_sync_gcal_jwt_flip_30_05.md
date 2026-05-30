---
name: v1-9-518-519-google-auth-sync-gcal-jwt-flip-30-05
description: "30/05/2026 ~15h30 BRT — V1.9.518 + V1.9.519 escalonamento do pattern V1.9.517 (flip verify_jwt false→true + observação 48h + decisão hard-delete 01/jun) aplicado nas 2 Edges Google Calendar dormindo desde V1.9.99-B (28/04). Validação empírica pré-flip: professional_integrations 0 rows + integration_jobs 0 rows + 0 callers grep src/ + 0 cron schedules + 0 cross-Edge calls + 1 comentário arquitetural futuro em video-call-reminders (não invocação). PATCH Management API aplicado em ambas: google-auth v29 ACTIVE verify_jwt=true + sync-gcal v29 ACTIVE verify_jwt=true. Smoke 4/4 PASS (sem JWT=401 + JWT inválido=401 em cada Edge). Janela observação 48-72h via Supabase Functions panel. Decisão consolidada 01/jun (segunda) ~15h BRT — 3 Edges em batch (get_chat_history + google-auth + sync-gcal): zero 401 inesperado = autoriza V1.9.520+521+522 hard-delete; algum 401 com user_agent = investigar + decidir restaurar (rollback 30s via PATCH false). Reverte memory `feedback_p9_nao_uso_nao_e_nao_precisa` em 1 dimensão: não-uso justifica observação ativa (não só ignorar). Locks PBAD V1.9.299 + tradevision-core + sign-pdf-icp + outras 11 Edges INTOCADAS."
metadata:
  node_type: memory
  type: project
  originSessionId: 00be2b9f-5dbc-4236-a02e-1459c3f57bd2
---

# V1.9.518+519 — google-auth + sync-gcal flip verify_jwt (cleanup escalado pattern V1.9.517)

## Decisão e contexto

Pós V1.9.517 (`get_chat_history` flip + observação 48h) validar empiricamente, Pedro autorizou aplicar mesmo padrão nas 2 Edges Google Calendar (`google-auth` + `sync-gcal`) que estavam dormindo desde V1.9.99-B (28/04/2026) — memória `feedback_p9_nao_uso_nao_e_nao_precisa` previamente tinha decidido "manter intocado".

**Recalibração desse princípio**: não-uso justifica observação ativa empírica (flip JWT + observar consumidor escondido), não apenas ignorar. Mesmo padrão V1.9.517.

## Validação empírica pré-flip (5 verificações)

| Validação | Resultado |
|---|---|
| `professional_integrations` (tabela alvo google-auth) | **0 rows** |
| `integration_jobs` (tabela alvo sync-gcal) | **0 rows** |
| Grep `src/` por `google-auth\|sync-gcal\|googleAuth\|syncGcal` | **0 callers** |
| Grep `supabase/functions/*` (cross-Edge) | 1 match: comentário em video-call-reminders (nota arquitetural futura, NÃO invocação) |
| `cron.job` busca command | **0 schedules** chamando |

Convergência total. Aplicar pattern V1.9.517 = zero risco arquitetural identificável.

## PATCH Management API aplicado

```bash
# V1.9.518
curl -X PATCH "https://api.supabase.com/v1/projects/itdjkfubfzmvmuxxjoae/functions/google-auth" \
  -H "Authorization: Bearer $PAT" -H "Content-Type: application/json" \
  -d '{"verify_jwt":true}'
# Resposta: google-auth v29 ACTIVE verify_jwt=true ✅

# V1.9.519
curl -X PATCH "https://api.supabase.com/v1/projects/itdjkfubfzmvmuxxjoae/functions/sync-gcal" \
  -H "Authorization: Bearer $PAT" -H "Content-Type: application/json" \
  -d '{"verify_jwt":true}'
# Resposta: sync-gcal v29 ACTIVE verify_jwt=true ✅
```

## Smoke 4/4 PASS

```
=== SMOKE google-auth ===
  SEM_JWT: HTTP 401 ✅
  JWT_INVALIDO: HTTP 401 ✅

=== SMOKE sync-gcal ===
  SEM_JWT: HTTP 401 ✅
  JWT_INVALIDO: HTTP 401 ✅
```

Defesa em camadas restaurada nas 2 Edges. Total Edges em observação 48h: **3** (`get_chat_history` V1.9.517 + `google-auth` V1.9.518 + `sync-gcal` V1.9.519).

## Janela de observação consolidada (3 Edges)

| Data/hora | Ação |
|---|---|
| **30/05 ~15h-15h30 BRT** | 3 flips aplicados (V1.9.517+518+519) |
| **30/05-01/06 (48-72h)** | Observação passiva via Supabase Functions panel logs |
| **01/06 ~15h BRT (segunda)** | Decisão consolidada hard-delete batch: zero 401 inesperado → V1.9.520+521+522 DELETE; algum 401 com user_agent identificado → investigar caller + decidir restaurar/comunicar |

**Rollback unitário** (~30s por Edge se necessário):
```bash
curl -X PATCH "https://api.supabase.com/v1/projects/itdjkfubfzmvmuxxjoae/functions/<slug>" \
  -H "Authorization: Bearer $PAT" -H "Content-Type: application/json" \
  -d '{"verify_jwt":false}'
```

## Memory previamente cristalizada — recalibrada

[[feedback_p9_nao_uso_nao_e_nao_precisa]] previamente cristalizada cobre Edges/features dormindo SEM uso real. Princípio: não fazer feature pra ninguém. Hoje **recalibrado em 1 dimensão**: **não-uso justifica observação ATIVA antes de deletar** (não só ignorar). Anti-padrão evitado: Edge ACTIVE com `verify_jwt=false` por meses = bomba latente silenciosa. Mesmo aprendizado que V1.9.506 Sprint A.

## Locks intocados

✅ Lock V1.9.299 PBAD CONFORME ITI (sign-pdf-icp v22)
✅ Lock V1.9.388-A.3 ancoragem regulatória multi-camada
✅ Lock V1.9.452 PII sanitize tradevision-core v424
✅ Lock V1.9.468-B Matrix Z2 + Bula
✅ Lock V1.9.506 verify_jwt restaurado tradevision-core
✅ Lock V1.9.517 verify_jwt restaurado get_chat_history (este mesmo padrão aplicado)
✅ 11 outras Edges INTOCADAS

Zero migration SQL. Zero edit código. Apenas PATCH config via Management API.

## Próxima sessão (01/jun segunda ~15h BRT)

Pedro abre Supabase Functions panel + filtra logs últimas 48h pra cada slug:
- `get_chat_history`
- `google-auth`
- `sync-gcal`

Se ZERO erro 401 inesperado nos 3:
```bash
# V1.9.520 V1.9.521 V1.9.522 hard-delete batch
for slug in get_chat_history google-auth sync-gcal; do
  curl -X DELETE "https://api.supabase.com/v1/projects/itdjkfubfzmvmuxxjoae/functions/$slug" \
    -H "Authorization: Bearer $PAT"
done
```

Pós-delete: atualizar CLAUDE.md Edge Functions table (14 → 11 Edges ativas) + commit doc trail.

Se aparecer 401 com user_agent identificado em qualquer das 3:
- Investigar caller específico
- Decidir: restaurar Edge (rollback verify_jwt false) OR comunicar caller antes de deletar

## Conexões

- [[project_v1_9_517_get_chat_history_jwt_flip_observacao_48h_30_05]] — pattern mãe aplicado primeiro hoje
- [[project_v1_9_506_sprint_a_verify_jwt_restaurado_30_05]] — original Sprint A hoje manhã (tradevision-core bomba latente 8d)
- [[feedback_p9_nao_uso_nao_e_nao_precisa]] — recalibrado em 1 dimensão (observar ANTES de ignorar)
- [[feedback_doc_institucional_sem_pat_nao_e_valido_23_05]] — princípio mãe validação empírica
- DIARIO_30_05_2026_PARTE_2 — BLOCO I cobre os 3 cleanups

## Frase âncora

> *"30/05 ~15h30: V1.9.518+519 escalou pattern V1.9.517 nas 2 Edges Google Calendar dormindo (google-auth + sync-gcal). 5 validações empíricas pré-flip convergiram em zero risco. PATCH Management API + smoke 4/4 PASS = defesa em camadas restaurada. Janela observação 48-72h consolidada com V1.9.517 (3 Edges). Decisão hard-delete batch 01/jun (segunda) ~15h BRT. **Recalibração princípio cristalizada**: não-uso justifica observação ATIVA antes de deletar (não só ignorar). Anti-padrão evitado: Edge ACTIVE com verify_jwt=false por meses = bomba latente silenciosa."*
