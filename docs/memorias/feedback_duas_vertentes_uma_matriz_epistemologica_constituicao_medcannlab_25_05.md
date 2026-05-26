---
name: Constituição MedCannLab = 2 vertentes da mesma matriz epistemológica Ricardo (META)
description: Meta-princípio que conecta 24/05 (chat paciente "queixa ≠ sintoma") + 25/05 (Matrix Z2 "sustentar lacuna sem colapsar"). Os 2 são manifestações da MESMA epistemologia aplicada a domínios diferentes. Framework pra TODA feature clínico-conversacional futura
type: feedback
originSessionId: 4a984140-7091-42ce-a9d3-75298afef276
---
# Constituição MedCannLab = 2 vertentes da mesma matriz epistemológica

**Rule**: Toda feature clínico-conversacional futura precisa passar pelos 4 eixos epistemológicos comuns. Se viola algum, NÃO codar.

**Why**: Conexão profunda descoberta nas sessões consecutivas 24/05 + 25/05 (cristalizada em diário 25/05 BLOCO P).

## Os 4 eixos comuns (a MESMA matriz)

| # | Eixo | Chat paciente (AEC + chat livre) | Matrix profissional (Z2) |
|---|---|---|---|
| 1 | **Escuta sobre interpretação** | Ouvir queixa antes de propor diagnóstico | Ler corpus antes de sintetizar |
| 2 | **Fidelidade sobre completude** | Queixa em primeira pessoa preservada literal | Citar literal o que está no corpus |
| 3 | **Honestidade sobre utilidade percebida** | "Não posso recomendar produto" > parecer útil ao paciente leigo | "Lacuna observacional" > parecer útil ao médico |
| 4 | **Estrutura sobre síntese** | Protocolo AEC 10 etapas literais | Cada caso/data é unidade narrativa separada |

## Vertente Clínica (24/05) — "Queixa ≠ Sintoma"

Princípio Ricardo cristalizado em 2 textos (`feedback_queixa_nao_e_sintoma_aec_e_abertura_fenomenologica_24_05`):

> *"Na medicina biomédica clássica: sintoma → síndrome → diagnóstico → doença. Lógica de redução nosológica. Na AEC: 'queixa/motivo da procura' não serve primeiro para encontrar a doença. Serve para encontrar o indivíduo em situação clínica. Sintoma já pressupõe enquadramento biomédico; queixa preserva abertura fenomenológica. AEC não foi construída para 'caçar doença'. Foi construída para organizar a entrada narrativa do sujeito no encontro clínico."*

Aplicação técnica: V1.9.443+A+B PATIENT_FREE_CHAT_GUARDRAILS (4 famílias produto/educacional/jornada/iniciar tratamento). Resposta canônica V3 lapidada por Ricardo NÃO recusa, NÃO nega — **devolve à escuta fenomenológica**.

## Vertente Pesquisa (25/05) — "Sustentar lacuna sem colapsar"

Princípio Z2 estrutural cristalizado pós-bug Matrix alucinou 6 dados (`feedback_locks_macro_vs_micro_matrix_alucinacao_completiva_25_05`):

> *"Sustentar lacuna sem colapsar = diferencial Z2 do produto. Honestidade epistemológica > parecer útil. Lacuna explícita é COMPORTAMENTO DESEJADO, NÃO falha."*

Aplicação técnica: V1.9.450+450-B (corpus expandido pseudonimizado) + V1.9.453+A+B (anti-alucinação + taxonomia 3 cenários + negação explícita).

## Por que isso é meta-princípio (não detalhe)

**Esses 2 princípios NÃO são features separadas — são a MESMA epistemologia Ricardo aplicada a domínios diferentes** (chat paciente vs Matrix profissional). A inversão comum:

| Anamnese clássica (centrífuga) | Framework AEC + Matrix Z2 (centrípeto) |
|---|---|
| Framework na boca do profissional | Framework na boca do indivíduo (paciente) ou no corpus marcado (médico) |
| Perguntas dirigidas a buscar doenças | Indivíduo se apresenta primeiro / corpus é fonte primária |
| Busca = sinais/sintomas de doenças | Busca = sinais/sintomas do indivíduo / do que está literalmente no corpus |
| Pressupõe doença a encontrar | Pressupõe indivíduo existente / corpus marcado como verdade |
| Direção: doença → sujeito | Direção: sujeito → (eventualmente) doença |
| Sujeito = paciente passivo | Sujeito = indivíduo ativo / médico curador |
| LLM optimizando "coerência narrativa" | LLM optimizando "fidelidade ao escutado/lido" |

## How to apply

**Filtro obrigatório pra TODA feature clínico-conversacional futura — 4 perguntas**:

1. **Escuta**: a feature ouve antes de interpretar? Ou pula direto pra interpretação?
2. **Fidelidade**: preserva literal o que paciente disse / corpus contém? Ou parafraseia/sintetiza prematuramente?
3. **Honestidade**: aceita lacuna/recusa quando apropriado? Ou tenta sempre parecer útil?
4. **Estrutura**: organiza em unidades narrativas separadas? Ou funde tudo em síntese contínua?

Se qualquer eixo é violado, NÃO codar até resolver. Se 2+ são violados, é redesign, não fix.

## Aplicabilidade futura

Esse framework deve guiar:
- Toda nova feature chat paciente (novos guardrails familias C/D/E parqueados)
- Toda nova feature Matrix profissional (V1.9.460+ polish UX, function calling, etc)
- Features de F4 Fórum (citação de casos, comentários conselho)
- Features F3 dossiê (V2 estendida)
- Qualquer feature que envolva LLM tocando dado clínico

## Conexão com GPT externo

GPT externo (mês 04-05/2026) cunhou frases captando essa direção (com calibração anti-overclaim):
- *"arquitetura madura"* — frase aspiracional
- *"clinical conversational governance"* — destino, não estado
- *"maturação simultânea chat paciente + chat profissional"* — captura algo real

**Nenhuma usada em material institucional** sem PAT cruzando empíricamente. Cristalizado em `feedback_anti_overclaim_endorsements`.

## Cristalizado

Diário 25/05 BLOCO P + retrospectiva mensal Princípio 5 + retrospectiva Anexo 5 (genealogia epistemológica). **Meta-memória central do mês** — referência primária pra próxima sessão Claude entender Constituição.
