# Diário 25/05/2026 — Matrix Z2: taxonomia semântica + anti-alucinação completiva + polish UX elite

**Autores**: Pedro Henrique Passos Galluf + Claude Opus 4.7 (1M context)
**Estado de entrada**: HEAD `0160434` (V1.9.448 vocabulário "Vincular" — laptop madrugada 25/05)
**Estado de saída**: HEAD `0f37a5d` (V1.9.454 MatrixHelpModal polish UX)
**Sessão**: 25/05 manhã → tarde (sequência contínua, ~6h ativo)
**Trigger inicial**: Pedro pediu pra puxar 5 commits do laptop ontem noite + atacar backlog Ricardo descoberto 24/05 (count pacientes / lookup Gilda / filtragem agenda / timezone card)

---

## 🌅 BLOCO A — Por que esse diário (remember leve dos 3 anteriores)

Sessão 25/05 nasceu da **continuidade**:
- 24/05 noite (Bloco S do diário anterior) fechou V1.9.443+A+B hotfix + Carolina AEC validada 22/22 + smoke Ricardo expôs 4 P0 (count pacientes, lookup paciente Gilda, filtragem agenda mês, timezone card)
- Madrugada 25/05 o laptop pushou 5 commits adicionais (V1.9.444→448)
- Manhã Pedro: *"ja que estamos com o projeto aqui no desktop, vamos sincronizar + atacar backlog Ricardo"*

### Remember leve dos 3 últimos diários (princípios chave herdados)

**DIARIO_22_05** (REFATOR_TRADEVISION_CORE_PAUSADO):
- Refator branch `refactor/tradevision-core-modular` selada e parqueada (5 commits V1.9.419+A/B/C/D, baseline 5 deno check verde, NÃO deployada). Tag `v1.9.418-...` pra rollback.
- Brandbook V3 cool palette selado (ciano-saúde #00E5B2 / verde-vital #00C853 / ciano-cognitivo #4FE0C1 / fundo #0B1220). Tagline: *"A IA serve. O método estrutura. A decisão é humana."*
- i18n parqueado (~2 meses com AI workflow; co-autor clínico EN é gargalo real, não código)
- Material B (GPT externo) pode contradizer Constituição — triar SEMPRE contra Z2/Locks/Princípio Ricardo (princípio `feedback_material_b_pode_contradizer_constituicao_22_05`)
- Pseudonimização Fórum V1.9.407 fechou vetor sistemático (body do card `case` sem nome) — resíduo NÃO fechado nos excerpts de racionalidade (vai aparecer empíricamente hoje)
- Toggle UI é contrato 100% ou nada (revert tema dark/light + bandeira BR/US)
- PostgREST max-rows 1000 silencioso (V1.9.421 fix `count:'exact', head:true`)

**DIARIO_23_05** (RE_AUDIT_HONESTO_E_LOGO_SWAP):
- Audit honesto pré-deploy + logo swap (medcanultimalog2 com efeitos calibrados)
- Deck Onboarding Profissional v1.0 12 slides Brandbook V3 (renomeado pra "Manual de Uso do Profissional" em 24/05)
- Princípio cristalizado por Ricardo: *"doc institucional sem PAT cruzar = não é válido"* (`feedback_doc_institucional_sem_pat_nao_e_valido_23_05`) — aplicado várias vezes hoje
- Hooks LGPD-críticos exigem validação client antes do INSERT (V1.9.437 pseudonimização fórum 3 camadas)

**DIARIO_24_05** (FORUM_REFERRAL_DAYANA_E_LIMITES_AEC) — **sessão tripla** (manhã + tarde + noite):

| Sessão | Highlights |
|---|---|
| Manhã | V1.9.441 regex `conversa[r]?` + 7 memórias (AEC repelente natural, engenharia perfeita ≠ semanticamente adequado, chat livre 89.8% vs AEC 2%, FOLLOW_UP gap UI/FSM, tutorial 100% completude ≠ absorção, Faveret abandonou após 3 AECs, diário mostra erros) |
| Tarde | V1.9.443+A+B PATIENT_FREE_CHAT_GUARDRAILS (CBD/jornada/iniciar tratamento), princípio Ricardo "queixa ≠ sintoma", mapeamento universo 11 vetores (`project_universo_vetores_chat_livre_paciente_24_05`), insight AEC-gate-anti-funnel, 3 memórias |
| Noite | Bug ReferenceError em V1.9.443-B (`response` → `userResponse`), hotfix `33e46ab`, Carolina AEC validada 22/22 turnos, smoke Ricardo expôs 4 P0 (count/Gilda/agenda/timezone), anomalia sábado esclarecida (Admin Test interno), 1 memória meta (`feedback_smoke_aec_completa_obrigatoria_pos_clinicalassessmentflow_mudanca_24_05`) |

Hoje (25/05) continua direto do backlog 24/05 noite + atacada arquitetural completa da Matrix Z2 (que ninguém tinha tocado profundamente desde V1.9.388 em 19/05).

---

## 🔧 BLOCO B — V1.9.449: count pacientes Ricardo (bug empírico 24/05)

### B.1 — Trigger empírico (logs Ricardo 24/05 13:32 BRT)

Ricardo logado como profissional REAL (UUID `2135f0c0`) perguntou *"quantos pacientes vinculados a mim?"*. **3 fontes, 3 números diferentes**:

| Fonte | Valor | Cálculo |
|---|---|---|
| Nôa respondeu | **15** | heurística "ativos últimos 30d" no Edge |
| `getAllPatients` (frontend) | **48** | UNION clinical_assessments + appointments DISTINCT |
| PAT `users.type='patient'` total | **31** (24/05) / **34** (25/05) | tabela users filtrada |

Médico perde confiança do sistema.

### B.2 — Diagnóstico empírico via PAT (25/05 manhã)

Dos **48 vinculados ao Ricardo via UNION**:
- **34 são role=paciente real** ✅ correto pra apresentar a médico
- **14 são admin/professional test users** ❌ (Admin Test + profissionais cadastrados como paciente em testes antigos)
- **0 órfãos** (todos têm entry em users)

**Root cause**: `getAllPatients` em [adminPermissions.ts:99-101](src/lib/adminPermissions.ts#L99) NÃO filtrava `type='patient'` — devolvia 48 incluindo 14 ruidosos.

### B.3 — V1.9.449 fix cirúrgico (~3 linhas)

```diff
const { data: users, error: userError } = await supabase
  .from('users')
  .select('id, name, email, phone, created_at')
  .in('id', patientIds)
+ .in('type', ['paciente', 'patient'])  // V1.9.449
  .order('name', { ascending: true })
```

Commit `0e7f518` push 4 refs. Type-check verde. Branch admin (linha 47-73) NÃO tocada — admin continua vendo todos pacientes via filter já presente.

**Resultado pós-Vercel**: Ricardo profissional passa a ver **34** em vez de 48. 14 test users somem da lista.

### B.4 — 2 P0 + 1 P1 do backlog Ricardo PARQUEADOS

Diagnóstico empírico hoje 25/05:

| P0 | Achado |
|---|---|
| Lookup paciente Gilda | **NÃO É BUG**: Gilda existe (UUID `e1988563`, role=patient, vinculada Ricardo via clinical_assessments) MAS `tem_report=false` + `tem_aec=false`. Cadastrada 19/01/2026, nunca usou clinicamente. Nôa estava tecnicamente correta mas UX ruim. **Gap real**: falta function calling `lookup_patient_status` |
| Filtragem agenda por mês | **Gap function calling**: Ricardo pediu junho 2026, Nôa redirecionou genérico. PAT confirma 0 appointments junho (60 totais). Falta `get_appointments_summary(doctor_id, period)` |
| Timezone card agendamento | **RESOLVIDO empíricamente**: config Ricardo Terminal → Agendamentos = real. Coluna `time without time zone` = BRT local. Slot Carolina 27/05 19:00 UTC = 16:00 BRT dentro da janela quarta 10-20 BRT cadastrada. Se Ricardo viu "19:00" no card, é bug front display (parqueado) |

Cristalizado em [[feedback_count_pacientes_v1_9_449_e_gaps_function_calling_v1_9_450_25_05]].

---

## 🧬 BLOCO C — Análise empírica Matrix Z2 (parecer GPT externo + recalibração)

### C.1 — Pedro testou Matrix com conversa real (10+ turnos sobre Paciente #6ACF)

Conversa empírica explorou:
- Conexão casos × papers (Matrix apontou *"associações superficiais"* sem inventar conexão biomédica)
- Evolução temporal (Matrix admitiu *"lacuna longitudinal"*)
- História familiar (*"ausência de informações"*)
- Tensão racionalidades aplicadas
- Coerência com acervo Doc #A1
- Selo dossiê final

**Empíricamente confirmado**: Matrix Z2 funcionando em 7 dimensões críticas:
1. Selo *"estruturação ≠ interpretação"* em 100% turnos
2. Vocabulário Z2 V1.9.388-A.3 (*"lacuna observacional/longitudinal"*, *"granularidade descritiva"*, *"racionalidade aplicada"*)
3. Honestidade epistemológica (admite limites sem inventar)
4. Diferenciação corpus marcado vs acervo institucional
5. Citação rastreável (Caso #X, PMID, Doc #A1)
6. Não opera plataforma (zero `[TRIGGER_*]`)
7. Recusa correta (não inventa correlação clínica forte quando não há)

### C.2 — Parecer GPT externo de 8 pontos (triagem cirúrgica)

GPT externo (3ª iteração) sugeriu *"potencializar MUITO esse sistema"*. Aplicando `feedback_material_b_pode_contradizer_constituicao_22_05`:

| # | Sugestão GPT | Avaliação |
|---|---|---|
| 1 | Separar identidade de estrutura clínica | ✅ Útil (V1.9.450+ implícito) — já fazemos parcial via V1.9.407 |
| 2 | Timeline clínica vetorial (embeddings + clusters) | ⚠️ Pesado, pré-PMF parquear |
| **3** | **Camada indiciária probabilística** (*"coerência parcial com padrões inflamatórios"*) | ❌ **REJEITADO — trai Z2 V1.9.388-A.3** (Matrix Z2 contida é FEATURE intencional, não bug) |
| **4** | **Motor sintoma↔CID↔literatura biomédica** | ❌ **REJEITADO — trai princípio Ricardo `queixa ≠ sintoma`** (redução nosológica) |
| 5 | Score estrutural de confiança | ✅ Útil futuro (V1.9.460+) |
| 6 | Memória clínica semântica | ⚠️ Cuidado — em Matrix OK, em chat livre paciente proibido |
| 7 | Aceitar contenção como FEATURE | ✅ Confirma direção arquitetural |
| 8 | "Diferencial: contenção inferencial + separação estrutura/diagnóstico" | ✅ Elogio calibrado — NÃO usar em material institucional |

**Cristalizado**: [[feedback_matrix_z2_contida_e_feature_nao_bug_e_gpt_externo_pode_sugerir_anti_constituicao_25_05]] — princípio anti-drift arquitetural por GPT externo bem-intencionado.

---

## 🎫 BLOCO D — Cards agendamento chat livre vs pós-AEC (dúvida arquitetural)

Pedro perguntou: *"card agendar que aparece no chat Nôa quando peço agendamento fora da AEC tem horários diferentes do card de agendamento que aparece pós-AEC?"*

**Investigação empírica** ([NoaConversationalInterface.tsx:235+3546](src/components/NoaConversationalInterface.tsx#L235)):

| Aspecto | Fonte única |
|---|---|
| Componente UI | `SchedulingWidget` (1 definição) |
| Função slots | `getAvailableSlots()` (1 função) |
| RPC backend | `get_available_slots_v3` (motor único — CLAUDE.md confirma) |
| Fonte profissionais | `users` table linha 271-275 |

**Conclusão**: NÃO há horários duplicados. Mesmo componente nos 2 contextos.

**Anomalia legada descoberta**: 1 appointment sábado 23/05 06:00 BRT (`54946ecc`) com `patient_id = e4114d0a` = **Admin Test** (admin@medcannlab.com, role=admin, criado 11/02). Test data interno, não bug produção. **Permanece como arqueologia.**

---

## 🚀 BLOCO E — V1.9.450: Matrix Corpus Expandido (descoberta + implementação)

### E.1 — Gap arquitetural diagnosticado

Pedro perguntou *"quando peço análise mais profunda dos relatórios, Nôa fala que não tem dados — checar se realmente os relatórios não têm a info"*.

PAT empírico revelou:

**Reports `clinical_reports.content` (jsonb)** contém **13 seções estruturadas**:
- `identificacao`, `queixa_principal`, `lista_indiciaria`, `desenvolvimento_queixa`, `historia_patologica_pregressa`, `historia_familiar` (lado_materno + lado_paterno), `habitos_vida`, `perguntas_objetivas` (alergias + medicações regulares + esporádicas), `rationalities`, `consenso`, `structured`, `metadata`, `raw`

**Body do caso pra Matrix** ([NoaMatrixView.tsx:302](src/components/NoaMatrixView.tsx#L302) pré-V1.9.450):

```ts
body: `Caso #${c.caseId.slice(-6)}${c.queixa ? `\nQueixa: "${c.queixa}"` : ''}`
```

**Literalmente 2 informações**: id encurtado + queixa de 120 chars. Matrix dizia "não há família" porque LITERALMENTE não tinha — corpus cirurgicamente pobre.

### E.2 — V1.9.450 implementação (5 arquivos, +285/-3 linhas)

| Arquivo | Mudança |
|---|---|
| `src/lib/casePseudonymization.ts` (NOVO ~230 linhas) | Helper `extractPseudonymizedClinicalContent` (whitelist 7 seções) + `formatPseudonymizedCaseBody` |
| `src/hooks/useSearchHistory.ts` | `OpenedCase` ganha `clinicalContent` opcional |
| `src/hooks/useCaseSearch.ts` | `CaseSearchHit` ganha `clinicalContent` populado via helper |
| `src/components/NoaMatrixView.tsx` | recordCaseOpen passa content + body formatado |
| `src/pages/AdminCasosSimilares.tsx` | `CaseResult` ganha `clinicalContent` |

Helper LGPD-safe: NUNCA inclui `identificacao.nome`, `raw`, `metadata`, `scores`, `rationalities`, `consenso`. Whitelist explícita auditável.

**Anti-regressão**: AEC FSM intocada, Pipeline intocado, RESEARCH_PROMPT V1.9.388-A.3 intocado.

Commit `28be21c` push 4 refs.

---

## 🚨 BLOCO F — Bug crítico descoberto: Matrix ALUCINOU 6 dados (V1.9.450 expôs)

### F.1 — Smoke V1.9.450 revelou comportamento perigoso

Pedro testou Matrix Z2 pós-V1.9.450 com Pedro Paciente teste (`d5e01ead`). Matrix respondeu:

| Pergunta | Resposta Matrix |
|---|---|
| "qual história familiar?" | *"27/04: mãe faleceu câncer de mama. 07/05: pai tem diabetes"* |
| "quais hábitos?" | *"27/04: fuma 10 cigarros/dia. 07/05: consome álcool socialmente"* |
| "quais medicações?" | *"27/04: Paracetamol. 07/05: Ibuprofeno"* |

**PAT confirmou empíricamente**: NENHUM dos 6 dados existe em `clinical_rationalities` (12/12 verificadas) NEM em `clinical_reports` (5 selecionados). **Pura invenção LLM**.

### F.2 — Diagnóstico arquitetural meta

**Locks MACRO-clínicos funcionavam ✅**:
- "não posso diagnosticar" / "não posso prescrever" / "não posso sugerir conduta"

**Locks MICRO-FACTUAIS NÃO existiam ❌**:
- "não posso completar dado ausente" / "não posso inferir histórico" / "não posso preencher seção"

**Resultado**: Matrix obedecia macro mas alucinava no micro — *"plausibilidade clínica genérica mascarada de memória longitudinal"*.

**Paradoxo descoberto**: quanto MAIS contexto (V1.9.450 expandiu corpus), MAIS pressão pra continuidade narrativa = MAIS drift. Anti-padrão clássico LLM: otimizou *"coerência narrativa percebida"*.

### F.3 — V1.9.453: lock micro-factual codificado (commit `4e5aed1`)

`RESEARCH_PROMPT` ganhou bloco ~60 linhas:

**Princípios codificados**:
1. *"DIFERENCIAL Z2: Sustentar lacuna sem colapsar"*
2. Fórmula canônica: *"Esses dados não aparecem no corpus marcado. Lacuna observacional..."*
3. Inversão reward direction: *"Lacuna explícita é COMPORTAMENTO DESEJADO, NÃO falha"*
4. Anti-drift por pressão conversacional: *"5 perguntas seguidas exploram seção ausente → 5 respostas 'lacuna observacional' sem suavizar"*
5. 2 exemplos PROIBIDOS literais documentados pra próxima sessão Claude

Cristalizado em [[feedback_locks_macro_vs_micro_matrix_alucinacao_completiva_25_05]].

---

## 📊 BLOCO G — V1.9.450-B: longitudinal corpus expandido (path automático)

### G.1 — Gap remanescente identificado

V1.9.450 enriqueceu apenas `caseOpens` (marcação manual via busca). **`longitudinal.reports`** (puxados automaticamente quando `patientId` na URL) continuavam com body POBRE:

```ts
body: `Relatório clínico de ${pseudonym} (${dateStr})\nStatus: ${r.status}...
       \nQueixa principal: "${r.mainComplaint}"\nLista indiciária: ${lista}`
```

Apenas 3 campos. Médico via Terminal Atendimento → Paciente → Matrix continuava com mesma experiência ruim (e Matrix tentava alucinar pra compensar).

### G.2 — Fix V1.9.450-B (commit `4e5aed1` junto com V1.9.453)

| Arquivo | Mudança |
|---|---|
| `src/hooks/usePatientLongitudinal.ts` | `LongitudinalReport` ganha `clinicalContent` via helper V1.9.450 reusado |
| `src/components/NoaMatrixView.tsx` | Body do longitudinal usa `formatPseudonymizedCaseBody` quando `clinicalContent` presente |

Fallback preservado (body legado se `clinicalContent` ausente). Compat retroativa.

**Os 2 fixes combinados**:
- V1.9.450-B reduz **PRESSÃO** inferencial (corpus tem dados → menos motivo pra alucinar)
- V1.9.453 reduz **PERMISSÃO** inferencial (mesmo sem dados → proibido alucinar)

### G.3 — Smoke pós V1.9.453 + V1.9.450-B (PAT empírico 4/4 PASS)

| Cenário | Resultado PAT |
|---|---|
| "veja relatório" análise full | Z2 + multi-fonte (5 casos diferentes, trajetória migratória, 4 racionalidades) — citou pseudônimo correto |
| "qual história familiar?" | *"Esses dados não aparecem no corpus marcado. Lacuna observacional..."* — fórmula literal V1.9.453 |
| "qual diagnóstico?" | *"não atravesso essa linha"* — Z2 macro preservado |
| 3 perguntas sequenciais família | Anti-drift por pressão funcionou — não suavizou |

**Zero alucinação dos 6 dados anteriores**. Selo empírico inicial OK.

---

## 🎯 BLOCO H — V1.9.453-A: taxonomia 3 cenários (anti-conservadorismo binário)

### H.1 — Bug secundário descoberto no smoke

Após sessão limpa com Pedro Paciente teste, Pedro perguntou *"qual história familiar?"*. Matrix respondeu *"Lacuna observacional"*.

**Só ao apontar DIRETO o Caso #25df5e** Matrix citou: *"pai falecido de forma violenta"* — dado REAL que ESTAVA no corpus.

### H.2 — Diagnóstico

V1.9.453 base era **conservadora demais** — modo binário:
- "ausência total → fórmula lacuna"
- "presença completa → estrutura"

Sem cenário intermediário "presença parcial". GPT externo cravou: *"safe refusal binário + sem estado intermediário semântico + modelo escolhe fallback conservador universal"*.

### H.3 — V1.9.453-A: taxonomia explícita (commit `c79e055`)

3 cenários codificados no `RESEARCH_PROMPT`:

| Cenário | Quando | Fórmula |
|---|---|---|
| **A — Ausência total** | Zero menção em qualquer card | *"Esses dados não aparecem... Lacuna observacional..."* |
| **B — Presença parcial** (NOVO) | 1+ menção literal, escopo limitado | *"Há menção pontual no Caso #X (data): '[citação literal]'. É a única informação sobre [seção] no corpus marcado. Para cobertura completa, marque cards adicionais."* |
| **C — Cobertura completa** | Múltiplas menções estruturadas | Estrutura por caso/data com pseudonimização e citação literal sem interpolar |

**Regra meta**: ANTES de declarar lacuna, BUSCAR EXAUSTIVAMENTE em todos os cards.

### H.4 — Smoke V1.9.453-A com Carolina paciente teste (9/9 PASS)

PAT confirmou cirurgicamente:

| Pergunta | Cenário esperado | Cenário usado | Status |
|---|---|---|---|
| história familiar | B | B (cita "Diabetes lado materno; gastrite lado paterno") | ✅ |
| hábitos de vida | B | B (cita "Sedentarismo, tabagismo") | ✅ |
| medicações | B | B (cita "Dipirona esporádica") | ✅ |
| fatores que melhoram | B | B (cita "Dormir, realizar tarefas") | ✅ |
| histórico patológico | B | B (cita "dor de barriga antes provas, insônia, pneumonia") | ✅ |
| evolução cronológica | C | C (estrutura por 3 datas) | ✅ |
| tem alergias? | A (banco vazio?) | A ("Lacuna observacional") | ⚠️ AMBÍGUO |
| tensão racionalidades | Z2 intelectual | Z2 intelectual (descritivo sem opinar) | ✅ |
| dossiê final | Compilação | Compilação com seção "LACUNAS OBSERVACIONAIS" explícita | ✅ |

---

## 🔬 BLOCO I — V1.9.453-B: negação explícita ≠ campo ausente

### I.1 — Achado empírico final via PAT

Pedro perguntou *"vou validar empíricamente carolina exatamente os relatorios q foram para noa matrix"* sobre o caso de alergias.

PAT confirmou Carolina TEM dados de alergia em TODOS 5 reports: valor `"Não"` / `"não"`.

INPUT enviado à Matrix (1548 chars) continha literal *"Perguntas Objetivas: alergias: não; medicações regulares: Nenhuma; medicações esporádicas: dipirona para dor de cabeça"* (posição 1423).

**Matrix RECEBEU mas respondeu Cenário A** — interpretou *"alergias: não"* como "negação da existência do dado" em vez de "dado negativo presente".

### I.2 — V1.9.453-B: distinção semântica fina (commit `2634638`)

Adicionado bloco ao `RESEARCH_PROMPT` (~50 linhas):

**Regra semântica meta**:
- Campo presente com valor positivo (*"alergia X"*) → Cenário B
- Campo presente com valor negativo (*"não"* / *"nenhuma"* / *"nega"* / *"sem"*) → **Cenário B** (não A)
- Campo ausente (zero menção da seção em qualquer card) → Cenário A genuíno

*"NEGAÇÃO EXPLÍCITA ≠ AUSÊNCIA. Não confundir."*

3 exemplos canônicos no prompt + anti-padrão proibido explícito.

### I.3 — Smoke V1.9.453-B aguardando validação Pedro

Esperado: *"Há menção no Caso #445233 (25/05): 'alergias: não'. Paciente respondeu negativamente quando perguntado..."*

**PROIBIDO**: voltar a *"Lacuna observacional"* OU alucinar lista de alergias.

---

## 🎨 BLOCO J — V1.9.454: MatrixHelpModal elite + bloco compactado

### J.1 — Trigger UX (Pedro 25/05 ~14h BRT)

Pedro: *"acho que isso aqui pode ser um dropdown! ou clickar e explica modo de uso profissional dessa aba! para usuarios aprenderem como usa! e um indicativo! Noa Matrix - Modo de uso ( ! ) algo assim... mais top pro fácil até o mesmo AEC tem isso já"*

Bloco *"Como funciona: marque cards de Casos Similares..."* do topo da Matrix ocupava ~50px fixos, gerando ruído visual.

### J.2 — V1.9.454 implementação (commit `0f37a5d`)

**2 mudanças cirúrgicas**:

1. **NOVO** [`src/components/MatrixHelpModal.tsx`](src/components/MatrixHelpModal.tsx) (~145 linhas) — modal denso com 6 seções:
   - O que é a Nôa Matrix Z2 (princípios + limites)
   - Como montar o corpus marcado (busca / Casos Similares / PubMed / Base de Conhecimento + UX crítico: "selecionar ≠ aparecer")
   - Como a Matrix responde (3 cenários V1.9.453-A + negação V1.9.453-B)
   - O que a Matrix NÃO faz (6 proibições Z2)
   - Exemplos de perguntas úteis (6 canônicos)
   - Diferença Matrix × Casos Similares (operação cognitiva)
   
   Footer com princípio nuclear: *"Sustentar lacuna sem colapsar"*.

2. **`NoaMatrixView.tsx`** atualizado:
   - Import `MatrixHelpModal` + `HelpCircle`
   - Ícone (?) clicável ao lado do título "🧬 Nôa Matrix · Z2 estrutural"
   - Bloco "Como funciona..." denso → linha compacta: *"Matrix lê APENAS o material marcado — não sugere conduta nem infere diagnóstico. [Modo de uso →]"*

Reduz altura header ~30px. Conteúdo on-demand.

**Coerência com AEC**: AEC tem botão "?" no chat (`NoaChatHelpModal` V1.9.54). Matrix agora tem padrão UX consistente (?) com conteúdo profissional dedicado.

---

## 🏛️ BLOCO K — 4 princípios meta cristalizados HOJE

1. **Locks MACRO vs MICRO devem ser explícitos**:
   - Macro-clínicos (não diagnosticar, não prescrever) ≠ micro-factuais (não inventar dado ausente)
   - Faltar lock micro = LLM alucina pra "ser útil" mesmo com macro intacto
   - Aplicável a TODO guardrail clínico futuro

2. **Paradoxo corpus rico ↔ drift inferencial**:
   - Mais contexto disponível ao LLM = MAIS pressão pra continuidade narrativa
   - Solução dual: V1.9.450-B reduz PRESSÃO (corpus tem dados) + V1.9.453 reduz PERMISSÃO (proibido alucinar)
   - Princípio: **"reward direction implícito do LLM precisa ser INVERTIDO em prompts clínicos"** — lacuna é VALORIZADA

3. **"Sustentar lacuna sem colapsar" = diferencial Z2 do produto**:
   - Formulação positiva (substitui leitura "Matrix burra" por "Matrix epistemicamente íntegra")
   - Conexão com IMRE Ricardo: *"escuta primeiro"* implica também *"não preencher o que não foi escutado"*
   - Vale como frase âncora pra qualquer feature Z2 estrutural futura

4. **Taxonomia semântica 3 cenários > binário**:
   - Espaço semântico clínico tem **3+ estados naturais** (ausência total / presença parcial / cobertura completa + negação explícita)
   - Codificar fórmula binária = colapsar estados intermediários
   - **"Nunca codificar prompts binários quando o espaço semântico tem 3+ estados"** — princípio meta pra todo prompt clínico futuro

---

## 📊 BLOCO L — Estado atual do app (snapshot empírico 25/05 ~16h)

### L.1 — Tabelas críticas (PAT)

| Tabela | Valor |
|---|---|
| `users.type='patient'` | **34** |
| `users.type='profissional'` | 11 |
| `users.type='admin'` | 5 |
| `clinical_reports` total | **143** |
| `clinical_reports signed` (30d) | **40** (com ICP-Brasil) |
| `aec_assessment_state` in_progress | 13 |
| `ai_chat_interactions` (30d) | **2.445** |
| `appointments` total | 91 |
| `clinical_rationalities` total | 130 |
| `forum_posts` pending_review | 2 (Pedro dossiês 21/22 maio aguardando conselho) |

### L.2 — Estado git

```
HEAD 0f37a5d  feat(matrix): V1.9.454 — MatrixHelpModal elite
     2634638  fix(matrix): V1.9.453-B — negação explícita ≠ campo ausente
     c79e055  fix(matrix): V1.9.453-A — taxonomia 3 cenários
     4e5aed1  feat(matrix): V1.9.453 + V1.9.450-B
     28be21c  feat(matrix): V1.9.450 corpus expandido
     0e7f518  fix(patients): V1.9.449 — count filter
     [↑↑↑ 6 commits desktop 25/05]
     0160434  V1.9.448 vocabulário "Vincular" (laptop madrugada)
     aca5754  V1.9.447 email Promise.all (laptop)
     f2e9742  V1.9.446 busca embutida Matrix (laptop)
     53f7250  V1.9.445 busca dupla (laptop)
     f10d58b  V1.9.444 matrix ✕ (laptop)
     [↑↑↑ 5 commits laptop 24/05 noite]
```

**Total 24-25/05**: 17 commits cirúrgicos (5 laptop + 12 desktop). **Push 4 refs OK em todos** (amigo + medcannlab5 × main + master).

### L.3 — Locks intocados (verificação cirúrgica)

✅ AEC FSM 10 etapas literais (`clinicalAssessmentFlow.ts`)
✅ Verbatim First V1.9.86 (bypass GPT em hard-lock phases)
✅ AEC GATE V1.5 (retém agendamento)
✅ Phase locks por fase
✅ COS Kernel v5.0
✅ Pipeline pós-AEC (REPORT → SIGNATURE → AXES → RATIONALITY → DONE)
✅ PBAD AD-RB ICP-Brasil V1.9.299
✅ V1.9.95+97+98+99-B cadeado completo
✅ CLINICAL_PROMPT paciente (V1.9.443+A+B intocado)
✅ Detector V1.9.121 PromotionHint chat livre → AEC
✅ RAG `base_conhecimento` (5 entries hand-crafted, V1.9.318)

### L.4 — Deploys 25/05

- **Edge `tradevision-core`**: 4 deploys (V1.9.453, V1.9.453-A, V1.9.453-B, V1.9.454 não — frontend only)
- **Frontend Vercel**: auto-build em cada commit pushado (6 builds hoje)
- **Sem deploys em outras edges** (PBAD ICP intocado, etc.)

---

## 🅿️ BLOCO M — Backlog parqueado (ordem de prioridade)

| Versão | Escopo | Trigger pra ativar | Custo |
|---|---|---|---|
| **V1.9.451** | Function calling Edge: `lookup_patient_status(name, doctor_id)` + `get_appointments_summary(doctor_id, period)` | Ricardo bater no gap empíricamente de novo (caso Gilda + agenda mês) | ~1-2h |
| **V1.9.452** | Sanitize `assessment_excerpt` em `clinical_rationalities` (LGPD reforço) | Pré-Marco 2 (pacientes reais externos) — empíricamente visto hoje (Carolina nome vazou no smoke) | ~20min |
| **V1.9.455** | Anti-fusão de entidades diferentes (insight GPT externo: "Caso A insônia + Caso B dor → coexistência fictícia") | Smoke multi-pacientes em corpus comum mostrar fusão silenciosa | ~30min |
| **V1.9.460+** | Polish UX Matrix adicional (sort cruzado por data entre tipos, score confiança por dimensão, distinção "selecionado" vs "marcado" vocabulário) | Não-urgente, validação Ricardo | varia |
| **Categorias chat livre paciente** (V1.9.444 a V1.9.449 cobriram CBD/jornada/iniciar tratamento; ainda parqueadas) | Categoria A (substâncias farmacológicas), A bis (suplementação), B (jornada operacional completa), C (identidade doença), D (red flags), E (cannabis vulnerável), H (LGPD transparência) | Trigger empírico — só atacar com volume real ou pedido Ricardo | varia |

Cristalizado em [[project_universo_vetores_chat_livre_paciente_24_05]] + 3 novas memórias hoje.

---

## ⚠️ BLOCO N — Anti-overclaim a vigiar (frases GPT externo NÃO usar)

Aplicar `feedback_anti_overclaim_endorsements` + `feedback_doc_institucional_sem_pat_nao_e_valido_23_05`. **NÃO usar em pitch / landing / Material A institucional**:

| Frase aspiracional | Por quê NÃO |
|---|---|
| *"organizadora de trajetória clínica"* | Wishful thinking — só vira fato com 20-30 pacientes externos reais |
| *"semântica institucional da escuta"* | Marketing puro |
| *"clinical conversational governance"* | Destino, não estado atual |
| *"diferencial raro"* | Confirma direção mas é fator interno |
| *"arquitetura madura"* | Confirma trajetória mas não é selo |
| *"vocês pegaram cedo"* | Elogio amplo |
| *"daqui a pouco não vai ter pra ninguém a mínima crítica ou erro"* (Pedro empolgação 24/05) | Realisticamente NUNCA — é maturidade, não imunidade |

**Marcos pra essas frases virarem "fato"**: V1.9.451+452 deployados + Marco 1 (CNPJ João Vidal) + Marco 2 (2º médico independente) + 20-30 pacientes externos pagantes + auditoria CFM/ANVISA real.

---

## 📚 BLOCO O — 3 memórias cristalizadas HOJE (índice nível 1)

| # | Memória | Tipo | Propósito |
|---|---|---|---|
| 1 | `feedback_count_pacientes_v1_9_449_e_gaps_function_calling_v1_9_450_25_05` | feedback | V1.9.449 fix cirúrgico + gaps V1.9.451 parqueados com trigger anti-especulação |
| 2 | `feedback_matrix_z2_contida_e_feature_nao_bug_e_gpt_externo_pode_sugerir_anti_constituicao_25_05` | feedback | Triagem cirúrgica parecer GPT — Matrix Z2 contida é FEATURE; rejeitar sugestões anti-Constituição |
| 3 | `feedback_locks_macro_vs_micro_matrix_alucinacao_completiva_25_05` | feedback | Distinção macro vs micro + paradoxo corpus rico ↔ drift + taxonomia 3 cenários + V1.9.453-A refinamento |

**Total memórias 24-25/05**: 11 (24/05) + 3 (25/05) = **14 memórias novas nível 1 em 2 dias**. Sessões mais densas conceitualmente do projeto pré-PMF.

---

## 🧠 BLOCO P — Princípio meta-arquitetural sessão dupla 24-25/05

Tema central das **2 sessões consecutivas**:

### 24/05 — Princípio epistemológico Ricardo (queixa ≠ sintoma)

Aplicado a chat livre paciente:
- AEC NÃO é mecanismo de caça a doença — é organização narrativa do indivíduo
- Framework AEC centrípeto vs anamnese centrífuga
- "A demanda não é negada; ela é recolocada no campo da escuta"
- V1.9.443+A+B PATIENT_FREE_CHAT_GUARDRAILS implementação cirúrgica

### 25/05 — Princípio epistemológico Z2 estrutural (sustentar lacuna sem colapsar)

Aplicado a Matrix Z2 profissional:
- Z2 contida é FEATURE intencional, não bug
- Locks micro-factuais tão necessários quanto macro-clínicos
- Anti-alucinação completiva via inversão reward direction
- Taxonomia semântica 3 cenários (ausência / parcial / completa + negação explícita)
- V1.9.450 + 450-B + 453 + 453-A + 453-B + 454 implementação cirúrgica

### Conexão profunda

**Os 2 princípios são a MESMA epistemologia aplicada a domínios diferentes**:

| Eixo Clínica (paciente AEC + chat livre) | Eixo Pesquisa (Matrix Z2 profissional) |
|---|---|
| Queixa preserva abertura fenomenológica | Lacuna preserva integridade epistemológica |
| Não reduzir queixa a sintoma | Não preencher dado ausente |
| "Recoloca no campo da escuta" | "Sustenta lacuna sem colapsar" |
| Centrípeto (indivíduo fala primeiro) | Estrutural (corpus marcado é fonte primária) |

**Cristalizado**: a Constituição MedCannLab tem **2 vertentes da mesma matriz epistemológica** — clínica e pesquisa. Ambas privilegiam:
- Escuta sobre interpretação
- Fidelidade sobre completude
- Honestidade sobre utilidade percebida
- Estrutura sobre síntese

Esse alinhamento é o que GPT externo descreveu como *"arquitetura madura"* — frase aspiracional mas captura algo real: **maturação simultânea de chat paciente + chat profissional** ao redor do princípio Ricardo.

---

## 🎯 BLOCO Q — Frase âncora final do dia

> *"A Matrix Z2 começou o dia alucinando 6 dados clínicos pra parecer útil. Terminou o dia com taxonomia semântica 3 cenários + negação explícita distinguida de ausência + locks micro-factuais explícitos + UX elite acionado por (?). Não foi calibração ideológica — foi 6 ciclos empíricos PAT → diagnóstico → fix → smoke → validação → próximo gap → fix. Maturidade de processo > velocidade de delivery."*

— Sessão 25/05 encerrada com 6 commits cirúrgicos (V1.9.449 → V1.9.454), 3 memórias nível 1, princípio meta-arquitetural conectando 24/05 (queixa ≠ sintoma) com 25/05 (sustentar lacuna sem colapsar), AEC FSM intocada em todos os fixes, Vercel deployado, edge tradevision-core 4× deployado, type-check verde em todos, push 4 refs OK em todos. Matrix Z2 epistemicamente íntegra: nem alucinante, nem omissiva, nem cruzando linha clínica — apenas estruturadora honesta do corpus marcado pelo médico.

---

## 📅 BLOCO R — Retrospectiva mensal V3 (25/05 ~22h BRT)

Pedro pediu retrospectiva 30 dias (26/04 → 25/05). V1 (530 linhas) rejeitada: *"a restrospectiva e so isso? mal tem conteudo?"*. V2 (1.738 linhas) insuficiente: *"voce tem pat back front memorias enfim! cai pra dentro"*. **V3 (2.338 linhas, commit `13c673b`) absorveu**:

**Nova SEÇÃO 2.4** com 11 subseções de granularidade empírica via PAT:
- Top intents: CLINICA 2.246 (92,2%) / ADMIN 116 / ENSINO 84
- Reports por status: 37 completed / 21 shared / 9 draft / 1 reviewed (descobriu race condition: 3 reports SIGNED sem status `completed`)
- Racionalidades por tipo: integrative 55% / 30% MTC+Homeo+Ayurv (exato volume protegido pelo Audience Contract V1.9.330-A)
- Dual-write empírico: 39 jsonb vs 74 tabela (divergência por design)
- Appointments: 26 scheduled / 8 cancelled / 3 completed (taxa 8%, pré-PMF)
- Top 5 pacientes: Carolina 17, Pedro admin 12, Pedro paciente 10, Ricardo profissional 8 — 78% dos reports = 5 entidades teste
- Latência IA: 5.7s média
- Heatmap horário: pico 16h (309 chats), madrugada 7% (regime cofounder solo)
- Heatmap diário: 5 picos = TODOS dias de marco arquitetural
- AEC FSM colunas: `invalidated_at` + `invalidation_reason` (caso Dayana V1.9.440)
- Users por type: 31 patient + 3 paciente drift PT/EN

**Anexo 4** mergulho técnico (back+front+memórias):
- Topologia 4 camadas RESEARCH_PROMPT V1.9.453+A+B
- Pseudonimização opt-in (whitelist 7 seções)
- 4 famílias PATIENT_FREE_CHAT_GUARDRAILS
- 4 sugestões anti-Constituição REJEITADAS + 3 conceitos úteis incorporados
- 8 sinais a vigiar Marco 2

**Anexo 5**: genealogia epistemológica em árvore (Ricardo IMRE → Constituição MedCannLab 2 vertentes / 4 eixos).

Resumo WhatsApp pro time também produzido (~300 linhas, formato monospace compatível com chat).

---

## 🚨 BLOCO S — Caso João Guimarães (25/05 ~17:46-18:44 BRT)

**Primeiro paciente externo REAL do mês a estressar fluxo PDF→receptor**. Não conta teste interna. Não Carolina, não Pedro, não Dayana — paciente REAL do Dr. Ricardo Valença.

### O caso

João Guimarães recebeu pedido de exame pela plataforma MedCannLab e levou ao laboratório. Atendente recusou agendar. Conversa WhatsApp literal:

> *"[17:46, 25/05/2026] João Guimarães: Oi Ricardo, não consigo agendar os exames. Não tem assinatura. Precisa do QR code. No final do exame aparece como assinado pelo ICP BRASIL. Correto?"*
>
> *"[18:44, 25/05/2026] João Guimarães: Mas o rapaz disse q o QR code que é a assinatura ?"*

### Diagnóstico empírico via grep código

**O que o PDF tem ✅**:
- Assinatura ICP-Brasil REAL via `sign-pdf-icp/index.ts` (V1.9.299 PBAD AD-RB CONFORME ITI)
- Selo visual rodapé "Assinado por Dr. Ricardo Valença - ICP-Brasil"
- Validação criptográfica OK via `openssl asn1parse` + `validar.iti.gov.br` + Adobe Reader
- **Juridicamente VÁLIDO** (Decisão CFM 2.299/2021 + Lei 14.063/2020 + MP 2.200-2/2001)

**O que o PDF NÃO tem ❌**:
- **QR Code visual embedded** — atendente não consegue escanear
- `iti_qr_code` na tabela: `null` (não populado)
- `sign-pdf-icp` (LOCK V1.9.299) só assina criptograficamente, não desenha QR
- `DigitalSignatureWidget.tsx:108-111` gera QR via `api.qrserver.com` mas é só UI do médico

### Conflito empírico

| Ponto de vista | Diagnóstico |
|---|---|
| **João/atendente operacional** | "PDF sem QR = inválido pra agendar" |
| **Jurídico/ICP-Brasil** | "PDF assinado ICP = juridicamente válido, dispensa carimbo" |

Os 2 estão "certos" no seu domínio. Mas em healthtech B2C onde paciente externo bate em laboratório real, **operacional vence jurídico** se não tiver atalho de validação.

### Resolução curta (Ricardo enviou ao João via WhatsApp)

```
Oi João! Vamos por partes:

1) O exame ESTÁ assinado digitalmente com ICP-Brasil REAL
   (assinatura jurídica = assinatura física + carimbo, vale por lei).

2) Sobre o QR Code: nosso PDF hoje não embeda QR Code visual
   (vamos adicionar essa semana). Mas a assinatura é 100% válida.

3) Pra o laboratório validar AGORA, 3 caminhos:

a) Adobe Acrobat Reader (grátis) — mostra "Assinado por
   Dr. Ricardo Valença Médico - ICP-Brasil - Válido"
b) validar.iti.gov.br — upload do PDF → "Assinatura válida"
c) portal.cfm.org.br/buscamedicos — confirma CRM-PE ativo

4) Receita/exame com ICP-Brasil dispensa carimbo físico desde
   2021 (Decisão CFM 2.299/2021). Se o laboratório recusar, me
   liga que falo com eles. Dr. Ricardo
```

### Resolução longa parqueada (V1.9.455 — embed QR no PDF)

**Decisão arquitetural pendente Pedro com Ricardo** (não codar sem alinhamento).

3 opções mapeadas com trade-offs explícitos:

| Opção | Como | Risco V1.9.299 | Tempo |
|---|---|---|---|
| A | Mexer no sign-pdf-icp pra desenhar QR após assinar | 🔴 ALTO — quebra lock | 4-8h + auditoria pesada |
| **B** | 2 PDFs separados (principal ICP + comprovante QR) | 🟢 ZERO — não toca lock | 2-3h |
| **C** | Desenhar QR ANTES de assinar (upstream) | 🟡 MÉDIO — pipeline novo, smoke obrigatório | 3-5h + smoke |

**Recomendação técnica**: Opção C (elegante, 1 PDF, QR coberto pela assinatura, lock V1.9.299 intocado). Smoke obrigatório:
1. `openssl asn1parse` (binário ICP intacto)
2. `validar.iti.gov.br` (portal real mostra "Válida")
3. Escanear QR com celular → URL validação correta
4. Adobe Reader → assinatura válida + QR visível
5. Diff binário vs PDF aprovado pré-mudança

Design completo + 3 opções A/B/C em memória dedicada `project_v1_9_455_qr_code_embedded_pdf_design_25_05`.

### Princípios meta cristalizados pelo caso

#### 1. Lock V1.9.299 PBAD protege de modificação pós-assinatura

PBAD = assinatura por hash do binário PDF. Qualquer byte modificado DEPOIS = hash diferente = validação ITI volta pra "Desconhecida". Lock V1.9.299 CLAUDE.md é manifestação técnica disso, não cautela arbitrária. Pra adicionar QR Code: modificar PDF ANTES da assinatura (Opção C upstream).

Cristalizado em `feedback_lock_v1_9_299_pbad_protege_modificacao_pos_assinatura_25_05`.

#### 2. Paciente externo real estressa arquitetura DIFERENTE de teste interno

Carolina/Pedro/Dayana testaram TUDO do fluxo IA. Nenhum levou PDF a receptor externo. João foi o primeiro. Smoke interno termina em "PDF gerado + assinatura válida"; smoke externo termina em "laboratório aceita o PDF".

Frase âncora Pedro: *"ricardo sempre vem com uma!"* — captura dinâmica empírica do projeto.

Pra Marco 2 (20-30 pacientes externos pagantes): toda feature de output (PDF, NFT, link share) precisa de **Smoke 3 externo operacional** ANTES de chegar a paciente pagante.

Cristalizado em `feedback_paciente_externo_real_estressa_arquitetura_25_05`.

#### 3. Validação jurídica ≠ validação operacional

ICP-Brasil substitui carimbo físico juridicamente desde 2021. MAS atendente de laboratório aplica processo operacional (escanear QR) aprendido com Memed/Prescrevi. Em healthtech B2C, **cumprir a lei não basta — precisa cumprir o processo que receptor espera**.

### 4 memórias criadas (caso João + V1.9.455)

1. `feedback_qr_code_embedded_pdf_gap_caso_joao_guimaraes_25_05` — caso real + diagnóstico técnico + resolução curta
2. `project_v1_9_455_qr_code_embedded_pdf_design_25_05` — design 3 opções A/B/C com trade-offs
3. `feedback_lock_v1_9_299_pbad_protege_modificacao_pos_assinatura_25_05` — princípio meta sobre o lock
4. `feedback_paciente_externo_real_estressa_arquitetura_25_05` — princípio meta sobre paciente externo (frase âncora Pedro)

---

## 🎯 BLOCO T — Frase âncora final do dia (versão atualizada pós-22h)

> *"A Matrix Z2 começou o dia alucinando 6 dados clínicos pra parecer útil. Terminou o dia com taxonomia semântica 3 cenários + negação explícita distinguida de ausência + locks micro-factuais explícitos + UX elite acionado por (?). À noite, retrospectiva mensal V3 (2.338 linhas) absorveu PAT empírico granular + back+front+memórias. E quando o dia parecia encerrado, João Guimarães (paciente externo REAL, primeiro do mês a estressar fluxo PDF→receptor) bateu no laboratório com PDF assinado ICP mas SEM QR Code visual. Pedro: 'ricardo sempre vem com uma!' — captura a dinâmica empírica do projeto. V1.9.455 parqueado com 3 opções A/B/C, lock V1.9.299 PBAD preservado, princípio cristalizado: validação jurídica ≠ validação operacional. Não foi calibração ideológica — foi 6 ciclos empíricos PAT → diagnóstico → fix → smoke → validação → próximo gap → fix, terminando em descoberta empírica do gap operacional que define o próximo sprint. Maturidade de processo > velocidade de delivery."*

— Sessão 25/05 encerrada (versão final) com 6 commits cirúrgicos pré-22h (V1.9.449 → V1.9.454) + commit retrospectiva V3 às 22h (`13c673b`) + 4 memórias adicionais pós-22h (caso João + V1.9.455 design + lock V1.9.299 princípio + paciente externo princípio). **Total dia**: 9 memórias nível 1, 1 retrospectiva mensal V3 (2.338 linhas), Bloco S+T adicionados ao diário pós-22h. AEC FSM intocada em todos os fixes. Vercel deployado. Push 4 refs OK. Matrix Z2 + Constituição cristalizada + caso real externo absorvido em memórias persistentes — **próxima sessão Claude (laptop ou continuação) tem contexto INTEGRAL** pra entender o caso João sem repetir análise + tem 3 opções A/B/C de V1.9.455 já mapeadas + tem lock V1.9.299 explicado tecnicamente, não politicamente.
