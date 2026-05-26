---
name: 4 camadas arquiteturais — fenomenológica → semântica → estrutural → longitudinal (decomposição validada)
description: GPT externo trouxe na reunião 4 sócios 26/05 decomposição em 4 camadas cognitivas do que MedCannLab faz empiricamente. Validada empíricamente — sidecar renal V1.9.307 + V1.9.456 + Matrix Z2 já implementam as 4 camadas. Coerente com `feedback_duas_vertentes_uma_matriz_epistemologica_constituicao_medcannlab_25_05` (mesmas 4 dimensões)
type: feedback
originSessionId: 4a984140-7091-42ce-a9d3-75298afef276
---
# 4 camadas — decomposição arquitetural validada empiricamente

**Rule**: Toda feature clínico-conversacional futura pode ser decomposta em 4 camadas — fenomenológica / semântica / estrutural / longitudinal. Decomposição **descreve** o que MedCannLab já faz empiricamente, NÃO é programa novo.

**Why**: GPT externo trouxe na reunião 4 sócios 26/05 essa decomposição. Triada empíricamente via princípios cristalizados: bate com `feedback_duas_vertentes_uma_matriz_epistemologica_constituicao_medcannlab_25_05` (mesmas 4 dimensões — escuta/fidelidade/honestidade/estrutura).

## As 4 camadas

### Camada 1 — Fenomenológica

**O que é**: paciente fala livremente, sem questionário, sem checkbox.

**Implementação empírica MedCannLab**:
- AEC FSM 10 etapas (Etapa 2 lista indiciária + Etapa 3 escolha queixa principal)
- Chat livre paciente (89.8% do uso — `feedback_chat_livre_dominante_vs_aec_minoria_24_05`)
- Verbatim First V1.9.86 (preserva fala literal em 46% bypass GPT)
- Princípio Ricardo: queixa preserva abertura fenomenológica (`feedback_queixa_nao_e_sintoma_aec_e_abertura_fenomenologica_24_05`)

### Camada 2 — Semântica

**O que é**: IA detecta sinais/contextos da fala — entidades clínicas, intensidade, recorrência, relações.

**Implementação empírica MedCannLab**:
- Edge `renal-signal-extractor` V1.9.307 (extrai creatinina/proteinúria da fala)
- Edge `extract-document-text` (OCR PDF)
- Sidecar TEA futuro (princípio cristalizado em `feedback_sidecar_tea_semantica_relacional_sujeito_frase_26_05` — sujeito da frase + referente)
- Detector V1.9.121 PromotionHint AEC (5 selos quíntuplos)

### Camada 3 — Estrutural

**O que é**: transforma fala em scores/KPIs/timelines/clusters auditáveis.

**Implementação empírica MedCannLab**:
- Tabela `clinical_kpis` (24 rows)
- Tabela `clinical_axes` (495 rows)
- Tabela `clinical_rationalities` (130 rows — 5 racionalidades coexistindo)
- `renal_exams` schema (V1.9.328 — proteinúria NUMERIC(8,2))
- Cards visuais ("Sugestões DRC Pendentes" — Maria das Dores 95% G3B)
- Pipeline pós-AEC: SCORES → REPORT → SIGNATURE → AXES → RATIONALITY → DONE

### Camada 4 — Longitudinal

**O que é**: cruza consultas / evolução / recorrência / resposta clínica ao longo do tempo.

**Implementação empírica MedCannLab**:
- Hook `usePatientLongitudinal` (V1.9.382 — NoaMatrixView)
- **V1.9.456 histórico observacional no modal de report (implementado 26/05)** — bloco com queixas cronológicas + padrão dominante + sintomas novos
- F3 Dossiê PDF persistido (V1.9.390+392 — `physician_research_dossiers`)
- Nôa Matrix Z2 (cruzar relatórios + PubMed + Base Conhecimento)
- F4 Fórum (debate longitudinal coletivo via `forum_posts` + dossiê fixado)

## Como usar essa decomposição

**1. Diagnóstico arquitetural**: ao avaliar feature nova, identificar em qual camada opera.
- Pergunta dirigida = quebra camada 1 (queixa preserva abertura)
- KPI inferido sem fala literal = quebra camada 2 (`feedback_locks_macro_vs_micro_matrix_alucinacao_completiva_25_05`)
- Score sem audit trail = quebra camada 3
- Snapshot sem histórico = quebra camada 4

**2. Roadmap**: features futuras se encaixam:
- Sidecar TEA = camada 2 (extração semântica) + camada 3 (KPI estrutural) + camada 4 (longitudinal)
- F4 Fórum publicação = camada 4 (longitudinal coletivo)
- BYO-LLM = camada 2 alternativa (mesma extração, modelo diferente)

**3. Comunicação institucional** (com lastro):
- *"plataforma que transforma narrativa clínica em estrutura longitudinal auditável"*
- Lastro empírico das 4 camadas: PAT via Maria das Dores (camadas 1-3) + V1.9.456 (camada 4)

## NÃO usar como overclaim institucional

GPT externo cunhou frases aspiracionais embaladas na decomposição:
- *"sistema longitudinal de fenotipagem clínica narrativa"* — NÃO
- *"infraestrutura cognitiva organizacional"* — NÃO

Decomposição em 4 camadas DESCREVE o que está sendo construído. Não vira selo institucional sem PAT cruzando (`feedback_doc_institucional_sem_pat_nao_e_valido_23_05`).

## Aplicabilidade futura

Toda feature clínica nova passa pelo filtro 4 camadas:
1. **Camada 1 preservada?** (queixa fenomenológica intocada)
2. **Camada 2 com lock micro?** (não inventar dado ausente)
3. **Camada 3 auditável?** (cada KPI rastreável à fala literal)
4. **Camada 4 sem fusão?** (cada caso é unidade narrativa separada)

## Cristalizado

Diário 26/05 (reunião 4 sócios). Análise GPT externo triada via `feedback_material_b_pode_contradizer_constituicao_22_05`. Decomposição validada por implementação empírica existente.
