# DIARIO 30/05/2026 — Auditoria 360 + Plano "sem regressão" em 4 tiers + Gap FOLLOW_UP

**Sessão**: madrugada/manhã 30/05 (continuação operacional pós-DIARIO_29).
**Estado de entrada**: HEAD `1b4cc63` V1.9.503 (DIARIO_29 fechado, SGQ Nível 1 automação ativada).
**Estado de saída deste diário**: auditoria 360 completa, plano cirúrgico 12 itens 4 tiers documentado, gap FOLLOW_UP confirmado empíricamente, sequência híbrida definida (rotacionar PAT → diário → sync desktop → executar tiers).

---

## 🎯 OBJETIVO DESTA SESSÃO

Pedro pediu **"auditoria 360 do app cumprindo todas as pontas"** com PAT de leitura ao vivo. A sessão produziu:

1. Auditoria 360 ao vivo via 4 agentes paralelos (DB live, code health, diários 27-29/05, backlog reconciliação)
2. Plano "sem regressão" em 4 tiers (zero/baixo/médio-bomba-latente/humano-pendente)
3. Investigação profunda do gap FOLLOW_UP/chat_interaction (Pedro suspeitou; empírico confirmou)
4. Sequência híbrida de execução (rotacionar PAT → diário → sync desktop → tiers)

**Base empírica**: Management API Supabase (15 queries SELECT-only salvas em `tmp/audit_360_*.json` — limpas antes do push), grep direto no `src/` e `supabase/functions/`, leitura completa DIARIOs 27/28/29 + memórias relacionadas.

---

## 🔬 BLOCO A — Auditoria 360 ao vivo (síntese 4 frentes)

### A.1 — Estado do banco (live via PAT, 29/05 ~22h BRT)

| Item | Esperado (CLAUDE.md 27/05) | Real (29/05) | Status |
|---|---|---|---|
| Edge Functions ACTIVE | 14 | 14 | ✅ batem |
| Cron jobs ativos | 3 | **4** (+`sgq-health-checks-daily` V1.9.503) | 🟡 NOVO não documentado |
| `video-call-reminders-5min` | 100% sucesso | 2016 runs / 100% | ✅ |
| `monthly-closing-medcannlab` | 0 runs (1ª em 01/06) | 0 runs | ✅ |
| `expire-renal-suggestions` | OK diário | 7/7 sucesso | ✅ |
| AEC órfãs `in_progress` | 5 (Illa/Pedro/Thiago/Solange/JE) | 5 (Illa/Pedro×2/Thiago/Michele) | 🟡 composição mudou |
| `clinical_qa_runs` | 1 (V1.9.85 27/04) | **2** (+V1.9.468-B 27/05 score 65) | ✅ cadência quinzenal honrada |
| `forum_posts pending_review` | 2 | **3** (+dossiê 27/05) | 🟡 |

### A.2 — Métricas crescimento orgânico (esperado, atualizar docs)

- `clinical_reports`: **145 total / 42 signed** (era ~38)
- `clinical_rationalities`: **132** (era 115 → +17 em 2d, Eduardo+Pedro testando)
- `cfm_prescriptions`: **52** (era 32 em 27/04)
- `appointments`: **93** (41 cancelled / 4 completed / 48 scheduled; 7 future / 86 past — **44% cancelled preocupante**)
- `users` por type: **50** (5 admin · 11 prof · 31 patient · 3 paciente legacy)
- `patient_exam_requests`: **24 / 12 signed_pdf_url** (V1.9.455 backfill 12/14 confirmado)
- OpenAI 7d: **US$ 7.55 / 403 chamadas** (cresceu 27% vs $5.96 26/05 — uso Eduardo real)

### A.3 — Saúde de código

| Item | Estado |
|---|---|
| `npm run type-check` | ✅ **0 erros** (apesar de 687 commits ahead de master) |
| Lock PBAD [sign-pdf-icp/index.ts](supabase/functions/sign-pdf-icp/index.ts) | ✅ intacto (`d19cc83` V1.9.457 26/05) |
| Lock PBAD [icp_chain.ts](supabase/functions/sign-pdf-icp/icp_chain.ts) | ✅ intacto (`3a8233b` V1.9.299→303 16/05) |
| Gotcha dompurify | ✅ resolvido (`node_modules/dompurify` presente + `^3.4.0` em deps) |
| `npm run lint` | 🔴 **BROKEN** — `eslint` não instalado, scripts mortos no `package.json:15-16` |
| `tradevision-core/index.ts` | 🟡 **7765 linhas** (vs 6697 doc 27/05; +1068 em 2d) |
| `tmp/*.json` untracked | 🟡 **272 arquivos** (~1.6 MB) sujando `git status`; `tmp/` ausente do `.gitignore` |
| Sync memórias 28-29/05 | 🟡 5/5 ausentes em `docs/memorias/` (gap recorrente desktop→laptop) |

### A.4 — Reconciliação backlog (CLAUDE.md 27/05 vs HEAD 29/05)

**Resolvidos desde 27/05** (1.5 itens):
- ✅ P0 V1.9.452 LGPD sanitize → `8ed1802` (29/05) + backfill 132 rows
- ⚠️ P1 5 AECs órfãs → `52d4645` V1.9.500 entregou **ferramenta** (card Dashboard Prof), dados continuam por design

**Open intocados** (5 itens):
- ❌ P0 WiseCare homolog→produção (bloqueador humano: contrato V4H)
- ❌ P1 V1.9.451 function calling Edge
- ❌ P1 V1.9.456 QR Code embedded PDF (lock V1.9.299 dissuadindo)
- ❌ P1 2 forum_posts pending_review (na verdade 3 agora)
- ❌ P1 Edge `get_chat_history` v8 (empíricamente órfã, 0 callers em src/)

**Features ENTREGUES não declaradas** (46 commits V1.9.475→503):
- Sidecars Cognitivos Renal+Neuro (V1.9.475-A→E / 476 / 477 / 478)
- Matrix Camadas 1.1-1.6 (V1.9.481→494)
- Canal Feedback (V1.9.486 → 486-C)
- Ensino Sprint E (V1.9.495→497 Notícias/Avaliações/Mentoria)
- Prontuário polish (V1.9.487, 498, 500, 500-A, 501)
- SGQ ANVISA (V1.9.502 A/B/C + 503)
- Auditoria Integral Sprints 0-5

---

## 🚨 BLOCO B — Achados que CLAUDE.md ainda não captura

### B.1 — Bomba latente: `tradevision-core verify_jwt=false` desde 22/05

**Cristalizado pelo agente "diários"**: a Edge principal (`tradevision-core`) está rodando com `verify_jwt=false` desde a v407 (22/05) até v423 (29/05). Significa: **qualquer um com a URL pública pode invocar a Edge sem credencial**. A auth manual interna cobre o caso de uso normal, mas a defesa-em-camadas tá quebrada.

**Vetor real**: invocação direta sem JWT poderia consumir tokens OpenAI (custo R$ 0,13/chamada Matrix), fazer enumeration de pacientes, etc.

**Plano de restauração**: Sprint A do DIARIO_29 (não executado ainda). Vira **Tier 2 do plano** abaixo.

**Risco do fix em si**: 1 caller usa `fetch()` direto ([noaEngine.ts:60](src/lib/noaEngine.ts#L60)) — se ele não enviar header `Authorization` com session JWT, o frontend quebra na hora que ligar a trava. **Único point of failure real do Sprint A.**

### B.2 — `clinical_rationalities` PII — refutação empírica do "88.5%"

Investigação ao vivo refutou o claim de 27/05 de "88.5% rows com nome em texto livre":
- **0/132 nomes reais cruzados** (heurística contra Maria das Dores / Carolina / João Eduardo / Pedro / Eduardo)
- **113/132 (85.6%) seguem padrão `Paciente #XXXXXX`** (V1.9.407 `pseudonymizePatientReferences` aplicado + backfill V1.9.452 finalizou em 29/05)
- ~14% (19 rows) pré-V1.9.407 ainda a confirmar manualmente

**Tradução**: P0 LGPD V1.9.452 pode ser **rebaixado de bloqueador absoluto pra polish residual**. Marco 2 não fica mais bloqueado por isso.

### B.3 — Regex PII em `run_sgq_health_checks()` (V1.9.503) com falso positivo

📁 [supabase/migrations/20260529210000_v1_9_503_system_health_alerts.sql:107](supabase/migrations/20260529210000_v1_9_503_system_health_alerts.sql#L107)

Regex atual: `[A-Z][a-z]+ [A-Z][a-z]+` — pega QUALQUER 2 palavras capitalizadas. Falsos positivos esperados:
- "Análise Holística", "Síndrome Metabólica", "Sistema Nervoso", "Dor Crônica"
- "Cannabidiol Isolado", "Caso #X", "Escola Clínica", "Método AEC"

Vira **Tier 1 ITEM 5 V1.9.504**: regex refinado com (a) 3 palavras mínimo + (b) word boundaries POSTGRES `\m...\M` + (c) negação explícita ~20 termos técnicos comuns + 5 nomes já pseudônimos.

### B.4 — `tradevision-core/index.ts` inchou +1068 linhas em 2 dias

6697 (CLAUDE.md 27/05) → 7036 (baseline refator 22/05) → **7765 (HEAD 29/05)**. Refator anti-bus-factor parqueado (branch `refactor/tradevision-core-modular`, 5 commits V1.9.419 + A/B/C/D) segue sem deploy/merge. Bus factor aumentando — mas decisão Pedro 22/05 foi parquear pré-PMF (drift dev pré-PMF aceitável).

### B.5 — Script `deploy:tradevision` NÃO existe no `package.json`

Grep retornou 0 matches em `package.json` HEAD `1b4cc63`. Provavelmente foi removido em algum commit OU só existe na branch refator parqueada. **Tier 2 ITEM 11** vira "criar script correto (sem `--no-verify-jwt`) preventivamente" em vez de "patchar errado".

### B.6 — `noaEngine.ts:60` é o único caller `fetch()` direto

Audit dos 9 callers de `tradevision-core` no `src/` mostrou:
- 7 usam `supabase.functions.invoke()` (injeta JWT auto) — 🟢 seguros
- 1 é comentário arquitetural — ⚪ N/A
- **[src/lib/noaEngine.ts:60](src/lib/noaEngine.ts#L60) usa `fetch()` manual** — 🔴 verificar header

**Antes do Sprint A**, ler linhas 55-95: se tem `Authorization: Bearer ${session.access_token}` → segue Sprint A. Se não tem → patchar PRIMEIRO.

### B.7 — Cadência `clinical_qa_runs` honrada empíricamente

Memória 26/05 cristalizou "cadência mínima quinzenal". Empírico 29/05: **2 runs** existem (V1.9.85 27/04 + V1.9.468-B 27/05 score 65 "parcial-com-drift-conversacional"). Próxima esperada ~10-14/06. ✅ Princípio cristalizado virou prática.

---

## 🔍 BLOCO C — Gap FOLLOW_UP/chat_interaction (descoberta empírica)

Pedro perguntou no meio da sessão: *"oq o paciente escreve no paciente detalhes de uma consulta evolução do estado avaliar pois já está indo para matrix isso né?!"*

Investigação empírica via PAT + grep no frontend confirmou tua intuição: **gap PARCIAL real, não redundante com a pergunta pendente do Sprint C DIARIO_29**.

### C.1 — Os 2 números empíricamente validados

| Fonte | Rows HOJE | Quem escreve | Matrix Z2 lê? |
|---|---|---|---|
| `clinical_assessments` WHERE `assessment_type='FOLLOW_UP'` | **18** | **Médico** via Terminal "Nova Evolução" | ✅ SIM (V1.9.489) |
| `patient_medical_records` WHERE `record_type='chat_interaction'` | **6070** | **Paciente + IA** (dual-write auto do chat livre Nôa) | ❌ **NÃO** |

### C.2 — Prova arquitetural (3 arquivos)

- 📁 [src/lib/noaResidentAI.ts:1410-1419](src/lib/noaResidentAI.ts#L1410) — INSERT em `patient_medical_records` toda interação chat livre. 100% dos 6070 rows vêm daqui.
- 📁 [src/components/NoaMatrixView.tsx:743-746](src/components/NoaMatrixView.tsx#L743) — só 4 toggles (AEC / Evol / Rac / Dos). **Não tem toggle pra chat_interaction.**
- 📁 [src/components/NoaMatrixView.tsx:386-388](src/components/NoaMatrixView.tsx#L386) — comentário literal no código: *"fonte futura chat_interaction (Chat IA OFF por design quando entrar)"*. **Sistema reconhece o gap como design parqueado, não bug.**
- Zero matches de `from('patient_medical_records').select` em todo `src/` e em `supabase/functions/tradevision-core/`.

### C.3 — Por que está certo deixar OFF por design

Princípio V1.9.318 (RAG molda comportamento cognitivo — memória `feedback_rag_molda_comportamento_cognitivo_20_05`):
- Despejar 6070 rows brutos no contexto Matrix = mesmo padrão DOC_LIST hijacking que quebrou em 17/05
- Matrix passa a interpretar "analise paciente" como "ele quer ver lista de mensagens" em vez de raciocínio clínico
- Solução correta = **5º toggle "Chat IA" default OFF** (médico opta in conscientemente)

### C.4 — Resposta às 3 perguntas pro Ricardo do Sprint C

| Pergunta | Resposta empírica |
|---|---|
| (a) Matrix lê 18 FOLLOW_UP OR 6070 chat_interaction também? | **Só os 18.** Os 6070 ficam invisíveis pro Matrix Z2 hoje. |
| (b) Automático OR toggle? | **Toggle DEFAULT OFF** (atrito intencional pra honrar V1.9.318) |
| (c) Plano terapêutico construir OR só ler? | Hoje só lê snapshot estruturado. Pergunta pro Ricardo ainda válida. |

### C.5 — Proposta pra mandar pro Ricardo no WhatsApp

> *"Ricardo, o paciente escreve no chat livre da Nôa entre consultas (já temos 6070 rows). Hoje isso fica invisível pro Matrix Z2 — Matrix só lê o que VOCÊ digita em 'Nova Evolução'. Proposta: adicionar 5º toggle 'Chat IA' no Matrix, DEFAULT OFF, você opta in conscientemente. Quando ON lê últimas 20 msgs paciente últimos 30 dias, pseudonimizado (V1.9.450-B). Sem risco de DOC_LIST hijacking (V1.9.318) porque atrito intencional. Implemento?"*

### C.6 — Vira Tier 3 do plano (~2-3h frontend-only)

Implementação proposta (se Ricardo OK):
1. 5º toggle em [NoaMatrixView.tsx:743-746](src/components/NoaMatrixView.tsx#L743) (default `false`)
2. Estender [usePatientLongitudinal.ts:191-202](src/hooks/usePatientLongitudinal.ts#L191) com fonte `chatInteractions` lendo `patient_medical_records` WHERE `record_type='chat_interaction'` LIMIT 20 últimos 30d
3. Reusar `extractPseudonymizedClinicalContent` (Princípio 8 polir-não-inventar)
4. **Frontend-only**: NÃO toca `tradevision-core` (já 7765 linhas) nem Lock V1.9.299
5. Smoke: paciente Carolina (#A41C, tem chat real) → Matrix toggle ON mostra últimas msgs, toggle OFF nada muda

---

## 📋 BLOCO D — Plano "sem regressão" em 4 tiers (12 itens paste-and-run)

Lógica: **Tier 0 → Tier 3**. Você só passa pro tier seguinte depois de smoke ✅ do anterior. Cada item virou paste-and-run com arquivos exatos, comandos exatos, smoke exato.

### TIER 0 — Risco ZERO (~28 min)

| # | Item | Arquivos | Tempo |
|---|---|---|---|
| 1 | Rotar PAT exposto | dashboard Supabase + `.claude/settings.local.json` | ~5 min |
| 2 | Adicionar `tmp/` ao `.gitignore` + limpar 272 jsons | `.gitignore` + `tmp/` | ~3 min |
| 3 | Scaffolding 5 memórias 28-29/05 (gap sync) | `docs/memorias/*.md` (5 novos) | ~10 min |
| 4 | Atualizar `CLAUDE.md` (3 diffs: HEAD + V1.9.452 ✅ + cron sgq) | [CLAUDE.md](CLAUDE.md) | ~10 min |

### TIER 1 — Risco BAIXO (~35 min)

| # | Item | Arquivos | Tempo |
|---|---|---|---|
| 5 | V1.9.504 refinar regex PII (`run_sgq_health_checks`) | `supabase/migrations/20260530000000_v1_9_504_pii_check_refined.sql` (novo) | ~30 min |
| 6 | Remover scripts `lint`/`lint:fix` mortos | [package.json:15-16](package.json#L15) | ~5 min |

### TIER 2 — Sprint A `verify_jwt` restore (~85 min) — bomba latente

| # | Item | Arquivos | Tempo |
|---|---|---|---|
| 7 | Auditar callers `tradevision-core` + patchar [noaEngine.ts:60](src/lib/noaEngine.ts#L60) se preciso | 9 callers em `src/` | ~10-40 min |
| 8 | Deploy slug-test paralelo `tradevision-core-jwt-test` | `supabase/functions/tradevision-core-jwt-test/` (cópia temporária) | ~15 min |
| 9 | Smoke matriz 5/5 (chat livre / AEC / Matrix / Sidecar Renal / Pipeline) | browser localhost:3001 | ~30 min |
| 10 | Real deploy `verify_jwt=true` + smoke 5/5 produção + cleanup | `tradevision-core` v424 | ~20 min |
| 11 | Criar script `deploy:tradevision` correto preventivo | [package.json](package.json) | ~5 min |

### TIER 3 — Pendente decisão humana (NÃO mexer sem alinhamento)

| # | Item | Bloqueador | Tempo |
|---|---|---|---|
| 12 | Gap FOLLOW_UP/chat_interaction (5º toggle "Chat IA" default OFF) | OK Ricardo no WhatsApp | ~2-3h |

### Guard-rails fixos do plano (não negociáveis)

1. Nenhum commit cumulativo — cada V1.9.X faz UMA coisa, smoke isolado
2. Nunca tocar AEC FSM, Pipeline, Verbatim, sign-pdf-icp na mesma sessão que mexer no `tradevision-core`
3. Screenshot antes/depois em qualquer mudança visual (princípio meta 28/05 — 5 iterações Card Neuro provaram)
4. `type-check` verde + smoke FSM AEC completo pós qualquer toque em `clinicalAssessmentFlow.ts` ou `tradevision-core`
5. Push 4 refs sempre (`hub` + `origin` × `main` + `master`)
6. Não rodar 2+ Tiers no mesmo commit/deploy

---

## 🔄 BLOCO E — Sequência híbrida + sync desktop→laptop

### E.1 — Sequência de execução decidida

1. **Rotacionar PAT** (3 min) — `sbp_1940fce4...` ficou exposto neste log de conversa Claude
2. **Escrever DIARIO_30** (este arquivo, ~45 min) — laboratório registra ANTES de cristalizar (princípio "Pipeline Diário → Magno")
3. **Push 4 refs** (`hub` + `origin` × `main` + `master`) — desktop pode puxar
4. **Desktop puxa + sincroniza 5 memórias auto-memory** — quebra o ciclo de gap recorrente
5. **Volta no laptop** → executa Tier 0 restante (limpar tmp + CLAUDE.md) + Tier 1 + Tier 2 no ritmo, cada um virando bloco F/G/H/I deste mesmo DIARIO_30

### E.2 — Por que essa ordem e não outra

- **Diário antes da execução**: princípio "Pipeline Diário → Magno" — laboratório registra ANTES de cristalizar
- **Sync desktop pelo meio**: você quebra o ciclo de gap recorrente (MEMORY.md mostra 5 memórias presas há 1-2 dias — padrão se repete se não fechar agora)
- **PAT rotacionar antes do diário**: o diário menciona o PAT antigo como rotacionado — se rotacionar depois, o diário vira evidência de descuido
- **Tier 0 restante depois do desktop sync**: evita merge conflict bobo (desktop committa memórias enquanto laptop edita CLAUDE.md)

### E.3 — Mensagem pro Claude do desktop

> *"Li DIARIO_30. Sincroniza essas 5 memórias da auto-memory daqui pro repo `docs/memorias/` e commita:*
> *- `feedback_sistema_tem_contexto_demais_falta_semantica_clinica_28_05`*
> *- `project_matrix_roadmap_camadas_1_2_3_28_05`*
> *- `feedback_share_overwrite_professional_id_e_admin_visibilidade_28_05`*
> *- `feedback_racionalidades_pipeline_gera_1_medico_aciona_4_28_05`*
> *- `project_auditoria_integral_completa_sprints_0_5_29_05`*
> 
> *O laptop já criou scaffolding com sinopse de 2-3 linhas em cada um (parte do Tier 0 ITEM 3). Você só preenche o corpo completo com a memória rica do auto-memory desktop. Depois push 4 refs."*

### E.4 — 5 memórias órfãs — sinopses pra scaffolding

| Memória | Sinopse (2-3 linhas extraídas do DIARIO_29) |
|---|---|
| `feedback_sistema_tem_contexto_demais_falta_semantica_clinica_28_05` | Antes de adicionar fonte ao corpus/UI, validar se as existentes estão separadas semanticamente. Aplicado Sprint D Camada 1.5 ([PatientsManagement.tsx:1055-1162](src/pages/profissional/PatientsManagement.tsx#L1055)). |
| `project_matrix_roadmap_camadas_1_2_3_28_05` | 3 perguntas BLOQUEADAS pendentes Ricardo (Matrix lê chat_interaction? automático/toggle? plano terapêutico construir/só ler?). Sprint D depende. |
| `feedback_share_overwrite_professional_id_e_admin_visibilidade_28_05` | Share `clinical_reports` sobrescreve `professional_id` quebrando visibilidade admin. Critério "sem regressão" pra mudanças nessa tabela. |
| `feedback_racionalidades_pipeline_gera_1_medico_aciona_4_28_05` | Pipeline AEC gera 1 racionalidade auto (biomedical); médico aciona as outras 4 (integrative/MTC/homeopathic/ayurvedic) sob demanda. 2 INSERTs em [rationalityAnalysisService.ts](src/services/rationalityAnalysisService.ts) 575+603. |
| `project_auditoria_integral_completa_sprints_0_5_29_05` | 10 docs em `docs/audit/` (Sprints 0-5). Vital signs 29/05: 140 tabelas / 451 policies / 14 Edges / 145 reports. Doc-fonte do "100% pronto sem regressão". |

---

## 🎓 BLOCO F — Aprendizados meta desta sessão

### F.1 — Auditoria 360 paralela é repetível mensalmente

4 agentes paralelos (DB live + code + diários + backlog) cobriram a auditoria completa em ~20 min real (vs ~17-23h estimados GPT externo se feito em série). Custo aproximado ~$2-3 USD em tokens. **Vira rotina mensal candidata** — fechar dia 30 cada mês com "audit 360" idêntico, comparando deltas.

### F.2 — Pedro suspeitou empíricamente do gap FOLLOW_UP — validação venceu

Pedro: *"já está indo para matrix isso né?!"* — desconfiança epistêmica. Investigação empírica confirmou suspeita. Princípio meta da retrospectiva 25/05 (`feedback_duas_vertentes_uma_matriz_epistemologica_constituicao_medcannlab_25_05`) aplicado: **Honestidade > Utilidade percebida**. Sistema confessa o gap em comentário no próprio código ([NoaMatrixView.tsx:386-388](src/components/NoaMatrixView.tsx#L386)) — esse honestidade fonte é exatamente o tipo de evidência que vence sob fact-check externo.

### F.3 — "Explicar pra leigo" forçou síntese boa

Pedro pediu *"explicar rapido para leigo os tiers e motivos e oq muda apos"*. Forçou tradução de "verify_jwt=false" pra "porta da frente destrancada", de "regex PII falso positivo" pra "alarme tocando à toa". Síntese gerou frase âncora útil: *"O app sai de '85% pronto com 1 furo de segurança e bagunça' pra '90% pronto sem furo, casa arrumada, faltando só decisões humanas'."*

### F.4 — Gap sync desktop→laptop é padrão, não exceção

3ª vez no mês que memória cristalizada no desktop não chegou na sessão laptop seguinte (e vice-versa). MEMORY.md NÍVEL 1 já documenta o gap. **Solução proposta**: ritual de fechamento da sessão = sempre rodar sync da auto-memory pro `docs/memorias/` + commit + push 4 refs como ÚLTIMO ato antes de fechar o terminal. Sem sync = memória fica presa.

---

## 📌 BLOCO G — Frase âncora deste DIARIO

> *"Auditoria 360 confirmou app saudável + 1 bomba latente (verify_jwt=false) + 1 gap arquitetural (FOLLOW_UP/chat_interaction parqueado por design). Plano cirúrgico em 12 itens 4 tiers (zero/baixo/médio-bomba/humano) protege Marco 2 sem regressão. Princípio 'Pipeline Diário → Magno' aplicado: este DIARIO é o laboratório que registra ANTES de cristalizar a execução."*

---

## 📝 BLOCO H — Próximos passos imediatos (na ordem)

```
□ ROTACIONAR PAT exposto (browser, 5 min)
□ Push DIARIO_30 commit + 4 refs (3 min)
□ Desktop puxa + sync 5 memórias auto-memory (mensagem prep em E.3)
□ Volta laptop → Tier 0 ITEM 2 (.gitignore + clean tmp)
□ Tier 0 ITEM 4 (CLAUDE.md 3 diffs)
□ Tier 1 ITEM 5 (V1.9.504 regex PII)
□ Tier 1 ITEM 6 (remover lint scripts mortos)
□ Tier 2 ITEM 7 (audit noaEngine.ts:60 — point of failure único)
□ Tier 2 ITEMs 8-11 (Sprint A verify_jwt slug-test → real → cleanup → preventivo script)
□ WhatsApp Ricardo proposta Tier 3 (5º toggle Chat IA)
□ Tier 3 ITEM 12 (só com OK Ricardo)
```

---

**Estado de saída**: DIARIO_30 escrito (este arquivo). Próximo: rotacionar PAT + commit + push 4 refs + ping desktop.

**HEAD esperado pós-commit**: este commit (V1.9.504-doc-only) + commits subsequentes V1.9.504+ conforme execução tier por tier.
