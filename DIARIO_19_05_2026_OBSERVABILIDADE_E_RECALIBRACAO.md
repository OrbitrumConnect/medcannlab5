# 📓 Diário 19/05/2026 — Painel Observabilidade IA + Vocabulário Ricardo + Recalibração honesta

**Autor:** Pedro Henrique Passos Galluf (CTO MedCannLab)
**Co-autor:** Claude Opus 4.7 (1M context)
**HEAD git ao iniciar:** `f16bfe2` (docs DIARIO 18/05 NOITE + 6 memories cristalizadas, push 4 refs OK)
**HEAD git ao encerrar:** `f0b181e` (V1.9.375-A 4 refinos UI vocabulário Ricardo)
**Commits do dia:** 3 cirúrgicos (V1.9.374, V1.9.374-A, V1.9.375-A) + diário/memories
**Lock CORE intocado:** V1.9.95 + V1.9.97 + V1.9.98 + V1.9.99-B + **V1.9.299 PBAD CONFORME** (tag `v1.9.299-pbad-conforme-locked` selado 16/05)
**Anti-kevlar §1:** respeitado 100%
**Frase âncora do dia:** *"3 erros empíricos meus em 1 dia (cache sem audit, IA-expansão como Ricardo, ação no contexto errado) cristalizaram Material A/B/C. Pesquisa últimos 2 dias não foi drift — foi materialização sistemática da tese Ricardo (8/8 pontos do áudio Uber têm reificação direta). Mas materialização ≠ uso clínico real. Caminho conceitual alinhado, validação empírica (Marco 2) segue pendente. Auditar via SQL antes de afirmar números."*

---

## 📚 Capítulos anteriores (resumo)

### 17/05 — Racionalidades + Teaching + Tese Escola Clínica Digital
- 10 commits V1.9.316 → V1.9.323-A2
- V1.9.320 DOCUMENT_LIST fix (4 fixes errados antes do certo)
- Tese **Escola Clínica Digital** cristalizada (5 camadas)
- Teaching Mode operacionalmente isolado
- Princípio meta: filtro 6 perguntas antes de codar

### 18/05 dia — Audience Contract + Dual-Write
- V1.9.330-A deployado (guard isPatient esconde texto bruto MTC)
- Trigger: namorada+amigos Pedro detectaram colapso de hierarquia interpretativa
- 2 memórias arquiteturais (Audience Contract + Dual-Write jsonb vs tabela)
- Presentation Contract Layer conceitualizado
- 3 marcos de reprecificação valuation (CNPJ / 3 pagantes × 3m / 2º médico)

### 18/05 noite — Literatura + Audit Fórum
- 11 commits V1.9.362 → V1.9.371
- Feature **Literatura PubMed** completa (4 tabs editoriais + cross-link racionalidade)
- Mini-relatório AGREGADO V1.9.371 (inteligência estrutural ≠ inferencial)
- **6 princípios MASTER** cristalizados (corpus governança emergente)
- Audit Fórum: 3 bloqueios → decisão Pedro NÃO codar até resolver
- V1.9.372 + V1.9.373 já após 22h (refinamentos PubMed + modal preview maior)

---

## ⏱️ Timeline cronológica 19/05

| Hora BRT | Versão | O quê | Camada |
|---|---|---|---|
| ~01h | — | Recuperação pós-crash chat — continuação direta sem reset | meta |
| ~02h | (sem código) | Áudio Ricardo Uber + análises GPT externas em camadas | tese |
| ~07h | (sem código) | Audit empírico via PAT (contradição custo painel vs memories) | calibração |
| ~08h12 | **V1.9.374** | Painel Observabilidade IA (Z1/Z2) com invariante runtime — push 4 refs OK | infra |
| ~08h34 | **V1.9.374-A** | Refinos pós-audit (cobertura % + composição users + flag subcontagem) | calibração |
| ~08h57 | **V1.9.375-A** | 4 refinos UI vocabulário Ricardo (cosmologia, queixa como referência) | linguagem |
| ~12h | (sem código) | Recalibração honesta: Pesquisa = materialização tese, não drift | meta |
| ~14h | (sem código) | Decisão Refino 5 (síntese narrativa) parqueado pra teste isolado | governança |
| ~17h | (sem código) | 3 memórias cristalizadas (Material A/B/C + Pesquisa-materialização + Audit custo) | corpus |

**3 commits cirúrgicos.** Push 4 refs em todos. Type-check clean.

---

## 🌅 BLOCO A — Acordar (madrugada → manhã)

### A.1 — Chat travado pós-V1.9.371

Pedro retomou após chat anterior travar em "Clean up Terminal Clínico UI and remove duplicate triggers". Pedi as memórias pra reativar contexto. Sessão emendou direto sem reset semântico.

### A.2 — Áudio Ricardo Uber chegou

Pedro trouxe áudio do Ricardo gravado durante Uber 19/05 manhã. Conteúdo (síntese do que captei do áudio cru = Material A):

> *"Cultura médica humana. Cosmologia. GPT por racionalidade — não generalista. Lago de dados primários, AECs assinadas, NFT como costura. Apoio à decisão; decisão humana. Queixas literais entre aspas, não parafraseadas. É cedo — o contexto do indivíduo ainda não foi desenvolvido. Estratégia x cultura: cultura come estratégia."*

8 pontos articulados pelo Ricardo no áudio.

### A.3 — Análises GPT externas em camadas (Material B)

Pedro trouxe 3 análises GPT externas sobre o áudio:
- (B1) reformulando os 8 pontos em linguagem mais densa
- (B2) propondo "razão T/E" (triagem/execução-externa) como métrica
- (B3) sugerindo painel virar prescritivo (autonomia técnica decidir o que aprovar)

E 1 análise IA-crítica do Antigravity (Material C) que pegou meu erro de tratar Material B como Material A.

---

## 🔬 BLOCO B — V1.9.374 Painel Observabilidade IA (Z1/Z2)

### B.1 — Conceito

Painel admin (Pedro/Ricardo) com **invariante runtime**: separa estritamente Zona 1 (técnica — custo, latência, tokens) de Zona 2 (estrutural — composição racionalidades, queixas dominantes, padrão uso).

Z3 (interpretativa) e Z4 (clínica) **NÃO ENTRAM** no painel — são sempre humanas (memory `feedback_limitar_autoridade_computacional_19_05`).

### B.2 — Estrutura (`src/pages/AdminAIGovernance.tsx` ~830 linhas)

```
KPIs topo: custo lifetime / custo 24h / chats lifetime / médicos ativos
Z1 Técnica:
├─ CostCard (custo observado)
├─ LatencyCard (p50/p95)
└─ TokensCard (prompt/completion split)
Z2 Estrutural:
├─ RationalityCompositionCard (5 ontologias %)
├─ ChiefComplaintTopCard (top 10 queixas normalizadas)
└─ UsagePatternCard (chats por hora/dia)
Banner Z3:
└─ "Interpretação clínica permanece humana. Painel mostra padrão, médico decide."
```

Tab "Observabilidade IA" adicionada em `AdminDashboard.tsx` (+5 linhas).

### B.3 — Smoke deploy

Build OK, Vercel auto-deploy OK. Pedro abriu painel V1.9.374 e viu **$4.81 custo lifetime** — número que disparou a investigação seguinte.

---

## 🔍 BLOCO C — Audit empírico contradição custo

### C.1 — Pedro pegou contradição

Pedro perguntou direto: *"painel é teatro de números?"*

| Fonte | Valor | Data |
|---|---|---|
| Memory `reference_custo_ia_instrumentacao_canonica_18_05` | $30/mês (~$2.95/3 dias) | 18/05 |
| Memory `audit_profundo_5_camadas_17_05` | $55/mês | 17/05 |
| Painel V1.9.374 | **$4.81 lifetime** | 19/05 |

Discrepância 6-11× ordem de magnitude.

### C.2 — Query empírica via PAT (única forma honesta de responder)

```sql
SELECT COUNT(*) AS total,
       COUNT(*) FILTER (WHERE metadata->>'cost_usd_estimate' IS NOT NULL) AS with_cost,
       COUNT(*) FILTER (WHERE metadata->>'cost_usd_estimate' IS NULL) AS without_cost,
       COUNT(*) FILTER (WHERE created_at >= '2026-05-13') AS post_v238,
       COUNT(*) FILTER (WHERE created_at < '2026-05-13') AS pre_v238
FROM ai_chat_interactions
```

**Resultado**:
```
total:        3.529
with_cost:      334 (9.5%)
without_cost: 3.195 (90.5%)
post_v238:      334 (100% têm cost)
pre_v238:     3.195 (100% NULL)
```

### C.3 — Diagnóstico

Hipótese **(a) confirmada**: instrumentação V1.9.238 (13/05) cobre apenas **9.5% das interações lifetime**. As 3.195 anteriores são invisíveis no painel.

Hipótese (b) "estimativas anteriores eram overestimates" REJEITADA.

**Reconciliação**: banco ≠ OpenAI billing dashboard. São fontes diferentes. Painel mostra subconjunto observado; custo real lifetime via billing OpenAI direto.

### C.4 — V1.9.374-A fix

`AdminAIGovernance.tsx` recebeu:
- **CoverageCard** (total lifetime / com cost / sem cost / % cobertura)
- Declaração honesta: *"Para custo real lifetime, consultar billing OpenAI direto"*
- Cita V1.9.238 como início da instrumentação
- KPIs: "Custo lifetime" → **"Custo observado lifetime"**

Memory cristalizada: `audit_19_05_subcontagem_custo_painel_v1_9_374`.

---

## 🎨 BLOCO D — V1.9.375-A Vocabulário Ricardo (cosmologia)

### D.1 — 4 refinos UI aplicados em `AdminCasosSimilares.tsx`

Material A do áudio Ricardo → refino direto, com lastro literal:

| Refino | Antes | Depois | Lastro Material A |
|---|---|---|---|
| 1. Banner ALPHA | "Exploração experimental de padrões narrativos" | adicionado parágrafo *"Cada racionalidade é uma cosmologia. Similaridade aqui é estrutural, não diagnóstica."* | áudio Ricardo: "cosmologia" |
| 2. Modal queixa | parágrafo solto | `<blockquote>` + label "Fala literal do paciente (referência)" | áudio: "queixas literais entre aspas" |
| 3. Toggle GPT | "Expansão IA" | "Apoio linguístico opcional — médico decide busca" | princípio Z3/Z4 |
| 4. Subtítulo aba | "Casos com similaridade textual" | "Casos estruturalmente correlatos segundo racionalidade clínica" | áudio: "DRC parecido ou quem acorda com luz azul" |

### D.2 — O que NÃO fiz (e por quê)

Material B propôs "8º princípio MASTER pluralidade epistemológica rastreável". **NÃO cunhei** — corpus já tem 3 princípios mais cirúrgicos cobrindo o mesmo terreno (`lexical_nao_e_clinica` + `inteligencia_estrutural_vs_inferencial` + `viabilidade_tecnica_vs_legitimidade_epistemologica`). Re-cunhagem precipitada.

Material B propôs banner "ground truth layer". Aceitei como observação parqueada, não como princípio MASTER novo.

---

## 🪞 BLOCO E — 3 erros empíricos pegados pelo Pedro

### E.1 — Erro 1: Cache de DB sem audit

Afirmei: *"V1.9.376 cache MEMORY_CACHE multi-bucket pra economizar 10.000 queries/dia desnecessárias"*.

Pedro me cobrou: *"por isso você viu como está o tradevision core e usou PAT para validar tudo isso que falou?!"*

Audit via PAT mostrou:
- Cache de idempotência já existe (V1.9.X)
- Gargalo real não é DB cache
- Gargalo real é pipeline AEC pós-consentimento (50s — memory `project_bug_pipeline_aec_50s_pos_consent_19_05`)
- Cache de DB não resolve 50s do pipeline serial

**Lição**: extrapolei padrão do super_service TradeContinuity (origem conceitual do core) sem auditar se MedCannLab realmente tinha o gargalo equivalente.

### E.2 — Erro 2: IA-expansão como Ricardo

Li texto Material B (com "💥 🧠 🚀" labels) como se fosse Ricardo falando. Cunhei "8º princípio MASTER" precipitadamente.

Pedro mandou Material C (IA-crítica Antigravity) que pegou o padrão.

**Lição cristalizada** (memory `feedback_material_a_b_c_separacao_19_05`):

| Material | O que é | Peso |
|---|---|---|
| A | Autor humano (áudio Ricardo, mensagem Pedro) | **Declaração** |
| B | IA expandindo o autor | **Comentário** |
| C | IA fazendo revisão sobre meu output | **Calibração** |

Confundir os três = inflação de autoridade alheia.

### E.3 — Erro 3: Ação no contexto errado

Peguei "execução externa > triagem" do Material B e propus **WhatsApp Cristiano + 9 médicos amigos** como movimento pra Marcos.

Pedro corrigiu: *"essa galera são usuários amigos testes até 50 iríamos fazer... Cristiano é amigo meu"*.

Falso movimento. Cristiano é amigo testador. Os 9 médicos são amigos da rampa até 50 — zero urgência regulatória ou contratual.

**Lição**: contexto da relação real (interno/amigo/parceiro/externo pagante) altera completamente o peso de uma "execução externa".

---

## 🔄 BLOCO F — Recalibração honesta dos 2 dias

### F.1 — Pedro me pegou de novo

Pedro perguntou: *"saímos da rota do app? últimos 2 dias foi tudo Pesquisa — áreas que ainda não estavam sendo mexidas"*.

Minha primeira resposta foi unilateral: **"drift exploratório / hipertrofiou em 24h"**.

Pedro trouxe Material B/C expandindo áudio Ricardo. Vi que minha leitura estava errada em uma dimensão e certa em outra.

### F.2 — Confusão que eu fiz

Misturei 2 perguntas:
1. **Caminho conceitual alinhado com tese institucional?** → SIM
2. **Caminho operacional moveu Marcos / pagantes?** → NÃO

Tratei como 1 só. Disse "drift" quando deveria ter dito "conceitualmente alinhado mas empiricamente pendente".

### F.3 — Audit honesto Pesquisa 18-19/05

**20 commits** (V1.9.354 → V1.9.375-A): Casos Similares + Literatura + Painel Observabilidade.

**Reificação direta da tese Ricardo (áudio Uber 19/05)**:

| Ricardo articulou | Materializou em |
|---|---|
| Lago de dados primários (corpus AECs) | Casos Similares lê `clinical_reports` (lago real) |
| Sem ChatGPT generalista | Verbatim First V1.9.86 + toggle GPT opt-in default OFF |
| GPT por racionalidade | V1.9.376 multi-racionalidade parqueado |
| Cosmologia | V1.9.375-A banner ALPHA + UI |
| Queixas literais entre aspas | V1.9.375-A `<blockquote>` + label "Fala literal" |
| Apoio à decisão. Decisão humana | Z3 cristalizado `feedback_limitar_autoridade_computacional_19_05` |
| É cedo / contexto indivíduo | Banner ALPHA V1.9.363 cita crítica formal Ricardo |
| Estratégia × cultura | Diários + memórias = cruzamento real |

**8 de 8 pontos** do áudio têm reificação direta. **Não é drift aleatório**.

### F.4 — Mas: validação empírica continua pendente

| Marco | Status |
|---|---|
| Marco 1 (CNPJ + cap table) | 0 |
| Marco 2 (3 pagantes × 3m) | 0 |
| Marco 3 (2º médico independente) | 0 |
| 9 médicos amigos sem cadastro | 9 |
| Adoção real Casos Similares por terceiros | ~0 (só Pedro) |
| Adoção real Literatura | 0 (acabou deploy) |

Tese materializada **conceitualmente**, **uso clínico real ainda não aconteceu**.

### F.5 — Princípio operacional cristalizado

> **Caminho conceitual alinhado com tese ≠ produto vivo. São dimensões separadas. Construção conceitual é pré-requisito mas não substituto da validação empírica.**

Aplicação:
- **Pré-PMF** (hoje): construção conceitual + bugs reais do core OK simultaneamente
- **Pós-Marco 2**: validação empírica vira métrica primária
- **Pós-Marco 3**: validação cross-médico (cosmologia testada por mais de 1 cabeça)

Memory: `feedback_pesquisa_materializacao_tese_ricardo_nao_drift_19_05`.

---

## 🛑 BLOCO G — Refino 5 (síntese narrativa) parqueado

### G.1 — Trigger

Material B propôs "Refino 5 — V1.9.375-B prompt síntese narrativa Casos Similares". Pedro perguntou: *"e tem como separar docs do app e docs q vieram etc? teria como iniciar modo free?"*

### G.2 — Análise risco

Material B classificou como **médio risco**:
- Síntese narrativa adiciona camada Z3 (interpretação) → potencial deslize pra território que princípio "limitar autoridade computacional" interdita
- Sem trigger empírico (médico pediu? caso real onde estrutural insuficiente?) → especulação

### G.3 — Decisão

Parqueado pra teste empírico isolado quando:
- 2º médico ativo OU
- Ricardo validar formato OU
- Caso real onde mini-relatório estrutural V1.9.371 prove insuficiente

NÃO implementar agora.

---

## 🩹 BLOCO H — "Livro" no áudio Ricardo (esclarecimento pendente)

Pedro perguntou: *"Tem fala de paciente indo pro Magno duvida? acho que não acho q seria outra coisa o livro não?!"*

Eu havia lido "livro" no áudio como Livro Magno. Audit empírico:
- Livro Magno está em `docs/LIVRO_MAGNO_*.md` (5 versões doutrinárias, sem PII paciente)
- Nenhum fluxo manda fala de paciente pro Livro Magno

Hipótese revisada: "livro" provavelmente = **Livro do Ricardo** ("A Arte da Entrevista Clínica" ou similar) — corpus autoral dele, não corpus institucional.

Esclarecimento pendente com Ricardo presencial.

---

## 📋 4 perguntas Z3/Z4 pendentes pra Ricardo presencial

1. "Livro" no áudio = Livro Magno ou Livro do Ricardo (autoral)?
2. Prazo entre paciente pedir troca de médico → médico ser substituído (memory parqueada `project_doctor_relation_card_design_18_05`)?
3. Refino 5 síntese narrativa — Ricardo quer ou prefere estrutural puro?
4. V1.9.376 multi-racionalidade ranking — Ricardo valida formato proposto antes de codar?

---

## 🔥 BLOCO I — Incidente OpenAI Quota 19/05 (~22h21 BRT 18/05 → ~11h BRT 19/05)

### I.1 — Diagnóstico empírico

Pedro reportou chat Nôa quebrado. Hipótese inicial: mexi no Core AEC. Audit empírico via `git show` dos 3 commits 19/05 (V1.9.374/374-A/375-A) **descartou** — zero arquivo do Core tocado.

Logs Edge `tradevision-core` confirmaram causa raiz:
```
error: 429 You exceeded your current quota
code: "insufficient_quota"
type: "insufficient_quota"
```

**Diagnóstico final**: OpenAI quota mensal estourou. NÃO regressão minha.

### I.2 — Timeline exata via PAT empírico

| Timestamp UTC | Evento |
|---|---|
| 00:55:57 (19/05) | Última call GPT bem-sucedida (gpt-4o, 20k prompt tokens, $0.052) |
| 01:21:30 | Primeira call em `TradeVision-Core-Deterministic` (Failsafe) |
| 12:00-13:30 | 11 calls 100% Failsafe, 0 tokens GPT |
| **14:02 UTC (~11h BRT)** | **OpenAI voltou** (Ricardo recarregou) — gpt-4o-2024-08-06 normal |

Janela offline: **~13h**.

### I.3 — Locks defensivos validados em produção

Durante toda a janela offline, arquitetura defensiva sustentou operação:

| Lock | Comportamento sem GPT |
|---|---|
| V1.9.95 FSM AEC | Avançou 13 fases até FOLLOW_UP |
| V1.9.86 Verbatim First | Cada pergunta IMRE entregue literal (hard lock por fase) |
| V1.9.97 AEC GATE V1.5 | "Agendamento retido: Fluxo clínico ativo tem soberania" |
| REGRA HARD §1 (anti-kevlar) | "concordo" na revisão ≠ "sim" no consentimento |
| V1.9.82 Fail-Safe Clínico | Devolveu verbatim em vez de fallback institucional |
| **Quality gate narrator V1.9.84** ← achado novo | Bloqueou criação de clinical_report quando GPT falhou (pipeline abortou em `handleFinalizeAssessment:1519`) |
| V1.9.213 dedupe | Reutilizou stubs existentes |

**Sovereignty Protocol v2** (implementado 27/02/2026 em `tradevision-core/index.ts:5595-6109`) executou 5 camadas determinísticas (Conceitos, Memória, Fatores, Rephrase, Blocos).

### I.4 — State pollution descoberto

3 sites mapeados que reutilizam Core conversacional para chamadas técnicas:

| Site | Bug confirmado |
|---|---|
| `AdminCasosSimilares.tsx:889` Síntese IA agregadora | Cria stub `clinical_report` via `processMessage(prompt, userId)` |
| `rationalityAnalysisService.ts:322` | Gerou racionalidade MTC com texto Failsafe "Registrado. Posso te ajudar com agenda..." (gravada no banco) |
| V1.9.213 dedupe | Burla quality gate narrator V1.9.84 reciclando stubs técnicos |

**3 reports lixo + 1 racionalidade MTC lixo** criados no banco (todos do Pedro admin como paciente teste).

### I.5 — V1.9.376 fixes parqueados (zero risco regressão)

| Fix | Risco AEC | Smoke obrigatório |
|---|---|---|
| A: Flag `bypassFSM=true` em chamadas técnicas | 0 | AEC real completa sem regressão |
| B: Filtro `metadata.source != 'technical_call'` no dedupe (acoplado a A) | 0 | Stub real ainda dedupa |
| C: Quality gate em `rationalityAnalysisService` | 0 | Racionalidade com GPT ON grava normal / GPT OFF mostra msg |
| D: Quality gate em `AdminCasosSimilares.tsx` Síntese IA | 0 | Idem |

3 memórias cristalizadas durante o incidente:
- `feedback_state_pollution_noa_core_reutilizado_19_05` (3 sites mapeados + 3 adendos)
- Princípio: "Reutilizar Core conversacional pra funcionalidade técnica polui estado AEC do usuário"
- Quality gate narrator V1.9.84 documentado pela primeira vez

---

## 🔌 BLOCO J — BYO-LLM (Bring Your Own LLM) — discussão estratégica

### J.1 — Trigger empírico

Após incidente, Pedro propôs BYO-LLM como direção futura: cada profissional conecta própria API key (OpenAI/Claude/Gemini/DeepSeek). Analogia precisa do Pedro:
> *"no caso voc claude estou usando dentro do app da antigravit! seria isso...vc tbm deve ter suas limitacoes nao?"*

**Sim**. Claude opera dentro de 3 camadas de subordinação: Anthropic (provedor) → Antigravity (ambiente IDE) → CLAUDE.md (projeto). Médico operaria dentro de 3 camadas: provedor LLM → MedCannLab (Locks/Gates/FSM) → caso clínico (CFM/LGPD/AEC).

### J.2 — Audit empírico de viabilidade

| Recurso | Status |
|---|---|
| Pattern provider-agnostic | ✅ Existe (`VideoProviderRegistry.ts` 03/03/2026) |
| Edge criptografia | ✅ Existe (`cert-encrypt-password` V1.9.177) |
| Único site OpenAI call | ✅ 1 ponto fork (`tradevision-core/index.ts:5354`) |
| Tabela `professional_integrations` | ⚠️ Existe mas schema OAuth — criar `professional_llm_config` nova |
| Edge `llm-key-encrypt` | ❌ Não existe — copiar pattern V1.9.177 |
| LLM Router em `tradevision-core` | ❌ Não existe — switch case + adapter |

**Conclusão arquitetural**: **aditivo puro, zero regressão**. Locks intactos. Filtro 6 perguntas (`feedback_coerencia_e_alinhamento_qualquer_fix_17_05`) passa 100%.

### J.3 — Análise empírica do PDF "Doc Mestre Conselho Técnico"

PDF GPT externo proposto como discussão estratégica. Audit revelou que **90% é re-descoberta** de coisas já cristalizadas:

| Quando | Onde | O quê |
|---|---|---|
| 03/02/2026 | AUDITORIA_COS_5_0_FINAL (Antigravity) | "OpenAI cai → sistema lobotomizado" |
| 27/02/2026 | DIARIO_27_02 + index.ts:5595+ | Motor Determinístico Sovereignty Protocol v2 IMPLEMENTADO |
| 03/03/2026 | DIARIO_03_03 + VideoProviderRegistry | Pattern provider-agnostic |
| 01/04/2026 | PARECER_FISCAL_INDEPENDENTE | "Design resiliente" classificado |
| 28/04/2026 | project_piramide_governanca_28_04 | 8 camadas formalizadas |
| 07/05/2026 | DIARIO_07_05:972 | "Single point of cognitive failure" |
| 14/05/2026 | pitch_atual_14_05.md:48 | **"Infraestrutura cognitiva auditável"** no pitch |

**10% novidade real**: BYO-LLM operacional + Multi-LLM router + Fine-tuning Llama 8B.

Incidente 19/05 **não revelou arquitetura nova** — **validou em produção** o que estava cristalizado há 3,5 meses.

### J.4 — Pricing BYO — decisão cristalizada

Pedro decidiu: **desconto máximo R$ 10** pra médico que ativar BYO.

Cálculo prudente:
```
desconto_max_seguro = custo_openai_observado_por_medico × 0.7
                    = R$ 50 × 0.7 = R$ 35 (teto)
```

R$ 10 é seguro (dentro da margem). Decisão final pós-Marco 2 quando observar adoção real.

### J.5 — Quem paga?

| Modelo | Quem paga LLM |
|---|---|
| Hoje (sem BYO) | Pedro pessoal (~$25/recarga, cartão pessoal pré-CNPJ) |
| Médico ativa BYO | Médico paga próprio uso direto pra provider (NÃO passa pelos $25) |
| Médico desativa BYO | Volta pra plataforma → Pedro paga (ou assinatura cobra) |

Hoje 0 pagantes externos. Custo OpenAI absorvido por Pedro. BYO-LLM faz sentido pós-Marco 2/3 quando custo > 30% MRR.

### J.6 — Memory parqueada

`project_byo_llm_arquitetura_parqueada_19_05` cristalizada com:
- Schema completo
- Edge function design
- UX (nova rota `/profissional/configuracoes` com Tab "🤖 IA")
- 6 pré-condições obrigatórias do profissional
- Whitelist de providers (Tier 1/2/3 + bloqueados)
- 4 limites não-negociáveis
- 6 riscos não-óbvios + mitigações
- Decisões humanas pendentes (Pedro + João + advogado + Ricardo + Eduardo)
- Triggers empíricos pra ativar (recalibrados com lastro)
- Pricing decisão R$ 10 desconto máximo

---

## 📂 Arquivos modificados/criados (19/05)

### Código (3 commits)
- `src/pages/AdminAIGovernance.tsx` (NOVO ~890 linhas final pós V1.9.374-A)
- `src/pages/AdminDashboard.tsx` (+5 linhas tab Observabilidade IA)
- `src/pages/AdminCasosSimilares.tsx` (V1.9.375-A: banner cosmologia + blockquote queixa + toggle GPT label + subtítulo)

### Memory cristalizadas (5 novas)
- `memory/feedback_material_a_b_c_separacao_19_05.md`
- `memory/feedback_pesquisa_materializacao_tese_ricardo_nao_drift_19_05.md`
- `memory/audit_19_05_subcontagem_custo_painel_v1_9_374.md`
- `memory/feedback_state_pollution_noa_core_reutilizado_19_05.md` (incidente + 3 adendos)
- `memory/project_byo_llm_arquitetura_parqueada_19_05.md` (arquitetura técnica completa + pricing)

### Docs
- `DIARIO_19_05_2026_OBSERVABILIDADE_E_RECALIBRACAO.md` (este arquivo)

---

## 📊 Métricas empíricas (audit via PAT 19/05 manhã)

| Métrica | Valor real | Observação |
|---|---|---|
| ai_chat_interactions lifetime | 3.529 | — |
| - com cost_usd_estimate | 334 (9.5%) | Pós-V1.9.238 (13/05) |
| - sem cost (NULL) | 3.195 (90.5%) | Pré-V1.9.238 |
| Custo observado lifetime | $4.81 | Subconjunto 9.5%, NÃO lifetime real |
| Custo OpenAI real lifetime | ~$30-55 (estimado) | Via billing dashboard, NÃO via banco |
| Pedro (admin testing) | 656 interações × $3.47 | 72% do custo logado |
| Carolina Campello | 882 interações × $0.18 | Verbatim First V1.9.86 funcionando (99% bypass GPT) |
| Dr. Eduardo Faveret | 42 interações × $0 | Pré-V1.9.238 ou cost tracking quebrado |
| João Vidal (anomalia) | type='patient' apesar de sócio | Drift histórico aceito |
| Inconsistência type EN/PT | 28 'patient' vs 3 'paciente' | Audit parqueado |

---

## 🪧 Frase âncora do dia

> *"3 erros empíricos meus em 1 dia (cache sem audit, IA-expansão como Ricardo, ação no contexto errado) cristalizaram Material A/B/C. Pesquisa últimos 2 dias não foi drift exploratório — foi materialização sistemática da tese Ricardo. 8 de 8 pontos do áudio Uber 19/05 têm reificação direta. Mas materialização conceitual ≠ uso clínico real. Caminho conceitual alinhado com tese institucional; validação empírica (Marco 2) segue pendente. Auditar via SQL antes de afirmar números. Princípio Material A/B/C operacionaliza drift_historico_dev_aceitavel aplicado a autoridade alheia."*

---

Cristalizado 19/05/2026 ~17h BRT.
HEAD: `f0b181e` (V1.9.375-A 4 refinos UI vocabulário Ricardo).
Push 4 refs (amigo+medcannlab5 × main+master): OK em todos os 3 commits.
Type-check clean em todos os 3.
Lock V1.9.95+97+98+99-B+299 PBAD: intocado 100%.
Anti-kevlar §1: respeitado 100%.
3 memórias persistentes cristalizadas + MEMORY.md index atualizado.
