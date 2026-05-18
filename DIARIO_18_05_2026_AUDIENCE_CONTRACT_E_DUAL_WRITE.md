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

## 🎬 Frase âncora final do dia 18/05

> *"3 níveis de descoberta arquitetural em 1 dia: (1) namorada+amigos viram colapso de hierarquia interpretativa; (2) audit empírico revelou que UI lê jsonb não tabela — fix virou hotfix 15 linhas; (3) GPT identificou dual-write contract como bomba relógio epistemológica pré-requisito de qualquer V1.9.330-FULL. Padrão recolocável: audit → reuso → calibração → hotfix mínimo → design parqueado → próximo gate humano. Cresceu maturidade de processo, não só de código."*

— Pedro Henrique Passos Galluf + Claude Opus 4.7, 18/05/2026 ~01h30 madrugada, encerrando ciclo de sessão maratona 17→18.
