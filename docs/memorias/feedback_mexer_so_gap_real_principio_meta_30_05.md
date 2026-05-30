---
name: mexer-so-gap-real-principio-meta-30-05
description: "30/05/2026 ~18h30 BRT — Princípio meta cristalizado por Pedro consolidando padrão observado nas 17 intervenções do dia (V1.9.504-526). Regra: 'Mexer SÓ no que está incompleto, desconectado, com bug, ou bomba latente. O que funciona em produção empíricamente, NÃO se toca.' Evidência empírica: TODAS as 17 intervenções de 30/05 atacaram gap REAL detectado por screenshot/PAT/smoke/grep (drift documental, vulnerabilidade JWT, bug componente legacy, regex falso positivo, AECs órfãs, Edges desconectadas). Zero 'mexer só pra mexer'. Locks regulatórios + Core pipeline + ICP-Brasil + Verbatim + AEC FSM + Matrix Z2 + 144 RLS = TODOS intocados (funcionam empíricamente). Refator tradevision-core 7765L parqueado (bus factor cresce mas funciona pré-PMF aceitável). Complementa [[feedback_polir_nao_inventar]] + [[feedback_p9_nao_uso_nao_e_nao_precisa]] (recalibrado hoje em 1 dimensão: não-uso justifica observação ativa antes de ignorar). 5 sub-princípios derivados: (1) identificar gap REAL empíricamente antes de codar; (2) reusar pattern existente quando possível; (3) aplicar + smoke empírico imediato; (4) documentar no mesmo dia (memory+diário+CLAUDE.md); (5) NÃO tocar o que funciona em produção. Aplicação recursiva: hoje audit triggers auth.users detectou POTENCIAL duplicação (4 AFTER INSERT triggers) mas decisão = PARQUEAR audit profundo até trigger empírico forte (cadastros funcionam, risco alto se deletar errado)."
metadata:
  node_type: memory
  type: feedback
  originSessionId: 00be2b9f-5dbc-4236-a02e-1459c3f57bd2
---

# Mexer SÓ no gap real (princípio meta operacional consolidado 30/05)

## A regra cristalizada por Pedro

> **"Mexer SÓ no que está incompleto, desconectado, com bug, ou bomba latente. O que funciona em produção empíricamente, NÃO se toca."**

Pedro consolidou esse princípio na sessão de 30/05 ~18h30 BRT, após observar empíricamente o padrão das 17 intervenções do dia (V1.9.504-526).

## Evidência empírica das 17 intervenções 30/05

| Intervenção | Gap REAL identificado pré-mexer |
|---|---|
| V1.9.504 housekeeping | 272 tmp/ jsons sujando git status + scripts lint mortos |
| V1.9.505 PII regex refined | Falso positivo "Análise Holística" detectado smoke V1.9.503 |
| V1.9.506 verify_jwt tradevision-core | Bomba latente 8 dias (desde 22/05) |
| V1.9.507-514 (8 UX commits) | Pedro/Ricardo flaggou cada regressão visual via screenshot real |
| V1.9.515 InterruptedAECsCard | BUG REAL: card invisível na tela (componente legacy) |
| V1.9.516 Check 6 | Gap arquitetural: AECs em fase ATIVA sem alerta (Illa Proença 7d empírico) |
| V1.9.517-519 Edges órfãs | 3 Edges desconectadas (0 callers grep todo codebase) |
| V1.9.520-526 batch 7 Edges | Vulnerabilidade verify_jwt=false + 2 ÓRFÃs adicionais |

**Padrão**: 100% das intervenções atacaram gap REAL detectado empíricamente. ZERO "mexer só pra mexer".

## Lista DO QUE NÃO TOCAMOS (porque funciona)

| Sistema | Estado HOJE | Razão NÃO tocar |
|---|---|---|
| `sign-pdf-icp` v22 PBAD CONFORME ITI | 43 PDFs signed produção, Lock V1.9.299 validado ITI | Funciona empíricamente + risco regulatório se quebrar |
| `tradevision-core` Core pipeline ~7765L | Pedro AEC funcionou hoje (FINAL_RECOMMENDATION → COMPLETED 17.9s) | Funciona, V1.9.506 só restaurou camada externa JWT |
| AEC FSM 13 fases | Funcionou empíricamente | Lock V1.9.95 selado Magno |
| Verbatim First V1.9.86 (~46% bypass GPT) | Funciona | Lock + Magno |
| Pipeline Orchestrator (6 stages) | Funciona | Lock + Magno |
| Matrix Z2 + Bula V1.9.468-B | Funciona | Lock selado |
| RLS 144 tabelas (100% cobertura) | Funciona | Validação V1.9.503 + cron diário |
| 8 Locks regulatórios | Intocados | "Funciona, não mexe" puro |
| Refator branch tradevision-core 7765L | Parqueada | Bus factor cresce MAS funciona — pré-PMF aceitável |
| 5 triggers auth.users (4 AFTER INSERT) | Cadastros funcionam (49 users em produção) | Potencial duplicação SINALIZADA mas audit profundo PARQUEADO sem trigger empírico forte |

## 5 sub-princípios derivados operacionais

1. **Identificar gap REAL empíricamente ANTES de codar** — screenshot / PAT / smoke / grep / log empírico, nunca hipótese
2. **Reusar pattern existente quando possível** (anti-Babylon-recalibrado) — pattern V1.9.517 escalado em V1.9.518-526 sem reinventar
3. **Aplicar + smoke empírico imediato** — V1.9.516 detectou Illa em 30s pós-deploy, V1.9.526 cron pós-flip 17:55 UTC = SUCCEEDED
4. **Documentar no mesmo dia** (memory + diário + CLAUDE.md) — zero drift documental
5. **NÃO tocar o que funciona em produção** — mesmo se "parece duplicado/redundante", funcional > preventive cleanup sem trigger

## Aplicação recursiva HOJE (validando o próprio princípio)

Durante audit empírico das 5 Edges em observação 48h, descobrimos:
- `renal_inline_suggestions`: 1 row total, last 16/05 (Maria das Dores) — sidecar empíricamente subutilizado
- `video_call_requests`: **255 rows, last 27/05** — tabela ATIVA (≠ Edge dormindo)
- `professional_integrations` + `integration_jobs`: 0 rows ambos — confirma google-auth + sync-gcal dormindo

**Implicação meta**: 255 rows em video_call_requests SEM caller grep da Edge `video-call-request-notification` = anomalia que precisa investigação ANTES de hard-delete 01/jun. Princípio cristalizado AGORA validando seu próprio uso: **antes de deletar a Edge V1.9.527, validar empíricamente se row em video_call_requests dispara Edge via trigger pg_cron OU webhook frontend não-grepado**.

Sem essa investigação adicional, hard-delete V1.9.527 vai quebrar fluxo silencioso. Memory princípio mãe acaba de evitar regressão futura empíricamente.

## Conexões

- [[feedback_polir_nao_inventar]] — princípio mãe primeiro
- [[feedback_p9_nao_uso_nao_e_nao_precisa]] — recalibrado hoje em 1 dimensão (observação ativa antes ignorar)
- [[project_v1_9_517_get_chat_history_jwt_flip_observacao_48h_30_05]] — pattern V1.9.517 universal
- [[project_v1_9_520_526_edge_jwt_audit_batch_30_05]] — escala pattern em batch
- [[feedback_validacao_empirica_screenshot_maior_que_plano_teorico_28_05]] — princípio screenshot 28/05
- [[feedback_freeze_absorcao_material_b_pos_6h_sessao_29_05]] — anti-bandwidth
- DIARIO_30_05_2026_PARTE_2 — registro empírico

## Frase âncora

> *"30/05 ~18h30: 17 intervenções HOJE = 100% gap REAL identificado empíricamente, zero 'mexer pra mexer'. Cobertura defesa em camadas evoluiu 14%→93% atacando vulnerabilidades reais. Locks/Core/ICP/Verbatim/AEC/Matrix INTOCADOS porque FUNCIONAM. Princípio recursivo: durante audit empírico de hoje, 255 rows video_call_requests SEM caller grepado revelaram que delete V1.9.527 video-call-request-notification PRECISA investigação adicional ANTES de execução 01/jun. Princípio acaba de validar seu próprio uso evitando regressão futura."*
