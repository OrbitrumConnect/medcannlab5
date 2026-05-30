---
name: ""
metadata: 
  node_type: memory
  originSessionId: 00be2b9f-5dbc-4236-a02e-1459c3f57bd2
---

name: cron-lembrete-aec-4-5d-parqueado-anti-babylon-30-05
description: "30/05/2026 ~14h BRT — Cron lembrete pro medico de AEC ativa sem update >4-5 dias (proposta V1.9.516) PARQUEADO por aplicacao empirica do principio anti-Babylon. Empirico HOJE via PAT: apenas 1 AEC ativa nao-INTERRUPTED no banco (phase=COMPLAINT_DETAILS). 4 INTERRUPTED orfas ja cobertas pelo card V1.9.515 entregue hoje (BLOCO G.5 DIARIO_30 PARTE_2). Custo de construir hoje (~1-2h + migration + cron + memory) NAO justifica beneficio com 1 caso/semana. Triggers empiricos explicitos pra desparquear: (a) Marco 2 chegar — primeiro paciente externo pagante criar AEC; (b) >=5 AECs ativas simultaneamente no banco (volume justifica); (c) Ricardo reclamar empiricamente 2+ vezes seguidas 'fulano abandonou avaliacao e eu nao vi'. Input Ricardo VALIDO conceitualmente (4-5 dias eh janela clinica natural — corrige meu chute inicial de 30 dias), mas materializacao espera trigger empirico. Anti-padrao evitado: codar feature por hipotese antes do usuario precisar."
metadata:
  node_type: memory
  type: project
  originSessionId: 00be2b9f-5dbc-4236-a02e-1459c3f57bd2
---

# Cron lembrete AEC 4-5d — PARQUEADO 30/05 (anti-Babylon)

## A decisao cristalizada

**V1.9.516 (proposta)** — cron diario que detecta AECs ativas (nao-INTERRUPTED, nao-completa, nao-invalidated) sem update >4-5 dias, inserindo alerta em `system_health_alerts` pra medico responsavel decidir check-in proativo — **NAO sera construido hoje**.

**Razao**: aplicacao empirica do principio anti-Babylon ([[feedback_polir_nao_inventar]] + [[feedback_freeze_absorcao_material_b_pos_6h_sessao_29_05]] + [[project_referral_multidisciplinar_sidecar_parqueado_28_05]]).

## Empirico via PAT 30/05 ~14h BRT

```sql
SELECT phase, COUNT(*) 
FROM aec_assessment_state 
WHERE is_complete=false AND invalidated_at IS NULL 
GROUP BY phase;
```

Resultado:
| phase | count |
|---|---|
| COMPLAINT_DETAILS (ativa) | **1** |
| INTERRUPTED (orfa) | 4 |

**Total AECs vivas hoje**: 5. Cobertura empirica HOJE:
- 4 INTERRUPTED → card V1.9.515 [InterruptedAECsCard](src/components/InterruptedAECsCard.tsx) entregue hoje (BLOCO G.5 DIARIO_30 PARTE_2)
- 1 ativa → unico caso que o cron proposto pegaria

**Bandwidth Pedro**: 12 commits hoje (V1.9.504-515) + sessao societaria + 7 memorias. Adicionar +1h cron pra 1 caso/semana = ROI negativo pre-PMF.

## Input do Fundador Clinico Ricardo (cristalizado mesmo parqueando)

Ricardo trouxe via Pedro (30/05 ~13h30): *"AEC a cada 3-4 dias + consulta de retorno apos 1 consulta caso medico/proficional precise"*. Calibrado Pedro pra **4-5 dias** logo apos.

**Validade conceitual**: 100% correto. Corrige meu chute inicial de 30 dias (catastrofico) pra janela clinica REAL (4-5 dias = paciente perde ritmo). Quando trigger empirico chegar, este eh o numero a usar.

**Validade operacional HOJE**: zero — volume nao justifica. Anti-Babylon cristalizado: zero usuario externo = zero motivo construir.

## Triggers empiricos pra DESPARQUEAR (3 alternativos)

1. **Marco 2 chega**: primeiro paciente externo pagante (nao-socio, nao-amigo) inicia AEC → cron protege ANTES de medico esquecer fulano de tal
2. **Volume >=5 AECs ativas simultaneamente** (nao INTERRUPTED) no banco → cron deixa de ser overkill
3. **Ricardo reclama empiricamente 2x seguidas**: *"fulano abandonou avaliacao e eu nao vi"* → trigger humano direto

**Qualquer um dos 3 dispara construcao V1.9.516**. NAO programar pre-trigger.

## Desenho de referencia (quando construir)

Anotado aqui pra proxima sessao nao reinventar:

**Function**: `check_aec_pending_followup_45d()` SECURITY DEFINER
- Filtro: `phase NOT IN ('INTERRUPTED', 'COMPLETED', 'FINAL_RECOMMENDATION')` + `is_complete=false` + `invalidated_at IS NULL` + `last_update < now() - interval '5 days'`
- Para cada match: INSERT em `system_health_alerts` com `check_name='AEC_PENDING_FOLLOWUP_45D'`, `severity='warning'`, `details` com `patient_id` + `phase` + `days_since_update` + `ui_path`
- Idempotencia: skip se ja existe alert open <24h pra mesma AEC

**Destinatario**: medico responsavel via `appointments.professional_id` mais recente + fallback admin

**Schedule**: `30 9 * * *` UTC (06h30 BRT, meia hora apos sgq-health-checks-daily pra nao conflitar)

**Pattern reuso**: V1.9.503 + V1.9.505 (`run_sgq_health_checks` adicionar Check 6 OR funcao separada — decidir entao)

## Conexoes

- [[project_v1_9_515_interrupted_aecs_card_fix_30_05]] — card UI ja entregue pra orfas INTERRUPTED
- [[project_v1_9_503_sgq_health_checks_nivel1_29_05]] — pattern referencia pra reusar
- [[feedback_polir_nao_inventar]] — principio mae
- [[feedback_freeze_absorcao_material_b_pos_6h_sessao_29_05]] — anti-bandwidth
- [[project_referral_multidisciplinar_sidecar_parqueado_28_05]] — outro caso parqueado por mesmo principio
- [[feedback_chat_interaction_matrix_z2_parqueado_marco_2_30_05]] — mesmo padrao Tier 3 parqueado

## Frase ancora

> *"30/05 ~14h: cron lembrete AEC 4-5d parqueado por anti-Babylon empirico. 1 AEC ativa no banco HOJE nao justifica +1h dev + nova feature. Input Ricardo (4-5 dias = janela clinica natural) cristalizado pra quando trigger empirico chegar. Desparqueia quando: Marco 2 OR >=5 AECs ativas simultaneamente OR Ricardo reclamar 2x. Bandwidth Pedro = bandwidth alertas. Zero usuario externo = zero motivo construir."*
