---
name: 2-gaps-p1-tecnicos-auth-triggers-e-video-call-notif-30-05
description: "30/05/2026 ~18h45 BRT — 2 gaps técnicos P1 identificados empíricamente via audit pré-pausa pós V1.9.520-526 + princípio meta 'mexer só gap real'. Gap 1: TRIGGERS auth.users com 4 AFTER INSERT triggers (3 inserindo em user_profiles com campos divergentes + ON CONFLICT divergente = race condition latente que cadastros toleram via ON CONFLICT mas valores podem ficar inconsistentes). Gap 2: video-call-request-notification Edge NUNCA conectada empíricamente (255 rows em video_call_requests last 27/05 inseridas DIRETO via frontend supabase.from() sem disparar Edge, médico NÃO recebe notificação automática). Ambos PARQUEADOS conforme princípio meta (não tocar produção funcional) MAS documentados pra sessão dedicada futura com staging + smoke real. Triggers empíricos pra desparquear: (Gap 1) usuário relatar 'cadastro falhou' OR audit qualidade user_profiles revelar inconsistências OR Marco 1 CNPJ destravar onboarding profissional novo; (Gap 2) Marco 2 paciente externo pagante solicitar videocall e médico não receber notificação OR funcionalidade entrar em escopo PMF."
metadata:
  node_type: memory
  type: feedback
  originSessionId: 00be2b9f-5dbc-4236-a02e-1459c3f57bd2
---

# 2 gaps P1 técnicos identificados via audit empírico (parqueados conscientes)

## Gap 1 — Triggers auth.users com duplicação latente

### Achado empírico

5 triggers ativos em `auth.users` confirmados via `pg_trigger`:

| Trigger | Function | Tipo |
|---|---|---|
| `on_auth_user_created` | `handle_new_user` | AFTER INSERT |
| `on_auth_user_created_profile` | `handle_new_user_profile` | AFTER INSERT |
| `trg_auth_users_to_user_profiles` | `handle_new_auth_user` | AFTER INSERT |
| `trg_link_existing_user` | `fn_on_auth_user_created_link_existing` | AFTER INSERT |
| `on_auth_user_deleted` | `handle_auth_user_deletion` | BEFORE DELETE |

4 triggers AFTER INSERT (rodam paralelo no mesmo evento). 3 deles inserem em `user_profiles`:

| Function | Campos INSERT | ON CONFLICT |
|---|---|---|
| `handle_new_user_profile` | (user_id, points=0, level=1) | DO NOTHING |
| `handle_new_auth_user` | (user_id, **email, full_name, role**) | DO UPDATE SET (campos COALESCE) |
| `fn_on_auth_user_created_link_existing` | (user_id, points=0, level=1) + UPDATE public.users link | DO NOTHING |

### Race condition latente

- 3 functions rodam em paralelo no AFTER INSERT auth.users
- Função "vencedora" da race determina valores iniciais
- ON CONFLICT divergente (NOTHING vs UPDATE) resolve mas com comportamento não-determinístico
- Empíricamente cadastros funcionam (49 users em produção) porque ON CONFLICT existe
- MAS valores podem ser inconsistentes entre users (alguns com email/full_name/role, outros só points/level)

### Por que NÃO mexer HOJE

Princípio meta cristalizado [[feedback_mexer_so_gap_real_principio_meta_30_05]]:
- Gap REAL identificado ✅
- MAS cadastros funcionam empíricamente (sub-princípio 5: "NÃO tocar o que funciona em produção")
- Risco se errar = quebrar cadastro + 49 users existentes
- Sem trigger empírico forte HOJE (zero "cadastro falhou")

### Refator proposto (sessão dedicada futura)

- Criar 1 function consolidada `handle_new_user_v2()` que faz TUDO sequencial (users + user_roles + user_profiles completo)
- Dropar 3 triggers redundantes
- Manter `handle_new_user` (cadastro principal) + `fn_on_auth_user_created_link_existing` (link auth↔public + cria profile)
- Custo: ~2-3h com staging + smoke real (criar user teste fluxo completo)
- Triggers pra desparquear:
  - (a) Usuário relatar "cadastro falhou"
  - (b) Audit qualidade user_profiles revelar inconsistências reais
  - (c) Marco 1 CNPJ destravar onboarding profissional novo (escala cadastros)

---

## Gap 2 — Edge `video-call-request-notification` nunca conectada empíricamente

### Achado empírico

| Empírico | Valor |
|---|---|
| `video_call_requests` rows | 255 (TABELA ATIVA) |
| Última row | 27/05/2026 (~3 dias atrás) |
| Edge `video-call-request-notification` v62 | ACTIVE, verify_jwt=true (V1.9.525 hoje) |
| Caller grep todo codebase | **0 callers** |
| Trigger pg_cron pra Edge | **0 schedules** |
| Trigger pg_trigger em video_call_requests | **0 triggers** |

### Conclusão arquitetural

Frontend insere DIRETO em `video_call_requests` via `supabase.from('video_call_requests').insert()` SEM disparar a Edge `video-call-request-notification`. Logo:

- Paciente solicita videocall → row criada ✅
- Médico recebe notificação → **NÃO** ❌ (Edge nunca conectada)

Edge foi planejada (provavelmente fev/2026 quando v62 foi atualizada) pra notificar médico via Resend OU push, mas a integração frontend→Edge nunca foi feita OU foi removida em algum refator não-documentado.

### Por que NÃO mexer HOJE

- Gap FUNCIONAL real ✅
- MAS sem usuário externo afetado (todos 255 rows são testes internos OR cadastrados pelo médico manualmente)
- Princípio "não inventar feature sem trigger empírico" aplica
- Hard-delete V1.9.525 da Edge em 01/jun = OK (Edge nunca conectada empíricamente)

### Refator proposto (sessão dedicada futura)

Quando trigger empírico chegar:
- Opção A: criar trigger pg_cron em video_call_requests que dispara Edge via `net.http_post`
- Opção B: frontend invocar Edge explicitamente após `.insert()` na tabela
- Opção C: Edge auto-deletada 01/jun + nova feature de notificação implementada do zero com pattern moderno (Resend direto OU push WebPush)
- Triggers pra desparquear:
  - (a) Marco 2 paciente externo solicitar videocall + médico não receber notificação
  - (b) Funcionalidade entrar explicitamente em escopo PMF
  - (c) Ricardo/Eduardo perguntarem "como sei se paciente quer videocall?"

---

## Princípio meta aplicado recursivamente

Ambos gaps detectados HOJE via audit pré-pausa pós V1.9.520-526. **Princípio "mexer só gap real" cristalizado AGORA validou seu próprio uso 2 vezes**:

1. Triggers auth.users — gap REAL mas funcionamento em produção justifica parquear
2. video-call-notification — gap REAL funcional mas sem usuário externo afetado

**Decisão consolidada**: DOCUMENTAR como P1 técnicos pra sessão dedicada futura + NÃO tocar HOJE sem trigger empírico forte. Memory registra pra próxima sessão entrar com contexto cristalizado e não reinventar a investigação.

## Locks intocados (todos)

✅ V1.9.299 PBAD CONFORME ITI
✅ V1.9.388-A.3 ancoragem regulatória multi-camada
✅ V1.9.452 PII sanitize
✅ V1.9.468-B Matrix Z2 + Bula
✅ V1.9.506 verify_jwt tradevision-core
✅ V1.9.517-526 verify_jwt 10 Edges

Zero migration SQL. Zero edit código. Apenas memory + diário.

## Conexões

- [[feedback_mexer_so_gap_real_principio_meta_30_05]] — princípio cristalizado HOJE aplicado em ambos gaps
- [[feedback_polir_nao_inventar]] — princípio mãe
- [[feedback_p9_nao_uso_nao_e_nao_precisa]] — recalibrado em 1 dimensão
- DIARIO_30_05_2026_PARTE_2 — registrar nos pendentes P1 técnicos

## Frase âncora

> *"30/05 ~18h45: audit pré-pausa revelou 2 gaps P1 técnicos REAIS (triggers auth.users 3-way race em user_profiles + video-call-notification Edge desconectada de tabela ATIVA 255 rows). Ambos PARQUEADOS pelo próprio princípio 'mexer só gap real' validado AGORA recursivamente: gaps reais MAS sem trigger empírico forte + funcionamento em produção justifica deferir refator pra sessão dedicada futura. Documentação cristalizada pra próxima sessão não reinventar investigação."*
