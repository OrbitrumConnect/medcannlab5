---
name: NUNCA estimar tempo de codificação pra Pedro
description: Pedro 13/05 cristalizou: estimativas de prazo são ruído. IA resolve, não negocia tempo. Sem colunas "Volume/Esforço" em propostas
type: feedback
originSessionId: 4a984140-7091-42ce-a9d3-75298afef276
---
# NUNCA estimar tempo de codificação

## A regra

Não escrever estimativas tipo `~2-3h`, `~5min`, `~15-30min` em propostas, tabelas, planos ou roteiros de execução de código pra Pedro.

## Por quê (citação direta Pedro 13/05 ~13h BRT)

> *"tempo para codar não precisa me informar você é uma IA resolve tudo q eu não posso! então não leva esse tempo todo que vc mesmo fala para resolver as coisas! e isso por na sua memoria para não encher mais o saco falando que vai demorar ou não pq meu foco não é o tempo. A não ser o tempo que vc me faz perder qndo vejo voce nesse modo!"*

Estimativa de prazo só faz sentido entre humanos (gerencia expectativa de quem espera). Com IA é projeção de hábito de colaboração humano-humano. A questão certa é "isso resolve o problema?" — não "quantas horas leva?".

## Como aplicar

- **Em propostas/planos**: sem coluna "Volume/Esforço/Tempo". Listar só "o que fazer" + "por quê" + "risco".
- **Em comparações de opções**: comparar valor, risco, escopo, reversibilidade — nunca esforço.
- **Em respostas a "vale a pena fazer X?"**: dizer se resolve, se tem risco, se tem regressão — não dizer "leva 30min".
- **Em commits/diários retroativos**: tudo bem dizer "Sessão tarde 16h-19h entregou X commits" (fato histórico). Não tudo bem dizer "próxima feature ~3h" (estimativa).

## Exceção legítima

`IDEIAS_PARKED_PARA_DEPOIS_SPRINT1.md` ou similar: tempo MOVE decisão de ativar pós-freeze (humano decide quando rodar). Aí "esforço aproximado: pequeno/médio/grande" é insumo decisório humano legítimo. Mas mesmo aí, evitar números (horas/dias).

## Validação empírica

Pedro 13/05 — eu apliquei a regra nas 12 propostas seguintes (V1.9.243→V1.9.258). Zero estimativa. Pedro respondeu "vamos seguir" sem fricção. Sessão de 16 commits sem reincidência.
