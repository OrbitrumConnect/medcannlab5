---
name: Pipeline Diário → Magno (princípio meta-arquitetural)
description: O Livro Magno só absorve o que JÁ PROVOU valor empírico. Diários são laboratório, Magno é museu do que sobreviveu. Anti-kevlar §1 protege esse pipeline — não proíbe evolução, proíbe declarar lei sem prova
type: project
originSessionId: 60cf94b7-b5d3-4df1-974d-c1c92082460c
---
Explicado por Pedro em 28/04/2026 ~02h30 BRT após audit profundo + classificação de módulos. Recalibra completamente meu modelo mental.

## O modelo

```
HIPÓTESE  →  EXPERIMENTO  →  VALIDAÇÃO  →  CRISTALIZAÇÃO
(diário)     (sprint)        (uso real)     (Magno)

Tempo:       horas           dias-semanas    semanas-meses
Status:      WIP             "em prova"      lei
Reversível:  100%            ~80%            requer nova versão Magno
```

## O que cada artefato é

- **Diário** = laboratório operacional. Hipóteses, tentativas, erros, sucessos. Maturação em curso. WIP.
- **Memórias persistentes (Claude)** = atalhos operacionais. Aprendizados intermediários. Vão evoluindo.
- **Magno** = museu do que sobreviveu. Só entra o que provou valor empírico repetível. **Lei**.

## Implicações práticas

### 1. Magno NÃO desatualiza por evolução
Magno está em fevereiro/2026. Estamos em abril/2026 com V1.9.97. Isso **NÃO é problema** — é processo.
V1.9.85→V1.9.97 ainda está em **período de prova**. Pode virar Magno em 3-6 semanas, ou nunca virar (se algo melhor surgir).

### 2. Anti-kevlar §1 protege o pipeline, não proíbe evolução
- Pode evoluir: UI/UX, heurísticas Core, triggers não-clínicos, navegação
- Não pode mudar **sem nova versão Magno**: Constituição, fala≠ação, contratos clínicos, RACI
- A **nova versão Magno** vem quando algo evoluído **provou-se lei**, não quando alguém quer documentar

### 3. Tabelas/features zeradas não são "abandonadas"
TRL, forum, gamification, wearables com 0 rows = **não provaram valor ainda**. Podem virar produto algum dia, ou morrer no diário. **Isso é OK** no seu modelo.

### 4. Ciência aplicada a software
Nada vira lei sem prova empírica repetível. É o oposto de "documentation-driven" — é **evidence-driven**.

## Como classificar candidatos a Magno

### ✅ Já provou — forte candidato à próxima versão Magno
- Verbatim First (V1.9.86) — 46% economia validada
- AEC GATE V1.5 (V1.9.95-A) — REGRA HARD §1 preservada empiricamente
- Pipeline orchestrator 6 estágios + signature_hash 100%
- Push dual-remote 4 refs disciplina
- Método de validação V1.9.85 5 etapas

### 🟡 Evidência inicial — precisa mais tempo de prova
- V1.9.97-A/C/D/E (booking + RLS) — smoke-tested 1 ciclo
- V1.9.93 dropdown — funcional, falta escala
- `clinical_qa_runs` V1.9.88 — conceito sólido, sem dados ainda

### 🟠 Em prova ativa — sem veredito
- Lock V1.9.95+V1.9.97 (Pedro vai testar 12 dias)
- WiseCare em produção (validar)
- Fallback nativo de vídeo (não testado em failure)

### ❌ Pode morrer no diário
- TRL, forum, debates, articles, gamification, wearables, 3 half-impl

## Why

Esse modelo evita 2 armadilhas comuns:
1. **Overdocumenting**: declarar lei sem prova → vira documento morto
2. **Underdocumenting**: continuar evoluindo sem nunca cristalizar → vira caos

Magno-modelo balanceia: **deixa fluir, mas cristaliza o que provou**.

## How to apply

### Quando Pedro pedir "atualizar Magno":
- ❌ Não atualizar por documentar evolução recente
- ✅ Esperar evidência empírica de que cristalizou em lei
- Critério mínimo: 2-4 semanas de uso real sem regressão + decisão consciente "isso é lei agora"

### Quando criar diário novo:
- ✅ Pode (e deve) registrar tudo — sucessos E erros
- ✅ Diário é WIP, não precisa filtrar
- ❌ Não tratar diário como Magno provisório — são camadas diferentes

### Quando avaliar "está coerente com Magno?":
- ✅ Conceitualmente sim, se respeita Constituição/RACI/Non-Goals
- ✅ Implementação pode estar evoluída além do Magno (é normal)
- ❌ NÃO confundir "Magno desatualizado" com "implementação inválida"

### Quando pacientes externos entrarem (futuro):
- Validação real começa a maturar evolução em "lei"
- Aí sim, considerar Apêndice 2026-Q2 ao Magno OU nova versão (v1.0.7?)
- Critério: o que sobreviveu ao contato com pacientes reais entra no Magno

## Frase âncora

> *"Magno = museu do que sobreviveu. Diário = laboratório do que está provando. Nada vira Magno sem maturação empírica. Anti-kevlar §1 não é proibição de evolução — é proibição de declarar lei sem prova."*

## Refs

- Diário 28/04 Bloco G (Livro Magno consolidado)
- Memory `feedback_polir_nao_inventar.md`
- Memory `feedback_overreach_em_fix.md`
- Conversa Pedro 28/04 ~02h30 BRT (insight original)
