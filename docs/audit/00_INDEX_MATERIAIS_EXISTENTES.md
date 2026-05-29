# 📚 AUDITORIA INTEGRAL MEDCANNLAB — Sprint 0: Catálogo de materiais existentes

**Criado**: 28/05/2026 ~20h BRT
**Propósito**: catalogar TUDO que já existe em forma de auditoria/retrospectiva/dossiê ANTES de criar novos docs.
**Princípio cristalizado**: polir-não-inventar (Princípio 8).

---

## ⚠️ Lembrete empírico crítico

**~40% dos usuários do sistema são INTERNOS** (Pedro, Ricardo, Eduardo, João, Carolina, amigos teste).
- Maria das Dores Pinto Pitoco = **única paciente externa real confirmada** (memory `feedback_pacientes_reais_vs_testes_clinical_rationalities_27_05`)
- Qualquer métrica de "uso real" precisa qualificar INTERNO vs EXTERNO sempre
- "94% prescriptions = DRAFT" provavelmente é 100% interno
- 12 dossiês Matrix = 100% internos (Pedro 6 / Ricardo 3 / Eduardo 1 / 2 órfãos)

→ **Sem esse qualificador, auditoria de "uso real" é narrativa sobre nós mesmos.**

---

## 📋 Inventário (28/05/2026)

### A) Auditorias estruturais (18 arquivos)

| Arquivo | Localização | Data | Status |
|---|---|---|---|
| `AUDITORIA_COMPLETA_22_05_2026.md` | raiz | **22/05** ⭐ MAIS RECENTE | 150 linhas — leitura obrigatória Sprint 1 |
| `AUDITORIA_LOVABLE_CROSS_CHECK_25_04_2026.md` | raiz | 25/04 | Cross-check com Lovable |
| `AUDIT_06_05_2026_POS_V1_9_170.md` | raiz | 06/05 | Pós V1.9.170 |
| `AUDITORIA_360_FINAL_25_03_2026.md` | raiz | 25/03 | 360 final ciclo 1 |
| `AUDITORIA_COMPLETA_01_04_2026.md` | raiz | 01/04 | Pós-V1.9.95 lock |
| `AUDITORIA_CRITICA_FINAL.md` | raiz | s/d | Crítica final ciclo |
| `AUDITORIA_MASTER_360_MEDCANNLAB_2026.md` | raiz | s/d (2026) | **735 linhas** — Master 360 |
| `docs/AUDITORIA_360_ENTERPRISE_27-02-2026.md` | docs/ | 27/02 | Enterprise — base original |
| `docs/AUDITORIA_COS_5_0_FINAL.md` | docs/ | s/d | COS Kernel v5.0 |
| `docs/AUDITORIA_MASTER_360_11_04_2026.md` | docs/ | 11/04 | Master 360 abril |
| `docs/AUDITORIA_MASTER_360_12_04_2026.md` | docs/ | 12/04 | Atualização |
| `docs/AUDITORIA_REAL_14_04_2026.md` | docs/ | 14/04 | Real |
| `docs/AUDITORIA_SISTEMICA_PROFUNDA_ABRIL_2026.md` | docs/ | abril | Sistêmica profunda |
| `docs/AUDITORIA_SUPABASE_2025-12-23.md` | docs/ | 23/12/2025 | Supabase dezembro |
| `docs/AUDITORIA_SUPABASE_2026-01-12.md` | docs/ | 12/01 | Supabase janeiro |
| `docs/AUDITORIA_TECNICA_8_CAMADAS_09-02-2026.md` | docs/ | 09/02 | **8 camadas pirâmide** |
| `docs/AUDITORIA_TRIGGERS_HEADER_APP.md` | docs/ | s/d | Triggers + header |
| `docs/AUDITORIA_USABILIDADE_ROTAS_E_FLUXOS.md` | docs/ | s/d | **Rotas + fluxos** (relevante Sprint 3) |

### B) Retrospectivas (1 arquivo, MASSIVO)

| Arquivo | Linhas | Período | Relevância |
|---|---|---|---|
| `RETROSPECTIVA_MENSAL_2026_04_26_a_2026_05_25.md` | **2340** | 30 dias até ontem | 🔥 NÚCLEO — leitura obrigatória todos os sprints |

### C) Dossiês (2 arquivos)

| Arquivo | Linhas | Conteúdo |
|---|---|---|
| `DOSSIE_COMPLETO_MEDCANNLAB_2026.md` | 207 | Dossiê 2026 |
| `docs/DOSSIE_ABSOLUTO_VALIDADO_20-02-2026.md` | s/d | Dossiê absoluto (validado fev/26) |

### D) Diários (65 arquivos só em 2026!)

- 26 diários só em maio
- Cada diário cobre 1 dia de uso real
- Pattern: `DIARIO_DD_MM_2026_DESCRICAO.md`
- ⚠️ **Cuidado**: diários antigos podem ter terminologia desatualizada (ex: drift "3 atos" vs "4 fases" hoje verificado correto)

### E) CLAUDE.md (loaded sempre na sessão)

- Estado atual sistema (sempre atualizado)
- Pirâmide 8 camadas + REGRA HARD §1
- Stack tecnológico
- Backlog priorizado
- Métricas reais (snapshot 27/04)
- Convenções + gotchas
- **Pre-existe — não auditar do zero**

### F) Memorias persistentes (266+ arquivos NÍVEL 1+2+3)

- `~/.claude/projects/.../memory/MEMORY.md` (índice)
- 179 → 266+ memorias acumuladas
- Categorias: project / feedback / reference / user / audit

---

## 🎯 Roadmap Sprint — usando o que JÁ existe

| Sprint | Doc novo | Materiais a reusar | Custo estimado |
|---|---|---|---|
| **Sprint 0** | `00_INDEX` (este) | — | ✅ FEITO |
| **Sprint 1** (DB) | `03_DATABASE_REALITY.md` | AUDITORIA_SUPABASE_*.md + RETROSPECTIVA + PAT empírico | 3-4h |
| **Sprint 2** (Frontend + Security) | `04_FRONTEND_ROUTE_MAP.md` + `05_SECURITY_AND_SECRETS.md` | AUDITORIA_USABILIDADE_ROTAS + AUDITORIA_TRIGGERS_HEADER + PAT + grep | 3-4h |
| **Sprint 3** (Uso real qualificado) | `02_REAL_USER_FLOWS.md` + `08_DRAFT_DROP_OFF_ANALYSIS.md` + `09_UNUSED_ARCHITECTURE.md` | RETROSPECTIVA + DIARIOS + PAT | 4-5h |
| **Sprint 4** (Clínica + filosofia — REQUER RICARDO) | `06_CLINICAL_CONSISTENCY.md` + `07_LONGITUDINALITY_ANALYSIS.md` + `10_PHILOSOPHICAL_DRIFT.md` | DOSSIE + DIARIO_27_05 (Matrix Z2) + memorias princípio | 4-6h dist com Ricardo |
| **Sprint 5** (Consolidação) | `01_SYSTEM_STATE.md` + `11_OPERATIONAL_PRIORITIES.md` + `12_EMPIRICAL_VERDICTS.md` | Outputs 1-4 + CLAUDE.md | 3-4h |

**Total estimado**: 17-23h distribuídos. **NÃO 30h de uma vez.**

---

## 🛡️ Princípios cristalizados aplicados a esta auditoria

1. **Validação empírica via PAT/grep > opinião externa** (memory `feedback_validacao_empirica_screenshot_maior_que_plano_teorico_28_05`)
2. **Anti-overclaim** — adjetivos retóricos descartados, números reais exigidos
3. **Anti-cristalização-prematura** — 5 sprints durante 2-5 sessões em vez de 1 mega-doc 30h
4. **Polir-não-inventar** — 50% do conteúdo dos 12 docs já existe disperso (Princípio 8)
5. **Separação semântica > expansão** (memory `feedback_sistema_tem_contexto_demais_falta_semantica_clinica_28_05`) — organizar o que já temos antes de criar novo
6. **Hierarquia de risco** (cristalizada hoje):
   1. 🔐 Irreversível (PII leak, security)
   2. 🔴 Quebra uso real
   3. 🟡 Atrito de fluxo
   4. ⚫ Estética/arquitetura

---

## 📐 Estrutura de output de cada doc Sprint X

Padrão sugerido:

```markdown
# XX_NOME_DO_DOC — Auditoria DD/MM/2026

## TL;DR (5 bullets, leigo entende)

## Materiais reusados
- AUDITORIA_X (data) → seções W, Y, Z
- DIARIO_X (data) → bloco N
- Memorias: feedback_X, project_Y
- PAT queries: queries SQL específicas executadas

## Achados empíricos (numerados)
### Achado 1: <título>
- Evidência (PAT/grep/leitura)
- Estado atual
- Impacto (qualificador interno/externo)
- Severidade (🔐🔴🟡⚫)
- Recomendação

### Achado N: ...

## Comparação histórica
| Tópico | Auditoria anterior (data) | Hoje | Delta |

## Hierarquia de risco
1. 🔐 Irreversíveis: ...
2. 🔴 Quebram uso: ...
3. 🟡 Atrito: ...
4. ⚫ Polish: ...

## Pendências pra próximo sprint
```

---

## 🚦 Próxima ação (Sprint 1)

**Decisão Pedro**:
- (A) Começar Sprint 1 (DATABASE_REALITY) AGORA (~3-4h, mas sessão já está densa)
- (B) Parquear pra próxima sessão amanhã com cabeça fresca
- (C) Continuar lendo materiais existentes hoje (reading-only, sem produção)

Recomendação minha (anti-overclaim): **(B)**.
Você fez 13 commits hoje. Sprint 1 elite empírico via PAT exige cabeça fresca.
