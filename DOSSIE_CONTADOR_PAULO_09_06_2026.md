# 📑 DOSSIÊ PARA O CONTADOR (Paulo) — MedCannLab

**Reunião:** presencial, sede (casa do Dr. Ricardo) · **Data:** ~10/06/2026
**Preparado:** 09/06/2026 · **Princípio:** números financeiros voláteis **cruzados via PAT/banco** (não estimativa). Itens marcados *(empírico 09/06)* são verdade-de-banco hoje.

> Fontes no repo: `acordo_quotistas_juridico.md` (v2.0) · `acordo_quotistas_juridico_v2_1_RASCUNHO.md` (v2.1) · `INVESTMENT_KIT/` · `CLAUDE.md` · diários 05–07/06.

---

## 1. IDENTIFICAÇÃO DA EMPRESA (a formalizar com Paulo)
| Item | Valor / Estado |
|---|---|
| Razão social (proposta) | **MEDCANNLAB TECNOLOGIA EM SAÚDE LTDA** |
| Capital social | **A DEFINIR com o contador** (acordo sugere R$ 1.000–10.000 nominais) |
| Regime tributário (proposto) | **Simples Nacional — Anexo III (com Fator R)** *(a validar com Paulo)* |
| Natureza | Plataforma de tecnologia em saúde (SaaS + intermediação) — **não** clínica, **não** telemedicina |
| CNPJ | **EM PROCESSO** — protocolo esperado **quarta 10/06/2026** |
| Contador | **Paulo (Master Group 888)** — briefing enviado 05/05 |

---

## 2. SÓCIOS + CAP TABLE
**4 sócios × 20% + 20% Tesouraria** (pool estratégico).

| Sócio | Papel | Aporte principal | Quota |
|---|---|---|---|
| **Pedro H. P. Galluf** | CTO / fundador técnico | Plataforma inteira (Core IA, 17 Edges, frontend, banco 177 tabelas) — **arquitetura de governança cognitiva** (autoral) | 20% |
| **Dr. Ricardo Valença** | Fundador clínico/metodológico | **Método AEC/IMRE**, 4 protocolos Cidade Amiga dos Rins, validação clínica (autoral) | 20% |
| **João Eduardo Vidal** | Fundador comercial/institucional | Parcerias B2B, regulatório, **abertura do CNPJ**, Prefeitura RJ / Soc. Nefrologia | 20% |
| **Dr. Eduardo Faveret** | Conselheiro científico (Ensino/Neuro) | Eixo Ensino, neurologia, cursos | 20% |
| **Tesouraria** | — | Pool: 10% ESOP + 10% Growth (advisors/parcerias), libera por aprovação 75% | 20% |

**Ponto de autoria a discutir** (relevante pro acordo): a IP entra por **naturezas diferentes** — código/infra = cessão; **método clínico (Ricardo) e governança cognitiva (Pedro) = licença + autoria moral preservada**. Autoria fica com o autor; **uso cedido perpétuo à empresa** → nenhum sócio sozinho "tira e mata". (Acordo v2.1 Cláusula 2 + ajuste pendente.)

---

## 3. ACORDO DE QUOTISTAS — estado
| Item | Estado |
|---|---|
| Versão | **v2.1 RASCUNHO** (minuta p/ revisão jurídica) — **NÃO assinado** |
| Cliff / Vesting | 12 meses cliff / 48 meses vesting |
| Recompra ex-sócio | maior entre 3× ARR · valuation última rodada · avaliação M&A; deságio 20% pós-cliff |
| Drag-along | 51% obrigam saída em M&A |
| Pró-labore | sem salário fixo pré-breakeven (Cláusula 8) |
| **4 riscos jurídicos já mapeados** (revisar c/ advogado) | (a) expulsão por R$1,00 pode ser anulada (STJ); (b) non-compete 24m sem contrapartida; (c) take-rate + sócio-médico operando = zona cinzenta vínculo trabalhista; (d) **pool 20% em Tesouraria de LTDA pode ser recusado pela Junta** (CC não prevê quotas próprias em LTDA) |

→ **Item pro Paulo + advogado:** o pool de Tesouraria em LTDA (item d) e o regime de pró-labore.

---

## 4. MODELO DE RECEITA / PRICING (estado: DESIGN, ainda não cobrando)
| Produto | Preço | Status |
|---|---|---|
| Paciente FULL | R$ 33,33/mês (+R$19,90 taxa 1º mês) | design |
| Profissional FULL | R$ 99,90/mês + split consultas | design |
| Aluno FULL | R$ 149,90/mês | design |
| AEC isolada | R$ 5/avaliação **ou** R$ 35/mês ilimitado | aprovado Ricardo |
| Consulta médica | **R$ 350–1.300** (range no banco) | constraint técnico |
| **Split consulta** | **70% médico / 30% plataforma** (automático) | codado |
| Cashback referral | 5% sobre take-rate (6 primeiros meses) | codado |

**Âncora comercial B2B (Soc. Nefrologia, 05/06):** vende **RELATÓRIO** de avaliação DRC **R$ 122 × 70.000 estimados = R$ 8,54M GMV** — *vitrine narrativa, NÃO previsão de receita firme*. Diferencial: estagiamento DRC 1-2 **pré-laboratório** (dado que a Soc. Nefrologia não tem).

---

## 5. 🔴 REALIDADE FINANCEIRA ATUAL *(empírico 09/06 — IMPORTANTE pro contador)*
**A empresa é PRÉ-RECEITA. 100% mock/demo. Faz sentido pré-CNPJ.**
| Métrica | Valor hoje |
|---|---|
| **Subscriptions ativas** | **0** |
| **Transações reais (wallet)** | **1** (teste R$200, 22/04) |
| **Pacientes externos PAGANTES** | **0** (pré-PMF) |
| Stripe / Mercado Pago | **NÃO conectado** (parqueado até CNPJ) |
| payment_status (manual, não-Stripe) | 42 paid · 7 exempt · 4 pending (setado via DB, teste) |
| Pacientes cadastrados | 37 (quase todos teste interno) |
| Profissionais cadastrados | 11 |
| Relatórios clínicos | 151 (48 assinados com ICP-Brasil real) |
| Prescrições CFM | 54 |

→ **Mensagem pro Paulo:** não há faturamento ainda. A cobrança liga **após CNPJ → Stripe/MP → PaymentGate**. Hoje tudo é teste interno.

---

## 6. POSICIONAMENTO FISCAL (tese a validar com Paulo)
- **O que faturará:** (a) **assinatura SaaS** (plataforma de organização/documentação/educação/apoio **não-decisional**) + (b) **intermediação** (take-rate 30% sobre consultas médicas, split 70/30).
- **Tese fiscal:** vende **relatório/serviço de tecnologia**, **NÃO** consulta médica (a consulta é ato do médico, cobrada por ele). *"Faturamento oriundo de relatório de avaliação feito pela plataforma."*
- ⚠️ **Zona cinzenta a discutir:** o duplo-canal (SaaS + intermediação de ato médico) pode ter tratamento fiscal/regulatório ambíguo — **validar enquadramento com Paulo + advogado de saúde**.
- **Compliance já real:** assinatura **ICP-Brasil PBAD AD-RB conforme ITI** (48 relatórios), RLS 100%, PII sanitizada.

---

## 7. VALUATION / MARCOS (contexto, não pra fechar agora)
- **Benchmark:** Cannect vendida ~R$ 60M (não os R$300-500M de chute).
- **Marcos de reprecificação:** Marco 1 (CNPJ+1º pagante, agora) → Marco 2 (PMF, 20-30 pagantes) → Marco 3 (escala, 2+ redes/prefeituras).
- **ARR atual: 0** (pré-PMF). INVESTMENT_KIT pronto (12 docs: pitch Prefeitura RJ, Sequoia, etc).

---

## 8. ✅ O QUE PRECISAMOS DO PAULO (decisões da reunião)
1. **Regime tributário** — Simples Nacional Anexo III (Fator R) é o melhor? Confirmar.
2. **Capital social** — qual valor nominal registrar?
3. **Enquadramento fiscal** do duplo-canal (SaaS + intermediação) — como faturar relatório vs split de consulta.
4. **CNPJ** — status do protocolo (data D 10/06), CNAEs corretos (tecnologia/saúde).
5. **Custo de abertura** — confirmar R$ 1.400 (R$ 350/sócio) + Pix na quarta com contador presente.
6. **Acordo de quotistas** — Paulo revisar os 4 riscos jurídicos (esp. pool Tesouraria em LTDA) antes da assinatura dos 4 sócios.
7. **Pró-labore** — como tratar (sem salário fixo pré-breakeven).

## ⏳ Pendências humanas paralelas (não do Paulo, mas pra agenda)
- Advogado de saúde digital (CFM/Anvisa/LGPD) — **não contratado**.
- DPO + DPIA (LGPD, dado sensível cannabis) — **não formalizados**.
- Seguro RC profissional — não ativo.

---

**Resumo de 1 linha pro Paulo:** *"Plataforma de tecnologia em saúde, pré-receita (0 pagante, tudo teste), com produto e compliance técnico maduros (ICP-Brasil real, 151 relatórios); precisamos do CNPJ (10/06), do regime tributário e do enquadramento fiscal do modelo SaaS+intermediação pra ligar a cobrança."*
