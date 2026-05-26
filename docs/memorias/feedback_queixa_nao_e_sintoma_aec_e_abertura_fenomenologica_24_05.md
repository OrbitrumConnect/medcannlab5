---
name: Queixa ≠ Sintoma — AEC preserva abertura fenomenológica (princípio Ricardo pivotal)
description: 2 textos epistemológicos do Ricardo (madrugada + manhã 24/05) que cristalizaram o núcleo conceitual do método AEC. Anamnese clássica é centrífuga (sintoma → doença); AEC é centrípeta (indivíduo → eventualmente doença). Princípio Ricardo central da Constituição MedCannLab — vertente clínica
type: feedback
originSessionId: 4a984140-7091-42ce-a9d3-75298afef276
---
# Queixa ≠ Sintoma — princípio Ricardo pivotal (vertente clínica da Constituição)

**Rule**: AEC não é mecanismo de caça a doença — é organização narrativa do indivíduo. Toda feature de chat paciente deve preservar abertura fenomenológica antes de qualquer interpretação biomédica.

**Why** — 2 textos pivotais de Ricardo em 24/05/2026:

### Texto Ricardo #1 (madrugada 24/05, após análise GPT do caso prima dentista)

> *"Na medicina biomédica clássica: sintoma → síndrome → diagnóstico → doença. É uma lógica de redução nosológica."*
>
> *"Na AEC: a 'queixa' ou o 'motivo da procura' não serve primeiro para encontrar a doença. Ela serve para encontrar o indivíduo em situação clínica."*
>
> *"Sintoma já pressupõe enquadramento biomédico; queixa/motivo da procura preserva abertura fenomenológica."*
>
> *"AEC não parece ter sido construída para 'caçar doença'. Ela parece ter sido construída para organizar a entrada narrativa do sujeito no encontro clínico. A doença pode aparecer depois — mas não é o ponto de partida obrigatório."*
>
> *"A crítica correta ao caso da prima talvez seja: NÃO 'a AEC só funciona para sintoma'. MAS 'a camada operacional posterior reduziu indevidamente o motivo da procura a sintoma patológico'."*

### Texto Ricardo #2 (manhã 24/05, após análise V1.9.443)

> *"O framework que orienta a elaboração das perguntas é exatamente o que estamos discutindo. O framework coloca as perguntas na boca do profissional. Busca por sintomas e sinais de doenças, ao invés de busca por sinais e sintomas do indivíduo seja saudável ou não."*

## Inversão epistemológica explícita

| Anamnese clássica (centrífuga) | AEC (centrípeta) |
|---|---|
| Framework na **boca do profissional** | Framework na **boca do indivíduo** |
| Perguntas dirigidas | Indivíduo se apresenta primeiro |
| Busca = sinais/sintomas **de doenças** | Busca = sinais/sintomas **do indivíduo (saudável ou não)** |
| Pressupõe doença a encontrar | Pressupõe indivíduo existente |
| Direção: doença → sujeito | Direção: sujeito → (eventualmente) doença |
| Sujeito = paciente passivo | Sujeito = indivíduo ativo |

## Aplicação técnica imediata: V1.9.443+A+B PATIENT_FREE_CHAT_GUARDRAILS

Resposta canônica V3 lapidada por Ricardo (4 famílias):

> *"Antes de pensar em produto, me conta um pouco: o que te trouxe a procurar CBD para dormir? Há quanto tempo o sono está te incomodando? O que mudou ultimamente?*
>
> *Pergunto porque sua história importa antes da escolha de qualquer produto. Qual CBD usar, em que dose ou de qual marca é uma decisão do médico prescritor depois de te ouvir. Mas posso te ajudar a organizar essa história agora para que ela chegue ao profissional de forma mais clara. Quer começar?"*

Não recusa, não nega — **devolve à escuta fenomenológica**.

## Mudanças Ricardo de V2→V3 (lapidação)

1. *"falar de produto"* → *"pensar em produto"* (menos vendedor, mais clínico)
2. 4 perguntas → **3** (removeu "já tentou outras coisas" — densidade)
3. *"ela vai pro médico estruturada"* → *"ela chegue ao profissional de forma mais clara"* (mais sóbrio)
4. Travessões removidos (mais natural)

## Cláusula de precedência (anti-confusão)

Ricardo selo:
> *"Não. Pelo que está escrito aí, você não aprovou 'mudança de perguntas' da AEC. Você aprovou uma resposta canônica de segurança para chat livre sobre CBD, fora do fluxo formal da Avaliação Clínica Inicial."*

V1.9.443 NÃO é mudança em pergunta nenhuma da AEC — é guardrail em chat livre paciente.

## Onde a inversão se perde (gaps identificados)

1. Chat livre paciente fora-FSM (`assessmentPhase='none'`) — CLINICAL_PROMPT não tinha proibição anti-recomendação farmacológica → resolvido V1.9.443+A+B
2. Camada posterior pós-AEC — pipeline de scoring/racionalidades transforma queixa em "sintoma patológico" downstream (caso prima dentista 23/05) → identificado, parqueado

## Conexão meta-arquitetural

Este princípio é a **vertente clínica** da Constituição MedCannLab. A vertente **pesquisa** equivalente é `feedback_locks_macro_vs_micro_matrix_alucinacao_completiva_25_05` ("sustentar lacuna sem colapsar"). Os 2 são a MESMA epistemologia aplicada a domínios diferentes — `feedback_duas_vertentes_uma_matriz_epistemologica_constituicao_medcannlab_25_05` (meta-memória).

**How to apply**:
- Toda feature de chat paciente passa pelo filtro: preserva abertura fenomenológica?
- Antes de prescrever, ouvir. Antes de orientar produto, perguntar contexto.
- "A demanda não é negada — é recolocada no campo da escuta" (frase âncora Ricardo lapidação V2→V3).
- Aplicável a TODO design futuro de feature que toque escuta paciente.

## Cristalizado

Diário 24/05 BLOCO R + Retrospectiva mensal Princípio 1 (Seção 5.1) + Bloco P meta-arquitetural. Princípio Ricardo MAIS pivotal do mês.
