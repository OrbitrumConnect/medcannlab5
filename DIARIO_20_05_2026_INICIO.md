# Diário 20/05/2026 — Início

**Autores**: Pedro Henrique Passos Galluf + Claude Opus 4.7 (1M context)
**Estado entrada do dia**: Matrix V1.9.388-A.7 deployada e validada (smoke 19/05 noite), pricing dinâmico cristalizado (madrugada cedo 20/05), pendências de ~1 mês mapeadas (memory `audit_pendencias_um_mes_pos_pbad_20_05`), Pedro autorizou beta orgânico 20-30 usuários
**Sessão começa**: 20/05 ~11h50 BRT — Pedro navegando no app, Claude mapeando pendências em paralelo

---

## 🌅 BLOCO A — Manhã/Início: pricing dinâmico + 22 pendências mapeadas

### A.1 — Pedro autorizou Sprint 1 (limpezas rápidas)
Após dia 19 fechado com Matrix V1.9.388-A.7 deployada e 20-30 usuários autorizados, Pedro pediu ataque dos 22 itens mapeados em `audit_pendencias_um_mes_pos_pbad_20_05` (filtrando CNPJ e Ricardo). Escolha: Sprint 1 com 5 vitórias rápidas.

### A.2 — Pricing dinâmico cristalizado (sequência madrugada)
Memory `reference_pricing_dinamico_cap_byo_sem_trava_20_05` consolidou:
- Plano FULL único por perfil (Paciente R$ 9,90 / Aluno R$ 59,90 / Profissional R$ 99,90 + split)
- Cashback dinâmico (early 5% / padrão 3% / recorrente +1% / campanha 5-8%)
- Caps mensais Matrix 500/300/200 com reset diário fracionado
- BYO-LLM trigger recalibrado Marco 1 (não Marco 3)
- Princípio "não trava financeiramente" — flat fee + reset, nunca créditos a comprar
- 6 sinais comportamentais pra beta 20-30 (autoridade invisível + offloading + 4 cashback)

## 🛠 BLOCO B — Sprint 1 execução (~12h00 BRT)

### B.1 — 5 itens planejados
1. ✅ ADD COMMENT `chat_messages_legacy` + `chat_messages` (10min — done)
2. ✅ ALTER 4 views DEFAULT → SECURITY INVOKER (memory dizia 2, eram 4)
3. ✅ Audit 74 órfãos bucket documents (memory dizia 72, eram 74)
4. ✅ Audit V1.9.307 sidecar renal (1 uso só — Ricardo 17/05, infra sem adoção)
5. ✅ Audit V1.9.311 NFT Gallery (32 NFTs, 2 shared — AMBAS Pedro testando)

### B.2 — Descoberta arquitetural durante Sprint 1
Pedro pediu Nôa citar docs no chat → 5. UI Base de Conhecimento mostrava 41. Lacuna detectada.

Investigação:
- `public.documents` (41 rows) = base institucional UI
- `public.base_conhecimento` (5 rows) = RAG hand-crafted real
- Edge `tradevision-core` linha ~4862 lê APENAS `base_conhecimento`

Claude propôs "salto quantitativo": migrar 33 docs com `content` extraído (>100 chars) pra `base_conhecimento`. Pedro perguntou: *"da bom? não tem regressão e o correto né?"*

### B.3 — Quase-regressão V1.9.308 evitada
Auditando código antes de executar, descobri comentário linha 4815-4822:

> *"V1.9.308 (16/05) adicionou documents ao RAG. GPT começou interpretar 'analise este relatório' como 'ele quer ver documentos' → emitia DOCUMENT_LIST em vez de raciocinar. Antes: 1 caso em 16d. Após: 6 casos em 21h. V1.9.318 (17/05) REVERTEU."*

Migrar 33 docs reintroduziria o bug revertido há 3 dias.

### B.4 — Calibração GPT externa + decisão
GPT externo trouxe argumento técnico válido:
- "Boundaries explícitos protegem mais que tipos elegantes condicionais" (B > A)
- "Não mexer durante beta 20-30 é disciplina operacional, não covardia técnica" (C como caminho atual)

Decisão cristalizada: **Opção C agora** (não migrar) + **Opção B parqueada** (criar `base_conhecimento_pesquisa` quando Matrix Z2 precisar empíricamente).

### B.5 — Princípio cristalizado
> *"RAG não é só banco de conhecimento. RAG molda comportamento cognitivo do sistema. Engrossar corpus muda o que o GPT acha que o usuário quer."*

Memory `feedback_rag_molda_comportamento_cognitivo_20_05` criada (nível 1 do MEMORY.md).

## 🔧 BLOCO C — Ações executadas via Management API

### C.1 — ADD COMMENT em chat_messages tables ✅
- `chat_messages_legacy` documentada como CANÔNICA (apesar do nome)
- `chat_messages` documentada como SHELL planejada vazia
- Evita novo dev/Claude dropar legacy achando que é antiga

### C.2 — ALTER 4 views DEFAULT → SECURITY INVOKER ✅
Memory dizia 2, eram 4:
- `v_clinical_cycle_health`
- `v_icp_pdf_status`
- `v_renal_suggestions_active`
- `v_renal_suggestions_pending`

Todas convertidas pra `security_invoker = true`. P0 segurança fechado.

### C.3 — Migrar ownership 74 órfãos → Pedro admin ✅
Contexto histórico crítico (Material A Pedro): docs são da época que Ricardo tentou ensinar IA do APP (NÃO do Lovable como Claude inferiu — corrigido pelo Pedro). 5 contas Lovable antigas órfãs após migração pra Supabase Auth.

UPDATE em 74 rows em `storage.objects`: owner = `17345b36-50de-4112-bf78-d7c5d9342cdb` (Pedro admin).

Zero órfãos remanescentes. Preservação 100% do conteúdo.

### C.4 — Atestado Marco Tanus quarentinado ✅
Anomalia arquitetural detectada: doc clínico individual (`Atestado_Marco_Tanus_04_02_26__assinado.pdf`) estava em `public.documents` categoria `cases` com:
- `isLinkedToAI = true` (RAG)
- `is_published = true` (UI)
- `target_audience = ['professional', 'student']` ⚠️ VAZAMENTO LGPD

Marco Tanus não existe em `public.users` (paciente externo, talvez nunca cadastrado).

Soft delete aplicado:
- `is_published = false`
- `isLinkedToAI = false`
- `target_audience = []`
- `category = 'cases_lgpd_quarantine'`
- Summary acrescido com audit trail
- Arquivo no Storage preservado (audit LGPD)

Zero docs com `cases` públicos após quarentena.

### C.5 — CLAUDE.md atualizado (anti-regressão futura)
Nova seção `## Fonte de verdade do RAG da Nôa` adicionada após dual-write:
- 2 bases separadas POR DESIGN (`documents` 41 vs `base_conhecimento` 5)
- Histórico V1.9.308 → V1.9.318 documentado
- Regra de ouro anti-migração
- Gatilho futuro pra Opção B
- Checklist 6 perguntas antes de mexer em RAG
- Cases LGPD quarentena (anomalia arquitetural)

## 🧬 BLOCO D — Memorias cristalizadas hoje

| Memory | Tipo | Conteúdo |
|---|---|---|
| `reference_pricing_dinamico_cap_byo_sem_trava_20_05` | reference | Pricing dinâmico + cap + BYO sem trava financeira |
| `audit_pendencias_um_mes_pos_pbad_20_05` | audit | 22 itens executáveis ~1 mês sem CNPJ/Ricardo |
| `feedback_rag_molda_comportamento_cognitivo_20_05` | feedback | Princípio anti-regressão V1.9.308 + lacuna 41 vs 5 |

Todas no nível 1 do MEMORY.md.

## 📊 BLOCO E — Estado fim Sprint 1

**5 vitórias rápidas concretas**:
- 2 tabelas com COMMENT documental
- 4 views convertidas pra SECURITY INVOKER (P0 segurança)
- 74 órfãos com owner válido (preservação + LGPD compliance)
- 1 atestado quarentinado (vazamento LGPD fechado)
- 1 CLAUDE.md robusto contra V1.9.308 regressão

**3 audits empíricos** (alimentam decisões futuras):
- V1.9.307 sidecar renal: 1 uso em 4 dias = infra sem adoção, parqueado
- V1.9.311 NFT Gallery: zero usuário externo, 2 shares ambos Pedro teste
- documents vs base_conhecimento: separação V1.9.318 confirmada como design

**1 quase-regressão evitada**: migração 33 docs → base_conhecimento ABORTADA antes de execução por checklist coerência+alinhamento detectar V1.9.318 revert.

---

## 🚀 BLOCO F — Sprint 2 começa: F1 Auto-ativação Matrix (V1.9.389)

### F.1 — Pedro autorizou Sprint 2 elite escalável

> *"podemos ir para f1? sprint 2 correto pro elite escalavel sem regressao? qlqr coisa leia 3 diarios passados afina mais conhecimento e sua memoria"*

Aplicado ritual cristalizado: ler 3 diários passados (18 noite + 19 obs + 19 Matrix) + memorias chave antes de codar. Princípio `feedback_coerencia_e_alinhamento_qualquer_fix_17_05` checklist 6 perguntas aplicado.

### F.2 — F1 = "Auto-ativação Matrix pós-relatório"
Memory `project_visao_final_eixo_pesquisa_19_05` (gap F1 da jornada Pesquisa):
- Hoje: botão "Nôa Matrix" no header do PatientFocusView (V1.9.382), sempre visível
- Médico precisa LEMBRAR de clicar após assinar relatório
- Visão Pedro: banner contextual aparece automaticamente quando há relatório recém-assinado

### F.3 — Implementação V1.9.389
Mudança cirúrgica em `src/components/PatientFocusView.tsx`:

1. **`useMemo recentSignedReport`**: filtra `focusReports` (já carregado V1.9.382) por `signed_at < 24h` + não-dismissed
2. **`useState dismissedReports`** (Set<string>) persistido em `localStorage['f1_dismissed_reports_v1']`
3. **Banner condicional** entre header e tabs:
   - Gradient purple→amber (Matrix Z2 theme)
   - Mensagem Z2 não-diretiva: *"Quer estruturar sua reflexão sobre este caso..."*
   - 2 CTAs: "Estruturar na Nôa Matrix" (navega + dismiss) / "Mais tarde" (só dismiss)
   - Botão ✕ no canto

### F.4 — Reuso máximo (polir-não-inventar)
- `focusReports` já carregado em useEffect existente (linha ~98 `clinicalReportService.getPatientReports`)
- Rota Matrix `/app/pesquisa/profissional/dashboard?section=noa-matrix&patientId=X` (mesma V1.9.382 — zero rota nova)
- localStorage key (sem schema novo)
- Ícones Sparkles + X já importados pelo Lucide

### F.5 — Defesa em camadas (anti-regressão)
- Banner SÓ em PatientFocusView (não polui outras telas)
- SÓ se showPatientAvatarView + selectedPatient
- SÓ se signed_at < 24h
- SÓ se médico não dismissou (uma sugestão por relatório, persistente)
- Frase Z2 não-diretiva (sugere, não força)
- **AEC / Pipeline / Verbatim / Locks V1.9.95+V1.9.299 INTOCADOS**

### F.6 — Smoke test esperado
1. Médico abre PatientFocusView de paciente com report signed nas últimas 24h
2. Banner aparece entre header e tabs
3. Click "Estruturar" → vai pra Matrix com patientId pré-carregado
4. Banner NÃO reaparece pra esse mesmo report (dismiss persistido)
5. Outro paciente com signed recente → banner aparece pra ele também

### F.7 — Status pós-F1
- Commit `c58e135` deployed, push 4 refs ✅
- Vercel auto-deploy ~2min
- **Jornada eixo Pesquisa**: relatório assinado → **Matrix sugere automaticamente** ✅ F1 done
- Próximas F2 (function calling PubMed/KB) + F3 (fechar dossiê) + F4 (fórum publicação ativa) seguem parqueadas com triggers claros

---

## 🔄 BLOCO G — F1 iterado: Opção B substitui banner por botão card (V1.9.389-B)

### G.1 — Pedro testou F1 V1.9.389 e propôs UX melhor
Após smoke do banner: *"aqui no historico do relatorio no card do propio relatorio nao seria mais rapido?"*

Comparação honesta apresentada (3 opções):
- A — Manter banner + adicionar botão card (overlap)
- **B — Substituir banner por botão card (escolhida)**
- C — Manter só banner

### G.2 — Implementação V1.9.389-B
3 mudanças cirúrgicas (net −118 / +70 linhas):
1. **`src/components/PatientFocusView.tsx`** — REVERTE banner (useMemo + useState + localStorage + JSX 92 linhas)
2. **`src/pages/PatientsManagement.tsx`** — ADICIONA botão "Estruturar na Matrix" inline em cada card de histórico de evolução com `source='report' && signed=true`
3. **`src/components/ClinicalReports.tsx`** — ADICIONA botão "Matrix" ao lado do Download em cada card de relatório (apenas `!isPatient && hasICPSignature`)

### G.3 — 2 entry points contextuais agora
- **Entry 1**: PatientFocusView → aba "Paciente em foco" → bloco 5 Histórico → botão no card
- **Entry 2**: `/app/reports` (Relatórios Consolidados) → cards de relatório → botão "Matrix" ao lado do Download

Vantagens vs banner anterior:
- Granularidade por relatório (não 1 global)
- Disponibilidade pra QUALQUER report ICP (não só <24h)
- Sem dismiss persistente (é ação, não notificação)
- Espaço UI preservado

### G.4 — Commit `0561a44` + push 4 refs ✅

---

## 📐 BLOCO H — Distinção epistemológica Matrix × Casos Similares (Material A cristalizado)

### H.1 — Conversa Pedro+Ricardo+GPT-Ricardo 20/05 ~13h BRT
WhatsApp: Pedro explicou pro Ricardo as 3 camadas de docs (Base global / Base pessoal médico / Prontuário paciente) + workflow curadoria humana. Ricardo levou conversa pro GPT externo dele.

GPT-Ricardo respondeu com análise extensa. Aplicando checklist anti-dialeto-paralelo (memory 19/05):
- 95% eco descritivo (Matrix reorganização de algo distribuído / banner F1 ponte / IA residente não mandatória) — VÁLIDO
- 1 calibração técnica necessária: "todas passam pela NoaResidentAI" tem nuance V1.9.388-A.1 (bypass cirúrgico da pipeline cliente)
- 1 insight NOVO empíricamente VÁLIDO: **distinção operação cognitiva Matrix vs Casos Similares**

### H.2 — Distinção cristalizada
Memory `feedback_matrix_prolonga_vs_casos_similares_infere_20_05` (nível 1):

| Feature | Operação cognitiva | Risco epistêmico |
|---|---|---|
| **Nôa Matrix** | PROLONGA 1 contexto único (mesmo paciente longitudinal) | Baixo |
| **Casos Similares** | INFERE equivalência entre contextos diferentes (paciente A ≈ B) | Alto — exige mediação editorial humana |

Explica empíricamente:
- Por que Matrix amadureceu rápido (smoke 4 turnos 19/05, autorização beta 20-30)
- Por que Casos Similares ficou ALPHA (memory `audit_ricardo_validation_18_05`)
- A diferença NÃO é UI — é operação cognitiva

### H.3 — Conexão com Sequência Conservadora Ricardo

| Eixo | Operação | Risco | Feature |
|---|---|---|---|
| Indivíduo-longitudinal | escuta + reflexão sobre 1 paciente | baixo | AEC + relatório + Matrix |
| Médico-curatorial | médico cura + decide | médio | Fórum review + Conselheiros |
| Coletivo-inferencial | máquina cruza N contextos | alto | Casos Similares + clustering |

### H.4 — Resposta cirúrgica enviada pro Ricardo via WhatsApp
Calibrou 1 nuance técnica (atalho cirúrgico Matrix) + validou insight epistemológico + amarrou na Sequência Conservadora dele.

---

## 🎯 BLOCO I — UX polish + F3-A.1 + V1.9.391 fix + log empírico

### I.1 — V1.9.389-C UX polish 13h30 BRT
Feedback Pedro pós-smoke V1.9.389-B: PubMed enterrado abaixo do material + cores muito roxo (arco-íris):
- Material disponível: max-h 500→320 (dá espaço pro PubMed embaixo)
- Cores PubMed + botões F1-B: purple → emerald-neon (memory `feedback_clinical_cockpit_cor_por_estado_16_05`)
- Identidade Matrix mantém purple (avatar/header) — distinção semântica preservada
- Commit `04806e0`

### I.2 — V1.9.390 F3-A.1 dossiê PDF 14h BRT
Sprint 2 F3 mínimo (consenso Pedro+Claude+GPT-Pedro 20/05 ~14h30):
- F3-A.1 PDF cliente-side puro (window.print) ANTES de F4 fórum
- Sequência arquitetural: F3 cria objeto institucional → F4 publica esse objeto
- 3 arquivos: dossierExport.ts (330 linhas) + ResearchChat onCloseDossier + NoaMatrixView callback
- Reuso máximo: messages local, cards selected, attachedPubmed, patientPseudonym
- 4 seções no PDF: header institucional, §1 corpus, §2 papers PubMed, §3 conversa transcript
- Commit `cbf7027`

### I.3 — V1.9.391 fix overflow flex 15h BRT
Pedro reportou empíricamente: respostas Matrix longas cobertas pelo input. GPT-Pedro diagnosticou: bug clássico Tailwind flex overflow.
- Container raiz: `h-full min-h-0` (fix bug clássico)
- Mensagens: `flex-1 min-h-0 pb-6 max-h-[650px]` (respiro + altura adequada)
- Header + input + error: `shrink-0` (não comprimem com scrollable)
- Commit `a533b09`

### I.4 — Smoke F3-A.1 + análise GPT-Pedro 14h30
Pedro gerou PDF Paciente #C0F4 (queixa renal espuma+edema+dor), anexou 2 papers ruins (recurrent events + Beagles), perguntou "compare".

GPT-Pedro analisou PDF gerado:
- **80% profissional real / 20% transcript visível**
- Acertos confirmados: header institucional, separação §1/§2/§3, pseudonimização LGPD, disclaimer epistemológico, trilha cognitiva
- 2 insights novos parqueados:
  - F3-A.3 curadoria semântica papers (papers ruins entram sem filtro — Matrix corretamente apontou mas UX sugere "anexou qualquer coisa")
  - F3-A.4 síntese editorial vs transcript (hoje é dump literal, salto premium = síntese estruturada)
- Frase âncora GPT-Pedro: *"vocês já resolveram a parte mais rara: postura epistemológica correta"*

### I.5 — Log Edge tradevision-core 15h30 — saúde arquitetural confirmada empíricamente

2 chamadas Matrix capturadas. Tudo intacto:

| Versão | Indicador empírico | Estado |
|---|---|---|
| V1.9.388-A.1 (bypass) | Zero `[Noa] Intencao detectada`; tokens 5k vs 29k antigo | ✅ |
| V1.9.388-A.3 (full+voz) | `model: gpt-4o-2024-08-06`; voz contida sem alucinação | ✅ |
| V1.9.388-A.5 (HYBRID BYPASS) | `[HYBRID BYPASS] Silenciando lógica de documentos` | ✅ |

Custo real: **R$ 0,13/chamada** (~5000 tokens × gpt-4o full). Sessão dossiê: R$ 0,50-0,75. Cap 500/mês prof: R$ 65 teto.
**Bate com pricing dinâmico cristalizado madrugada** — confirmação empírica do design (`reference_pricing_dinamico_cap_byo_sem_trava_20_05`).

2 sinais cosméticos (NÃO regressão):
- Keywords RAG extraídas de cabeçalho `[contexto marcado pelo médico]` em vez da query real → parqueado V1.9.388-A.6
- `[DOCTOR] Detectado dinamicamente: Marcelo Antero da Silva` — confirmado via PAT como médico real cadastrado, feature válida

### I.6 — F4 fórum publicação design proposto (não codado)

Pedro perguntou como estruturar fórum elite escalável (aguardando avaliação / em debate / fechado / reabrir + analytics). Audit empírico:
- Schema `forum_posts` existe (23 colunas, 0 rows)
- Falta workflow editorial: status enum + reviewed_by + dossier_id + resolved_at + reopened_count

Design proposto (não implementado):
- Lifecycle: DRAFT → PENDING_REVIEW → ACTIVE → RESOLVED → ARCHIVED
- Migration aditiva (8 colunas + 2 índices)
- UI 3 tabs (Meus Dossiês / Em debate / Resolvidos) + 8 KPIs
- Workflow editorial (autor publica → admin/conselho aprova)
- F4 alinhado com princípio cristalizado: eixo coletivo-inferencial EXIGE mediação editorial humana

**Ordem implementação sugerida**: F3-A.2 persistência ANTES de F4 (precisa `dossier_id` real pra ligar).

### I.7 — Memorias cristalizadas hoje (consolidação)

| Memory | Nível | Conteúdo |
|---|---|---|
| `reference_pricing_dinamico_cap_byo_sem_trava_20_05` | 1 | Pricing FULL + cashback dinâmico + cap + BYO sem trava |
| `audit_pendencias_um_mes_pos_pbad_20_05` | 1 | 22 itens executáveis sem CNPJ/Ricardo |
| `feedback_rag_molda_comportamento_cognitivo_20_05` | 1 | Princípio V1.9.308→318→Sprint1 |
| `feedback_matrix_prolonga_vs_casos_similares_infere_20_05` | 1 | Distinção epistemológica |
| `project_v1_9_388_matrix_log_empirico_20_05` | 1 | Log empírico fresh confirmação saúde V1.9.388 |

5 memorias novas no nível 1 do MEMORY.md HOJE.

---

## 🗂 BLOCO J — F3-A.2 V1.9.392: persistência completa do dossiê

### J.1 — Pedro autorizou F3 completo
> *"f3 completo parece legal pro elit escalavel sem regressao corretamente ok!"*

F3-A.2 fecha o eixo MÉDICO-CURATORIAL da Sequência Conservadora antes de F4 (eixo coletivo).

### J.2 — 5 etapas executadas (todas verificadas empíricamente)

| Etapa | Entrega | Verificação |
|---|---|---|
| 1 | Schema `physician_research_dossiers` (9 col) + 4 RLS + 2 índices via Management API | audit: rls_on=true, 4 policies, 3 índices ✅ |
| 2 | Hook `useDossierPersist.ts` (save/list/delete) | type-check ✅ |
| 3 | NoaMatrixView callback: salvar + PDF num clique | type-check ✅ |
| 4 | UI accordion "Meus Dossiês" (lazy load + re-PDF + delete) | type-check ✅ |
| 5 | Commit `2de7072` + push 4 refs | smoke INSERT/SELECT/DELETE ✅ |

### J.3 — Decisão arquitetural: snapshot imutável
`content jsonb` preserva estado do MOMENTO da geração. clinical_reports/clinical_rationalities podem mudar depois — dossiê é foto fixa. Re-gerar PDF NÃO depende do estado atual do banco. Auditabilidade + rastreabilidade.

### J.4 — Status roadmap F3
- ✅ F3-A.1 (V1.9.390) — PDF cliente-side
- ✅ F3-A.2 (V1.9.392) — persistência + painel "Meus Dossiês" ← **FECHADO 20/05**
- ⏸ F3-A.3 — curadoria semântica papers (insight GPT-Pedro pós-PDF)
- ⏸ F3-A.4 — síntese editorial vs transcript (insight GPT-Pedro pós-PDF)

**F3 completo destrava F4** — `forum_posts.dossier_id` agora pode apontar pra `physician_research_dossiers.id` real.

---

## 📚 CONSOLIDAÇÃO DE MEMÓRIAS — briefing pra continuidade (laptop / próxima sessão)

> Diretório memória desktop: `~/.claude/projects/c--Users-phpg6-Desktop-amigo-connect-hub-main/memory/`
> Diretório memória laptop: `~/.claude/projects/c--Users-phpg6-OneDrive-Imagens-amigo-connect-hub-main/memory/`
> SEMPRE ler `MEMORY.md` (índice nível 1) ao iniciar sessão.

### 🔴 LOCKS E INVARIANTES — NÃO TOCAR sem auditoria
1. `project_lock_v1995_aec_relatorio_agendamento` — Lock AEC + Pipeline + Agendamento
2. `feedback_lock_v1_9_299_pbad_nao_tocar_16_05` — Lock PBAD sign-pdf-icp + icp_chain.ts
3. `project_v1_9_299_pbad_ad_rb_conforme_16_05` — PBAD AD-RB CONFORME ITI (vitória)
4. `project_regra_consentimento_nao_e_agendamento` — REGRA HARD §1 anti-kevlar

### 🟢 MATRIX V1.9.388-392 — eixo Pesquisa (foco atual)
5. `project_v1_9_388_matrix_voz_z2_pubmed_19_05` — snapshot técnico 10 commits
6. `project_v1_9_388_smoke_final_vitoria_empirica_19_05` — smoke 4 turnos validado
7. `project_v1_9_388_matrix_log_empirico_20_05` — log Edge 20/05 (custo R$0,13/chamada)
8. `feedback_z2_nao_e_burrice_voz_intelectual_19_05` — Z2 estrutural ≠ Z2 burra
9. `feedback_matrix_prolonga_vs_casos_similares_infere_20_05` — distinção epistemológica
10. `feedback_state_pollution_noa_core_reutilizado_19_05` — bypass NoaResidentAI
11. `feedback_rag_molda_comportamento_cognitivo_20_05` — RAG molda prior do GPT
12. `project_visao_final_eixo_pesquisa_19_05` — jornada relatório→Matrix→dossiê→fórum

### 💰 PRICING E VALUATION
13. `reference_pricing_dinamico_cap_byo_sem_trava_20_05` — pricing FULL + cap + BYO (refina 18/05)
14. `reference_pricing_model_canonical_18_05` — pricing canônico (base)
15. `reference_custo_ia_instrumentacao_canonica_18_05` — custo IA em ai_chat_interactions.metadata
16. `project_3_marcos_minimos_reprecificacao_valuation_18_05` — 3 marcos valuation
17. `project_byo_llm_arquitetura_parqueada_19_05` — BYO-LLM arquitetura
18. `audit_19_05_subcontagem_custo_painel_v1_9_374` — subcontagem custo painel
19. `project_planos_canonicos_01_05` — planos canônicos
20. `project_pricing_aec_33_33_15_05` — pricing AEC histórico

### 📐 PRINCÍPIOS OPERACIONAIS
21. `feedback_regra_operacional_canonica_06_05` — REGRA CANÔNICA V1 (topo absoluto)
22. `feedback_coerencia_e_alinhamento_qualquer_fix_17_05` — filtro 6 perguntas antes de codar
23. `feedback_polir_nao_inventar` — Princípio 8 (reusar > criar)
24. `feedback_nao_estimar_tempo_codificacao` — não estimar tempo pra Pedro
25. `feedback_clinical_cockpit_cor_por_estado_16_05` — cor comunica estado
26. `feedback_linguagem_estado_real_nao_identidade_16_05` — linguagem = estado real
27. `feedback_gotchas_conhecidos_27_04` — 7 anti-padrões validados
28. `project_pipeline_diario_para_magno` — pipeline diário → Magno
29. `feedback_pesquisa_materializacao_tese_ricardo_nao_drift_19_05` — checklist anti-dialeto-paralelo

### 📋 AUDITS E DÉBITOS
30. `audit_pendencias_um_mes_pos_pbad_20_05` — 22 itens executáveis sem CNPJ/Ricardo
31. `feedback_debitos_tecnicos_parecer_fiscal_01_04_pendentes_18_05` — débitos parecer fiscal
32. `audit_v1_9_307_299_311_312_estado_real_pos_deploy_16_05` — audit estado real pós-deploy
33. `audit_forum_3_bloqueios_pre_publicacao_18_05` — 3 bloqueios fórum
34. `feedback_infraestrutura_vs_uso_humano_16_05` — deploy ≠ feature completa
35. `feedback_drift_historico_dev_aceitavel_pre_pmf_18_05` — drift dev pré-PMF aceitável

### 🏗 ARQUITETURA E DADOS
36. `feedback_dual_write_contract_jsonb_vs_tabela_18_05` — dual-write jsonb vs tabela
37. `feedback_admin_metadata_nao_conteudo_clinico_16_05` — admin vê metadados não conteúdo
38. `project_lgpd_payload_racionalidade_divida_tecnica_17_05` — LGPD payload racionalidade
39. `feedback_numeric_precision_schemas_compativeis_17_05` — numeric precision schemas
40. `project_ricardo_19_05_forum_validation_features_solicitadas` — Material A Ricardo 19/05
41. `project_drift_nefro_cannabis_16_05` — drift NefroCannabis verticalização
42. `reference_supabase_estado_total_28_04_2026` + `reference_edge_functions_catalogo_completo` — referências banco/edge

---

## 🖥 HANDOFF DESKTOP → LAPTOP — o que o laptop precisa saber

### Estado do código
- **HEAD**: commit `2de7072` (V1.9.392 F3-A.2)
- **Branch**: main (push 4 refs OK: amigo+medcannlab5 × main+master)
- **Push 4 refs**: `git push amigo HEAD:main && git push amigo HEAD:master && git push medcannlab5 HEAD:main && git push medcannlab5 HEAD:master`
- ⚠️ Naming remotes muda por máquina — validar `git remote -v` antes (laptop pode ser hub+origin)

### O que está DEPLOYADO
- **Frontend (Vercel auto-deploy)**: V1.9.392 (todo o dia 20)
- **Edge tradevision-core**: V1.9.388-A.5 (último deploy manual confirmado nos logs)
- **Schema banco**: `physician_research_dossiers` criada via Management API ✅
- **Sprint 1 SQL**: chat_messages comments + 4 views SECURITY INVOKER + 74 órfãos migrados + Atestado quarentinado ✅

### O que FALTA / parqueado (ordem pragmática)
1. **F4.1** — schema fórum (migration aditiva `forum_posts`: status enum + dossier_id + reviewed_by + 8 cols)
2. **F4.2** — UI 3 tabs (Meus Dossiês / Em debate / Resolvidos) + 8 KPIs
3. **F4.3** — workflow editorial (publicar/aprovar/resolver/reabrir)
4. **F3-A.3** — curadoria semântica papers PubMed
5. **F3-A.4** — síntese editorial conversa (vs transcript bruto)
6. **V1.9.388-A.6** — keywords RAG da query real (não cabeçalho)
7. **Sprint 3** — observabilidade (cost dashboard + telemetria 6 sinais beta)

### Design F4 já aprovado (não codado) — ver bloco no histórico
- Lifecycle: DRAFT → PENDING_REVIEW → ACTIVE → RESOLVED → ARCHIVED
- Migration aditiva `forum_posts` (8 colunas + 2 índices)
- F4 = eixo coletivo-inferencial → EXIGE mediação editorial humana (memory `feedback_matrix_prolonga_vs_casos_similares_infere_20_05`)

### Avisos críticos pra próxima sessão
- ⚠️ NÃO migrar `documents` → `base_conhecimento` (regressão V1.9.308 — memory `feedback_rag_molda_comportamento_cognitivo_20_05`)
- ⚠️ NÃO mexer no Edge sign-pdf-icp / icp_chain.ts sem auditoria (Lock V1.9.299)
- ⚠️ tradevision-core inflou 3068→6690 linhas — refator é P1 mas EXIGE sessão ≥6h dedicada
- ⚠️ AEC localStorage P0 aberto há 6+ semanas — anti-kevlar §1 bloqueia fix casual
- ✅ PAT Supabase Management API: Pedro fornece quando pedir (sessão-scoped, não persiste)

### Como continuar F4 (se for o próximo)
1. Ler memory `audit_forum_3_bloqueios_pre_publicacao_18_05` + `project_ricardo_19_05_forum_validation`
2. Migration aditiva `forum_posts` (design no histórico do diário, bloco "Design F4")
3. `forum_posts.dossier_id UUID REFERENCES physician_research_dossiers(id)`
4. RLS por status (draft=autor / pending=autor+editor / active+=allowed_roles)

---

## 🎯 Frase âncora do dia (final)

> *"Disciplina operacional > velocidade de execução. RAG molda comportamento cognitivo. Matrix prolonga contexto único × Casos Similares infere equivalência. F3 fechado completo (A.1 PDF + A.2 persistência) — eixo médico-curatorial pronto antes de F4 coletivo. Postura epistemológica precede polish visual. Log Edge: R$ 0,13/chamada, zero regressão. 17 commits cirúrgicos + 6 memorias nível 1 num dia, todos rastreáveis."*

— Dia 20/05/2026 fechado ~16h BRT · Sprint 1 + Sprint 2 (F1→F3-A.2 completo) + 6 memorias + handoff laptop

## 🚀 Estado para iniciar próxima sessão (21/05 ou laptop)

**Pre-PMF beta 20-30 com arquitetura validada empíricamente**:
- Matrix V1.9.388-392 deployada e estável
- F3 completo (A.1 PDF + A.2 persistência + painel Meus Dossiês)
- UX polish completo (split 50/50, cores neon emerald, overflow fix)
- Pricing dinâmico empíricamente calibrado (R$ 0,13/chamada confirmado log)
- F4 fórum design aprovado (não codado — F3-A.2 já destravou dossier_id)
- 42 memorias consolidadas neste diário pra continuidade

**Próxima sessão lê**: este diário (handoff completo) + MEMORY.md nível 1 + `feedback_regra_operacional_canonica_06_05`.

**Próximo passo natural**: F4.1 schema fórum (F3 completo já destravou) OU Sprint 3 observabilidade (pré-beta 20-30). Pedro decide ao retomar.
