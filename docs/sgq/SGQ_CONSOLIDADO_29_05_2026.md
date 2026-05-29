# SGQ MedCannLab — Documento Consolidado (29/05/2026)

**Versão:** 0.1 DRAFT pré-consultora SaMD
**Status:** Concatenação dos 10 drafts + README do diretório `docs/sgq/`
**Propósito:** facilitar copy-paste integral para consultora / RT / arquivo único

**Sumário:**

0. README — Modelo C-IA + roadmap pós-CNPJ
1. POP-CTL-001 — Controle de Documentos (ISO 13485 §7.5.3)
2. POP-CTL-007 — Controle de Mudanças em Software Médico (§7.3.7 + IEC 62304 §6.2)
3. PLN-IEC-001 — Plano IEC 62304 Classe B (§5.1)
4. RSK-001 — Análise de Risco ISO 14971 (10 hazards + FMEA)
5. POP-PRJ-002 — Processo de Desenvolvimento (§7.3 + IEC 62304 §5)
6. POP-QAS-001 — Auditoria Interna (§8.2.2)
7. POP-LBL-001 — Rotulagem SaMD + Restrições Operacionais
8. PROC-CAPA-001 — Ação Corretiva e Preventiva (§8.5.2 + §8.5.3)
9. POP-VAL-001 — Validação Clínica Documental (§7.3.7 + IEC 62366)
10. MAN-SGQ-001 — Manual do SGQ (§4.2.2)

---

<a name="readme"></a>

# 0. README

# SGQ MedCannLab — Drafts Modelo C-IA (29/05/2026)

**STATUS:** ⚠️ DRAFTS PRÉ-CONSULTORA (não submetidos a auditor regulatório)

## O que é este diretório

Drafts iniciais do Sistema de Gestão da Qualidade (SGQ) MedCannLab, gerados via IA a partir do material empírico já existente no repositório:

- **649 commits/30d** com versionamento V1.9.X disciplinado
- **66 diários** DIARIO_*.md (registros de desenvolvimento)
- **6 Livros Magno** docs/LIVRO_MAGNO_*.md (controle de configuração)
- **11 locks com tag git imutável** (V1.9.95+97+98+99-B+299+388-A.3+452+468-B)
- **284 memórias persistentes** (lessons learned)
- **42 reports ICP-Brasil PBAD signed** (evidência clínica)
- **Pirâmide 8 camadas COS Kernel** (risk control architecture)

## Modelo C-IA (refinamento do Modelo C híbrido)

Caminho cristalizado em conversação 29/05:

| Modelo | Custo | Prazo |
|---|---:|---:|
| A — Consultora SaMD do zero | R$ 250-500K | 12-18m |
| C — Híbrido tradicional (consultora traduz material empírico + RT assina) | R$ 60-120K | 2-4m |
| **🆕 C-IA — Híbrido com IA** (drafts gerados localmente; consultora REVISA + RT assina + submete) | **R$ 30-60K** | **2-3m** |

## Pré-requisitos antes da submissão

- **CNPJ** ativo (Marco 1) — destrava contratação RT + consultora
- **RT (Responsável Técnico)** habilitado CRF/CREA assinando dossiê
- **Marco 2** — pelo menos 1 paciente externo pagante real validando empíricamente
- **Marco 2.5** — 2º médico independente externo no smoke (anti-conflito interesse)

## O que ESTE diretório NÃO é

❌ Dossiê regulatório oficial pronto pra submissão
❌ Substituto de consultora SaMD especializada
❌ Substituto de RT habilitado
❌ Substituto de validação clínica externa real

✅ Pacote de matéria-prima formatada que reduz custo e prazo da consultora.

## Lista de drafts (10)

1. **POP-CTL-001** — Controle de Documentos (ISO 13485 §7.5.3)
2. **POP-CTL-007** — Controle de Mudanças em Software Médico (ISO 13485 §7.3.7 + IEC 62304 §6.2)
3. **PLN-IEC-001** — Plano de Desenvolvimento de Software Classe B (IEC 62304 §5.1)
4. **RSK-001** — Análise de Risco ISO 14971 (FMEA inicial pirâmide 8 camadas)
5. **POP-PRJ-002** — Processo de Desenvolvimento (ISO 13485 §7.3 + IEC 62304 §5)
6. **POP-QAS-001** — Auditoria Interna SGQ (ISO 13485 §8.2.2)
7. **POP-LBL-001** — Rotulagem SaMD e Restrições Operacionais
8. **PROC-CAPA-001** — Ação Corretiva e Preventiva (ISO 13485 §8.5.2 + §8.5.3)
9. **POP-VAL-001** — Validação Clínica Documental (ISO 13485 §7.3.7)
10. **MAN-SGQ-001** — Manual do SGQ (ISO 13485 §4.2.2)

## Aviso de conformidade

Estes drafts foram gerados em **29/05/2026** com base em snapshot do repositório nessa data. Devem ser **revisados pela consultora SaMD contratada** antes de qualquer submissão regulatória (ANVISA / FDA / CE).

Frase âncora:

> *"IA faz tradução, não invenção. O conhecimento clínico-arquitetural já existe empíricamente no repositório; estes drafts apenas formatam-no pra reconhecimento por auditor regulatório."*

---

<a name="01_pop-ctl-001_controle_de_documentos"></a>

# POP-CTL-001 — Procedimento Operacional Padrão: Controle de Documentos

**Versão draft:** 0.1 (29/05/2026)
**Status:** DRAFT pré-consultora SaMD
**Referência normativa:** ISO 13485:2016 §4.2.4, §7.5.3

---

## 1. Objetivo

Estabelecer os mecanismos de controle de documentos do SGQ MedCannLab, garantindo:

- Versionamento auditável de todo material clínico, técnico e organizacional
- Rastreabilidade temporal de alterações
- Preservação de versões anteriores para fins de audit
- Identificação clara de documentos vigentes vs históricos

## 2. Escopo

Aplica-se a:

- Código-fonte do sistema (frontend, Edge Functions, migrations)
- Documentação clínica (Livros Magno, diários técnicos, memórias persistentes)
- Procedimentos operacionais padronizados (POPs)
- Registros de auditoria e validação
- Material regulatório formal

## 3. Mecanismos de controle implementados

### 3.1. Versionamento sequencial V1.9.X

O sistema utiliza esquema **V1.9.X** com sub-letras (V1.9.97-A/B/C) onde:

- **Major (1)**: Arquitetura fundamental da cosmologia COS Kernel
- **Minor (9)**: Fase atual MedCannLab 3.0 (pré-PMF)
- **Patch (X)**: Incrementado a cada commit cirúrgico
- **Sub-letra (-A/-B)**: Fixes relacionados num mesmo ciclo de mitigação

**Evidência empírica:** repositório atual em V1.9.501 com 649 commits em 30 dias documentados.

### 3.2. Locks selados (versões críticas imutáveis)

Versões consideradas críticas recebem **tag git imutável + diário dedicado + memória persistente**. Não podem ser revertidas sem nova versão do Livro Magno.

| Lock | Conteúdo selado | Selador | Data |
|---|---|---|---|
| V1.9.95 | AEC + Relatório + Agendamento | Pedro | 27/04/2026 |
| V1.9.97 | Pipeline determinístico | Pedro | 27/04/2026 |
| V1.9.98 | RLS chat-images fechado | Pedro | 28/04/2026 |
| V1.9.99-B | video-call-reminders elite | Pedro | 28/04/2026 |
| V1.9.299 | PBAD AD-RB ICP-Brasil CONFORME ITI | Pedro | 16/05/2026 |
| V1.9.388-A.3 | Ancoragem regulatória multi-camada | Ricardo+Pedro | 27/05/2026 |
| V1.9.452 | PII sanitize clinical_rationalities | Pedro | 29/05/2026 |
| V1.9.468-B | Matrix Z2 + Bula ANVISA material marcado | Pedro | 27/05/2026 |

### 3.3. Diários técnicos diários (registros de desenvolvimento)

**Padrão:** `DIARIO_DD_MM_2026_*.md` na raiz do repositório.

Estrutura obrigatória:
- Blocos sequenciais (A, B, C...)
- Frase âncora ao fim de cada bloco
- Decisões empíricas documentadas com evidência (PAT smoke, type-check, screenshot)
- Trade-offs explicitados

**Evidência empírica:** 66 diários no repositório (período 12/03/2026 a 29/05/2026).

### 3.4. Memórias persistentes (lessons learned ISO 13485 §8.5)

Diretório `~/.claude/projects/.../memory/` mantém **284 memórias** classificadas em 4 tipos:

- **project** — informações operacionais de iniciativas
- **feedback** — princípios e correções (lessons learned)
- **reference** — pointers para fontes externas
- **user** — perfil dos stakeholders

**Hierarquia explícita** em MEMORY.md (índice Nível 1 lido sempre primeiro).

### 3.5. Livros Magno (controle de configuração formal)

6 versões do Livro Magno documentam evolução da Constituição cognitiva:

```
docs/LIVRO_MAGNO_V1.md → V6.md
```

Cada Magno consolida o que sobreviveu a 3-6 semanas de uso empírico sem regressão. **NÃO atualizado por capricho** (princípio "polir, não inventar").

### 3.6. Git como sistema de controle de versão primário

- Branch principal: `main`
- Push obrigatório em **4 referências** (2 remotes × main + master)
- Co-author obrigatório em commits IA-assistidos
- Histórico imutável (sem `--force` push sem `--force-with-lease`)
- Hooks pre-commit ativos (secretlint, type-check)

## 4. Identificação de versão vigente

Para qualquer ponto do sistema, a versão vigente é determinável por:

1. **Tag git** mais recente naquele caminho (`git log -1 --tags`)
2. **CLAUDE.md** seção "Estado atual" (atualizado a cada lock)
3. **Edge Functions:** Management API Supabase retorna `version` ativa
4. **Frontend:** Vercel deploy automático on push → versão = último commit em main

## 5. Preservação de versões anteriores

- Git mantém histórico completo (rebase só em branches feature, nunca main)
- Backups Supabase: WAL-G + diários (Pro plan)
- Diários técnicos: nunca deletados, apenas arquivados quando atingem 1000 linhas
- Memórias: removidas apenas quando obsoletas; quando relevantes mesmo se desatualizadas, **rebaixadas a Nível 2/3** com data de obsolescência

## 6. Responsabilidades

| Papel | Responsabilidade |
|---|---|
| Tech Lead (Pedro Galluf) | Selagem de locks + atualização Magno + CLAUDE.md |
| Médico Sócio (Ricardo Valença) | Validação clínica empírica antes de selagem |
| Co-Coordenador Ensino (Eduardo Faveret) | Validação metodológica eixo Ensino |
| RT habilitado (a contratar pós-CNPJ) | Assinatura formal de documentos regulatórios |

## 7. Registros gerados

- Tags git de versões críticas
- Diários `DIARIO_*.md` (laboratório operacional)
- Memórias `memory/*.md` (lessons learned)
- Livros Magno `docs/LIVRO_MAGNO_V*.md` (museu institucional)
- Histórico commit `git log` (auditoria temporal)

## 8. Evidências para auditor

```bash
# Ver histórico empírico de mudanças
git log --oneline --graph --all | head -100

# Ver locks selados (tags imutáveis)
git tag --list | sort -V

# Ver diários técnicos
ls DIARIO_*.md | wc -l

# Ver Livros Magno (controle de configuração)
ls docs/LIVRO_MAGNO_*.md

# Ver memórias persistentes (lessons learned)
ls ~/.claude/projects/*/memory/*.md | wc -l
```

## 9. Não-conformidades conhecidas (transparência)

- **`tradevision-core` Edge com `verify_jwt=false`** em produção (descoberto 29/05) — pendente decisão arquitetural com validação de callers; rastreado em Sprint A.
- **CLAUDE.md exemplo doc** ainda menciona `--no-verify-jwt` (cosmético, não-funcional)
- Necessária validação RT formal pós-CNPJ para conversão deste draft em POP oficial.

---

**Aprovação:**
- [ ] RT habilitado: ________________ Data: ___/___/___
- [ ] Consultora SaMD: ________________ Data: ___/___/___
- [ ] Tech Lead: Pedro Henrique Passos Galluf — Data: 29/05/2026 (draft)

**Próxima revisão obrigatória:** 6 meses após primeira aprovação OR a cada lock crítico.

---

<a name="02_pop-ctl-007_controle_de_mudancas"></a>

# POP-CTL-007 — Procedimento Operacional Padrão: Controle de Mudanças em Software Médico

**Versão draft:** 0.1 (29/05/2026)
**Status:** DRAFT pré-consultora SaMD
**Referência normativa:** ISO 13485:2016 §7.3.7 + IEC 62304:2006 §6.2

---

## 1. Objetivo

Definir o processo formal de identificação, análise, implementação, verificação e documentação de **mudanças** em qualquer camada do software MedCannLab classificado como SaMD Classe IIa.

## 2. Princípio constitucional anti-kevlar §1

> *"Mudanças que afetam Constituição/RACI/contratos clínicos exigem nova versão do Livro Magno — não mudar diretamente no código."*

Esse princípio (cristalizado em memória `project_regra_consentimento_nao_e_agendamento`) garante que **mudanças arquiteturais críticas** seguem rito formal com consenso entre Tech Lead + Médico Sócio + (futuro) RT habilitado.

## 3. Categorias de mudança (4 níveis)

### Nível 1 — Mudança trivial (não-clínica, não-arquitetural)
- Polish visual, correção de typo, ajuste de copy
- Exemplos: V1.9.499 (background Literatura), V1.9.501 (KPIs Prescrição), V1.9.501 (mocks dashboard removidos)
- **Rito:** commit direto + push 4 refs

### Nível 2 — Mudança funcional não-clínica
- Novo componente UI, nova query analítica, refactor não-arquitetural
- Exemplos: V1.9.495-497 (Sprint E — Notícias / Avaliações / Mentoria), V1.9.500 (InterruptedAECsCard)
- **Rito:** commit + diário + memória (se padrão reusável)

### Nível 3 — Mudança clínico-cognitiva
- Toca AEC FSM, Pipeline, Verbatim, Signature, Gate, Matrix Z2
- Exemplos: V1.9.452 (PII sanitize racionalidades), V1.9.487-494 (Matrix Camadas 1.X)
- **Rito:** commit + diário + smoke empírico documentado (PAT validation) + memória cristalizada + atualização CLAUDE.md
- **Bloqueador:** smoke PASS empírico antes de push 4 refs

### Nível 4 — Mudança constitucional (Livro Magno)
- Altera Constituição, RACI, contratos clínicos, anti-kevlar §1
- Exemplos: V1.9.95 (lock AEC+Relatório+Agendamento), V1.9.388-A.3 (ancoragem regulatória multi-camada)
- **Rito:** nova versão do Livro Magno + selo formal + tag git imutável + memória Nível 1
- **Bloqueador:** consenso entre Tech Lead + Médico Sócio (Ricardo Valença) registrado em diário

## 4. Fluxo padrão (Nível 3 — exemplo concreto V1.9.452 PII sanitize)

| Passo | Evidência empírica |
|---|---|
| 1. Identificação | Backlog conhecido 28d em memória `project_v1_9_452_pii_sanitize_*` |
| 2. Análise risco | Vazamento PII em 4/5 rows recentes (audit PAT 26/05) |
| 3. Design | Helper `sanitizeRationalityPII` polish de `casePseudonymization.ts` V1.9.407 |
| 4. Implementação | Edge `tradevision-core` v423 patches linhas 1723+2287 |
| 5. Backfill histórico | 132 rows via PL/pgSQL replicando lógica JS |
| 6. Verificação | Smoke "Pedro Paciente" → bug detectado → fix v2 exclude list |
| 7. Documentação | Diário 29/05 Bloco K + memória `project_v1_9_452_*` Nível 1 |
| 8. Selagem | Lock V1.9.452 tag imutável + atualização CLAUDE.md |

## 5. Análise de risco obrigatória (toda mudança Nível 3+)

Toda mudança Nível 3 ou superior deve **explicitamente** responder:

1. **Toca o Lock V1.9.299 PBAD ICP-Brasil?** Se sim → smoke ITI obrigatório (openssl asn1parse + validar.iti.gov.br + diff binário vs PDF aprovado)
2. **Toca AEC FSM ou Pipeline?** → smoke cobrindo regressão pirâmide 8 camadas
3. **Pode disparar cascata DB?** → mapear triggers ON INSERT/UPDATE via `pg_trigger`
4. **Afeta Edge Functions auth?** → validar verify_jwt + callers
5. **Toca PII ou LGPD?** → validar sanitização preventiva + backfill se histórico
6. **Risco de regressão clínica?** → smoke empírico com paciente real (Carolina / Maria Pinto Pitoco)

## 6. Rastreabilidade técnica (IEC 62304 §5.1.3)

Toda mudança gera rastreabilidade através de:

- **Commit SHA** (git log)
- **Tag git** (se Nível 3+)
- **Diário DIARIO_*.md** (Bloco dedicado)
- **Memória persistente** (se princípio reusável)
- **Telemetria** (`ai_chat_interactions.metadata`, `cognitive_events`)
- **Smoke PAT** validation antes/depois (registro empírico)

## 7. Evidências empíricas para auditor

```bash
# Histórico de mudanças com versões
git log --oneline --grep="V1.9" | head -50

# Locks selados (tags imutáveis)
git tag --list "v1.9*" | sort -V

# Verificar conformidade com pirâmide
grep -rn "pirâmide 8 camadas" CLAUDE.md

# Mudanças clínicas críticas (Nível 3+)
grep -rn "AEC\|Pipeline\|Verbatim\|Signature" DIARIO_*.md | wc -l
```

## 8. Exceções (mudanças emergenciais)

Em incidente de segurança ou regressão crítica em produção:

1. Hotfix imediato sem rito completo permitido **SOMENTE** se Tech Lead + Médico Sócio (se disponível) concordarem em registro síncrono (WhatsApp + screenshot)
2. Documentação formal obrigatória em até **24h** após fix
3. Diário retroativo + memória Nível 1 cristalizada
4. Post-mortem em diário do dia seguinte

**Exemplo aplicado:** V1.9.500-A hotfix EvolutionDetailModal (29/05 12:28 BRT) — coluna `clinical_reports.assessment` inexistente flagrada empíricamente; corrigido em <30min; commit `252cd36` push 4 refs OK.

## 9. Métricas de controle (último mês)

| Métrica | Valor empírico |
|---|---:|
| Commits totais 30d | 649 |
| Versões V1.9.X 30d | ~120 |
| Locks selados (vida útil sistema) | 8 |
| Hotfixes emergenciais | 1 (V1.9.500-A) |
| Diários produzidos | 28+ |
| Memórias cristalizadas | 284 |

---

**Aprovação:**
- [ ] RT habilitado: ________________ Data: ___/___/___
- [ ] Consultora SaMD: ________________ Data: ___/___/___
- [ ] Tech Lead: Pedro Henrique Passos Galluf — Data: 29/05/2026 (draft)

---

<a name="03_pln-iec-001_plano_iec_62304_classe_b"></a>

# PLN-IEC-001 — Plano de Desenvolvimento de Software Médico Classe B

**Versão draft:** 0.1 (29/05/2026)
**Status:** DRAFT pré-consultora SaMD
**Referência normativa:** IEC 62304:2006 §5.1 (Plano de Desenvolvimento)

---

## 1. Classificação de software

**MedCannLab 3.0** = **Classe B** (IEC 62304:2006 §4.3)

Justificativa de classificação:

- **Não é Classe A** porque influencia decisão diagnóstica/terapêutica (AEC + relatórios + racionalidades)
- **Não é Classe C** porque NÃO controla diretamente equipamento crítico nem decide autonomamente prescrição (médico mantém soberania conforme lock V1.9.388-A.3)

**Lock V1.9.388-A.3** explicita: *"Sistema NÃO PODE eticamente: substituir decisão médica, prescrever autonomamente, modificar conduta sem médico no loop."*

## 2. Arquitetura cognitiva — Pirâmide 8 camadas

```
0. REGRA HARD §1 (constitucional)        "Consentimento ≠ Agendamento" — anti-kevlar §1
1. COS KERNEL v5.0 (cos_engine.ts*)      5 portas: KillSwitch / Trauma / Metabolismo / ReadOnly / Policy
2. AEC FSM (clinicalAssessmentFlow.ts)   13+ fases determinísticas
3. VERBATIM FIRST (V1.9.86)              ~46% bypass GPT em hard-lock phases
4. AEC GATE V1.5 (V1.9.95-A reforçado)   Bloqueia agendamento durante AEC ativa
5. GPT-4o-2024-08-06 / gpt-4o-mini       Só chamado se nada acima resolveu
6. PÓS-PROCESSAMENTO                     Strip tokens, validate UUID, force tags pós-AEC
7. PIPELINE ORCHESTRATOR                 REPORT → SCORES → SIGNATURE → AXES → RATIONALITY → DONE
```

Conformidade IEC 62304 §5.2.1 (Requisitos de software): pirâmide acima já implementa controles de risco em **múltiplas camadas** (defense in depth — princípio cristalizado).

## 3. Decomposição de itens de software (IEC 62304 §5.3)

### 3.1. Frontend (React + TypeScript + Vite)
- **3.500+ linhas TypeScript** (29/05/2026)
- Componentes principais: AlunoDashboard, PatientsManagement, ProfessionalDashboard, ResearchWorkstation, MedicalRecord
- Estado: 363 arquivos `.tsx`/`.ts` em `src/`

### 3.2. Backend (Supabase Postgres + Edge Functions Deno)
- **15 Edge Functions** ativas (29/05/2026)
- **144 tabelas** Postgres com RLS habilitado em 100%
- **3 Cron Jobs** pg_cron (video-call-reminders / monthly-closing / expire-renal-suggestions)

### 3.3. Edge Functions críticas (ranking por risco)

| Edge | Versão atual | Risco IEC 62304 | Lock associado |
|---|---|---|---|
| tradevision-core | v423 | A1 (decisão clínica) | V1.9.388-A.3 |
| sign-pdf-icp | v22 | A1 (assinatura jurídica) | V1.9.299 ICP-Brasil |
| digital-signature | v65 | A1 (CFM 3 levels) | V1.9.299 |
| cert-encrypt-password | v3 | A2 (cripto) | V1.9.299 |
| video-call-reminders | v31 | B (operacional) | V1.9.99-B |
| send-email | v62 | B (comunicação) | — |
| extract-document-text | v59 | C (utilitário) | — |

## 4. Processo de desenvolvimento (IEC 62304 §5.4)

### 4.1. Pipeline Diário → Magno (princípio meta-arquitetural)

```
HIPÓTESE → EXPERIMENTO → VALIDAÇÃO → CRISTALIZAÇÃO
(diário)   (sprint)      (uso real)   (Livro Magno)
```

- **Diário** = laboratório operacional, WIP, registra tudo
- **Memórias persistentes** = aprendizados intermediários
- **Livro Magno** = museu institucional, só absorve o que provou valor empírico repetível (3-6 semanas uso real sem regressão)

### 4.2. Princípio "polir, não inventar" (Princípio 8 cristalizado)

Antes de criar código novo: **buscar mecanismo equivalente que já existe no codebase**. Reutilizar > criar paralelo.

Exemplo aplicado: V1.9.452 PII sanitize **reusou** `pseudonymizePatientReferences` (V1.9.407 `casePseudonymization.ts`) em vez de criar algoritmo novo.

### 4.3. Validação empírica obrigatória (Princípio Meta 28/05)

> *"Antes de codar refatoração, validar empíricamente (screenshot/execução) que melhora estado atual."*

Cristalizado após 5 iterações falhadas Card Neuro/Renal V1.9.475-A-D + V1.9.476-A. Aplicável a TODA refatoração futura.

## 5. Verificação de software (IEC 62304 §5.6)

### 5.1. Métodos empíricos validados

1. **Smoke PAT via Supabase Management API** — validação de schema, contagens, integridade referencial
2. **Type-check `npx tsc --noEmit`** — validação sintática TypeScript (obrigatório pré-commit)
3. **Smoke clinical_qa_runs** — framework PMF Audit Memo 28/04 (17 colunas estruturadas)
4. **Smoke empírico via UI** — Pedro/Ricardo flagam regressões antes do user externo
5. **Cron telemetria** — `cron.job_run_details` últimos 7d = 2.023 runs / 100% succeeded

### 5.2. Cadência mínima `clinical_qa_runs` (princípio cristalizado 26/05)

- **1 QA run por nova versão V1.9.X que toca código clínico** (AEC FSM / Pipeline / Verbatim / signature / RAG)
- **1 QA run quinzenal** num report aleatório (rotação Claude/Pedro/Ricardo)
- **1 QA run OBRIGATÓRIA pré-Marco 2** em report do 1º paciente externo pagante

## 6. Gerenciamento de configuração (IEC 62304 §8)

Detalhado em [POP-CTL-001 Controle de Documentos](./01_POP-CTL-001_Controle_de_Documentos.md).

Resumo:
- Git como SCM primário
- Versionamento V1.9.X com sub-letras
- Tags imutáveis pra locks críticos (8 atuais)
- Push obrigatório 4 referências (2 remotes × main + master)

## 7. Gerenciamento de problemas (IEC 62304 §9)

Detalhado em [PROC-CAPA-001 Ação Corretiva e Preventiva](./08_PROC-CAPA-001_CAPA.md).

Resumo:
- Bugs flagrados via UI (Pedro empírico) → diário → memória → fix → smoke
- Memórias `feedback_*` = lessons learned formalizadas
- 284 memórias cristalizadas em 30 dias de operação

## 8. Modelo de ciclo de vida adotado

**Modelo evolucionário com selagem incremental** (aderente IEC 62304 §5.1.1).

Justificativa: ambiente HealthTech em fase pré-PMF exige iteração rápida com validação clínica empírica em loop curto. Modelo waterfall puro seria inadequado (memória `feedback_drift_historico_dev_aceitavel_pre_pmf_18_05`).

Estabilização para waterfall pós-Marco 2 (paciente externo pagante) garantirá conformidade plena para submissão regulatória.

## 9. Marcos formais de desenvolvimento

| Marco | Critério | Status |
|---|---|---|
| Marco 1 | CNPJ ativo + RT contratado | ⏳ Em andamento (semana 29/05/2026) |
| Marco 2 | 1º paciente externo pagante real validando | ❌ Pendente |
| Marco 2.5 | 2º médico independente externo no smoke | ❌ Pendente |
| Marco 3 | 20-30 pacientes externos pagantes (PMF) | ❌ Pendente |
| Marco 4 | Petição ANVISA Classe IIa submetida | ❌ Pós-Marcos 1-3 |

## 10. Equipe de desenvolvimento (RACI)

| Papel | Pessoa | Responsabilidade IEC 62304 |
|---|---|---|
| Tech Lead | Pedro Henrique Passos Galluf | Arquitetura geral + selagem locks |
| Médico Sócio (Clínica) | Dr. Ricardo Valença | Validação clínica + criador método AEC |
| Coordenador Ensino | Dr. Eduardo Faveret | Validação metodológica eixo Ensino |
| Sócio Institucional | João Eduardo Vidal | CNPJ + parcerias + regulatório |
| RT habilitado | A contratar pós-CNPJ | Assinatura formal documental |
| Consultora SaMD | A contratar pós-CNPJ | Revisão formato + submissão ANVISA |

---

**Aprovação:**
- [ ] RT habilitado: ________________ Data: ___/___/___
- [ ] Consultora SaMD: ________________ Data: ___/___/___
- [ ] Tech Lead: Pedro Henrique Passos Galluf — Data: 29/05/2026 (draft)

---

<a name="04_rsk-001_risk_management_iso_14971"></a>

# RSK-001 — Análise de Risco ISO 14971 + FMEA Inicial

**Versão draft:** 0.1 (29/05/2026)
**Status:** DRAFT pré-consultora SaMD (requer revisão Ricardo Valença + RT)
**Referência normativa:** ISO 14971:2019 (Aplicação de gestão de risco a dispositivos médicos)

---

## 1. Escopo

Identificação, análise e controle de **riscos clínicos** associados ao uso do MedCannLab 3.0 como SaMD Classe IIa, com foco em:

- Risco de **decisão clínica errada** induzida pelo sistema
- Risco de **vazamento de PII / LGPD**
- Risco de **falha de assinatura jurídica** (ICP-Brasil)
- Risco de **falha de consentimento** do paciente
- Risco de **alucinação IA** com impacto terapêutico

## 2. Hazards identificados (10 hazards principais)

### H1 — IA prescreve autonomamente (Babylon-pattern)

**Descrição:** Sistema IA gera prescrição sem médico no loop ou influencia decisão sem disclaimer adequado.

**Controle implementado:**
- **Lock V1.9.388-A.3 multi-camada**: regulatório CFM 2.314 + LGPD art. 11/20 + EU AI Act + FDA SaMD + WMA
- **Princípio cristalizado** (memória `feedback_bula_e_infraestrutura_cognitiva_no_fluxo_prescricao_27_05`): *"médico prescreve, sistema documenta"*
- **Matrix Z2** = compressão estrutural permitida, **abstração clínica proibida** (memória `feedback_compressao_estrutural_vs_abstracao_clinica_27_05`)

**Severidade residual:** BAIXA (multi-camada de controle)

### H2 — Vazamento de PII em texto livre da IA

**Descrição:** Nome completo de paciente aparecer em `clinical_rationalities.assessment` (visto empiricamente em 4/5 rows recentes em audit 26/05).

**Controle implementado:**
- **V1.9.452 (29/05)**: Edge `tradevision-core` v423 com `sanitizeRationalityPII` + `lookupPatientName` patcheando 2 INSERTs (linhas 1723+2287)
- **Backfill 132 rows** via PL/pgSQL replicando lógica JS `casePseudonymization.ts` V1.9.407
- **Telemetry `pii_sanitized=true`** em metadata

**Severidade residual:** BAIXA (controle automático)

### H3 — Falha de consentimento (Consentimento ≠ Agendamento)

**Descrição:** Sistema interpretar "concordo" durante revisão clínica como autorização de agendamento.

**Controle implementado:**
- **REGRA HARD §1** constitucional (anti-kevlar §1)
- **Lock V1.9.95** AEC + Relatório + Agendamento selado 27/04/2026
- **AEC Gate V1.5** (V1.9.95-A reforçado) bloqueia agendamento durante AEC ativa
- **Guard `isAskingConsent`** em `tradevision-core/index.ts`

**Severidade residual:** MUITO BAIXA (4 camadas de defesa)

### H4 — Assinatura ICP-Brasil falha ou é falsificada

**Descrição:** PDF assinado não é reconhecido pelo Portal ITI OU assinatura é gerada sem cert válida.

**Controle implementado:**
- **Lock V1.9.299** PBAD AD-RB CONFORME ITI (16/05/2026)
- **Validação smoke ITI** obrigatória: openssl asn1parse + validar.iti.gov.br + diff binário
- **V1.9.457** auth + ownership check na Edge `sign-pdf-icp` v22

**Severidade residual:** BAIXA (validação ITI explícita)

### H5 — Alucinação IA com conteúdo clínico inventado

**Descrição:** GPT-4o gera informação clínica que não vem de fonte autoritativa.

**Controle implementado:**
- **VERBATIM FIRST V1.9.86**: ~46% bypass GPT em hard-lock phases
- **Princípio Grounding factual**: GPT NUNCA responde número factual sem fonte autoritativa
- **Matrix Z2 Bula como material marcado** (V1.9.468-B): cita literal, NUNCA sintetiza cross-bulas, NUNCA infere interação não-documentada

**Severidade residual:** MÉDIA (depende de uso responsável)

### H6 — Trauma de paciente em conversa AEC

**Descrição:** Conversa com Nôa desencadear trauma psicológico em paciente vulnerável.

**Controle implementado:**
- **COS KERNEL Porta Trauma** (camada 1 da pirâmide)
- **Lock V1.9.388-A.3** componente WMA (Declaração Helsinki)

**Severidade residual:** BAIXA (controle constitucional)

### H7 — Falha de RLS expondo dados de paciente

**Descrição:** Médico A ver dados de paciente do médico B sem autorização.

**Controle implementado:**
- **100% das 144 tabelas com RLS ON**
- **Audit empírico**: 447 policies, 0 sem `SET search_path`
- **V1.9.98** chat-images bucket fechado (28/04)

**Severidade residual:** BAIXA (cobertura validada)

### H8 — Edge Function sem JWT verify expõe API

**Descrição:** Edge `tradevision-core` com `verify_jwt=false` permite qualquer caller invocar GPT-4o.

**Controle implementado:** ❌ **PENDENTE**
- Empíricamente confirmado 29/05: `tradevision-core` v423 ainda com `verify_jwt=false`
- Documentado em A1 do roadmap, requer validação de callers antes de flippar

**Severidade residual:** **MÉDIA-ALTA** (gap conhecido — Sprint A pendente)

### H9 — Loop infinito IA (CONSENSUS_REPORT)

**Descrição:** Pipeline travar em fase CONSENSUS_REPORT consumindo tokens sem fim.

**Controle implementado:**
- **V1.9.473** escape CONSENSUS_REPORT loop via CONSENSUS_NOTES
- **TOKEN MGMT V1.9.61** cap 60k tokens

**Severidade residual:** BAIXA (controles ativos)

### H10 — Modificação não-autorizada de signature_hash

**Descrição:** UPDATE direto via SQL alterando `signature_hash` de relatório assinado.

**Controle implementado:**
- **RLS policies** bloqueiam UPDATE no signature_hash exceto via Edge `sign-pdf-icp`
- **Trigger AFTER UPDATE** registra modificação em `cognitive_events`
- **Lock V1.9.299** declara campo imutável após signed_at

**Severidade residual:** BAIXA (controle múltiplo)

## 3. Matriz de risco (Severidade × Probabilidade)

| Hazard | Severidade | Probabilidade | Risco residual | Aceitação |
|---|---|---|---|---|
| H1 | Crítica | Muito Baixa | Baixo | ✅ Aceitável |
| H2 | Alta | Baixa (pós V1.9.452) | Baixo | ✅ Aceitável |
| H3 | Crítica | Muito Baixa | Baixo | ✅ Aceitável |
| H4 | Crítica | Baixa | Baixo | ✅ Aceitável |
| H5 | Alta | Média | Médio | ⚠️ Monitorar |
| H6 | Alta | Baixa | Baixo | ✅ Aceitável |
| H7 | Crítica | Muito Baixa | Baixo | ✅ Aceitável |
| H8 | Alta | Média | **Médio-Alto** | ❌ **MITIGAR (Sprint A)** |
| H9 | Média | Baixa | Baixo | ✅ Aceitável |
| H10 | Crítica | Muito Baixa | Baixo | ✅ Aceitável |

## 4. Plano de mitigação dos riscos médio-alto

### H8 (tradevision-core verify_jwt=false) — Plano Sprint A

1. Mapear callers via grep: `grep -rn "tradevision-core" src/`
2. Validar que todos usam `supabase.functions.invoke()` (auto-injeta JWT) e não `fetch()` direto
3. Deploy Edge `tradevision-core` SEM `--no-verify-jwt`
4. Smoke empírico: requisição sem JWT → 401 esperado
5. Smoke empírico: requisição com JWT → 200 esperado
6. Documentar em diário + memória `feedback_*`

### H5 (alucinação IA) — Monitoramento contínuo

- Cadência mínima `clinical_qa_runs` (princípio cristalizado 26/05)
- Telemetria `metadata.simbologia` no painel Observabilidade IA (V1.9.374)
- Smoke trimestral por amostragem de 10 reports aleatórios

## 5. Não-conformidades históricas conhecidas (transparência)

| Período | Não-conformidade | Resolução |
|---|---|---|
| 25/05 → 29/05 (28d) | PII em `clinical_rationalities.assessment` | Resolvido V1.9.452 |
| 17/05 → 17/05 (6 casos em 21h) | DOC_LIST hijacking pós-V1.9.308 | Revertido V1.9.318 |
| 22/05 → 29/05 (7d) | `tradevision-core` verify_jwt=false documentado errado | Em Sprint A |
| 28/04 → 28/04 | chat-images bucket público | Resolvido V1.9.98 |

## 6. Conformidade ISO 14971 §9 — Análise de aceitabilidade

A combinação de:

- **Pirâmide 8 camadas** (defense in depth)
- **11 locks com tag git imutável** com tag git imutável
- **649 commits/30d** rastreáveis
- **284 memórias persistentes** documentando lessons learned
- **42 reports ICP-Brasil signed** validados empiricamente

...estabelece um **perfil de risco aceitável** para classificação SaMD Classe IIa, **condicionado** à resolução do H8 (Sprint A) antes de submissão regulatória.

---

**Aprovação:**
- [ ] RT habilitado: ________________ Data: ___/___/___
- [ ] Médico Sócio (validação clínica): Dr. Ricardo Valença — Data: ___/___/___
- [ ] Consultora SaMD: ________________ Data: ___/___/___
- [ ] Tech Lead: Pedro Henrique Passos Galluf — Data: 29/05/2026 (draft)

---

<a name="05_pop-prj-002_processo_de_desenvolvimento"></a>

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

---

<a name="06_pop-qas-001_auditoria_interna"></a>

# POP-QAS-001 — Auditoria Interna do SGQ

**Versão draft:** 0.1 (29/05/2026)
**Status:** DRAFT pré-consultora SaMD
**Referência normativa:** ISO 13485:2016 §8.2.2

---

## 1. Objetivo

Estabelecer o processo formal de auditoria interna do SGQ MedCannLab, garantindo verificação periódica e independente de:

- Conformidade com SGQ documentado
- Eficácia dos controles implementados
- Identificação de não-conformidades e oportunidades de melhoria
- Aderência aos princípios constitucionais (anti-kevlar §1, REGRA HARD §1)

## 2. Framework PMF Audit (V1.9.85 — Memo 28/04/2026)

A tabela `clinical_qa_runs` é o **instrumento primário de auditoria** já implementado, com 17 colunas estruturadas:

```
id, run_at, system_version, verdict, verdict_score,
log_findings, db_findings, code_findings,
green_facts, yellow_hypotheses, orange_interpretations, red_blindspots,
notes, metadata, created_at, updated_at, run_by
```

### 2.1. Classificação semântica obrigatória (cristalizada em CLAUDE.md)

```
🟢 GREEN_FACTS         Fatos validados empiricamente (PAT smoke + log + código)
🟡 YELLOW_HYPOTHESES   Hipóteses razoáveis mas não validadas (inferência)
🟠 ORANGE_INTERPRETS   Interpretações narrativas (alta variância semântica)
🔴 RED_BLINDSPOTS      Pontos cegos conhecidos (o que NÃO foi possível verificar)
```

Princípio cristalizado (memória `feedback_separar_fontes_e_calibrar`): **NÃO misturar Supabase atual + código antigo + narrativa**. Separar fontes e calibrar com cores antes de qualquer conclusão.

## 3. Cadência mínima de auditoria

### 3.1. Cadência cristalizada (memória `feedback_clinical_qa_runs_cadencia_minima_26_05`)

1. **1 QA run por nova versão V1.9.X** que tocar código clínico (AEC FSM / Pipeline / Verbatim / signature / RAG)
2. **1 QA run quinzenal** num report aleatório (rotação Claude/Pedro/Ricardo)
3. **1 QA run OBRIGATÓRIA pré-Marco 2** em report do 1º paciente externo pagante

### 3.2. Custo estimado

~1h Claude + ~30min review humano = ~1h30min por run.
Cadência mínima ~2/mês ≈ **3h/mês overhead**.

### 3.3. Risco de NÃO fazer

Chegada Marco 2 sem baseline empírico de validação clínica = recurso fica indemonstrável para investidor / regulador / 2º médico independente.

Frase âncora Memo 28/04: *"Crítico instrumentar AGORA. Quando paciente externo entrar, baseline já existe pra comparação."*

## 4. Métodos de auditoria

### 4.1. Auditoria de Edge Functions

```bash
# Listar todas as Edges + versão + verify_jwt
curl -s "https://api.supabase.com/v1/projects/itdjkfubfzmvmuxxjoae/functions" \
  -H "Authorization: Bearer <PAT>"

# Verificar lock V1.9.299 PBAD ICP-Brasil intacto
diff <(grep -A10 "PA_AD_RB_V24_OID" supabase/functions/sign-pdf-icp/index.ts) \
     <(git show v1.9.299-pbad-conforme-locked:supabase/functions/sign-pdf-icp/index.ts | grep -A10 "PA_AD_RB_V24_OID")
```

### 4.2. Auditoria de schema do banco

```sql
-- Cobertura RLS (esperado: 100%)
SELECT COUNT(*) AS tabelas_com_rls, 
       COUNT(*) FILTER (WHERE rls_enabled) AS rls_on
FROM (SELECT t.tablename, c.relrowsecurity AS rls_enabled
      FROM pg_tables t JOIN pg_class c ON c.relname = t.tablename
      WHERE t.schemaname = 'public') x;

-- Triggers críticos ativos
SELECT tgname, tgrelid::regclass AS tabela
FROM pg_trigger WHERE NOT tgisinternal
  AND tgrelid::regclass::text IN ('aec_assessment_state', 'clinical_reports', 'clinical_rationalities')
ORDER BY tabela, tgname;

-- Cron jobs ativos
SELECT jobname, schedule, command FROM cron.job ORDER BY jobname;
```

### 4.3. Auditoria de cobertura de testes empíricos

```sql
-- Telemetria custo IA últimos 7d
SELECT 
  metadata->>'simbologia' AS feature,
  COUNT(*) AS turns,
  ROUND(SUM(COALESCE((metadata->>'cost_usd_estimate')::numeric, 0)), 4) AS custo_usd_7d
FROM ai_chat_interactions
WHERE created_at > now() - interval '7 days'
GROUP BY 1 ORDER BY 3 DESC NULLS LAST;
```

### 4.4. Auditoria de aderência ao princípio "polir, não inventar"

Verificar que mudanças recentes reusam mecanismos existentes em vez de criar paralelos:

```bash
# Buscar duplicatas semânticas (anti-padrão)
grep -rn "pseudonymize\|sanitize.*PII\|test_run" src/lib/ | sort -u
```

## 5. Não-conformidades catalogadas (último mês)

### 5.1. Resolvidas

| Data | NC | Resolução | Versão |
|---|---|---|---|
| 28/04 | chat-images bucket público | RLS Opção B | V1.9.98 |
| 16/05 | DOC_LIST hijacking pós-V1.9.308 | Reverter para `base_conhecimento` | V1.9.318 |
| 25/05 | PII em `clinical_rationalities.assessment` | Sanitize + backfill 132 rows | V1.9.452 |
| 26/05 | Edge `sign-pdf-icp` sem auth check | Auth + ownership check | V1.9.457 |
| 29/05 | Coluna `clinical_reports.assessment` inexistente | Hotfix EvolutionDetailModal | V1.9.500-A |

### 5.2. Pendentes (transparência)

| Data flag | NC | Plano | Severidade |
|---|---|---|---|
| 29/05 | `tradevision-core` verify_jwt=false | Sprint A (validar callers) | MÉDIA-ALTA |
| 18/05 | Google Calendar tabelas vazias | Decisão pós-Marco 3 | BAIXA (dormindo) |
| 22/05 | WiseCare V4H homolog | Migrar pra produção | MÉDIA |
| Contínuo | Region us-east-1 (não BR) | sa-east-1 pós-LGPD pressure | BAIXA |

## 6. Pontos cegos conhecidos (RED_BLINDSPOTS)

Reconhecidos explicitamente (princípio cristalizado `feedback_claude_audit_diferenciar_validacao_de_descoberta_26_05`):

1. **Validação clínica externa = ZERO** — apenas Maria Pinto Pitoco como paciente real confirmado (memória `feedback_pacientes_reais_vs_testes_clinical_rationalities_27_05`)
2. **Carga real de produção = não testada** — capacidade máxima desconhecida
3. **Comportamento sob concorrência** — não há teste de stress
4. **Edge cases de RLS** — 447 policies, cobertura empírica pontual
5. **Aderência regulatória formal** — sem audit de auditor externo

## 7. Auditoria por consultoria externa (pós-CNPJ)

Após Marco 1 (CNPJ ativo + consultora contratada):

### 7.1. Auditoria de conformidade ISO 13485

Consultora deve verificar conformidade com:

- §4.2 Documentação (POP-CTL-001)
- §7.3 Projeto e desenvolvimento (POP-PRJ-002 + PLN-IEC-001)
- §7.5 Produção e provisão (Edge Functions deploy + RLS)
- §8.2 Monitoramento e medição (POP-QAS-001 atual + telemetria existente)
- §8.5 Melhoria contínua (PROC-CAPA-001)

### 7.2. Auditoria de gestão de risco ISO 14971

Consultora deve verificar conformidade com:

- §4 Análise de risco geral (RSK-001)
- §5 Avaliação de risco
- §6 Controle de risco
- §7 Avaliação de aceitabilidade de risco residual
- §9 Relatório de gestão de risco

## 8. Métricas de eficácia da auditoria

| Métrica | Atual | Meta pós-Marco 2 |
|---|---:|---:|
| `clinical_qa_runs` total | 2 | 12+ |
| Cobertura por versão V1.9.X tocando clínico | ~5% | 100% |
| NCs identificadas e resolvidas | 5 | Manter |
| NCs com plano de fix mas pendentes | 4 | <5 |
| Tempo médio detecção → fix | <48h (V1.9.452 levou 28d, anomalia) | <24h |

---

**Aprovação:**
- [ ] RT habilitado: ________________ Data: ___/___/___
- [ ] Consultora SaMD: ________________ Data: ___/___/___
- [ ] Tech Lead: Pedro Henrique Passos Galluf — Data: 29/05/2026 (draft)

---

<a name="07_pop-lbl-001_rotulagem_samd"></a>

# POP-LBL-001 — Rotulagem SaMD e Restrições Operacionais

**Versão draft:** 0.1 (29/05/2026)
**Status:** DRAFT pré-consultora SaMD
**Referência normativa:** ISO 13485:2016 §7.5.1.1.2 + RDC ANVISA 16/2013

---

## 1. Identificação do dispositivo médico

| Campo | Valor |
|---|---|
| Nome comercial | MedCannLab 3.0 |
| Classificação | Software as a Medical Device (SaMD) Classe IIa |
| Fabricante | (CNPJ a constituir — Marco 1) |
| Tipo | Plataforma HealthTech para Cannabis Medicinal com IA Residente |
| Versão | V1.9.501 (29/05/2026) — em desenvolvimento contínuo |
| Plataforma | Web (Vercel) + Mobile responsivo |

## 2. Finalidade declarada

MedCannLab é uma plataforma HealthTech/EdTech que apoia:

### 2.1. Eixo Clínica
- Conduzir Avaliação Estruturada com Cannabis (AEC) através de IA Residente Nôa Esperança
- Gerar relatórios clínicos estruturados (Pipeline Master v2)
- Documentar prescrições CFM com assinatura ICP-Brasil PBAD AD-RB
- Suportar follow-up de pacientes em uso de cannabis medicinal
- Sidecar para Doença Renal Crônica (DRC) e identificação de sinais neuro (TEA/TOD/TDAH)

### 2.2. Eixo Ensino
- Disponibilizar curso "Arte da Entrevista Clínica" (AEC)
- Simulação de pacientes com IA Residente para treinamento
- Avaliação de competências
- Mentoria com profissionais cadastrados

### 2.3. Eixo Pesquisa
- Fórum Cann Matrix para discussão científica
- Repositório de casos clínicos pseudonimizados
- Análise vetorial de corpus marcado pelo médico

## 3. Indicações de uso

### 3.1. Quem pode usar (autorizados)

- **Médicos** habilitados CRM ativo (verificação CFM API ou manual)
- **Pacientes** sob acompanhamento de médico cadastrado, com consentimento explícito (REGRA HARD §1)
- **Alunos** matriculados em curso AEC com cadastro validado
- **Administradores** designados pela governança MedCannLab

### 3.2. Como deve ser usado

- AEC conduzida pelo paciente com supervisão do médico responsável
- Decisões terapêuticas SEMPRE pelo médico (lock V1.9.388-A.3)
- Sistema gera **sugestões estruturadas**, **nunca prescrições autônomas**
- Documentação ICP-Brasil exige cert válida do médico

## 4. Contraindicações e restrições (CRÍTICO)

### 4.1. NÃO substitui consulta médica presencial inicial

MedCannLab é ferramenta **complementar**. Primeira consulta de avaliação cannabis medicinal deve seguir as orientações CFM 2.314 quanto a telemedicina E avaliação presencial quando aplicável.

### 4.2. NÃO é instrumento diagnóstico autônomo

A IA Nôa **não emite diagnóstico clínico**. Hipóteses diagnósticas geradas são **sugestões pra revisão médica** (lock V1.9.388-A.3 multi-camada).

### 4.3. NÃO substitui prescrição médica

Sistema documenta prescrição **feita pelo médico**. Não pode gerar prescrição autonomamente. Assinatura ICP-Brasil exige cert do próprio médico (Edge `sign-pdf-icp` v22 com auth + ownership check V1.9.457).

### 4.4. NÃO deve ser usado em emergência

Pacientes em **emergência médica** devem buscar atendimento presencial imediato. Sistema não tem capacidade de resposta a emergência.

### 4.5. Limitações de população

- Idade mínima recomendada: 18 anos (questões de consentimento)
- Pacientes pediátricos: requer responsável legal com consentimento próprio
- Gestantes/lactantes: requer avaliação caso-a-caso pelo médico
- Pacientes com transtornos psiquiátricos graves descompensados: requer supervisão presencial reforçada

## 5. Restrições técnicas

### 5.1. Conectividade

- Sistema requer conexão internet estável
- Funcionamento offline NÃO suportado (decisão arquitetural — princípio segurança LGPD)

### 5.2. Browser

- Browsers modernos: Chrome 90+ / Firefox 88+ / Safari 14+ / Edge 90+
- IE 11 NÃO suportado
- Webview de WhatsApp NÃO recomendado (pode quebrar fluxo OAuth)

### 5.3. Mobile

- Responsivo até 360px de largura
- Funcionalidades clínicas críticas otimizadas pra desktop ≥1024px

## 6. Avisos obrigatórios na interface (exibidos ao usuário)

### 6.1. Pré-AEC

> *"Você está iniciando uma Avaliação Estruturada com Cannabis (AEC) conduzida por IA. As informações que você fornecer serão registradas e compartilhadas com o médico responsável pelo seu acompanhamento. Em situações de emergência, busque atendimento presencial imediatamente."*

### 6.2. Pós-relatório IA

> *"Este relatório foi gerado com apoio de Inteligência Artificial e DEVE ser revisado por médico habilitado antes de qualquer decisão terapêutica. A IA não substitui avaliação clínica humana."*

### 6.3. Pré-prescrição

> *"Esta prescrição será assinada digitalmente com seu certificado ICP-Brasil. Verifique todos os dados antes de assinar. A assinatura é juridicamente vinculante."*

## 7. Versionamento e atualizações

### 7.1. Esquema de versão

V**1**.**9**.**X**[-**A/B/C**] onde:
- 1 = arquitetura cognitiva COS Kernel
- 9 = fase MedCannLab 3.0
- X = patch incremental
- -A/B = subfix do mesmo ciclo

### 7.2. Notificação de atualização

- Atualizações **patch (X)** são deployadas automaticamente via Vercel
- Atualizações **lock (V1.9.X selado)** disparam memória persistente + atualização CLAUDE.md
- Atualizações **constitucionais (Magno)** exigem consenso explícito Tech Lead + Médico Sócio

## 8. Suporte e contato

- **Tech Lead**: Pedro Henrique Passos Galluf (passosmir4@gmail.com)
- **Médico Sócio (Clínica)**: Dr. Ricardo Valença (rrvalenca@gmail.com)
- **Coordenador Ensino**: Dr. Eduardo Faveret (eduardoscfaveret@gmail.com)
- **Sócio Institucional**: João Eduardo Vidal (cbdrcpremium@gmail.com)
- **Canal Feedback**: `/app/feedback` no sistema (V1.9.486)
- **GitHub Issues**: https://github.com/OrbitrumConnect/medcannlab5/issues

## 9. Eliminação e descarte

Por se tratar de software, descarte segue procedimento de **anonimização e remoção LGPD**:

- Solicitação via canal Feedback
- Função `anonymize_user_safely` RPC remove PII preservando agregados estatísticos
- Backup retido por período legal LGPD (5 anos para dados sensíveis de saúde)
- Reports ICP-Brasil signed mantidos por exigência legal (audit Portal ITI)

## 10. Conformidade declarada

### 10.1. Já demonstrada empiricamente

- ✅ Versionamento disciplinado V1.9.X
- ✅ Documentação técnica densa (66 diários + 6 Magnos + 284 memórias)
- ✅ Locks selados (8 atuais)
- ✅ PII sanitization (V1.9.452)
- ✅ Assinatura ICP-Brasil PBAD CONFORME ITI (V1.9.299)
- ✅ Ancoragem regulatória multi-camada (V1.9.388-A.3)

### 10.2. Pendente formalização

- ❌ Submissão ANVISA Classe IIa (pós-Marcos 1-3)
- ❌ CE Mark (caminho EU, posterior a BR)
- ❌ Auditoria SaMD por terceiros (consultora pós-CNPJ)

---

**Aprovação:**
- [ ] RT habilitado: ________________ Data: ___/___/___
- [ ] Consultora SaMD: ________________ Data: ___/___/___
- [ ] Tech Lead: Pedro Henrique Passos Galluf — Data: 29/05/2026 (draft)

---

<a name="08_proc-capa-001_acao_corretiva_e_preventiva"></a>

# PROC-CAPA-001 — Ação Corretiva e Preventiva (CAPA)

**Versão draft:** 0.1 (29/05/2026)
**Status:** DRAFT pré-consultora SaMD
**Referência normativa:** ISO 13485:2016 §8.5.2 (Ação corretiva) + §8.5.3 (Ação preventiva)

---

## 1. Objetivo

Estabelecer o processo de **identificação, análise causa-raiz, implementação e verificação** de ações corretivas (CA) e preventivas (PA) no SGQ MedCannLab.

## 2. Identificação de oportunidades CAPA

### 2.1. Fontes empíricas validadas

| Fonte | Volume típico | Frequência |
|---|---|---|
| Bug flagrado por Pedro empíricamente via UI | ~5/semana | Contínua |
| Smoke PAT detectando NC em produção | ~2/semana | Contínua |
| Memória `feedback_*` cristalizada | ~3/semana | Contínua |
| Audit retroativo (`clinical_qa_runs`) | 1/quinzena | Cadência mínima |
| Erro flagrado pelo médico sócio (Ricardo) | ~1/semana | Contínua |
| Lessons learned de outras sessões IA | ~1/dia | Contínua |

### 2.2. Princípio fundamental cristalizado

> *"Validação empírica via screenshot > plano teórico"* (memória `feedback_validacao_empirica_screenshot_maior_que_plano_teorico_28_05`)

Pedro flagrou empíricamente 5 iterações falhadas Card Neuro/Renal antes de cristalizar esse princípio. Aplica-se a TODA refatoração futura.

## 3. Análise causa-raiz

### 3.1. Templates de análise por categoria de NC

#### Categoria A — Bug técnico (TypeScript / SQL / Edge)

Exemplo: V1.9.500-A coluna `clinical_reports.assessment` inexistente.

```
Sintoma: Modal Evolução abre com "column does not exist"
Causa imediata: SELECT incluía coluna inexistente
Causa raiz: Confundi schema de `clinical_rationalities` com `clinical_reports`
Causa sistêmica: Não validei schema empírico antes de SELECT
Lesson learned: SEMPRE rodar PAT smoke schema antes de SELECT em tabela "parecida"
Memória cristalizada: feedback_nao_chutar_uuid_quando_pat_disponivel_29_05
```

#### Categoria B — Drift arquitetural (acúmulo silencioso)

Exemplo: V1.9.452 PII em `clinical_rationalities.assessment` (28 dias backlog).

```
Sintoma: Nome completo de paciente em rows
Causa imediata: Edge tradevision-core não sanitizava antes do INSERT
Causa raiz: Função pseudonymizePatientReferences existia no frontend (V1.9.407) mas não era reusada no backend
Causa sistêmica: Princípio "polir, não inventar" não foi aplicado quando V1.9.407 foi criada
Lesson learned: Mover lógica de sanitização pra camada mais profunda (backend Edge)
Memória cristalizada: project_v1_9_452_pii_sanitize_clinical_rationalities_29_05
```

#### Categoria C — Falha de processo (não-aplicação de princípio existente)

Exemplo: Chutar UUID do Ricardo Valença em vez de validar via PAT.

```
Sintoma: 2 retries FK violation em smoke 20 AECs sintéticas
Causa imediata: UUID literal hardcoded inventado
Causa raiz: Não validei via PAT antes (tinha PAT na mão!)
Causa sistêmica: Recall vs. validação empírica — preguiça pontual
Lesson learned: ANTES de hardcoded UUID/ID em script SQL, validar empíricamente
Memória cristalizada: feedback_nao_chutar_uuid_quando_pat_disponivel_29_05 (Nível 1)
```

## 4. Implementação de ações corretivas (CA)

### 4.1. Fluxo padrão (exemplo V1.9.452)

| Passo | Evidência |
|---|---|
| 1. Documentar NC no diário | DIARIO_29_05_2026 Bloco K |
| 2. Análise causa-raiz | Memória `project_v1_9_452_*` |
| 3. Design de fix (reusando existente) | Helper `sanitizeRationalityPII` polish de `casePseudonymization.ts` |
| 4. Implementação | Edge `tradevision-core` v423 |
| 5. Backfill histórico | 132 rows via PL/pgSQL |
| 6. Smoke validação | Bug detectado "Pedro Paciente" → fix v2 |
| 7. Telemetria | `metadata.pii_sanitized=true` |
| 8. Cristalização | Lock V1.9.452 + memória Nível 1 |
| 9. Atualização CLAUDE.md | Pendência marcada como ✅ RESOLVIDA |

### 4.2. Critério de "fechamento" de CA

- [ ] Causa-raiz documentada em memória
- [ ] Fix implementado + commit + push 4 refs
- [ ] Smoke empírico PASS
- [ ] Backfill histórico se aplicável
- [ ] Telemetria evidencia comportamento esperado
- [ ] Memória persistente cristalizada (Nível 1 se princípio meta)
- [ ] CLAUDE.md atualizado

## 5. Implementação de ações preventivas (PA)

### 5.1. PA implementadas (exemplos)

| PA | Origem | Mecanismo |
|---|---|---|
| Type-check pré-commit obrigatório | NC histórica de bugs sintáticos | Hook git pre-commit (lint-staged) |
| RLS 100% nas 144 tabelas | NC histórica de vazamento | Migration + audit periódico |
| Backup WAL-G + diário | NC potencial de perda | Supabase Pro plan |
| Helper sanitize aplicado no INSERT | V1.9.452 (CA) | Edge tradevision-core v423 |
| Push 4 refs obrigatório | Risco de dessincronia entre remotes | Política operacional |
| Smoke PAT antes de declarar feature pronta | Validação empírica cristalizada | Princípio "polir, não inventar" |

### 5.2. PA prioritárias pendentes

| PA | Plano | Prazo |
|---|---|---|
| `clinical_qa_runs` cadência mínima 2/mês | Programar 14/06/2026 (quinzenal) | Próximo ciclo |
| Auditoria SGQ por consultora externa | Pós-CNPJ | Semana 1-2/06/2026 |
| Validação RT habilitado | Pós-CNPJ + contratação | Semana 2-4/06/2026 |
| Smoke ITI trimestral em PDFs ICP-Brasil | Calendar reminder | Cada trimestre |

## 6. Verificação de eficácia das ações

### 6.1. Métodos de verificação

1. **Smoke empírico** (PAT + UI + log) imediatamente após CA
2. **Telemetria contínua** (`ai_chat_interactions.metadata`, `cognitive_events`)
3. **Audit periódica** via `clinical_qa_runs`
4. **Memória persistente** documentando lessons learned

### 6.2. Indicadores de eficácia

| Indicador | Valor target | Valor atual |
|---|---|---|
| Recorrência de NC dentro de 30 dias | <5% | 0% (V1.9.452 nunca recorreu) |
| Tempo médio detecção → fix | <48h | <24h (média últimos 30d) |
| % memórias cristalizadas com fix completo | 100% | ~95% (5/5 NCs grandes 30d) |
| Smoke empírico aprovado pós-CA | 100% | 100% |

## 7. Catálogo de ações corretivas realizadas (último mês)

| Data | NC | CA | Versão | Verificação |
|---|---|---|---|---|
| 28/04 | chat-images bucket público | RLS Opção B (4 policies + signed URLs) | V1.9.98 | Empírico |
| 16/05 | DOC_LIST hijacking | Reverter para `base_conhecimento` curado | V1.9.318 | 6 casos antes vs 1 depois |
| 25/05 | PII em `assessment` | Sanitize + backfill 132 rows | V1.9.452 | Smoke "Pedro Paciente" |
| 26/05 | Edge `sign-pdf-icp` sem auth | Auth + ownership check | V1.9.457 | SMOKE 1+2 (401 esperado) |
| 29/05 | Coluna `assessment` inexistente | Hotfix EvolutionDetailModal | V1.9.500-A | Type-check + UI |

## 8. Ações preventivas em andamento

### 8.1. PA sistêmicas

- **Cadência `clinical_qa_runs`** programada quinzenal (próxima: 14/06/2026)
- **Sprint A irreversíveis** (PATs + verify_jwt) — pendente decisão sobre callers
- **SGQ formal documental** (este conjunto de drafts) — pré-consultora

### 8.2. PA arquiteturais

- **Validação de callers Edge** antes de qualquer flip de verify_jwt
- **Verificação automática** de schema antes de SELECT em script SQL (via PAT)
- **Princípio cristalizado**: validação empírica via screenshot > plano teórico

## 9. Registro de Conhecimento (lessons learned)

Diretório `memory/` mantém **284 memórias cristalizadas** classificadas:

- **feedback_** — princípios e correções (~80 arquivos)
- **project_** — informações operacionais (~120 arquivos)
- **reference_** — pointers externos (~40 arquivos)
- **user_** — perfil stakeholders (~20 arquivos)

Princípio cristalizado: **NÃO duplicar memórias**. Update preferível a criar nova.

---

**Aprovação:**
- [ ] RT habilitado: ________________ Data: ___/___/___
- [ ] Consultora SaMD: ________________ Data: ___/___/___
- [ ] Tech Lead: Pedro Henrique Passos Galluf — Data: 29/05/2026 (draft)

---

<a name="09_pop-val-001_validacao_clinica"></a>

# POP-VAL-001 — Validação Clínica Documental

**Versão draft:** 0.1 (29/05/2026)
**Status:** DRAFT pré-consultora SaMD (requer revisão Ricardo Valença + RT)
**Referência normativa:** ISO 13485:2016 §7.3.7 + IEC 62366-1 (Engenharia de Usabilidade)

---

## 1. Objetivo

Documentar a estratégia de validação clínica do MedCannLab 3.0 como SaMD Classe IIa, incluindo:

- Validação interna (sócios e usuários internos)
- Validação externa formal (pacientes externos pagantes — Marco 2)
- Critério de aceitabilidade clínica
- Plano de validação contínua pós-comercialização

## 2. Estado atual da validação (transparência empírica)

### 2.1. Validação interna realizada

| Validador | Papel | Período | Volume |
|---|---|---|---|
| Pedro Galluf | Tech Lead + paciente teste (UUID `d5e01ead`) | Maio/2026 contínuo | ~50 AECs incompletas |
| Ricardo Valença | Médico Sócio + admin REAL | Abril-Maio/2026 | ~40 reports gerados |
| Eduardo Faveret | Coordenador Ensino (operacional desde 27/05) | 27-29/05/2026 | ~5 sessões |
| Carolina Campello | Conta teste do Ricardo | Abril-Maio/2026 | ~7 reports |

### 2.2. Validação externa empírica

**ZERO pacientes externos pagantes** confirmados (Marco 2 pendente).

**1 paciente externo REAL** identificado (memória `feedback_pacientes_reais_vs_testes_clinical_rationalities_27_05`):
- **Maria das Dores Pinto Pitoco** — 3 rationalities + 1 sidecar renal
- Cadastrada por Ricardo no escopo de teste extendido

### 2.3. Taxa empírica TESTES vs REAIS

| Categoria | % |
|---|---:|
| Pacientes internos (sócios + amigos + testes Pedro/Ricardo) | ~96,9% |
| Pacientes externos potencialmente reais | ~2-3% |
| Pacientes externos REAIS validados clinicamente | ~0,8% (1 confirmada) |

**Frase âncora cristalizada:** *"NÃO declarar 'N pacientes acompanhados' usando contagem agregada — anti-overclaim Babylon/Watson."*

## 3. Estratégia de validação Marco 2 (1º paciente externo pagante)

### 3.1. Critérios de elegibilidade

Paciente que entrar via Marco 2 deve:

- Ser maior de 18 anos com plena capacidade legal
- Ter consentimento médico expresso (CFM 2.314)
- Pagar pela consulta (proxy de "uso real, não favor")
- Não ter vínculo profissional com MedCannLab nem com Pedro/Ricardo/Eduardo/João
- Concordar com Termo de Uso + Política de Privacidade LGPD
- Concordar explicitamente em participar de validação formal SaMD

### 3.2. Métricas obrigatórias de validação

Para cada paciente Marco 2, instrumentar:

| Métrica | Captura | Fonte |
|---|---|---|
| Tempo total AEC | `aec_assessment_state.last_update - started_at` | DB |
| Fases completadas | `completed_phases` array | DB |
| Taxa de Verbatim bypass | `metadata.verbatim_used` | ai_chat_interactions |
| Custo OpenAI | `metadata.cost_usd_estimate` | ai_chat_interactions |
| Latência turn | `processing_time` | ai_chat_interactions |
| Score Ricardo (1-10) | Manual via `clinical_qa_runs` | Formal |
| Score paciente (NPS-like) | Pós-AEC questionnaire | UI |
| Adesão Marco 3 (volta em 30d) | Cohort follow-up | DB |

### 3.3. Cadência `clinical_qa_runs` Marco 2

- 1 run **PRÉ-paciente externo** (baseline empírico) — instrumentação V1.9.85
- 1 run **AO FIM da primeira AEC externa** (validação imediata)
- 1 run **APÓS follow-up 30d** (validação clínica longitudinal)

## 4. Validação por papel

### 4.1. Médico Sócio (Ricardo Valença) — validação clínica primária

- Criador do método AEC → autoridade máxima sobre fidelidade ao método
- Camadas 0-2 da pirâmide (constitucional)
- Validação **antes de Marco 2** (já realizada empíricamente em ~40 reports internos)
- Validação **durante Marco 2** (formalizada via clinical_qa_runs)

### 4.2. Coordenador Ensino (Eduardo Faveret) — validação metodológica

- Operacional desde 27/05/2026 (memória `project_eduardo_faveret_no_app_sharing_validado_27_05`)
- Validação do eixo Ensino (cursos AEC + Simulações de Paciente)
- Validação cross-account (sharing entre médicos validado empíricamente)
- **Princípio meta cristalizado** durante uso real: *"IA admite limite em vez de fingir entender"* (memória `feedback_ia_admite_limite_em_vez_de_fingir_entender_27_05`)

### 4.3. RT habilitado (a contratar) — validação regulatória formal

- Pós-CNPJ
- Assinatura formal de documentos SGQ
- Auditoria de aderência a CFM 2.314 + 2.381 + RDC 327/2019 + LGPD

## 5. Validação técnica de output clínico

### 5.1. Validação automática (telemetria contínua)

```sql
-- Reports gerados com signature ICP-Brasil OK (Lock V1.9.299)
SELECT COUNT(*) FROM clinical_reports
WHERE signed_at IS NOT NULL AND signature_hash IS NOT NULL;
-- Atual empírico: 42 reports signed

-- Reports com racionalidades sanitizadas (V1.9.452)
SELECT COUNT(*) FROM clinical_rationalities
WHERE generated_by = 'noa_ai' AND assessment LIKE '%Paciente #%';
-- Atual empírico: 132 backfilled + novos

-- Reports com latência aceitável
SELECT 
  percentile_cont(0.5) WITHIN GROUP (ORDER BY processing_time) AS p50,
  percentile_cont(0.95) WITHIN GROUP (ORDER BY processing_time) AS p95
FROM ai_chat_interactions
WHERE created_at > now() - interval '7 days';
```

### 5.2. Validação manual obrigatória pré-Marco 2

Antes de receber 1º paciente externo pagante:

- [ ] Smoke completo de 1 AEC end-to-end por **Ricardo Valença**
- [ ] Validação de relatório gerado por **Eduardo Faveret** (cross-validation)
- [ ] PDF ICP-Brasil validado em validar.iti.gov.br
- [ ] Racionalidade integrativa gerada e revisada (V1.9.388-A.3)
- [ ] Sidecar renal disparado adequadamente se DRC presente
- [ ] Sidecar neuro disparado adequadamente se sinais TEA/TOD/TDAH presentes
- [ ] Documentação `clinical_qa_runs` registrada formalmente

## 6. Validação de usabilidade (IEC 62366-1)

### 6.1. Usuários primários identificados

- **Médicos especialistas** em cannabis medicinal e nefrologia (Ricardo)
- **Médicos generalistas** com interesse em cannabis (público alvo Marco 3+)
- **Pacientes** com indicação cannabis medicinal (público Marco 2+)
- **Alunos** de curso AEC (público interno)

### 6.2. Cenários de uso críticos validados internamente

| Cenário | Status validação |
|---|---|
| Paciente inicia AEC sozinho | ✅ Validado (Pedro paciente teste) |
| Médico cadastra paciente externo | ✅ Validado (pattern CFM-compliant memória `feedback_padrao_orfaos_*`) |
| Médico revisa relatório gerado | ✅ Validado (Ricardo + Eduardo) |
| Médico assina PDF ICP-Brasil | ✅ Validado empíricamente |
| Paciente compartilha com 2º médico | ✅ Validado (memória `feedback_share_overwrite_*`) |
| Paciente abandona AEC e retoma | ✅ Auto-pause detector V1.9.299 |
| Médico vê AEC interrompida e decide | ✅ V1.9.500 InterruptedAECsCard |

### 6.3. Cenários de uso críticos PENDENTES validação externa

- [ ] Paciente Marco 2 conclui AEC com avaliação ≥7/10
- [ ] Médico Marco 2.5 (independente externo) confirma qualidade clínica
- [ ] Múltiplos médicos em mesmo paciente (sharing)

## 7. Aceitabilidade clínica

### 7.1. Critérios mínimos para "validação Marco 2 PASS"

- ≥1 paciente externo pagante completa AEC integralmente
- ≥1 médico independente externo confirma qualidade do relatório
- 0 eventos adversos graves reportados
- Latência P95 < 12s mantida
- Custo médio por AEC < $1 USD

### 7.2. Critério para "validação Marco 3 PASS" (PMF declarável)

- ≥20-30 pacientes externos pagantes
- ≥2 médicos independentes externos usando regularmente
- NPS médico ≥50
- NPS paciente ≥40
- Taxa retenção 30d ≥70%

## 8. Validação pós-comercialização (pós-Marco 4)

### 8.1. Surveillance ativa

- Telemetria contínua via `ai_chat_interactions`
- `clinical_qa_runs` cadência mínima 2/mês
- Audit trimestral por RT
- Audit anual por consultora SaMD

### 8.2. Reporte de eventos adversos (post-market surveillance)

Canal estabelecido: `/app/feedback` (V1.9.486) com escalação urgente automatizada para casos graves.

---

**Aprovação:**
- [ ] RT habilitado: ________________ Data: ___/___/___
- [ ] Médico Sócio (validação clínica): Dr. Ricardo Valença — Data: ___/___/___
- [ ] Consultora SaMD: ________________ Data: ___/___/___
- [ ] Tech Lead: Pedro Henrique Passos Galluf — Data: 29/05/2026 (draft)

---

<a name="10_man-sgq-001_manual_do_sgq"></a>

# MAN-SGQ-001 — Manual do Sistema de Gestão da Qualidade MedCannLab

**Versão draft:** 0.1 (29/05/2026)
**Status:** DRAFT pré-consultora SaMD
**Referência normativa:** ISO 13485:2016 §4.2.2

---

## 1. Introdução

Este manual descreve o Sistema de Gestão da Qualidade (SGQ) da MedCannLab 3.0, plataforma HealthTech/EdTech de Cannabis Medicinal com IA Residente Nôa Esperança, classificada como Software as a Medical Device (SaMD) **Classe IIa**.

### 1.1. Sobre o MedCannLab

**MedCannLab 3.0** organiza-se em **3 eixos**:

- **Clínica** — AEC (Avaliação Estruturada Cannabis) + Relatórios + Agendamento + Prescrição ICP-Brasil
- **Ensino** — Cursos AEC + TRL + Simulações de Paciente + Mentoria
- **Pesquisa** — Fórum Cann Matrix + Casos clínicos + Análise vetorial

### 1.2. Sistema cognitivo de 8 camadas

O coração arquitetural do MedCannLab é a **pirâmide cognitiva de 8 camadas** (CLAUDE.md):

```
0. REGRA HARD §1 (constitucional)        "Consentimento ≠ Agendamento"
1. COS KERNEL v5.0                       5 portas (KillSwitch/Trauma/Metabolismo/ReadOnly/Policy)
2. AEC FSM (clinicalAssessmentFlow.ts)   13+ fases determinísticas
3. VERBATIM FIRST (V1.9.86)              ~46% bypass GPT em hard-lock phases
4. AEC GATE V1.5 (V1.9.95-A reforçado)   Bloqueia agendamento durante AEC ativa
5. GPT-4o-2024-08-06 / gpt-4o-mini       Só chamado se nada acima resolveu
6. PÓS-PROCESSAMENTO                     Strip tokens, validate UUID, force tags
7. PIPELINE ORCHESTRATOR                 REPORT → SCORES → SIGNATURE → AXES → RATIONALITY
```

**Princípio fundamental**: *"GPT é o último a falar e o primeiro a ser checado"*.

## 2. Política da Qualidade

A MedCannLab compromete-se com:

1. **Segurança clínica acima de capacidade IA** — médico sempre no loop (Lock V1.9.388-A.3)
2. **Privacidade de dados sensíveis de saúde** — LGPD Art. 11 com PII sanitization automática (V1.9.452)
3. **Conformidade regulatória multi-camada** — CFM + LGPD + ANVISA + EU AI Act + FDA SaMD + WMA
4. **Transparência de limitações** — IA admite limite em vez de fingir entender (memória `feedback_ia_admite_limite_*`)
5. **Auditabilidade radical** — todo lock + decisão + commit rastreável
6. **Polish, não invenção** — reusar mecanismo existente antes de criar paralelo (Princípio 8)
7. **Anti-Babylon by design** — médico sócio é usuário operacional, não board cosmético

## 3. Escopo do SGQ

### 3.1. Inclusões

- Desenvolvimento e manutenção do MedCannLab 3.0 SaMD Classe IIa
- 3 eixos operacionais (Clínica + Ensino + Pesquisa)
- 15 Edge Functions Supabase Deno
- 144 tabelas Postgres com RLS 100%
- Pipeline cognitivo IA Residente Nôa Esperança

### 3.2. Exclusões justificadas

- Hardware (não fabricamos dispositivo físico)
- Distribuição farmacêutica (não vendemos medicamentos)
- Laboratório clínico (não realizamos exames próprios)

## 4. Documentos do SGQ

### 4.1. Estrutura piramidal

```
Nível 1 — Constitucional
  └─ LIVRO_MAGNO_V1..V6.md (6 versões da Constituição)

Nível 2 — Procedimentos (este conjunto)
  ├─ POP-CTL-001 Controle de Documentos
  ├─ POP-CTL-007 Controle de Mudanças
  ├─ POP-PRJ-002 Processo de Desenvolvimento
  ├─ POP-QAS-001 Auditoria Interna
  ├─ POP-LBL-001 Rotulagem SaMD
  ├─ POP-VAL-001 Validação Clínica
  └─ PROC-CAPA-001 CAPA

Nível 3 — Planos e Análises
  ├─ PLN-IEC-001 Plano IEC 62304
  └─ RSK-001 Risk Management ISO 14971

Nível 4 — Registros operacionais
  ├─ DIARIO_*.md (66 diários técnicos)
  ├─ memory/*.md (284 memórias)
  ├─ CLAUDE.md (governança ativa)
  ├─ git log (histórico imutável)
  └─ ai_chat_interactions + clinical_qa_runs (telemetria + audit)
```

### 4.2. Hierarquia de autoridade documental

| Conflito | Vence |
|---|---|
| LIVRO_MAGNO vs CLAUDE.md | LIVRO_MAGNO |
| CLAUDE.md vs DIARIO_*.md | CLAUDE.md |
| DIARIO vs memória | DIARIO (registro temporal) |
| Recall vs PAT empírico | **PAT empírico SEMPRE** (princípio cristalizado 29/05) |

## 5. Responsabilidades organizacionais

### 5.1. Estrutura atual (pré-CNPJ)

| Papel | Pessoa | Email |
|---|---|---|
| Tech Lead / Orquestrador COS | Pedro Henrique Passos Galluf | passosmir4@gmail.com |
| Médico Sócio Clínica + criador AEC | Dr. Ricardo Valença | rrvalenca@gmail.com |
| Coordenador Ensino + Neurologia | Dr. Eduardo Faveret | eduardoscfaveret@gmail.com |
| Sócio Institucional / CNPJ / regulatório | João Eduardo Vidal | cbdrcpremium@gmail.com |

### 5.2. Estrutura pós-CNPJ (a constituir)

| Papel | Status |
|---|---|
| Diretor Técnico | Pedro Galluf (formal) |
| Diretor Médico | Dr. Ricardo Valença (formal) |
| Responsável Técnico habilitado | A contratar |
| Consultora SaMD | A contratar |
| DPO (Data Protection Officer) | A nomear |

## 6. Recursos

### 6.1. Recursos humanos

- 4 sócios ativos (Pedro / Ricardo / Eduardo / João)
- 0 funcionários CLT (pré-CNPJ)
- 1 IA Residente Nôa Esperança (operacional)
- Apoio Claude (Anthropic) como co-author técnico documentado

### 6.2. Recursos de infraestrutura

- **Supabase** (Postgres + Edge Functions + Auth + Storage) — projeto `itdjkfubfzmvmuxxjoae`
- **Vercel** (frontend deploy auto on push)
- **OpenAI** (GPT-4o-2024-08-06 + gpt-4o-mini)
- **WiseCare V4H** (vídeo — homolog, migrar pós-Marco 1)
- **Resend** (email transacional)
- **ITI** (cert ICP-Brasil PBAD AD-RB)

### 6.3. Recursos financeiros

- Pré-CNPJ: bootstrap pessoal dos sócios
- Custo OpenAI atual: ~$13.55 USD/14d (R$ 68 / 14 dias)
- Custo projetado pós-Marco 3: ~R$ 900/mês (5 médicos × 30 turns/dia)
- Custo SGQ Modelo C-IA: R$ 30-60K + 2-3m (vs R$ 60-120K do Modelo C tradicional)

## 7. Realização do produto

Detalhado em [POP-PRJ-002 Processo de Desenvolvimento](./05_POP-PRJ-002_Processo_de_Desenvolvimento.md) e [PLN-IEC-001 Plano IEC 62304](./03_PLN-IEC-001_Plano_IEC_62304_Classe_B.md).

## 8. Medição, análise e melhoria

Detalhado em [POP-QAS-001 Auditoria Interna](./06_POP-QAS-001_Auditoria_Interna.md) e [PROC-CAPA-001 CAPA](./08_PROC-CAPA-001_Acao_Corretiva_e_Preventiva.md).

### 8.1. Indicadores de performance do SGQ

| Indicador | Atual (29/05/2026) | Meta pós-Marco 2 |
|---|---:|---:|
| Versionamento disciplinado V1.9.X | 649 commits/30d | Manter |
| Cobertura RLS | 100% | Manter |
| Reports ICP-Brasil signed | 42 | 100+/mês pós-Marco 2 |
| PII sanitization | 132 backfill + automático | 100% |
| `clinical_qa_runs` cadência | 2 total | 2/mês contínuo |
| Hotfixes emergenciais | 1 em 30d | <2/mês |
| Memórias cristalizadas | 284 | Crescimento orgânico |

## 9. Marcos planejados

| Marco | Critério | Status | Prazo estimado |
|---|---|---|---|
| **Marco 1** | CNPJ ativo + RT contratado | ⏳ Em andamento | 30/05 - 06/06/2026 |
| **Marco 2** | 1º paciente externo pagante | ❌ Pendente | Pós Marco 1 |
| **Marco 2.5** | 2º médico independente externo | ❌ Pendente | Junho-Julho/2026 |
| **Marco 3** | 20-30 pacientes externos (PMF) | ❌ Pendente | Q3/2026 |
| **Marco 4** | Petição ANVISA Classe IIa | ❌ Pendente | Q4/2026 |

## 10. Compromisso com revisão contínua

Este Manual SGQ será revisado:

- A cada **lock V1.9.X selado** com impacto constitucional
- A cada **nova versão Livro Magno**
- A cada **6 meses** independente de mudanças
- **Imediatamente** após qualquer não-conformidade grave

## 11. Conformidade declarada

### 11.1. Padrões aderentes

- ✅ ISO 13485:2016 (em processo de formalização)
- ✅ IEC 62304:2006 Classe B (em processo de formalização)
- ✅ ISO 14971:2019 (análise de risco inicial completa — RSK-001)
- ✅ CFM 2.314/2.381 (telemedicina e prescrição digital)
- ✅ LGPD Art. 11 (dado sensível de saúde)
- ✅ ICP-Brasil PBAD AD-RB CONFORME ITI (validado empíricamente V1.9.299)
- ⚠️ ANVISA RDC 16/2013 (em fase de preparação para submissão)
- ⚠️ EU AI Act (aplicabilidade indireta via lock V1.9.388-A.3)

### 11.2. Disclaimer de status

Este documento é DRAFT **pré-consultora SaMD**. Deve ser revisado e formalizado por:

1. Consultora SaMD especializada (a contratar pós-CNPJ)
2. RT habilitado (CRF/CREA) assinante
3. Advogado especialista em saúde digital e LGPD

NÃO substitui auditoria formal por terceiros independentes.

---

## Frase âncora do Manual

> *"MedCannLab é HealthTech onde Constituição cognitiva, governança IA, e prática clínica empírica coexistem em rastreabilidade radical. O SGQ não é overlay regulatório — é manifestação formal da arquitetura que já existe nos commits, diários, memórias e locks selados."*

---

**Aprovação:**
- [ ] RT habilitado: ________________ Data: ___/___/___
- [ ] Diretor Médico: Dr. Ricardo Valença — Data: ___/___/___
- [ ] Diretor Técnico: Pedro Henrique Passos Galluf — Data: 29/05/2026 (draft)
- [ ] Consultora SaMD: ________________ Data: ___/___/___

---

## Fim do documento consolidado

**Geração:** 29/05/2026 — script de consolidação reusável (`docs/sgq/drafts/*.md` → consolidado)

**Aviso final:** Este é o pacote completo dos drafts. Submeter à consultora SaMD pós-CNPJ pra revisão + assinatura RT habilitado. NÃO substitui auditoria formal por terceiros independentes.
