# POP-PRJ-002 — Processo de Desenvolvimento de Software Médico

**Versão draft:** 0.1 (29/05/2026)
**Status:** DRAFT pré-consultora SaMD
**Referência normativa:** ISO 13485:2016 §7.3 + IEC 62304:2006 §5

---

## 1. Modelo de processo adotado

**Modelo Evolucionário com Selagem Incremental** (cristalizado como Pipeline Diário → Magno):

```
HIPÓTESE → EXPERIMENTO → VALIDAÇÃO → CRISTALIZAÇÃO
(diário)   (sprint)      (uso real)   (Livro Magno)
```

Cada camada do pipeline corresponde a uma fase ISO 13485 §7.3:

| Pipeline interno | ISO 13485 §7.3 | Evidência |
|---|---|---|
| Hipótese (diário) | §7.3.2 Planejamento | DIARIO_*.md (28+ arquivos) |
| Experimento (sprint) | §7.3.3 Entradas | Memórias `project_*` (~120 arquivos) |
| Validação (uso real) | §7.3.6 Verificação | Smoke PAT + clinical_qa_runs |
| Cristalização (Magno) | §7.3.7 Revisão | LIVRO_MAGNO_V*.md (6 versões) |

## 2. Entradas de desenvolvimento (§7.3.3)

### 2.1. Necessidades clínicas (Ricardo Valença — criador método AEC)

- Implementar método AEC (Arte da Entrevista Clínica) em fluxo conversacional digital
- Garantir verbatim em fases hard-lock (V1.9.86 Verbatim First — ~46% bypass GPT)
- Manter médico no loop em TODAS as decisões terapêuticas (lock V1.9.388-A.3)

### 2.2. Necessidades regulatórias

- LGPD Art. 11 (dado sensível de saúde) → V1.9.452 sanitize PII
- CFM 2.314 (telemedicina) → permite paciente externo offline cadastrado pelo médico (memória `feedback_padrao_orfaos_public_users_validos_29_05`)
- CFM 2.381 (prescrição digital) → ICP-Brasil PBAD AD-RB CONFORME ITI (V1.9.299)
- Resolução ANVISA RDC 327/2019 + 660/2022 (cannabis medicinal) → suporte a CBD

### 2.3. Necessidades operacionais

- Suporte multi-eixo: Clínica + Ensino + Pesquisa
- Suporte multi-papel: Admin + Profissional + Paciente + Aluno
- Tempo de resposta IA aceitável: P50 < 5s, P95 < 12s

### 2.4. Restrições explícitas

- **NÃO** prescrever autonomamente (lock V1.9.388-A.3)
- **NÃO** assinar PDF sem cert ICP-Brasil válida (lock V1.9.299)
- **NÃO** completar AEC sem consentimento explícito (REGRA HARD §1)

## 3. Saídas de desenvolvimento (§7.3.4)

### 3.1. Código-fonte

- **Frontend**: React + TypeScript + Vite, ~3.500 linhas em `src/`
- **Backend**: Supabase Edge Functions Deno, 15 funções ativas
- **Database**: Supabase Postgres, 144 tabelas com RLS 100%
- **Migrations**: `supabase/migrations/*.sql` versionadas

### 3.2. Documentação técnica

- **CLAUDE.md** — pirâmide governança 8 camadas
- **DIARIO_*.md** — 66 diários técnicos
- **LIVRO_MAGNO_V*.md** — 6 versões da Constituição
- **memory/*.md** — 284 lessons learned cristalizadas

### 3.3. Telemetria operacional

- `ai_chat_interactions` (instrumentação V1.9.238 desde 13/05/2026)
- `clinical_qa_runs` (framework PMF Audit Memo 28/04)
- `cognitive_events` (audit trail completo)
- `cofen_audit_log` (audit LGPD)

## 4. Revisão de desenvolvimento (§7.3.5)

### 4.1. Revisões obrigatórias

- **Pré-commit**: type-check `npx tsc --noEmit` + secretlint
- **Pré-push**: testes Vitest (quando aplicável)
- **Pré-merge main**: revisão por co-author humano (Pedro)
- **Pré-selagem lock**: validação empírica multi-camada (smoke PAT + UI + memória cristalizada)

### 4.2. Revisões clínicas obrigatórias

- **Toda mudança Nível 3+** (POP-CTL-007 §3.3) requer validação Ricardo Valença
- **Toda mudança constitucional** requer consenso Tech Lead + Médico Sócio

## 5. Verificação de desenvolvimento (§7.3.6)

### 5.1. Tipos de verificação

1. **Type-check** TypeScript estático
2. **Smoke PAT** via Supabase Management API
3. **Smoke ITI** validar.iti.gov.br pra PDFs assinados
4. **Smoke UI** flagrado por Pedro/Ricardo antes de paciente externo
5. **clinical_qa_runs** com 17 colunas estruturadas (verdict + green_facts + red_blindspots + etc)

### 5.2. Critério de "pronto" (Definition of Done)

Uma feature está pronta quando:

- [ ] Type-check passou (EXIT=0)
- [ ] Smoke PAT validado se mexer no banco
- [ ] Smoke UI flagrado pelo menos uma vez
- [ ] Diário documenta com Bloco dedicado
- [ ] Memória cristalizada se princípio reusável (Nível 1 se meta)
- [ ] Push 4 refs OK
- [ ] CLAUDE.md atualizado se mudar pirâmide / locks / RACI

## 6. Validação de desenvolvimento (§7.3.7)

### 6.1. Validação clínica

- **Auto-validação interna**: Ricardo + Eduardo + Pedro usando empíricamente (validação parcial, vide RSK-001 H1)
- **Validação externa pendente**: Marco 2 (1º paciente externo pagante) — gatilho gold

### 6.2. Validação regulatória

- **Pré-CNPJ**: drafts SGQ (este documento)
- **Pós-CNPJ**: revisão consultora SaMD + assinatura RT habilitado
- **Pós-Marco 2**: validação clínica documental ISO 13485 §7.3.7

## 7. Controle de alterações de projeto (§7.3.9)

Detalhado em [POP-CTL-007 Controle de Mudanças](./02_POP-CTL-007_Controle_de_Mudancas.md).

## 8. Métricas operacionais empíricas (último mês)

| Métrica | Valor |
|---|---:|
| Commits totais 30d | 649 |
| Linhas TypeScript adicionadas | +3.500 (29/05 apenas) |
| Edge Functions deployadas 30d | ~15 deploys |
| Cron jobs success rate 7d | 100% (2.023 runs) |
| Tipos de validação por mudança | 5 (TC + PAT + UI + Diário + Memória) |
| Cadência hotfix emergencial | 1 (V1.9.500-A em 30d) |

## 9. Capacidade de processo (preparação Marco 4)

A cadência atual demonstra **maturidade processual aderente ISO 13485** com gaps formais identificados:

✅ **Conformes:**
- Versionamento disciplinado V1.9.X
- Locks selados pra estabilidade
- Documentação técnica densa (diários + memórias + Magno)
- Smoke empírico antes de cada selagem
- Telemetria operacional ativa

❌ **Gaps pra fechar pré-submissão:**
- RT habilitado assinante
- Revisão formal consultora SaMD
- Plano de Validação Clínica formal (POP-VAL-001 em draft)
- Auditoria interna documentada (POP-QAS-001 em draft)
- Manual SGQ formal (MAN-SGQ-001 em draft)

---

**Aprovação:**
- [ ] RT habilitado: ________________ Data: ___/___/___
- [ ] Consultora SaMD: ________________ Data: ___/___/___
- [ ] Tech Lead: Pedro Henrique Passos Galluf — Data: 29/05/2026 (draft)
