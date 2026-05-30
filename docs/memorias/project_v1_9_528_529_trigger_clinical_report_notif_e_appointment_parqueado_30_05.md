---
name: v1-9-528-529-trigger-clinical-report-notif-e-appointment-parqueado-30-05
description: "30/05/2026 ~19h15 BRT — V1.9.528 ENTREGUE: trigger pg AFTER INSERT/UPDATE OF signed_at em clinical_reports fecha gap funcional 6 MESES (notification new_clinical_report parou em 14/nov/2025, 54 reports criados últimos 30d sem notification). Pattern V1.9.527 replicado mas com INSERT direto em notifications (sem RPC equivalente). SECURITY DEFINER bypass RLS. Fix V2 detecta prefixo Dr./Dra. no users.name pra evitar duplicação 'Dr(a). Dr. Ricardo'. Smoke 2x PASS empírico + cleanup. Mitigação duplicação <5s. Exception handling. Coexiste com ns_track_aec_finalized (esse track metrics). Commit `3fd8827` push 4 refs. V1.9.529 (trigger appointment_created notification) PARQUEADO: complexidade alta (2 destinatários paciente+médico + possível race com appointment_completed já existente em handle_appointment_completed + pré-Marco 2 paciente externo não usa empíricamente). Triggers desparquear V1.9.529: Marco 2 OR usuário relatar 'marquei consulta e não fui avisado'."
metadata:
  node_type: memory
  type: project
  originSessionId: 00be2b9f-5dbc-4236-a02e-1459c3f57bd2
---

# V1.9.528 — Trigger clinical_reports signed → notification (ENTREGUE)
# V1.9.529 — Trigger appointment_created notification (PARQUEADO)

## V1.9.528 ENTREGUE (~25min real)

### Gap empírico identificado (PAT 30/05 ~19h BRT)

| Métrica 30d | Valor |
|---|---|
| `clinical_reports` criados | 54 rows (last hoje 03h51) |
| `notifications` type='new_clinical_report' | **0 rows** |
| Última notification new_clinical_report | **14/nov/2025** (~6 meses gap funcional) |

Anti-padrão: gap funcional crítico — paciente nunca soube que médico assinou seu relatório nos últimos 6 meses.

### Solução elite escalável zero regressão

[supabase/migrations/20260530200000_v1_9_528_clinical_report_signed_notification.sql](supabase/migrations/20260530200000_v1_9_528_clinical_report_signed_notification.sql):

- **Function `tg_clinical_report_signed_notify()`** SECURITY DEFINER
- **2 Triggers** (mesma lógica `ns_track_aec_finalized` que coexiste):
  - `trg_clinical_report_signed_notify_insert` AFTER INSERT WHEN signed_at IS NOT NULL
  - `trg_clinical_report_signed_notify_update` AFTER UPDATE OF signed_at WHEN OLD IS DISTINCT AND NEW IS NOT NULL
- **INSERT direto** em notifications (sem RPC — não existe equivalente `create_new_clinical_report_notification`)
- **Mitigação duplicação** check temporal 5s
- **Exception handling**: RAISE WARNING + RETURN NEW (NÃO bloqueia UPDATE)
- **Fix V2**: detecta prefixo `Dr./Dra./Drª` no `users.name` pra evitar `"Dr(a). Dr. Ricardo Valença"` virar `"Dr. Ricardo Valença"`

### Smoke 2x PASS empírico

**Smoke V1** (bug cosmético detectado):
```json
{
  "title": "Novo relatório clínico disponível",
  "message": "Dr(a). Dr. Ricardo Valença assinou seu relatório clínico..."  // ← prefix duplicado
}
```

**Fix V2** aplicado (CASE WHEN regex `^(Dr\.?|Dra\.?|Drª\.?)\s+`):

**Smoke V2** (limpo):
```json
{
  "title": "Novo relatório clínico disponível",
  "message": "Dr. Ricardo Valença assinou seu relatório clínico. Acesse seu prontuário para visualizar."  // ✅
}
```

Cleanup pós-validação: DELETE notification + restore signed_at=NULL no report teste `2bb0b4cf-...`.

### Princípios meta aplicados

- [[feedback_mexer_so_gap_real_principio_meta_30_05]]: gap REAL (6 meses sem notification) + reuso pattern V1.9.527
- [[feedback_polir_nao_inventar]]: trigger reusa pattern conhecido + INSERT direto (sem inventar RPC)
- Anti-Babylon recalibrado: criar trigger backup quando RPC não existe = correto (não duplicação)

## V1.9.529 PARQUEADO

### Por que parqueado

**Gap real identificado**: `appointments` criados 30d: 32 (last hoje 17:57) MAS 0 notifications type='appointment_created' ou similar — mesmo trigger pattern V1.9.527.

**Complexidade que justifica parquear**:
1. **2 destinatários** (paciente + médico ambos avisar)
2. **Possível race** com `handle_appointment_completed` existente (que SÓ cria notification em status='completed')
3. **Validar quem cria** o appointment empíricamente: paciente solicitando? Médico marcando? Sistema (cron) auto-marcando? Cada caso muda copy/destinatário
4. **Pré-Marco 2** paciente externo não usa empíricamente — sem trigger forte HOJE
5. **10 triggers existentes em appointments** podem ter overlap não-óbvio (trg_appointment_to_wtx, trg_ns_followup_scheduled, etc) — investigação adicional necessária

### Triggers pra desparquear V1.9.529

1. **Marco 2 paciente externo** solicitar consulta + médico não receber alerta
2. **Usuário relatar empíricamente**: "marquei consulta e não fui avisado"
3. **Sessão dedicada futura** (~1-2h) com smoke em 2 perfis (paciente solicitando + médico marcando) + validar overlap com 10 triggers existentes

### Pattern reusável quando desparquear

Mesmo template V1.9.527/V1.9.528:
- Trigger SECURITY DEFINER
- INSERT direto em notifications (ou criar RPC `create_appointment_notification` generica se reuso justificar)
- Detectar quem é requester (paciente vs médico vs sistema)
- Mensagens personalizadas por destinatário
- Mitigação duplicação <5s
- Exception handling NÃO bloqueia INSERT

## Estado consolidado pattern "trigger backup notification"

3 entregas hoje seguem mesmo template:
- V1.9.527 trigger video_call_requests → notification (REUSA RPC existente)
- V1.9.528 trigger clinical_reports signed → notification (INSERT direto)
- V1.9.529 (parqueado) appointments criados → notification (template pronto)

**Pattern universal "infra existe mas conexão quebrou"**:
1. Validar empíricamente o gap (tabela ATIVA + notification correlata QUEBRADA)
2. Verificar se RPC equivalente existe (reusar) OR criar INSERT direto SECURITY DEFINER
3. Trigger AFTER INSERT/UPDATE com WHEN apropriado
4. Mitigação duplicação temporal (2-5s)
5. Exception handling: NÃO bloqueia tabela alvo se notification falhar
6. Smoke empírico imediato + cleanup
7. Documentação cristalizada (memory + migration comment)

## Locks intocados

✅ V1.9.299 PBAD CONFORME ITI
✅ V1.9.388-A.3 ancoragem regulatória
✅ V1.9.452 PII sanitize
✅ V1.9.468-B Matrix Z2 + Bula
✅ V1.9.506+517-526 verify_jwt 13 Edges restoration
✅ V1.9.527 trigger video_call_requests

## Conexões

- [[project_v1_9_527_trigger_video_call_notif_defesa_camadas_30_05]] — pattern mãe
- [[feedback_mexer_so_gap_real_principio_meta_30_05]] — princípio cristalizado HOJE
- [[feedback_2_gaps_p1_tecnicos_auth_triggers_e_video_call_notif_30_05]] — outro gap (auth triggers) ainda parqueado
- [[feedback_polir_nao_inventar]] — princípio mãe
- DIARIO_30_05_2026_PARTE_2 — BLOCO K a adicionar

## Frase âncora

> *"30/05 ~19h15: V1.9.528 fechou gap funcional 6 MESES (notification new_clinical_report quebrado desde 14/nov/2025). Trigger pg AFTER INSERT/UPDATE OF signed_at + INSERT direto SECURITY DEFINER + fix V2 detect prefix Dr./Dra. Smoke 2x PASS empírico + cleanup. V1.9.529 (appointment notification) PARQUEADO conscientemente: complexidade 2 destinatários + 10 triggers existentes + sem trigger empírico Marco 2. Pattern universal cristalizado pra 'infra existe mas conexão quebrou'. 19 commits + 17 memórias dia 30/05."*
