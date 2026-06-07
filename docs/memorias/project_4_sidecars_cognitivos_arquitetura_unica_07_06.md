---
name: project_4_sidecars_cognitivos_arquitetura_unica_07_06
description: "4 sidecars cognitivos reais (Renal/Neuro/Sinais do Relato/Cannabis no Relato) numa arquitetura única (Edge classifica report→tabela→card), trocada só pelo MAPA. Verticalização rim↔cannabis. Lição keyword-subconta-semântico."
metadata: 
  node_type: memory
  type: project
  originSessionId: 1263b294-4cef-462a-a85f-f95c21d808df
---

**07/06 — o app ganhou 4 SIDECARS COGNITIVOS reais num dia**, todos na MESMA arquitetura provada, trocada só pelo MAPA de categorias. Verticalização empírica do eixo **rim (Ricardo/nefro) ↔ cannabis (núcleo do produto)**. Locks 8 intocados, zero regressão.

## A arquitetura única (reusável — "polir não inventar")
Edge (GPT-4o-mini classifica o **RELATÓRIO consolidado**, não o chat cru) → tabela `clinical_*` → card React (paginação `< >` + Ver no prontuário + aprovar/rejeitar + RLS por appointment OR admin). Pra criar um sidecar novo: **clonar + trocar o mapa + o domínio**. ~1 commit.

| Sidecar | Versão | Tabela | Domínios | Cor | Fonte de dado |
|---|---|---|---|---|---|
| Renal (DRC) | V1.9.307 | renal_inline_suggestions | eGFR/estágio | emerald | captation (1 caso real, Maria, retrofix manual) |
| Neuro | V1.9.611 | clinical_neuro_signals | TEA/TOD/TDAH/**EPILEPSIA** | roxo | report (passos+Gisele) |
| Sinais do Relato | V1.9.612 | clinical_reported_signals | DOR/SONO/ANSIEDADE | teal | report (4 casos) |
| Cannabis no Relato | V1.9.613 | clinical_cannabis_signals | VONTADE/USO/RECEIO | lime | report (~10 casos, 6 pacientes) |

**Fonte=report (decisão Pedro 07/06)**: 1:1 com a AEC, consent dado, sem o problema do `session_id` per-turno. Detalhes em [[project_neuro_signal_extractor_v1_9_611_fase_d_07_06]].

## FILOSOFIA cravada (Pedro): não é "indicação"/"sugestão" do app
O paciente FALA (vontade/sintoma/uso); o app ESCUTA e REPASSA ao médico (paciente→app→pro). **MIMRE / relato espontâneo.** Z2: sinaliza, NÃO decide/prescreve. Por isso "Sinais do Relato" e "Cannabis no Relato" (não "Indicações"). Linguagem auditor-safe até no schema (COMMENT nas tabelas).

## 🧠 LIÇÃO META DA NOITE — keyword subconta o semântico (recorrente)
Quase parquei o "Cannabis no Relato" porque um **probe de keyword** deu `intencao=1 / uso=2 / medo=0` → conclui "dado fino". **Pedro discordou** ("é a vontade do paciente trazida na fala, sem card some, e os que aderem = eficácia") e mandou rodar. O **GPT semântico achou sinais reais em ~6 pacientes** que o keyword não pegou (*"quero tomar cbd"*, *"substituir por algo mais natural"*, *"iniciei uso de CBD"*). **Mesma lição empírica do renal (V1.9.307 regex vs fala) e do PII (regex token-exato vs variante).** Going-forward: **pra medir abundância de sinal de FALA, rodar dry-run GPT numa amostra, NÃO confiar em ILIKE keyword** (subconta sistematicamente). O keyword serve pra triagem grossa, não pra decidir parquear.

## 🎯 Construir onde o DADO está (não onde o roadmap chutou)
Medição empírica nos 151 reports: **DOR 74% · ansiedade 40% · sono 38%** · endócrino 22% · **cardiovascular 3% (5 reports)**. Os placeholders que existiam (Cardiovascular/Endócrino) eram os slots **mais vazios** — eu ia construir sidecar pra dado inexistente (o "erro Cardiovascular"). Os 2 novos sidecars **substituíram** esses placeholders. **Princípio: medir frequência real antes de escolher o próximo vertical.**

## Fricção honesta (anti-padrão a evitar)
Pedro passou muito tempo sem ver o card neuro mudar — causa: o **gate `?neuro_real=1` faltando na URL** (cautela minha excessiva). Não era bug. **Removi o gate → default.** Going-forward: gate de preview só com razão clínica forte; senão default + feature-flag kill-switch já basta. (Os extractors têm flag OFF + são populados via seed manual; o card lê a tabela direto, sem flag.)

## Fase 2 parqueada (ângulo Pedro — eficácia)
Cruzar **Cannabis no Relato (VONTADE) → cfm_prescriptions** = *"quem falou que queria cannabis → aderiu (foi prescrito) → melhorou (report posterior)"*. Loop relato→tratamento→desfecho = card de **adesão/eficácia**, dado de pesquisa forte. Não construído (precisa decidir métrica de desfecho com Ricardo/Eduardo).

## How to apply
- Novo sidecar = clonar `report-signal-extractor` (Edge) + `ReportedSignalsCardReal` (card) + migration espelho, trocar mapa/domínio/cor/nome. Wire em ProfessionalMyDashboard linha ~960 (grid Sidecars Cognitivos).
- RLS sempre: prof SELECT+UPDATE (revisar via status) + admin ALL; Edge insere via service_role. report_id é **TEXT** (clinical_reports.id é text).
- Seed: flag ON → rodar Edge nos reports candidatos → flag OFF. Extractor auto-filtra (report sem sinal = 0, não dispara à toa).
- Commits: V1.9.611-F..I (neuro default+UX) · V1.9.612 (`2258842`) · V1.9.613 (`9ad81e4`). Push 4 refs.

Relacionado: [[project_neuro_signal_extractor_v1_9_611_fase_d_07_06]] · [[project_evidencia_corpus_cannabis_renal_06_06]] · [[feedback_compressao_estrutural_vs_abstracao_clinica_27_05]] (Z2) · [[reference_ricardo_valenca_bio_autoral_mimre_31_05]] (MIMRE).
