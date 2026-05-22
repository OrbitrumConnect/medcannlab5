---
name: Pricing dinâmico + cap Matrix + BYO opcional — modelo "não trava financeiramente"
description: 20/05/2026 cedo — Cristalizado após audit pricing com GPT externo (3 insights aceitos + 4 rejeitados). Refina memory canônica anterior (reference_pricing_model_canonical_18_05) com cashback dinâmico, cap+BYO, e princípio "não trava UX financeira". Aplicável Marco 1+ (pós-CNPJ).
type: reference
originSessionId: 6742fef8-9d20-43d8-a8d8-8853df0c89e9
---
## Modelo proposto (parqueado pós-Marco 1)

### Planos FULL único por perfil

| Plano | Mensalidade | All inclusive | Cap mensal |
|---|---|---|---|
| **Paciente FULL** | R$ 9,90 | AEC ilim cap 3/mês + ICP + Agenda + Chat Nôa | 200 turnos chat |
| **Aluno FULL** | R$ 59,90 | Cursos + Simulador + Biblioteca + Lives + Fórum | 300 turnos Simulador |
| **Profissional FULL** | R$ 99,90 + split 70/30 | Prontuário NLP + ICP ilim + Matrix + Pacientes ilim | 500 turnos Matrix |

### Cashback DINÂMICO (não mais 5% fixo)

| Situação | Cashback |
|---|---|
| Early adopters (1os 50 pacientes) | 5% |
| Padrão pós-launch | 3% |
| Consulta recorrente (3+/ano) | +1% bônus |
| Paciente longitudinal (6+ meses ativos) | bônus campanha temporário |
| Campanhas pontuais (Cannabis Awareness, etc.) | até 5-8% |

**Implementação técnica**: campo `cashback_rate` em `user_profile` em vez de constante hardcoded `CASHBACK_RATE = 0.05`. Edge default 3%, exceções via flag/coorte.

## Princípio: "não trava financeiramente" — Pedro 20/05 ~05h BRT

**Modelo que TRAVA financeiramente** (a EVITAR):
```
Mensalidade R$ X + cota de créditos
Bate cota → tem que COMPRAR pacote extra (R$ 5 = 50 créditos)
App parece mercenário, sempre alerta "vai cobrar mais"
```

**Modelo proposto que NÃO TRAVA** (ADOTADO):
```
Mensalidade R$ X flat
Cap mensal generoso
Bate cap → 2 opções (ambas zero cobrança extra plataforma):
  (a) aguarda reset (diário fracionado, NÃO cooldown 24h cego)
  (b) ativa BYO-LLM → pagamento DIRETO no provider externo
Cashback = bônus em R$ na carteira, NÃO crédito a gerenciar
```

## Por que cap+BYO em vez de "compre mais créditos"

| Trava UX financeira? | Por quê |
|---|---|
| Mensalidade flat | ❌ não | usuário paga 1× e usa dentro do limite |
| Cap com reset | ❌ não | zero cobrança extra na plataforma |
| BYO-LLM externo | ❌ não | pagamento DIRETO OpenAI/Claude, plataforma não intermedeia |
| Cashback bônus R$ | ❌ não | vira valor visível na carteira, não crédito |
| Split 70/30 auto | ❌ não | sem ação do médico, transparente |

**Zero pontos de "compre mais créditos pra continuar usando"** no design. Quem quer power-use, ativa BYO (pagamento externo) ou aguarda reset.

## Cap por TOKENS, não por turnos (refinamento futuro)

Track por tokens reais (já existe `metadata.cost_usd_estimate`) em vez de contar "turnos":
- 1 "olá noa" (50 tokens) ≠ 1 "compara 5 casos longitudinal com 3 papers PubMed" (5000 tokens)
- Cap 500 turnos vira "cap R$ 60/mês de IA prof" — mais justo + previsível

## BYO-LLM trigger recalibrado (vs memory anterior)

**Memory `project_byo_llm_arquitetura_parqueada_19_05` definia**: ativar Marco 3 OU custo > 30% MRR.

**Recalibração 20/05**: ativar **Marco 1 pós-CNPJ** (não Marco 3) — disponível mas opcional. Médico que pedir explicitamente ou bater cap 2 meses consecutivos = trigger natural.

**Razão**: sem BYO opcional desde cedo, plataforma "pune" o melhor comportamento (médico Matrix profundo). Heavy researchers (Ricardo) já são esse perfil.

## 6 sinais comportamentais pra observar beta 20-30

### 2 sinais técnicos/clínicos (cristalizados smoke 19/05)
1. **Autoridade invisível de estrutura** — Matrix escolhe o que enfatizar, enviesa percepção mesmo sem decidir
2. **Cognitive offloading** — médico usa Matrix como "resposta" em vez de "interlocutor"

### 4 sinais comportamentais cashback (cristalizados 20/05 cedo)
3. **Retenção longitudinal real** — cashback reduz churn 3-6 meses ou método retém sozinho?
4. **Frequência consulta** — cashback aumenta recorrência clínica?
5. **Sensibilidade psicológica** — paciente percebe diferença 3% vs 5%?
6. **Efeito no médico** — cashback ajuda fechar tratamento longitudinal? aumenta adesão?

## Trade-off margem vs UX (números honestos beta vs escala)

| Configuração | Margem | Risco UX |
|---|---|---|
| Cap 300 + cashback 3% | 73% | Heavy users batem cap → UX ruim → churn enviesado |
| **Cap 500 + cashback 5% (beta)** | **66%** | **Mais seguro UX, dado real puro** |
| Cap 500 + cashback 3% | 70% | Compromisso intermediário |

**Beta 20-30 começa CAP GENEROSO** (500 prof / 300 aluno / 200 paciente) + cashback 5% fixo + telemetria detalhada. Pós-30 dias: analisar p50/p95 uso, ajustar cap pra p95 + 20% headroom, testar cashback dinâmico em coorte específica.

## Cenário consolidado (escala validada, NÃO beta)

```
RECEITA (10 méd + 50 pac + 10 alunos)
SaaS Paciente (50 × R$ 9,90)        R$    495
SaaS Profissional (10 × R$ 99,90)   R$    999
SaaS Aluno (10 × R$ 59,90)          R$    599
Split 30% consultas (50 × R$ 150)   R$  7.500
                                    ─────────
TOTAL RECEITA                       R$  9.593

CUSTOS (cap 300 Matrix + cashback dinâmico 3% padrão)
IA Paciente (50 × R$ 3,50)          R$    175
IA Profissional (10 × R$ 60)        R$    600
IA Aluno (10 × R$ 15)               R$    150
Infra fixa                          R$    475
Stripe 4.5%                         R$    432
Cashback 3% × R$ 25.495             R$    765
Referral (0% pré-Marco)             R$      0
                                    ─────────
TOTAL CUSTOS                        R$  2.597

LUCRO LÍQUIDO                       R$  6.996
MARGEM                              73%  ✅
POR SÓCIO (÷4)                      R$  1.749
```

## Comparação 3 cenários

| Cenário | Cashback | Cap Matrix | Margem | Por sócio (4) |
|---|---|---|---|---|
| Atual canônico (memory 18/05) | 5% fixo | sem cap | 73-78% teto teórico | R$ 2.343 |
| Proposta inicial 20/05 | 5% fixo | 500 turnos | 66% | R$ 1.584 |
| **Proposta consolidada** (cashback dinâmico + cap 300 escala) | 3% padrão + 5% campanha | 300 turnos + BYO Marco 1 | **73%** | **R$ 1.749** |

## Anti-padrões cristalizados (20/05 adicionais)

- ❌ **Modelo de créditos avulsos** — sempre alerta "compre mais", trava UX financeira
- ❌ **Cap rígido sem soft warning** — usuário não vê chegando no limite, bate de cara
- ❌ **Cooldown 24h vago** — usar reset diário fracionado em vez (mais previsível)
- ❌ **Cashback fixo eternal** — vira custo estrutural permanente, perde poder comportamental
- ❌ **BYO obrigatório pro power user** — usuário com 1 paciente NÃO precisa ativar BYO, só heavy
- ❌ **Trocar 2 variáveis simultâneas no beta** (pricing + cashback) — enviesa medição
- ❌ **Implementar cap+BYO antes Marco 1** — sem CNPJ não dá pra cobrar BYO mesmo se quiser

## Quando essa memória é relevante

- Antes de codificar implementação real de cap Matrix (parqueado)
- Antes de migrar `CASHBACK_RATE = 0.05` pra dinâmico
- Quando alguém propor "vamos cobrar pacote extra de Matrix R$ 19,90" — REJEITAR
- Quando médico bater cap (futuro) — design path = BYO opcional, não compre crédito
- Pricing decision pré ou pós Marco 1
- Sinais comportamentais beta 20-30

## Frase âncora

> *"Plano FULL único por perfil. Cap mensal generoso com reset diário. BYO opcional pagando direto no provider. Cashback dinâmico como ferramenta comportamental, não custo estrutural. Zero pontos de 'compre mais créditos'. O app não trava financeiramente."*

— Pedro + Claude 20/05/2026 ~05h BRT (madrugada virou)

## Memorias relacionadas

- `reference_pricing_model_canonical_18_05` — referência canônica anterior (será atualizada)
- `project_byo_llm_arquitetura_parqueada_19_05` — arquitetura BYO (trigger recalibrado aqui)
- `project_3_marcos_minimos_reprecificacao_valuation_18_05` — marcos pré/pós-PMF
- `feedback_pesquisa_materializacao_tese_ricardo_nao_drift_19_05` — checklist anti-dialeto-paralelo aplicado
- `project_v1_9_388_smoke_final_vitoria_empirica_19_05` — 2 sinais comportamentais (autoridade + offloading)
