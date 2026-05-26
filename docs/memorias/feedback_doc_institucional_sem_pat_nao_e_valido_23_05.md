---
name: Doc institucional sem PAT cruzar não é válido (princípio Ricardo 23/05)
description: Ricardo cristalizou em 23/05 10h11 BRT no grupo WhatsApp dos sócios — "Qualquer documento institucional (pitch/ebook/slide/manifesto/parceria) escrito por qualquer pessoa (sócio, IA externa, designer) sem cruzamento PAT contra realidade do banco = overclaim em construção. Quem não cruza com PAT cria dívida pra quem vai cruzar depois". Adotado como regra compartilhada do time
type: feedback
originSessionId: 4a984140-7091-42ce-a9d3-75298afef276
---
# Doc institucional sem PAT cruzar não é válido

**Rule**: Qualquer documento institucional (pitch / ebook / slide / manifesto / parceria) escrito por qualquer pessoa (sócio, IA externa, designer) sem cruzamento via PAT (Personal Access Token Supabase Management API) contra realidade do banco = overclaim em construção.

**Why** — Princípio cristalizado por Ricardo em 23/05/2026 ~10h11 BRT no grupo WhatsApp dos sócios, em resposta a tensão semântica sobre pitch MUHDO. Sócios debatendo se um texto institucional escrito por um deles + GPT externo + designer estava "honesto" ou "inflado".

**Frase âncora Ricardo**:
> *"Quem não cruza com PAT cria dívida pra quem vai cruzar depois."*

**Adoção**: Ricardo confirmou (*"já é sua opinião"*) — virou regra compartilhada do time. **Aplicada dezenas de vezes nos 30 dias seguintes**.

## Por que esse princípio é poderoso (e raro)

Material institucional tende a inflar — é a natureza do gênero. Sócios, GPT externo, designers, qualquer um cria com lente narrativa, não empírica. PAT cruzar = comparar a narrativa contra rows reais no Supabase. Discrepância flagada = overclaim documentado, não passado.

## Aplicações concretas no mês

1. **14 iterações do "parágrafo institucional v5→v14 final definitivo"** (28-29/04) foram **descontinuadas implicitamente** quando princípio anti-overclaim cristalizou em 28/04 e Material A passou a exigir PAT cruzando
2. **Cada nova métrica em dashboard** precisou ser cruzada com PAT antes de virar fato institucional
3. **Retrospectiva mensal V3** (2338 linhas) tem PAT empírico em TODOS os números (Seção 2)
4. **Cada parecer GPT externo** (4 aparições no mês) triado contra PAT empírico antes de aceito como insight
5. **Deck Onboarding Profissional v1.0** com 22 abas grep-validadas (não chutadas)
6. **Brandbook V3 stats footer** corrigidos contra PAT (*"46% bypass LLM"* → *"46,2%"*; *"28 BLOCOS MODULARES"* removido por não-rastreável)

## Parente direto

`feedback_material_b_pode_contradizer_constituicao_22_05` — mas aplicado a Material A institucional dos próprios sócios (mais difícil triar emocionalmente).

## Variáveis derivadas

- Pitch institucional sem PAT → não publicar
- Slide de parceria sem PAT → não enviar
- Ebook técnico sem PAT → não publicar
- Frase elogiosa GPT externo NÃO vira material institucional sem PAT cruzando
- Métrica em dashboard SEM count exato no PostgREST = potencialmente falsa (cf. `feedback_postgrest_max_rows_1000_silencioso_22_05`)

## Aplicabilidade futura

**Marcos pra que frases aspiracionais virem "fato"**:
- V1.9.451+452 deployados
- Marco 1 (CNPJ João Vidal)
- Marco 2 (2º médico independente)
- 20-30 pacientes externos pagantes
- Auditoria CFM/ANVISA real

Sem esses, NENHUMA frase elogiosa GPT externo entra em material institucional. Lista de frases vigiadas em `feedback_anti_overclaim_endorsements`.

**How to apply**:
- Antes de enviar QUALQUER texto pra parceiro/cliente/investidor: cruzar via PAT cada claim numérico/quantitativo
- Antes de publicar landing/pitch/ebook: PAT empírico em cada métrica
- GPT externo cunha frase elogiosa? Trata como aspiração até PAT confirmar
- Ricardo cita esse princípio em discussões = enforce
- Padrão de honestidade institucional pré-PMF

## Cristalizado

Diário 23/05 BLOCO G (manhã, grupo WhatsApp sócios) + Retrospectiva mensal Princípio 6 (Seção 5.2). Princípio Ricardo aplicado dezenas de vezes no mês — define cultura institucional do projeto pré-PMF.
