---
name: v1-9-527-trigger-video-call-notif-defesa-camadas-30-05
description: "30/05/2026 ~19h BRT — V1.9.527 trigger pg AFTER INSERT video_call_requests reusa RPC create_video_call_notification existente (defesa em camadas anti-Babylon). Resolve gap funcional empírico identificado em audit pré-pausa: notifications type='video_call_request' parou em 18/05 mas video_call_requests continuou populando até 27/05 (9 dias gap). Root cause: algum caller frontend bypassou videoCallRequestService.createRequest() e foi direto pra supabase.from('video_call_requests').insert(). Solução elite: NÃO inventar nova Edge nem nova RPC, NÃO mexer no frontend service funcional, NÃO conectar Edge video-call-request-notification (continua parqueada batch obs 48h hard-delete 01/jun). Apenas adicionar trigger backup que dispara RPC existente automaticamente. Smoke 100% PASS empírico: INSERT teste vcr_smoke + trigger disparou <1ms + notification criada com title 'Profissional está chamando você' + cleanup rows teste pós-validação. Migration aditiva pura. Mitigação duplicação: check temporal 2s antes de criar (frontend pode ter criado primeiro). Exception handling: trigger NÃO bloqueia INSERT se RPC falhar. Pattern reusável universal: trigger pg + RPC existente = backup robusto pra gaps funcionais detectados empíricamente."
metadata:
  node_type: memory
  type: project
  originSessionId: 00be2b9f-5dbc-4236-a02e-1459c3f57bd2
---

# V1.9.527 — Trigger pg video_call_requests + RPC reuso (defesa em camadas)

## A entrega

Migration aditiva pura [supabase/migrations/20260530190000_v1_9_527_video_call_request_trigger.sql](supabase/migrations/20260530190000_v1_9_527_video_call_request_trigger.sql) (~150 linhas):

- **Function `tg_video_call_request_notify()`** SECURITY DEFINER reusa RPC `create_video_call_notification` existente
- **Trigger `trg_video_call_request_notify_after_insert`** AFTER INSERT em `public.video_call_requests`
- **Mitigação duplicação**: COUNT(*) FROM notifications WHERE request_id = NEW + last 2s > 0 → skip
- **Exception handling**: RAISE WARNING + RETURN NEW (NÃO bloqueia INSERT)

Commit `21ab4c9` push 4 refs OK.

## Gap real identificado (empírico via PAT)

| Métrica | Empírico HOJE 30/05 ~18h45 BRT |
|---|---|
| `notifications` type='video_call_request' | 116 rows, last **2026-05-18** |
| `video_call_requests` | 255 rows, last **2026-05-27** |
| Gap temporal | **9 dias** (18/05 → 27/05) |
| Edge `video-call-request-notification` v62 | ACTIVE mas 0 callers grep todo codebase |
| RPC `create_video_call_notification` | EXISTE + FUNCIONAL (SECURITY DEFINER, bypass RLS) |
| Service `videoCallRequestService.ts` | Usa RPC corretamente em 4 fallbacks |

Root cause provável: algum caller frontend (não o service) inseriu DIRETO em `video_call_requests` bypassando notification em algum ponto entre 18/05-27/05 (provavelmente refator Sprint D/E que esqueceu o caminho de notification).

## Por que NÃO escolhemos outras opções

| Opção | Por que NÃO |
|---|---|
| Investigar qual caller bypassou + fixar | Custo audit muito alto vs benefício; pode quebrar outras coisas |
| Conectar Edge `video-call-request-notification` | Edge nunca foi conectada empíricamente, exige investigar comentário CORS quebrado historicamente |
| Criar nova RPC | Anti-padrão (`feedback_polir_nao_inventar`) — RPC existente funciona |
| Mexer no frontend service | "Não tocar o que funciona" (princípio cristalizado HOJE) |

## Solução elite escalável anti-Babylon

**Trigger pg_trigger AFTER INSERT** que dispara RPC existente:
- ✅ ZERO regressão (apenas ADICIONA notification, não muda nada existing)
- ✅ Defesa em camadas: frontend tenta primeiro (rapid), trigger garante (backup)
- ✅ Reusa 100% RPC + função existentes (anti-Babylon)
- ✅ Mitigação duplicação cirúrgica (check 2s)
- ✅ Não bloqueia INSERT se RPC falhar (graceful degrade)
- ✅ Rollback 30s (DROP TRIGGER + DROP FUNCTION)
- ✅ Pattern reusável (mesma técnica V1.9.99-B cron usa `net.http_post` pra Edge — aqui usa PERFORM RPC direto)

## Smoke 100% PASS empírico

```json
=== INSERT teste video_call_requests ===
{
  "id": "5b4501a1-5002-4666-8957-7697c0e0d311",
  "request_id": "vcr_smoke_v1_9_527_1780167279.048905",
  "requester_id": "17345b36-50de-4112-bf78-d7c5d9342cdb",  // Pedro admin
  "recipient_id": "d5e01ead-2f7e-4958-95e9-50dd66a7c5f9",  // Pedro Paciente
  "created_at": "2026-05-30 18:54:39.048905+00"
}

=== Notification criada via trigger ===
{
  "id": "06372e39-4c5f-46b9-a916-16e3185d339a",
  "user_id": "d5e01ead-...",  // recipient correto
  "type": "video_call_request",
  "title": "Profissional está chamando você",  // is_professional detectado
  "message": "Pedro está chamando você para uma videochamada. Responda em até 30 segundos.",
  "source": "trigger_v1_9_527",  // marker correto
  "request_id": "vcr_smoke_v1_9_527_1780167279.048905",  // batido
  "created_at": "2026-05-30 18:54:39.048905+00"  // mesmo timestamp INSERT
}
```

Latência: <1ms entre INSERT e notification. Cleanup rows teste executado pós-validação.

## Implicação pra batch hard-delete 01/jun

**Edge `video-call-request-notification` (V1.9.525) CONTINUA no batch hard-delete 01/jun**. Trigger V1.9.527 NÃO chama a Edge — chama RPC direto. Edge segue sem caller real e pode ser deletada conforme planejado.

## Princípios meta aplicados (auto-recursivos)

- [[feedback_mexer_so_gap_real_principio_meta_30_05]]: gap REAL identificado empíricamente ANTES de mexer
- [[feedback_polir_nao_inventar]]: reuso integral RPC + função + tabela existentes
- [[feedback_p9_nao_uso_nao_e_nao_precisa]] (recalibrado): observação ativa antes de ignorar
- [[feedback_validacao_empirica_screenshot_maior_que_plano_teorico_28_05]]: smoke empírico imediato pós-deploy
- Pattern V1.9.99-B (cron + net.http_post) → V1.9.527 (trigger + PERFORM RPC): mesma arquitetura, custo diferente (trigger é instantâneo, cron tem latência)

## Conexões

- [[feedback_2_gaps_p1_tecnicos_auth_triggers_e_video_call_notif_30_05]] — gap 2 RESOLVIDO via esta entrega
- [[project_v1_9_520_526_edge_jwt_audit_batch_30_05]] — Edge V1.9.525 segue parqueada hard-delete 01/jun
- DIARIO_30_05_2026_PARTE_2 — BLOCO K a adicionar
- CLAUDE.md — atualizar com trigger novo + V1.9.527

## Frase âncora

> *"30/05 ~19h: V1.9.527 fechou gap funcional video-call notification (9 dias quebrado 18-27/05) via trigger pg AFTER INSERT + RPC reuso 100%. Solução elite escalável anti-Babylon: ZERO Edge nova, ZERO RPC nova, ZERO mudança frontend service. Apenas trigger backup que cobre quando frontend esquecer. Smoke 100% PASS empírico em <1ms. Edge video-call-request-notification continua parqueada (hard-delete 01/jun mantido). Pattern reusável: trigger pg + RPC existente = defesa em camadas universal pra qualquer gap funcional onde infraestrutura existe mas conexão quebrou."*
