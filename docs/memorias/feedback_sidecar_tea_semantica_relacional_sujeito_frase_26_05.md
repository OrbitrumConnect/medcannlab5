---
name: Sidecar TEA — semântica relacional sujeito da frase (cristalização Ricardo 26/05)
description: Ricardo cristalizou em conversa pós-Eduardo (só Pedro+Ricardo) o princípio meta pra qualquer sidecar que capture sintomas REFERIDOS — extrator precisa reconhecer sujeito da frase + referente (cuidador fala de terceiro). Aplicável a TEA/TDAH/demência familiar/etc. Modelo arquitetural igual sidecar renal V1.9.307
type: feedback
originSessionId: 4a984140-7091-42ce-a9d3-75298afef276
---
# Sidecar TEA — semântica relacional do sujeito da frase

**Rule**: Sidecars que capturam sintomas REFERIDOS (TEA infantil, demência familiar, alcoolismo familiar, etc) NÃO podem usar regex keyword simples. Precisam de **extração com sujeito da frase + referente** via GPT extraction (não NER tradicional). Sem isso, falso positivo gritante (sistema marca cuidador como portador do sintoma do filho).

**Why** — cristalizado por **Ricardo em conversa pós-Eduardo 26/05** (só Pedro+Ricardo, após Eduardo sair da reunião). Citação literal:

> *"Cuidador fala de terceiro, então o parser precisa reconhecer. Referência indireta — sujeito da frase com texto relacional. Exemplo 'meu filho morde tudo' não significa cuidador agressivo, significa o comportamento referido do terceiro é agressivo. Isso é um detalhe sofisticado de semântica."*

Ricardo elogiou que análise prévia de Claude já tinha intuído isso: *"Tipo parece que o cloud fez já, entendeu? Isso é top."*

## Arquitetura técnica (modelo V1.9.307 + camada semântica)

Aplicar `feedback_polir_nao_inventar` — modelo idêntico ao sidecar renal V1.9.307:

```
1. Edge nova `tea-signal-extractor` (Deno, paralela)
2. Roda pós-AEC no Pipeline (não bloqueia)
3. Input: clinical_reports.content + chat_messages_legacy janela
4. GPT extraction (gpt-4o-mini, temp 0.1) com prompt restrito:
   "Extraia SOMENTE sujeito + comportamento + categoria.
    Diferencie sujeito DIRETO ('eu...') de REFERIDO ('meu filho...').
    NÃO infira diagnóstico. NÃO interpole.
    Se pronome ambíguo, resolva usando janela contextual N frases anteriores."
5. Output JSON estruturado:
   {
     "sujeito": "filho do paciente" | "próprio paciente" | "outro familiar",
     "comportamento": "morde tudo",
     "categoria": "agressividade_auto_lesao",
     "fala_literal": "meu filho morde tudo",
     "data": "2026-05-26T...",
     "etapa_aec": "lista_indiciaria",
     "confianca": "alta" | "media" | "baixa"
   }
6. Persistência: jsonb em clinical_reports.content.tea_signals OU tabela tea_signals
7. Card "Sinais TEA detectados" no dashboard do Eduardo (allowlist neuro)
8. Card mostra: categoria + fala literal + data + sujeito identificado + confiança
9. Médico aprova/rejeita cada sinal (audit trail)
```

## Cenários canônicos (calibração empírica obrigatória)

| Fala literal | Sujeito real | Categoria | Confiança |
|---|---|---|---|
| "meu filho morde tudo" | FILHO (terceiro) | agressividade/auto-lesão referida | ALTA |
| "eu mordo as unhas" | PRÓPRIO PACIENTE | hábito nervoso paciente | MÉDIA (não TEA per se) |
| "meu marido tem TEA" | MARIDO (terceiro) | diagnóstico referido | ALTA |
| "minha mãe não dorme" | MÃE (terceiro) | sono/estresse familiar | ALTA |
| "não consigo dormir, ele me acorda direto" | PACIENTE (cuidador) | estresse cuidador | ALTA |
| "tenho TDAH" | PRÓPRIO PACIENTE | diagnóstico próprio | ALTA |
| "ele bate na cabeça quando frustrado" | ELE (pronome ambíguo) | auto-lesão referida | MÉDIA (resolver via contexto) |
| "ele faz movimentos repetidos" (sem contexto) | INDEFINIDO | stimming? | BAIXA (não incluir) |

## 3 cuidados arquiteturais críticos

**1. Janela contextual obrigatória** — pronome ambíguo ("ele", "ela") exige 3-5 frases anteriores. Extrator recebe contexto, não frase isolada.

**2. Confiança calibrada** — sinais BAIXA confiança NÃO entram no card (princípio meta `feedback_locks_macro_vs_micro_matrix_alucinacao_completiva_25_05`: prefere lacuna observada > inferência).

**3. AEC INTOCADA** — Ricardo confirmou explícito: *"O cara vai continuar a mesma parada ali. A gente está botando no meio do caminho uma filtragem."* Pergunta da AEC idêntica.

## Aplicabilidade do princípio (não-só TEA)

Toda feature futura que capture sintomas REFERIDOS por cuidador segue o mesmo padrão:
- **TEA pediátrico** (pai/mãe relatando filho)
- **Demência familiar** (filho relatando pai/mãe idosa)
- **Alcoolismo familiar** (relato sobre parente)
- **Suicídio na família** (HF crítico)
- **Câncer familiar** (HF oncológico)

Em TODOS os casos: sujeito da frase + referente + texto relacional.

## Anti-regressão garantida

| Camada | Status |
|---|---|
| AEC FSM (clinicalAssessmentFlow.ts) | INTOCADA |
| CLINICAL_PROMPT (Edge) | INTOCADO |
| Verbatim First V1.9.86 | INTOCADO |
| Pipeline pós-AEC | ADICIONA extrator paralelo (não substitui) |
| Card existente DRC | INTOCADO (TEA card aparece AO LADO) |
| Audience Contract V1.9.330-A | RESPEITADO (médico interpreta, sidecar não diagnostica) |

## Trigger pra ativar (anti-especulação)

Implementar SÓ quando:
- Eduardo voltar a usar app empíricamente como doctor (não como paciente teste)
- Trouxer 1-2 casos neuro REAIS (volume mínimo pra calibrar)
- Lista de 8 categorias × keywords validada COM Eduardo (não chutada com base em literatura)

Hoje pré-ativação: V1.9.456 (histórico longitudinal no modal de report) já cobre 50% da necessidade. Sidecar TEA complementa quando volume justificar.

## Cristalizado

Diário 26/05 BLOCO J (conversa pós-Eduardo, só Pedro+Ricardo). Princípio meta arquitetural pivotal — padrão repicável pra qualquer captação de sintomas referidos.
