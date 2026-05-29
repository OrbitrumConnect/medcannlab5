# CFG-BASELINE-001 — Baseline Regulatória do Snapshot Documental

**Versão draft:** 0.1 (29/05/2026)
**Status:** DRAFT pré-consultora SaMD
**Referência normativa:** ISO 13485:2016 §7.5.3 + IEC 62304:2006 §8

---

## 1. Objetivo

Congelar formalmente o **snapshot regulatório** sobre o qual a consultora SaMD será contratada para avaliar, evitando ambiguidade sobre "qual versão estamos auditando".

## 2. Snapshot baseline

| Campo | Valor |
|---|---|
| **Versão de produto** | V1.9.502-C |
| **Commit SHA** | `f0aff57` (29/05/2026 ~20h08 BRT) |
| **Tag mais recente do produto** | v1.9.475-card-neuro-embriao (não há tag específica para V1.9.502) |
| **Branch principal** | main |
| **Repos sincronizados** | amigo-connect-hub + medcannlab5 (push 4 refs) |
| **Snapshot data** | 29/05/2026 ~20h10 BRT |
| **Mantenedor** | Pedro Henrique Passos Galluf (passosmir4@gmail.com) |

## 3. Documentos no baseline (16 + 1 consolidado + 10 pastas executivas)

### Bloco SGQ Núcleo (10 drafts)

| # | Documento | Última versão | Caminho |
|---|---|---|---|
| 01 | POP-CTL-001 Controle de Documentos | 0.1 (29/05) | `drafts/01_*` |
| 02 | POP-CTL-007 Controle de Mudanças | 0.1 (29/05) | `drafts/02_*` |
| 03 | PLN-IEC-001 Plano IEC 62304 Classe B | 0.1 (29/05) | `drafts/03_*` |
| 04 | RSK-001 Risk Management ISO 14971 | 0.1 (29/05) | `drafts/04_*` |
| 05 | POP-PRJ-002 Processo de Desenvolvimento | 0.1 (29/05) | `drafts/05_*` |
| 06 | POP-QAS-001 Auditoria Interna | 0.1 (29/05) | `drafts/06_*` |
| 07 | POP-LBL-001 Rotulagem SaMD | 0.1 (29/05) | `drafts/07_*` |
| 08 | PROC-CAPA-001 CAPA | 0.1 (29/05) | `drafts/08_*` |
| 09 | POP-VAL-001 Validação Clínica | 0.1 (29/05) | `drafts/09_*` |
| 10 | MAN-SGQ-001 Manual SGQ | 0.1 (29/05) | `drafts/10_*` |

### Bloco Rastreabilidade (4 drafts)

| # | Documento | Itens catalogados |
|---|---|---|
| 11 | URS-001 User Requirements | 41 URS |
| 12 | SRS-001 Software Requirements | 44 SRS (31 FR + 13 NFR) |
| 13 | SAD-001 Software Architecture | 47 itens |
| 14 | TRM-001 Traceability Matrix | 193 itens (17 CTL + 11 TST + 23 EVD) |

### Bloco Operacional (2 drafts)

| # | Documento | Conteúdo |
|---|---|---|
| 15 | PLAN-FLIP-001 verify_jwt | Mapping empírico 5 callers + smoke pre/pos + rollback |
| 16 | PLN-VER-001 Plano de Verificação | 49 itens (10 met + 10 cri + 7 cad ver + 4 cad mon + 6 resp + 8 gates) |

### Documento executivo

- **`00_EXECUTIVE_SUMMARY/EXECUTIVE_SUMMARY.md`** — Sumário 5 páginas para consultora
- **`SGQ_CONSOLIDADO_29_05_2026.md`** — Arquivo único 4.101 linhas / 168 KB com tudo concatenado

### Estrutura pasta executiva

10 pastas (`00_EXECUTIVE_SUMMARY` a `09_CLINICAL_VALIDATION`) com READMEs apontando para drafts canônicos.

## 4. Auditoria empírica cruzada (29/05/2026 20h)

Princípio cristalizado aplicado pré-baseline: **validar empíricamente via PAT antes de declarar conforme** (memória [[feedback_nao_chutar_uuid_quando_pat_disponivel_29_05]]).

### 4.1. Métricas confirmadas via PAT Supabase

| Métrica | Documentado | Real PAT 29/05 20h | Status |
|---|---:|---:|---|
| Tabelas Postgres públicas | 144 | 144 | ✅ |
| Tabelas com RLS ON | 144 | 144 (100%) | ✅ |
| Reports ICP-Brasil signed | 42 | 42 | ✅ |
| `clinical_rationalities` total | 132 | 132 | ✅ |
| `clinical_rationalities` com pseudônimo "Paciente #" explícito | 132 (claim original) | **113 (86%)** | **⚠️ NUANCE descoberta** |
| Cron jobs ativos | 3 | 3 | ✅ |
| Pacientes (`type='patient'`) | 31 | 31 | ✅ |
| Profissionais (`type='professional'`) | 11 | 11 | ✅ |
| Administradores (`type='admin'`) | 5 | 5 | ✅ |
| Alunos (`type='aluno'`) | 0 | 0 | ✅ |
| `clinical_qa_runs` | 2 | 2 | ✅ |

### 4.2. Métricas confirmadas localmente via git/file system

| Métrica | Documentado | Real local | Status |
|---|---:|---:|---|
| Commits últimos 30 dias | 649 | 650 (+1 deste commit) | ✅ |
| Tags v1.9.* | 11 | 11 | ✅ |
| Diários `DIARIO_*.md` | 66 | 66 | ✅ |
| Memórias persistentes | 284 | 284 | ✅ |
| Arquivos TS/TSX em `src/` | 363 | 363 | ✅ |

## 5. Nuance descoberta: PII sanitization 86% explícito vs claim 100%

### 5.1. O que foi descoberto

Audit empírico revelou que **19 de 132 rationalities (14%) não têm o pseudônimo "Paciente #XXXXXX"** em `assessment`. Investigação detalhada via PAT mostrou que essas 19 rows usam construções **genéricas** sem nome real:

- *"O paciente apresenta queixas de ansiedade..."*
- *"O(a) paciente, apresenta queixa de dor..."*
- *"O paciente reporta a intenção de colocar aparelho ortodôntico..."*

### 5.2. Por que isso aconteceu

V1.9.452 backfill replicava lógica `pseudonymizePatientReferences` do `casePseudonymization.ts` V1.9.407 — função que substitui **nome real** do paciente por pseudônimo. Quando o texto original já era **genérico** ("O paciente"), **não havia nada para substituir** — backfill passou sem alterar.

### 5.3. Análise de risco regulatório

- ✅ **Não há vazamento PII**: textos genéricos não permitem identificação do indivíduo.
- ⚠️ **Métrica de cobertura estava errada**: "100% sanitizadas" deveria ser "100% sem nome real, sendo 86% com marca pseudo-formal explícita".

### 5.4. Correção aplicada

- Executive Summary atualizado com nuance honesta.
- TRM-001 EVD-13 nota de rodapé a adicionar.
- Memória [[feedback_pii_sanitization_metrica_correta_29_05]] a cristalizar.

### 5.5. Lição empírica para auditoria

Auditoria cruzada via PAT antes do baseline pegou erro de medição. Esse é exatamente o tipo de achado que **consultora reagiria mal** se descoberto durante revisão paga. Custo: 5 minutos de query. Economia: horas de descoberta paga + credibilidade preservada.

## 6. Inventário de IDs

### 6.1. IDs estruturados

- URS: 41 (URS-MED/PAC/ALU/ADM/GLB-NN)
- SRS: 44 (SRS-FR/NFR-NN)
- SAD: 47 (SAD-COMP/IFACE/FLOW/DEC-NN)
- RSK: 10 (RSK-H01..H10)
- CTL: 17 (CTL-01..17)
- TST: 11 (TST-01..11)
- EVD: 23 (EVD-01..23)
- VER-MET: 10 (VER-MET-01..10)
- VER-CRI: 10 (VER-CRI-01..10)
- VER-CAD: 7 (VER-CAD-01..07)
- MON-CAD: 4 (MON-CAD-01..04)
- VER-RSP: 6 (VER-RSP-01..06)
- Release Gates: 8 (G1-G8)

**Total IDs catalogados: 238**

### 6.2. Coberturas verificadas

- 44/44 SRS com pelo menos 1 método VER-MET mapeado (100%)
- 10/10 RSK com pelo menos 1 controle CTL mapeado (100%)
- 11/11 tags v1.9 com pelo menos 1 EVD apontando (100%)
- 18 cadeias URS→SRS→SAD→RSK→CTL→TST→EVD completas em TRM-001

### 6.3. Gaps de rastreabilidade conhecidos

Conforme TRM-001 §6.3:
1. URS-ALU-05 (feedback simulação) — sem `simulation_runs` formal
2. URS-MED-08 / URS-PAC-05 (share cross-account) — pattern overwrite documentado
3. SRS-NFR-06 — verify_jwt=false gap H8 (em fechamento via PLAN-FLIP-001)
4. SRS-FR-15 — paciente externo offline (sem UI delete)

## 7. Stack tecnológico no baseline

| Camada | Tecnologia | Versão |
|---|---|---|
| Frontend | React + TypeScript + Vite + Tailwind | 18 / 5+ / 4+ / 3+ |
| Deploy frontend | Vercel | auto on push |
| Backend DB | Supabase Postgres | 15.x |
| Backend functions | Supabase Edge (Deno) | 15 funções ativas |
| Auth | Supabase Auth | JWT RS256 |
| IA principal | OpenAI GPT-4o-2024-08-06 | (V1.9.86+) |
| IA secundária | OpenAI gpt-4o-mini | (V1.9.84+) |
| Email | Resend | domain verified 28/04 |
| Vídeo | WiseCare V4H | homolog (migrar pós-Marco 1) |
| Assinatura digital | ITI ICP-Brasil PBAD AD-RB v2.4 | CONFORME 16/05 |

## 8. Locks ativos no baseline (11)

| Tag | Versão | Conteúdo selado |
|---|---|---|
| v1.9.95-lock-aec-relatorio-agendamento | V1.9.95 | AEC + Relatório + Agendamento |
| v1.9.99-resend-prod-locked | V1.9.99 | Resend production-ready |
| v1.9.113-locked | V1.9.113 | Pipeline estável |
| v1.9.299-pbad-conforme-locked | V1.9.299 | PBAD AD-RB CONFORME ITI |
| v1.9.418-forum-cann-matrix-checkpoint | V1.9.418 | Fórum Cann Matrix |
| v1.9.452-pii-sanitize-defensivo-final | V1.9.452 | PII sanitize |
| v1.9.455-exam-pdf-wiring | V1.9.455 | exam_request PDF ICP |
| v1.9.457-sign-pdf-icp-auth-ownership | V1.9.457 | Edge sign-pdf-icp auth+ownership |
| v1.9.468-A-matrix-bula-locks-final | V1.9.468-A | Matrix Z2 + Bula |
| v1.9.474-aec-reset-invalidated-trigger | V1.9.474 | Trigger BD reset invalidated_at |
| v1.9.475-card-neuro-embriao | V1.9.475 | Card Neuro embrião |

## 9. Próximas atualizações esperadas no baseline

### 9.1. Curto prazo (dias)

- **V1.9.503** — Adição CFG-BASELINE-001 + RACI-001 + REV-001 + RELEASE_CHECKLIST (este commit).
- **V1.9.504** — Flip verify_jwt em `tradevision-core` (após PLAN-FLIP-001 execução).

### 9.2. Médio prazo (semanas)

- Marco 1: CNPJ ativo + RT contratado.
- Atualização CFG-BASELINE com versão pós-CNPJ.

### 9.3. Longo prazo (meses)

- Marco 2: 1º paciente externo pagante.
- Acumulação `clinical_qa_runs` para 12+ runs.
- Submissão consultora SaMD com Modelo C-IA.

## 10. Como consultora deve usar este documento

1. **Ler primeiro:** `00_EXECUTIVE_SUMMARY/EXECUTIVE_SUMMARY.md` (10 min)
2. **Confirmar baseline:** este documento CFG-BASELINE-001 (5 min)
3. **Auditar conteúdo:**
   - URS/SRS/SAD/RSK/TRM (núcleo rastreabilidade)
   - PLN-IEC-001 + PLN-VER-001 (planos de desenvolvimento e verificação)
   - POPs operacionais (CTL-001, CTL-007, PRJ-002, QAS-001, CAPA-001)
   - Material de risco (RSK-001) e validação (POP-VAL-001)
4. **Solicitar evidências:** Pedro fornece via PAT Supabase + acesso git on-demand.
5. **Fase 2:** revisão formal + assinatura RT habilitado.

## 11. Disclaimer crítico

Este baseline é DRAFT pré-consultora. NÃO substitui:
- Auditoria formal por terceiros independentes
- Assinatura de RT habilitado (CRF/CREA)
- Submissão ANVISA Classe IIa
- CE Mark ou FDA SaMD

Modelo C-IA (R$ 30-60K + 2-3m) proposto pressupõe consultora especializada (Emergo / BSI / GS1 BR / Qualytools).

---

**Mantenedor:** Pedro Henrique Passos Galluf (Tech Lead).
**Próxima revisão obrigatória:** A cada lock V1.9.X selado OR a cada nova versão do Livro Magno OR semanalmente até Marco 1.

**Frase âncora:**

> *"Baseline V1.9.502-C / f0aff57 / 29/05/2026 20h10 BRT — 16 drafts + Executive Summary + 10 pastas executivas + 238 IDs catalogados + audit cruzada empírica via PAT detectou erro de medição PII (corrigido). Consultora chega num pacote validado, não num laboratório."*
