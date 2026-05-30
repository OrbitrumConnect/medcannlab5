---
name: chat-interaction-matrix-z2-parqueado-marco-2-30-05
description: "Decisao cirurgica 30/05 - Matrix Z2 NAO vai ler patient_medical_records.chat_interaction (6100 rows de chat livre paciente+Noa) ate Marco 2 (1o paciente externo pagante real). Pedro intuiu empiricamente \"contamina?\" e confirmou os 4 motivos tecnicos. Tier 3 ITEM 12 do DIARIO_30 PARQUEADO ate ter demanda real (paciente externo reclamar \"falei isso pro Noa e medico nao viu\"). FOLLOW_UP (medico escreve em Evolucao - 18 rows) JA esta conectado ao Matrix Z2 desde V1.9.489. So o chat livre paciente esta de fora por design (V1.9.318 anti-DOC_LIST hijacking + V1.9.452 nao cobre essa tabela + Token MGMT V1.9.61 ja trunca + sinal afogado em ruido casual)."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 00be2b9f-5dbc-4236-a02e-1459c3f57bd2
---

# Chat_interaction Matrix Z2 PARQUEADO ate Marco 2

## A regra

**Matrix Z2 NAO le `patient_medical_records.chat_interaction` (chat livre paciente+Noa) ate Marco 2.** FOLLOW_UP medico (clinical_assessments) continua sendo a unica fonte de "evolucao paciente" que Matrix le.

Quando 1o paciente externo pagante real reclamar empiricamente *"falei isso pro Noa e medico nao viu"* = trigger pra reativar discussao com Ricardo.

## Why (analise empirica 30/05 ~02h BRT)

Pedro perguntou *"contamina?"* sobre adicionar 6100 rows chat_interaction no Matrix Z2. Analise empirica confirmou 4 motivos tecnicos pra parquear:

### 1. Mistura sinal/ruido brutal

Chat livre = 200x mais ruido casual ("oi", "obrigado", "tudo bem?") por cada mensagem de valor clinico ("dor voltou hoje"). Matrix concluiria coisas erradas baseado em desabafo casual.

### 2. Hijacking RAG (V1.9.318 ja provou empiricamente)

Memoria cristalizada V1.9.318 (17/05/2026): adicionar busca paralela em RAG molda comportamento cognitivo. Padrao bug 1 caso/16d -> 6 casos/21h. Despejar 6100 chat_interaction = MESMO padrao. Matrix passa a interpretar "analise paciente" como "mostre historico de mensagens".

### 3. PII NAO sanitizado

V1.9.452 cobre apenas `clinical_rationalities.assessment` (132 rows). Tabela `patient_medical_records.chat_interaction` (6100 rows) NAO foi tocada. Chat livre contem nomes de terceiros (mae, marido, medicos, vizinhos) que vazariam no contexto Matrix. Marco 2 ficaria bloqueado de novo.

### 4. Custo OpenAI estouraria cap

Token MGMT V1.9.61 ja trunca Matrix em 60k chars (visto em log empirico 30/05: 79265 -> 60103 chars truncado). Adicionar 6100 rows = 10-50x volume = estouro total = resposta inutil.

## Quem deve parquear vs implementar

| Fonte | Status hoje | Decisao 30/05 |
|---|---|---|
| FOLLOW_UP medico (clinical_assessments) | ✅ JA Matrix Z2 le (V1.9.489) | Manter |
| chat_interaction paciente (patient_medical_records) | ❌ Matrix nao le | **PARQUEADO ate Marco 2** |
| ai_chat_interactions (telemetria) | ✅ Observabilidade IA le (V1.9.374) | Manter (diferente da Matrix) |

## Tier 3 ITEM 12 DIARIO_30 status

| Item | Original | Decisao 30/05 |
|---|---|---|
| Adicionar 5o toggle "Chat IA" no NoaMatrixView | Proposto | ⏸️ Parqueado ate Marco 2 |
| Estender usePatientLongitudinal com fonte chatInteractions | Proposto | ⏸️ Parqueado |
| Limit 20 ultimas msgs ultimos 30d pseudonimizado | Proposto | ⏸️ Parqueado |
| WhatsApp Ricardo proposta | Sugerido | ⏸️ NAO mandar agora |

## Trigger pra desparquear

Apenas 1 dos 3:

1. **1o paciente externo pagante reclamar empiricamente** *"falei X pra Noa e medico nao viu"* (Marco 2 trigger)
2. **Ricardo flaggar empiricamente em uso real** que faltou contexto que paciente desabafou entre consultas
3. **Marco 3 (20-30 pacientes externos)** com >=2 reclamacoes do mesmo tipo

## Anti-Babylon aplicado

Sem usuario que precise, feature vira teatro. 4 motivos tecnicos somados a zero demanda empirica = parqueado.

Princípio cristalizado: **"Não inventa feature antes de ter usuário que precise"** + **"RAG molda comportamento cognitivo"** (V1.9.318).

## Conexoes

- [[feedback_rag_molda_comportamento_cognitivo_20_05]] (cristalizar) - V1.9.318 anti-DOC_LIST hijacking
- [[project_v1_9_452_pii_sanitize_clinical_rationalities_29_05]] - cobre apenas rationalities
- [[project_v1_9_487_488_489_490_camada_1_5_4_2_smoke_pass_29_05]] - V1.9.489 ja conecta FOLLOW_UP
- DIARIO_30 §B.5 + §C - analise tecnica completa do gap
- DIARIO_30 §B.6 = noaEngine.ts:60 = unico fetch direto (auditado V1.9.506 - ja resolvido)

## Frase ancora

> *"30/05: Pedro intuiu 'contamina?' sobre Matrix ler chat livre paciente. 4 motivos tecnicos confirmaram empiricamente. Parqueado ate Marco 2 trazer demanda real. FOLLOW_UP medico (18 rows) continua sendo unica fonte 'evolucao paciente' no Matrix. Anti-Babylon: zero usuario externo = zero motivo pra construir."*
