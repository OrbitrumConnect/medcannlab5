---
name: Locks MACRO vs MICRO + paradoxo corpus rico ↔ drift inferencial + taxonomia 3 cenários
description: Bug paradigmático Matrix Z2 alucinou 6 dados clínicos inexistentes pós-V1.9.450 (corpus expandido). Solução dual V1.9.450-B (reduz PRESSÃO) + V1.9.453+A+B (reduz PERMISSÃO via taxonomia semântica 3 cenários + negação ≠ ausência)
type: feedback
originSessionId: 4a984140-7091-42ce-a9d3-75298afef276
---
# Locks MACRO vs MICRO devem ser EXPLÍCITOS

**Rule**: Codificar locks macro-clínicos ("não posso diagnosticar/prescrever/sugerir conduta") **NÃO impede** alucinação micro-factual ("inventar dado clínico ausente"). Em healthtech regulado, AMBOS os locks precisam ser EXPLÍCITOS no prompt — locks macro são óbvios e geralmente codificados primeiro; locks micro são gap arquitetural sutil que aparece quando corpus expande ou pressão conversacional aumenta.

**Why**: 25/05 ~14h BRT, smoke V1.9.450 (corpus expandido pseudonimizado) com Pedro Paciente teste (UUID `d5e01ead`). Matrix respondeu 6 dados específicos detalhados:
- *"27/04: mãe faleceu câncer de mama"*
- *"07/05: pai tem diabetes"*
- *"27/04: fuma 10 cigarros/dia"*
- *"07/05: consome álcool socialmente"*
- *"27/04: Paracetamol pra febre"*
- *"07/05: Ibuprofeno pra dor no pé"*

**PAT confirmou cirurgicamente**: NENHUM dos 6 dados existe em `clinical_rationalities` (12/12 verificadas) NEM em `clinical_reports` (5 selecionados). **Pura invenção LLM.**

Diagnóstico arquitetural meta:
- Locks MACRO-clínicos funcionavam ✅ ("não posso diagnosticar" — Matrix recusou "qual diagnóstico provável?" com *"essa é uma decisão clínica sua — eu não atravesso essa linha"*)
- Locks MICRO-FACTUAIS NÃO existiam ❌ ("não posso completar dado ausente")
- Resultado: *"plausibilidade clínica genérica mascarada de memória longitudinal"* (conceito GPT externo, incorporado)

**Paradoxo descoberto**: quanto MAIS contexto disponível ao LLM (V1.9.450 expandiu corpus), MAIS pressão pra continuidade narrativa = MAIS drift. Anti-padrão clássico LLM: otimizou *"coerência narrativa percebida"*.

## Solução DUAL (par complementar)

| Versão | O que faz | Como reduz drift |
|---|---|---|
| **V1.9.450-B** | Estende corpus expandido também pra `longitudinal.reports` (path automático Terminal → Paciente) | Reduz **PRESSÃO** inferencial — corpus tem dados → menos motivo pra alucinar |
| **V1.9.453** | Lock micro-factual codificado no RESEARCH_PROMPT (~60 linhas) | Reduz **PERMISSÃO** inferencial — mesmo sem dados, PROIBIDO alucinar |
| **V1.9.453-A** | Taxonomia explícita 3 cenários (ausência total / presença parcial / cobertura completa) | Anti-conservadorismo binário — modo binário omitia presença parcial real |
| **V1.9.453-B** | Negação explícita ≠ campo ausente (*"alergias: não"* é Cenário B, não A) | Anti-conservadorismo semântico — anamnese clínica registra "ausência negada" como dado positivo |

## Princípios codificados V1.9.453

1. *"DIFERENCIAL Z2: Sustentar lacuna sem colapsar"*
2. Fórmula canônica lacuna observacional
3. **Inversão reward direction**: *"Lacuna explícita é COMPORTAMENTO DESEJADO, NÃO falha"*
4. Anti-drift por pressão conversacional: *"5 perguntas seguidas exploram seção ausente → 5 respostas 'lacuna observacional' sem suavizar"*
5. 2 exemplos PROIBIDOS literais (os 6 dados inventados) documentados pra próxima sessão Claude

## Taxonomia semântica V1.9.453-A (anti-conservadorismo binário)

| Cenário | Quando | Fórmula |
|---|---|---|
| **A — Ausência total** | Zero menção em qualquer card | *"Esses dados não aparecem no corpus marcado. Lacuna observacional..."* |
| **B — Presença parcial** (NOVO) | 1+ menção literal, escopo limitado | *"Há menção pontual no Caso #X (data): '[citação literal]'. É a única informação sobre [seção] no corpus marcado. Para cobertura completa, marque cards adicionais."* |
| **C — Cobertura completa** | Múltiplas menções estruturadas | Estrutura por caso/data com pseudonimização e citação literal sem interpolar |

**Regra meta**: ANTES de declarar lacuna, BUSCAR EXAUSTIVAMENTE em todos os cards.

## Negação explícita V1.9.453-B

- Campo presente com valor positivo (*"alergia X"*) → Cenário B
- Campo presente com valor negativo (*"não"* / *"nenhuma"* / *"nega"* / *"sem"*) → **Cenário B** (não A)
- Campo ausente (zero menção da seção em qualquer card) → Cenário A genuíno

**Princípio**: Negação explícita é INFORMAÇÃO CLÍNICA POSITIVA (paciente foi perguntado e respondeu). Tratar como ausência = perder dado clínico literal.

**How to apply**:
- TODO guardrail clínico-conversacional futuro precisa AMBOS locks (macro + micro).
- ANTES de implementar locks, mapear se há gap micro escondido (corpus expandido = trigger).
- ANTES de codificar fórmulas binárias, perguntar: o espaço semântico clínico tem 3+ estados naturais? Codificar fórmula binária = colapsar estados intermediários.
- Reward direction implícito LLM (premiar respostas densas) precisa ser INVERTIDO em prompts clínicos.

## Cristalizado

Diário 25/05 BLOCO F+G+H+I + BLOCO O entry #3. Princípio meta-arquitetural: 4 cenários de aplicação documentados + smoke 9/9 PASS final. Aplicável a TODO prompt clínico futuro.
