---
name: project_cron_monthly_closing_forense_01_06
description: Forense 01/jun do cron monthly-closing-medcannlab — disparou 00:00 BRT (03:00 UTC) e FALHOU (null user_id) → 0 poluição. Mina dos 7 user_profiles órfãos + correção de fuso + decisão deixar dormente até lançamento.
metadata: 
  node_type: memory
  type: project
  originSessionId: 33c9058f-295f-4bac-8e8c-3ae05461126b
---

Forense empírica via PAT (01/jun) que FECHA o risco aberto que CLAUDE.md + [[feedback_gamification_ativa_refuta_memory_24_04_31_05]] flagaram pra "01/jun ~3h BRT".

## O que aconteceu (empírico, ao vivo)
O cron `monthly-closing-medcannlab` (`0 3 1 * *`) **disparou** `2026-06-01 03:00:00 UTC` (= **00:00 BRT, meia-noite**) e **FALHOU**:
```
status: failed
ERROR: null value in column "user_id" of relation "ranking_history" violates not-null constraint
```
- `calculate_monthly_ranking` faz `INSERT INTO ranking_history (user_id, reference_month, total_points_earned) SELECT user_id, ... FROM user_profiles`. Como **7 de 50 rows de `user_profiles` têm `user_id` NULL**, o INSERT violou o NOT NULL → função abortou → `process_monthly_closing` abortou → rollback.
- **Resultado: `ranking_history` = 0 (total e junho), `user_benefits_status` = 0.** Zero poluição. Nenhum benefício, nenhum dinheiro. `gamification_points` = 48 (memória dizia 45).

## 3 correções de premissa cravadas
1. **FUSO**: pg_cron é **UTC**. `0 3 1 * *` = 03:00 UTC = **00:00 BRT**, NÃO "3h BRT". CLAUDE.md/MEMORY.md/DIARIO erravam por 3h. (O Claude externo "Claudio" repetiu o mesmo erro herdado.)
2. **TABELA ERRADA**: as funções NÃO leem `gamification_points` (as 48 rows). Leem `user_profiles.points` (→ ranking_history) e iteram `public.users` (→ user_benefits_status). O "risco das 45 gamification_points" era a tabela errada.
3. **SEM FLAG**: não existe feature flag (grep 0 matches). As funções rodam incondicionalmente. O único "off" é `cron.unschedule`. A memória 24/04 "desabilitada por flag" está refutada.

## 🧨 A MINA (acoplamento perigoso)
Os 7 `user_profiles` com `user_id` NULL são os **órfãos pré-V1.9.533** (pacientes cadastrados em massa Nov/2025, nunca logaram — ver [[feedback_pacientes_abandonados_pre_v1_9_533_evidencia_empirica_31_05]] + [[project_v1_9_531_admin_users_status_left_join_fix_30_05]]). O crash é hoje um **salvador acidental**: se alguém **consertar esses user_id órfãos** (desejável por outros motivos) SEM pensar no cron, o `calculate_monthly_ranking` passa a **ter sucesso** e começa a **semear `ranking_history` com pontos de teste**, silenciosamente, à meia-noite. Consertar os órfãos e o cron são coisas que parecem independentes mas estão acopladas.

## Decisão Pedro 01/jun: DEIXAR como está (dormente)
Discussão gamification: tecnicamente independe do pagamento, mas **economicamente acoplada** (benefícios = consulta grátis/desconto = valor R$). Ligar agora daria aos **usuários internos/teste já dentro** (Ricardo/Carolina/contas-teste) um head-start INDEVIDO no `ranking_history` + streak `consecutive_months_top5` (3 meses → elegível a benefício) ANTES de ter 1 pagante real. Decisão: **congelar até o lançamento**. Quando ligar gamification (pós Marco 1/pagamento), fazer **START LIMPO**: zerar `gamification_points` de teste + `ranking_history` do marco de lançamento + rankear só coorte real + decidir se profissional entra no mesmo ranking que paciente (benefício é cara de paciente).

Implicação de "deixar como está": (a) falha mensal recorrente (próximo 01/jul 00:00 BRT) que vai acender `system_health_alert` no check SGQ diário 06h BRT; (b) a mina acima. Trade-off aceito pré-PMF. Quando ligar gamification = `cron.unschedule` OU corrigir + start limpo (decisão deliberada, não acidental).

Conexões: [[feedback_gamification_ativa_refuta_memory_24_04_31_05]] · [[feedback_paymentgate_ausente_stripe_mock_pre_marco_2_31_05]] · [[feedback_mexer_so_gap_real_principio_meta_30_05]]
