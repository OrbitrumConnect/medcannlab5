---
name: Método de validação produção via logs cruzados (V1.9.85, 27/04)
description: Protocolo replicável usado pela primeira vez em 27/04/2026 para validar sprint clínica em produção. Combina logs do Edge + queries no banco vivo + análise de código + classificação 🟢🟡🟠🔴. Substitui "feeling" por evidência calibrada.
type: feedback
originSessionId: 60cf94b7-b5d3-4df1-974d-c1c92082460c
---
## Quando aplicar

Sempre que houver:
- Sprint nova de produto que mexe em fluxo clínico/AEC/relatório
- Validação pós-deploy de Edge Function
- Investigação de bug reportado em produção
- Cruzamento entre comportamento observado e estado esperado

## Protocolo (5 etapas)

### 1. Coletar evidência bruta de 4 fontes

| Fonte | O que coletar | Ferramenta |
|---|---|---|
| **Logs do Edge Function** | timestamps, fases AEC, payloads, erros | Pedro envia ou query Supabase Functions logs |
| **Banco vivo** | estado de tabelas afetadas (aec_assessment_state, clinical_reports, cognitive_events, institutional_trauma_log) | Management API SQL |
| **Código atual** | `git show hub/main:arquivo` ou Read da branch ativa (NUNCA do working tree desatualizado) | git/Read |
| **Diários + memórias** | contexto histórico, regras, princípios | Read tmp/ ou ~/.claude/.../memory |

### 2. Classificar cada afirmação ANTES de concluir

Para cada frase que produzir:

- 🟢 **FATO VERIFICADO**: consultei via SQL/grep/git nesta sessão → confiar e usar
- 🟡 **HIPÓTESE PLAUSÍVEL**: arquiteturalmente coerente mas não testado em produção → marcar e validar antes de agir
- 🟠 **INTERPRETAÇÃO**: leitura minha, com viés possível → tratar como ponto de partida, não conclusão
- 🔴 **ÂNGULO CEGO**: não examinei → assumir que pode estar errado, perguntar humano

### 3. Reconstruir linha do tempo (delta-time desde último evento)

Quando logs vierem em microssegundos epoch, converter pra Δt relativo ao último evento:

```
T-225s | CONSENSUS_REVIEW | "dipirona para dor de cabeca"   | tokens 7146
T-127s | CONSENSUS_REPORT | "sim. apresente sua previsao"   | tokens 7968
T-65s  | CONSENT_COLLECTION | "concordo"                    | TRIGGER prematuro
T-50s  | -                | SCORES clinical_score=56        | abaixo do alvo 79
T-3s   | FINAL_RECOMMENDATION | "autorizo"                  | PIPELINE_REDUNDANT_TRIGGER
```

Permite ver causalidade temporal.

### 4. Cruzar 3 dimensões para cada achado

Para cada bug/regressão identificada:
1. **Log diz** o quê?
2. **Banco confirma** o quê?
3. **Código explica** o quê?

Exemplo aplicado em V1.9.85:
> Log: `🧬 [FORCE] Injetando tags em CONSENT_COLLECTION com message="concordo"`
> Banco: `aec_assessment_state.phase=FINAL_RECOMMENDATION` (já passou)
> Código: `tradevision-core/index.ts:4839 needsCompletionTag inclui CONSENT_COLLECTION`
> **Conclusão fundamentada:** trigger prematuro confirmado em 3 dimensões.

### 5. Validar conclusão com humano + IA externa antes de aplicar fix

Antes de tocar em código:
- Pedro confirma o achado bate com o que viu na UX
- GPT/IA externa (review independente) lê e contesta ou ratifica
- Só então proposta de fix com escopo cirúrgico

## Anti-patterns a evitar

| Anti-pattern | Sintoma | Correção |
|---|---|---|
| **Misturar tempos** | Citar "código" sem dizer qual versão | Sempre rotular: hub/main vs working tree vs narrativa |
| **Inflação retórica** | "Lei sagrada", "trabalho histórico", "raro de ver" | Trocar por descrição factual com evidência |
| **Memória estática como verdade** | Citar memória de N dias atrás sem revalidar | Verificar contra realidade atual (lição IMRE 27/04) |
| **Conclusão antes de evidência** | "Acho que é bug" sem 3 dimensões cruzadas | Aplicar etapa 4 antes de propor fix |
| **Skip de classificação 🟢🟡🟠** | Frases sem rótulo de confiança | Toda afirmação estrutural ganha rótulo |

## Exemplo do método aplicado (V1.9.85, Carolina, 27/04)

**Achado positivo:** V1.9.84 escriba aprovado em produção
- 🟢 Log: `narrator V1.9.84 escriba` ativou
- 🟢 Banco: `clinical_reports.content.structured` tem campo "Lacunas Declaradas"
- 🟢 Banco: rodapé regulatório literal presente
- 🟢 Banco: zero ocorrências de palavras proibidas (sugere/indica/prescrever/etc.)
- **Veredito:** P0 CFM resolvido em produção

**Achado negativo:** trigger prematuro de agendamento
- 🟢 Log: `[FORCE] Injetando tags` em fase CONSENT_COLLECTION
- 🟢 Código: `tradevision-core/index.ts:4839` inclui CONSENT_COLLECTION em needsCompletionTag
- 🟢 Banco: `aec_assessment_state` mostra paciente entrou na fase aos 65s antes do trigger
- **Veredito:** bug confirmado, escopo cirúrgico (1 linha em 4839)

**Achado a validar:** score 56 vs esperado 79
- 🟢 Banco: `clinical_score=56`, `confidence=high`
- 🟢 Banco: breakdown mostra `queixa_principal=0/15` mesmo com queixa preenchida ("O cansaço")
- 🟡 Hipótese: V1.9.83 (contrato granular) não chegou ao slot esperado pelo scorer
- 🟠 Interpretação: pode ser sessão mais curta da Carolina (vs Pedro 26/04 com 58)
- **Veredito:** parcial — bug do scorer confirmado, mas magnitude do impacto requer mais AECs

## Why

Antes deste método, validações eram baseadas em "feeling" + commit message + smoke manual no front. Resultado: bugs descobertos só pós-deploy, regressões não documentadas, decisões sem evidência cruzada. Em V1.9.85, aplicamos pela primeira vez o protocolo de 5 etapas — descobrimos 4 vazamentos simultaneamente, em ~15min de análise, antes de aplicar 5 commits. Reduziu drasticamente o ciclo "deploy → bug → fix" para "log → análise cruzada → fix → validação".

## How to apply

- Em qualquer sprint clínica nova: aplicar protocolo de 5 etapas antes de commit
- Em qualquer review de PR: pedir evidência das 3 dimensões (log + banco + código)
- Em conversa com Pedro/Ricardo: rotular cada afirmação 🟢🟡🟠🔴
- Quando confiança alta: desconfiar, especialmente se baseada em memória estática (lição IMRE Bloco G)
- Antes de invocar memória pra bloquear ação: verificar contra realidade atual via SQL/grep/git
