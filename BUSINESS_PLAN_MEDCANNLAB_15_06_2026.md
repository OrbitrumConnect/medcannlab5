# 📊 BUSINESS PLAN — MedCannLab 3.0 (esqueleto v0.1)

**Data:** 15/06/2026 · **Status:** rascunho operacional pré-receita · **Base:** dossiê Paulo (09/06) + ATA reunião (10/06) + unit economics medidas via PAT (10/06)

> **Legenda de confiança** (princípio anti-overclaim do projeto):
> 🟢 **empírico** (medido no banco, última verificação 10/06 — PAT desde então rotacionada)
> 🟡 **estimativa fundamentada** (preço/estrutura conhecidos, ainda não realizados)
> 🔴 **projeção/cenário** (receita — **0 pagante externo hoje**)
>
> ⚠️ Números de receita são CENÁRIOS, não previsão. A empresa é **pré-receita** (0 assinatura ativa). Re-validar custos com PAT nova. Câmbio usado: **R$ 5,50/US$** 🟡.

---

## 1. SUMÁRIO EXECUTIVO

MedCannLab é **SaaS de tecnologia em saúde** (plataforma de organização da escuta clínica + intermediação de consulta), **não** clínica/telemedicina. Modelo de receita duplo: **(a) assinatura** (paciente/profissional/aluno) + **(b) intermediação** (take-rate 30% sobre consultas, split 70/30). Produto **construído e com compliance técnico real** (ICP-Brasil, 151 relatórios, 48 assinados 🟢 10/06). Gargalo é **comercial/societário** (CNPJ → cobrança), não técnico. **CapEx baixíssimo** (SaaS, plataforma já existe), **OpEx enxuto** (~R$ 300–1.000/mês), **break-even ~20-25 pacientes pagantes** = Marco 2.

---

## 2. CAPEX — investimento inicial (1x)

| Item | Valor | Conf. |
|---|---|---|
| Abertura CNPJ (R$ 350 × 4 sócios) | **R$ 1.400** | 🟢 (decidido reunião) |
| Certificado digital e-CNPJ (A1) | ~R$ 200–400 | 🟡 |
| Advogado societário (acordo v2.1) | a orçar | 🔴 |
| Advogado saúde digital (CFM/ANVISA/LGPD) | a orçar | 🔴 |
| **Plataforma (Core IA, 17 Edges, frontend, banco)** | **R$ 0 cash** — já construída (entra como **cessão de IP**, lastro das quotas) | 🟢 |
| **Total CapEx cash inicial** | **~R$ 1.600–1.800** + honorários jurídicos | 🟡 |

→ **Mensagem-chave:** o grande "investimento" (a plataforma) já foi feito e é **trabalho/IP cedido**, não desembolso. CapEx em dinheiro é quase só a abertura do CNPJ.

---

## 3. OPEX — custo recorrente mensal

### 3.1 Hoje (pré-receita, uso interno) 🟢/🟡

| Item | Custo/mês | Conf. |
|---|---|---|
| OpenAI (IA Nôa) | ~R$ 120 (US$ ~22) — *US$ 5,96/7d medido* | 🟢 10/06 |
| Supabase | ~R$ 0 (free tier) | 🟢 |
| Vercel | ~R$ 0 (free tier) | 🟢 |
| Resend (email) | ~R$ 0 (free ≤3k/mês) | 🟢 |
| Domínio | ~R$ 8/mês (anualizado) | 🟡 |
| **Total OpEx hoje** | **~R$ 130–150/mês** | 🟡 |

### 3.2 Pós-Marco 2 (cobrança ligada + compliance) 🟡

| Item | Custo/mês | Nota |
|---|---|---|
| OpenAI | escala c/ uso (~R$ 2,37/relatório 🟢) | 2,86 relatórios/usuário/mês 🟢 |
| Supabase **Pro** (PITR/compliance) | ~R$ 140 (US$ 25) | pré-condição Marco 2 |
| Vercel Pro | ~R$ 110 (US$ 20) | quando escalar build |
| Resend pago | ~R$ 110 (US$ 20) | acima de 3k emails |
| WiseCare V4H (vídeo) | a definir (migrar homolog→prod) | 🔴 custo desconhecido |
| Stripe/MP (taxa) | ~3-4% sobre transações | sobre receita, não fixo |
| **Total OpEx base pós-Marco 2** | **~R$ 500–1.000/mês** + variável IA/vídeo/taxas | 🟡 |

→ **Custo por usuário ativo (IA):** ~R$ 6,78/mês (2,86 relatórios × R$ 2,37) 🟢. Paciente paga R$ 33,33 → **margem bruta ~R$ 26/paciente/mês** antes de rateio de infra. **Margem SaaS forte.**

---

## 4. MODELO DE RECEITA (pricing — design, 🟡)

| Produto | Preço | Receita pra plataforma |
|---|---|---|
| Paciente FULL | R$ 33,33/mês | 100% |
| Profissional FULL | R$ 99,90/mês | 100% |
| Aluno FULL | R$ 149,90/mês | 100% |
| AEC isolada | R$ 5/aval ou R$ 35/mês | 100% |
| **Consulta médica** | R$ 350–1.300 | **só 30% (take-rate)** — 70% é do médico, NÃO é receita da empresa |
| Relatório DRC B2B | R$ 122 | 100% (âncora Soc. Nefrologia) |

⚠️ **Regra de honestidade contábil:** na consulta, **só os 30% entram como receita** (a NF de intermediação é sobre os 30%). Nunca contar o GMV de 100% como faturamento.

---

## 5. CENÁRIOS DE RECEITA + EBITDA (🔴 projeção — 0 real hoje)

### Cenário A — Break-even (Marco 2 mínimo)
- 25 pacientes × R$ 33,33 = **R$ 833/mês**
- OpEx ~R$ 700/mês → **EBITDA ~+R$ 130/mês** (cobre o custo)
- **Conclusão: ~20-25 pacientes pagantes já pagam a operação.**

### Cenário B — Tração inicial
- 100 pacientes (R$ 3.333) + 10 profissionais (R$ 999) + 50 consultas/mês × R$ 500 × 30% (R$ 7.500 de take-rate)
- Receita ≈ **R$ 11.832/mês** · OpEx ~R$ 1.500/mês
- **EBITDA ≈ +R$ 10.300/mês** 🔴

### Cenário C — B2B Nefrologia (âncora narrativa, NÃO contratado)
- Relatório DRC R$ 122 × volume (ex.: 500/mês = R$ 61.000/mês)
- **Vitrine de potencial** (Soc. Nefrologia 70k DRC estimados), **não pipeline firmado** 🔴

→ **EBITDA = Receita − OpEx.** Como o CapEx é quase zero e o OpEx é enxuto, o modelo vira **EBITDA-positivo cedo** (já no Cenário A). O risco não é margem — é **chegar aos primeiros pagantes** (Marco 2).

---

## 6. BREAK-EVEN

- OpEx base pós-Marco 2: ~R$ 700/mês 🟡
- Contribuição líquida/paciente: ~R$ 26/mês (R$ 33,33 − R$ 2,37 IA − rateio) 🟡
- **Ponto de equilíbrio: ~25-30 pacientes pagantes** 🟡
- Isso **coincide com a meta do Marco 2** (20-30 pagantes p/ PMF). Ou seja: **atingir PMF ≈ atingir break-even.** História forte pro pitch.

---

## 7. ACTION PLAN (marcos → ações → dependências)

| Marco | Ações | Dependência | Estado |
|---|---|---|---|
| **Marco 1 — CNPJ** | Documentos 4 sócios · 4 decisões (capital/quotas/sede/admin) · Pix R$1.400 · protocolo (Paulo) | reunião sócios | 🟡 em andamento |
| **Pós-CNPJ — Cobrança** | Conta PJ · Stripe Connect (ou MP) · ligar PaymentGate (substituir mock) | CNPJ ativo | 🔴 2-4 sem pós-CNPJ |
| **Marco 2 — PMF** | 2º médico independente · 20-30 pacientes pagantes · Supabase Pro/PITR · compliance (DPO/DPIA) | cobrança no ar | 🔴 |
| **Marco 3 — Escala** | Redes/prefeituras (Prefeitura RJ) · eixo Ensino (Eduardo) · B2B Nefrologia | Marco 2 | 🔴 |

---

## 8. RISCOS FINANCEIROS

- **Receita 100% projeção** — 0 pagante externo hoje; o modelo só se prova com os primeiros 20-30.
- **WiseCare (vídeo) custo desconhecido** — migrar homolog→prod pode adicionar OpEx relevante.
- **Take-rate + sócio-médico operando** = zona cinzenta (vínculo trabalhista) — risco jurídico do dossiê.
- **Pool de Tesouraria** não cabe no contrato social de Ltda — resolver antes do protocolo.
- **Câmbio** — OpEx em USD (OpenAI/Supabase/Vercel) exposto ao dólar.

---

## 9. O QUE FALTA PRA FECHAR OS NÚMEROS REAIS (precisa PAT)
- Custo OpenAI agregado atualizado (último: US$ 5,96/7d em 10/06)
- Nº exato de relatórios/mês e usuários ativos (último: 151 reports, 2,86/usuário)
- Confirmar 0 assinaturas ativas / 0 transação real (último: 1 transação teste R$200)
- Validar payment_status (42 paid manual — não são receita real)

---

**Resumo de 1 linha:** *CapEx ~R$ 1.600 (a plataforma já existe = IP cedido), OpEx ~R$ 130/mês hoje e ~R$ 700/mês pós-escala, break-even em ~25 pacientes pagantes (= Marco 2). O modelo é EBITDA-positivo cedo; o risco é comercial (chegar aos primeiros pagantes), não de margem.*
