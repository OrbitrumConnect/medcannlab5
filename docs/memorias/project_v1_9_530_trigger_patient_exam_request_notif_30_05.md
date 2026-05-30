---
name: v1-9-530-trigger-patient-exam-request-notif-30-05
description: "30/05/2026 ~19h30 BRT — V1.9.530 ENTREGUE: trigger pg AFTER INSERT em patient_exam_requests + INSERT direto SECURITY DEFINER em notifications (sem RPC equivalente, pattern V1.9.528 replicado). Fecha gap funcional empírico identificado em SONDAGEM ativa pre-pausa Pedro: patient_exam_requests 24 rows last 28/05 + 0 notifications type='new_exam_request' = paciente nunca avisado quando médico cria solicitação de exame. Smoke 100% PASS empírico (Dr. Ricardo Valença → Pedro Paciente, INSERT teste cleanup imediato). Mitigação duplicação 5s + fix prefix Dr./Dra. V1.9.528 V2 reusado + exception handling. **4ª aplicação do pattern universal 'trigger backup notification' HOJE** (V1.9.527+528+530 entregues, V1.9.529 parqueado). 3 patterns universais cristalizados HOJE em produção: (1) flip JWT V1.9.517; (2) trigger+RPC V1.9.527; (3) trigger+INSERT direto V1.9.528 — todos reusados em batch escalado."
metadata:
  node_type: memory
  type: project
  originSessionId: 00be2b9f-5dbc-4236-a02e-1459c3f57bd2
---

# V1.9.530 — Trigger patient_exam_requests → notification new_exam_request

## A entrega (~15min real)

Migration: [supabase/migrations/20260530210000_v1_9_530_patient_exam_request_notification.sql](supabase/migrations/20260530210000_v1_9_530_patient_exam_request_notification.sql)

- **Function `tg_patient_exam_request_notify()`** SECURITY DEFINER
- **Trigger `trg_patient_exam_request_notify_after_insert`** AFTER INSERT puro
- **INSERT direto em notifications** (sem RPC — `create_exam_request_notification` não existe)
- **Mitigação duplicação** check temporal 5s
- **Detecta prefixo Dr./Dra./Drª** no users.name (fix V1.9.528 V2 reusado)
- **Exception handling**: RAISE WARNING + RETURN NEW (NÃO bloqueia INSERT)
- **Metadata inclui** `signed_pdf_url` + `iti_validation_code` pra frontend deep-link futuro

## Gap empírico identificado (PAT 30/05 ~19h45 BRT pre-pausa Pedro)

| Métrica | Valor empírico |
|---|---|
| `patient_exam_requests` total | 24 rows, last 28/05 |
| `notifications` type='new_exam_request' | **0 rows** |
| Pattern caller | 0 triggers existentes em patient_exam_requests (limpo) |
| RPC equivalente | NÃO existe (logo INSERT direto necessário) |
| Status empírico das 5 últimas rows | TODAS 'signed' (médico cria já assinada via fluxo V1.9.455) |

Anti-padrão: gap funcional crítico — paciente nunca avisado quando médico solicita exame, mesmo com 24 rows acumuladas.

## Smoke 100% PASS empírico

**INSERT teste**:
```json
{
  "id": "8160389c-d069-4993-aa45-e6f5c9b90510",
  "patient_id": "d5e01ead-..." (Pedro Paciente),
  "professional_id": "2135f0c0-..." (Dr. Ricardo Valença),
  "created_at": "2026-05-30 19:30:19.603973+00"
}
```

**Notification criada via trigger** (<1ms):
```json
{
  "user_id": "d5e01ead-..." (Pedro Paciente),
  "type": "new_exam_request",
  "title": "Nova solicitação de exame",
  "message": "Dr. Ricardo Valença solicitou um exame para você. Acesse seu prontuário para visualizar.",
  "prof": "Dr. Ricardo Valença",  ← fix prefix detectado, sem duplicação "Dr(a). Dr."
  "source": "trigger_v1_9_530"
}
```

**Cleanup**: 1 notification + 1 patient_exam_request deletados pós-validação.

## Implicação pra batch hard-delete 01/jun

**Nenhuma**. V1.9.530 NÃO mexe em Edges nem em batch hard-delete. Trigger e função são novos, sem dependência.

## Princípios meta aplicados (auto-recursivos)

- [[feedback_mexer_so_gap_real_principio_meta_30_05]]: gap REAL identificado empíricamente ANTES de mexer
- [[feedback_polir_nao_inventar]]: reuso integral pattern V1.9.528 + fix prefix V1.9.528 V2
- [[project_v1_9_528_529_trigger_clinical_report_notif_e_appointment_parqueado_30_05]]: template "trigger + INSERT direto" replicado pela 2ª vez (3ª contando V1.9.527 com RPC)

## 4ª aplicação consecutiva do pattern HOJE

| Ordem | Versão | Tabela alvo | Estratégia |
|---|---|---|---|
| 1ª | V1.9.527 | video_call_requests | Trigger + RPC create_video_call_notification |
| 2ª | V1.9.528 | clinical_reports signed | Trigger + INSERT direto |
| ❌ | V1.9.529 | appointments | PARQUEADO (complexidade 2 destinatários + 10 triggers) |
| 3ª | V1.9.530 | patient_exam_requests | Trigger + INSERT direto (clone V1.9.528) |

**Pattern universal cristalizado**: pra TODO novo gap "infra existe mas conexão notification quebrou", aplicar template V1.9.527/528 em <30min.

## Locks intocados (todos)

✅ V1.9.299 PBAD CONFORME ITI
✅ V1.9.388-A.3 ancoragem regulatória multi-camada
✅ V1.9.452 PII sanitize
✅ V1.9.468-B Matrix Z2 + Bula
✅ V1.9.506+517-526 verify_jwt 13 Edges
✅ V1.9.527 trigger video_call_requests
✅ V1.9.528 trigger clinical_reports

Zero edit código aplicativo. Zero Edge nova. Zero RPC nova. Apenas migration aditiva pura.

## Conexões

- [[project_v1_9_528_529_trigger_clinical_report_notif_e_appointment_parqueado_30_05]] — pattern mãe replicado
- [[project_v1_9_527_trigger_video_call_notif_defesa_camadas_30_05]] — pattern original com RPC
- [[feedback_mexer_so_gap_real_principio_meta_30_05]] — princípio cristalizado HOJE
- V1.9.455 (commit 1c71ef3 26/05) — exam_request PDF ICP wiring base
- DIARIO_30_05_2026_PARTE_2 — BLOCO L a adicionar

## Frase âncora

> *"30/05 ~19h30: V1.9.530 sondagem ativa pos-Pedro pausa entregou. Trigger pg AFTER INSERT patient_exam_requests + INSERT direto SECURITY DEFINER + fix prefix Dr./Dra. Pattern V1.9.528 replicado em ~15min. Smoke 100% PASS empírico + cleanup. 4ª aplicação consecutiva do template universal HOJE (V1.9.527+528+530 entregues, 529 parqueado). 23 commits + 18 memórias + 12 PATCH Management API dia 30/05 - sistema técnico SAUDÁVEL e maduro pré-PMF, bloqueios 100% humanos (Marco 1 CNPJ)."*
