# Briefing Paulo — Constituição CNPJ MedCannLab + estrutura jurídica

**Data:** 05/05/2026
**De:** Pedro Henrique Passos Galluf (CTO, sócio fundador)
**Para:** Paulo (Master Group 888 — amigo, parceiro contábil/jurídico)
**Tom:** conversa entre amigos, sem orçamento ainda — primeiro alinhamento conceitual
**Formato:** documento pra Paulo ler com calma, comentar, sugerir, e depois conversar

---

## 1. Contexto pessoal

Paulo, oi! Tudo bem?

Vamos finalmente formalizar a **MedCannLab Tecnologia em Saúde Ltda**. Te mandei isso já bem mastigado pra você ler com tempo, comentar, sugerir e a gente bater cabeça depois. **Não estou pedindo orçamento agora** — primeiro quero te alinhar com tudo que decidimos internamente entre os 4 sócios e ouvir tua leitura técnica.

A ideia é: você lê, marca o que faz sentido, o que não faz, o que muda, e na próxima semana a gente conversa com calma pra fechar o que vai pra cartório/JUCERJA.

---

## 2. O que é a MedCannLab

**Plataforma de tecnologia em saúde** que opera 3 eixos:

| Eixo | O que faz |
|---|---|
| **Clínica** | Sistema de prontuário eletrônico + IA (Nôa Esperanza) que estrutura entrevistas clínicas (método AEC) + emissão de prescrições CFM com assinatura digital ICP-Brasil |
| **Ensino** | Cursos de pós-graduação cannabis medicinal + Arte da Entrevista Clínica + simuladores clínicos |
| **Pesquisa** | Fórum colaborativo entre profissionais + base de conhecimento + projeto Cidade Amiga dos Rins |

**Posicionamento estratégico:**
> "Infraestrutura Cognitiva Clínica orientada pela Escuta — método AEC do Dr. Ricardo Valença, operacionalizado em escala digital."

**Estágio atual:**
- Plataforma deployada em produção (medcannlab.com.br)
- 39 usuários cadastrados (sócios + amigos + testes internos)
- **0 paciente externo pagante ainda** — pré-PMF
- Faturamento estimado próximos 12 meses: incerto, modelagem inicial conservadora

---

## 3. Os 4 sócios

| Nome | Papel | CPF/Doc | Contribuição |
|---|---|---|---|
| **Pedro Henrique Passos Galluf** | CTO — Arquiteto técnico | (a confirmar) | Plataforma construída + manutenção + governança técnica |
| **Dr. Ricardo Valença** | Coordenador Científico | (a confirmar) | Método AEC autoral + 40 anos prática clínica + 2.000+ avaliações + autoridade científica |
| **Dr. Eduardo Faveret** | Diretor Médico | (a confirmar) | Direção médica neurologia + governança clínica |
| **João Eduardo Vidal** | Comercial / Institucional | (a confirmar) | Relacionamento institucional + parcerias (caso atual: 1Pure importadora) |

**Estado civil + regime de bens:** cada sócio precisa providenciar (Paulo, podemos coletar via formulário antes da reunião formal?).

---

## 4. Estrutura societária proposta — "Caminho B Simplificado"

### Tipo jurídico
**Sociedade Empresária Limitada (Ltda)** — definida no Livro Mestre v1.0.

### Cap table proposto

```
Pedro Galluf       ──  20%
Dr. Ricardo Valença ──  20%
Dr. Eduardo Faveret ──  20%
João Eduardo Vidal  ──  20%
─────────────────────────
Subtotal sócios     ──  80%

Tesouraria/ESOP     ──  20%  (reserva pra futuros funcionários, growth pool, parceiros estratégicos)
─────────────────────────
TOTAL               ── 100%
```

### Por que 4×20% + 20% tesouraria

- **Simetria entre sócios** — ninguém domina (ninguém quer dominar)
- **Tesouraria** permite emitir cotas pra incentivos sem diluir os 4 (ESOP simulado em Ltda via cláusula de quotas preferenciais OU regulamento de plano de incentivo, como você indicar)
- Princípio: "Decisão coletiva, ninguém dilui silenciosamente"

### Quórum proposto (a confirmar com você)
- **Decisões ordinárias**: maioria simples (>50%)
- **Decisões qualificadas** (alteração contratual, dissolução, novos sócios, distribuição de lucros): **75%** (3 dos 4 sócios)
- **Veto individual em decisões clínicas**: Ricardo (método AEC autoral) — cláusula específica

---

## 5. Capital social

**Opções em discussão:**
- **R$ 5.000,00** — mínimo simbólico, desbloqueia CNPJ rápido
- **R$ 10.000,00** — mais robusto pra apresentação a parceiros/bancos

**Pergunta pra você Paulo:** considerando que estamos pré-receita e queremos abrir conta PJ + Stripe Connect / Mercado Pago em 1-2 meses, qual valor faz mais sentido fiscalmente? Tem implicação tributária ou só simbólica?

**Integralização proposta:** integralização total na constituição (não diferida), proporcional aos 80% dos 4 sócios. Tesouraria fica como cotas em tesouraria sem integralização inicial (ou conforme você sugerir).

---

## 6. CNAEs propostos (Paulo confirma/sugere)

**Princípio aplicado:** CNAE de tecnologia, NÃO médico inicialmente. Razão: sócios médicos (Ricardo, Eduardo) atendem em consultórios próprios. MedCannLab é a infraestrutura SaaS — não presta serviço médico direto. Reduz fiscalização ANVISA + CFM no CNPJ inicial.

| CNAE | Descrição | Função | Status |
|---|---|---|---|
| **62.04-0-00** | Consultoria em tecnologia da informação | **Principal sugerido** — atividade principal SaaS | A confirmar |
| **62.09-1-00** | Suporte técnico em tecnologia da informação | Secundário — suporte operacional clientes | A confirmar |
| **86.50-0-04** | Atividades de profissionais da saúde NCC | **A AVALIAR com você** — só se necessário pra emissão de NF de serviço médico futura | Pedro pediu sua opinião |
| **85.99-6-04** | Treinamento em desenvolvimento profissional e gerencial | Secundário — eixo Ensino (cursos pagos pós-graduação) | A confirmar |
| **47.71-7-01** | Comércio varejista de produtos farmacêuticos sem manipulação | **A AVALIAR com você** — só se MedCannLab vier a comercializar produtos cannabis (caso 1Pure) | Pedro pediu sua opinião |

**Pergunta pra você sobre 86.50-0-04 e 47.71-7-01:**
- Adicionar agora preventivamente (mesmo sem usar) pra evitar alteração contratual depois? Ou deixar fora e adicionar quando precisar?
- Implicação fiscal de cada um? Algum deles puxa MEI/Simples diferente?

**Regime tributário pretendido:** Simples Nacional (Anexo III ou V, conforme você analisar) ou Lucro Presumido — depende do faturamento projetado e da divisão entre os anexos.

---

## 7. Sede / endereço

**Em discussão entre os sócios:**
- a) Endereço residencial Pedro Galluf
- b) Endereço residencial Dr. Ricardo Valença (Rio de Janeiro)
- c) Endereço comercial / coworking (custo extra)
- d) Endereço virtual (alguns CNAEs aceitam)

**Pergunta:** qual sua recomendação considerando os CNAEs acima? Algum deles exige inspeção sanitária / vigilância de endereço?

---

## 8. Marca INPI — decisão paralela (não-bloqueante pro CNPJ)

Estamos planejando registrar **"IMRE"** como marca no INPI:

```
Classe 42  — Serviços tecnológicos
Classe 44  — Serviços médicos/saúde (auxiliares)
Classe 41  — Educação/treinamento
─────────────────────────────────
Custo estimado: R$ 1.065 (3 classes via INPI direto)
Status: a executar após CNPJ
```

**Por que IMRE e não MedCannLab:**
- Busca prévia INPI: "NOA" inviável (Docplanner registrou), "AEC" inviável (A&C Associados RJ), "IMRE" livre
- "MedCann" pode ter conflito com outra titular (Andreia — em apuração)
- IMRE = "Motor Incentivador Mínimo do Relato Espontâneo" — conceito autoral Ricardo, único, registrável

**MedCannLab continuaria como nome operacional** (denominação social mantida), sem registro de marca por enquanto. **Pendência:** verificar com você se há conflito direto com registro existente que poderia bloquear uso.

**Pergunta:** você consegue rodar busca formal INPI da situação atual de "MedCann" + "MedCannLab" pra a gente saber se há risco real de oposição/cancelamento? Antes de gastar com IMRE, quero confirmar se MedCannLab pode operar tranquilo ou se precisaríamos eventualmente fazer rebranding.

---

## 9. Cláusulas especiais que pediríamos no contrato social + acordo de quotistas

(Lista pra você analisar e sugerir formato — algumas talvez não caibam no contrato social e sim no acordo de quotistas separado)

1. **Cláusula de partes relacionadas** — caso atual: João Vidal é sócio + representante 1Pure (importadora cannabis). Quando MedCannLab fechar parceria com 1Pure, João precisa: declarar interesse, abster-se de voto, transação a fair market value, auditoria anual da operação. Padrão preventivo pra outros casos similares no futuro.

2. **Veto clínico individual do Ricardo** — método AEC é autoria dele. Decisões que afetem o método (alteração de prompts da IA Nôa Esperanza, mudança de fluxos AEC, lançamento de feature clínica) precisam aprovação explícita Ricardo, mesmo com 75% dos outros sócios votando favor.

3. **Lock-up de 3 anos** — sócios não podem vender quotas pra terceiros nos primeiros 3 anos sem unanimidade. Pra evitar diluição estrangeira em momento frágil pré-PMF.

4. **Direito de preferência (right of first refusal)** — se um sócio quiser sair, oferta primeiro aos outros 3 antes de terceiros.

5. **Tag-along** — se sócio majoritário (não há, mas hipoteticamente >40%) vender, minoritários têm direito de vender nas mesmas condições.

6. **ESOP/Growth Pool** — regulamento separado pras 20% em tesouraria, com vesting padrão mercado tech (4 anos com 1 ano cliff). A definir critérios de outorga.

7. **Cláusula de dissolução amigável** — fórmula clara de cálculo de saída de sócio (valuation com base em métrica X — receita anual, EBITDA, ativo líquido — você sugere).

---

## 10. O que precisamos de você (próximos passos sugeridos)

### Antes de marcar conversa formal
- [ ] Você ler este documento com calma
- [ ] Marcar pontos onde discorda, sugere ajuste, ou precisa mais info
- [ ] Rodar busca INPI formal de "MedCann" e "MedCannLab" (situação Andreia)
- [ ] Confirmar/ajustar lista de CNAEs (especialmente 86.50 e 47.71)
- [ ] Indicar regime tributário recomendado (Simples vs Presumido)
- [ ] Indicar capital social recomendado (R$ 5k vs R$ 10k)

### Depois (quando estiver alinhado)
- [ ] Conversa de 1h com você (online ou presencial) pra fechar pendências
- [ ] Lista de documentos que cada sócio precisa providenciar (RG, CPF, comprovante endereço, certidões, declaração estado civil + regime de bens)
- [ ] Reunião formal 4 sócios (ata) — pré-protocolo JUCERJA
- [ ] Protocolo JUCERJA + acompanhamento até CNPJ emitido
- [ ] Acordo de quotistas v2.0 separado (se você indicar especialista parceiro pra essa parte específica)

### Cronograma desejável
- **Semana 1**: você lê + comenta + responde
- **Semana 2**: conversa de alinhamento (1h) + ajustes finais
- **Semana 3**: documentação reunida + ata 4 sócios assinada
- **Semana 4-5**: protocolo JUCERJA + emissão CNPJ
- **Total estimado**: 4-6 semanas desde hoje até CNPJ na mão

---

## 11. Pontos abertos pra debater contigo

Lista enxuta dos "tá decidido mas pode mudar com tua opinião":

1. **Caminho B Simplificado** (1 CNPJ Tecnologia em Saúde) vs alternativas — você concorda que essa é a estrutura mais limpa pré-PMF?
2. **Cap table 4×20% + 20% tesouraria** — formato faz sentido juridicamente em Ltda? Tem risco fiscal de cotas em tesouraria?
3. **Sem CNAE médico inicial** — você concorda? Ou preventivamente colocar 86.50?
4. **Capital R$ 5k vs R$ 10k** — sua leitura técnica
5. **Sede** — qual endereço dos 4 cogitados é mais limpo fiscalmente?
6. **Acordo de quotistas v2.0** — você assume essa peça também ou sugere especialista parceiro?
7. **Honorários** — quando estivermos alinhados, você me passa proposta. Hoje só quero entender o escopo + sua leitura técnica.

---

## 12. Anexos disponíveis (te mando se quiser)

- **Livro Mestre v1.0** — documento canônico interno com todas as decisões estratégicas (60+ páginas)
- **Diários operacionais** — registros do dia a dia da plataforma desde 04/05
- **WhatsApp Integration Blueprint** — arquitetura prevista pós-CNPJ (pra contexto)
- **Partnership Framework** — modelo de parcerias (1Pure como caso atual)
- **Estratégia Marca + CNPJ** — análise INPI feita

Me avisa o que quiser que eu mande.

---

## Frase âncora

> *"Não somos uma startup correndo. Somos 4 sócios construindo uma infraestrutura cognitiva clínica de longo prazo. A estrutura jurídica precisa refletir isso: simétrica, sólida, simples. Você lê, sugere, a gente conversa, fecha junto."*

Abraço, Paulo.
**Pedro**
