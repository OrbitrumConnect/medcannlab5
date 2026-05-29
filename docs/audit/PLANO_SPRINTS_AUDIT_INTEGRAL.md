# 🧭 Plano dos Sprints — Auditoria Integral MedCannLab

**Criado**: 28/05/2026 ~20h BRT (sessão tarde-noite densa)
**Baseado em**: proposta GPT externo + 18 auditorias históricas + retrospectiva mensal + 26 diários maio + memorias NÍVEL 1 cristalizadas
**Princípios aplicados**: polir-não-inventar / anti-cristalização-prematura / anti-overclaim / hierarquia de risco

---

## ✅ Sprint 0 — Catalogação (FEITO 28/05 noite)

| Output | Arquivo | Status |
|---|---|---|
| Catálogo materiais existentes | `00_INDEX_MATERIAIS_EXISTENTES.md` | ✅ |
| Síntese estado atual + delta 22/05→28/05 | `01_SYSTEM_STATE_28_05_2026.md` | ✅ |

**Aprendizado Sprint 0**: 18 auditorias históricas + retrospectiva 2340 linhas + 26 diários maio = **~30-50% do conteúdo dos 12 docs propostos já existe disperso**. Princípio 8 (polir-não-inventar) economiza ~10-15h de re-trabalho.

---

## 🟡 Sprint 1 — DATABASE_REALITY (próxima sessão, cabeça fresca)

**Custo estimado**: 3-4h.
**Pré-requisito**: PAT ativo (ou rotação prévia).

### Output esperado
- `03_DATABASE_REALITY.md`
- `09_UNUSED_ARCHITECTURE.md`

### Escopo
1. **Catálogo tabelas 140** — uma a uma com rows + última atividade (created_at MAX)
2. **Drift `auth.users` ↔ `public.users`** — investigar 6 órfãos novos descobertos hoje em SS01
3. **Migrations vs schema real** — `supabase/migrations/` deve bater com `pg_catalog`. Listar drift
4. **Tabelas órfãs (0 rows + sem write em 30d)** — candidatas a drop
5. **Tabelas vivas (>100 rows)** — qualificar interno vs externo
6. **Foreign keys quebradas/ausentes** — `pg_constraint`
7. **Triggers** — total + invocações recentes + duplicações
8. **RLS policies redundantes** — políticas conflitantes
9. **Indexes faltando** — queries lentas via `pg_stat_statements`
10. **Edge functions** — invocations 30d + última execução

### Materiais a reusar
- `AUDITORIA_SUPABASE_2025-12-23.md`
- `AUDITORIA_SUPABASE_2026-01-12.md`
- `AUDITORIA_COMPLETA_22_05_2026.md` §1
- `RETROSPECTIVA_MENSAL_2026_04_26_a_2026_05_25.md` — seção banco

---

## 🟡 Sprint 2 — FRONTEND + SECURITY (próximas 2-3 sessões)

**Custo estimado**: 3-4h.

### Output esperado
- `04_FRONTEND_ROUTE_MAP.md`
- `05_SECURITY_AND_SECRETS.md`

### Escopo Frontend
1. **Rotas reais via App.tsx** — todas as `<Route>`
2. **Rotas órfãs** — `path="X"` sem componente real OR componente sem mount
3. **Imports zombie** — components importados mas não-renderizados
4. **Páginas sem mount** — arquivos `src/pages/*` não-roteados
5. **Componentes "ghost"** — declarados mas nunca renderizados (grep cruzado)
6. **Fluxo de navegação real** — botão → link → rota → componente → action

### Escopo Security
1. **PATs ativos** — quantos / quando vencem
2. **Secrets hardcoded** — busca `secretlint` cross com grep
3. **Service_role leaks** — busca de chave anon vs service
4. **Buckets públicos** — listar todos com `public=true`
5. **Uploads irrestritos** — políticas Storage
6. **MFA** — habilitado / quantos users com 2FA
7. **Auth permissiva** — `verify_jwt:false` em Edges (já flagged em 22/05)
8. **Bypass RLS conhecido** — UUIDs hardcoded em policies (já flagged: Ricardo + Eduardo + Pedro admin)
9. **Logs sensíveis** — busca por `console.log` com PII

### Materiais a reusar
- `AUDITORIA_360_ENTERPRISE_27-02-2026.md`
- `AUDITORIA_TRIGGERS_HEADER_APP.md`
- `AUDITORIA_USABILIDADE_ROTAS_E_FLUXOS.md`
- `AUDITORIA_COMPLETA_22_05_2026.md` §3

---

## 🟠 Sprint 3 — USO REAL QUALIFICADO (interno vs externo)

**Custo estimado**: 4-5h.
**A parte mais importante** — segundo GPT externo + cristalizado hoje.

### Output esperado
- `02_REAL_USER_FLOWS.md`
- `08_DRAFT_DROP_OFF_ANALYSIS.md`
- Pode ser combinado em 1 doc

### Escopo
1. **Catálogo de usuários** — quem é interno (Pedro/Ricardo/Eduardo/João/Carolina + amigos) vs externo
2. **Métricas por categoria** — sempre qualificar
   - X AECs / 30d **interno**: N · **externo**: M
   - Y reports assinados **interno**: N · **externo**: M
   - Etc
3. **94% prescrições DRAFT** (descoberta 22/05) — quem rascunhou? Interno ou externo?
4. **Funil empírico**: entrada → AEC → relatório → prescrição → assinatura → entrega → retorno
5. **Onde os usuários PARAM**:
   - AECs em INTERRUPTED há > 7d (não-retomadas)
   - Reports gerados mas não-shared
   - Prescrições draft há > 14d
   - Dossiês órfãos
6. **Edge function invocations** vs callers reais frontend
7. **Tabelas vazias** = features especulativas

### Materiais a reusar
- `RETROSPECTIVA_MENSAL_2026_04_26_a_2026_05_25.md` ⭐ NÚCLEO
- 26 diários maio
- `feedback_pacientes_reais_vs_testes_clinical_rationalities_27_05` memory
- `AUDITORIA_COMPLETA_22_05_2026.md` §5 (taxonomia aliveness)

---

## 🔴 Sprint 4 — CLÍNICA + LONGITUDINALIDADE + FILOSOFIA

**REQUER PARTICIPAÇÃO RICARDO** — não pode ser eu sozinho.

**Custo estimado**: 4-6h distribuídos (não-sessão única).

### Output esperado
- `06_CLINICAL_CONSISTENCY.md`
- `07_LONGITUDINALITY_ANALYSIS.md`
- `10_PHILOSOPHICAL_DRIFT.md`

### Escopo
1. **Sistema contradiz princípios clínicos?**
   - Z2 (compressão estrutural permitida vs abstração clínica proibida — cristalizado 27/05)
   - Verbatim First V1.9.86 (46% bypass GPT)
   - IMRE (motor exponencial)
   - AEC Gate V1.5 (REGRA HARD §1)
   - Lock V1.9.388-A.3 (institucional regulatório)
2. **Onde sistema SUGERE / CONCLUI / MEDICALIZA demais**:
   - Smoke V1.9.468-A 9 turnos prolongados (Ricardo audit Bloco I DIARIO_27_05)
   - Output Matrix avaliado (28/05 hoje smoke PASS)
3. **Onde sistema PRESERVA humanidade**:
   - Pseudonimização Z2 V1.9.384
   - Atrito intencional (cards desmarcados default)
   - Disclaimer "Estruturação a partir do corpus marcado"
   - Devolução interpretação ao médico
4. **Longitudinalidade real**:
   - usePatientLongitudinal V1.9.382 (já existe — descoberta hoje)
   - Carolina #A41C: 39 reports + 2 dossiês + 1 FOLLOW_UP = paciente com continuidade real
   - Maria Pinto: 1 report + 1 FOLLOW_UP = mínima
   - Gilda: 0 reports + 2 notes appointments = caso especial
   - **Quantos pacientes têm continuidade > 3 eventos?**
5. **Drift filosófico**:
   - O app ainda parece o que vocês queriam construir?
   - Risco: virou SaaS genérico / chatbot médico / dashboard de features?
   - Frase âncora Ricardo: "AEC é porta, prontuário longitudinal é memória viva"

### Materiais a reusar
- `DIARIO_27_05_2026_MATRIX_Z2_BULA_E_LOCKS_ANTI_DRIFT.md`
- `DIARIO_28_05_2026_SIDECARS_COGNITIVOS_E_STACK_COMPLETO.md`
- 6 Livros Magno
- Memorias princípios (Z2 / fronteira info farmacológica / compressão estrutural / sistema tem contexto demais / etc)

### ⚠️ Triggers pra desparquear Sprint 4
- Ricardo aceitar agendar 2-4h dist
- OR Pedro+Ricardo numa sessão laptop juntos
- Sem isso, não tente fazer sozinho (anti-overclaim Babylon)

---

## 🟢 Sprint 5 — CONSOLIDAÇÃO + VEREDITOS

**Custo estimado**: 3-4h.

### Output esperado
- `11_OPERATIONAL_PRIORITIES.md`
- `12_EMPIRICAL_VERDICTS.md`
- Versão FINAL de `01_SYSTEM_STATE.md`

### Escopo
1. **Hierarquia consolidada de risco** (cross todos os sprints):
   - 🔐 Irreversíveis
   - 🔴 Quebra uso real
   - 🟡 Atrito fluxo
   - ⚫ Polish
2. **TOP 10 ações prioritárias** dos próximos 30 dias
3. **TOP 5 features pra MATAR** (não usadas + custo manutenção)
4. **TOP 5 features pra MANTER** (uso real + valor clínico)
5. **Vereditos por dimensão**:
   - Saúde técnica
   - Saúde clínica
   - Saúde regulatória
   - Saúde de fluxo
   - Saúde filosófica
6. **Resposta à pergunta brutal**: "O que o MedCannLab É hoje, empíricamente?"

### Materiais
- Outputs Sprints 1-4
- CLAUDE.md final
- Estado MEMORY.md final

---

## 📋 Estimativa total

- Sprint 0: ✅ feito (~30min Pedro + ~1h Claude PAT)
- Sprint 1: 3-4h
- Sprint 2: 3-4h
- Sprint 3: 4-5h
- Sprint 4: 4-6h dist com Ricardo
- Sprint 5: 3-4h

**Total**: ~17-23h distribuídos em 4-6 sessões + uma com Ricardo.

**vs proposta original GPT externo** (12 docs de uma vez): ~30-40h.
**Economia**: ~30-50% via reuso material existente.

---

## 🎯 Próxima ação (decisão Pedro)

| Opção | Quando | Custo |
|---|---|---|
| **(A) Sprint 1 começar AGORA** | hoje noite (sessão já 6h+) | 3-4h MAIS — risco saturação cognitiva |
| **(B) Sprint 1 amanhã com cabeça fresca** ⭐ recomendado | manhã/tarde 29/05 | 3-4h elite |
| **(C) Parquear tudo pra semana que vem** | quando agenda Ricardo abrir | 0 hoje, perde momentum |

**Recomendação minha (anti-overclaim, cristalizado hoje)**: **(B)**.

Você fez 14 commits hoje, refutou alucinação GPT externo, cristalizou 4 memorias, criou 2 arquivos audit (00_INDEX + 01_SYSTEM_STATE). Sprint 1 vai render mais com cabeça fresca + auditoria empírica via PAT em 3-4h focadas.

---

## Frase âncora do plano

> *"Auditoria integral MedCannLab arrancou 28/05 noite usando 18 docs históricos como base (polir-não-inventar) + delta de 6 dias desde 22/05 + cristalização de princípios meta hoje (anti-overclaim + hierarquia de risco). Estrutura: 5 sprints distribuídos em 4-6 sessões totalizando ~17-23h. Sprint 4 (clínica) REQUER Ricardo — não tentar sozinho. Pergunta brutal a responder em Sprint 5: O que o MedCannLab É hoje empíricamente?"*
