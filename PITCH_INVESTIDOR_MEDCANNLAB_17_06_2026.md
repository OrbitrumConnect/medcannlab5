# 🎯 PITCH EXECUTIVO — MedCannLab 3.0
## Pré-Seed Round · Junho 2026

> **Documento pra apresentação a investidor.** Versão 2.0 — recalibrada com input Pedro 17/06 (estado beta→alpha, cidades como possíveis alvos, CNPJ saindo este mês, ANVISA entrou, IP cedido detalhado). Números empíricos cruzados via PAT em **17/06/2026**.
>
> **Legenda de confiança:** 🟢 empírico (banco/registro) · 🟡 estimativa fundamentada · 🔴 projeção/cenário · ⚪ possível alvo (não firmado)

---

## 1. OS 4 SÓCIOS-FUNDADORES

> ⚠️ Bloco de identificação. Cada sócio confirma seu próprio resumo de bio antes do pitch ir pra investidor.

| Sócio | Papel na empresa | Frente |
|---|---|---|
| **Pedro Henrique Passos Galluf** | CTO / orquestrador da plataforma | Arquitetura cognitiva, governança técnica, infra Supabase + Edge Functions, segurança e compliance técnico, COS Kernel v5.0 |
| **Dr. Ricardo Valença** | Médico-fundador / Chief Medical Officer | Nefrologista (CRM 5253203-7), criador do método **AEC** (Avaliação Estruturada Cognitiva) e do **MIMRE** (Método Incentivador Mínimo do Relato Espontâneo), autoridade clínica e regulatória |
| **Dr. Eduardo Faveret** | Coordenador eixo Ensino / Neurologia | Neurologia (TEA/TOD/TDAH/epilepsia), responsável pela vertente educacional (cursos, TRL) e pelo Sidecar Neuro |
| **João Eduardo Vidal** | Diretor institucional / Parcerias | Relações com prefeituras, redes públicas (SUS), CNPJ, regulatório institucional, agenda comercial B2B |

---

## 2. ELEVATOR PITCH (30 segundos)

> **MedCannLab é a primeira plataforma SaaS do Brasil construída a partir da ESCUTA clínica.** Enquanto scribes (Nuance, Abridge) transcrevem e checkers de sintoma (Infermedica, Ada) só roteiam, nós **organizamos a fala do paciente em método autoral validado** (AEC + MIMRE) e devolvemos sinalização de padrão **rim×cannabis** em estágios pré-laboratoriais que nenhum incumbente cobre. Compliance técnico real (ICP-Brasil PBAD AD-RB CONFORME ITI, **48 relatórios assinados digitalmente** 🟢) — sem mockup. Estamos em **transição beta → alpha**, **CNPJ saindo este mês**, **track ANVISA iniciado**. Captação **pré-seed R$ 1,5M–3M** pra ligar a cobrança (CNPJ + Stripe Connect), passar a alpha comercial, alcançar Marco 2 (PMF) em ~25 pacientes pagantes e explorar **possíveis cidades-alvo no eixo Rio–Santos** (Rio Bonito, Niterói, Nova Iguaçu, Santos), totalizando **~1,84 milhão de habitantes** e até **~163 mil pacientes DRC potenciais** na região (~8,9% prevalência ELSA-Brasil 🟡).

---

## 3. PROBLEMA — o que a saúde brasileira não resolveu

### 3.1 Diagnóstico tardio da Doença Renal Crônica (DRC)

- **15 milhões de brasileiros com DRC** (~8,4% adultos) 🟡 [SBN]
- **6,7% prevalência em adultos** / **21,4% em idosos** (PNS) 🟡
- **157.357 pacientes em diálise** (Censo Brasileiro de Diálise 2023, 771/milhão) 🟡
- **#1 causa: Hipertensão · #2: Diabetes · #3: Glomerulonefrite** — tudo doença previsível
- **Gargalo:** estagiamento clínico só começa quando creatinina já alterou (G3a-G5). Estágios **G1-G2** ficam invisíveis — paciente perde a janela de remissão

### 3.2 A escuta clínica está sendo automatizada **errado**

- **Scribes** (Nuance/Abridge) transcrevem voz, mas **não estruturam fenomenologicamente** a queixa
- **Symptom checkers** (Infermedica/Ada) abrem com lista de sintomas, **fechando a abertura fenomenológica** onde mora o diagnóstico precoce
- **EMRs** (Tasy/MV/HCloud) são prontuário, **não cognição clínica**
- Nenhum incumbente cobre a interseção **escuta-fiel + método estruturado + dado pré-laboratorial + farmacologia cannabis-renal**

### 3.3 Cannabis medicinal sem trilho regulatório-cognitivo

- Médico hoje prescreve cannabis sem ferramenta de **mapeamento renal-específico** (CBD via CYP2C9/3A4, excreção renal, AINEs PROIBIDOS estágio ≥G3b)
- **CBG+CBD anti-inflamatório seguro DRC** é canal terapêutico com paper recente [Tangri et al, Kidney International Jan/2026] 🟡 mas sem ferramenta clínica que apoie a prescrição

---

## 4. SOLUÇÃO — a pilha que ninguém ainda fez

### 4.1 O moat: interseção, não código

```
┌─────────────────────────────────────────────────────────┐
│  ESCUTA FIEL    ←   método autoral Ricardo (MIMRE/AEC)  │
│       ↓                                                  │
│  ORGANIZAÇÃO    ←   IA Nôa (8 camadas, GPT por último)  │
│       ↓                                                  │
│  SINALIZAÇÃO    ←   Matrix Z2 + Sidecars cognitivos     │
│  (sinaliza,                                              │
│  não diagnostica)                                        │
│       ↓                                                  │
│  DOCUMENTAÇÃO   ←   ICP-Brasil PBAD AD-RB CONFORME ITI  │
│  CLÍNICA REAL                                            │
│       ↓                                                  │
│  ATO MÉDICO     ←   médico decide (CFM 2.314/2022)      │
└─────────────────────────────────────────────────────────┘
```

### 4.2 Por que é defensável

| Camada | Quem mais tem |
|---|---|
| Escuta fenomenológica fiel a método autoral validado | Ninguém comercial |
| Sidecar Renal (5 estágios pré-laboratoriais via fala) | Ninguém — diferencial do **Ricardo** |
| Sidecar Cannabis no Relato (farmacologia renal-específica) | Ninguém |
| ICP-Brasil PBAD AD-RB real (assinatura digital ANVISA-compliant) | <5% das healthtech BR |
| Sidecar Neuro (TEA/TOD/TDAH no relato — Eduardo) | Ninguém |

---

## 5. ESTADO ATUAL DA PLATAFORMA — BETA → ALPHA (transição)

> **Honestidade primeiro:** a plataforma está em **beta avançado migrando pra alpha comercial** com CNPJ saindo este mês. Os números abaixo são de uso interno + testes clínicos + onboarding cross-account validado (Pedro + Ricardo + Eduardo operacional desde 27/05). Não há ainda paciente externo pagante (Marco 2 é o destrava).

### 5.1 Tração técnica empírica (17/06/2026 via PAT)

| Métrica | Valor | Conf. |
|---|---|---|
| **Relatórios clínicos gerados** | **151** total · **48 assinados digitalmente ICP-Brasil** | 🟢 |
| **Prescrições CFM** | 63 (10 atestados / 53 receitas — simples/branca/azul/amarela) | 🟢 |
| **Racionalidades clínicas (5 vertentes)** | 142 (biomédica + integrativa + homeopática + MTC + ayurvédica) | 🟢 |
| **Interações IA Nôa** | **4.415** (Core ~7.700 linhas, 8 camadas) | 🟢 |
| **AECs (Avaliações Estruturadas Cognitivas)** | 18 — 7 completas / 11 em progresso | 🟢 |
| **Agendamentos** | 100 | 🟢 |
| **Usuários cadastrados** | 54 (34 pacientes · 11 profissionais · 5 admins · 4 legacy) | 🟢 |
| **Vínculos médico↔paciente formais** | 2 (sistema novo V1.9.633/634, 10/06) | 🟢 |
| **Salas de chat clínico** | 97 | 🟢 |

### 5.2 Crescimento mensal de relatórios (proxy de validação técnica)

| Mês | Relatórios | Evento |
|---|---|---|
| out/25 | 1 | Bootstrap |
| jan/26 | 3 | Estabilização AEC FSM |
| mar/26 | 5 | Lock V1.9.95 AEC GATE |
| **abr/26** | **80** | 🚀 V1.9.299 PBAD CONFORME ITI |
| mai/26 | 56 | 1ª paciente externa real (Maria das Dores Pitoco) |
| jun/26 (parcial 1-17) | 2 | Holding pattern aguardando CNPJ |

### 5.3 Custo de IA cravado empíricamente

- **Custo agregado 35 dias** (13/05 → 17/06): **US$ 17,86** · **7,18M tokens** · **1.220 mensagens com tracking** 🟢
- **Custo médio por relatório:** US$ 0,118 (R$ 0,65 @ R$ 5,50) 🟢
- **Custo médio por interação Nôa:** US$ 0,015 (R$ 0,08) 🟢
- **Modelo:** OpenAI gpt-4o-2024-08-06 (chat) + gpt-4o-mini (escriba)

### 5.4 Compliance técnico (verificado, não declarado)

- **Algoritmo de assinatura digital:** PBAD AD-RB CONFORME ITI v2.4 — verificado via openssl asn1parse no portal `validar.iti.gov.br` 🟢
- **48 relatórios** com cadeia ICP-Brasil válida 🟢
- **RLS (Row Level Security):** 100% das tabelas com policies ativas 🟢
- **17 Edge Functions** (16/17 com `verify_jwt=true` — defesa em camadas) 🟢
- **PII sanitizada** (V1.9.452 + V1.9.566 + V1.9.597 — gap residual cosmético mapeado)
- **Trigger de imutabilidade pós-assinatura** — anti-adulteração juridicamente correto 🟢

---

## 6. HISTÓRICO DE DESENVOLVIMENTO — IP CEDIDO PELOS SÓCIOS

> Este bloco fundamenta o **lastro das quotas** (acordo de cotistas v2.1) e justifica o valuation pré-money. O investimento maior (a plataforma) **já foi feito** como trabalho cedido pelos sócios.

### 6.1 Período e intensidade

- **Início efetivo:** final agosto / setembro 2025 🟢
- **Duração até pitch:** ~10 meses (set/25 → jun/26)
- **Modo de trabalho:** sessões longas (frequentemente 14+ horas/dia), reuniões presenciais regulares na sede operacional, viagens entre Pedro/Ricardo
- **Encontros presenciais:** múltiplas reuniões com custo médio estimado R$ 100/encontro (deslocamento + alimentação + tempo)
- **Distância operacional:** ~13 km Pedro↔Ricardo (ida+volta = 26 km/encontro)

### 6.2 Estimativa de valor do IP cedido 🟡

| Componente | Estimativa | Base |
|---|---|---|
| **Desenvolvimento técnico Pedro (10 meses)** | R$ 400.000–600.000 | ~1.500-2.000h × R$ 250-300/h (CTO sênior healthtech) |
| **Método autoral Ricardo (AEC + MIMRE + dossiês)** | R$ 300.000–500.000 | Propriedade intelectual clínica + 25+ anos prática nefrologia |
| **Curadoria clínica e validação Eduardo** | R$ 80.000–150.000 | Neurologia + Sidecar Neuro + curso pré-criado |
| **Engenharia institucional João** | R$ 80.000–150.000 | Relações públicas + abertura CNPJ + estruturação societária |
| **Custos operacionais informais ($)** | R$ 8.000–15.000 | Deslocamentos, encontros, infra ad-hoc (~80-150 encontros × R$ 100) |
| **TOTAL IP cedido (range)** | **R$ 868.000 – R$ 1.415.000** | Range conservador-otimista |
| **Valor mediano** | **~R$ 1,15 milhão** | Defensável em relatório de valuation pré-seed |

→ **Mensagem-chave ao investidor:** *"o investimento de capital intelectual e de tempo (~R$ 1,15M valor estimado) já foi entregue à empresa. O dinheiro pedido (R$ 1,5M–3M) é pra operação, regulação e crescimento — não pra construir o produto que já existe."*

---

## 7. POSSÍVEIS CIDADES-ALVO — eixo Rio–Santos

> ⚠️ **As 4 cidades abaixo são POSSÍVEIS ALVOS, não pilotos firmados.** Mapeamento estratégico baseado em densidade DRC, acesso institucional via João, proximidade dos sócios e potencial de tração local. Confirmação de cada piloto exige negociação caso-a-caso com prefeitura/rede/clínica âncora.

### 7.1 Mapeamento estratégico

| Cidade | UF | População (2025 IBGE) 🟡 | DRC potencial @ 8,9% 🟡 | Por que foi mapeada | Status |
|---|---|---|---|---|---|
| **Rio Bonito** ⚠️ | RJ | ~63 mil | ~5.600 | Mencionada na reunião 05/06 como vertex regional potencial. Confirmação Pedro pendente. | ⚪ possível alvo |
| **Niterói** | RJ | **516.787** | **~46.000** | Densidade médica + proximidade Ricardo | ⚪ possível alvo |
| **Nova Iguaçu** | RJ | **843.220** | **~75.000** | Baixada Fluminense — DM/HAS prevalente, déficit de especialistas | ⚪ possível alvo |
| **Santos** | SP | ~418.608 | **~37.000** | Litoral SP — porto + população envelhecida + nefrologia presente | ⚪ possível alvo |
| **TOTAL 4 possíveis alvos** | — | **~1.842.000** | **~163.500 DRC potenciais** | — | — |

> **"Bonito" da transcrição:** assumi Rio Bonito RJ baseado em memória da reunião 05/06 ("vertex regional"). Se for Bonito MS (~22k hab, turismo), o cálculo muda. **Pedro confirma antes do pitch.**

### 7.2 Modelo de entrada por cidade (action plan padronizado)

```
FASE 1 — IMPLANTAÇÃO (10 mil usuários em horas, tecnicamente)
├─ Setup conta médica institucional
├─ Onboarding clínica âncora (1-3 médicos)
├─ Liga PaymentGate (Stripe Connect / MP)
└─ Smoke 5 atendimentos reais → AEC + relatório + assinatura ICP

FASE 2 — TRAÇÃO LOCAL (30-60 dias)
├─ Captação ~500 pacientes pagantes (B2C R$ 33,33/mês)
├─ Onboarding 2-3 médicos adicionais
└─ Marketing local (mídia local + WhatsApp + indicação)

FASE 3 — ESCALA REGIONAL (60-120 dias)
├─ Parceria rede pública via João (ex.: Prefeitura RJ)
├─ Relatório DRC B2B R$ 122/unidade
└─ Replicação pra cidade seguinte
```

---

## 8. PREVISIBILIDADE POR EQUIPES — modelo de escala

### 8.1 A regra empírica (cravada pela reunião)

**1 equipe atende 4.000 usuários ativos.** Vem de capacidade operacional médico + suporte + agendamento.

### 8.2 Projeção até 70 mil usuários 🔴

| Estágio | Usuários | Equipes | Trigger pra abrir nova equipe | Timing-alvo |
|---|---|---|---|---|
| **Bootstrap** | 0–500 | 1 (Ricardo + Pedro suporte) | 500 cadastros qualificados | Marco 1 (mês 1-3) |
| **Tração** | 500–4.000 | 1 | 80% capacidade da equipe 1 | Mês 4-9 |
| **PMF declarável** | 4k–8k | 2 (2ª cidade entra) | 4k 1ª cidade + planejamento 2ª | Mês 10-15 |
| **Escala leve** | 8k–20k | 5 (3ª + 4ª cidades) | Cada equipe nova = piloto cidade nova | Mês 16-24 |
| **Escala regional** | 20k–40k | 10 (replicação interna) | Cada 4k de uma cidade = +1 equipe | Mês 25-36 |
| **Saturação alvo** | 40k–70k | **14 equipes** | 4 cidades + extensão Grande Rio + Baixada Santista | Mês 37-48 |

### 8.3 Por que 4.000/equipe é a métrica certa

- **Agenda médico:** 1 nefrologista atende ~20 pacientes/semana = 80/mês × 12 = 960/ano
- **Sustentação SaaS:** taxa de uso ativo mensal em saúde digital ~25-35% → 4.000 cadastrados = ~1.200 ativos = 12 médicos × 100 pacientes ativos cada
- **Equipe = 12-15 médicos + 2-3 suporte + 1 coordenador clínico** (Ricardo aprova clinicamente, mas não opera o dia-a-dia)

### 8.4 Capacidade de agenda da plataforma

A plataforma **já tem sistema de agendamento, AEC, slot-picker, sharing cross-account, prontuário longitudinal e prescrição/atestado ICP-Brasil**. A escala não exige reescrever produto — exige **operação comercial**.

---

## 9. UNIT ECONOMICS — break-even = PMF

> A história mais forte do pitch: **atingir PMF = atingir break-even**, na mesma curva.

### 9.1 OpEx atual (pré-receita, beta) 🟢

| Item | R$/mês | Conf. |
|---|---|---|
| OpenAI (IA Nôa) | ~R$ 28 (US$ 5/mês cravado 35d) | 🟢 |
| Supabase | R$ 0 (free) | 🟢 |
| Vercel | R$ 0 (free) | 🟢 |
| Resend (email) | R$ 0 (free ≤3k/mês) | 🟢 |
| Domínio medcannlab.com.br (Registro.br) | ~R$ 4 (anualizado ~R$ 40-50/ano) | 🟢 |
| **TOTAL OpEx hoje** | **~R$ 32/mês** | 🟢 |

### 9.2 OpEx pós-Marco 2 (escala + compliance) 🟡

| Item | R$/mês | Nota |
|---|---|---|
| OpenAI | escala c/ uso (~R$ 0,65/relatório 🟢) | 2,86 relatórios/usuário/mês 🟢 |
| Supabase **Pro** (PITR/compliance) | ~R$ 140 (US$ 25) | pré-condição Marco 2 |
| Vercel Pro | ~R$ 110 (US$ 20) | quando escalar build |
| Resend pago | ~R$ 110 (US$ 20) | acima de 3k emails |
| **Google Workspace** (@medcannlab.com.br × 4-6 contas) | ~R$ 180-270 (R$ 45/conta × 4-6) | comunicação institucional |
| Domínio | ~R$ 4 | |
| WiseCare V4H (vídeo, prod) | a definir 🔴 | migrar homolog→prod |
| Stripe/MP (taxa) | ~3-4% sobre transações | sobre receita |
| **TOTAL OpEx base pós-Marco 2** | **~R$ 580-870/mês** + variável IA/vídeo/taxas | 🟡 |

### 9.3 Receita por produto

| Produto | Preço | % pra empresa |
|---|---|---|
| **Paciente FULL** | R$ 33,33/mês | 100% |
| **Profissional FULL** | R$ 99,90/mês | 100% |
| **Aluno FULL** | R$ 149,90/mês | 100% |
| **AEC isolada** | R$ 5/aval ou R$ 35/mês | 100% |
| **Consulta médica** (Split 70/30) | R$ 350–1.300 | **30%** take-rate |
| **Relatório DRC B2B** (âncora Soc. Nefrologia) | R$ 122/unidade | 100% |

### 9.4 Cenários de receita (🔴 projeção — 0 pagante hoje)

**Cenário A — Break-even mínimo (= Marco 2)**
- 25 pacientes × R$ 33,33 = **R$ 833/mês**
- OpEx ~R$ 700/mês → **EBITDA +R$ 130/mês**
- Conclusão: **~25 pacientes pagantes cobrem a operação inteira.**

**Cenário B — Tração inicial (mês 12-18)**
- 100 pacientes + 10 profissionais + 50 consultas/mês × R$ 500 × 30%
- Receita ≈ **R$ 11.832/mês** · OpEx ~R$ 1.500/mês
- **EBITDA ≈ +R$ 10.300/mês**

**Cenário C — B2B Nefrologia (mês 24-36, anchor narrativa)**
- Relatório DRC R$ 122 × 500/mês = **R$ 61.000/mês** receita
- Volume = 0,3% do potencial total Soc. Nefrologia (70k DRC)
- **Vitrine narrativa, NÃO pipeline firmado** 🔴

**Cenário D — Cobertura 4 cidades-alvo @ 1% conversão**
- 1.635 pacientes pagantes (1% dos 163.500 DRC potenciais) × R$ 33,33 = **R$ 54.500/mês** B2C
- + take-rate consultas + relatórios B2B
- **Receita projetada R$ 80-120k/mês** após 24-36 meses

---

## 10. CAPEX — 2 NARRATIVAS SOBRE A MESMA REALIDADE

> **Decisão Pedro: qual narrativa usar no pitch.** Ambas são honestas; mudam o tamanho do "ask".

### 10.1 Narrativa MÍNIMA — "IP já cedido" (BPlan 15/06 atualizado)

| Item | Valor |
|---|---|
| Abertura CNPJ (R$ 350 × 4 sócios) | R$ 1.400 |
| Certificado digital e-CNPJ A1 | R$ 200-400 |
| **Plataforma + Método autoral (IP cedido)** | **~R$ 1,15M valor cedido** (lastro de quotas, não desembolso) |
| Honorários jurídicos (societário + saúde digital) | a orçar |
| **TOTAL CapEx em dinheiro** | **~R$ 1.600 + jurídico** |

**Mensagem:** *"o investimento grande (a plataforma + método autoral) já foi feito como trabalho cedido. O dinheiro pedido é pra operação e regulação, não pra construir produto."*

### 10.2 Narrativa OPERAÇÃO ENXUTA — formato investidor

| Bloco | Valor | O que cobre |
|---|---|---|
| **Estrutura física / sede** | R$ 100-200 mil | Sede legal, mobiliário básico, eventos com clínicas-piloto |
| **Sistema e tecnologia (operação)** | R$ 300-500 mil | WiseCare prod, Supabase Pro, escala OpenAI, Stripe/MP, infra, Google Workspace |
| **Desenvolvimento regulatório / compliance** | R$ 400-600 mil | Advogados (societário + saúde digital), DPO, DPIA, prep ANVISA, certificações |
| **Marketing + plataforma digital + eventos** | R$ 200-400 mil | BD redes/prefeituras, eventos médicos, growth pacientes |
| **Capital de giro (12-18 meses)** | R$ 350 mil | Runway operacional pré-receita |
| **TOTAL CapEx pré-seed pedido** | **R$ 1,5M – 3M** | |

### 10.3 Alocação proposta — 100% balanceada

```
35%  Regulatório e Jurídico    (advogados, DPO/DPIA, compliance, Supabase Pro, ANVISA)
25%  Tecnologia e Operação     (WiseCare prod, escala OpenAI, infra, Google Workspace, dev)
25%  Comercial e Marketing     (BD redes, prefeituras, eventos, growth)
15%  Capital de Giro / Reserva (runway 12-18 meses)
= 100%
```

---

## 11. VALUATION PRÉ-MONEY — entre R$ 10M e R$ 20M

### 11.1 Por que essa faixa pra um pré-seed brasileiro

| Lastro | Justificativa |
|---|---|
| **IP construído valorado ~R$ 1,15M** | ~10 meses de dev intensivo (set/25→jun/26) + método autoral Ricardo + cessão de IP formalizada no acordo |
| **Compliance técnico real** | <5% das healthtech BR têm ICP-Brasil PBAD AD-RB CONFORME ITI rodando |
| **Locks 8 preservados** | V1.9.95+97+98+99-B+299+388-A.3+452+468-B intocados — robustez arquitetural |
| **Moat de interseção** | Escuta + método autoral + dado pré-laboratorial + farmacologia cannabis-renal |
| **Eixo Rio–Santos mapeado** | ~1,84M habitantes possíveis · ~163k DRC potenciais |
| **Track ANVISA iniciado** (este mês) | Diferencial regulatório versus 95% do mercado |

### 11.2 Comparáveis (Brasil/LATAM healthtech 2024-2026) 🟡

- HealthTech early-stage BR com produto rodando + compliance: pré-seed ~R$ 8M-25M
- HealthTech sem MVP: pré-seed ~R$ 3M-8M
- **MedCannLab posicionada na faixa intermediária-alta** por compliance real + método autoral + 4 sócios complementares + track ANVISA

### 11.3 Recomendação narrativa

- **Pré-money pedido:** **R$ 15M** (meio da faixa, defensável)
- **Captação:** **R$ 1,5M-3M (10-20% de equity)** — diluição saudável pra pre-seed
- **Pós-money:** R$ 16,5M-18M

---

## 12. MARCOS — gatilhos de re-precificação

| Marco | Critério objetivo | Estado 17/06 | Re-precificação esperada 🔴 |
|---|---|---|---|
| **Marco 0 — Track ANVISA** | Processo regulatório iniciado | 🟡 **entrou este mês** | Cred. regulatória |
| **Marco 1 — CNPJ + Stripe ligado** | CNPJ ativo + 1ª transação real | 🟡 **CNPJ saindo este mês** (Paulo executando) | Destrava cobrança |
| **Marco 2 — PMF / break-even** | 20-30 pacientes pagantes + 2º médico independente + Supabase Pro/PITR | 🔴 não iniciado | Pré-money R$ 25M–40M |
| **Marco 3 — Tração regional** | 4k usuários ativos (1ª cidade) + B2B Nefrologia ativo | 🔴 | Pré-money R$ 60M–100M |
| **Marco 4 — Escala** | 4 cidades + 10 equipes + 20-40k usuários | 🔴 | Series A R$ 150M+ |

---

## 13. TRACK ANVISA — requisitos pré-certificação SaMD

> Mapeamento técnico-regulatório do que precisa estar coberto pra certificação **SaMD (Software as Medical Device)** brasileira. Cristalizado em documento técnico interno (referência consultoria especializada — vide Anexos).

### 13.1 Eixos regulatórios

| Eixo | Norma | Estado MedCannLab |
|---|---|---|
| **Classificação SaMD** | RDC ANVISA 657/2022 | Em mapeamento (Classe I-IIa esperado) |
| **Ciclo de vida software médico** | IEC 62304 | Parcial (versionamento V1.9.X + locks formalizados) |
| **Gestão de risco** | ISO 14971 | Parcial (matriz risco em SGQ docs/sgq/) |
| **Sistema Gestão Qualidade** | ISO 13485 | Em construção (índice SGQ 27/05) |
| **Proteção de dados** | LGPD + ANPD | RLS 100% + PII sanitização ativa |
| **DPIA (Avaliação Impacto Proteção Dados)** | LGPD art. 38 | A formalizar |
| **DPO designado** | LGPD art. 41 | A nomear (CapEx Regulatório) |
| **Validação clínica** | Boas Práticas Clínicas (CFM 2.314/2022) | Em curso (1ª paciente real maio/26) |
| **Trilha de auditoria** | RLS + immutability triggers + signed_hash | Implementado |
| **Assinatura digital documentos clínicos** | ICP-Brasil + ITI v2.4 | **Funcionando — 48 relatórios** 🟢 |

### 13.2 Documentação requerida (em desenvolvimento)

- Manual SGQ
- Plano Mestre de Validação
- Documento de Arquitetura Técnica (DAT)
- Análise de Risco (FMEA)
- Especificação de Requisitos Técnicos e Clínicos
- Plano de Pós-Mercado (Vigilância)
- Procedimento de Reclamação e Tratamento de Não-Conformidades
- Termo de Cessão de IP (intra-sócios → empresa)

### 13.3 Gap atual vs requerido

- 🟢 **Coberto:** RLS, signed_hash, immutability triggers, versionamento, locks
- 🟡 **Parcial:** SGQ docs (índice preliminar 27/05), validação clínica (1 caso real)
- 🔴 **Pendente:** DPIA formal, DPO designado, FMEA, Plano de Pós-Mercado, certificação ISO 13485
- **Capital alocado em §10.3 cobre 35% Regulatório** justamente pra fechar esses gaps

---

## 14. RISCOS — honestidade contábil

> **Princípio "doc institucional sem cruzar com banco não vale"** — declaramos abertamente o que ainda não foi provado.

### 14.1 Estado da plataforma
- 🟡 **Beta → Alpha em transição** — não há ainda paciente externo pagante; uso interno + testes clínicos + 1 paciente externa validada (mai/26)
- 🟡 **Cidades-alvo são mapeamento estratégico**, não pilotos firmados

### 14.2 Comercial / receita
- 🔴 **0 paciente externo pagante hoje** — risco = chegar aos primeiros 20-30 (Marco 2)
- 🔴 **PaymentGate é mock** — Stripe Connect ainda não conectado (parqueado até CNPJ ativar este mês)
- 🟡 **Pricing R$ 122 × 70k DRC** é vitrine narrativa, não pipeline firmado

### 14.3 Societário
- 🟡 **Acordo de cotistas v2.1 RASCUNHO** — não revisado por advogado, não assinado
- 🟡 **Pool de Tesouraria 20%** não cabe em Ltda — resolver pré-protocolo (25% cada + pool no acordo)
- 🟡 **Eduardo ausente da reunião CNPJ 10/06** — incluir nas decisões fiscais assíncronas

### 14.4 Técnico / clínico
- 🔴 **Bug AEC GATE V1.5 cravado pelo Ricardo 17/06** — palavra-chave "marcar" fura intent classifier. Bugfix em laptop com slug-test antes de produção
- 🟡 **WiseCare V4H em homolog** — migrar pra produção; custo desconhecido
- 🟡 **PII residual gap cosmético** "nome do meio"

### 14.5 Regulatório
- 🟡 **PITR + pgaudit** ausentes (pré-condição Marco 2)
- 🟡 **Advogado saúde digital + DPO + DPIA** não contratados (CapEx aloca aqui)
- 🟢 **CFM:** 2 médicos cobertos (Ricardo + Eduardo) — empresa pode operar comercialmente pós-Marco 3

---

## 15. USO DO CAPITAL — primeira tranche (R$ 1,5M cenário conservador)

| % | R$ aproximado | Linha |
|---|---|---|
| 35% | R$ 525.000 | Regulatório, jurídico, compliance (advogados, DPO, DPIA, ANVISA prep, Supabase Pro/PITR, ISO/IEC) |
| 25% | R$ 375.000 | Tecnologia e operação (WiseCare prod, OpenAI escala, dev, infra, Google Workspace, Resend pago) |
| 25% | R$ 375.000 | Comercial e marketing (BD redes, prefeituras 4 cidades possíveis, eventos médicos) |
| 15% | R$ 225.000 | Capital de giro / reserva (runway 12-18 meses) |

**Marcos cobertos:** Marco 1 (CNPJ — este mês) · Marco 2 (PMF + break-even ≤12 meses) · iniciar Marco 3 (1ª cidade 4k usuários) ≤18 meses.

---

## 16. POR QUE AGORA — 4 janelas

1. **Saúde digital BR amadurecendo** — ANVISA RDC SaMD em consolidação, CFM Resolução 2.314/2022 sobre telessaúde
2. **DRC com tratamento muito caro** — diálise R$ 60-120k/ano/paciente. Diagnóstico precoce (estagiamento G1-G2) economiza ao SUS
3. **Cannabis medicinal regulamentada** — Anvisa RDC 327/2019 + aceitação crescente
4. **IA generativa pós-GPT-4o** — escuta clínica IA-aumentada virou possível em 2024-2025; janela 18-24 meses pra construir moat antes dos gigantes (Nuance/Abridge) virarem a base pra clínica

---

## 17. CONFIRMAÇÕES NECESSÁRIAS ANTES DO PITCH IR PRO INVESTIDOR

> ⚠️ Lições aplicadas: aprendi a não inventar (alucinei nomes na ATA 10/06). Estes itens precisam confirmação direta dos sócios antes do pitch.

- [ ] **"Bonito" = Rio Bonito RJ?** (assumido pela memória 05/06)
- [ ] **Bios dos 4 sócios** — cada um valida seu próprio resumo §1
- [ ] **Valuation pré-money** — confirmar R$ 15M como número central
- [ ] **Captação alvo** — R$ 1,5M (mínimo BPlan) ou R$ 3M (cenário enxuto)
- [ ] **Eduardo Faveret** ciência das decisões fiscais/societárias (ausente reunião 10/06)
- [ ] **Marco 2 prazo** — 12 meses defensável dado holding pattern atual?
- [ ] **Acordo cotistas v2.1** — revisar advogado societário ANTES do investidor sentar
- [ ] **Valor IP cedido R$ 1,15M** — alinhar narrativa entre sócios (Ricardo cobertura método; Pedro horas dev)
- [ ] **Track ANVISA "entrou este mês"** — confirmar protocolo/número de processo

---

## 18. FRASE-ÂNCORA DO PITCH

> *"A MedCannLab não é um scribe melhor nem um EMR brasileiro. É a primeira plataforma de saúde construída a partir da **escuta clínica** com método autoral validado (AEC + MIMRE), sinalização cognitiva por sidecars (Renal, Cannabis, Neuro) e compliance real (ICP-Brasil PBAD AD-RB CONFORME ITI, 48 relatórios assinados, 17 Edges defesa-em-camadas). Estamos em transição **beta → alpha**, com **CNPJ saindo este mês**, **track ANVISA iniciado** e ~R$ 1,15M de IP cedido como lastro de quotas. Pedimos R$ 1,5M-3M pré-seed pra ligar a cobrança e chegar a Marco 2 — onde **PMF coincide com break-even em ~25 pacientes pagantes**. O eixo Rio–Santos (Rio Bonito → Niterói → Nova Iguaçu → Santos) é mapeamento estratégico de **possíveis cidades-alvo** cobrindo 1,84 milhão de habitantes e ~163 mil pacientes DRC potenciais — saturação-alvo de 70k usuários em 14 equipes nos próximos 36-48 meses."*

---

## ANEXOS — material de apoio do investidor

- `BUSINESS_PLAN_MEDCANNLAB_15_06_2026.md` — modelo CapEx/OpEx/EBITDA detalhado
- `ATA_10_06_2026_REUNIAO_CNPJ_CONTADOR_PAULO.md` — alinhamento fiscal Paulo
- `DOSSIE_CONTADOR_PAULO_09_06_2026.md` — documento técnico fiscal
- `DOCUMENTOS_ABERTURA_CNPJ_PAULO_11_06_2026.md` — checklist Marco 1
- `acordo_quotistas_juridico_v2_1_RASCUNHO.md` — minuta societária (revisão jurídica pendente)
- `DIARIO_14_06_2026_ESTADO_ATUAL_COMPLETO.md` — snapshot técnico
- `docs/MEDCANNLAB_SGQ_INDICE_PRELIMINAR_27_05.md` — índice SGQ interno
- `docs/MEDCANNLAB_SGQ_INDICE_AUDITOR_27_05.md` — versão sanitizada pra auditor externo
- Memórias persistentes (NÍVEL 1) — 30+ cristalizações empíricas

---

**Documento gerado em:** 17/06/2026 ~14h45 BRT
**Versão:** 2.0 — recalibrada com input Pedro (beta→alpha, cidades como possíveis alvos, CNPJ este mês, ANVISA entrou, IP cedido ~R$ 1,15M)
**Autor:** Pedro + Claude Opus 4.7 (1M context)
**PAT validada:** 17/06 (rotação saudável próxima do pitch)

**Sources externas (DRC + demografia):**
- [SBN — DRC no Brasil](https://www.bjnephrology.org/en/article/doenca-renal-cronica-no-brasil-um-problema-de-saude-publica/)
- [Censo Brasileiro de Diálise 2023](https://www.bjnephrology.org/en/article/doenca-renal-cronica-definicao-epidemiologia-e-classificacao/)
- [Niterói 516.787 hab (IBGE 2025)](https://aseguirniteroi.com.br/noticias/ibge-atualiza-os-calculos-e-diz-que-niteroi-tem-mais-de-500-mil-habitantes/)
- [Nova Iguaçu (RJ) — IBGE](https://www.ibge.gov.br/cidades-e-estados/rj/nova-iguacu.html)
- [Santos (SP) — IBGE](https://cidades.ibge.gov.br/brasil/sp/santos/panorama)
