# Checklist consolidado — Avanços + Riscos pós-reunião 05/06/2026

**Data**: 05/06/2026 noite (pós-jantar Pedro + Ricardo + João Vidal)
**Origem**: análise integral de 2 trechos da gravação do jantar + audit empírico via PAT do banco + audit codebase + cristalização de 9 memórias + DIARIO PARTE 3

---

## ✅ 18 AVANÇOS CRAVADOS NA REUNIÃO

| # | Avanço | Origem | Status |
|---|---|---|---|
| 1 | **Marco 1 CNPJ ganhou DATA D = quarta 10/06/2026** | Decisão mesa | Confirmado |
| 2 | **Pix R$ 350/sócio** cravado (R$ 1400 / 4) | Decisão mesa | Confirmado |
| 3 | Caixa empírico declarado (Pedro R$ 700 / Ricardo R$ 700 / João R$ 300+) | Declaração mesa | Confirmado |
| 4 | **Pricing R$ 122 × 70k = R$ 8.54M GMV** âncora Sociedade Nefrologia | Cravado Ricardo | Confirmado |
| 5 | **3ª vertente Constituição** — segurança paciente / gestão risco semântica pré-doença | Cravado Ricardo | Confirmado |
| 6 | **4ª vertente Constituição** — remissão DRC inflamatória (outcome) | Cravado Ricardo | Confirmado |
| 7 | Mapa farmacológico DRC × cannabis (CBG/CBD/THC/NSAIDs) cravado | Cravado Ricardo | Confirmado |
| 8 | **80% DM+HAS = DRC G5** (subgrupo dominante anchor) | Cravado Ricardo | Confirmado |
| 9 | Estágios precoces 1-3 = fenótipos (cálculo/IRA repetição/dor lombar/disúria) | Cravado Ricardo | Confirmado |
| 10 | "Quarta-feira com os alunos" formato escala (30→1000) | Arquitetado João | Confirmado |
| 11 | Crítica modelo atenção atual = "sistema suave de resolução" | Cravado Ricardo | Confirmado |
| 12 | Rio Bonito vetor regional tracionando | Cravado Ricardo | Confirmado |
| 13 | **Artigo Tangri 2026 confirmado** peer-reviewed Kidney International Vol 109 Jan/2026 | Audit PAT + WebSearch | Confirmado |
| 14 | Corpus científico Ricardo identificado (**139 PDFs storage / 43 indexados / 5 RAG curado**) | Audit PAT | Confirmado |
| 15 | Conexão **Cidade Amiga dos Rins** estrutural (4 protocolos + 2 páginas + pitch CARD-RJ + página institucional PARQUEADA) | Audit codebase | Confirmado |
| 16 | Gap indexação revelado: **103 PDFs órfãos (74%)** | Audit PAT | Confirmado |
| 17 | Gap curso Ricardo identificado (Eduardo SIM `CursoEduardoFaveret.tsx` / Ricardo NÃO) | Audit codebase | Confirmado |
| 18 | Plano técnico Matrix Z2 escalonado A→B→C mapeado | Análise técnica | Cristalizado |

---

## 🟡 11 ITENS ATACÁVEIS (sem decisão humana hard)

| # | Item | Quando | Esforço | Risco | Memória/Lock |
|---|---|---|---|---|---|
| 1 | Smoke manual V1.9.598 (anti-órfão Fluxo A) / V1.9.601 (UUID singleton) / V1.9.603 (type EN/PT) | Pedro testa quando puder | ~30min | ZERO | (já testes pendentes) |
| 2 | **Fase A.1 Matrix Z2** — indexar 103 órfãos em `public.documents` | Esta semana | ~3-4h | BAIXO (read-only cognitivo) | `project_matrix_z2_escalonamento_rag_papers_fases_a_b_c_05_06` |
| 3 | **Fase A.2 Matrix Z2** — anchor citação UI passiva (frontend puro) | Esta semana | ~3-4h | ZERO | mesmo memória |
| 4 | Documento institucional "Camada Cognitiva CAR Digital — Matrix Z2 + Sidecar Renal + Constituição = segurança paciente" | Esta semana | ~1-2h | ZERO | `feedback_ricardo_quer_integrar_seguranca_paciente_gestao_risco_05_06` |
| 5 | Curadoria cohort 43 reports REAIS pra pitch Sociedade Nefrologia (sanitizado 0 PII) | Esta semana | ~2-3h | BAIXO | `project_modelo_pricing_ricardo_122_relatorio_70k_drc_05_06` |
| 6 | Item 6 BLOCO 12 — padrão visual 2 dashboards (AlunoDashboard + TeamManagement) | Esta semana | ~3-4h | BAIXO (pattern cristalizado V1.9.538-544) | `reference_padrao_visual_app_translucent_emerald_max_w_screen_2xl_31_05` |
| 7 | Item 9 BLOCO 12 — promover SGQ pra auditor-ready | Esta semana | ~4-6h | BAIXO (documental) | `MEDCANNLAB_SGQ_INDICE_AUDITOR_27_05.md` |
| 8 | 2ª `clinical_qa_runs` cravando cadência mínima | Esta semana | ~1-2h | ZERO | CLAUDE.md §Cadência mínima clinical_qa_runs |
| 9 | Plano técnico detalhado Fase B Matrix Z2 (function calling + slug-test) | Próxima sessão | ~prep 1h | ZERO (apenas docs) | mesmo memória |
| 10 | Repactuar milestones `renal-medcannlab` STALE (Nov/2025-Jan/2026) | Próxima conversa Ricardo | conversa | — | `project_intersecao_renal_cannabis_eduardo_ricardo_4_protocolos_05_06` |
| 11 | Pitch CARD-RJ atualização: citar Tangri 2026 como anchor científico canônico | Esta semana | ~1-2h | BAIXO | `INVESTMENT_KIT/pitch_prefeitura_rj_top_master_14_05.md` |

---

## ❌ 11 ITENS BLOQUEADOS por Marco humano

| # | Item | Bloqueio | Marco destrava |
|---|---|---|---|
| 1 | Stripe + nota fiscal + cobrança R$ 122 efetiva | CNPJ | Marco 1 (10/06) |
| 2 | Subscription_plans ativos | CNPJ | Marco 1 |
| 3 | Reativar 3 botões `CidadeAmigaDosRinsInstitucional` (Investir/Aderir/Apresentar) | CNPJ | Marco 1 |
| 4 | Cohort 20-30 pagantes externos reais | 2º médico independente | Marco 2 |
| 5 | **Fase C Matrix Z2** (papers em `base_conhecimento_papers`) | demanda empírica + Marco 2 | Marco 2 |
| 6 | Pitch CARD-RJ Prefeitura agendamento | João articular | João Vidal |
| 7 | Contrato comunicação 70k pessoas (mídia/TV/governo) | João articular | João Vidal |
| 8 | Manual v1.1 Eduardo (conteúdo curso Cannabis Medicinal populado) | Eduardo entregar | Marco 3 |
| 9 | Curso Ricardo `CursoRicardoValenca.tsx` | GO Ricardo + Manual v1.1 OR autorização adaptar protocolos CAR | Ricardo + Marco 3 |
| 10 | WiseCare HOMOLOG → PROD | Decisão Pedro + timing | Pedro |
| 11 | Sidecar Renal expandido pra sintomas precoces (cálculo/IRA/dor lombar/disúria) | GO Ricardo + slug-test paralelo | Ricardo + sessão dedicada |

---

## 🔴 RISCOS ALTOS (mitigação obrigatória)

| # | Risco | Mitigação | Status |
|---|---|---|---|
| 1 | **PAT `sbp_91883cd43...` EXPOSTO** em commit `090af13` hub, AINDA ativo (auditei 05/06 noite — não foi rotacionado) | Rotacionar AGORA via dashboard Supabase Account → Access Tokens → Revoke | ❌ PENDENTE Pedro |
| 2 | **Anti-overclaim "Tangri 2026 demonstra remissão DRC via cannabis"** (FALSO — paper canônico cita SGLT2i+nsMRA+GLP-1+imuno) | Frase-âncora cravada: *"o paradigma de remissão (Tangri et al, Kidney Int 2026) abre janela conceitual onde nossa proposta original investiga cannabis CBG+CBD como vetor complementar"*. Aplicar em TODO material | ✅ cravado em `project_remissao_drc_inflamatoria_anchor_pesquisa_05_06` |
| 3 | **Anti-overclaim "R$ 8.54M pipeline real"** | Cravar em todo pitch: "vitrine narrativa anchor Sociedade Nefrologia, NÃO previsão de receita Q3-Q4 2026" | ✅ cravado em `project_modelo_pricing_ricardo_122_relatorio_70k_drc_05_06` |
| 4 | **Matrix Z2 alucinação se Fase B/C mal feita** (V1.9.450 já alucinou 6 dados clínicos) | Slug-test paralelo OBRIGATÓRIO + smoke matriz 5 perguntas-armadilha + phase guard AEC | 🟡 mapeado em `project_matrix_z2_escalonamento_rag_papers_fases_a_b_c_05_06` |
| 5 | **Modelo "duplo canal"** (cliente paga relatório + plataforma vende comunicação em paralelo) | Validar com advogado societário/saúde digital pós-Marco 1 (CFM, ANS) | 🟡 pendente Marco 1 |

---

## 🟡 RISCOS MÉDIOS (monitorar)

| # | Risco | Mitigação |
|---|---|---|
| 6 | Curso Ricardo sem GO dele = invasão domínio metodológico | Aguardar autorização + Manual v1.1 |
| 7 | Milestones `renal-medcannlab` STALE (Nov/2025-Jan/2026) | Repactuar próxima conversa Ricardo |
| 8 | **TEZ** não-confirmado (não é CID-11) | Pendente confirmação Ricardo |
| 9 | "Quarta-feira com 1000 alunos" virar promessa sem infra TRL/Manual v1.1 | Anti-overclaim ativo + pré-condições explícitas |
| 10 | 103 órfãos crescem se Fase A demorar | Atacar Fase A esta semana + treinar Ricardo Library UI |
| 11 | Descasamento hub vs origin (commit 090af13 com PAT) | Decisão Pedro (bypass URL / squash / desktop) |
| 12 | "Fernando Bossa" e "Eduardo Rocha" = sem contexto no histórico | Pedro confirmar quem são |
| 13 | "Sr Carlos Valença + Dr Eline" = nomes incertos transcrição (contador/advogado) | Pedro confirmar |
| 14 | Cannabis Exposure During Critical Windows of Development (4 cópias storage) — relevante Eduardo neuro | Curadoria conjunta Eduardo + Ricardo |

---

## 🟢 RISCOS BAIXOS (mapeados, monitorar passivamente)

| # | Risco |
|---|---|
| 15 | Cron `monthly-closing-medcannlab` DORMENTE — não acionar até gamification reativada |
| 16 | Bula como infraestrutura cognitiva (27/05) — manter fronteira respeitada |
| 17 | Dual-write `jsonb` vs `tabela` racionalidades — preservar divergência controlada por design |
| 18 | **Fase D Matrix Z2** (migrar 103 pra base_conhecimento original) — NUNCA atacar |
| 19 | Confusão TRL/Ensino vs Pesquisa/Fórum — escopos diferentes, não misturar |
| 20 | Vetor "atalho GPT lê PDF inteiro" — vigiar e refutar |
| 21 | Profissional UUID hardcoded Ricardo (4 spots Edge) — blocker Marco 3 (Eduardo cria pacientes) |
| 22 | Encryption fallback dev em produção (VITE_ENCRYPTION_KEY) — verificar Vercel env |

---

## Próximas decisões Pedro (ordem de impacto)

### 🔴 DECIDIR AGORA

1. **Rotacionar PAT** `sbp_91883cd43...` (5 min via dashboard) — risco 🔴 #1
2. **Autoriza Fase A esta semana** Matrix Z2 (~6-8h, ZERO risco, indexa 103 órfãos + anchor UI passiva)?

### 🟡 Próximas conversas Pedro+Ricardo

3. TEZ — o que é exatamente? (não é CID-11)
4. Milestones `renal-medcannlab` repactuação (Nov/2025-Jan/2026 STALE)
5. CBG confirmação como anti-inflamatório alternativo
6. Autoriza criar `CursoRicardoValenca.tsx`?
7. Manual v1.1 Ricardo status (existe / em desenvolvimento)?
8. Curadoria papers Fase C — Ricardo hand-crafta summaries OR Claude+revisão Ricardo?

### 🟡 Confirmar contexto

9. Quem são Fernando Bossa e Eduardo Rocha?
10. Nomes corretos do contador + advogado quarta 10/06?

### 🟡 Pra próxima sessão

11. Plano técnico detalhado Fase B Matrix Z2 (function calling + slug-test) — preparo?
12. Fase C Matrix Z2 parqueada explicitamente pós-Marco 2 — confirma?

---

## 9 memórias cristalizadas total na sessão 05/06 noite

1. `project_reuniao_pedro_ricardo_joao_05_06_visao_jantar_marco1_pricing` — MÃE da visão
2. `project_modelo_pricing_ricardo_122_relatorio_70k_drc_05_06` — pricing comercial
3. `feedback_ricardo_quer_integrar_seguranca_paciente_gestao_risco_05_06` — 3ª vertente
4. `project_quarta_feira_com_alunos_formato_escala_ricardo_05_06` — formato escala
5. `project_intersecao_renal_cannabis_eduardo_ricardo_4_protocolos_05_06` — 4 protocolos CAR
6. `reference_mapa_farmacologico_drc_cannabinoides_anti_inflamatorios_05_06` — REFERENCE durável
7. `project_remissao_drc_inflamatoria_anchor_pesquisa_05_06` — 4ª vertente + Tangri 2026 cravado
8. `project_curso_eduardo_pre_criado_ricardo_pendente_05_06` — gap ambiente curso
9. `project_matrix_z2_escalonamento_rag_papers_fases_a_b_c_05_06` — escalonamento Matrix Z2

+ DIARIO_05_06_2026_PARTE_3_POS_JANTAR_VISAO_RICARDO_JOAO.md (~600 linhas)
+ Memória handoff atualizada
+ CHECKLIST_AVANCOS_RISCOS_05_06_POS_REUNIAO.md (este arquivo)
+ MEMORY.md NÍVEL 1 atualizado

---

## Frase ancora

> *"05/06 noite — sessão pós-jantar consolidada: 18 avanços cravados na reunião + 11 itens atacáveis sem decisão humana + 11 itens bloqueados por Marco + 5 riscos altos + 9 médios + 8 baixos. 9 memórias cristalizadas + DIARIO PARTE 3 + este checklist + MEMORY.md NÍVEL 1 atualizado. Matrix Z2 escalonamento A→B→C cravado e conecta com 10/10 blocos reunião sem regressão (locks 8 intocados). Densidade clínica nuclear (CBG/CBD/NSAIDs/remissão Tangri 2026) + pricing R$ 122 × 70k + 3ª+4ª vertentes Constituição emergiram numa só conversa. Próximas decisões Pedro: rotacionar PAT + autorizar Fase A. Top elite escalável sem regressão."*
