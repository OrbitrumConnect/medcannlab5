# 🚀 PITCH DECK: MEDCANNLAB — THE CLINICAL AI INFRASTRUCTURE
**"O Stripe da Decisão Clínica."**

---

> ### VERSÃO SELADA — INSTITUCIONAL / FILOSOFIA DO SISTEMA
>
> | | |
> |---|---|
> | **Arquitetura** | **TradeVision Core** = governança de fase, protocolo AEC, estado determinístico; **Nôa** = interface de narrativa com o paciente. |
> | **Dados** | Postgres com **RLS**, schema de **centenas de entidades** tipadas; agendamento via RPCs atômicas; Edge com auth no padrão servidor. |
> | **Compliance narrativo** | Consentimento e fluxos clínicos com **efeito bloqueante** onde o produto exige — alinhado ao código, não só ao discurso. |
> | **O que este deck não faz** | Não substitui médico nem CFM; não promete certificação; **cifras de tração/precisão** na boca ou em slide público **só** com metodologia + N + período (ou sob NDA no data room). |
>
> **Selagem:** 2026-04-01 — deck hero + apêndice mesa de risco; pronto para board / corporate venture com narrativa **inevitável**, não inflada.

---

## 🟦 SLIDE 1: ONE LINER
**MedCannLab é a infraestrutura de IA que estrutura a decisão médica antes do diagnóstico.**
"We are not building a medical app. We are building the infrastructure layer that medical apps will depend on."

---

## 🟥 SLIDE 2: O PROBLEMA (RISCO SISTÊMICO)
O modelo atual de consulta médica foi desenhado para volume, não para precisão.
*   **Perda de Contexto Clínico:** 70% do tempo é gasto coletando dados básicos repetitivos.
*   **Decisões Subótimas:** O médico entra na sala sem a profundidade necessária.
*   **Risco Jurídico e Clínico:** IA generativa sem governança é um perigo sistêmico na saúde.

### Tese de domínio (-board / seguradora / conselho)
**PT:** *Narrativa clínica sem governança é risco jurídico.* **Somos a camada que impede isso.**  
**EN:** *Clinical narrative without governance is clinical liability.* **We are the layer that prevents that.**

---

## 🟩 SLIDE 3: A SOLUÇÃO (CLINICAL OS)
**Nôa Esperanza: O médico não coleta dados. Ele toma decisões.**
*   "Nós não ajudamos o médico a perguntar melhor. Nós eliminamos a necessidade de perguntar o básico."
*   A Nôa conduz a entrevista pré-consulta via protocolo **AEC 001**.
*   Entrega a história do paciente estruturada e pronta para a decisão terapêutica.

---

## 🛡️ SLIDE 3B: A CAMADA QUE VENDE (TRADEVISION CORE — GOVERNANÇA)
**O produto monetizável não é “chat bonito”; é decisão clínica com trilhos.**
*   **TradeVision Core (Edge):** orquestra fases do **AEC 001**, *nextQuestionHint* determinístico, modo **roteiro selado** (verbatim) onde o LLM não reescreve o protocolo à vontade.
*   **Separação clara:** Nôa = **interface de narrativa**; Core = **governança de estado, fase e consistência** entre paciente, prontuário e relatórios.
*   **O que isso significa para risco / compliance:** menos “IA solta”; mais **fluxo auditável** — alinhado a mesa de risco e a operadores que temem *AI hype* sem trilhos.

---

## 🧱 SLIDE 4: PROVA REAL (EXECUTION)
Não é tese; é **infraestrutura em produção** com tração mensurável — **números absolutos e percentuais** ficam no **data room** com definição de numerador, denominador, N e período (ou rotulados explicitamente como piloto).

*   **Fluxo AEC de ponta a ponta:** Nôa (narrativa) + **TradeVision Core** (governança de fase e roteiro) + persistência em prontuário / relatórios.
*   **Ganho operacional:** menos fricção na coleta pré-consulta vs. anamnese totalmente manual — **medido com baseline** nos pilotos (detalhe sob NDA).
*   **Infraestrutura proprietária:** governança clínica nativa, **Postgres + RLS**, Edge com orquestração do protocolo — o que investidor técnico pode inspecionar como *engenharia*, não como slogan.
*   **Qualidade narrativa:** revisão médica e instrumentos internos onde o produto prevê — **qualquer “% de precisão”** só após instrumento e auditoria documentados; até lá: *“em validação”*.

### 📎 Nota de credibilidade (due diligence / board)
*   **Versão selada:** o slide hero **não** carrega percentuais de precisão clínica nem volumes redondos **sem** anexo — isso evita *reverse due diligence* em mesas tipo seguradora / institucional. Ordens de grandeza históricas (**ex.: +1,2k entrevistas, ~65% tempo, ~92% métrica interna**) permanecem válidas **somente** com ficha técnica anexa ou no verbal com transparência total sobre o método.

---

## 🔒 SLIDE 5: DEFENSIBILIDADE (THE DATA MOAT)
"Doctors don’t need more AI. They need structured context."
*   **Efeito de Rede de Dados:** Cada nova interação melhora a estrutura do sistema, criando um fosso de dados clínico inalcançável.
*   **Motor Determinístico:** Diferente da IA comum, operamos sob balizas de infraestrutura rígidas.
*   **Ownership do Fluxo:** Nós sentamos entre o dado do paciente e a decisão do médico.

### 📎 *Ground truth* técnico (o “peso invisível” — auditável no repo)
*   **Postgres + RLS:** schema clínico de **ordem de grandeza centenas de entidades** (tabelas, views e contratos tipados no client) — *não é slide de marketing; é engenharia de dado com políticas por linha.*
*   **Edge Functions** com JWT / service role onde o domínio exige (ex.: telemetria, sessões) — padrão documentado na timeline institucional.
*   **Agendamento atômico** (`book_appointment_atomic`, slots `get_available_slots_v3`) — **idempotência operacional** onde double-book quebra confiança.
*   **LGPD / consentimento:** fluxos de avaliação com **consentimento explícito** e consequência operacional (*sem consentimento, sem encaminhar relatório*) — narrativa alinhada ao código de conduta, não só ao discurso.
*   **Isso não substitui** certificação formal — **substitui “IA sem trilhos”** na conversa com seguradora / corporate venture / mesa de risco.

---

## 💰 SLIDE 6: BUSINESS MODEL (MONETIZING THE FLOW)
"We don’t charge for software. We monetize the clinical flow."
*   **Take-Rate de 30%** sobre toda transação dentro do ecossistema (Consultas e Cursos).
*   Modelo híbrido SaaS (Recorrência) + Marketplace (Escala).
*   Split automático via Stripe Connect, garantindo liquidez e eficiência fiscal.

---

## 📈 SLIDE 7: WHY NOW? (URGÊNCIA DE MERCADO)
"A IA chegou antes da governança. O mercado precisa de confiança."
*   **Janela de Oportunidade:** O setor de saúde exige agora infraestrutura confiável que as Big Techs ainda não oferecem de forma verticalizada.
*   **Eficiência Operacional:** É a maior demanda dos gestores de clínicas hoje.

---

## 🧑🚀 SLIDE 8: O TIME (FULL STACK DOMAIN)
Time fundador com domínio completo da stack: clínica, engenharia e distribuição.
*   **Clínica:** Expertise na dor real e no protocolo médico proprietário.
*   **Engenharia:** Arquitetura pesada e funcional, construída in-house.
*   **B2B & Científico:** Autoridade nacional para distribuição em escala real.

---

## 🎯 SLIDE 9: GO TO MARKET (THE INITIAL WEDGE)
A estratégia de entrada para dominar a categoria:
*   **Wedge Inicial:** Medicina canabinoide e casos crônicos de alta complexidade.
*   **Funil de Educação:** Cursos atraem o profissional para a infraestrutura.
*   **CAC Baixo:** Distribuição via autoridade e redes médicas integradas.

---

## 💸 SLIDE 10: CAPTAÇÃO (STRATEGIC ROUND)
**Round Estratégico: R$ 500k – R$ 1M | Valuation Pré-Money: R$ 6M – R$ 10M**
"Não estamos pedindo capital; estamos selecionando investidores estratégicos que entendem infraestrutura para acelerar nossa distribuição."

---

**Veredito:** We are not competing with healthtechs. **We are building the layer they will depend on.**

---

## 📎 APÊNDICE — “MESA DE RISCO” (ONE-PAGER / PÓS-REUNIÃO)
Uso: e-mail ou anexo — não precisa ir no deck público.
*   **Tese em uma frase:** *Clinical OS* = narrativa estruturada + governança de estado (Core) + dados com RLS + fluxo comercial clínico (take-rate) — não “mais um chatbot”.
*   **O que NÃO somos:** diagnóstico por IA genérica sem responsável; substituto do CFM; promessa de precisão clínica **sem** validação documentada quando o investidor pedir *show me the method*.
*   **Data room lite (checklist selado):** (1) fluxograma AEC ↔ Core, (2) exemplo de política RLS por módulo sensível, (3) **uma linha por KPI** (definição, N, período, responsável), (4) roadmap regulatório Brasil + limitações assumidas no Q&A, (5) **disciplina de persistência:** amostra de auditoria SQL (ex.: ruído de contexto interno em `patient_medical_records` — ordem de grandeza **menos de 0,2%** na resposta IA no histórico auditado; correção na origem no código + opcional *backfill* pontual documentado).

**Selagem final:** deck + este apêndice = narrativa **institucional** alinhada à filosofia do sistema (**governança primeiro, narrativa depois, dados compartimentados, métricas com método**).

**Roteiro paralelo (voz clínica / Nôa / Ricardo):** `pitch_entrada_controlada_noa_ricardo.md` — *entrada controlada* (produto real hoje) + transição para visão de infraestrutura; Nôa em primeiro plano para médicos, clínicas e early adopters, sem contradizer este deck.

**Pitch único (tudo integrado):** `pitch_unificado_completo.md` — narrativa contínua Nôa + Core + mercado + fechos + Q&A; use em sala mista ou como matriz para cortar versões 3 min / 10 min.
