# Briefing Paulo — Constituição CNPJ MedCannLab + estrutura jurídica

**Data:** 05/05/2026
**De:** Pedro Henrique Passos Galluf (CTO, sócio fundador)
**Para:** Paulo (Master Group 888 — amigo, parceiro contábil/jurídico)
**Tom:** conversa entre amigos, sem orçamento ainda — primeiro alinhamento conceitual
**Formato:** documento pra Paulo ler com calma, comentar, sugerir, e depois conversar

---

## 1. Contexto pessoal

Paulo, oi! Tudo bem?

Vamos finalmente formalizar a **MedCannLab Tecnologia em Saúde Ltda**. Separei abaixo os pontos onde tua visão **contábil/fiscal** é essencial (CNAEs, regime tributário, capital social, endereço, estrutura inicial do CNPJ). Alguns itens de **governança societária mais profunda** (veto, ESOP, acordo de quotistas, marca INPI) ainda vamos validar com advogado depois — mas quis te dar o contexto completo da estrutura que estamos pensando, pra você não responder no escuro.

**Importante:** estamos em fase **pré-receita / pré-PMF**, com foco em estruturação e validação de modelo. Preferência por estrutura **simples e flexível** neste estágio, evitando complexidade jurídica antecipada sem necessidade operacional.

A ideia é: você lê, marca o que faz sentido, o que não faz, o que muda, e na próxima semana a gente conversa com calma pra fechar o que vai pra JUCERJA. **Não estou pedindo orçamento agora** — primeiro alinhamento, depois proposta.

---

## 2. O que é a MedCannLab

**Plataforma de tecnologia em saúde** que opera 3 eixos:

| Eixo | O que faz |
|---|---|
| **Clínica** | Sistema de prontuário eletrônico + IA (Nôa Esperanza) que estrutura entrevistas clínicas (método AEC) + emissão de prescrições CFM com previsão de assinatura digital ICP-Brasil (em desenvolvimento) |
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
Subtotal sócios     ──  80% (cotas integralizadas na constituição)

Reserva ESOP        ──  20%  (destinada a plano de incentivo futuro)
─────────────────────────
TOTAL               ── 100%
```

### Por que 4×20% + reserva 20% pra ESOP

- **Simetria entre sócios** — ninguém domina (ninguém quer dominar)
- **Reserva 20% destinada a plano de incentivo (ESOP)**, a ser estruturado via acordo de quotistas ou instrumento específico (vesting/phantom shares/contrato de opção), conforme orientação jurídica posterior
- Princípio: "Decisão coletiva, ninguém dilui silenciosamente"

**⚠️ Pergunta pra você Paulo:** sei que "ações em tesouraria" é coisa de S/A, não Ltda. Como você sugere registrar essa reserva de 20% no contrato social inicial? Algumas alternativas que cogitamos:
- a) Não registrar agora — apenas mencionar como intenção, formalizar via acordo de quotistas separado quando contratar primeiro funcionário
- b) Registrar como cotas não integralizadas em nome de sócio fiduciário (Pedro?)
- c) Outra estrutura que você ache mais limpa fiscalmente

Pode ser que essa peça seja melhor com advogado societário depois — só queria sua leitura inicial.

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

## 6. CNAEs propostos (Paulo confirma/sugere — esse ponto é teu)

**Princípio aplicado:** CNAE de **tecnologia limpo**, sem médico/farmacêutico inicialmente. Razões:
- Sócios médicos (Ricardo, Eduardo) atendem em consultórios próprios. MedCannLab é a **infraestrutura SaaS** — não presta serviço médico direto
- CNAE médico (86.50) puxa CRM PJ + fiscalização + responsabilidade direta — complica sem necessidade pré-PMF
- CNAE farmacêutico (47.71) puxa vigilância sanitária + AFE ANVISA + farmacêutico responsável — desnecessário enquanto não comercializamos diretamente

### CNAEs sugeridos pra incluir

| CNAE | Descrição | Função |
|---|---|---|
| **62.04-0-00** | Consultoria em tecnologia da informação | **Principal sugerido** — atividade principal SaaS |
| **62.09-1-00** | Suporte técnico em tecnologia da informação | Secundário — suporte operacional clientes |
| **85.99-6-04** | Treinamento em desenvolvimento profissional e gerencial | Secundário — eixo Ensino (cursos pagos pós-graduação) |

### CNAEs que preferimos **NÃO incluir agora**

| CNAE | Por quê |
|---|---|
| **86.50-0-04** Atividades profissionais saúde | Puxa CRM PJ + fiscalização. Adicionar via alteração contratual depois se necessário |
| **47.71-7-01** Comércio varejista farmacêutico | Puxa vigilância sanitária + AFE + farmacêutico responsável. Sem necessidade operacional pré-PMF |

**Perguntas pra você Paulo:**
1. Os 3 CNAEs sugeridos (62.04 + 62.09 + 85.99) cobrem juridicamente as 3 atividades (SaaS, suporte, cursos)? Falta algum essencial?
2. **Regime tributário recomendado**: Simples Nacional (Anexo III vs V) ou Lucro Presumido? Considerando pré-receita + projeção conservadora primeiros 12 meses
3. Algum CNAE que você sugira preventivamente que esquecemos?
4. Concorda em deixar 86.50 e 47.71 **fora** agora? Ou tem motivo fiscal pra incluir já?

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

**MedCannLab continuaria como nome operacional** (denominação social mantida), sem registro de marca por enquanto. **Pendência:** descobrir se há conflito direto com registro existente que poderia bloquear o uso.

**Pergunta:** você tem indicação de **parceiro especializado em propriedade intelectual** (advogado/escritório de marcas) pra análise aprofundada de conflito marcário INPI? Sei que isso geralmente foge do escopo contábil — só queria saber se você costuma trabalhar com alguém pra esse tipo de demanda. Se não, vou buscar separado.

---

## 9. Cláusulas especiais previstas (essas a gente fecha com advogado depois — só pra contexto)

⚠️ **Esta seção foge do escopo contábil/fiscal.** Vou validar com advogado societário pra peças mais robustas (acordo de quotistas v2.0). Mas quis te dar visibilidade do que estamos pensando, pra você não ser surpreendido depois.

**Pergunta inicial pra você:** você recomenda **centralizar tudo no contrato social** (mais simples, conservador) ou **estruturar acordo de quotistas separado desde o início** (mais flexível pra evoluir sem alteração contratual cara)?

### Cláusulas previstas (a finalizar com advogado)

1. **Cláusula de partes relacionadas** — caso atual: João Vidal é sócio + representante 1Pure (importadora cannabis). Quando MedCannLab fechar parceria com 1Pure, João precisa: declarar interesse, abster-se de voto, transação a fair market value, auditoria anual da operação. Padrão preventivo pra outros casos similares no futuro.

2. **Direito de veto técnico em matérias estritamente AEC** — método AEC é autoria do Dr. Ricardo Valença. Decisões que afetem o método (alteração de prompts da IA Nôa Esperanza, mudança de fluxos clínicos, lançamento de feature clínica) seriam delimitadas com precisão pra não afetar a governança geral da sociedade. Forma exata da cláusula a ser desenhada com advogado pra evitar assimetria de poder estrutural.

3. **Lock-up de 3 anos** — sócios não podem vender quotas pra terceiros nos primeiros 3 anos sem unanimidade. Pra evitar diluição estrangeira em momento frágil pré-PMF.

4. **Direito de preferência (right of first refusal)** — se um sócio quiser sair, oferta primeiro aos outros 3 antes de terceiros.

5. **Tag-along** — proteção minoritários em caso de venda de participação relevante.

6. **ESOP/Growth Pool** — regulamento separado pras 20% reservadas, com vesting padrão mercado tech (4 anos com 1 ano cliff). Estrutura via acordo de quotistas / phantom shares / contrato de opção, conforme orientação jurídica.

7. **Cláusula de dissolução amigável** — fórmula clara de cálculo de saída de sócio.

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

### 🟢 Contábil / fiscal — onde tua palavra é a definitiva

1. **Regime tributário recomendado** — Simples Nacional (Anexo III vs V) ou Lucro Presumido? Qual faz mais sentido pré-receita com projeção conservadora primeiros 12 meses?
2. **CNAEs sugeridos** — os 3 (62.04 + 62.09 + 85.99) cobrem juridicamente as atividades? Algum essencial faltando?
3. **Confirmar deixar 86.50 e 47.71 fora** — concorda? Ou tem motivo fiscal pra incluir?
4. **Capital social R$ 5k vs R$ 10k** — tua leitura prática (banco / credibilidade / fiscal)
5. **Sede / endereço** — qual dos 4 cogitados é mais limpo fiscalmente? Algum CNAE exige inspeção física?
6. **Caminho B Simplificado** (1 CNPJ Tecnologia em Saúde Ltda) — você concorda que essa é a estrutura mais limpa pré-PMF?

### 🟡 Societário / jurídico — pra mapear depois com advogado (mas se você tiver visão, manda)

7. **Reserva 20% ESOP** — registrar no contrato social inicial ou só formalizar via acordo de quotistas posterior?
8. **Acordo de quotistas v2.0** — centralizar tudo no contrato social (conservador) ou estruturar em acordo separado (flexível)?
9. **Indicação de parceiro PI** — você trabalha com algum advogado de marcas pra busca formal INPI MedCann?
10. **Indicação de advogado societário** — caso você não cubra essa parte, tem alguém de confiança pra recomendar?

### 💬 Operacional

11. **Honorários** — quando estivermos alinhados, você me passa proposta. Hoje só quero alinhamento técnico, sem orçamento.

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

> *"Não somos uma startup correndo. Somos 4 sócios construindo uma infraestrutura cognitiva clínica de longo prazo. A estrutura jurídica precisa refletir isso: simétrica, sólida, simples. Tu resolve **como a empresa nasce** (CNPJ + CNAE + regime + capital). Advogado depois resolve **como os sócios não brigam**. Vamos por partes, sem overkill pré-PMF."*

Abraço, Paulo.
**Pedro**
