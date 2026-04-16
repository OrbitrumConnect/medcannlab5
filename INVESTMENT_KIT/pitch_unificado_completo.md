# MedCannLab — Pitch unificado completo (uma narrativa só)

**O que é este ficheiro:** roteiro **único** que integra (1) **entrada clínica / Nôa / Ricardo**, (2) **governança TradeVision Core / mesa de risco**, (3) **economia e escala (estilo venture)**. Use numa reunião **mista** (clínico + investidor + operação) ou como **matriz** da qual se cortam versões curtas.  
**Modulares (recortes):** `pitch_entrada_controlada_noa_ricardo.md` · `pitch_deck_medcannlab.md` · `pitch_estilo_sequoia.md`  
**Selagem:** 2026-04-01 — mesma filosofia do sistema (Core + Nôa + RLS; métricas com método ou data room).

---

## Como contar no tempo (atalhos)

| Duração | O que usar |
|--------|------------|
| **~3 min** | §0 (1 frase) + §1 **golpe** + §2 (2 frases) + §3 + §4.1 + **§13 fecho principal** — ou colar **§17.1** (*script pronto*) |
| **~10 min** | Rota §0 → §6 + §8 *moat* + §11 negócio + §10 competição (opcional) + **§13** — ou **§17.2** |
| **Completo (~18–25 min + demo + Q&A)** | §0–§13; demo §7; perguntas §15 + **§17.3** |

---

## §0 — One-liner e propósito

**MedCannLab** é a infraestrutura que **estrutura a decisão médica antes do diagnóstico**.  
Tagline: *“O Stripe da Decisão Clínica.”* / *The Digital Infrastructure for Clinical Decision.*

Não estamos a construir “mais uma health app”. Estamos a construir a **camada** onde apps e clínicas vão depois para **narrativa clínica com trilhos**.

---

## §0B — Filosofia do sistema (15 s — ou apêndice se sala for só clínica)

| Camada | Função |
|--------|--------|
| **Nôa Esperanza** | Interface de **narrativa** com o paciente; **AEC 001** como roteiro clínico. |
| **TradeVision Core** | **Governança**: fase, estado, roteiro selado; o modelo **não** substitui o protocolo à vontade. |
| **Dados** | **Postgres + RLS**; centenas de entidades tipadas; agendamento **atómico**; consentimento com **efeito bloqueante** onde o produto exige. |

**O que nós não somos:** substituição do médico ou do CFM; “certificado” por slides; **números de tração/precisão** em público **sem** metodologia + N + período (data room ou piloto explícito).

---

## §1 — Abertura (impacto + martelo)

**Golpe de domínio (escolher uma — logo nos primeiros 10 s):**

- *Sem governança, IA clínica não é inovação — é **risco jurídico escalável**.*  
- *IA sem governança não escala medicina — **escala risco**.*

**Clínica:** A medicina não precisa de mais **IA solta**. Precisa de **estrutura**.  
**Mesa de risco / board:** *Narrativa clínica sem governança é risco jurídico. Somos a camada que impede isso.*  
**EN (se útil):** *Clinical narrative without governance is clinical liability. We are the layer that prevents that.*

---

## §2 — Problema (sistémico + concreto)

O modelo de consulta foi desenhado para **volume**, não para **precisão** do contexto.

- **Contexto:** grande parte do tempo clínico vira **recolha repetitiva** de dados básicos (ordem de grandeza frequentemente citada na indústria: ~70% — não confundir com KPI próprio; é enquadramento).
- **Na sala:** o médico muitas vezes **começa sem o caso completo** — informação perde-se, o paciente **repete** a história, decisões entram com **contexto incompleto**.
- **Risco:** **IA generativa sem governança** é risco **sistémico** para clínica e paciente.

Isto **não é falha pessoal do médico**. É **falha estrutural** do fluxo.

---

## §3 — Virada (uma frase que fecha o arco)

**A decisão clínica começa antes da consulta.**  
**Se a decisão só começa dentro da consulta, já começou tarde.**  
Quem organiza a **estrutura narrativa** antes do encontro muda o que acontece **dentro** da sala.

---

## §4 — O sistema (Nôa à frente para humanos; Core explícito para risco)

### §4.1 — Nôa (voz clínica · credibilidade Ricardo)

**Nôa Esperanza:** o médico **não deveria** gastar a consulta inteira a **colectar o óbvio** — deve **decidir** com contexto.

- A Nôa conduz a **entrevista pré-consulta** segundo o protocolo **AEC 001**.
- Entrega **história estruturada** e relatório alinhado ao fluxo clínico — **contexto clínico completo** à entrada da consulta.
- **Linha humana (clínica de verdade):** o paciente **deixa de repetir a própria história** — e passa a ser **entendido** antes de cruzar a porta do médico.
- **Chatbots conversam. Nós estruturamos decisão.** A Nôa não é “assistente que opina”; é **camada anterior à decisão clínica**.

### §4.2 — TradeVision Core (inevitável para investidor e para “porque não é chatbot”)

**O produto monetizável não é conversa bonita; é decisão com trilhos.**

- **Core (Edge):** orquestra **fases do AEC**, *nextQuestionHint* determinístico, **roteiro selado** — o LLM **não reescreve** o protocolo à vontade.
- **Separação:** Nôa = **narrativa**; Core = **estado, fase, consistência** entre paciente, prontuário e relatórios.
- **Fala ≠ acção:** quem **controla** o protocolo e o passo clínico é o **sistema**, não improviso do modelo.

---

## §5 — Fluxo real (paciente → médico)

1. Paciente interage com a **Nôa**.  
2. Narrativa organizada pelo **AEC** (respeitado como roteiro).  
3. Sistema **estrutura o caso** para decisão.  
4. **Relatório** e dados no fluxo clínico.  
5. Médico **inicia em modo decisão**, não em modo “recomeçar do zero”.

Integração com **agenda / profissional** onde o produto já liga — **sem prometer** módulos que ainda não estão fechados no roadmap da reunião.

---

## §6 — Prova e execução (disciplina selada)

- **Fluxo AEC ponta a ponta:** Nôa + **TradeVision Core** + persistência em prontuário / relatórios.  
- **Ganho operacional:** menos fricção na pré-consulta vs. anamnese só manual — **com baseline** nos pilotos (**detalhe no data room / NDA**).  
- **Qualidade narrativa:** revisão e instrumentos internos — **percentagens** só com instrumento e auditoria; até lá: **“em validação”**.

*Ordens de grandeza históricas (ex.: volumes de entrevistas, % tempo, métricas internas) — **só** com ficha técnica; evita **reverse due diligence**.*

---

## §7 — Demo (se possível)

**Antes:** paciente do zero; médico em modo recolha.  
**Depois:** estrutura e relatório prontos; consulta em modo **decisão**.

---

## §8 — Defensibilidade (*moat* + *ground truth*)

*"Doctors don’t need more AI. They need structured context."*

- **Rede de dados estruturados:** cada interação bem governada aumenta **custo de substituição** e qualidade do sistema.  
- **Motor deterministicamente balizado:** **Core + RLS + protocolo**, não *prompt* solto.  
- **Posição no fluxo:** entre **dado do paciente** e **decisão do médico**.

**Auditável (engenharia, não slogan):**

- **Postgres + RLS** — políticas por linha; ecossistema de **centenas de entidades** tipadas.  
- **Edge** — JWT / service role onde o domínio exige; **browser vs. servidor** separados.  
- **Agendamento:** `book_appointment_atomic`, slots `get_available_slots_v3` — confiança operacional.  
- **LGPD:** consentimento com **consequência operacional** (ex.: sem aceite onde é obrigatório, **não** seguir o fluxo de encaminhamento).

*Isto **não** substitui certificação formal — **substitui** a narrativa de “IA sem trilhos”.*

**Martelo de categoria:** *Isto não é “mais uma vantagem de produto”. É **mudança de categoria** — Clinical OS em vez de chatbot ou formulário com LLM.*

---

## §9 — Mercado e timing

- **Porquê agora:** mercado cheio de *chatbots*; falta **infraestrutura de governança**. Convergência IA + exigência regulatória.  
- **Wedge comercial** (contexto, não gancho de primeira frase): medicina canabinoide e casos crónicos de alta complexidade como **primeiro cavalo de Tróia** — detalhe em **Go-to-market**, não na abertura se a sala for institucional genética.  
- **TAM / SAM / SOM (enquadramento):** saúde digital global (~ordem $660B TAM citada em literatura de mercado); **SAM** infraestrutura de IA médica / prontuário inteligente; **SOM** liderança em infraestrutura para medicina integrativa no Brasil — **números finos no modelo**, não na boca sem fonte.

---

## §10 — Competição

- **Directo:** prontuários legados — lentos, pouca inteligência de narrativa pré-consulta.  
- **Indirecto:** chatbots de IA — **sem governança**, risco clínico e jurídico.  
- **Nós:** **cérebro determinístico** — controlamos **estrutura e estado** **antes** do médico decidir; **Nôa** para humanos, **Core** para trilhos.

---

## §11 — Modelo de negócio e captação

- **Take-rate ~30%** sobre transações no ecossistema (consultas, cursos — alinhar ao modelo legal/fiscal real).  
- **Híbrido:** recorrência (SaaS) + marketplace; **Stripe Connect** para split.  
- **Escalabilidade:** alavanca de **software sobre o fluxo**, não headcount proporcional a cada consulta. **Margem e LTV** fortes no modelo — **promessa numérica só no financial model.**  

**Round (referência deck):** estratégico **R$ 500k – R$ 1M**, pré-money enquadrado **R$ 6M – R$ 10M** — ajustar à rodada activa antes da reunião.

---

## §12 — Time e Go-to-market

- **Time:** protocolo clínico + engenharia de risco + autoridade científica + escala B2B (adaptar nomes e bios reais no deck desenhado).  
- **GTM:** funil de educação (cursos → infraestrutura); CAC contido via autoridade e redes médicas; **wedge** terapêutico como acima.

---

## §13 — Fechos

**Fecho principal (usar como última frase na maior parte das salas — VC, board misto, internacional):**  
*We are not changing the doctor. **We are changing how the doctor scales.***

**Ecos opcionais (15 s cada — só se a sala pedir “fecho clínico” ou “tese de infra”):**

- **Clínico / Ricardo:** *Hoje resolvemos a **entrada** da decisão com contexto estruturado. Amanhã esta base torna-se **padrão** de narrativa e fluxo — **sem** substituir o médico.*  
- **Institucional:** *We are not competing with healthtechs alone — **we are building the layer they will depend on** for **governed** clinical narrative.*

*Regra prática:* termine com o **fecho principal**; abra com **golpe** do §1.

---

## §14 — Apêndice institucional (one-pager mental)

- **Tese:** Clinical OS = **governança (Core)** + **narrativa (Nôa)** + **dados compartimentados (RLS)** + **take-rate no fluxo**.  
- **Risco que mitigamos:** IA solta; narrativa sem trilhos; dados sem isolamento por perfil.  
- **Data room lite:** fluxograma **AEC ↔ Core**; exemplo **RLS**; **uma linha por KPI**; roadmap regulatório Brasil + limites assumidos no Q&A; **disciplina de persistência** (auditoria SQL amostral — ruído de contexto interno em ordem de grandeza mínima; mitigação na origem + *backfill* documentado se necessário).

---

## §15 — Q&A: perguntas duras (resposta em tese)

| Pergunta | Tese de resposta |
|----------|------------------|
| “Isto é só ChatGPT num formulário?” | **Não.** Protocolo **AEC** governado pelo **Core**; estado e fase **determinísticos**; conversa é **interface**. |
| “Quem responde juridicamente?” | **Médico** e estrutura da clínica; nós entregamos **ferramenta e trilhos**, não **diagnóstico autónomo**. |
| “Mostrem as métricas.” | **Data room** com N, período, método; **sem** isso, falamos **estrutura e piloto**. |
| “Certificação?” | Roadmap explícito; **não** prometemos selo por *slide*. |
| “Por que vocês ganham vs. prontuário X?” | **Entrada da decisão** + **governança** + dados **compartimentados** — categoria **Clinical OS**, não só EMR. |
| **Seguradora (ciber / E&O):** “Qual a superfície de ataque? Dados?” | Postgres **RLS**; Edge com auth; **menos dados sensíveis expostos ao browser**; segregação por função; detalhe técnico e diagrama no **data room**. |
| **Seguradora (operacional):** “E se o modelo inventar sintoma?” | **Roteiro selado + fase Core**; revisão médica onde previsto; **não** prometemos perfeição — prometemos **trilhos + auditabilidade**; percentagens só com método. |
| **Jurídico:** “LGPD / base legal / consentimento?” | Fluxos com **consentimento explícito** e **efeito bloqueante** onde o produto exige; políticas e registo de tratamento no **pacote compliance** — não improviso em *chat*. |
| **VC:** “Por que vocês não são feature do EMR?” | O EMR **arquiva**; nós **estruturamos a narrativa antes da decisão** e **monetizamos o fluxo** — camada **acima** do arquivo, não *plugin* puntual. |

---

## §16 — O que **evitar** na versão unificada

- Abrir com **“IA”**, **“neurociência”** ou **“cannabis”** como **primeira** frase (pode entrar **depois**).  
- **Números bonitos** sem PDF.  
- Parecer **protótipo** se o fluxo real já estiver **em produção**.

---

## §17 — Scripts de fala prontos (execução na reunião)

*Ler em voz alta ou memorizar a estrutura; adaptar nomes próprios.*

### §17.1 — Versão ~3 minutos (afiada)

“*[Golpe — §1]* Sem governança, IA clínica não é inovação — é risco jurídico escalável. A MedCannLab é a camada que impede isso.

Hoje o médico muitas vezes entra sem o caso completo: perde-se informação, o paciente repete a história, e o tempo clínico vira recolha em vez de decisão. **Se a decisão só começa dentro da consulta, já começou tarde.**

Construímos a **Nôa**: o paciente **deixa de repetir a própria história** e passa a ser entendido antes da sala — narrativa estruturada pelo protocolo **AEC**. Por baixo, o **TradeVision Core** governa fase e roteiro: **não é chatbot** — é **narração com trilhos**.

O fecho: ***We are not changing the doctor. We are changing how the doctor scales.*** Métricas e detalhe técnico: **data room**, sempre com método.”

### §17.2 — Versão ~10 minutos (fluida)

“*[Golpe]* IA sem governança escala risco, não medicina. A MedCannLab estrutura a **decisão antes do diagnóstico** — Clinical OS, não mais uma app.

**Problema:** fluxo desenhado para volume; contexto incompleto na primeira troca; IA genérica é passivo para clínica e paciente. **Virada:** quem organiza narrativa **antes** muda o que acontece **dentro** da sala.

**Produto:** **Nôa** conduz pré-consulta no **AEC**; relatório e caso estruturados; o paciente **sentido**, não só interrogado. **Core** em Edge: estado determinístico, roteiro selado — **fala ≠ governo do protocolo**.

**Prova:** fluxo ponta a ponta em produção; ganhos operacionais com **baseline** sob NDA; qualidade narrativa **em validação** onde ainda não há papel.

**Defensibilidade:** Postgres com **RLS**, agendamento atómico, consentimento com efeito operacional — **mudança de categoria**, não feature puntual.

**Negócio:** take-rate no **fluxo** clínico + Stripe Connect; escalamos com software sobre transacção.

**Fecho:** ***We are not changing the doctor. We are changing how the doctor scales.*** Eco opcional: hoje a **entrada** da decisão; amanhã o **padrão** de narrativa governada.”

### §17.3 — Q&A pesado (taquiograma — seguradora / jurídico / VC)

- **Superfície de risco:** separar **browser / Edge / base**; RLS por perfil; auditoria de fluxo AEC; sem “dump” clínico em canal inseguro.  
- **Alucinação / erro de modelo:** mitigação é **governança**, não promessa de 100%; protocolo **não reescrito** pelo LLM onde está selado; humano na decisão final.  
- **Responsabilidade civil:** produto é **infraestrutura**; decisão clínica é **sempre** do profissional credenciado; contratos e termos claros (jurídico local).  
- **Subscrição em diligence:** entregar **diagrama**, amostra de política RLS, e lista de **limites assumidos** — transparência ganha confiança com Gallagher-class.  
- **VC “é só wrapper?”:** wrapper não impõe **estado**, **AEC**, **RLS** e **take-rate** no mesmo grafo operacional — isso é **sistema**, não *skin*.

---

*Este documento **não** substitui os três modulares — **consolidá-os**. Quando a reunião for só de um tipo de interlocutor, use o recorte correspondente para não diluir o foco.*
