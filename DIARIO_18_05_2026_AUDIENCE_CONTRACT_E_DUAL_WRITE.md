# Diário 18/05/2026 — Audience Contract + Dual-Write Contract

**Autores**: Pedro Henrique Passos Galluf + Claude Opus 4.7 (1M context)
**Origem**: provocação da namorada do Pedro + amigos (audiência leiga reagiu a racionalidade MTC)
**Estado fim do dia**: V1.9.330-A deployado (hotfix UI guard) + 2 memórias arquiteturais cristalizadas + dual-write contract identificado como questão aberta pré-requisito pra V1.9.330-FULL

---

## 🌅 BLOCO M — Audience Contract pra racionalidades clínicas

### M.1 — Provocação real (não-simulação)

Namorada do Pedro + amigos testaram dashboard como **audiência não-clínica** e leram a aba MTC do relatório de Maria Helena Chaves:

> *"PADRÕES DE DESARMONIA (ZANG-FU): desarmonia do Fígado e da Vesícula Biliar... estagnação de Qi do Fígado... deficiência de Qi do Baço, que não está conseguindo transformar e transportar adequadamente os fluidos."*

Reação observada: **ansiedade interpretativa**. Pacientes leigos leem "hipótese funcional" como "talvez eu tenha problema em 4 órgãos" — colapso de hierarquia interpretativa.

Pedro estruturou a crítica via GPT que produziu análise excelente:

> *"o paciente não lê 'hipótese funcional'; ele lê 'talvez meu fígado esteja doente'. Essa diferença parece pequena tecnicamente, mas é gigantesca cognitivamente."*

Identificou princípio: **"patient-safe semantic rendering"** — sistema gera inteligência clínica sem distinguir audiência semântica.

### M.2 — Audit empírico end-to-end (4 camadas)

Antes de codar, audit profundo via PAT + grep:

**Banco**:
- 112 racionalidades em 10 dias (90 integrative + 7 biomedical + 7 homeopathic + 5 traditional_chinese + 3 ayurvedic)
- 11 pacientes únicos
- RLS atual: `patient_read_own` libera leitura direta ao paciente, sem filtro
- Schema: assessment/recommendations/considerations/approach (texto livre) — zero campos de governança

**Frontend**:
- `PatientDashboard.tsx:242` renderiza `ClinicalReports.tsx` com `isPatient=true`
- Linha 1989-2014: bloco de texto bruto **SEM guard isPatient** (apenas botões Baixar/Compartilhar tinham guard)
- Sanitização: apenas `stripPlatformInjectionNoise` (anti-RAG-bomb), zero filtro semântico

**Backend (rationalityAnalysisService.ts)**:
- 5 prompts (1 por racionalidade) instruem GPT a usar **vocabulário técnico denso** sem distinguir audiência
- MTC: *"Padrões Zang-Fu... deficiência de Qi... pontos de acupuntura..."*
- Homeopatia: *"Miasmas (Psora, Sycosis, Syphilis)... remédio constitucional..."*
- Ayurveda: *"Dosha predominante... Agni... Panchakarma..."*

**Edge tradevision-core**:
- Linha 1716 (pipeline RATIONALITY stage) — INSERT em clinical_rationalities (tabela)
- Linha 2272 (pipeline promotion) — INSERT idem
- Ambos só escrevem na tabela, **não atualizam jsonb do report** ← descoberta crítica que muda V1.9.330

### M.3 — Diagnóstico arquitetural condensado

> *"A arquitetura semântica ficou mais avançada que a arquitetura de exposição."*
>
> - Prompts sofisticados (5 racionalidades, vocabulário próprio) → ✅ camada semântica madura
> - Persistência estruturada (tabela + RLS + JOIN report) → ✅ camada de dados madura
> - Exposição plana (paciente lê tudo, sem hierarquia, sem versão leiga, sem disclaimer estrutural) → 🔴 camada de exposição inexistente

Padrão V1.9.311 (NFT Consent peça-a-peça) + V1.9.312-B (admin metadata, não conteúdo) existem como **conceito arquitetural** mas não foram aplicados aqui porque V1.9.316→323 foram codados em ritmo de fix madrugada (sequência cronológica errada).

### M.4 — Design v1 → v3 (evolução pela conversa)

**Design v1** (proposta inicial):
- Tabela nova `clinical_rationale_views` separada
- Coluna `audience` enum
- Tabela meta de events de transição

**Calibração Pedro**: "ver todas tabelas do schema, ver se algo já chama algo similar antes" → princípio polir-não-inventar.

**Audit cross-table revelou**:
- `clinical_reports` é **gold standard implícito** com `status` (draft/completed/reviewed/shared) + `review_status` (draft/approved/reviewed) + `reviewed_by/at` + `shared_with text[]` + `consent_given/at`
- 15+ tabelas usam `summary text` como padrão de versão derivada (ai_saved_documents, clinical_axes, etc.)
- `clinical_rationalities` simplesmente **não aderiu** ao padrão (criada V1.9.X recente, antes do padrão consolidar)

**Design v2** (reuso 80%):
- ADD 11 colunas em `clinical_rationalities` espelhando `clinical_reports`
- 1 coluna nova: `hierarchy_label`

**Calibração GPT**: 3 ajustes conceituais:
1. **3.1 Reuso excessivo pode mascarar diferença semântica** — reports = artefato final / rationalities = sub-componente IA. Lifecycle não é simétrico
2. **3.2 `shared_with` (ACL) ≠ audience contract (intenção)** — ACL controla acesso, intent comunica "pra quem foi escrito"
3. **3.3 `summary` sem governança = campo lixo** — precisa `summary_origin` + lock após review

**Design v3 final**:
- 14 colunas adicionadas (10 reuso + 4 novas: hierarchy_label, intended_audience, summary_origin, summary_locked_at_by)
- Regra R0 lifecycle dependente: rationality.status ≤ report.status do report-pai
- 7 regras de derivação (R1-R7) vivem na RPC, não em CHECK constraint

### M.5 — Decisões Pedro 18/05

| # | Decisão |
|---|---|
| 1 | Backfill 112 rows → `status='completed' + review_status='draft' + intended_audience='clinician_internal'` (preserva verdade histórica) |
| 2 | `hierarchy_label`: principal/secundária/exploratória/complementar (alinha UX cognitiva) |
| 3 | `withdrawn`: adicionar em ambos clinical_reports + clinical_rationalities (evita retratação parcial) |

### M.6 — Descoberta que mudou o plano: paciente lê JSONB, não tabela

Audit final de regressão revelou:

**`ClinicalReports.tsx:1197+1961` lê `report.content.rationalities` (jsonb)** — NÃO da tabela `clinical_rationalities` direta.

Implicação: mudar RLS da tabela **não esconde nada do paciente**. Fix real é guard frontend.

Plano V1.9.330-FULL (14 colunas + RLS + modal) parqueado. Plano V1.9.330-A (guard frontend ~15 linhas) destravado.

### M.7 — V1.9.330-A deployado (commit bfc7c19)

**Mudança**: 1 arquivo, ~42 linhas, encapsular bloco text/recs/cons em condicional `isPatient`:

```tsx
{isPatient ? (
  <p>"Análise [Label] aplicada ao seu relatório.
     Conteúdo técnico disponível ao seu médico para discussão na consulta."</p>
) : (
  <>{text}{recs}{cons}</>  // igual antes
)}
```

Médico/admin continuam vendo tudo. Paciente vê apenas badge + mensagem segura.

Type-check zero erros. Push 4 refs OK.

### M.8 — Calibração GPT 18/05: dual-write contract é o próximo passo

GPT analisou V1.9.330-A deployado e cristalizou:

> *"Não trate isso como problema resolvido definitivamente. Trate como hotfix estrutural na camada correta (UI contract), não correção do sistema inteiro. Porque o risco futuro não é exposição — é divergência entre JSONB (UI), tabela (analytics) e decisões clínicas."*

**Problema real apontado**:

Sistema escreve em 2 fontes paralelas SEM contrato:
- `clinical_reports.content.rationalities` (jsonb) — UI lê daqui
- `clinical_rationalities` (tabela) — analytics lê daqui

Quem escreve onde:
| Componente | jsonb | tabela |
|---|---|---|
| Edge `tradevision-core` linha 1716 (pipeline) | ⚠️ não toca | ✅ INSERT |
| Edge `tradevision-core` linha 2272 (promotion) | ⚠️ não toca | ✅ INSERT |
| Service `rationalityAnalysisService` linha 539 | ✅ UPDATE | ✅ UPSERT (sequencial, sem transação atômica) |

Hoje "concordam por coincidência ordenada". Mas:
- V1.9.330-FULL (adicionar status na tabela) sem refletir no jsonb = drift
- Edge gera integrative mas não atualiza jsonb = rationality fantasma na tabela
- Service UPSERT falha após UPDATE jsonb = UI mostra dado que analytics não conta
- Backfill SQL direto em uma fonte = drift acumulativo

**Risco regulatório**: CFM 2.314 pressupõe verdade única auditável. Dual-write silencioso = ambiguidade epistemológica.

### M.9 — Memórias cristalizadas hoje

**1. `project_v1_9_330_audience_contract_design_18_05.md`** — Design v3 completo parqueado pra V1.9.330-FULL quando trigger ativar (1º pagante OR Ricardo demanda OR >500 rows). Inclui mapeamento empírico de reuso (10 colunas existentes em clinical_reports + 4 novas justificadas), 3 audiências, 7 regras de derivação, decisões Pedro, calibrações GPT integradas.

**2. `feedback_dual_write_contract_jsonb_vs_tabela_18_05.md`** — REGRA META: antes de qualquer feature que toque jsonb+tabela espelho, decidir contrato de reconciliação. 3 opções (A tabela canônica / B jsonb canônica / C dual-write com reconciliação cron). Recomendação A. Checklist 7 perguntas. Frase âncora: *"Dual-write silencioso em sistema clínico = bomba relógio epistemológica. UI lê uma fonte, analytics lê outra, médico age numa terceira realidade."*

**3. MEMORY.md atualizada** — 2 pointers novos em NÍVEL 1 (ENTRY POINT).

### M.10 — Política operacional formalizada

Adicionada em CLAUDE.md sob "Avisos finais":

> *Não anunciar racionalidades MTC/Homeopatia/Ayurveda como feature visível ao paciente externo até V1.9.330-FULL implementado (Audience Contract completo). V1.9.330-A (commit bfc7c19) é hotfix UI; sistema ainda tem dual-write não-formalizado entre clinical_reports.content.rationalities (jsonb) e clinical_rationalities (tabela). Pré-requisito de V1.9.330-FULL: resolver dual-write contract antes (memory feedback_dual_write_contract_jsonb_vs_tabela_18_05).*

### M.11 — Próximo passo natural (não código)

GPT cristalizou direção:

> *"O próximo passo natural aqui não é mais schema nem frontend — é desenhar explicitamente o dual-write contract."*

Quando Pedro tiver bandwidth (sem urgência hoje):
1. Decisão estratégica: opção A (tabela canônica) / B (jsonb canônica) / C (dual com cron)
2. Mapeamento exaustivo de todos componentes que escrevem ou leem (completar audit parcial)
3. Trigger SQL skeleton (replicação source → projection)
4. Reconciliação inicial: comparar 112 rows existentes nas 2 fontes, identificar drifts já existentes
5. Plano de migração ordenado pra não introduzir gap

Sem esse design, V1.9.330-FULL pode AMPLIFICAR o bug em vez de resolver.

## 📊 Métricas operacionais do dia 18/05

| Métrica | Valor |
|---|---|
| Commits | 1 (V1.9.330-A) |
| Linhas alteradas | 42 (1 arquivo) |
| Migrations aplicadas | 0 |
| Componentes novos | 0 (1 condicional inline, sem componente extraído) |
| Memórias cristalizadas | 2 novas |
| Hotfixes estruturais | 1 (UI Contract) |
| Bugs operacionais | 0 (nenhum reportado por usuário real) |
| Bugs arquiteturais identificados | 1 confirmado (audience contract) + 1 novo (dual-write) |
| AEC FSM tocada | **ZERO** |
| Lock V1.9.95 violado | **ZERO** |
| Schema alterado | **ZERO** |
| Edge functions alteradas | **ZERO** |

## 🧠 Aprendizados meta cristalizados

1. **Audiência leiga = melhor testador de UX clínica**. Namorada + amigos detectaram em 1 sessão o que auditoria técnica não detectou em 10 dias.

2. **Hotfix estrutural ≠ solução estrutural**. V1.9.330-A é correto (camada UI Contract), mas não fecha capítulo. Sistema continua com dual-write não-formalizado.

3. **Polir-não-inventar funcionou**. Design v1 propunha 2 tabelas + 7 colunas; design v3 final reusa 80% padrão existente de `clinical_reports`. Frase âncora: *"O sistema cresceu assimetricamente. Não redesenhei — mapeei o que já existe e normalizou o delta."*

4. **Trigger empírico ≠ trigger temporal**. Eu propus "esperar 1º pagante"; Pedro destruiu o gate: "namorada não é pagante e já fez o teste". Trigger semântico (audiência não-clínica reagiu) já tinha ativado.

5. **Audit empírico antes de design poupa retrabalho**. Descobrir que paciente lê jsonb (não tabela) mudou completamente o plano — schema massivo virou guard frontend de 15 linhas. **Auditar antes de propor.**

6. **GPT como camada de calibração funciona bem quando Pedro faz cross-check**. Não engolir cego, mas usar como segunda perspectiva. GPT trouxe insight "dual-write contract" que eu não tinha pensado.

## 🎬 Frase âncora intermediária do dia 18/05 (descartada após bloco N)

> *"3 níveis de descoberta arquitetural em 1 dia: (1) namorada+amigos viram colapso de hierarquia interpretativa; (2) audit empírico revelou que UI lê jsonb não tabela — fix virou hotfix 15 linhas; (3) GPT identificou dual-write contract como bomba relógio epistemológica pré-requisito de qualquer V1.9.330-FULL."*

Nota retrospectiva: a frase **exagerou** a severidade do dual-write. GPT calibrou 2ª iteração — ver BLOCO N abaixo.

---

## 🔬 BLOCO N — Recalibração GPT (2ª iteração) + Presentation Contract Layer

GPT analisou tudo que foi documentado no bloco M e produziu **3 calibrações importantes** que retificam exageros.

### N.1 — Validações fortes (o que estava certo)

✅ V1.9.330-A guard UI = nível certo do problema atual
- Não tinha problema de RLS
- Não tinha problema de schema
- Tinha problema de **renderização sem contrato de audiência**
- Atacou o boundary certo

✅ Descoberta jsonb vs tabela é arquiteturalmente relevante
- **Mas não é "dual-write clínico"** — é source primário implícito + shadow table
- Muda completamente a gravidade

✅ Audience contract como problema existe de fato
- Ausência de distinção entre conteúdo gerado / interpretado / exibido
- Linguagem "ansiedade interpretativa" bem capturada

### N.2 — Correções conceituais (onde EXAGEREI)

**N.2.1 — "Dual-write contract crítico / bomba relógio" → EXAGERADO**:

Hoje tecnicamente é **event sourcing incompleto** (write + projection manual):
- jsonb = UI source of truth (snapshot clínico CFM 2.314 imutável)
- tabela = analytics projection

**NÃO é dual-write crítico ainda. NÃO é bloqueador de V1.9.330-FULL.**

Só vira problema real SE:
- Alguém EDITAR tabela como source
- BI clínico direto da tabela
- Tabela usada pra decisão médica

Hoje **nenhum** desses cenários está ativo. Risco existe **condicional**, não atual.

**N.2.2 — "RLS não importa" → CUIDADO**:

RLS da tabela não afeta UI paciente (esse ponto está correto). MAS RLS continua importando porque:
- Analytics clínico pode virar compliance layer
- Export/PDF/auditoria futura pode usar tabela
- Integrações externas provavelmente vão usar tabela

→ RLS não resolve UI, mas ainda é camada de governança futura.

**N.2.3 — "Schema não precisa de mudança" → PARCIALMENTE CERTO**:

✅ Pro problema atual (paciente lê texto bruto): UI guard resolve
❌ Pro problema estrutural (lineage/trace/versionamento): incompleto

Mas isso **NÃO é P0** — é V1.9.330+2 (futuro).

### N.3 — Reframing V1.9.330 em 3 camadas (versão limpa)

| Camada | O quê | Status |
|---|---|---|
| **SOURCE** (verdade clínica atual) | `clinical_reports.content.rationalities` (jsonb) — usado pelo frontend + médico, NÃO versionado formalmente | OK |
| **PROJECTION** (analytics/espelho) | `clinical_rationalities` (table) — usado pra métricas/pesquisa/RAG, NÃO source de verdade | OK |
| **PRESENTATION CONTRACT** (bug real) | `ClinicalReports.tsx` — onde estava o bug, onde foi corrigido com V1.9.330-A | Hotfix aplicado |

### N.4 — Diagnóstico final corrigido (substitui M.3)

> *"O sistema não tinha um problema de arquitetura de dados. Ele tinha um problema de ausência de **contrato de apresentação** entre geração de racionalidade clínica (AI), persistência estruturada (jsonb + tabela) e exposição ao paciente (UI). A falha não era de storage nem de RLS — era de **boundary semântico de renderização**."*

### N.5 — V1.9.330-FULL revisado (versão limpa, sem overengineering)

- **V1.9.330-A** ✅ deployado: UI guard (resolve exposição)
- **V1.9.330-B** (opcional, não crítico):
  - Padronizar jsonb structure (schema enforcement leve)
  - Adicionar `intended_audience` (só se quiser formalizar futuro)
- **V1.9.330-C** (futuro real):
  - Formalizar projection pipeline (event-driven via trigger SQL)
  - OU eliminar duplicação tabela vs jsonb (decisão única de source)

**Custo real V1.9.330-FULL recalibrado**: muito menor que estimei. Trigger SQL AFTER UPDATE content → projection (~10 linhas) + simplificar 2 call sites. Não é refator de 14 colunas + RLS + modal.

### N.6 — Insight verdadeiro do dia (cristalizado GPT)

> *"Vocês construíram primeiro o cérebro (racionalidades), depois o arquivo (storage), mas esqueceram o ato de contar isso para alguém. Esse ato de contar é uma camada própria — **PRESENTATION CONTRACT LAYER**. E ela não é nem backend nem frontend. É um terceiro espaço."*

**Não é** bug de UI / bug de schema / dual-write.
**É** ausência de Presentation Contract Layer.

### N.7 — Patches aplicados no CLAUDE.md (bloco N)

**Adicionado**: seção "Fonte de verdade de racionalidades (CRÍTICO)" antes de "Stack":

- Tabela jsonb (source UI) vs tabela (projection analytics) com propósitos diferentes
- **Regra de ouro**: *"Nunca derivar UI paciente de tabelas analíticas de racionalidade. Sempre derivar de `clinical_reports.content.*`."*
- Contrato de divergência **controlada** (não eliminação)
- Checklist 7 perguntas antes de feature que toque rationalities/content

### N.8 — Memórias atualizadas/criadas (bloco N)

1. `feedback_dual_write_contract_jsonb_vs_tabela_18_05.md` — **REFRAMING**: "dual-write crítico/bomba relógio" → "event sourcing implícito + risco condicional". Versão FINAL após 2 iterações GPT.

2. **NOVA** `project_presentation_contract_layer_18_05.md` — Conceito arquitetural cristalizado. Camada própria ortogonal a frontend/backend. 4 princípios + padrão recolocável pra futuros artefatos (notas livres, devolutivas, pareceres, hipóteses, conselheiros editoriais). Conexão com tese Escola Clínica Digital (camadas 3+4 = Presentation Contract em ação).

3. `MEMORY.md` — entrada dual-write reescrita, entrada Presentation Contract Layer adicionada em NÍVEL 1.

### N.9 — Aprendizado meta do bloco N

**Calibração externa (GPT) corrigiu exagero de 1ª iteração.** Padrão saudável:

- 1ª iteração: minha leitura tendeu a alarmismo ("bomba relógio epistemológica")
- 2ª iteração GPT: calibrou pra realidade ("event sourcing incompleto, risco condicional")
- Resultado: documentação **mais precisa**, menos urgência fabricada, mesmo rigor estrutural

**Lição**: cross-check com 2ª IA externa (GPT) detecta exageros que auditoria interna isolada não pega. Particularmente útil pra **calibrar severidade** (não conteúdo técnico).

## 🎬 Frase âncora FINAL do dia 18/05 (versão calibrada pós-bloco N)

> *"Cérebro + arquivo + ato de contar. Sem o terceiro, os outros dois viram bug epistemológico. V1.9.330-A foi primeiro exemplo aplicado de Presentation Contract Layer (terceiro espaço, nem backend nem frontend). Storage não é o bug — boundary semântico de renderização é. Calibração GPT 2 iterações desinflou 'bomba relógio dual-write' pra 'event sourcing incompleto com risco condicional'. Maturidade não é só código — é precisão de framing."*

— Pedro Henrique Passos Galluf + Claude Opus 4.7 (com calibração GPT 2 iterações), 18/05/2026 ~02h madrugada, encerrando ciclo bloco M+N.
