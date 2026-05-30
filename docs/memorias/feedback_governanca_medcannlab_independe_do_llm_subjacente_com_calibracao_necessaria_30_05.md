---
name: governanca-medcannlab-independe-do-llm-subjacente-com-calibracao-necessaria-30-05
description: "Principio operacional cristalizado 30/05 apos confusao Custom GPT do Ricardo vs Edge tradevision-core. Distincao arquitetural fundamental: prompt do MedCannLab vive no servidor (Edge), Custom GPT individual do medico vive na conta OpenAI dele. Governance MedCannLab eh arquiteturalmente independente do LLM subjacente (qualquer GPT/Claude/Gemini/Llama pode passar pelas 8 camadas), MAS trocar modelo exige re-validacao clinica via smoke + recalibracao de locks micro-factuais — NAO eh plug-and-play. Complementar ao ADENDO BYO-LLM 19/05 (Calibracao 4 custo regulatorio oculto por modelo). Linka, nao duplica."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 00be2b9f-5dbc-4236-a02e-1459c3f57bd2
---

# Governance MedCannLab independe do LLM subjacente (com calibracao necessaria)

## A regra

**A governance clinica do MedCannLab (pirmamide 8 camadas + AEC FSM + Verbatim First + Lock V1.9.388-A.3) vive no Edge `tradevision-core/index.ts`, NAO no LLM.** Logo:

- Trocar LLM (GPT-4o → Claude / Gemini / Llama local) NAO destrói a governance.
- MAS trocar LLM **exige re-validacao clinica via smoke + recalibracao de locks micro-factuais** antes de autorizar em producao.

**NAO eh plug-and-play.** Anti-convite a *"podemos trocar modelo amanha sem problema"* — pode-se trocar **arquiteturalmente**, nao **clinicamente**.

## Why (confusao Custom GPT vs Edge Function detectada 30/05)

Pedro perguntou onde vive o prompt do MedCannLab vs o Custom GPT que Ricardo montou na conta OpenAI dele. Confusao comum (resolve duvida estrategica real).

### Distincao arquitetural (fato tecnico verificavel)

| Aspecto | Edge `tradevision-core` (MedCannLab) | Custom GPT do Ricardo (chat.openai.com) |
|---|---|---|
| **Onde mora** | Servidor (Supabase Edge Function) | Conta OpenAI individual de Ricardo |
| **Quem mantem** | Pedro + Ricardo via git + locks selados | Ricardo sozinho |
| **Versionado** | Git imutavel + tags + diarios + memorias | Nao publico |
| **Acessivel via API** | SIM (REST endpoint, recebe JWT, passa pelas 8 camadas) | NAO (so via interface chat.openai.com) |
| **Auditavel** | Git log + `cron.job_run_details` + `ai_chat_interactions` | So Ricardo ve |
| **Conectavel via BYO-LLM** | Eh o ponto que recebe BYO-LLM API key | NAO eh alcancavel — vive em camada diferente |

### Implicacao crucial pra BYO-LLM

BYO-LLM proposto na memoria 19/05 = Ricardo conecta API key OpenAI dele.
- MedCannLab continua **enviando o prompt nosso** via REST API
- OpenAI API **NAO tem acesso aos Custom GPTs** criados na interface chat.openai.com
- Custom GPT do Ricardo continua invisivel pra MedCannLab mesmo apos BYO-LLM ativar

Logo: BYO-LLM = troca de **modelo + pagamento**, NUNCA troca de **prompt/governance**.

## Calibracao 4 aplicada (vide ADENDO BYO-LLM 19/05)

| Camada | Status quando troca LLM |
|---|---|
| **Arquitetural** (LLM Router + adapter por provider) | OK — pattern provider-agnostic existente |
| **Clinico** (smoke clinico empirico por modelo na AEC) | **EXIGE smoke novo** — refusal patterns + confianca + tendencia a confabular variam por modelo |
| **Regulatorio** (ANVISA SaMD Classe IIa) | **EXIGE validacao por provider** — 1 RSK-001 + 1 POP-VAL-001 + 1 clinical_qa_runs por modelo |
| **Locks micro-factuais** (V1.9.468-A Matrix Z2 + Bula) | **EXIGE recalibracao** — 5 perguntas-armadilha por modelo |

**Empirico aplicavel**: GPT-4o vs Claude-3.5-Sonnet vs Gemini-1.5-Pro vs DeepSeek-V3 vs Llama-3.3-Local geram outputs clinicamente diferentes mesmo com mesmo prompt. Comprovado em literatura LLM benchmarks. Aplicavel aqui mesmo com nossa governance subordinando.

## Implicacao competitiva (sobria, nao pitch)

| Player | Posicionamento |
|---|---|
| **Cannect** | Marketplace cannabis + ANVISA tramitada + entrega home + telemedicina humana. R$ 60M receita 2025. **Ocupa esse nicho com moat operacional**. |
| **MedCannLab** | Metodo clinico autoral (AEC) + IA conduzindo entrevista + ICP-Brasil PBAD CONFORME ITI + governance auditavel. **Ocupa nicho diferente com moat clinico-regulatorio**. |

**Trocar modelo subjacente (OpenAI → Claude → etc) NAO afeta posicionamento de nenhum dos dois.** Sao nichos diferentes.

NAO se aplica framing "MedCannLab vence Cannect porque tem 8 camadas" — Cannect nao disputa nessa dimensao. Comparacao em dimensao irrelevante.

## Como aplicar (3 lugares)

### 1. Quando alguem propor "trocar OpenAI por Claude" (interno OU pedido externo)

**Resposta correta**:
> *"Arquiteturalmente eh trivial (LLM Router + adapter). Clinicamente exige smoke completo + recalibracao Matrix Z2 (5 perguntas-armadilha) + nova clinical_qa_runs. Regulatoriamente exige novo dossie por modelo se ANVISA SaMD ja submetida. Total: ~40-60h de trabalho por modelo novo."*

**NAO usar**:
> *"Sim, trocar eh facil, governance protege."*

### 2. Quando descrever competitivamente

**Resposta correta**:
> *"MedCannLab ocupa nicho diferente de Cannect: metodo clinico + governance + ICP-Brasil. Cannect ocupa marketplace + ANVISA + entrega. Cada um tem moat na sua dimensao. Nao se substituem."*

**NAO usar**:
> *"MedCannLab tem wedge violento contra Cannect porque..."* (Material B pitch inflado)

### 3. Quando descrever BYO-LLM

**Resposta correta**:
> *"BYO-LLM permite medico conectar API key de provider whitelisted. Pagamento passa pra ele. Modelo dele (mesma OpenAI ou Claude) opera sob nossa governance. NAO usa Custom GPT individual dele — Custom GPTs vivem so na interface chat.openai.com, fora do API."*

**NAO usar**:
> *"BYO-LLM permite cada medico trazer sua propria IA personalizada."*  (confunde Custom GPT com API)

## Princípios meta aplicados (auto-recursivo)

Esta memoria foi calibrada via auditoria externa apos versao inicial conter overclaims:
- **Overclaim 1** "wedge violento contra Cannect" → Material B inflado → REMOVIDO
- **Overclaim 2** Tabela Custom GPT vs tradevision-core com "estimado" sem PAT → comparacao categorias diferentes → REMOVIDA
- **Overclaim 3** "governance MedCannLab > prompt externo" → hierarquia sem nuance → REFORMULADO

Aplicacao recursiva de [[feedback_material_b_pode_contradizer_constituicao_22_05]]: Material B externo (incluindo impulso interno do Claude propondo tabela comparativa inflada) pode contradizer Constituicao. Anti-Constituicao filtrada antes de cristalizar.

## Conexoes

- [[project_byo_llm_arquitetura_parqueada_19_05]] — ADENDO 30/05 cristalizou Calibracao 4. Esta memoria **complementa** (nao substitui)
- [[feedback_noa_matrix_ambiente_clinico_governado_nao_ide_30_05]] — sintese frase ancora regulatoria
- [[feedback_anti_overclaim_endorsements]] (cristalizar) — Material B inflado disfarcado de principio
- [[feedback_doc_institucional_sem_pat_nao_e_valido_23_05]] — comparacao com "estimado" eh anti-Constituicao
- [[feedback_material_b_pode_contradizer_constituicao_22_05]] — auto-aplicacao recursiva
- [[reference_lock_v1_9_388_a3_ancoragem_regulatoria_multicamada_27_05]] — lock que sustenta governance
- docs/sgq/drafts/04_RSK-001 + 09_POP-VAL-001 — documentacao SGQ por modelo se BYO-LLM ativar

## Frase ancora

> *"30/05: Governance MedCannLab eh arquiteturalmente independente do LLM subjacente — qualquer modelo pode passar pelas 8 camadas. MAS trocar modelo exige re-validacao clinica + recalibracao de locks + dossie regulatorio por provider. NAO eh plug-and-play. BYO-LLM nunca conecta Custom GPT individual do medico (vive em camada diferente). Cannect ocupa nicho diferente — comparacao com 'wedge violento' eh Material B inflado, nao principio operacional."*
