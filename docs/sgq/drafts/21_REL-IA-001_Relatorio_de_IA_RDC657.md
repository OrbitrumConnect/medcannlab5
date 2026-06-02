# REL-IA-001 — Relatório de Inteligência Artificial (RDC 657/2022 Art.12)

**Versão draft:** 0.1 (02/06/2026)
**Status:** DRAFT pré-consultora SaMD (requer revisão Ricardo Valença + RT + consultora)
**Referência normativa:** ANVISA RDC 657/2022 Art.12 (requisitos de documentação para software médico com IA) · alinhado a IEC 62304 e ISO 14971 (RSK-001)
**Escopo:** módulo de IA "Nôa Esperança" do MedCannLab 3.0 (SaMD Classe IIa — *sujeita a avaliação regulatória formal*).

> ⚠️ Auditor-safe: este documento descreve a arquitetura de IA **como construída**. O modelo-base é de terceiro (OpenAI) — sua proveniência/treinamento é responsabilidade do fornecedor; o fabricante documenta o **uso, governança e fronteira de responsabilidade**. Não se afirma treinamento próprio de modelo nem desempenho clínico validado (esse é trabalho de validação clínica — POP-VAL-001).

---

## 1. Racional da técnica de IA

A IA da plataforma usa **Large Language Models (LLM) de terceiro via API**, **não há treinamento ou fine-tuning de modelo próprio**. A técnica é **LLM + RAG (Retrieval-Augmented Generation) curado + guardrails determinísticos**, com finalidade de **organização e síntese da escuta clínica** — nunca decisão clínica autônoma.

- **Modelo principal:** OpenAI `gpt-4o-2024-08-06` (chat clínico / Matrix) — confirmado em `tradevision-core/index.ts`.
- **Modelo auxiliar (Escriba):** OpenAI `gpt-4o-mini` (temperatura 0.1) — estruturação textual de baixa criatividade.
- **Por que LLM+RAG e não modelo próprio:** o objetivo é **estruturar relato espontâneo** (método AEC/IMRE), não diagnóstico. Um modelo de fronteira + RAG curado + camadas de governança atende o objetivo com **menor risco** que um classificador clínico treinado (que seria decisional e de classe de risco superior).

## 2. Fronteira de responsabilidade (OpenAI × fabricante)

| Camada | Responsável | Evidência |
|---|---|---|
| Modelo-base (pesos, pré-treino, dados de treino) | **OpenAI** | modelo proprietário de fronteira; histórico de treino é do fornecedor |
| Prompts de sistema / governança / RESEARCH_PROMPT | **MedCannLab** | `index.ts` (RESEARCH_PROMPT codifica CFM 2.314 + arquitetura não-decisional) |
| Base de conhecimento (RAG curado) | **MedCannLab** | `base_conhecimento` (5 entries hand-crafted) + `documents` (acervo institucional) |
| Guardrails determinísticos (Verbatim, FSM, GATE, Z2) | **MedCannLab** | pirâmide de 8 camadas (ver §4) |
| Pós-processamento / sanitização de saída | **MedCannLab** | strip de tokens, validação UUID, **sanitização de PII** (V1.9.565/566) |

**"Histórico de treinamento" (Art.12):** o fabricante **NÃO treina nem ajusta** o modelo. O comportamento é moldado por (a) prompt engineering, (b) RAG curado, (c) guardrails. Não há dataset de treino proprietário; não há pesos sob controle do fabricante.

## 3. Bases de conhecimento (RAG) — tamanho e propósito

Duas bases **separadas por design** (ver CLAUDE.md "Fonte de verdade do RAG"):

| Base | Conteúdo | Tamanho | Quem lê |
|---|---|---|---|
| `base_conhecimento` | Entries **hand-crafted** minimalistas (noa_identidade, metodologia_aec, sistema_imre, kb-curso-aec, kb-protocolo-cbd) — proteção contra DOC_LIST hijacking | **5 rows** | Edge `tradevision-core` (`.limit(3)` no bloco RAG) |
| `documents` | Acervo institucional (UI Base de Conhecimento) | **~41 rows** | UI admin (não injetado direto no prompt clínico) |

**Decisão arquitetural** (V1.9.318): NÃO migrar `documents` → `base_conhecimento` em massa — engrossar o RAG bruto altera a prior do GPT e causa DOC_LIST hijacking (empíricamente revertido 17/05). As 5 entries são proteção validada.

## 4. Arquitetura não-decisional — verificação metodológica (8 camadas)

> *"GPT é o último a falar e o primeiro a ser checado."*

```
0. REGRA HARD §1 (constitucional)   "Consentimento ≠ Agendamento"
1. COS KERNEL v5.0                  5 portas: KillSwitch/Trauma/Metabolismo/ReadOnly/Policy
2. AEC FSM                          13+ fases determinísticas (clinicalAssessmentFlow.ts)
3. VERBATIM FIRST (V1.9.86)         ~46% das respostas em fases hard-lock NÃO passam pelo GPT
4. AEC GATE V1.5                    bloqueia agendamento durante AEC ativa
5. GPT-4o                           só chamado se nada acima resolveu
6. PÓS-PROCESSAMENTO                strip tokens, valida UUID, sanitiza PII, força tags
7. PIPELINE ORCHESTRATOR            REPORT→SCORES→SIGNATURE→AXES→RATIONALITY→DONE
```

- **Não-decisional codificado:** `index.ts:5239` — *"Decisão terapêutica é ato médico (CFM 2.314) — IA não atravessa essa linha"*. A IA **não diagnostica, não prescreve, não decide conduta**.
- **Reconhecimento honesto (RSK-001 / ISO 14971):** organizar a escuta, estruturar racionalidades e gerar scores **influencia o contexto** da decisão clínica (ainda que não a tome) — por isso a classificação SaMD é tratada como **Classe IIa sujeita a avaliação**, não isenção.

## 4.1 Independência de modelo (LLM-agnostic) + BYO LLM (roadmap)

A governança de 8 camadas é **independente do modelo de IA** — os controles (Verbatim First, AEC FSM, AEC GATE, grounding factual, Matrix Z2, pós-processamento + sanitização) atuam **sobre a saída de QUALQUER LLM**, não só do GPT. O princípio *"a IA é a última a falar e a primeira a ser checada"* vale para qualquer modelo no lugar do GPT-4o.

- **Resiliência / fallback:** como a segurança é **arquitetural** (não depende do modelo), uma indisponibilidade do GPT/OpenAI pode ser absorvida operando com outra LLM (ex.: Claude, Gemini, modelo local) — as camadas continuam protegendo. **Hoje: GPT-4o como provedor único; fallback multi-LLM = roadmap (não implementado).**
- **BYO LLM (Bring Your Own LLM):** opção **futura** — instituição/clínica poder plugar a própria LLM, incluindo **modelo local/on-premise** (relevante para soberania de dado sensível e LGPD). **Não implementado; opção de roadmap.**
- **Valor regulatório:** **não há lock-in de fornecedor único.** A conformidade e a segurança **não dependem de um modelo específico** — o controle é do **fabricante, na arquitetura**, não terceirizado ao modelo. Argumento forte para SaMD e governança de IA (CFM 2.454/2026, EU AI Act): a supervisão é **estrutural e portável**.
- **⚠️ NÃO é plug-and-play (calibração obrigatória por modelo):** trocar de LLM não destrói a governança (arquitetural OK — pattern provider-agnostic), MAS **exige por modelo**: smoke clínico empírico (refusal patterns / confiança / tendência a confabular variam entre modelos), recalibração dos **locks micro-factuais** (Matrix Z2 — 5 perguntas-armadilha), e **dossiê regulatório próprio por provider** (RSK-001 + POP-VAL-001 + `clinical_qa_runs`). Estima-se ~40-60h/modelo. Pode-se trocar **arquiteturalmente**, não **clinicamente sem nova validação**. *(Cristalizado 30/05: "governança independe do LLM subjacente COM calibração necessária". BYO-LLM = conectar API key de provider whitelisted, NÃO um Custom GPT individual — esses vivem fora da API.)*
- **Infra relacionada já no código:** `src/lib/localLLM.ts` (Xenova/transformers — embeddings/Q&A/sumarização locais) é base para modelo local/on-premise; arquitetura BYO-LLM **parqueada** (19/05). *Há memórias dedicadas (`feedback_governanca_medcannlab_independe_do_llm...`, `project_byo_llm_arquitetura_parqueada_19_05`, `reference_pricing_dinamico_cap_byo...`) — este doc consolida, não duplica.*

> ⚠️ Auditor-safe: hoje o sistema opera com **GPT-4o (provedor único)**. Multi-LLM fallback e BYO LLM são **direção de arquitetura / roadmap COM calibração obrigatória por modelo** (não plug-and-play) — não estado atual. Mas o desenho não-decisional **já é** model-agnostic.

## 5. Mitigação de riscos específicos de IA (cruz com RSK-001)

| Risco de IA | Controle | Ref |
|---|---|---|
| **Alucinação** (conteúdo clínico inventado) | Verbatim First (~46% bypass) + Grounding factual (GPT nunca cita número factual sem fonte) + Matrix Z2 (cita literal, não sintetiza cross-bulas) | RSK-001 H5 |
| **Overtrust / IA decide** | Médico assina/decide; AEC GATE; REGRA HARD §1; arquitetura não-decisional | RSK-001 H1 |
| **Viés** | Modelo de fronteira (não treino próprio enviesável); RAG curado revisável | — |
| **Vazamento de PII ao operador (OpenAI)** | Sanitização do nome do paciente antes da persistência (`sanitizeRationalityPII`, V1.9.565/566 — insensível a acento) | RSK-001 H2 |
| **Loop infinito / custo** | TOKEN MGMT V1.9.61 (cap 60k) + escape CONSENSUS V1.9.473 | RSK-001 H9 |

## 6. Telemetria / instrumentação de custo e uso

`ai_chat_interactions.metadata` registra por chamada: `model`, `pricing_version`, tokens (prompt/completion/total), `cost_usd_estimate`, `provider`, `processing_time`, `sanitized`, `simbologia` (V1.9.238 em produção). Permite auditoria de custo e comportamento.

## 7. Limitações conhecidas (transparência)

- O modelo-base é **caixa-preta de terceiro** — não há acesso a pesos nem garantia de reprodutibilidade entre versões da OpenAI.
- **Desempenho clínico NÃO validado formalmente** — cadência de `clinical_qa_runs` ainda baixa (baseline a estabelecer pré-Marco 2; ver POP-VAL-001).
- Sanitização de PII por token **não cobre typos** no nome de origem (correção de dado, não de código).
- Terminologia clínica é **texto-livre** — a IA **não infere CID-10** (lock institucional); codificação é ato humano.

---

**Aprovação:**
- [ ] RT habilitado: ________________ Data: ___/___/___
- [ ] Médico Sócio (validação clínica): Dr. Ricardo Valença — Data: ___/___/___
- [ ] Consultora SaMD: ________________ Data: ___/___/___
- [ ] Tech Lead: Pedro Henrique Passos Galluf — Data: 02/06/2026 (draft)
