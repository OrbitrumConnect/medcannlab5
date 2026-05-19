# DIÁRIO 18/05/2026 — NOITE — Literatura + Fórum + Arquitetura de Confiança

> Sessão noturna iniciada após retomada pós-travada de chat. Foco original: pequenos polishes em Casos Similares (UX elite). Evoluiu pra criação de feature Literatura completa (V1.9.369-A/B/C), mini-relatório agregado V1.9.371, e cristalização de **6 princípios MASTER** novos via convergência de 6 análises GPT externas.

---

## ⏱️ Timeline executivo

| Hora BRT | Versão | O quê | Princípio cristalizado (se houve) |
|---|---|---|---|
| ~19h05 | V1.9.364 | Onda 1 UX elite Casos Similares (KPIs + chips + favoritos + atalhos teclado) | — |
| ~19h30 | V1.9.365 | Onda 2 painel lateral elite (Trilha de Pesquisa + Notas Rápidas) | — |
| ~19h45 | V1.9.366 | Fix sidebar aparecer no Terminal de Pesquisa (showSidebar prop explícita) | — |
| ~19h50 | V1.9.367 | Largura 1800px + sidebar fluxo natural (fix scroll bug) | — |
| ~20h45 | V1.9.368 | Banner ALPHA reforçado + subtítulo "Exploração experimental de padrões narrativos" + cristalizou 3 memories | "Viabilidade técnica ≠ Legitimidade epistemológica" + "Lexical ≠ Clínica" |
| ~21h00 | V1.9.369-A | Nova aba **Literatura** (PubMed via E-utilities, $0 grátis, sem GPT) | — |
| ~21h10 | V1.9.369-B | 4 tabs editoriais (Busca livre / Novidades 30d / Cannabis BR / Guidelines) | — |
| ~21h25 | V1.9.369-C | Cross-link Racionalidade → Literatura (dict-first + GPT opt-in chips editáveis) | "GPT como ferramenta linguística, não autoridade epistemológica" |
| ~21h35 | V1.9.370 | Cards Literatura side-by-side + botão Buscar verde brand (purple→emerald) | — |
| ~22h00 | V1.9.371 | Mini-relatório AGREGADO no modal (médico não sai do contexto) + cristalizou memory | "Inteligência estrutural ≠ Inteligência inferencial" |
| ~22h30 | (sem código) | Audit Fórum via PAT + 6ª análise GPT externa | "Publicação ≠ Exploração interna" + "Arquitetura de confiança antes de feature delivery" |

**11 commits cirúrgicos.** Push 4 refs OK em todos.

---

## 🏗️ Estado final da feature Literatura

### Nova aba "Literatura" no Terminal de Pesquisa

```
Dashboard | Casos Similares | Fórum | Base Conhecimento | ★ Literatura ★ | Protocolos | Mentoria | ...
```

Ícone: 🔬 Microscope (indigo). Distingue visualmente de Base de Conhecimento (BookOpen — docs internos).

### 4 tabs editoriais dentro da Literatura

| Tab | Query auto-disparada | Pra que serve |
|---|---|---|
| 🧭 Busca livre | User digita | Default |
| 📰 Novidades 30 dias | `cannabis OR CBD` últimos 30d sort=data | Médico abre e já vê content sem digitar |
| 📍 Cannabis no Brasil | `cannabis` + `Brazil[Affiliation]` 10 anos | Papers de autores brasileiros |
| 📜 Guidelines | `cannabis` + `Practice Guideline[Publication Type]` 10 anos | Diretrizes oficiais |

### Cross-link Racionalidade → Literatura (V1.9.369-C)

Botão "🔎 Buscar literatura sobre esta racionalidade" em cada card de racionalidade no modal de caso. Click abre mini-modal:

- Chips PT↔EN extraídos do texto da racionalidade
- Default: dicionário curado ~85 termos ($0, instantâneo)
- Toggle opt-in: "⚡ Extração IA expandida" (~$0.01/uso — pattern V1.9.357 reusado)
- Chips SEMPRE editáveis (médico revisa antes de buscar)
- Preview da query PubMed
- Disclaimer: "Sistema EXTRAI termos, médico DECIDE busca, PubMed RETORNA evidência"

### Mini-relatório agregado (V1.9.371)

Click "📊 Gerar relatório" → relatório aparece **DENTRO do mesmo modal** (não navega):

```
RELATÓRIO ESTRUTURAL · 12 mostrados · 98 no PubMed
├─ KPIs: Total / Últimos 5 anos / Último ano / Top journal
├─ 🏆 Meta-análises (N)
├─ 🔬 RCTs (N)
├─ 📋 Guidelines (N)
├─ 📈 Observacionais (N)
├─ 📚 Reviews (N)
├─ 📝 Case Reports (N)
├─ 📄 Outros (N)
└─ Top 3 journals mais frequentes
```

Cada paper individual com link PubMed (auditável). Botão secundário "Ver tudo na Literatura →" preserva caminho V1.9.369-C.

---

## 🧠 6 princípios MASTER cristalizados

Convergência de 6 análises GPT externas + decisões empíricas do Pedro = corpus de governança emergente.

### 1. Viabilidade técnica ≠ Legitimidade epistemológica
> "Tecnicamente funciona. Conceitualmente é frágil."

Em IA clínica o perigo quase nunca é técnico — é estrutura tecnicamente plausível produzir confiança cognitiva indevida. Aplica a TODA feature cognitiva em saúde.

### 2. Lexical ≠ Clínica
> "ILIKE compara letras. Médico compara doenças."

Diagnóstico técnico-preciso da Onda 1 Casos Similares. Matching textual produz ilusão de similaridade. Evidência empírica: "dor de cabeça" (8) e "a dor de cabeça" (8) viraram grupos separados no audit empírico.

### 3. GPT como ferramenta linguística, NÃO autoridade epistemológica
> "GPT só extrai termos, não sintetiza significado."

Hierarquia 3 camadas: Dicionário (base auditável) → GPT (expansão contextual opt-in) → Médico (decisão final). Aplicado em V1.9.369-C (chips PT↔EN com toggle GPT).

### 4. Inteligência estrutural ≠ Inteligência inferencial
> "Sistema agrega + organiza + apresenta. Médico interpreta + decide + age."

Camada INTERMEDIÁRIA poderosa entre dados crus e síntese clínica. Tabela ouro:
- ESTRUTURAL: "12 RCTs", "8/12 últimos 5 anos", "top journal Headache (2)"
- INFERENCIAL: "evidência forte", "tratamento funciona", "consenso científico"

Aplicado em V1.9.371 mini-relatório.

### 5. Publicação ≠ Exploração interna
> "Apoio interno e publicação são dois regimes regulatórios diferentes."

Salto regulatório ao publicar é QUALITATIVO, não incremental. Mudam: audiência (1→N), persistência (sessão→post permanente), interpretação (singular→coletiva), reidentificação (baixa→ALTA), base legal (sigilo→pesquisa biomédica).

### 6. Arquitetura de confiança ANTES de feature delivery
> "Engenheirar produto ≠ Arquitetar confiança."

Meta-princípio organizacional. Maioria health AI: feature → joga casos → disclaimer → espera não dar problema. Aqui: governança/consentimento/pseudonimização/epistemologia ANTES da circulação. 6 camadas modelo emergente.

---

## 🚨 Audit Fórum — 3 bloqueios descobertos (decisão: NÃO codar agora)

Pedro perguntou se mini-relatório V1.9.371 poderia conectar com Fórum pra Ricardo/Eduardo/equipe debater. Audit empírico via PAT revelou:

| Camada | Estado |
|---|---|
| Frontend `ForumCasosClinicos.tsx` | 1143 linhas existente |
| Backend `forum_posts/comments/likes/views/noa_clinical_cases` | 5 tabelas, **ZERO uso** |
| **🔴 Bloqueio 1** RLS `noa_clinical_cases` | `SELECT USING (true)` — qualquer autenticado vê tudo (LGPD art. 11 violado) |
| **🟡 Bloqueio 2** Pseudonimização | só `patient_initials` (fraca pra casos raros, padrão HIPAA exige 18 identificadores) |
| **🟡 Bloqueio 3** Consentimento | só genérico (NFT consent V1.9.311 não cobre "discussão fórum") |

**Decisão Pedro 18/05 noite**: NÃO codar Fórum até os 3 bloqueios resolvidos. Codar UX agora institucionalizaria dívida regulatória.

**V1.9.373 candidato** (fix RLS): pequeno, independente de qualquer outra decisão, resolve débito antigo. Pode ir sozinho quando autorizado.

**Roadmap 3 fases** parqueado:
- Fase A — Segurança/governança (RLS + pseudonim + consent NFT estendido)
- Fase B — Pipeline publicação (modal preview pseudonim + anexar relatório literatura)
- Fase C — Debate e inteligência coletiva (estrutura CASO + RACIONALIDADE + LITERATURA + DISCUSSÃO)

---

## 📂 Arquivos novos criados (6 código + 4 docs)

### Código (sustenta features V1.9.369-A → V1.9.371)
- `src/services/pubmedService.ts` — wrapper E-utilities (esearch + esummary + filtros editoriais)
- `src/hooks/useExternalLiterature.ts` — cache 1h + debounce 400ms + AbortController + presets editoriais
- `src/pages/ExternalLiterature.tsx` — componente principal com selo "Fonte externa"
- `src/lib/clinicalTermsTranslator.ts` — dicionário ~85 termos PT→EN + extrator heurístico
- `src/lib/gptTermExtractor.ts` — wrapper GPT restrito a extração (não sumariza, não opina, não diagnostica)
- (LiteratureReport inline em AdminCasosSimilares.tsx — componente isolado mas mesmo arquivo)

### Docs / Memory cristalizadas
- `memory/feedback_viabilidade_tecnica_vs_legitimidade_epistemologica_18_05.md`
- `memory/feedback_lexical_nao_e_clinica_18_05.md`
- `memory/audit_back_v1_9_368_bugs_descobertos_18_05.md` (2 bugs pré-existentes pra V1.9.370+)
- `memory/feedback_inteligencia_estrutural_vs_inferencial_18_05.md`
- `memory/feedback_publicacao_nao_e_exploracao_interna_18_05.md`
- `memory/feedback_arquitetura_de_confianca_antes_de_feature_delivery_18_05.md`
- `memory/audit_forum_3_bloqueios_pre_publicacao_18_05.md`
- `DIARIO_18_05_2026_NOITE_LITERATURA_FORUM.md` (este arquivo)

---

## 🐛 Bugs pré-existentes descobertos (memory dedicada, fix futuro)

Durante audit pra V1.9.368 (via PAT empírico):

1. **Cost tracking quebrado**: nenhuma busca foi logada em `ai_chat_interactions` com simbologia '🔬 Casos Similares' apesar de Pedro ter rodado várias. `monthlyCost` SEMPRE = $0, cap $50/mês NUNCA trava. Causa raiz: NoaResidentAI.processMessage não recebe/propaga simbologia.

2. **2 campos jsonb fantasma**: `chiefComplaint` e `assessment` têm 0 hits no corpus mas estão no OR filter da query (V1.9.355). Sobrecarrega query.

Memory: `audit_back_v1_9_368_bugs_descobertos_18_05`. Triggers pra fix: 2º médico ativo / análise custo institucional / Marco 2.

---

## 📊 Métricas empíricas (audit via PAT 18/05 noite)

| Métrica | Valor real | Observação |
|---|---|---|
| clinical_reports | **131** | Era 128 no CLAUDE.md (drift +3) |
| pacientes únicos | 20 | — |
| reports últimos 90d | 124 (95%) | — |
| clinical_rationalities | **122** | Era 119 no pricing memory (drift +3) |
| - integrative | 91 (75%) | Domina amplamente |
| - biomedical | 11 | — |
| - homeopathic | 9 | — |
| - ayurvedic | 6 | — |
| - traditional_chinese | 5 | — |
| Forum tables (5) | 0 rows cada | Infraestrutura dormindo |
| Casos Similares searches | 0 (cost tracking quebrado) | Bug pré-existente |

---

## 📋 Pendências pós-sessão noite

### Decisões humanas pendentes (não-código)
- **Pedro + Ricardo + João**: definir nível de pseudonimização aceitável pro Fórum (iniciais? código? full anon?)
- **Pedro + João + advogado**: validar consent específico via NFT V1.9.311 estendido
- **Pedro + Ricardo**: validar quem pode ver fórum (só profissional? aluno também?)

### Código pendente (pode ir quando autorizar)
- **V1.9.372** — 4 refinamentos mini-relatório (dedup + sub-grupos "Outros" + linha "periféricos" + wording elegante) — pequeno
- **V1.9.373** — Fix RLS noa_clinical_cases (P0 independente) — pequeno
- **V1.9.380+** — Fase A Fórum (pseudonim function + NFT consent extension) — médio, após decisões humanas

### Memory pra retomar
Sessão LÊ no boot:
- `MEMORY.md` (index Nível 1 atualizado com 6 novos princípios)
- `feedback_coerencia_e_alinhamento_qualquer_fix_17_05` (filtro 6 perguntas)
- `feedback_arquitetura_de_confianca_antes_de_feature_delivery_18_05` (novo meta-princípio)

---

## 🪧 Frase âncora da noite

> *"6 commits cirúrgicos entregaram Literatura completa + cross-link Racionalidade → Literatura + mini-relatório agregado, criando 'painel contextual de panorama bibliográfico' (não 'launcher de PubMed'). 6 análises GPT externas convergiram pra cristalizar 6 princípios MASTER que formam corpus de governança emergente do MedCannLab. Audit empírico do Fórum revelou bloqueios reais (RLS aberta + pseudonim fraca + sem consent específico) — decisão consciente de NÃO codar até resolver. Arquitetura de confiança antes de feature delivery: a diferença entre engenheirar produto e arquitetar confiança."*

---

Cristalizado 18/05/2026 ~23h BRT.
HEAD: `beb4f54` (V1.9.371 mini-relatório agregado).
Push 4 refs (amigo+medcannlab5 × main+master): OK em todos os 11 commits.
Type-check clean em todos os 11.
Lock V1.9.95+97+98+99-B+299: intocado 100%.
Anti-kevlar §1: respeitado 100%.
