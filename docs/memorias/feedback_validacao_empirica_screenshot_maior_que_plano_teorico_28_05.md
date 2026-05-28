---
name: validacao-empirica-screenshot-maior-que-plano-teorico-28-05
description: "PRINCÍPIO META cristalizado empíricamente via 5 iterações Card Neuro/Renal noite 27→28/05: ANTES de codar refatoração técnica, validar EMPIRICAMENTE (via screenshot ou execução real) que ela melhora o estado atual. Plano teórico apresentado verbalmente (mesmo com confiança técnica + autorização explícita 'go') pode resultar em REGRESSÃO se estado atual já entrega valor que refator destrói. 5 manifestações empíricas: V1.9.475-A regrediu Renal espremido / V1.9.475-C 5/5 PASS declarado mas Pedro mandou dossiê 5 violações reais / V1.9.475-D plano elegante mas screenshot mostrou perda visual (voltei atrás antes de codar) / V1.9.476 regrediu Renal de novo / V1.9.476-A grid 2-col regrediu ordem Pedro rejeitou. Aplica-se a TODA refatoração futura — especialmente quando plano parece elegante mas estado atual já entrega valor visual/funcional."
metadata:
  node_type: memory
  type: feedback
  originSessionId: 00be2b9f-5dbc-4236-a02e-1459c3f57bd2
---

# 🎯 Validação Empírica via Screenshot > Plano Teórico — princípio meta (28/05 madrugada)

## Contexto empírico

Sessão Claude desktop 27/05 noite → 28/05 madrugada (~21h → 01h15) produziu 5 iterações do Card Neuro/Renal evoluindo Container "Sidecars Cognitivos". Cada iteração foi planejada teoricamente, autorizada por Pedro com `go` explícito, codada com confiança técnica, e VALIDADA empíricamente via screenshot.

**5 das 5 iterações** revelaram inconsistências visuais que SÓ apareceram quando renderizadas em produção (Vercel deploy). Validação via screenshot capturou cada bug ANTES de cristalizar como "feature finalizada".

## Princípio meta cristalizado

> *"ANTES de codar refatoração, validar empíricamente (via screenshot ou execução real) que ela melhora o estado atual. Plano teórico apresentado verbalmente pode parecer elegante mas resultar em regressão visual/funcional. Estado atual pode já entregar valor que refator destrói."*

## 5 manifestações empíricas (todas na mesma sessão)

### Manifestação 1 — V1.9.475-A: side-by-side 2-col regrediu Renal
- **Plano**: replicar pattern Renal grid 5-col → 2-col grid externo
- **Execução**: deploy + screenshot Pedro
- **Empírico**: Card Renal interno 5-col QUEBROU em col estreita 2-col (~480px)
- **Resultado**: revertido em V1.9.475-B

### Manifestação 2 — V1.9.475-C: 5/5 PASS declarado mas FAIL conversação prolongada
- **Plano**: smoke 5/5 PASS armadilha curta → declarei "ativo final"
- **Execução**: Pedro mandou dossiê PDF 9 páginas (10:48 BRT) com Matrix Z2 prolongada
- **Empírico**: 5 violações documentadas turnos 6-9 (alucinação Caso #3 inexistente + Qualidade do Sono inventada + placeholders regrediram + abstração clínica parkour + drift farmacológico CBD)
- **Resultado**: V1.9.468-B criado (6 fixes anti-drift conversacional)

### Manifestação 3 — V1.9.475-D: plano elegante mas screenshot pediu parqueamento
- **Plano**: refatorar Card Neuro pra replicar pattern Renal EXATO (grid responsivo 1→5 cols + paginação + card-paciente unitário + modal expandido)
- **Pedro autorizou** `go` baseado em descrição verbal
- **ANTES de codar**: Pedro mandou screenshot do V1.9.475-C atual + mensagem "veja"
- **Empírico**: análise revelou que V1.9.475-D PERDERIA valor visual (1 paciente único em grid 5-cols = espaço vazio + 4 sinais escondidos em modal)
- **Voltei atrás antes de codar** — recomendei "mantém C parquea D"
- **Resultado**: V1.9.475-D parqueado em memory + Pedro confirmou

### Manifestação 4 — V1.9.476: container 4-col regrediu Renal de novo
- **Plano**: container "Sidecars Cognitivos" + grid 4-col + 2 slots futuros
- **Execução**: deploy + screenshot Pedro
- **Empírico**: Card Renal espremido em col ~352-400px (grid 5-col interno quebra)
- **Resultado**: V1.9.476-A tentativa fix

### Manifestação 5 — V1.9.476-A: grid 2-col regrediu ordem Pedro rejeitou
- **Plano**: reduzir grid externo de 4-col → 2-col pra Renal caber (~480px)
- **Execução**: deploy + screenshot Pedro
- **Empírico**: Pedro disse explicitamente *"oq vc fez ficou ruim voltar como estava! ordem tava boa"*
- **Resultado**: V1.9.477 final — voltou grid 4-col + adicionou prop `compact` no Renal (~10 linhas cirúrgicas)

## Solução cirúrgica final (V1.9.477)

Após 4 falhas, o ponto cirúrgico foi a **mudança menor**:

```tsx
// RenalSuggestionsCard.tsx — prop opcional compact
interface RenalSuggestionsCardProps {
  compact?: boolean
}

// Linha 223:
<div className={compact
  ? "grid grid-cols-1 gap-3"  // compact: 1 col
  : "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5 gap-3"
}>
```

**~10 linhas mudadas**. Zero regressão pra callers existentes. Renal V1.9.309 lock preservado via prop opcional.

A solução "menor" venceu as 4 tentativas de solução "elegante" maior.

## Como aplicar esse princípio em decisões futuras

### Checklist antes de codar refatoração

1. ✅ **Quantos pixels/funcionalidades o estado atual já entrega visualmente?**
2. ✅ **A refatoração proposta vai PRESERVAR ou DESTRUIR esses pixels/valor?**
3. ✅ **Existe pelo menos 1 screenshot/execução real do estado atual antes de codar?**
4. ✅ **Solução cirúrgica (1-10 linhas) foi explorada antes da elegante (50+ linhas)?**
5. ✅ **Trigger empírico real existe pra justificar refator? (não apenas "parece elegante")**

### Anti-padrão a vigiar

- ❌ Apresentar refator complexo com confiança técnica + autorização `go` rápida sem screenshot validação
- ❌ Codar refator antes de visualizar estado atual renderizado
- ❌ Acreditar que "elegante" no plano = "melhor visualmente"
- ❌ Ignorar princípio "polir-não-inventar" em troca de "pattern espelhado puro"

### Pattern correto

- ✅ Apresentar opções (cirúrgica vs elegante)
- ✅ Recomendar opção CIRÚRGICA primeiro (mesmo se menos "bonita" arquiteturalmente)
- ✅ Validar empíricamente após CADA deploy via screenshot
- ✅ Voltar atrás se screenshot expor regressão (mesmo sem usuário pedir)

## Conexões com princípios cristalizados

- [[feedback_engenharia_perfeita_pode_produzir_semanticamente_inadequado_24_05]] — pipeline tecnicamente perfeito pode ser semanticamente inadequado
- [[feedback_polir_nao_inventar]] — solução mínima vs reescrita grande
- [[project_v1_9_475_D_card_neuro_pattern_renal_parqueado_27_05]] — exemplo empírico desse princípio aplicado (refator parqueado antes de codar)
- [[feedback_anti_overclaim]] — não declarar "feature finalizada" antes de smoke real

## Frase âncora

> *"Plano teórico elegante apresentado verbalmente + autorização rápida `go` ≠ refatoração que vale a pena. Validação empírica via screenshot/execução real é o filtro final que captura o que descrição verbal esconde. Solução cirúrgica menor frequentemente vence solução elegante maior."*

## Próxima sessão Claude

**Ler ESTA memory ANTES** de:
- Refatorar qualquer componente visual
- Aceitar `go` de Pedro pra refator técnico complexo
- Acreditar que "pattern espelhado" é automaticamente melhor

**Princípio aplicável**: pergunte SEMPRE *"existe screenshot do estado atual? Refator vai preservar ou destruir valor visível?"* ANTES de codar.
