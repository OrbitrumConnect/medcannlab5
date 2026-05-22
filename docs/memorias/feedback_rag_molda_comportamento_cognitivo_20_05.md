---
name: RAG molda comportamento cognitivo — princípio empírico V1.9.308→318→Sprint1
description: Princípio arquitetural cristalizado 20/05/2026 após audit Sprint 1 que QUASE re-introduziu o bug que V1.9.318 reverteu. RAG não é só banco de conhecimento — engrossar corpus altera prior implícita do GPT sobre intenção do usuário.
type: feedback
originSessionId: 6742fef8-9d20-43d8-a8d8-8853df0c89e9
---
## A regra

**RAG não é só banco de conhecimento. RAG molda comportamento cognitivo do sistema.**

Engrossar `base_conhecimento` com docs brutos altera a prior implícita do modelo sobre **intenção do usuário**. Mesmas queries clínicas começam a ser interpretadas como queries documentais.

## Why
Empírico cristalizado pela sequência V1.9.308 → V1.9.318 → Sprint 1 (20/05):

- **V1.9.308 (16/05)**: adicionou busca paralela em `public.documents` (44 PDFs científicos) ao bloco RAG do Edge `tradevision-core`. Intent era enriquecer respostas com referências.
- **Resultado empírico**: GPT passou a interpretar "analise este relatório" como "ele quer ver documentos" → emitia `[DOCUMENT_LIST]` e devolvia lista de PDFs em vez de raciocínio clínico.
- **Métrica**: 1 caso isolado em 16+ dias ANTES → 6 casos em 21h DEPOIS.
- **V1.9.318 (17/05)**: revert empírico. Voltou ao bloco RAG simples (só `base_conhecimento` com 5 entries hand-crafted curadas).
- **20/05 audit Sprint 1**: Claude propôs migrar 33 docs de `documents` → `base_conhecimento` ("salto quantitativo RAG 5→35"). Pedro perguntou "não tem regressão?". Claude verificou código, **descobriu o comentário V1.9.318 no Edge**, abortou plano antes de executar.

Lição: aprendizado cristalizado em código (comentário de revert) é defesa anti-regressão. Auditar antes de migrar é obrigatório.

## How to apply

Antes de qualquer mudança que adicione conteúdo ao RAG (`base_conhecimento`):

1. **Leu V1.9.318?** Comentário no Edge tradevision-core linha ~4815-4822 documenta o bug.
2. **Doc tem >50k chars?** Vai estourar TOKEN MGMT V1.9.61 (60k cap). Truncar `LEFT(content, 8000)` se for migrar.
3. **Conteúdo bruto ou curado?** Bruto = papers PDF/DOCX → altera prior do GPT. Curado = entry hand-crafted como `noa_identidade` → seguro.
4. **Trigger empírico ocorreu?** Médico reclamou de RAG raso? Ou é salto especulativo?
5. **Boundary explícita?** Se for expandir, usar `base_conhecimento_pesquisa` (Opção B parqueada), não mesma tabela.

## As 5 entries hand-crafted são proteção, não limitação

```
noa_identidade     — identidade da Nôa Esperanza
metodologia_aec    — Arte da Entrevista Clínica
sistema_imre       — Sistema IMRE Triaxial
kb-curso-aec       — Sobre o Curso AEC
kb-protocolo-cbd   — Critérios Prescrição CBD
```

Todas escritas DIRETAMENTE como KB entries (não vieram de PDFs upload). Tamanhos compactos (~100-500 chars). Edge faz `.or(queryFilters).limit(3)` — só 3 entram no prompt por turno. **Comportamento previsível, intenção do usuário preservada**.

## Lacuna empírica documents (41) vs base_conhecimento (5)

- **UI Base de Conhecimento** mostra 41 docs (lê `public.documents`)
- **Nôa no chat** cita só 5 docs (RAG real lê `public.base_conhecimento`)
- **Lacuna é POR DESIGN, não bug** (V1.9.318)

Pedro descobriu empíricamente: pediu Nôa citar docs no chat → 5. Foi pra UI Base Conhecimento → 41. Hipótese inicial: "salto quantitativo seria conectar essas fontes". Audit revelou: conexão direta REINTRODUZ bug V1.9.318.

## Gatilho futuro pra expandir RAG (Opção B parqueada)

NÃO antes de:
- Beta 20-30 mostrar feedback empírico ("RAG raso")
- Matrix Z2 estabilizar comportamento atual
- Médico não-Pedro pedir explicitamente

Quando vier o gatilho:
- Criar `base_conhecimento_pesquisa` (tabela separada)
- Edge tradevision-core em `isResearchMode` faz UNION das 2 fontes
- Chat clínico NÃO toca a tabela nova (boundary explícita)
- Truncar conteúdo grande no INSERT (`LEFT(content, 8000)`)

## Anti-padrões cristalizados

- ❌ **Migrar `documents.content` em massa pra `base_conhecimento`** — reintroduz V1.9.308 bug
- ❌ **"Engrossar RAG melhora respostas"** — empíricamente FALSO. Engrossar muda prior do GPT.
- ❌ **Tratar UI Base Conhecimento (41) como fonte RAG real** — fonte RAG é `base_conhecimento` (5)
- ❌ **Inserir doc >50k chars sem truncar** — estoura TOKEN MGMT V1.9.61
- ❌ **Adicionar branching condicional dentro do Edge** (Opção A) — começa elegante, vira branching crescente
- ❌ **Mexer em RAG durante beta 20-30** — enviesa dados de medição comportamental

## Conexão com outros princípios

- `feedback_state_pollution_noa_core_reutilizado_19_05` — boundaries explícitos protegem mais que tipos elegantes condicionais
- `feedback_z2_nao_e_burrice_voz_intelectual_19_05` — Matrix Z2 e chat clínico têm comportamentos cognitivos diferentes
- `feedback_coerencia_e_alinhamento_qualquer_fix_17_05` — 6 perguntas antes de mexer (auditar V1.9.318 é parte do checklist)
- `feedback_polir_nao_inventar` — manter as 5 entries hand-crafted, não criar paralelo
- `feedback_regra_operacional_canonica_06_05` — tier 1 escalada controlada → não mexer durante beta

## Frase âncora

> *"RAG não é só banco de conhecimento. RAG molda comportamento cognitivo do sistema. Engrossar corpus muda o que o GPT acha que o usuário quer."*

— Pedro + Claude + GPT externo (calibração) 20/05/2026 ~13h BRT, após Sprint 1 audit quase-regressão V1.9.308

## Histórico de quase-regressão (rastreabilidade)

1. Pedro 20/05 ~11h50: autorizou Sprint 1 limpezas rápidas
2. Claude rodou audits empíricos via Management API
3. Descobriu lacuna 41 (UI documents) vs 5 (RAG base_conhecimento)
4. Propôs "salto quantitativo": migrar 33 docs → base_conhecimento
5. Pedro perguntou: "da bom? nao tem regressao e o correto ne?"
6. Claude verificou código Edge → leu comentário V1.9.318 → ABORTOU plano
7. GPT externo calibrou: separação V1.9.318 é design intencional, B > A > C
8. Decisão: Opção C agora (não mexer) + Opção B parqueada (gatilho futuro)
9. Documentação anti-regressão: CLAUDE.md + esta memory
