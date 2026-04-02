# Timeline institucional + diários — MedCannLab (Livro Magno & realidade)

## TL;DR para IA *(leitura rápida — não substitui §9 runbook nem a bibliografia)*

- **Produto:** Clinical OS — Nôa (narrativa/AEC) + TradeVision Core (governança) + Supabase (dados/RLS); eixos clínica / ensino / pesquisa.  
- **Estado (narrativa + doc):** ~**97%** citado no diário 30/03 como **meta**; gates reais = **§9** (Fases B–I + tabela **9.B**).  
- **Riscos que mais costumam morder:** vídeo **WebRTC sem TURN** no código atual (só STUN) · **payments não validados** em produção · **dualidade** `users` / `pacientes` · políticas RLS a **revalidar** após migrações.  
- **Regra de ouro:** *fala ≠ ação*; LLM subordinado ao Core; ver **§0.1** antes de sugerir atalhos.

---

**Versão:** 2.4 — §9 como runbook de go-live + anexo sugestão GPT  
**Compilação:** 01 de abril de 2026  
**Escopo:** Entrada única para humanos e para **assistentes de IA**: ordem de leitura, **timeline**, síntese **técnica e filosófica** por marco, **pitch / pricing / societário**, **pilares humanos** (AEC, arquitetura, ciência, institucional), **runbook de go-live** (§9: fases, registo **9.A**, deps **9.B**, riscos **9.C**), **erros e lições**, **foco**. Cruzamento com o repositório (`MedCannLab` / `amigo-connect-hub-main`).

**Nota:** `DIARIO_31_03_2026.md` segue opcional; o **selo de 01/04** está em `DIARIO_01_04_2026.md`. **Nunca** colar credenciais ou chaves neste documento.

**“Está tudo completo neste único arquivo?”** Não — e não precisa estar. Este ficheiro é **índice mestre + síntese**; a história integral da montagem do app, integrações, acertos e erros está **distribuída** pelos `DIARIO_*`, pelo Livro Magno e por `docs/guides/`. Para auditoria fina, a IA deve seguir a **bibliografia §2** após ler este documento.

---

## 0. Instrução para a IA (e para você) na próxima sessão

Quando retomar o app, peça explicitamente: *“Leia `docs/TIMELINE_LIVRO_MAGNO_DIARIOS_CONSOLIDADO.md` e os documentos da bibliografia §2 que ele aponta.”*

Este arquivo foi desenhado para que a IA entenda em **uma passada**:

1. **O que somos** — Clinical OS: Nôa (narrativa) + TradeVision Core (governança) + Supabase (dados/RLS) + eixos clínica/ensino/pesquisa; **quem sustenta o sentido** do produto está mapeado em **§4.4** (Ricardo — AEC/escuta clínica; Pedro — arquitetura; Eduardo Faveret — clínica/ensino/eixo científico; João Eduardo Vidal — institucional).  
2. **Por que existimos** — problema de contexto clínico, risco de IA sem governança, inevitabilidade de padrão com dados estruturados (tese do pitch).  
3. **O que foi feito** — ordem cronológica e por diário (§6–7).  
4. **O que quebrou e como corrigimos** — invariantes, falsos positivos de intent, RLS, vídeo (§8).  
5. **Onde estamos** — pré–go-live operacional; **runbook §9** concentra snapshot, dependências, riscos e passos **marcáveis**.  
6. **Para onde vamos** — beta, CNPJ, Stripe, DNS, testes (§9–10).

O **Livro Magno** (`LIVRO_MAGNO_DIARIO_UNIFICADO.md`, `LIVRO_MAGNO_DOCUMENTO_FINAL_CONSOLIDADO.md`) é a **constituição narrativa**; **este** arquivo é o **índice operacional + história aplicada ao repo**.

### 0.1 Protocolo de ação da IA *(operacional — sem bypass)*

Use este bloco quando for **debugar ou recomendar correções**. Prioridade: **verdade do repo + Supabase**, não suposição de que “já está em produção”.

| Se o sintoma for… | Olhar primeiro… |
|-------------------|------------------|
| **WebRTC** / vídeo P2P não conecta | `useWebRTCRoom.ts` (signaling Supabase Realtime, `iceServers`); hoje só **STUN** público — redes restritas podem falhar **sem TURN**. Testar **fallback** WiseCare em `WiseCareProvider.ts` / `VideoCall.tsx`. |
| **WiseCare** / callee sem sessão / log faltando | Edge `wisecare-session`; RLS em `video_call_quality_logs`; JWT + **service role** onde o doc §8 indica. |
| **AEC** / avaliação genérica ou encerra cedo | `noaResidentAI.ts` (intent, word boundary “erro”); `clinicalAssessmentFlow.ts`; sync com intent **CLÍNICA** durante fluxo ativo. |
| **Relatórios** com blocos RAG na queixa / modal vazio no histórico | `stripPlatformInjectionNoise` + `ClinicalReports.tsx`; modal `PatientAnalytics` → `getAecReportModalPayload` (chaves AEC em PT). Ver `docs/guides/AEC_UI_RELATORIOS_ANALYTICS_01_04_2026.md`. |
| **Analytics** “+NN%” enganoso | `PatientAnalytics.tsx` — selos em **pts** + ícone ℹ (01/04/2026). |
| **406 / UPDATE + RLS** em chamadas | Padrão documentado em `videoCallRequestService.ts` (evitar `RETURNING` onde RLS bloqueia). |
| **RLS** / “dados sumiram” | Policy vs `user_id` vs role; não assumir admin vê tudo. Conferir migrações atuais; **§8** e diário 19/03 como baseline — **revalidar** após mudanças. |
| **Pagamentos** | Código + doc falam em **Connect/split**; diários indicam **mock** até CNPJ/gateway — não tratar como fluxo financeiro validado em prod. |
| **E-mail** | `supabase/functions/send-email` (Resend); **DNS/DKIM** é gate externo nos diários. |

**Nunca (obrigatório):**

- Sugerir **bypass de RLS** ou `USING (true)` “temporário” sem auditoria explícita.  
- Colar ou pedir **credenciais** em claro; pedir **rotação** se houver suspeita de vazamento.  
- Executar ou descrever **ato clínico** como se fosse o produto — ação clínica passa por **profissional + Core + governança**.  
- Afirmar **“está deployado em produção”** sem evidência (dashboard Vercel, Supabase, tag); exigir **§9 Fases D–I** marcadas ou tabela **9.A** preenchida.

---

## 1. Como usar este documento (humano)

0. **Topo** — TL;DR (~30 s).  
1. **§0.1** — Protocolo de ação da IA (debug, limites).  
2. **§2** — Bibliografia e inventário mensal de diários.  
3. **§3** — Timeline resumida (tabela).  
4. **§4** — Pitch, pricing, acordo de quotistas; **§4.4** quarteto e pilares.  
5. **§5** — Tese em três fases (Nôa × Core) + cosmologia institucional.  
6. **§6** — Marcos técnicos e filosóficos por período (dez/2025 → abril/2026).  
7. **§7** — Ficha por bloco de diário (o que cada arquivo **adiciona** ao registro).  
8. **§8** — Erros, dívidas técnicas e correções pós-diário no código.  
9. **§9** — **Runbook de go-live** (checklist executável: fases, verificação, critérios); snapshot e dependências incorporados.  
10. **§10** — Realidade verificada no repositório.  
11. **§11** — Próximos passos documentais.

---

## 2. Bibliografia — ordem recomendada de entrada

| # | Caminho | Papel |
|---|---------|--------|
| 1 | `docs/LIVRO_MAGNO_DOCUMENTO_FINAL_CONSOLIDADO.md` | Governança, non-goals, Header vs Core, economia two-track |
| 2 | `docs/LIVRO_MAGNO_MEDCANLAB_COMPLETO_2026.md` | Módulos + Core + COS |
| 3 | `docs/LIVRO_MAGNO_DIARIO_UNIFICADO.md` | **Cronologia longa** (dez/2025 → mar/2026) |
| 4 | `docs/DIARIO_LIVRO_MAGNO_06-02-2026.md` | Core: passo a passo, tabelas, limites |
| 5 | `docs/DIARIO_UNIFICADO_ULTIMOS_7_DIAS.md` | 03–08/02 |
| 6 | `docs/DIARIO_SELAMENTO_0402.md` | Selamento trigger + protocolo |
| 7 | `docs/DIARIO_MESTRE_COMPLETO_05-02-2026.md` | Gatilhos, ≤10 palavras |
| 8 | `docs/TIMELINE_DEFINITIVA_19_03_2026.md` | Fases 0–3, métricas segurança |
| 9 | `docs/DIARIO_DIAGNOSTICO_19_03_2026.md` | Selamento março |
| 10 | `DIARIO_CONSOLIDADO_22_27_MARCO_2026.md` | 22–27/03 |
| 11 | `docs/DIARIO_27_MARCO_2026.md` | RLS, Header, mock |
| 12 | `docs/DIARIO_28_MARCO_2026.md` | Titan 3.1/3.2 |
| 13 | `DIARIO_30_03_2026.md` | Equipes, agenda, auth↔users |
| 14 | `DIARIO_01_04_2026.md` | **Selo 01/04/2026** — quarteto, “completo” vs índice, pendências |
| 15 | **`DIARIO_31_03_2026.md`** | *Opcional — último dia de março* |
| 16 | `docs/LIVRO_MAGNO_RESUMO_FINAL_09-02-2026.md` / `docs/LIVRO_MAGNO_COMPLETO_DETALHADO_09-02-2026.md` | 09/02 |
| 17 | `INVESTMENT_KIT/pitch_estilo_sequoia.md` | Pitch investidor (Sequoia-style) |
| 18 | `INVESTMENT_KIT/pitch_deck_medcannlab.md` | Deck narrativo |
| 19 | `acordo_quotistas_juridico.md` | Acordo quotistas v2 (IP, vesting, veto CTO) |
| 20 | `docs/O_LIVRO_MAGNO_DA_JORNADA_MEDCANNLAB.txt` | Narrativa longa (Vidal, Passos, jornada) |
| 21 | `docs/guides/TREINAMENTO_OPENAI_ASSISTANT.md` | Base metodológica / Valença — entrevista clínica |

### 2.1 Inventário de diários no repo *(por mês)*

**Janeiro/2026:** não há `DIARIO_*` exclusivos de janeiro; narrativa em `LIVRO_MAGNO_DIARIO_UNIFICADO.md`.

**Fevereiro/2026:**  
`docs/DIARIO_DE_BORDO_CURSOR_03-02-2026.md`, `docs/DIARIO_DE_BORDO_DIA_03.md`, `docs/DIARIO_SELAMENTO_0402.md`, `docs/DIARIO_MESTRE_COMPLETO_05-02-2026.md`, `docs/DIARIO_COMPLETO_05-06_FEVEREIRO_2026.md`, `docs/DIARIO_LIVRO_MAGNO_06-02-2026.md`, `docs/DIARIO_UNIFICADO_ULTIMOS_7_DIAS.md`, `DIARIO_DE_BORDO_MESTRE_2026-02-19.md`, `DIARIO_DE_BORDO_MESTRE_2026-02-20.md`, `DIARIO_25_02_2026.md`, `DIARIO_27_02_2026.md`.

**Março/2026 (até 21):**  
`DIARIO_MESTRE_02_03_2026.md`, `DIARIO_03_03_2026.md` … `DIARIO_06_03_2026.md`, `DIARIO_11_03_2026.md`, `DIARIO_12_03_2026.md`, `docs/DIARIO_DIAGNOSTICO_19_03_2026.md`, `DIARIO_21_03_2026.md`.

**Março/2026 (≥22):**  
`DIARIO_22_03_2026.md`, `DIARIO_23_03_2026.md`, `DIARIO_CONSOLIDADO_22_25_MARCO_2026.md`, `DIARIO_CONSOLIDADO_22_27_MARCO_2026.md`, `DIARIO_27_03_2026_ANTIGRAVITY.md`, `docs/DIARIO_27_MARCO_2026.md`, `docs/DIARIO_28_MARCO_2026.md`, `DIARIO_30_03_2026.md`, **31** *(opcional)*.

**Abril/2026:**  
`DIARIO_01_04_2026.md` — selamento + mapa fundador + delimitação do que “completo” significa; **sessão técnica** AEC/UI (botões duplicados, strip RAG em relatórios, KPI em **pts**, modal histórico AEC) — guia `docs/guides/AEC_UI_RELATORIOS_ANALYTICS_01_04_2026.md`.

---

## 3. Linha do tempo unificada (resumo tabular)

| Período | Marco | Documentos principais |
|---------|--------|----------------------|
| Dez/2025 | Jornada paciente, IMRE, Nôa contextual | Livro unificado |
| Jan/2026 | Resident AI, chat pro, renal/assinatura (plano) | Livro unificado |
| 01–08/02 | COS, triggers, terminal, WebRTC | Diários fev. + unificado 7 dias |
| 09–11/02 | Tiers, RLS, clinical grade | Livro unificado + resumo 09/02 |
| 19–27/02 | Mestres, score segurança, motor determinístico | Diários mestre + 25/02 + 27/02 |
| 02–12/03 | WiseCare, Core “filosofia vs hardware” | `DIARIO_03_03` … `12_03` |
| 19/03 | Selamento findings | Diagnóstico + timeline definitiva |
| 20–21/03 | Dashboard único, auditoria, CNPJ/Stripe | Livro 20/23 + `DIARIO_21_03` |
| 22–25/03 | PWA, pricing, fundação doc | `DIARIO_22_03`, consolidados |
| 27–30/03 | Intelligence layer, Titan, equipes, agenda | Diários 27–30 |
| 01/04 | Selo institucional; quarteto; runbook §9; **patch** AEC/relatórios/analytics (UI alinhada ao JSON AEC) | `DIARIO_01_04_2026.md` + `docs/guides/AEC_UI_RELATORIOS_ANALYTICS_01_04_2026.md` + v2.4 |

---

## 4. Pitch, modelo de negócio e plano societário *(síntese fiel aos artefatos)*

### 4.1 Proposição *(INVESTMENT_KIT)*

- **Tese:** infraestrutura para **decisão clínica** — “The Digital Infrastructure for Clinical Decision” / “Stripe da decisão clínica”. Não competir com “mais um app”; ocupar a **camada** entre narrativa do paciente e decisão do médico.  
- **Problema:** perda de tempo e contexto; IA generativa **sem governança** = risco sistêmico.  
- **Solução:** **Clinical OS** — Nôa estrutura narrativa (AEC/IMRE); **Core** governa o que pode virar ação; dados estruturados para o profissional.  
- **Timing:** regulação + saturação de chatbots + cannabis como wedge.  
- **Negócio:** narrativa de **take-rate** (~30% sobre transações no ecossistema) + SaaS/recorrência; **Stripe Connect** como instrumento de split (doc — implementação real depende de CNPJ/gateway).  
- **Captação (doc):** faixas Seed **R$ 500k–1M** / **R$ 1M** conforme versão do pitch; valuation indicativo no deck.  
- **Pitch Sequoia (repo):** inevitabilidade por custo de substituição; “cérebro determinístico” vs chatbots; fechamento: *We are not changing the doctor. We are changing how the doctor scales.* (`INVESTMENT_KIT/pitch_estilo_sequoia.md`).  
- **Materiais correlatos:** `pitch_deck_medcannlab.md`, `DOCUMENTO_MESTRE_ESTRATEGICO.md`, `hard_questions_vc.md`, `implementation_plan_stripe_connect.md`, `guia_negociacao_equity.md` — úteis para IA alinhar discurso de investidor com estado do código.

*Nota:* não há arquivo nomeado “pith” no repositório; o núcleo de discurso compacto está no pitch acima e no documento mestre estratégico.

### 4.2 Pricing operacional citado *(DIARIO_22_03 + consolidados)*

- Profissional B2B **R$ 99,90**/mês  
- Aluno “Ouro” **R$ 149,90**/mês  
- Paciente premium **R$ 60,00**/mês  
- **Pool 10% OPEX:** 5% Growth + 5% Impact (CAC/LTV e impacto)

### 4.3 Acordo de quotistas *(trechos conceituais — `acordo_quotistas_juridico.md` v2.0)*

- Quatro fundadores **25%** cada; sociedade **MEDCANNLAB TECNOLOGIA EM SAÚDE LTDA**.  
- **IP:** código/infra (cedido pela engenharia) + protocolos clínico-educacionais AEC/IMRE (cedidos pelo fundador clínico) **cedidos à empresa**.  
- **Vesting 48 meses**, cliff **12 meses**; regras de saída, drag/tag, non-compete setor específico.  
- **Veto qualificado do CTO** circunscrito a **privacidade, RLS, migração insegura de dados** — não manda na estratégia comercial.  
- **Compliance:** plataforma como **intermediação SaaS**; responsabilidade do ato médico com o profissional (termos no checkout).  
- **Pró-labore:** condicionado a fluxo/superavit e decisão qualificada (doc).

*Interpretação filosófica:* o contrato amarra **“mente clínica + mente técnica”** à **pessoa jurídica**, para due diligence e para evitar que o produto vire refém de licença informal entre sócios.

### 4.4 Quarteto fundador e pilares *(AEC, arquitetura, ciência, institucional)*

Este bloco **formaliza no índice operacional** o que já aparece na narrativa do Livro Magno e nos guias do repositório — para a IA e para parceiros não confundirem **papel clínico**, **papel de engenharia**, **papel acadêmico-científico** e **papel institucional**.

| Pilar | Pessoa | Onde isso “morre” no produto / na documentação |
|--------|--------|------------------------------------------------|
| **Escuta clínica e AEC** | **Dr. Ricardo Valença** | Metodologia de entrevista e avaliação estruturada; guias como `docs/guides/TREINAMENTO_OPENAI_ASSISTANT.md` (“Arte da Entrevista Clínica”). No código: fluxo AEC em `clinicalAssessmentFlow.ts`, orquestração Nôa em `noaResidentAI.ts`. |
| **Arquitetura e execução técnica** | **Pedro Passos** | Arquitetura híbrida (React/Vite, Supabase, Edge Functions, TradeVision Core); decisões de migração, RLS e vídeo; narrativa técnica no Livro em prosa (`docs/O_LIVRO_MAGNO_DA_JORNADA_MEDCANNLAB.txt` et al.). Alinhado ao **veto qualificado de CTO** no acordo quotistas (privacidade, RLS, migração). |
| **Clínica, ensino e eixo científico** *(incl. neurociência / ensino superior no desenho do produto)* | **Dr. Eduardo Faveret** | Nos artefatos do repo a grafia é **Faveret** (`EduardoFaveretDashboard.tsx`, guias de login/dashboard). Eixo de pós-graduação/cannabis medicinal e métricas profissionais; convergência com a **trilha de pesquisa** e ensino no app. *(Se na conversa aparecer “Faverte”, tratar como variante do mesmo nome nos docs.)* |
| **Institucional, ecossistema e curadoria de visão** | **João Eduardo Vidal** | Papel de conexão e visão institucional na jornada narrada no Livro Magno; alinhamento entre produto, narrativa e ecossistema (parcerias, posicionamento). |

**Filosofia:** o **Clinical OS** não é só código — é **contrato social** entre escuta validada (Ricardo), arquitetura que aguenta auditoria (Pedro), rigor acadêmico/clínico ampliado (Eduardo) e sustentação institucional (João Eduardo).

---

## 5. Tese tecnológica em três fases *(espinha dorsal do Livro + DIARIO_22)*

1. **Prompt-driven:** validação clínica da hipótese AEC; dependência inaceitável de LLM “solto”.  
2. **SDK/API:** controle de interface; ainda assim risco se o modelo “manda” no fluxo.  
3. **Core governance (atual de projeto):** TradeVision Core como **camada soberana** — COS, eventos cognitivos, triggers selados, `app_commands`; LLM como **sintetizador subordinado**, não como executor de ato clínico.

**Filosofia:** *fala ≠ ação*; execução condicionada a contrato, perfil e confirmação; append-only onde a história institucional exige prova.

---

## 6. Marcos técnicos e filosóficos por período

### 6.1 Dezembro/2025 — janeiro/2026
- **Técnico:** dashboards paciente, agendamento com trava IMRE, chat com RLS, I18N; evolução para Nôa residente, persistência de avaliação, chat entre profissionais.  
- **Filosófico:** o paciente deixa de ser “tela genérica” e vira **jornada guiada**; a trava IMRE é pedagógica e de segurança (“sem anamnese estruturada, não há agendamento irresponsável”).

### 6.2 Fevereiro/2026 — selamento cognitivo
- **Técnico:** `cognitive_events`, trauma institucional, `PROTOCOLO_APP_COMMANDS_V2`, `[TRIGGER_SCHEDULING]`; header e triggers por perfil; terminal clínico unificado; WebRTC + correções CORS/406; regra curta de agendamento.  
- **Filosófico:** **institucionalização da IA**: não é feature, é **protocolo**; o sistema ganha “imunologia” (COS) e auditabilidade (CEP).

### 6.3 Março inicial — integração e dureza
- **Técnico (03/03):** WiseCare homolog (`v4h.cloud`), Edge `wisecare-session`, `WiseCareProvider`, dual-provider com WebRTC; hardened de vazamento de credenciais.  
- **Filosófico:** **sempre plano B** (WiseCare falhou → P2P); telemedicina como **ponte**, não cativeiro de vendor.

### 6.4 Março médio — segurança e narrativa
- **Técnico (19/03+):** queda drástica de findings, RLS granular, anti-escalação admin; rotas canônicas.  
- **Filosófico:** passagem de “startup que constrói feature” para **operação que resiste a auditoria**.

### 6.5 20/03 — identidade adaptativa
- **Técnico:** um terminal profissional (`ProfessionalMyDashboard`), remoção de dashboards por celebridade; vídeo no chat profissional; RLS em documents/noa/conversation_ratings.  
- **Filosófico:** *“A sala é a mesma; muda quem ocupa a cadeira.”* — parametrizar por dados, não por fork de código.

### 6.6 21–22/03 — fundação e PWA
- **Técnico:** auditoria profunda Auth→schema; PWA; pricing; pool 10%; documentos societários e pitch.  
- **Filosófico:** alinhar **narrativa de investidor** com **verdade do código**; expor dívidas técnicas (honestidade para due diligence).

### 6.7 27–30/03 — intelligence e operações
- **Técnico:** `clinical_rationalities` / `clinical_axes`, KPIs, dedup relatórios; fix role/header; Titan vídeo RPC + auditoria; `professional_teams`, `professional_availability`, trigger auth↔`users`, Nôa dinâmica no Core, Realtime em `video_call_requests`.  
- **Filosófico:** sistema **operacionaliza** escuta (AEC) em artefatos analíticos sem substituir o médico.

### 6.8 Abril/2026 (repo)
- **Técnico (início abril, branch anterior):** correção AEC (`ASSESSMENT_START` + `clinicalAssessmentFlow` no path TradeVision); `includes('erro')` → word boundary; WiseCare Edge com **service role** para cross-user em `video_call_quality_logs`; primeira linha do RPC array `get_or_create_video_session`.  
- **Técnico (01/04/2026, sessão Cursor):** `NoaConversationalInterface` — fim da duplicação `app_commands`/`buttonCommands`; `noaResidentAI` — `else if` concluído vs interrompido; `clinicalAssessmentFlow` — `INTERRUPTED`, consentimento + `[ASSESSMENT_COMPLETED]`, `stripPlatformInjectionNoise` reforçado; `ClinicalReports` — strip em todo o pipeline de exibição/download; `PatientAnalytics` — KPI em **pts**, ícone ℹ, `getAecReportModalPayload` para modal do histórico. Guia: `docs/guides/AEC_UI_RELATORIOS_ANALYTICS_01_04_2026.md`.  
- **Filosófico:** **robustez** = falsos positivos linguísticos e RLS honestos na vídeo; **honestidade de superfície** = o que o doente lê (relatório, gráfico, modal) não contradiz o contrato de dados (`content` AEC vs labels enganosos).

---

## 7. O que cada bloco de diário **acrescenta** ao registro *(fichas)*

**Fev 03 (Cursor + dia 03):** invariante “fala ≠ ação”; separação agendar vs abrir agenda; base para não redesenhar Core, apenas acrescentar contratos.

**Fev 04 (Selamento):** imutabilidade do token de agendamento; admin + CAS; epistemologia do cuidado no prompt.

**Fev 05–06 (Mestre + Livro Magno 06):** gatilhos expandidos; terminal e header; UX de dense information; loops React corrigidos com ref.

**Fev 07–08 (Unificado 7 dias):** WebRTC operacional; Realtime signaling; hardening de aceitar/recusar.

**Fev 19–20 (Mestre):** continuidade executiva *(detalhes nos próprios arquivos)*.

**Fev 25 / 27:** score real vs ilusório; views SECURITY INVOKER; motor determinístico offline — **soberania** quando a nuvem externa falha.

**Mar 02 (Mestre):** ponte para março *(abrir arquivo para lista pontual)*.

**Mar 03:** **WiseCare** end-to-end; governança corporativa na narrativa do dia; lição: credenciais só em secrets, nunca no browser.

**Mar 04–06:** endurecimento e narrativa contínua pós-integração Wise.

**Mar 11–12:** defesa da arquitetura Core linha a linha contra simplificação “só diagnóstico”.

**Mar 19:** selamento quantitativo de segurança; virada de métrica.

**Mar 21:** auditoria “do avesso”; Stripe/CNPJ como **gargalo do mundo real**; beta sugerido.

**Mar 22:** **documento fundacional magno**: tese 3 fases; pricing; pool 10%; escrituras; **technical risk disclosure** *(validar o que já foi sanado após remoção de dashboards legados e novas migrações)*.

**Mar 23–25:** consolidados — trial, APIs, remoção de mock *(ver `DIARIO_CONSOLIDADO_22_25`)*.

**Mar 27 (+ Antigravity):** intelligence layer, UX triggers, purga mock.

**Mar 28:** Titan 3.1 vídeo atômico; 3.2 ordem log/analytics; identity sync.

**Mar 30:** equipes clínicas, agenda configurável, link auth↔usuário pré-existente, consentimento LGPD no schema, Nôa reconhece **todos** os profissionais cadastrados.

**01 abr:** **`DIARIO_01_04_2026.md`** — selamento institucional + **§6 sessão técnica** (AEC UI, relatórios, analytics); mapa quarteto; guia **`AEC_UI_RELATORIOS_ANALYTICS_01_04_2026.md`** (antes/depois/problema/solução).

### 7.1 Leituras cruzadas *(expandir só quando necessário)*

- **Nutrição clínica do Core:** `docs/DIARIO_LIVRO_MAGNO_06-02-2026.md` — útil para debugar “por que o GPT não disparou trigger” ou “por que o widget não abriu”.  
- **Stress test de vídeo:** `docs/DIARIO_UNIFICADO_ULTIMOS_7_DIAS.md` + `docs/DIARIO_28_MARCO_2026.md` — ordem ideal de leitura quando o sintoma for 406, CORS ou callee sem sessão.  
- **Dívida e hype:** `DIARIO_22_03_2026.md` Parte 6 — tratar como **checklist histórico**; cruzar com migrations atuais antes de assumir que o item continua aberto.  
- **Go-live operacional:** `DIARIO_30_03_2026.md` tabela “O que falta para 100%” — Stripe Connect real, Resend DNS, rotação de chaves, deploy Core com detecção dinâmica, gamificação ligada a eventos reais, testes, types, landing.

### 7.2 Leitura densa por recorte de data *(técnico + filosófico)*

Objetivo: quando você (ou a IA) **não** abrir cada `DIARIO_*.md`, ainda assim recuperar **por que aquele dia importou** e como isso conversa com pitch, societário e Core.

**Dezembro/2025 — janeiro/2026** *(só no Livro unificado)*  
*Técnico:* base de jornada do paciente, IMRE como pré-condição de agendamento, chat com isolamento por RLS, evolução para Nôa residente e persistência de fluxos. *Filosófico:* o produto deixa de ser “site com chat” e vira **trilha** — tempo de tela irrelevante se o contexto clínico não estiver selado antes da consulta.

**03 fevereiro** *(bordo Cursor + dia 03)*  
*Técnico:* desacoplamento entre “falar em agendar” e “executar agendamento”; invariantes que evitam que o LLM vire executor direto. *Filosófico:* **discurso não é prescrição**; o sistema ensina o usuário (e o investidor) que governança é camada, não buzzword.

**04 fevereiro** *(selamento)*  
*Técnico:* token de agendamento imutável; fluxo admin + CAS; contrato explícito do que o modelo pode sugerir. *Filosófico:* **epistemologia do cuidado** — o que é “saber” num copiloto clínico: evidência, perfil, confirmação humana.

**05–06 fevereiro** *(mestre + Livro Magno 06)*  
*Técnico:* expansão de gatilhos, header e terminal; nutrição do Core (tabelas, limites); correção de loops React com `ref`. *Filosófico:* densidade informacional na UI espelha densidade do domínio — sem maquiar complexidade com wizard genérico.

**07–08 fevereiro** *(unificado 7 dias)*  
*Técnico:* WebRTC operacional, Realtime signaling, hardening aceitar/recusar vídeo. *Filosófico:* vídeo é **ato relacional**; falha técnica não pode silenciosamente degradar confiança — por isso logs, estados visíveis e fallback.

**09–11 fevereiro** *(tiers, RLS, clinical grade no Livro)*  
*Técnico:* camadas de serviço e políticas de dados. *Filosófico:* “clinical grade” não é marketing — é **capacidade de auditoria** e recusa de atalhos que quebram LGPD/CFM na prática.

**19–27 fevereiro** *(mestres + 25 + 27)*  
*Técnico:* score de segurança, views `SECURITY INVOKER`, motor determinístico offline. *Filosófico:* **soberania**: quando a API externa cai, o institucional não perde o rumo — o Core mantém regras.

**02 março** *(mestre ponte)*  
*Técnico:* continuidade operacional entre meses; lista pontual no arquivo. *Filosófico:* diário como **ponte narrativa** — evita amnésia institucional entre “sprints”.

**03 março**  
*Técnico:* WiseCare homolog, Edge `wisecare-session`, `WiseCareProvider`, dual stack com WebRTC; lição dura de segredos só no servidor. *Filosófico:* vendor é acelerador, não **dono do relacionamento** paciente–médico; plano B é parte da ética de engenharia.

**04–06 março**  
*Técnico:* endurecimento pós-WiseCare; ajustes narrativos e de fluxo. *Filosófico:* integração boa é **higiene** — monitorar, medir, documentar falhas sem culpar o usuário.

**11–12 março**  
*Técnico:* defesa linha a linha da arquitetura Core contra simplificação “só mais um diagnóstico”. *Filosófico:* resistir à compressão do produto em feature única protege **moat** (governança + dados + compliance).

**19 março** *(diagnóstico + timeline definitiva)*  
*Técnico:* selamento quantitativo de findings; queda drástica de risco; rotas canônicas. *Filosófico:* virada de **espírito de equipe** — de “fechar issue” para “fechar classe de risco”.

**20–21 março**  
*Técnico:* terminal único profissional; vídeo no chat; auditoria Auth→schema; Stripe/CNPJ como dependência externa. *Filosófico:* identidade **adaptativa** — mesma sala, outro profissional; parametrização vence fork por celebridade.

**22 março** *(fundação magno + pricing + societário)*  
*Técnico:* tese em 3 fases; pricing e pool 10%; technical risk disclosure (validar o que já migrou). *Filosófico:* **honestidade com capital** — documentar dívida técnica junto do pitch evita desalinhamento tragédia pós-term sheet.

**23–25 março** *(consolidados 22–25, 22–27)*  
*Técnico:* trial, APIs, remoção progressiva de mock; continuidade PWA/ops. *Filosófico:* mock é **assunção temporária**; narrativa de investidor precisa marcar onde ainda há simulação.

**27 março** *(docs + Antigravity)*  
*Técnico:* intelligence layer (`clinical_rationalities` / eixos), KPIs, dedup; triggers UX; purga de mock. *Filosófico:* dados analíticos servem **transparência clínica**, não gamificação vazia.

**28 março** *(Titan)*  
*Técnico:* vídeo atômico (RPC), ordem log/analytics, sync identidade. *Filosófico:* priorizar **atomicidade** em vídeo evita estado “meio ligado” que destrói confiança em telemedicina.

**30 março**  
*Técnico:* equipes clínicas, disponibilidade, vínculo auth↔`users`, consentimento LGPD em schema, Nôa reconhecendo profissionais cadastrados; checklist 97% / gates go-live. *Filosófico:* **operação** — o produto está pronto para mundo real quando integrações financeiras, e-mail e deploy refletem o mesmo rigor do Core.

**31 março** *(opcional)*  
Reservar entrada: fechar o mês com estado de deploy, decisões societárias e qualquer incidente de vídeo/AEC pós-30.

**01 abril** *(`DIARIO_01_04_2026.md`)*  
*Técnico:* registro explícito dos patches de abril já listados na timeline (AEC/intent, WiseCare/service role); apontadores para §10.1. *Filosófico:* **selar sem mentir** — índice robusto ≠ cópia integral de todo o histórico; nomear o quarteto evita que a IA “apague” autores do sentido do produto.

---

## 8. Erros, quase-bugs e lições *(para a IA não repetir)*

| Problema | Causa | Lição |
|----------|--------|--------|
| Callee não entrava WiseCare | RLS em `video_call_quality_logs` só por `user_id` | Edge Function: persistir com **service role** após validar JWT |
| AEC “resetava” após nome | `ASSESSMENT_START` impedia `clinicalAssessmentFlow` no path TradeVision | Iniciar flow também quando platform intent = START |
| “Interrompeu” virou intent técnico | `includes('erro')` ⊂ “inter**erro**mpeu” | Usar **word boundary** em keywords técnicas |
| GPT fecha avaliação sem protocolo | Core + histórico + intent errado | Manter fase AEC sincronizada e intent CLÍNICA durante flow ativo |
| Chaves expostas em chat/repo | fluxo de desenvolvimento | Rotacionar; nunca colar secrets na IA |

---

## 9. Runbook de go-live *(checklist executável)*

**Contexto:** produto **maduro no código**, **pré-operação** no sentido comercial/legal integrações; **97%** (diário 30/03) é **meta narrativa**, não substitui este runbook.

**Como usar:** executar **por fase** (A→I). Para cada linha: marcar `[ ]` → `[x]`, preencher **Data** e **Evidência** (link deploy, print dashboard, ticket). Se algo não aplicar, marcar **N/A** com justificativa.

**Última execução / atualização desta §:** _yyyy-mm-dd — responsável:_

---

### Fase A — Pré-voo (decisão e comunicação)

| Feito | Item | Como verificar | Critério de “pronto” |
|:-----:|------|----------------|----------------------|
| [ ] | Tag/versão no Git alinhada ao que vai para produção | Branch/tag + CI | SHA ou tag registada |
| [ ] | URL canónica do front definida | Vercel/domínio | Equipa sabe qual URL é “oficial” |
| [ ] | Lista de “não vai neste corte” acordada | Nota curta | Escopo do go-live sem creep |
| [ ] | Responsável por acionar rollback identificado | Nome/contato | — |

---

### Fase B — Jurídico e negócio *(gates dos diários)*

| Feito | Item | Como verificar | Critério de “pronto” |
|:-----:|------|----------------|----------------------|
| [ ] | **CNPJ** e razão para contratos/checkout | Documento interno | Stripe/termos alinhados ao PJ |
| [ ] | Termos, privacidade, responsabilidade do ato médico | URL/legal | Publicados na jornada de signup/pagamento |
| [ ] | Acordo quotistas / IP coerente com deploy | `acordo_quotistas_juridico.md` vs prática | Sem divergência grave |

---

### Fase C — Supabase, secrets e custo

| Feito | Item | Como verificar | Critério de “pronto” |
|:-----:|------|----------------|----------------------|
| [ ] | **Chaves** só em env (nunca repo/chat) | Dashboard + `.env` local | Rotação se houve exposição |
| [ ] | **Migrações** aplicadas no projeto remoto | Supabase SQL / CLI | Versão do schema = esperada |
| [ ] | **Edge Functions** necessárias deployadas | Dashboard Functions | `tradevision-core`, `wisecare-session`, `send-email`, etc. |
| [ ] | Alertas/limites de **custo** (Edge, Realtime, storage) | Billing | Baseline definido pós-go-live |

---

### Fase D — Front e Core em produção

| Feito | Item | Como verificar | Critério de “pronto” |
|:-----:|------|----------------|----------------------|
| [ ] | Build front (Vite) sem erro; `vercel.json` coerente | `npm run build` + deploy | Site abre; rotas SPA ok |
| [ ] | **`tradevision-core`** na revisão esperada | Deploy function + smoke | Resposta esperada a comando de teste |
| [ ] | Variáveis de ambiente no host / Supabase | Painel | Sem fallbacks silenciosos críticos |

---

### Fase E — Pagamentos *(Stripe Connect)*

| Feito | Item | Como verificar | Critério de “pronto” |
|:-----:|------|----------------|----------------------|
| [ ] | Conta Stripe + Connect **modo produção** (não só mock) | Dashboard Stripe | Pagamento teste mínimo end-to-end |
| [ ] | Split / take-rate conforme doc (~30% narrativa de negócio) | Logs/webhook | Valores corretos em caso de teste |
| [ ] | Fluxo de falha (cartão recusado) não quebra UX | Teste manual | Mensagem segura ao usuário |

---

### Fase F — E-mail *(Resend + DNS)*

| Feito | Item | Como verificar | Critério de “pronto” |
|:-----:|------|----------------|----------------------|
| [ ] | **SPF/DKIM** no domínio (ex. Registro.br) | Ferramentas DNS | Resend valida domínio |
| [ ] | E-mail transacional crítico (ex. recuperação, confirmação) | `send-email` + inbox | Entrega em caixa principal (não só spam) |

---

### Fase G — Vídeo e AEC *(smoke + §8)*

| Feito | Item | Como verificar | Critério de “pronto” |
|:-----:|------|----------------|----------------------|
| [ ] | **WiseCare:** sessão caller/callee + logs | Chamada real | Sem erro RLS em `video_call_quality_logs` |
| [ ] | **WebRTC fallback:** offer/answer/ICE via Realtime | Rede “fácil” | Conecta quando STUN basta |
| [ ] | **Rede restrita:** consciência de limite (**sem TURN** no `useWebRTCRoom.ts`) | Teste CGNAT/VPN se possível | Documentado: fallback WiseCare ou N/A aceite |
| [ ] | **AEC:** fluxo completo sem encerrar indevido | `clinicalAssessmentFlow` + Nôa | Intent clínico durante avaliação |
| [ ] | Keyword “interrompeu” não dispara técnica por falso positivo | §8 | Comportamento validado |

---

### Fase H — Segurança, dados e produto

| Feito | Item | Como verificar | Critério de “pronto” |
|:-----:|------|----------------|----------------------|
| [ ] | **RLS** revisado pós-última migração | Policies + testes manuais perfis | Paciente/pro/admin não vê dados alheios |
| [ ] | **Dualidade `users` / `pacientes`:** risco assumido ou mitigado | Mapa de dados | Decisão registada (§10) |
| [ ] | **Gamificação:** pontos atados a eventos reais (diário 30/03) | Código/DB | Sem pontos “fantasma” |
| [ ] | **Types TS** regenerados / client Supabase | `npm`/CLI | Build limpo |
| [ ] | **Testes** (Vitest/Playwright) mínimos críticos | CI ou local | Rotas/auth/agendamento cobertos o suficiente para o corte |
| [ ] | **Landing SEO** dentro do escopo do corte | Páginas públicas | Meta básicas ok |

---

### Fase I — Beta controlado e primeiras 48 h

| Feito | Item | Como verificar | Critério de “pronto” |
|:-----:|------|----------------|----------------------|
| [ ] | **Beta** com lista fechada de usuários | Convites | Volume limitado + canal de feedback |
| [ ] | Monitorização: erros front, Edge logs, Supabase | Dashboards | Alguém olha 2×/dia nas 48 h |
| [ ] | Plano de **rollback** testado ou ensaiado | Doc 1 páginas | Sabem reverter deploy ou feature flag |

---

### 9.A Registo pós-execução *(snapshot — preencher após o runbook)*

| Área | Status final (✓ / ⚠️ / ✗) | Evidência (link/nota) | Data |
|------|---------------------------|------------------------|------|
| Front produção | | | |
| Supabase migrações | | | |
| Core deploy | | | |
| Stripe produção | | | |
| Resend + DNS | | | |
| Vídeo WiseCare | | | |
| WebRTC (limite STUN) | | | |
| RLS / auditoria | | | |

---

### 9.B Dependências externas *(referência rápida)*

| Sistema | Bloqueia | Nota |
|---------|----------|------|
| CNPJ | Stripe “real”, B2B pleno | Diários |
| Stripe Connect | Monetização | Mock ≠ produção |
| Resend + DNS | E-mail confiável | Edge `send-email` existe |
| Domínio (Registro.br) | Marca + e-mail | Diários |
| Supabase projeto remoto | Tudo | Secrets só em env |
| WiseCare | Vídeo quando P2P falha | Fallback documentado |

---

### 9.C Riscos ativos *(antes e depois do go-live)*

- WebRTC **sem TURN** → falhas em redes corporativas/CGNAT; mitigar com WiseCare ou TURN futuro.  
- **users** vs **pacientes** → bugs de join; unificação ou regra explícita.  
- **Financeiro** não validado em carga/compliance.  
- **Custo** Supabase em escala (Edge, Realtime, logs).  
- **Doc vs banco** (políticas antigas) → revalidar antes de due diligence.

---

**Foco estratégico (pitch):** wedge cannabis/alta complexidade → educação → infra que outros healthtechs dependem; defesa = governança + dados + compliance.

**Foco tático:** uma superfície `ProfessionalMyDashboard`; **RLS + vídeo + AEC** como prioridade operacional.

---

## 10. Realidade verificada *no repositório*

- **Front:** Vite, React, `App.tsx` com eixos clínica/ensino/pesquisa, `PaymentGuard`, contextos Noa/Video/ClinicalGovernance.  
- **Core:** `supabase/functions/tradevision-core/` + `cos_kernel.ts` / `cos_engine.ts`.  
- **Vídeo:** `wisecare-session`, `WiseCareProvider.ts`, `VideoCall.tsx`, `useWebRTCRoom.ts`.  
- **Agendamento:** `book_appointment_atomic`, `get_available_slots_v3`, `scheduling.ts`, migrações dedicadas.  
- **AEC:** `noaResidentAI.ts`, `clinicalAssessmentFlow.ts`.  
- **Risco estrutural persistente:** dualidade `users` vs `pacientes` no schema legado — decisão de unificação ainda recommendável.

### 10.1 Patches pós-documento (abril/2026, branch)

- `src/lib/noaResidentAI.ts` — flow AEC + intent.  
- `supabase/functions/wisecare-session/index.ts` — `supabaseDb` com service role; guard RPC array.  
- **01/04/2026:** `NoaConversationalInterface.tsx`, `clinicalAssessmentFlow.ts`, `ClinicalReports.tsx`, `PatientAnalytics.tsx` — ver §6.8 e `docs/guides/AEC_UI_RELATORIOS_ANALYTICS_01_04_2026.md`.

---

## 11. Próximos passos documentais

1. Opcional: **`DIARIO_31_03_2026.md`** se desejar entrada explícita do último dia de março.  
2. Após cada sprint: **uma linha** em §3 + **ficha** em §7 (append-only leve).  
3. Revisar §8 contra o estado real do Supabase (views, `USING (true)` residual) — o diário 22 listou riscos; parte pode estar **obsoleta** pós-migrações.  
4. Link opcional no `LIVRO_MAGNO_DIARIO_UNIFICADO.md`: “**Índice operacional:** `TIMELINE_LIVRO_MAGNO_DIARIOS_CONSOLIDADO.md`”.

---

*Fim da edição v2.4. História = Livro Magno + diários + pitch/societário + **pilares humanos (§4.4)**; execução = código + banco + **§9 runbook**. Para a IA: TL;DR → **§0.1** → **§9** (marcar checkboxes) → bibliografia §2.*

---

## Anexo — Sugestão externa *(GPT, abril/2026), incorporada com moderação*

Trecho de referência do que foi pedido para “nível empresa”; **já materializado** neste documento onde faz sentido; trechos grandiloquentes **não** foram copiados como fato.

1. **Estado atual real** — Evitou-se checklist verde falso; virou **§9** (Fases A–I + **9.A** snapshot pós-execução) e critérios *Como verificar / Pronto*.  
2. **Dependências centralizadas** — Tabela única **§9.B** (CNPJ, Stripe, Resend+DNS, domínio, Supabase, WiseCare).  
3. **Mapa de risco atual** — **§9.C** + riscos espelhados nas Fases G–H (TURN, dualidade tabelas, financeiro, custo, doc vs banco).  
4. **Protocolo “se X faça Y” para IA** — **§0.1** (debug) + **Nunca** (RLS, credenciais, ato clínico, afirmação de produção sem evidência).  
5. **TL;DR 30 s** — No topo do documento; aponta para §9 e §0.1.

**O que deliberadamente não entrou como verdade:** comparações com grandes empresas (“já é Palantir/Stripe docs”) — isso seria marketing, não runbook.

**Melhoria contínua:** após cada go-live ou deploy relevante, **preencher 9.A** e datar a linha no cabeçalho da §9.
