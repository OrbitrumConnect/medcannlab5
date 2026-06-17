# 📓 DIÁRIO 17/06/2026 — PARTE 2 — Pitch Investidor (v1.0 → v3.4) + Prompt Visual

**HEAD entrada:** `a07144f` (V1.9.643) → **HEAD saída:** `0f7847b` (V1.9.650)
**PAT:** `sbp_9441f63...` *(rotação saudável, validada 17/06 14:30)*
**Tipo:** sessão laptop noite · construção de deck investidor pré-seed
**Continuação de:** `DIARIO_17_06_2026_BUG_AEC_INTENT_E_20_MEMORIAS.md` *(parte 1, bug clínico)*

---

# BLOCO A — Estado de entrada

Holding pattern desde 10/06 *(7 dias sem código)*. Marco 1 CNPJ em fechamento este mês *(Paulo executando)*. Track ANVISA SaMD iniciado em junho/26. Diário parte 1 documentou bug AEC GATE V1.5 *(intent ADMIN fura gate)* — fix parqueado pra laptop com slug-test + ok Ricardo. PAT nova chegou.

---

# BLOCO B — Pull 11 commits desktop (5 docs Marco 1)

`a07144f..850cb85` — Claude Opus 4.8 desktop entregou 5 docs *(zero código, só docs)*:
- `DOCUMENTOS_ABERTURA_CNPJ_PAULO_11_06_2026.md` *(checklist 4 sócios + 4 decisões societárias · alerta pool Tesouraria 20% não cabe em Ltda)*
- `DIARIO_14_06_2026_ESTADO_ATUAL_COMPLETO.md` *(snapshot consolidado pós-reunião CNPJ)*
- `DIARIO_16_06_2026_ESTADO_E_HOLDING_CNPJ.md` *(holding pattern declarado)*
- `BUSINESS_PLAN_MEDCANNLAB_15_06_2026.md` *(CapEx + OpEx + EBITDA · sacada: break-even ~25 pacientes = Marco 2 PMF)*
- `DIARIO_17_06_2026_BUG_AEC_INTENT_E_20_MEMORIAS.md` *(bug clínico cravado pelo Ricardo + 20 memórias elevadas)*

Pull fast-forward limpo. Zero conflito.

---

# BLOCO C — Pitch Investidor: evolução em 7 versões na mesma sessão

Pedro pediu pitch executivo pra captação pré-seed. Construção em camadas absorvendo input externo + interno:

| Versão | Commit | O que entrou |
|---|---|---|
| **v1.0** | V1.9.644 | Pitch técnico-tabular meu *(18 blocos baseados em PAT 17/06 + BPlan 15/06 + ATA 10/06 + memórias)* |
| **v2.0** | *(intermediária)* | Recalibrações Pedro 3 mensagens: estado beta→alpha, cidades como possíveis alvos *(não pilotos)*, CNPJ saindo este mês, ANVISA entrou, IP cedido detalhado, custos novos *(Google Workspace @medcannlab + Registro.br)*, anonimização "Donizete" *(requisitos ANVISA SaMD sem citar nome pessoal)* |
| **v3.0** | V1.9.645 | Fusão narrativa institucional Pedro + lastros empíricos *(23 slides, tom deck investidor frases curtas, conserva original 14 slides + acrescenta 9 novos onde tem ganho real)* |
| **v3.1** | V1.9.646 | +4 slides revisão consultor externo: Action Plan 2026-2029 *(5 etapas)* / Municípios Prioritários *(dedicado discurso João)* / CapEx Visual *(pizza/barras)* / Backup "Por que R$15M?" *(Q&A preparada)* — 27 slides |
| **v3.2** | V1.9.647 | +5 refinamentos empíricos via PAT 14:30: breakdown 5 vertentes terapêuticas *(Integrativa 105/Biomédica 13/Homeopática 10/MTC 8/Ayurvédica 6)* · engagement 30d *(22 reports/14 ativos/14 signed)* · 3 conceitos epistemológicos *(Queixa≠Sintoma + Z2 contida + Locks MACRO/MICRO)* · Matriz Competitive Landscape *(Scribes/Symptom checkers/EMRs BR/HealthTech cannabis × MedCannLab)* · cruzamento CapEx↔Action Plan |
| **v3.3** | V1.9.648 | Reframe categórico **Build vs Growth Capital**: "captação NÃO é Build Capital · Build já investido pelos fundadores como ATIVOS cedidos R$1,15M+ · capital é Growth+Regulatory+GTM" |
| **v3.4** | V1.9.649 | Realocação final 25/20/25/20/10 + linha de **Formalização Patrimonial híbrida** alinhada com Cláusulas 2.1-2.4 do Acordo de Cotistas v2.1 *(respeita veto Ricardo 30/05: cessão técnica Pedro + licença clínica Ricardo + licença educacional Ricardo+Eduardo + cessão marca todos)* |

Estrutura final R$ 2M:
```
 0%  Build Capital                  (já investido fundadores)
25%  Regulatory Capital      R$ 500k (cenário enxuto)
20%  Growth Tech             R$ 400k
25%  Growth GTM              R$ 500k (prioridade absoluta)
20%  Formalização Patrimonial R$ 400k (~R$100k × 4 sócios, estrutura híbrida)
10%  Working Capital         R$ 200k
```

---

# BLOCO D — Cruzamento empírico via PAT 17/06 14:30

Snapshot completo do banco capturado pra fundamentar Slide 06 *(Tração)* e Slide 16 *(Ativo RWE)*:

| Métrica | Valor |
|---|---|
| Usuários cadastrados | 54 *(34 patient + 11 prof + 5 admin + 4 legacy)* |
| Relatórios totais | 151 *(48 assinados ICP-Brasil)* |
| Prescrições CFM | 63 *(10 atestados + 53 receitas)* |
| Racionalidades clínicas | 142 *(5 vertentes: Integrativa 74% / Biomédica 9% / Homeopática 7% / MTC 6% / Ayurvédica 4%)* |
| AECs | 18 *(7 completas / 11 em progresso)* |
| Agendamentos | 100 |
| Interações IA Nôa | 4.415 |
| Salas chat clínico | 97 |
| Vínculos médico↔paciente | 2 *(sistema novo V1.9.633/634)* |
| Engagement 30d | 22 reports / 14 ativos / 14 signed |
| Custo OpenAI 35d | US$ 17,86 / 7,18M tokens *(R$ 0,65 por relatório)* |
| Crescimento mensal | out/25=1 → mar/26=5 → **abr/26=80** → mai/26=56 → jun/26=2 *(holding)* |

Pico abr/26 = 80 reports cravou empíricamente que **plataforma tem capacidade muito além dos 4k usuários/equipe estimados** quando há médico ativo intenso.

---

# BLOCO E — Demografia DRC nas 4 cidades-alvo (WebSearch)

Cruzamento pra Slide 09 *(Municípios Prioritários)*:

| Cidade | População IBGE 2025 | DRC potencial @ 8,9% ELSA-Brasil |
|---|---|---|
| Rio Bonito RJ | ~63 mil | ~5.600 |
| Niterói RJ | 516.787 | ~46.000 |
| Nova Iguaçu RJ | 843.220 | ~75.000 |
| Santos SP | 418.608 | ~37.000 |
| **TOTAL eixo Rio-Santos** | **~1.842.000** | **~163.500** |

Brasil total: 15M DRC *(6,7% adultos · 21,4% idosos · 157.357 em diálise — custo R$60-120k/paciente/ano)*. Causas #1 HAS · #2 DM · #3 Glomerulonefrite.

---

# BLOCO F — Veto Ricardo 30/05 respeitado na construção do Slide 22

Achado crítico durante v3.4: termo "Aquisição de IP cedido" *(genérico)* violaria Cláusula 2.2 do Acordo de Cotistas v2.1 + memória [`feedback_ricardo_veto_promocao_v2_1_pi_clinica_licenca_nao_cessao_30_05`].

**Princípio mãe do Ricardo:** PI clínica autoral *(AEC/MIMRE)* **SEMPRE é LICENÇA** preservando autoria moral + titularidade acadêmica + uso clínico/formativo próprio, **NUNCA cessão integral**.

Calibração aplicada — estrutura híbrida explícita no Slide 22:
- **2.1 Cessão integral** ativos técnicos *(Pedro: código + schema + pipeline)* — permanente
- **2.2 Licença exclusiva** métodos clínicos *(Ricardo: AEC + MIMRE)* — vigência societária + Non-Compete posterior
- **2.3 Licença conjunta** ativos educacionais *(Ricardo + Eduardo co-50%)* — vigência societária
- **2.4 Cessão integral** marca e branding *(4 sócios)* — permanente

Regra do Pedro hoje: *"o IP perdura até o momento em que ele sócio perdurar na empresa"* = exatamente Cláusula 2.2 v2.1.

---

# BLOCO G — 8 commits da sessão (V1.9.644-650)

```
0f7847b  V1.9.650  PROMPT VISUAL slides gerador IA
c4b4a35  V1.9.649  PITCH v3.4 realocacao + Formalizacao Patrimonial hibrida
928f1c6  V1.9.648  PITCH v3.3 reframe Build vs Growth Capital
2fc3750  V1.9.647  PITCH v3.2 +5 refinamentos empiricos via PAT
851f8bc  V1.9.646  PITCH v3.1 +4 slides revisao consultiva
82bb3dd  V1.9.645  PITCH narrativa fusao v3.0
8ed2c04  V1.9.644  PITCH INVESTIDOR pre-seed v2.0 (recalibrado)
850cb85  *(pull desktop)* 11 commits absorvidos V1.9.627-634
```

Todos pushed 4 refs *(hub main + master + origin main + master)*. Locks 8 intocados em todos. Type-check não afetado *(zero código tocado)*.

---

# BLOCO H — Docs produzidos hoje (raiz do repo)

| Arquivo | Versão | Status |
|---|---|---|
| `PITCH_INVESTIDOR_MEDCANNLAB_17_06_2026.md` | v2.0 técnico-tabular | Material de apoio / due diligence |
| `PITCH_INVESTIDOR_NARRATIVA_FUSAO_17_06_2026.md` | **v3.4** institucional+empírico | **Deck principal pra investidor** |
| `PROMPT_VISUAL_SLIDES_GENS_17_06_2026.md` | v1.0 | Cole no Gemini Park / Gamma + pitch v3.4 |
| `DIARIO_17_06_2026_PARTE_2_PITCH_INVESTIDOR_EVOLUCAO_V3_4.md` | v1.0 | Este documento |

---

# BLOCO I — Pendências humanas pra fechar oficialmente

- [ ] **Bios 4 sócios** validadas pelo próprio
- [ ] **"Bonito" = Rio Bonito RJ** *(assumido pela memória 05/06)*
- [ ] **R$ 2M + R$ 15M alinhados** entre 4 sócios
- [ ] **Paulo confirmar estrutura fiscal** da Formalização Patrimonial *(ativo intangível? cronograma? IR/CSLL?)*
- [ ] **Acordo Cotistas v2.1** promovido oficial pós-revisão advogado societário + saúde digital
- [ ] **Eduardo Faveret** ciência das decisões fiscais e societárias *(ausente reunião 10/06)*
- [ ] **Confirmação Ricardo** linguagem Slide 05 sobre AEC/MIMRE alinhada com veto 30/05
- [ ] **Protocolo ANVISA** *(se já houver número)*
- [ ] **Bug AEC GATE V1.5** fix laptop com slug-test + ok Ricardo *(parte 1 do diário)*

---

# BLOCO J — Próximo passo natural

1. Pedro revisa pitch v3.4 + colaboração visual
2. Cola PROMPT_VISUAL + PITCH v3.4 no Gemini Park / Gamma
3. Gera 27 slides visuais respeitando identidade verde-esmeralda do app
4. Manda pros 3 sócios *(Ricardo, João, Eduardo)* revisarem
5. Pós-aprovação dos 4 + advogado: apresentar ao investidor
6. Em paralelo: avançar Marco 1 *(CNPJ saindo este mês)* + bug AEC laptop fix

---

# 🚀 FRASE-ÂNCORA 17/06 (NOITE)

> *"Sessão laptop noite — 8 commits absorvendo input cruzado de 3 fontes (Pedro institucional + consultor externo amarelo + sócio fundador Ricardo veto 30/05). Pitch evoluiu em 7 camadas v1.0→v3.4 sem destruir nada do que veio antes, cada camada adicionou um ângulo: técnico-empírico → narrativo institucional → revisão profissional → empírico via PAT → reframe Build vs Growth → respeito ao veto Ricardo (Formalização Patrimonial híbrida cessão+licença alinhada com Cláusulas 2.1-2.4 v2.1). PROMPT visual extraído empíricamente do tailwind.config.ts (verde #22c55e primary + amarelo #f59e0b accent + gradiente escuro premium #0f172a→#1e293b→#1e3a3a) — pronto pra colar no Gemini Park. Princípio meta operacional: pitch é doc vivo · aceita 7 versões em 1 sessão · melhor absorver em camadas que tentar perfeito de uma vez. Locks 8 intocados em todos os 8 commits. Holding pattern de código segue (bug AEC pro laptop). Marco 1 saindo este mês destrava cobrança e Marco 2."*
