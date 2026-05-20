# Diário 19/05/2026 — Matrix V1.9.388, Voz Z2, Visão Final do Eixo Pesquisa

**Autores**: Pedro Henrique Passos Galluf + Claude Opus 4.7 (1M context)
**Origem**: incidente OpenAI quota 18/05 noite → state pollution NoaResidentAI diagnosticado → 11 commits cirúrgicos Matrix em sequência → cristalização do princípio Z2 intelectual e da jornada completa do eixo Pesquisa
**Estado fim do dia**: Matrix V1.9.388-A.7 deployada e validada empiricamente, autorização explícita Pedro para beta orgânico 20-30 usuários, 4 memórias nível 1 cristalizadas, mobile do Terminal de Pesquisa corrigido em paridade com Terminal de Atendimento

---

## 🌅 BLOCO A — Manhã: áudio Uber Ricardo + audit cronológico 6+ meses

### A.1 — Áudio Uber

Ricardo gravou áudio no Uber 19/05 manhã reforçando 8 pontos:
- Escuta primeiro, doença não é o centro
- Cosmologia clínica (anti-fragmentação)
- Médicos-autores (autoridade científica nativa)
- Conselheiros editoriais (Escola Clínica Digital camada 3)
- Fórum como espaço institucional, não rede social
- Racionalidades múltiplas coexistindo
- Pipeline indivíduo → médico → coletivo (Sequência Conservadora)
- Anti-prescrição automatizada

### A.2 — Audit cronológico — tese não nasceu hoje

Hipótese inicial seria "Ricardo está cunhando termos novos". Audit profundo via Livro Magno + diários históricos provou o contrário: **tese tem 6+ meses de cristalização documental contínua**.

Marcos cronológicos identificados:
1. **03/02/2026** — Fórum SELADO via scripts `SELAR_FORUM_RLS_V1` + epistemologia escuta-primeiro
2. **12/03** — "cosmologia de doença" cunhada + Clinical Scenario Engine anti-fragmentação
3. **22/03** — Fases 1/2/3 Nôa
4. **14/05** — "médicos-autores" + autoridade científica nativa
5. **15/05** — 3 camadas constitucionais (Livro Magno V17)
6. **17/05** — Camada 3 CONSELHEIROS EDITORIAIS
7. **19/05 manhã** — áudio Uber CONFIRMA, não introduz
8. **19/05 13h** — WhatsApp APLICA decisões já cristalizadas

Cristalizado em memory `feedback_pesquisa_materializacao_tese_ricardo_nao_drift_19_05`.

### A.3 — Anti-padrão identificado

Aceitar elogio Material B externo (GPT externo) como validação **sem audit cronológico** = inflação de autoridade alheia + sub-vende histórico próprio. Cristalizado **checklist anti-dialeto-paralelo** (5 perguntas antes de cunhar termo novo).

---

## 📱 BLOCO B — Tarde: WhatsApp Ricardo (Material A puro)

### B.1 — Mensagem WhatsApp ~13h

Ricardo ativou explicitamente 3 triggers parqueados:

1. **Pediu publicação de caso no Fórum** → memory `audit_forum_3_bloqueios_pre_publicacao_18_05` deixa de ser parqueada (fix 3 bloqueios urgente)
2. **Casos Similares confirmada como entrada de pipeline institucional**
3. **BYO-LLM plantado** com Ricardo (sem aceite, mas semente lançada)

### B.2 — 2 features NOVAS solicitadas Ricardo

- **Envio de artigos** para colegas via plataforma
- **Convidar colegas** com sistema de invite institucional

### B.3 — Pergunta interrogativa pendente Ricardo

> *"é um local pra fazer pesquisa. é isso?"*

Pedro propôs feature inédita aguardando aceite Ricardo: **chat assistente de pesquisa não-diretivo** (Matrix Z2). Aceite veio implícito no decorrer do dia 19 noite com validação empírica.

### B.4 — Sequência Conservadora confirmada

Princípio indivíduo → médico → coletivo materializado empiricamente: relatório clínico (indivíduo) → Matrix (médico estrutura reflexão) → Fórum (coletivo discute). Memory `project_ricardo_19_05_forum_validation_features_solicitadas`.

---

## ⚡ BLOCO C — Noite: incidente OpenAI quota → state pollution diagnosticado

### C.1 — Quota OpenAI estourou 18/05 22h21 BRT

Quando quota acabou, **esqueleto arquitetural apareceu**: a Matrix começou a expor padrões que GPT polisha antes. Test cru pós-quota expôs:

- Saudação "ola noa tudo bem?" virava queixa principal de AEC
- Intent classifier disparando ADMINISTRATIVA → REPORT_GENERATE em research mode
- `generateAIReport bloqueado AEC_DATA_INSUFFICIENT` no console em loop

### C.2 — Hipótese confirmada empíricamente

Anti-padrão cristalizado em memory `feedback_state_pollution_noa_core_reutilizado_19_05`:

`useResearchChat.sendMessage` chamava `NoaResidentAI.processMessage()` que executava a **pipeline completa do chat normal** pré-Edge:
1. Intent classifier marcava CLINICA/ADMIN
2. Platform actions tentava generateAIReport
3. RAG Local duplicava knowledgeBlock do Edge
4. Assistant API adicionava camada extra
5. Core Edge recebia `conversationHistory: 20 globais sem filtro de sessão`

Resultado: history de OUTROS chats (Nôa Esperança clínica, AEC, Admin) envenenava o modelo via few-shot pattern → modelo imitava `### bold "Vamos analisar"` em vez de seguir RESEARCH_PROMPT.

### C.3 — `bypassFSM=true` não bastava

Flag V1.9.379-A só pulava FSM AEC dentro do Edge. **Não pulava nada da pipeline pré-Edge** do NoaResidentAI. Fix exigiu mudança arquitetural: useResearchChat chamando Edge direto via `supabase.functions.invoke`.

---

## 🛠 BLOCO D — Noite: 11 commits cirúrgicos Matrix em sequência

| Commit | Versão | Mudança | Camada |
|---|---|---|---|
| `6adc1c3` | V1.9.385 | RESEARCH_PROMPT endurecido (palavras banidas, vocabulário preferido, dimensão longitudinal, exemplos antes/depois) | Edge |
| `62698e3` | V1.9.386 | Botão ✕ ocultar card NoaMatrixView (não-destrutivo) | FE |
| `c10a12d` | V1.9.387 | Anti-tique GPT (cedo demais — virou "Bloomberg Terminal seco") | Edge |
| `79969c8` | V1.9.388-A | RAG acervo Z2 + label "Doc #A1" + bloco ACERVO no RESEARCH_PROMPT | Edge |
| `cb9c1d3` | **V1.9.388-A.1** | **Bypass NoaResidentAI** — useResearchChat chama Edge direto | FE |
| `0426c50` | V1.9.388-A.2 | Strip `[TRIGGER_ACTION]` em research mode | Edge |
| `e033268` | V1.9.388-A.3 | gpt-4o-mini → gpt-4o-2024-08-06 full + voz intelectual + PubMed UI reuso | Edge+FE |
| `be8b6d2` | V1.9.388-A.4 | useRef pra não re-injetar attachedContext em turnos conversacionais | FE |
| `7b7b76d` | V1.9.388-A.5 | Guard `isResearchMode` em DOC_LIST/DOC_COUNT handlers (HYBRID BYPASS) | Edge |
| `871bd96` | V1.9.388-A.6 | Mobile: labels visíveis + `100dvh` em vez de `100vh` (viewport dinâmico) | FE |
| `3386e91` | V1.9.388-A.7 | Mobile: grid 5×2 espelhando IntegratedWorkstation (Terminal Atendimento) | FE |

**Métrica empírica chave**: tokens médio caíram de **~29.000 → ~4.300 por turno** (redução 85%) com modelo 17× mais capaz simultaneamente.

---

## 💡 BLOCO E — Noite: princípio Z2 ≠ burra cristalizado

### E.1 — Erro V1.9.387 reconhecido

Interpretei "anti-tique GPT" como "anti-conversação" e fui longe demais (forcei estilo Bloomberg Terminal seco). Combinado com gpt-4o-mini (V1.9.379-B economia), virou "robô de re-estruturar em loop".

### E.2 — Frase âncora Pedro 19/05 ~21h BRT

> *"se não tiver isso, qual sentido?"*

### E.3 — Distinção cristalizada

| Z2 cristalizado (correto) | Z2 burra (erro V1.9.387) |
|---|---|
| Não-diretiva CLÍNICA | Não-diretiva CONVERSACIONAL |
| NÃO prescreve, NÃO diagnostica, NÃO categoriza | NÃO debate, NÃO pondera |
| Sem navegar, sem agendar | Sem voz própria |
| **DEBATE estruturalmente** | Só re-estrutura em loop |
| **Pondera tensões entre racionalidades** | Repete a mesma análise |
| **Pergunta de volta, expressa dúvida** | Vira Notion glorificado |

Memory `feedback_z2_nao_e_burrice_voz_intelectual_19_05` — aplicabilidade futura: Matrix, Fórum sala, Dossiê review, BYO-LLM provider config, Conselheiros editoriais.

---

## 🎯 BLOCO F — Noite: visão final eixo Pesquisa cristalizada

### F.1 — Pedro descreveu a jornada completa

> *"automaticamente apos o relatorio chat ficar noamatrix disposta a trocar ideia... buscar novos docs do pub caso proficional peça ou da base de conhecimento cruzar com relatorio e ir evoluindo... para no final ele fechar um relatorio dele para o forum opcao de salvar a conversa estrutura tudo para forum tese etc"*

### F.2 — Diagrama da jornada

```
Landing → Cadastro → Nôa → AEC paciente → Relatório clínico assinado ICP
                                                  ↓
                                      [AUTO-ATIVAÇÃO Matrix] (F1)
                                                  ↓
        Matrix conversa Z2 ←──── PubMed sob demanda (F2) ←──── Base Conhecimento
                  ↓                                            ↑
        Médico debate, cruza, evolui iterativamente
                  ↓
          [FECHAR COMO DOSSIÊ] (F3)
                  ↓
          ┌───────┼──────────────┐
          ↓       ↓              ↓
         PDF   Fórum sala (F4)  Draft tese
```

### F.3 — 8 peças prontas + 4 features faltantes

**Prontas**: AEC + relatório ICP, botão "Nôa Matrix" no PatientFocusView, usePatientLongitudinal, Matrix Z2 conversa, PubMed UI anexável, Base Conhecimento citável, Casos Similares marcáveis, tab Fórum.

**Faltam**:
- **F1** Auto-ativação Matrix pós-relatório (baixa complexidade)
- **F2** Function calling PubMed/KB no chat (média)
- **F3** Fechar como dossiê (maior — schema + UI + export pipeline 3 saídas)
- **F4** Fórum publicação ativa (média — 3 bloqueios mapeados)

Ordem pragmática: P0 = F1+F3 (jornada end-to-end), P1 = F4 (destrava Ricardo), P2 = F2 (quality-of-life).

Memory `project_visao_final_eixo_pesquisa_19_05`.

---

## 🏆 BLOCO G — Noite: smoke empírico final + autorização 20-30 usuários

### G.1 — Smoke test 4 turnos pós V1.9.388-A.5

Conversa real Pedro × Nôa Matrix em produção:

| Turno | Pergunta | tokensUsed | responseLength | Validou |
|---|---|---|---|---|
| 1 | "olá noa boa noite!" | 3655 | 39 | voz natural sem re-listar |
| 2 | "vamos avaliar esses **documentos**!" | 4857 | 1855 | `[HYBRID BYPASS]` bloqueou DOC_LIST + análise com 2 PMIDs citados |
| 3 | "qual mais impacta na função renal?" | 4356 | 811 | **Z2 perfeito**: "não atravesso essa linha" + ainda estruturou referências |
| 4 | "esta rolando boa evolução obrigado" | 4428 | 194 | fechamento natural, sem re-estruturação |

### G.2 — Trecho-prova Z2 turno 3

> *"Essa é uma decisão clínica sua — eu não atravesso essa linha. No entanto, posso ajudar a olhar o que tem no corpus que talvez informe sua decisão: O paper PMID 42150384 discute a redução na taxa de filtração glomerular associada ao doravirine... A queixa de 'está inchado' poderia, em um contexto clínico, levantar questões sobre retenção de líquidos, mas isso precisaria ser explorado mais a fundo."*

**Princípio Z2 intelectual materializado empiricamente**: recusou pergunta clínica direta + ofereceu estruturação alternativa + hedging perfeito + citou PMID + manteve abertura conversacional + sem prescrever, sem diagnosticar, sem categorizar por doença.

### G.3 — Autorização Pedro

> *"show de bola... se nao quebrar o resto usuarios usar aec noa em outros locais matrix rolar junto tudo ok! 20 30 usuarios ai e um bom teeste"*

Alinhado com memory `feedback_regra_operacional_canonica_06_05` (tier 1 escalada controlada: AGORA / validada pós-cert+CNPJ+1º pagante / massiva NUNCA sem validar).

Memory `project_v1_9_388_smoke_final_vitoria_empirica_19_05`.

---

## 🔌 BLOCO H — BYO-LLM arquitetura parqueada completa

### H.1 — Trigger contextual

Pós-incidente quota OpenAI 18/05, Pedro materializou conversa pré-existente sobre médico conectar própria API.

### H.2 — Arquitetura desenhada (parqueada até Marco 2/3)

- Schema `professional_llm_config` (encrypted_api_key via Edge `llm-key-encrypt`)
- LLM Router acima da FSM (não-regressivo dos Locks)
- Tab "🤖 IA do Profissional" em nova `/profissional/configuracoes`
- Whitelist Tier 1/2/3 (gpt-4o full / claude-sonnet / gpt-3.5 gemini-flash)
- 4 limites não-negociáveis: governança intocada / custo médico ≠ plataforma / qualidade varia / responsabilidade CFM 2.314

### H.3 — Pricing decision

- Desconto max R$ 10 (Pedro 19/05 noite)
- Teto seguro R$ 35 (custo observado × 0.7)
- Médico ativa BYO → médico paga próprio direto, NÃO via plataforma
- Médico não-ativa → plataforma absorve

### H.4 — Triggers ativar

Médico não-Ricardo pedir explicitamente OR custo > 30% MRR (MRR=0 hoje) OR hospital enterprise B2B OR Marco 3 destrava.

Hoje pré-PMF Pedro paga pessoalmente (~$25/recarga). Memory `project_byo_llm_arquitetura_parqueada_19_05`.

---

## 📊 BLOCO I — Avaliação macro produto: loucura ou viável?

### I.1 — Veredicto Pedro pediu sem inflar

**Forças reais validadas empiricamente**:
- PBAD AD-RB CONFORME ITI (único MedTech cannabis brasileiro)
- Método AEC Ricardo cristalizado em código (FSM 13+ fases, 7 AECs, 141 verbatim bypass)
- 5 racionalidades coexistindo (anti-fragmentação)
- Pipeline 8 camadas (COS Kernel v5.0 → AEC → Verbatim → Orchestrator → GPT)
- Matrix Z2 validada smoke empírico
- 6+ meses cristalização tese Ricardo (NÃO invenção tardia)

**Fraquezas reais**:
- MRR = R$ 0 (zero pacientes externos pagantes)
- 8/13 profissionais cadastrados NUNCA usaram clinicamente
- Ricardo single source da tese
- Pedro single dev (bus factor 1 técnico)
- 5 débitos PARECER FISCAL 01/04 abertos

### I.2 — Quem combina os 5 elementos? Ninguém

| Concorrente | Onde sobrepõe | Onde NÃO chega |
|---|---|---|
| Doctolib / iClinic / Memed | Agenda + receituário | Sem AEC, sem racionalidades, sem Z2 |
| Glass Health (USA) | Clinical reasoning AI | Sem PBAD BR, sem 5 racionalidades, sem fórum coletivo |
| OpenEvidence / UpToDate | Knowledge retrieval | Não conversam, não publicam |

**A COMBINAÇÃO é o moat** (compliance + método + Z2 + cannabis + epistemologia).

### I.3 — Risco humano explicitado (5 vetores)

1. Bus factor 1 técnico (Pedro single dev ativo)
2. Bus factor 1 cognitivo (Ricardo single fonte tese)
3. Runway pessoal (Pedro paga OpenAI)
4. Velocidade > validação (10 commits/dia, 1 médico ativo)
5. Sem redundância operacional (João Vidal + Eduardo institucional, não dia-a-dia)

**Mitigações já em curso**:
- Cristalização documental obsessiva (200+ memories)
- Princípios operacionais cristalizados (12)
- PBAD CONFORME ITI + 6+ meses cristalização Ricardo (moats não-dependentes de presença)

### I.4 — Conclusão

> *"viável MAS arriscado humanamente — os próximos 60-90 dias decidem se a Sequência Conservadora cristalizada vira produto ou volta a ser tese acadêmica"*

---

## 📱 BLOCO J — Mobile fix Terminal de Pesquisa (V1.9.388-A.7)

### J.1 — Empírico Pedro WhatsApp ~17h48 BRT

Screenshots compararam: Terminal de Atendimento mobile abria **grid de cards 5×N** legível, Terminal de Pesquisa mobile só mostrava ícone FlaskConical no canto + abas invisíveis.

### J.2 — Causa raiz

`ResearchWorkstation.tsx` linha 164 tinha `header h-12 flex items-center` (single linha 48px fixo) + `nav` com labels `hidden sm:inline`. Em mobile a nav horizontal colapsava sem espaço pra renderizar tabs.

### J.3 — Fix V1.9.388-A.7

Espelhada estrutura do `IntegratedWorkstation.tsx` (Terminal de Atendimento):
- `header min-h-[48px] flex flex-col` (2 linhas)
- Linha 1 (`hidden sm:flex`): título + nav horizontal scroll desktop
- Linha 2 (`sm:hidden`): grid `grid-cols-5 gap-1` com 10 abas = 2 linhas
- Cards mobile: 44px touch target, `touch-manipulation` (sem 300ms delay), `active:bg` (mobile sem hover)

Adicional V1.9.388-A.6 preservado: `h-[calc(100dvh-56px)] sm:h-[calc(100vh-64px)]` (dvh respeita barras dinâmicas Safari/Chrome iOS Android).

---

## 📄 BLOCO K — Entregáveis do dia

### K.1 — Documento PARA_RICARDO V17

Arquivo: `PARA_RICARDO_V17_MATRIX_FLUXO_19_05.md` na raiz do repo.

Explicação completa em linguagem médico-friendly:
- Resposta direta à pergunta interrogativa Ricardo *"é um local pra fazer pesquisa?"*
- Diagrama dos 3 eixos com Matrix como ponte clínico↔pesquisa
- Fluxo 6 passos: Terminal Atendimento → Matrix
- 3 tipos de pergunta que funcionam (análise estrutural / follow-up / tentativa Z3)
- O que ela faz vs NÃO faz (conectado à tese dele)
- Próximos passos (4 features mapeadas com prioridade)
- 5 princípios preservados

### K.2 — 4 memórias nível 1 cristalizadas

| Memory | Tipo | Conteúdo |
|---|---|---|
| `project_v1_9_388_smoke_final_vitoria_empirica_19_05` | project | Smoke 4 turnos + autorização 20-30 |
| `project_v1_9_388_matrix_voz_z2_pubmed_19_05` | project | Snapshot técnico 11 commits + métricas |
| `feedback_z2_nao_e_burrice_voz_intelectual_19_05` | feedback | Princípio arquitetural Z2 intelectual |
| `project_visao_final_eixo_pesquisa_19_05` | project | Jornada arquitetural completa |

### K.3 — Memorias adicionais cristalizadas no dia

- `feedback_pesquisa_materializacao_tese_ricardo_nao_drift_19_05` (audit cronológico 8 marcos)
- `project_ricardo_19_05_forum_validation_features_solicitadas` (Material A puro WhatsApp 13h)
- `project_byo_llm_arquitetura_parqueada_19_05` (arquitetura BYO-LLM)
- `feedback_state_pollution_noa_core_reutilizado_19_05` (anti-padrão pipeline reuse)

---

## 💰 BLOCO L — Madrugada/dia 20 cedo: pricing FULL + cashback dinâmico + cap+BYO sem trava

### L.1 — Pedro propôs rebaixar entrada (5R/40-50% margem)

Pedro pediu cálculo com plano FULL único por perfil, paciente AEC R$ 5, profissional paga custos add, aluno 40-50% margem. Hoje cenário canônico (memory `reference_pricing_model_canonical_18_05`) dá 75-78% margem teto teórico — Pedro questionou se rebaixar entrada não aumentaria conversão.

### L.2 — Cálculo empírico (não palpite)

Custos IA reais instrumentados em `ai_chat_interactions.metadata.cost_usd_estimate`:
- AEC turn: R$ 0,11 / Racionalidade: R$ 0,185 / Matrix V1.9.388: R$ 0,20 / TEACHING: R$ 0,15
- 1 AEC completa = ~13 turns = R$ 1,50
- Médico ativo intenso (Ricardo): R$ 75-150/mês IA

Insight crítico (esquecido no cálculo inicial): **cashback 5% incide sobre SaaS + consulta** (R$ 9,90 + R$ 500 = R$ 509,90 × 5% = R$ 25,49/paciente/mês). Em 50 pacientes = R$ 1.275/mês de cashback — é o **maior dreno** da margem.

### L.3 — GPT externo trouxe 3 insights operacionais válidos

Aplicando checklist anti-dialeto-paralelo (memory `feedback_pesquisa_materializacao_tese_ricardo_nao_drift_19_05`):

**✅ Aceitar**:
1. **Cashback dinâmico** em vez de fixo 5%: vira ferramenta comportamental, não custo estrutural permanente
2. **IA profissional R$ 75/médico é o risco escondido**, não cashback — cap Matrix mais importante estruturalmente que ajuste de %
3. **BYO-LLM vira peça central MAIS CEDO** que Marco 3 — sem BYO, plataforma "pune" o melhor comportamento (médico usar Matrix profundamente)

**❌ Rejeitar (re-cunhagem retórica)**:
- "infraestrutura terapêutica/comportamental"
- "custo marginal cognitivo é o centro"
- "IA subordinada ao método é raro" (Pedro JÁ tem isso há meses — CLAUDE.md "GPT é o último a falar e o primeiro a ser checado" + 8 camadas governança)
- elogios inflados ("arquitetura econômica sofisticada")

### L.4 — Cenário consolidado proposto (após calibração)

```
Plano FULL único por perfil:
  Paciente R$ 9,90/mês     (gateway, margem 54% unitária)
  Aluno R$ 59,90/mês        (Simulador+cursos+lives, margem 63%)
  Profissional R$ 99,90/mês + split 70/30 (cap Matrix + BYO opcional)

Cashback dinâmico:
  Early adopters (1os 50 pac): 5%
  Padrão pós-launch:           3%
  Consulta recorrente (3+/ano): +1%
  Campanhas pontuais:           até 5-8%

Caps mensais:
  Matrix profissional: 500 turnos beta (não 300 — evita viés)
  Simulador aluno:     300 turnos beta
  Chat Nôa paciente:   200 turnos (headroom 7×)

Reset: diário fracionado, NÃO cooldown 24h cego

BYO-LLM: disponível Marco 1 (CNPJ), não Marco 3 — opcional, médico paga
        direto OpenAI/Claude se quiser ultrapassar cap
```

Lucro mensal (10 méd + 50 pac + 10 alunos): **R$ 6.996 = 73% margem ✅**
Por sócio (÷4): **R$ 1.749/mês early-stage**, escala 150 pac vai pra R$ 5.000+

### L.5 — "Não trava financeiramente" — princípio Pedro

Pedro perguntou se cap + BYO comprometem usabilidade FINANCEIRA. Resposta cristalizada:

| Elemento | Trava UX financeira? |
|---|---|
| Mensalidade flat por perfil | ❌ não trava |
| Cap mensal Matrix com reset | ❌ não trava (zero cobrança extra) |
| BYO-LLM opcional externo | ❌ não trava (pagamento direto no provider, NUNCA via plataforma) |
| Cashback bônus em R$ | ❌ não trava (vira valor na carteira, não crédito a gerenciar) |
| Split 70/30 automático | ❌ não trava |

**Zero pontos de "compre mais créditos pra continuar"**. Modelo é flat fee + cap com reset, não compra de pacotes. Bate cap → aguarda reset OU ativa BYO (pagamento DIRETO no provider externo, plataforma não intermedeia).

### L.6 — 4 sinais comportamentais adicionais pra beta 20-30 (cashback)

Antes de fixar cashback dinâmico, observar:
1. Retenção longitudinal real (churn 3 vs 6 meses c/ vs sem cashback)
2. Frequência consulta (cashback aumenta recorrência?)
3. Sensibilidade psicológica (paciente percebe 3% vs 5%?)
4. Efeito no médico (ajuda fechar tratamento longitudinal?)

Somados aos 2 sinais do dia 19 (autoridade invisível de estrutura + cognitive offloading) = **6 sinais comportamentais** pra observar com 20-30 usuários.

### L.7 — Estado pricing pós-dia 20 cedo

- Memory `reference_pricing_model_canonical_18_05` precisa atualização (cashback dinâmico + cap+BYO sem trava + 6 sinais)
- Memory nova cristalizada: `reference_pricing_dinamico_cap_byo_sem_trava_20_05` (criada início dia 20)
- Implementação real parqueada pós-Marco 1 (CNPJ + Stripe Subscription + termo CDC)
- Beta 20-30 vai usar pricing ATUAL canônico (R$ 33,33 / R$ 149,90 / R$ 99,90 + cashback 5% fixo) — não trocar 2 variáveis simultaneamente

---

## 🎯 Frase âncora do dia

> *"Eixo pesquisa não é tab. É jornada: relatório → matrix conversa → dossiê médico → fórum sala. Cada etapa preserva Z2 estrutural sem cruzar linha clínica. E se não tiver voz intelectual ali, qual o sentido?"*

— Pedro 19/05/2026, materializando empíricamente 6+ meses de cristalização documental da tese Ricardo + autorizando escalada controlada beta orgânico 20-30 usuários

---

## 🚀 Estado para iniciar 20/05

**Matrix V1.9.388-A.7 deployada em produção** (frontend Vercel + Edge tradevision-core).

**Próximos passos parqueados** (ordem pragmática):
- **P0** F1 + F3 (auto-ativação Matrix pós-relatório + fechar dossiê) → fluxo end-to-end completo
- **P1** F4 (fórum publicação ativa, destrava Ricardo)
- **P2** F2 (function calling PubMed/KB no chat)
- **Observar com 20-30 usuários**: custo OpenAI agregado, regressão outros chats, drift sob carga, sinais comportamentais (autoridade invisível de estrutura + cognitive offloading)

**Próxima sessão lê**: 4 memórias nível 1 cristalizadas hoje + `feedback_regra_operacional_canonica_06_05` (regra escalada controlada) + `feedback_debitos_tecnicos_parecer_fiscal_01_04_pendentes_18_05` (5 débitos abertos).
