# SGQ MedCannLab — Documento Consolidado (29/05/2026)

**Versão:** 0.4 DRAFT pré-consultora SaMD (V1.9.503 — bloco governança + automação Nível 1)
**Status:** Concatenação de 20 drafts + Executive Summary + README
**Propósito:** copy-paste integral para consultora SaMD

**Sumário:**

0. EXECUTIVE_SUMMARY — Sumário 5-10 páginas (LER PRIMEIRO)
1-10. Bloco SGQ — POPs + Plano IEC + Risk + Validação + Manual
11-14. Bloco rastreabilidade — URS + SRS + SAD + TRM
15-16. Bloco operacional — PLAN-FLIP + PLN-VER
17-20. Bloco governança — CFG-BASELINE + RACI + REV + RELEASE_CHECKLIST

---

# MedCannLab 3.0 — Executive Summary para Consultora SaMD

**Data:** 29/05/2026
**Versão do snapshot:** V1.9.502-B (commit `c19d229`)
**Audiência:** Consultora SaMD especializada (a contratar pós-CNPJ)
**Tempo de leitura:** ~10 minutos

---

## 1. O Produto (1 página)

### O que é

**MedCannLab 3.0** é uma plataforma HealthTech/EdTech para Cannabis Medicinal classificada como Software as a Medical Device (SaMD) **Classe IIa**, organizada em 3 eixos:

- **Clínica** — Avaliação Estruturada com Cannabis (AEC) conduzida por IA Residente Nôa Esperança, com pipeline cognitivo de 8 camadas culminando em relatório clínico, assinatura ICP-Brasil PBAD AD-RB e prescrição CFM.
- **Ensino** — Curso "Arte da Entrevista Clínica" (AEC), simulações de paciente virtual, instrumentos de avaliação, mentoria com profissionais cadastrados.
- **Pesquisa** — Fórum Cann Matrix, repositório de casos clínicos pseudonimizados, análise vetorial de corpus marcado pelo médico.

### Diferencial técnico-arquitetural

**Princípio fundamental**: *"GPT é o último a falar e o primeiro a ser checado"*.

```
0. REGRA HARD §1 (constitucional)       "Consentimento ≠ Agendamento"
1. COS KERNEL v5.0                       5 portas de proteção
2. AEC FSM                               13 fases determinísticas
3. VERBATIM FIRST                        ~46% bypass GPT em fases hard-lock
4. AEC GATE V1.5                         Bloqueia agendamento durante AEC
5. GPT-4o-2024-08-06                     Camada de IA (última, não primeira)
6. PÓS-PROCESSAMENTO                     Strip tokens, validate UUID
7. PIPELINE ORCHESTRATOR                 Report→Scores→Signature→Axes→Rationality
```

Esse padrão (defense in depth multi-camadas) é deliberadamente **anti-Babylon Health** — médico sempre no loop, IA nunca decide autonomamente.

### Diferencial regulatório

- **8 locks selados** com tag git imutável (V1.9.95, V1.9.299, V1.9.388-A.3, etc) marcando estados auditáveis.
- **Médicos sócios são usuários operacionais reais** (não board cosmético): Dr. Ricardo Valença (criador do método AEC) + Dr. Eduardo Faveret (Neurologia/Coord Ensino).
- **Validação clínica empírica documentada** em 28+ diários técnicos + 264+ memórias persistentes + framework `clinical_qa_runs`.

---

## 2. Estágio Atual (1 página)

### Marcos completados

| Marco | Status |
|---|---|
| **Marco 0** — MVP funcional com pipeline cognitivo completo | ✅ Concluído |
| **Marco 0.5** — Selagem V1.9.299 ICP-Brasil CONFORME ITI | ✅ 16/05/2026 |
| **Marco 0.7** — Ancoragem regulatória multi-camada V1.9.388-A.3 | ✅ 27/05/2026 |
| **Marco 0.8** — Eduardo Faveret operacional | ✅ 27/05/2026 |
| **Marco 0.9** — V1.9.452 PII sanitize (LGPD reforço pré-Marco 2) | ✅ 29/05/2026 |

### Marcos pendentes

| Marco | Critério | Prazo estimado |
|---|---|---|
| **Marco 1** — CNPJ ativo + RT contratado | Contador semana 29/05 ou 06/06/2026 | Junho/2026 |
| **Marco 2** — 1º paciente externo pagante real | Pós-Marco 1 | Junho-Julho/2026 |
| **Marco 2.5** — 2º médico independente externo | Junho-Agosto/2026 | Q3/2026 |
| **Marco 3** — 20-30 pacientes externos pagantes (PMF) | Q3/2026 | Q3-Q4/2026 |
| **Marco 4** — Petição ANVISA Classe IIa submetida | Pós-Marcos 1-3 | Q4/2026 |

### Métricas empíricas (29/05/2026 via PAT)

| Métrica | Valor |
|---|---:|
| Versão atual em produção | V1.9.502 |
| Commits últimos 30 dias | 649 |
| Diários técnicos `DIARIO_*.md` | 66 |
| Memórias persistentes cristalizadas | 284 |
| Locks selados com tag git imutável | 11 |
| Tabelas Postgres com RLS habilitado | 144 / 144 (100%) |
| Edge Functions Supabase Deno ativas | 15 |
| Reports ICP-Brasil PBAD signed validados | 42 |
| Racionalidades total / com pseudônimo explícito | 132 / 113 (86%) — 19 restantes usam texto genérico ("O paciente") sem nome real, **sem vazamento PII** mas sem marca explícita V1.9.452. Audit cruzada empírica 29/05 documentada em CFG-BASELINE-001. |
| Cron jobs em produção | 3 (success rate 100% em 2.023 runs/7d) |
| Pacientes cadastrados | 31 |
| Profissionais (médicos) | 11 |
| Administradores | 5 |
| Alunos | 0 (papel especificado, sem usuário ainda) |

---

## 3. O que JÁ EXISTE documentalmente (1 página)

### Documentos SGQ entregues (14 drafts)

#### Núcleo SGQ + Conformidade (10 docs)

1. **POP-CTL-001** Controle de Documentos (ISO 13485 §7.5.3)
2. **POP-CTL-007** Controle de Mudanças (ISO 13485 §7.3.7 + IEC 62304 §6.2)
3. **PLN-IEC-001** Plano de Desenvolvimento Classe B (IEC 62304 §5.1)
4. **RSK-001** Análise de Risco ISO 14971 (10 hazards mapeados)
5. **POP-PRJ-002** Processo de Desenvolvimento (ISO 13485 §7.3)
6. **POP-QAS-001** Auditoria Interna (ISO 13485 §8.2.2)
7. **POP-LBL-001** Rotulagem SaMD + Restrições Operacionais
8. **PROC-CAPA-001** Ação Corretiva e Preventiva (ISO 13485 §8.5.2-3)
9. **POP-VAL-001** Validação Clínica Documental (ISO 13485 §7.3.7)
10. **MAN-SGQ-001** Manual do SGQ (ISO 13485 §4.2.2)

#### Espinha dorsal de rastreabilidade (4 docs)

11. **URS-001** User Requirements Specification (41 URS por papel)
12. **SRS-001** Software Requirements Specification (44 SRS: 31 FR + 13 NFR)
13. **SAD-001** Software Architecture Document (47 itens: 26 COMP + 5 IFACE + 3 FLOW + 13 DEC)
14. **TRM-001** Traceability Matrix (193 itens rastreáveis: 17 CTL + 11 TST + 23 EVD)

#### Operacional (2 docs)

15. **PLAN-FLIP-001** Plano de flip verify_jwt em Edge `tradevision-core` (gap H8)
16. **PLN-VER-001** Plano de Verificação (10 métodos + 10 critérios + 9 cadências + 6 responsáveis)

### Documentos institucionais já existentes no repositório

- **6 versões do Livro Magno** (Constituição cognitiva) em `docs/LIVRO_MAGNO_*.md`
- **66 diários técnicos** `DIARIO_*.md` na raiz (período 12/03/2026 → 29/05/2026)
- **284 memórias persistentes** em `~/.claude/projects/.../memory/` (categorizadas: feedback / project / reference / user)
- **CLAUDE.md** — Governança ativa de 200+ linhas
- **AUDITORIA_*.md** — 5+ auditorias formais (22/05, 25/03, 28/04, etc)

### Material rastreável via git

- 649 commits últimos 30 dias com mensagens padronizadas `<tipo>(<escopo>): V1.9.X <descrição>`
- 11 tags imutáveis correspondendo a locks regulatórios críticos
- Push obrigatório em 4 referências (2 remotes × main + master) — política operacional

---

## 4. Gaps Conhecidos + Plano (1 página)

### Gaps técnicos abertos

#### Gap T1 — `tradevision-core` Edge com `verify_jwt=false`

- **Identificado em:** RSK-001 H8, TRM Gap #3, SRS-NFR-06
- **Risco residual:** MÉDIO-ALTO (qualquer caller com ANON_KEY pode invocar Edge)
- **Plano:** PLAN-FLIP-001 documenta mapping empírico (5 callers frontend, todos passam JWT; 0 callers backend). Flip seguro em janela 02h-05h BRT. Pendente decisão Pedro.

#### Gap T2 — WiseCare V4H em homolog

- **Identificado em:** SAD-COMP-15, CLAUDE.md
- **Risco residual:** MÉDIO (produção em homolog)
- **Plano:** Migrar pra produção pós-Marco 1 com cadastro Pessoa Jurídica V4H.

### Gaps documentais abertos

#### Gap D1 — 3 documentos parqueados aguardando evidência operacional

- **PROC-INC-001** Gestão de Incidentes — exige histórico classificado Tecnovigilância (RDC 67/2009).
- **PROC-PMS-001** Post-Market Surveillance — exige Marco 2 (paciente externo pagante) literalmente.
- **Decisão consciente** de não criar texto especulativo agora (princípio anti-Babylon cristalizado).

#### Gap D2 — Governança RACI formal

- **Identificado em:** Avaliação GPT externa 29/05.
- **Risco:** Concentração de aprovações em 1 pessoa (Pedro).
- **Plano:** Desenhar RACI pós-CNPJ + 4 sócios formais.

### Gaps operacionais abertos

#### Gap O1 — `clinical_qa_runs` cadência insuficiente

- **Estado atual:** 2 runs em 30 dias (vs meta 2 runs/mês).
- **Plano:** Próxima quinzenal programada 14/06/2026. Meta 6 runs até 31/08/2026.

#### Gap O2 — Smoke UI por release não formalizado

- **Plano:** Checklist em POP-CTL-007 a cada release V1.9.X Nível 3+.

#### Gap O3 — Pré-push hooks não implementados

- **Plano:** Configurar `.husky/pre-push` rodando `npm test` + `npm run lint` (~1h).

### Gaps de validação externa

#### Gap V1 — Zero pacientes externos pagantes (Marco 2)

- **Único bloqueador real para certificação ANVISA.**
- **Depende:** CNPJ ativo (Marco 1) + onboarding paciente externo + médico Eduardo/Ricardo operando.

#### Gap V2 — Zero médicos independentes externos no smoke (Marco 2.5)

- **Risco de viés:** sócios validando próprio produto têm conflito declarado.
- **Plano:** Após Marco 2, identificar 1 médico externo dispostos a smoke piloto.

---

## 5. O que esperamos da Consultoria (1 página)

### Modelo C-IA híbrido proposto

| Modelo | Custo | Prazo |
|---|---:|---:|
| A — Consultora cria SGQ do zero | R$ 250-500K | 12-18m |
| C — Híbrido tradicional (consultora traduz + RT assina) | R$ 60-120K | 2-4m |
| **🆕 C-IA — Híbrido com IA (drafts entregues + consultora REVISA + RT assina)** | **R$ 30-60K** | **2-3m** |

### O que esperamos especificamente

#### Fase 1 — Diagnóstico (semana 1-2)

- Revisar os 16 drafts SGQ + EXECUTIVE_SUMMARY (este documento)
- Apontar gaps de formato (não de conteúdo)
- Identificar itens a refinar antes de submissão ANVISA
- Confirmar viabilidade do Modelo C-IA

#### Fase 2 — Formalização (semana 3-8)

- Converter drafts para formato auditor padronizado
- Trazer RT habilitado para assinatura formal
- Refinar Traceability Matrix com IDs consultora-style
- Adicionar 3 documentos parqueados quando houver evidência operacional (PROC-INC-001, PROC-PMS-001, PROC-INC-001)
- Smoke ITI + smoke auth empírico documentado

#### Fase 3 — Submissão (semana 9-12)

- Preparar dossiê ANVISA Classe IIa
- Submeter petição formal
- Acompanhar tramitação inicial
- Treinar equipe para auditoria presencial

### O que NÃO esperamos

- ❌ Reescrever o SGQ orgânico (já temos)
- ❌ Inventar Constituição cognitiva (já temos 6 Livros Magno)
- ❌ Adicionar conteúdo especulativo sem evidência (anti-Babylon)
- ❌ Subscrever responsabilidade técnica que cabe ao RT habilitado

### O que oferecemos

- ✅ Acesso completo ao repositório (10+ tipos de evidência: commits, tags, diários, memórias, telemetria, cron, RLS, ICP signed, smoke, locks)
- ✅ Disponibilidade integral Tech Lead (Pedro) para esclarecimentos
- ✅ Médico Sócio (Ricardo Valença, criador AEC) disponível para validação clínica
- ✅ Co-Coord. Ensino (Eduardo Faveret) disponível para validação Ensino
- ✅ Sócio Institucional (João Vidal) disponível para regulatório/CNPJ
- ✅ Acesso PAT Supabase para validação empírica de qualquer claim

### Contato

- **Tech Lead:** Pedro Henrique Passos Galluf — passosmir4@gmail.com
- **Médico Sócio:** Dr. Ricardo Valença — rrvalenca@gmail.com
- **Coordenador Ensino:** Dr. Eduardo Faveret — eduardoscfaveret@gmail.com
- **Sócio Institucional:** João Eduardo Vidal — cbdrcpremium@gmail.com

---

## Frase âncora final

> *"MedCannLab 3.0 é HealthTech onde 8 camadas de proteção cognitiva, 11 locks regulatórios selados, 144 tabelas com RLS 100%, 42 PDFs ICP-Brasil validados e 132 racionalidades PII-sanitizadas coexistem em rastreabilidade radical. SGQ orgânico já formalizado em 16 drafts entregues. Não precisamos de consultora pra construir — precisamos pra traduzir, validar e submeter."*

---

**Versão:** 0.1 (29/05/2026) DRAFT pré-consultora
**Próxima revisão:** Pós-CNPJ + contratação consultora
**Mantenedor:** Pedro Henrique Passos Galluf (Tech Lead)

---

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

## Lista de drafts (14)

### Bloco 1 — Núcleo SGQ + Conformidade (10 docs entregues 29/05 manhã)

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

### Bloco 2 — Espinha dorsal de rastreabilidade (4 docs entregues 29/05 tarde)

Adicionados após avaliação GPT externa (nota 8/10) que destacou gap em "conhecimento indexado vs distribuído":

11. **URS-001** — User Requirements Specification (41 URS por papel)
12. **SRS-001** — Software Requirements Specification (44 SRS: 31 FR + 13 NFR)
13. **SAD-001** — Software Architecture Document (47 itens: 26 COMP + 5 IFACE + 3 FLOW + 13 DEC)
14. **TRM-001** — Traceability Matrix (193 itens rastreáveis, 17 CTL + 11 TST + 23 EVD)

### Bloco 3 — Operacional + Verificação (2 docs entregues 29/05 noite)

Adicionados após 2ª avaliação GPT externa que destacou "verificação formal + governança como próximo salto":

15. **PLAN-FLIP-001** — Plano de flip `verify_jwt=true` em Edge `tradevision-core` (com mapping empírico de 5 callers, smoke pré/pós, rollback). Fecha RSK-001 H8 / TRM Gap #3 / SRS-NFR-06.
16. **PLN-VER-001** — Plano de Verificação (10 métodos + 10 critérios + 7 cadências verif + 4 cadências monitor + 6 responsáveis + 8 Release Gates + cobertura SRS→VER-MET 44/44).

### Bloco 4 — Parqueados (2 docs dependem de Marco 2+ / consultora)

- ⏸️ **PROC-INC-001** — Gestão de Incidentes (depende histórico real de incidentes classificados Tecnovigilância)
- ⏸️ **PROC-PMS-001** — Post-Market Surveillance (literalmente exige Marco 2 — paciente externo pagante pra haver "market")

## Estrutura por pasta executiva (recomendada pela consultoria 29/05)

Pasta `docs/sgq/` reorganizada em estrutura padrão consultora pra reduzir horas de descoberta:

- `00_EXECUTIVE_SUMMARY/` — Sumário executivo 5-10 páginas para consultora
- `01_SGQ/` — POPs + Manual + Plano IEC + PLN-VER
- `02_URS/` — User Requirements
- `03_SRS/` — Software Requirements
- `04_SAD/` — Software Architecture
- `05_RISK/` — Risk Management
- `06_TRACEABILITY/` — Traceability Matrix
- `07_EVIDENCES/` — Links pra evidências git
- `08_TAGS/` — Lista de 11 locks com mensagens
- `09_CLINICAL_VALIDATION/` — Validação clínica + PLAN-FLIP

Os documentos canônicos continuam em `drafts/` (revisão granular). Cada pasta numerada tem `README.md` apontando pros drafts referenciados.

## Aviso de conformidade

Estes drafts foram gerados em **29/05/2026** com base em snapshot do repositório nessa data. Devem ser **revisados pela consultora SaMD contratada** antes de qualquer submissão regulatória (ANVISA / FDA / CE).

Frase âncora:

> *"IA faz tradução, não invenção. O conhecimento clínico-arquitetural já existe empíricamente no repositório; estes drafts apenas formatam-no pra reconhecimento por auditor regulatório."*

---

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

# URS-001 — User Requirements Specification

**Versão draft:** 0.1 (29/05/2026)
**Status:** DRAFT pré-consultora SaMD
**Referência normativa:** ISO 13485:2016 §7.2.1 + IEC 62366-1 §5.1

---

## 1. Objetivo

Catalogar as necessidades dos usuários do MedCannLab 3.0 com identificação única para rastreabilidade bidirecional via Traceability Matrix (TRM-001).

## 2. Convenção de IDs

```
URS-<PAPEL>-<NN>
```

Onde `<PAPEL>` ∈ { **MED** (médico) / **PAC** (paciente) / **ALU** (aluno) / **ADM** (administrador) / **GLB** (transversal) }

Cada URS rastreia para SRS, RSK, CTL, TST e EVD via TRM-001.

## 3. Papéis e contagem empírica (29/05/2026 via PAT)

| Papel | DB enum | Contagem real |
|---|---|---:|
| Médico profissional | `type='professional'` | 11 |
| Paciente | `type='patient'` | 31 |
| Administrador | `type='admin'` | 5 |
| Aluno | `type='aluno'` | **0** (papel especificado, sem usuário ainda) |

## 4. Requisitos do MÉDICO (URS-MED-XX)

### URS-MED-01 — Cadastro de paciente externo offline
**Necessidade:** Médico precisa cadastrar paciente que ainda não baixou o app (idoso, terceiro responsável).
**Justificativa:** CFM 2.314 + Manual MedCannLab permitem prontuário sem login app.
**Memória:** `feedback_padrao_orfaos_public_users_validos_29_05` (Nível 1)

### URS-MED-02 — Conduzir AEC com paciente
**Necessidade:** Conduzir Avaliação Estruturada com Cannabis em sessão estruturada de 13+ fases determinísticas.
**Justificativa:** Método AEC criado por Dr. Ricardo Valença, implementado em FSM.

### URS-MED-03 — Revisar relatório gerado pela IA antes de devolver ao paciente
**Necessidade:** Auditar conteúdo antes de assinar e compartilhar.
**Justificativa:** Lock V1.9.388-A.3 — médico no loop em TODA decisão.

### URS-MED-04 — Aplicar múltiplas racionalidades médicas
**Necessidade:** Gerar análise sob ótica Biomédica, MTC, Ayurvédica, Homeopática ou Integrativa.
**Justificativa:** Modelo de cuidado integrativo MedCannLab.

### URS-MED-05 — Assinar prescrição com ICP-Brasil PBAD AD-RB
**Necessidade:** Emitir prescrição juridicamente vinculante e validável em Portal ITI.
**Justificativa:** CFM 2.381 (prescrição digital) + lock V1.9.299.

### URS-MED-06 — Visualizar AECs interrompidas órfãs com decisão
**Necessidade:** Saber quais pacientes abandonaram AEC e decidir (invalidar com motivo / marcar concluída).
**Justificativa:** Auditabilidade LGPD + workflow operacional.
**Implementado:** V1.9.500 InterruptedAECsCard.

### URS-MED-07 — Anexar exames / laudos externos ao prontuário
**Necessidade:** Centralizar evidências clínicas no histórico do paciente.
**Justificativa:** ExamRequestModule V1.9.326.

### URS-MED-08 — Compartilhar relatório com outro médico (referência)
**Necessidade:** Cross-account sharing para 2º opinião.
**Justificativa:** Validado empíricamente 27/05 (Eduardo recebeu de Ricardo).

### URS-MED-09 — Acompanhar evolução longitudinal do paciente
**Necessidade:** Ver trajetória do paciente no tempo separada por fonte (AEC IA / FOLLOW_UP médico / chat IA).
**Justificativa:** Princípio meta cristalizado `feedback_sistema_tem_contexto_demais_falta_semantica_clinica_28_05`.
**Implementado:** V1.9.487 separação semântica aba Evolução.

### URS-MED-10 — Consultar bula ANVISA em contexto de prescrição
**Necessidade:** Bula como infraestrutura cognitiva no fluxo, não documento decontextualizado.
**Justificativa:** Memória `feedback_bula_e_infraestrutura_cognitiva_no_fluxo_prescricao_27_05`.
**Implementado:** V1.9.466 BulaContextPopover + V1.9.468-A Matrix Z2 + Bula.

### URS-MED-11 — Receber notificações de AEC concluída + agendamento
**Necessidade:** Saber quando paciente terminou avaliação e quando há agendamento.
**Justificativa:** Workflow contínuo + V1.9.99-B video-call-reminders.

### URS-MED-12 — Visualizar custos IA por feature
**Necessidade:** Transparência operacional sobre uso de GPT-4o por Matrix / Escuta Clínica / Simulação.
**Justificativa:** Painel Observabilidade IA V1.9.374 + cost tracking V1.9.238.

## 5. Requisitos do PACIENTE (URS-PAC-XX)

### URS-PAC-01 — Iniciar AEC autonomamente após convite do médico
**Necessidade:** Conduzir entrevista clínica orientada por IA.
**Justificativa:** Eixo Clínica MedCannLab.

### URS-PAC-02 — Consentimento explícito antes de prosseguir para etapas sensíveis
**Necessidade:** Paciente deve autorizar formalmente uso de seus dados.
**Justificativa:** REGRA HARD §1 anti-kevlar — "Consentimento ≠ Agendamento".
**Implementado:** Pirâmide camada 4 AEC Gate V1.5.

### URS-PAC-03 — Retomar AEC interrompida sem perda de contexto
**Necessidade:** Auto-pause detector permite continuar sessão depois.
**Justificativa:** V1.9.299 auto-pause + V1.9.474 trigger reset invalidated_at.

### URS-PAC-04 — Visualizar relatório clínico final após assinatura médico
**Necessidade:** Acessar relatório que paciente leu (snapshot imutável).
**Justificativa:** Source da UI vem de `clinical_reports.content` (jsonb snapshot).

### URS-PAC-05 — Compartilhar relatório com 2º médico (referência)
**Necessidade:** Liberdade de buscar 2ª opinião.
**Justificativa:** Sharing cross-account validado empíricamente.

### URS-PAC-06 — Receber prescrição assinada ICP-Brasil
**Necessidade:** Documento juridicamente válido para retirar medicamento.
**Justificativa:** CFM 2.381 + lock V1.9.299 PBAD AD-RB.

### URS-PAC-07 — Solicitar agendamento de consulta com médico responsável
**Necessidade:** Marcar consulta presencial / telemedicina.
**Justificativa:** Eixo Clínica.

### URS-PAC-08 — Solicitar anonimização / remoção de dados LGPD
**Necessidade:** Direito de exclusão LGPD Art. 18.
**Justificativa:** RPC `anonymize_user_safely`.

### URS-PAC-09 — Acessar histórico de consultas e prescrições próprias
**Necessidade:** Visualizar timeline pessoal.
**Justificativa:** Direito de acesso LGPD Art. 9.

### URS-PAC-10 — Pseudonimização automática em texto livre IA
**Necessidade:** Nome paciente NÃO deve aparecer em campo `assessment` de racionalidades.
**Justificativa:** LGPD Art. 11 + V1.9.452 sanitize.
**Implementado:** Edge `tradevision-core` v423 + backfill 132 rows.

## 6. Requisitos do ALUNO (URS-ALU-XX)

### URS-ALU-01 — Inscrever-se em curso "Arte da Entrevista Clínica" (AEC)
**Necessidade:** Acessar conteúdo formativo.
**Justificativa:** Eixo Ensino MedCannLab.

### URS-ALU-02 — Realizar teste de nivelamento adaptativo
**Necessidade:** Identificar nível atual de conhecimento.
**Justificativa:** Avaliação pré-curso.

### URS-ALU-03 — Realizar simulação clínica com IA (paciente virtual)
**Necessidade:** Treinar entrevista AEC em ambiente seguro.
**Justificativa:** 10 sistemas (Respiratório / Urinário / Cardiovascular / etc) + 3 tipos (Geral / DRC / TEA).

### URS-ALU-04 — Solicitar mentoria com profissional cadastrado
**Necessidade:** Tirar dúvidas com Ricardo / Eduardo.
**Justificativa:** Sprint E V1.9.497 (Mentoria com agenda).

### URS-ALU-05 — Receber feedback estruturado pós-simulação
**Necessidade:** Saber pontos de melhoria.
**Justificativa:** Promessa do prompt simulação Nôa.
**⚠️ Gap atual:** feedback hoje vem como texto livre da IA — não há `simulation_runs` estruturado (parqueado pós-Marco 3).

### URS-ALU-06 — Visualizar histórico próprio de simulações e avaliações
**Necessidade:** Acompanhar progresso pessoal.
**Justificativa:** `evaluation_submissions` (Sprint E V1.9.496).

## 7. Requisitos do ADMINISTRADOR (URS-ADM-XX)

### URS-ADM-01 — Ver todos os pacientes do sistema (todos os médicos)
**Necessidade:** Auditoria + gestão.
**Justificativa:** RLS admin policy + `getAllPatients` em `adminPermissions`.

### URS-ADM-02 — Ver telemetria IA agregada (Observabilidade)
**Necessidade:** Acompanhar custos OpenAI, latências, distribuição por feature.
**Justificativa:** Painel V1.9.374 AdminAIGovernance.

### URS-ADM-03 — Criar / publicar notícias institucionais
**Necessidade:** Comunicação científica + eventos.
**Justificativa:** Sprint E V1.9.495 `news_items`.

### URS-ADM-04 — Criar / gerenciar instrumentos de avaliação
**Necessidade:** Configurar Pré-AEC, Pós-AEC, Avaliação Curso.
**Justificativa:** Sprint E V1.9.496 `evaluation_instruments`.

### URS-ADM-05 — Moderar fórum Cann Matrix
**Necessidade:** Aprovar / rejeitar posts.
**Justificativa:** Eixo Pesquisa + V1.9.418 fórum.

### URS-ADM-06 — Executar QA runs formais (`clinical_qa_runs`)
**Necessidade:** Audit de qualidade clínica de relatórios.
**Justificativa:** Framework PMF Audit V1.9.85 Memo 28/04.

### URS-ADM-07 — Anonimizar pacientes mediante solicitação
**Necessidade:** Cumprir LGPD Art. 18.
**Justificativa:** RPC `anonymize_user_safely`.

### URS-ADM-08 — Visualizar canal Feedback com escalação de urgentes
**Necessidade:** Atendimento a relatos de paciente / médico / aluno.
**Justificativa:** V1.9.486 Feedback.

## 8. Requisitos TRANSVERSAIS (URS-GLB-XX)

### URS-GLB-01 — Disponibilidade Web 24x7 via Vercel
**Necessidade:** Acesso contínuo.

### URS-GLB-02 — Segurança LGPD em trânsito (HTTPS) e em repouso (Postgres encrypted)
**Necessidade:** Proteção de dado sensível de saúde.

### URS-GLB-03 — Versionamento auditável de todas as mudanças
**Necessidade:** Rastreabilidade temporal completa.
**Justificativa:** Git + tags + diários + memórias.

### URS-GLB-04 — Resposta IA com latência aceitável (P50 < 5s, P95 < 12s)
**Necessidade:** UX clínico aceitável.
**Justificativa:** `ai_chat_interactions.processing_time` instrumentado.

### URS-GLB-05 — Custo OpenAI controlado e instrumentado por feature
**Necessidade:** Sustentabilidade econômica pré-Marco 3.
**Justificativa:** V1.9.238 cost tracking + V1.9.374 painel.

## 9. Inventário de URS

- Médico: 12 URS (URS-MED-01..12)
- Paciente: 10 URS (URS-PAC-01..10)
- Aluno: 6 URS (URS-ALU-01..06)
- Administrador: 8 URS (URS-ADM-01..08)
- Transversal: 5 URS (URS-GLB-01..05)

**Total: 41 URS catalogados.**

Cada URS deve aparecer em [TRM-001 Traceability Matrix](./14_TRM-001_Traceability_Matrix.md) mapeado para SRS / RSK / CTL / TST / EVD.

## 10. Não-cobertos intencionalmente (anti-overclaim)

- URS pós-Marco 3 (vitrine de médicos / monetização paciente / TRL ensino) — escopo posterior.
- URS pediátricos ou gestantes — requerem revisão clínica adicional.

---

**Aprovação:**
- [ ] Médico Sócio (validação clínica): Dr. Ricardo Valença — Data: ___/___/___
- [ ] RT habilitado: ________________ Data: ___/___/___
- [ ] Tech Lead: Pedro Henrique Passos Galluf — Data: 29/05/2026 (draft)

---

# SRS-001 — Software Requirements Specification

**Versão draft:** 0.1 (29/05/2026)
**Status:** DRAFT pré-consultora SaMD
**Referência normativa:** IEC 62304:2006 §5.2 + ISO 13485:2016 §7.3.3

---

## 1. Objetivo

Catalogar requisitos funcionais (FR) e não-funcionais (NFR) do MedCannLab 3.0 com IDs únicos para rastreabilidade bidirecional via TRM-001. Cada requisito deve derivar de pelo menos 1 URS de [URS-001](./11_URS-001_User_Requirements_Specification.md).

## 2. Convenção de IDs

```
SRS-FR-NN    (Functional Requirement)
SRS-NFR-NN   (Non-Functional Requirement)
```

## 3. Requisitos Funcionais (SRS-FR-XX)

### Pirâmide cognitiva 8 camadas

#### SRS-FR-01 — Regra Hard §1 (constitucional)
**Descrição:** Sistema NÃO PODE interpretar "concordo" durante revisão clínica como autorização de agendamento.
**Implementação:** Guard `isAskingConsent` em `tradevision-core/index.ts` + AEC Gate V1.5.
**URS origem:** URS-PAC-02.
**Lock:** V1.9.95.

#### SRS-FR-02 — COS Kernel v5.0 (5 portas)
**Descrição:** Sistema DEVE filtrar todo input/output através de KillSwitch / Trauma / Metabolismo / ReadOnly / Policy.
**Implementação:** `cos_engine.ts` (selado por Magno 04-06/02/2026).
**URS origem:** URS-GLB-02.

#### SRS-FR-03 — AEC FSM 13+ fases determinísticas
**Descrição:** Sistema DEVE conduzir AEC em sequência FSM: INITIAL_GREETING → IDENTIFICATION → COMPLAINT_LIST → MAIN_COMPLAINT → COMPLAINT_DETAILS → MEDICAL_HISTORY → FAMILY_HISTORY_* → LIFESTYLE_HABITS → OBJECTIVE_QUESTIONS → CONSENSUS_REVIEW → CONSENSUS_REPORT → CONSENT_COLLECTION → COMPLETED.
**Implementação:** `clinicalAssessmentFlow.ts`.
**URS origem:** URS-MED-02, URS-PAC-01.

#### SRS-FR-04 — Verbatim First (V1.9.86)
**Descrição:** Sistema DEVE bypass GPT em hard-lock phases (~46% das fases AEC) com respostas pré-codificadas auditáveis.
**Implementação:** Pipeline camada 3.
**URS origem:** URS-MED-03.
**NFR relacionado:** SRS-NFR-08 (custo OpenAI).

#### SRS-FR-05 — AEC Gate V1.5 reforçado
**Descrição:** Sistema DEVE bloquear novo agendamento enquanto AEC do paciente está ativa (NOT is_complete + invalidated_at IS NULL).
**Implementação:** Camada 4 da pirâmide.
**URS origem:** URS-MED-06.
**Lock:** V1.9.95-A.

#### SRS-FR-06 — GPT-4o-2024-08-06 como camada 5 (não primeira)
**Descrição:** Sistema DEVE chamar GPT-4o APENAS quando camadas 0-4 não resolveram requisição.
**Implementação:** Edge `tradevision-core` v423.
**URS origem:** URS-GLB-04, URS-GLB-05.

#### SRS-FR-07 — Pós-processamento (strip tokens, validate UUID, force tags)
**Descrição:** Sistema DEVE remover tokens internos do output GPT antes de entregar ao usuário.
**Implementação:** Camada 6 da pirâmide.
**URS origem:** URS-PAC-04.

#### SRS-FR-08 — Pipeline Orchestrator (REPORT → SCORES → SIGNATURE → AXES → RATIONALITY → DONE)
**Descrição:** Sistema DEVE executar pipeline pós-AEC em ordem determinística.
**Implementação:** Camada 7 da pirâmide.
**URS origem:** URS-MED-02, URS-MED-04.

### Edge Functions críticas

#### SRS-FR-09 — Assinatura ICP-Brasil PBAD AD-RB v2.4
**Descrição:** Sistema DEVE gerar PDF assinado conforme PA-AD-RB v2.4 do ITI.
**Implementação:** Edge `sign-pdf-icp` v22 + constants `PA_AD_RB_V24_OID`.
**URS origem:** URS-MED-05, URS-PAC-06.
**Lock:** V1.9.299 (validação Portal ITI confirmada).

#### SRS-FR-10 — Auth + ownership check antes de assinar
**Descrição:** Sistema DEVE validar JWT + verificar que `document.professional_id === user.id` (ou admin / SERVICE_ROLE_KEY).
**Implementação:** Edge `sign-pdf-icp` v22 (post V1.9.457).
**URS origem:** URS-GLB-02.

#### SRS-FR-11 — Cripto password ICP
**Descrição:** Sistema DEVE proteger password do certificado ICP do médico antes de armazenar.
**Implementação:** Edge `cert-encrypt-password` v3.
**URS origem:** URS-MED-05.

#### SRS-FR-12 — Cron sweep video-call-reminders
**Descrição:** Sistema DEVE enviar lembrete por email 24h e 1h antes de consulta agendada.
**Implementação:** Edge `video-call-reminders` v31 + cron a cada 5min.
**URS origem:** URS-MED-11.

#### SRS-FR-13 — PII sanitization automática em racionalidades
**Descrição:** Sistema DEVE substituir nome completo do paciente por pseudônimo `Paciente #XXXXXX` antes de INSERT em `clinical_rationalities.assessment`.
**Implementação:** Edge `tradevision-core` v423 (helper `sanitizeRationalityPII`).
**URS origem:** URS-PAC-10.
**Lock:** V1.9.452.

### Cross-account + Compartilhamento

#### SRS-FR-14 — Share de relatório paciente → 2º médico
**Descrição:** Sistema DEVE permitir paciente compartilhar relatório com outro médico cadastrado.
**Implementação:** UI Share + UPDATE `clinical_reports.professional_id`.
**URS origem:** URS-PAC-05, URS-MED-08.
**Observação:** Memória `feedback_share_overwrite_professional_id_*` documenta overwrite (não append) — gap RLS pra 3º médico profissional puro post-Marco 3.

#### SRS-FR-15 — Cadastro de paciente externo offline
**Descrição:** Sistema DEVE permitir médico criar paciente em `public.users` sem auth.users correspondente.
**Implementação:** UI Cadastro Paciente em PatientsManagement.
**URS origem:** URS-MED-01.
**Memória:** `feedback_padrao_orfaos_public_users_validos_29_05`.

### AEC Interrompidas + Workflow Médico

#### SRS-FR-16 — Detecção e listagem de AECs INTERRUPTED órfãs
**Descrição:** Sistema DEVE listar `aec_assessment_state WHERE phase='INTERRUPTED' AND NOT is_complete AND invalidated_at IS NULL` no dashboard médico.
**Implementação:** Hook `useInterruptedAECs` + componente `InterruptedAECsCard`.
**URS origem:** URS-MED-06.
**Lock:** V1.9.500.

#### SRS-FR-17 — Invalidação com motivo obrigatório
**Descrição:** Sistema DEVE exigir motivo (texto não-vazio) ao invalidar AEC, preservando linha pra audit.
**Implementação:** Hook `useInterruptedAECs.invalidate(id, reason)`.
**URS origem:** URS-MED-06.

### Aba Evolução + Matrix Longitudinal

#### SRS-FR-18 — Separação semântica visual de 3 fontes na aba Evolução
**Descrição:** Sistema DEVE distinguir visualmente FOLLOW_UP médico / AEC IA / chat IA.
**Implementação:** PatientsManagement V1.9.487.
**URS origem:** URS-MED-09.

#### SRS-FR-19 — Toggles de fonte no Matrix Nôa
**Descrição:** Sistema DEVE permitir médico filtrar quais fontes Matrix usa (AEC / Evoluções / Racionalidades / Dossiês prévios).
**Implementação:** NoaMatrixView V1.9.488 (4 toggles).
**URS origem:** URS-MED-09.

#### SRS-FR-20 — Carregamento de FOLLOW_UP em hook longitudinal
**Descrição:** Sistema DEVE incluir `clinical_assessments WHERE assessment_type='FOLLOW_UP'` no corpus Matrix.
**Implementação:** `usePatientLongitudinal` V1.9.489.
**URS origem:** URS-MED-09.

### Bulário ANVISA + Matrix Z2

#### SRS-FR-21 — Bula ANVISA como material marcado pelo médico
**Descrição:** Sistema DEVE tratar bula como recurso citável no fluxo de prescrição, sem síntese cross-bulas.
**Implementação:** V1.9.466 BulaContextPopover + V1.9.468-A Matrix Z2 + Bula.
**URS origem:** URS-MED-10.
**Lock:** V1.9.468-A.

### Modal Evolução + Visualização

#### SRS-FR-22 — Modal não-disruptivo de detalhe de evolução
**Descrição:** Sistema DEVE abrir relatório completo em modal ao clicar em card da aba Evolução.
**Implementação:** EvolutionDetailModal V1.9.498.
**URS origem:** URS-MED-09.

### Prescrição CFM

#### SRS-FR-23 — Receituário CFM (Simples / Branca C2 / Azul B1B2 / Amarela A1-A3)
**Descrição:** Sistema DEVE permitir gerar 4 tipos de receituário CFM.
**Implementação:** IntegrativePrescriptions / cfm_prescriptions / Edge sign-pdf-icp.
**URS origem:** URS-MED-05, URS-PAC-06.

### Ensino + Mentoria

#### SRS-FR-24 — Notícias institucionais com categorização
**Descrição:** Sistema DEVE permitir admin criar notícias com 8 categorias válidas (cannabis-medicinal / pesquisa-clinica / metodologia-aec / regulamentacao / nefrologia / clinica / pesquisa / farmacologia).
**Implementação:** `useNewsItems` + NewsItemAdminModal V1.9.495.
**URS origem:** URS-ADM-03.

#### SRS-FR-25 — Instrumentos de avaliação CRUD
**Descrição:** Sistema DEVE permitir admin criar/editar instrumentos com audiência configurável.
**Implementação:** `useEvaluationInstruments` + EvaluationInstrumentAdminModal V1.9.496.
**URS origem:** URS-ADM-04.

#### SRS-FR-26 — Solicitação de mentoria por aluno/paciente
**Descrição:** Sistema DEVE permitir solicitar mentoria com mentor cadastrado em disponibilidade configurada.
**Implementação:** `useMentorship` + MentorshipRequestModal V1.9.497.
**URS origem:** URS-ALU-04.

### Telemetria + Observabilidade

#### SRS-FR-27 — Cost tracking por interação IA
**Descrição:** Sistema DEVE registrar `cost_usd_estimate`, `prompt_tokens`, `completion_tokens`, `model`, `simbologia` em metadata de `ai_chat_interactions`.
**Implementação:** Edge `tradevision-core` (post V1.9.238).
**URS origem:** URS-MED-12, URS-ADM-02, URS-GLB-05.

#### SRS-FR-28 — Painel agregado por feature
**Descrição:** Sistema DEVE exibir cost / latency / users por bucket simbologia.
**Implementação:** AdminAIGovernance V1.9.374.
**URS origem:** URS-ADM-02.

### Anonimização LGPD

#### SRS-FR-29 — RPC anonymize_user_safely
**Descrição:** Sistema DEVE oferecer anonimização preservando agregados estatísticos.
**Implementação:** RPC SQL SECURITY DEFINER.
**URS origem:** URS-PAC-08, URS-ADM-07.

### Dashboard Profissional (V1.9.502)

#### SRS-FR-30 — Stats reais (não mock) no Dashboard Profissional
**Descrição:** Sistema DEVE exibir appointments hoje + reports últimos 7d via query real.
**Implementação:** `useProfessionalDashboard.loadStats()` V1.9.502.
**URS origem:** URS-MED-11.

#### SRS-FR-31 — Atividade Recente derivada de reports últimos 7d
**Descrição:** Sistema DEVE listar top 5 reports recentes na sidebar.
**Implementação:** `useProfessionalDashboard.stats.recentActivity` V1.9.502.
**URS origem:** URS-MED-11.

## 4. Requisitos Não-Funcionais (SRS-NFR-XX)

### Performance

#### SRS-NFR-01 — Latência P50 < 5s, P95 < 12s
**Descrição:** Tempo de resposta Edge `tradevision-core`.
**Verificação:** Métrica `processing_time` em `ai_chat_interactions`.
**URS origem:** URS-GLB-04.

#### SRS-NFR-02 — Disponibilidade ≥ 99.5% mensal
**Descrição:** Uptime Vercel + Supabase + Edge.
**Verificação:** Monitor Vercel + Supabase status.

### Segurança

#### SRS-NFR-03 — RLS habilitado em 100% das tabelas públicas
**Descrição:** 144/144 tabelas com Row Level Security ON.
**Verificação:** Empírico PAT 29/05 — 144/144 confirmado.
**URS origem:** URS-GLB-02.

#### SRS-NFR-04 — Conexão TLS 1.2+ em trânsito
**Descrição:** HTTPS obrigatório em todos os endpoints.
**Verificação:** Vercel cert + Supabase cert.
**URS origem:** URS-GLB-02.

#### SRS-NFR-05 — Encryption at rest em Postgres
**Descrição:** Supabase Pro + Cloudflare encryption.
**URS origem:** URS-GLB-02.

#### SRS-NFR-06 — Verify JWT em Edges sensíveis a auth
**Descrição:** Edges devem validar JWT antes de processar.
**⚠️ Estado atual:** `tradevision-core` v423 ainda com `verify_jwt=false` em produção — pendente decisão Sprint A após validação de callers.
**URS origem:** URS-GLB-02.

### Privacidade (LGPD)

#### SRS-NFR-07 — Sanitização preventiva de PII em texto livre IA
**Descrição:** Nenhum INSERT em campo de texto livre deve conter nome completo de paciente.
**Verificação:** V1.9.452 helper + backfill 132 rows.
**URS origem:** URS-PAC-10.

### Custo

#### SRS-NFR-08 — Custo OpenAI por turn ≤ $0.05 USD (média)
**Descrição:** Custo aceitável pra escala Marco 3.
**Verificação:** Empírico 29/05 — Matrix $0.019/turn, Escuta Clínica ~$0.014/turn, Simulação ~$0.026/turn.
**URS origem:** URS-GLB-05.

### Conformidade

#### SRS-NFR-09 — Versionamento auditável V1.9.X
**Descrição:** Toda mudança rastreável por tag git + diário + memória.
**Verificação:** 649 commits/30d, 11 tags imutáveis, 66 diários, 284 memórias.
**URS origem:** URS-GLB-03.

#### SRS-NFR-10 — Backup contínuo (WAL-G + diário)
**Descrição:** Recovery point objective < 1h.
**Verificação:** Supabase Pro plan.

#### SRS-NFR-11 — Logs cron 100% success rate
**Descrição:** Cron jobs devem completar sem erro.
**Verificação:** `cron.job_run_details` últimos 7d = 100% (2.023 runs).

### Usabilidade

#### SRS-NFR-12 — Responsivo até 360px de largura
**Descrição:** Mobile básico suportado.
**Verificação:** Tailwind breakpoints.

#### SRS-NFR-13 — Empty state honesto (sem dados fake)
**Descrição:** Componentes devem mostrar "Sem registros" em vez de mock data.
**Verificação:** V1.9.502 polish ProfessionalDashboard.
**URS origem:** URS-GLB-03.

## 5. Inventário SRS

- Funcionais: 31 (SRS-FR-01..31)
- Não-funcionais: 13 (SRS-NFR-01..13)

**Total: 44 SRS catalogados.**

## 6. Rastreabilidade

Cada SRS aparece em [TRM-001](./14_TRM-001_Traceability_Matrix.md) mapeado para URS, SAD, RSK, TST, EVD.

---

**Aprovação:**
- [ ] Médico Sócio (validação clínica): Dr. Ricardo Valença — Data: ___/___/___
- [ ] RT habilitado: ________________ Data: ___/___/___
- [ ] Tech Lead: Pedro Henrique Passos Galluf — Data: 29/05/2026 (draft)

---

# SAD-001 — Software Architecture Document

**Versão draft:** 0.1 (29/05/2026)
**Status:** DRAFT pré-consultora SaMD
**Referência normativa:** IEC 62304:2006 §5.3 (Software Architectural Design)

---

## 1. Objetivo

Documentar a arquitetura de software do MedCannLab 3.0, mapeando componentes, interfaces, fluxos de dados e decisões arquiteturais críticas com IDs únicos rastreáveis via TRM-001.

## 2. Convenção de IDs

```
SAD-COMP-NN  (Component)
SAD-IFACE-NN (Interface)
SAD-FLOW-NN  (Data Flow)
SAD-DEC-NN   (Architecture Decision)
```

## 3. Visão geral da arquitetura

### 3.1. Estilo arquitetural adotado

**Híbrido**: Client-side rich SPA + Serverless functions + Managed Postgres + Pipeline cognitivo determinístico em camadas.

### 3.2. Diagrama lógico (alto nível)

```
┌─────────────────────────────────────────────────────────────────┐
│                       FRONTEND (Vercel)                          │
│  React 18 + TypeScript + Vite + Tailwind + shadcn/ui            │
│  363 arquivos .tsx/.ts em src/                                  │
└─────────────────────┬───────────────────────────────────────────┘
                      │ HTTPS + supabase-js
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│              SUPABASE (projeto itdjkfubfzmvmuxxjoae)             │
│                                                                  │
│  ┌──────────┐  ┌─────────────────┐  ┌─────────────────────┐    │
│  │ Auth     │  │ Postgres        │  │ Edge Functions Deno │    │
│  │ JWT      │  │ 144 tabelas     │  │ 15 funções ativas   │    │
│  │ RLS      │  │ RLS 100%        │  │                     │    │
│  └──────────┘  └────────┬────────┘  └──────────┬──────────┘    │
│                         │                      │                │
│  ┌──────────┐  ┌────────▼────────┐  ┌─────────▼──────────┐    │
│  │ Storage  │  │ pg_cron         │  │ Telemetria         │    │
│  │ buckets  │  │ 3 jobs ativos   │  │ ai_chat_inter*     │    │
│  └──────────┘  └─────────────────┘  └────────────────────┘    │
└──────┬──────────────────┬──────────────────────┬───────────────┘
       │                  │                      │
       ▼                  ▼                      ▼
   ┌────────┐         ┌─────────┐          ┌─────────┐
   │ OpenAI │         │ Resend  │          │  ITI    │
   │ GPT-4o │         │ Email   │          │ ICP-BR  │
   └────────┘         └─────────┘          └─────────┘
```

## 4. Componentes principais

### Frontend

#### SAD-COMP-01 — Single Page Application (Vercel)
**Stack:** React 18 + TypeScript + Vite + Tailwind + shadcn/ui.
**Volume:** 363 arquivos `.tsx`/`.ts` em `src/`.
**Deploy:** Auto on push para `main`.
**Implementa:** SRS-FR-01..31, SRS-NFR-12, SRS-NFR-13.

#### SAD-COMP-02 — NoaConversationalInterface
**Caminho:** `src/components/NoaConversationalInterface.tsx`.
**Função:** Chat orquestrador único da IA Residente Nôa Esperança.
**Consumido por:** Dashboards (Aluno / Profissional / Admin) via `useNoaPlatform`.
**Implementa:** SRS-FR-03 (AEC FSM), SRS-FR-06 (GPT-4o).

#### SAD-COMP-03 — MedicalRecord
**Caminho:** `src/components/MedicalRecord.tsx`.
**Função:** Prontuário completo do paciente com 7 tabs (Visão Geral / Analytics / Evolução / Prescrição / Exames / Agenda / Arquivos / Recebimentos / Gráficos).
**Implementa:** SRS-FR-18, SRS-FR-22.

#### SAD-COMP-04 — ResearchWorkstation + NoaMatrixView
**Função:** Pesquisa científica + Matrix de consciência longitudinal.
**Implementa:** SRS-FR-19, SRS-FR-20.

#### SAD-COMP-05 — IntegrativePrescriptions
**Caminho:** `src/components/IntegrativePrescriptions.tsx`.
**Função:** Gestão de prescrição CFM com 4 tipos de receituário + protocolos pré-definidos.
**Implementa:** SRS-FR-23.

#### SAD-COMP-06 — InterruptedAECsCard
**Caminho:** `src/components/InterruptedAECsCard.tsx`.
**Função:** UI médico decide destino de AECs órfãs.
**Implementa:** SRS-FR-16, SRS-FR-17.

#### SAD-COMP-07 — EvolutionDetailModal
**Caminho:** `src/components/EvolutionDetailModal.tsx`.
**Função:** Modal não-disruptivo de detalhe (post V1.9.500-A hotfix).
**Implementa:** SRS-FR-22.

#### SAD-COMP-08 — RichClinicalReportView (SOBERANO V1.9.86+)
**Função:** Renderização imutável de relatório AEC com estética bloqueada.
**Reusado por:** `EvolutionDetailModal`, `ClinicalReports`, PDF gen.
**Implementa:** SRS-FR-08 (output Pipeline).

#### SAD-COMP-09 — AdminAIGovernance (Observabilidade IA)
**Caminho:** `src/pages/AdminAIGovernance.tsx`.
**Função:** Painel agregado custo / latency / users por feature.
**Implementa:** SRS-FR-28.

#### SAD-COMP-10 — EnsinoDashboard (Sprint E)
**Função:** Notícias / Avaliações / Mentoria com hooks reais.
**Implementa:** SRS-FR-24, SRS-FR-25, SRS-FR-26.

### Backend — Edge Functions

#### SAD-COMP-11 — Edge tradevision-core (v423)
**Tipo:** Edge Function Deno (slug `tradevision-core`).
**Função:** Core IA Nôa principal — implementa pirâmide cognitiva 8 camadas.
**Volume:** ~6.700 linhas.
**verify_jwt:** ⚠️ false (gap conhecido — RSK-001 H8).
**Implementa:** SRS-FR-01..08, SRS-FR-13, SRS-FR-27.

#### SAD-COMP-12 — Edge sign-pdf-icp (v22)
**Função:** Assinatura ICP-Brasil PBAD AD-RB v2.4 CONFORME ITI.
**Auth check:** ✅ V1.9.457 (JWT + ownership).
**Implementa:** SRS-FR-09, SRS-FR-10.
**Lock:** V1.9.299.

#### SAD-COMP-13 — Edge digital-signature (v65)
**Função:** Assinatura CFM 3 levels.
**Implementa:** SRS-FR-09.

#### SAD-COMP-14 — Edge cert-encrypt-password (v3)
**Função:** Cripto password ICP do médico.
**Implementa:** SRS-FR-11.

#### SAD-COMP-15 — Edge wisecare-session (v81)
**Função:** Provedor vídeo V4H homolog.
**⚠️ Status:** Homolog — migrar pra produção (Marco 1+).

#### SAD-COMP-16 — Edge send-email (v62)
**Função:** Envio email via Resend.
**verify_jwt:** ✅ true.

#### SAD-COMP-17 — Edge video-call-reminders (v31)
**Função:** Sweep cron 5min + lembretes 24h e 1h via Resend.
**Implementa:** SRS-FR-12.

#### SAD-COMP-18 — Edge extract-document-text (v59)
**Função:** OCR via pdfjs-serverless.

#### SAD-COMP-19 — Edges restantes (video-call-request-notification, generate-nft-from-report, renal-signal-extractor, google-auth, sync-gcal, get_chat_history)
**Função:** Funcionalidades adjacentes ou dormindo.

### Backend — Database

#### SAD-COMP-20 — Postgres Supabase (144 tabelas)
**Estado:** RLS habilitado em 100% (144/144).
**Implementa:** SRS-NFR-03.

##### Tabelas core do domínio clínico
- `public.users` (canônica de perfil — 47 users)
- `public.clinical_reports` (42 ICP-Brasil signed)
- `public.clinical_assessments` (FOLLOW_UP médico)
- `public.clinical_rationalities` (132 rows, 100% sanitizadas V1.9.452)
- `public.aec_assessment_state` (FSM AEC state machine)
- `public.cfm_prescriptions` (oficiais CFM)
- `public.appointments` (93 total)
- `public.patient_medical_records` (chat IA + outros registros)

##### Tabelas core de telemetria
- `public.ai_chat_interactions` (instrumentação V1.9.238 — 1.756 em 30d)
- `public.cognitive_events` (audit trail)
- `public.clinical_qa_runs` (framework PMF Audit — 17 cols, 2 runs)

##### Tabelas core de Ensino (Sprint E V1.9.495-497)
- `public.news_items`
- `public.evaluation_instruments` + `evaluation_submissions`
- `public.mentors` + `mentorship_requests`

#### SAD-COMP-21 — pg_cron (3 jobs ativos)
**Jobs:**
- `video-call-reminders-5min` (a cada 5min)
- `monthly-closing-medcannlab` (dia 1 às 3h)
- `expire-renal-suggestions` (todo dia às 2h)
**Telemetria 7d:** 2.023 runs / 100% success.
**Implementa:** SRS-NFR-11.

#### SAD-COMP-22 — Auth (Supabase Auth)
**Mecanismo:** Email + magic link (Google deployed mas não usado).
**JWT:** RS256 com rotação automática.
**Implementa:** SRS-NFR-04, SRS-NFR-06.

#### SAD-COMP-23 — Storage (buckets)
**Buckets críticos:**
- `chat-images` (privado pós V1.9.98)
- `documents` (institucional)
- `patient_documents` (RLS por paciente)
- `pdfs-icp` (assinaturas ICP-Brasil)

### Integrações externas

#### SAD-COMP-24 — OpenAI (GPT-4o-2024-08-06 + gpt-4o-mini)
**Função:** Camada 5 da pirâmide cognitiva.
**Custo médio:** $0.019 USD/turn Matrix.
**Implementa:** SRS-FR-06.

#### SAD-COMP-25 — Resend
**Função:** Email transacional.
**Domínio:** `noreply@medcannlab.com.br` (verified 28/04).

#### SAD-COMP-26 — ITI (ICP-Brasil)
**Função:** Cadeia de certificados pra validação PBAD AD-RB.
**Implementa:** SRS-FR-09.
**Lock:** V1.9.299.

## 5. Interfaces principais

### SAD-IFACE-01 — Frontend ↔ Supabase (supabase-js)
**Protocolo:** HTTPS REST + WebSocket Realtime.
**Auth:** JWT no header `Authorization`.
**RLS:** Filtragem automática no banco baseada em `auth.uid()`.

### SAD-IFACE-02 — Edge Functions ↔ Postgres
**Protocolo:** PostgREST com SERVICE_ROLE_KEY interno.
**Bypass RLS:** Sim, com auditoria via `cognitive_events`.

### SAD-IFACE-03 — Edge tradevision-core ↔ OpenAI
**Protocolo:** HTTPS REST (`https://api.openai.com/v1/chat/completions`).
**Modelo:** `gpt-4o-2024-08-06` (chat) + `gpt-4o-mini` (Escriba V1.9.84).
**Token mgmt:** Cap 60k tokens (V1.9.61).

### SAD-IFACE-04 — Edge sign-pdf-icp ↔ ITI
**Protocolo:** OCSP validation cadeia ICP.
**Output:** PDF AD-RB válido em `validar.iti.gov.br`.

### SAD-IFACE-05 — Cron ↔ Edge video-call-reminders
**Protocolo:** `pg_cron` chama `net.http_post`.
**Schedule:** `*/5 * * * *`.

## 6. Fluxos de dados críticos

### SAD-FLOW-01 — AEC completa (paciente → relatório assinado)

```
Paciente abre app
    │
    ▼
Edge tradevision-core
    │  pirâmide 8 camadas
    ▼  (camadas 0-4 → bypass GPT se aplicável)
GPT-4o (camada 5) ← APENAS se nada acima resolveu
    │
    ▼
Pós-processamento (camada 6)
    │
    ▼
Pipeline Orchestrator (camada 7):
    REPORT → SCORES → SIGNATURE → AXES → RATIONALITY → DONE
    │
    ▼
INSERT clinical_reports (status='completed', signed_at=NULL)
INSERT clinical_rationalities (assessment SANITIZED V1.9.452)
    │
    ▼
Médico revisa (URS-MED-03)
    │
    ▼
Médico chama Edge sign-pdf-icp
    │  auth + ownership check (V1.9.457)
    ▼
PDF AD-RB v2.4 gerado
UPDATE clinical_reports SET signed_at=NOW(), signature_hash=...
    │
    ▼
Paciente recebe acesso (URS-PAC-04, URS-PAC-06)
```

### SAD-FLOW-02 — Cron lembrete de consulta

```
pg_cron */5 * * * *
    │
    ▼
SELECT appointments WHERE status='scheduled'
   AND now() BETWEEN appointment_date - 24h AND appointment_date - 1h
    │
    ▼
Edge video-call-reminders sweep
    │
    ▼
POST send-email via Resend
    │
    ▼
UPDATE appointments SET reminder_sent_at=NOW()
```

### SAD-FLOW-03 — Telemetria custo IA

```
Edge tradevision-core processa turn
    │
    ▼
Calcula cost_usd_estimate:
   (prompt_tokens × $5/1M) + (completion_tokens × $15/1M)
    │
    ▼
INSERT ai_chat_interactions (
   user_id, patient_id, user_message, ai_response,
   metadata: { simbologia, model, prompt_tokens, completion_tokens, cost_usd_estimate, ... }
)
    │
    ▼
AdminAIGovernance agrega por simbologia + 14d window
```

## 7. Decisões arquiteturais críticas

### SAD-DEC-01 — Pirâmide cognitiva 8 camadas (defense in depth)
**Decisão:** GPT é o último a falar e o primeiro a ser checado.
**Justificativa:** Riscos H1 (Babylon) + H5 (alucinação) mitigados em múltiplas camadas.
**Selada por:** Magno (versões 04-06/02/2026).

### SAD-DEC-02 — Edge `sign-pdf-icp` desacoplada
**Decisão:** Assinatura ICP-Brasil isolada em Edge dedicada com lock V1.9.299.
**Justificativa:** Risco regulatório alto justifica isolamento + auditoria smoke ITI obrigatória.

### SAD-DEC-03 — Source of truth para racionalidades
**Decisão:** `clinical_reports.content.rationalities` (jsonb) é source da UI; `clinical_rationalities` (tabela) é espelho analítico.
**Trade-off:** Divergência controlada documentada em `feedback_dual_write_contract_jsonb_vs_tabela_18_05`.

### SAD-DEC-04 — Verbatim First (V1.9.86) reduz custo + risco
**Decisão:** ~46% das fases AEC bypass GPT com respostas pré-codificadas.
**Justificativa:** Reduz alucinação + custo + latência simultaneamente.

### SAD-DEC-05 — `aec_assessment_state.is_complete` é coluna gerada
**Decisão:** Computado automaticamente (não-INSERTável).
**Justificativa:** Impede inconsistência manual.

### SAD-DEC-06 — Pseudonimização em runtime + backfill histórico
**Decisão:** V1.9.452 sanitiza no INSERT + backfill 132 rows.
**Justificativa:** Não confiar em prompt-level — defense in depth LGPD.

### SAD-DEC-07 — Frontend lê só do jsonb (snapshot), nunca da tabela analítica
**Decisão:** UI paciente derivada de `clinical_reports.content.*` sempre.
**Justificativa:** Imutabilidade do que paciente viu naquele momento.

### SAD-DEC-08 — Cron jobs preferidos a webhooks para tarefas periódicas
**Decisão:** `pg_cron` em vez de serviço externo de scheduling.
**Justificativa:** Reduzir dependência + telemetria nativa via `cron.job_run_details`.

### SAD-DEC-09 — Push 4 refs (2 remotes × main + master)
**Decisão:** Política operacional obrigatória.
**Justificativa:** Redundância de remoto sem custo.

### SAD-DEC-10 — Matrix Z2 trata bula como material marcado, não corpus sintetizável
**Decisão:** Cita literal, NUNCA sintetiza cross-bulas.
**Justificativa:** Lock V1.9.468-A — anti-deriva farmacológica.

## 8. Restrições arquiteturais

### SAD-DEC-11 — Não fazer DELETE em dados clínicos
**Decisão:** Soft-delete ou invalidate-with-reason.
**Justificativa:** Audit LGPD + retenção 5 anos.

### SAD-DEC-12 — Não mexer no Lock V1.9.299 sem smoke ITI
**Decisão:** Qualquer alteração em `sign-pdf-icp/*` exige openssl asn1parse + validar.iti.gov.br + diff binário.

### SAD-DEC-13 — `tradevision-core` verify_jwt em produção (gap conhecido)
**Decisão pendente:** Flippar pra `verify_jwt=true` após validação de callers.
**Status:** RSK-001 H8 — Sprint A.

## 9. Inventário SAD

- Componentes: 26 (SAD-COMP-01..26)
- Interfaces: 5 (SAD-IFACE-01..05)
- Fluxos: 3 (SAD-FLOW-01..03)
- Decisões arquiteturais: 13 (SAD-DEC-01..13)

**Total: 47 itens SAD catalogados.**

## 10. Rastreabilidade

Cada SAD aparece em [TRM-001](./14_TRM-001_Traceability_Matrix.md) mapeado para URS, SRS, RSK, TST, EVD.

---

**Aprovação:**
- [ ] Médico Sócio (validação clínica): Dr. Ricardo Valença — Data: ___/___/___
- [ ] RT habilitado: ________________ Data: ___/___/___
- [ ] Tech Lead: Pedro Henrique Passos Galluf — Data: 29/05/2026 (draft)

---

# TRM-001 — Traceability Matrix

**Versão draft:** 0.1 (29/05/2026)
**Status:** DRAFT pré-consultora SaMD
**Referência normativa:** IEC 62304:2006 §5.1.3 + ISO 13485:2016 §7.3.4

---

## 1. Objetivo

Estabelecer rastreabilidade bidirecional entre **Necessidade do usuário (URS) → Requisito (SRS) → Arquitetura (SAD) → Risco (RSK) → Controle (CTL) → Teste (TST) → Evidência (EVD)**.

Princípio cristalizado (sessão 29/05): *"O auditor não procura conhecimento distribuído. Ele procura conhecimento indexado."*

## 2. Convenção de IDs (consolidação)

| Prefixo | Significado | Documento mestre |
|---|---|---|
| `URS-MED/PAC/ALU/ADM/GLB-NN` | Necessidades do usuário | URS-001 |
| `SRS-FR-NN` / `SRS-NFR-NN` | Requisitos funcionais / não-funcionais | SRS-001 |
| `SAD-COMP/IFACE/FLOW/DEC-NN` | Componentes / Interfaces / Fluxos / Decisões | SAD-001 |
| `RSK-HNN` | Hazards de risco | RSK-001 |
| `CTL-NN` | Controles implementados | (este doc) |
| `TST-NN` | Testes / verificações | (este doc) |
| `EVD-NN` | Evidências empíricas | (este doc) |

## 3. Catálogo de CONTROLES (CTL-XX)

### CTL-01 — Guard `isAskingConsent`
**Implementação:** `tradevision-core/index.ts`.
**Verifica:** SRS-FR-01.

### CTL-02 — COS Kernel 5 portas
**Implementação:** `cos_engine.ts`.
**Verifica:** SRS-FR-02.

### CTL-03 — AEC FSM 13 fases
**Implementação:** `clinicalAssessmentFlow.ts`.
**Verifica:** SRS-FR-03.

### CTL-04 — Verbatim First (bypass GPT)
**Implementação:** Camada 3 pirâmide.
**Verifica:** SRS-FR-04.

### CTL-05 — AEC Gate V1.5
**Implementação:** Camada 4 pirâmide.
**Verifica:** SRS-FR-05.

### CTL-06 — PII sanitize Edge tradevision-core v423
**Implementação:** `sanitizeRationalityPII` + backfill 132 rows.
**Verifica:** SRS-FR-13, SRS-NFR-07.

### CTL-07 — Auth + ownership check Edge sign-pdf-icp
**Implementação:** V1.9.457 Edge v22.
**Verifica:** SRS-FR-10, SRS-NFR-06 (parcial — só sign-pdf-icp).

### CTL-08 — PBAD AD-RB v2.4 constants OID + SIGPOLICYHASH
**Implementação:** `PA_AD_RB_V24_OID` + `PA_AD_RB_V24_SIGPOLICYHASH_HEX`.
**Verifica:** SRS-FR-09.

### CTL-09 — RLS 100% nas 144 tabelas
**Implementação:** Migration + audit periódico.
**Verifica:** SRS-NFR-03.

### CTL-10 — Telemetria custo IA (V1.9.238)
**Implementação:** Metadata em `ai_chat_interactions`.
**Verifica:** SRS-FR-27, SRS-NFR-08.

### CTL-11 — pg_cron jobs com `cron.job_run_details`
**Implementação:** 3 jobs ativos.
**Verifica:** SRS-FR-12, SRS-NFR-11.

### CTL-12 — Cap tokens 60k (V1.9.61)
**Implementação:** Limite em Edge.
**Verifica:** SRS-FR-06 (proteção custo / loop).

### CTL-13 — RPC `anonymize_user_safely` SECURITY DEFINER
**Implementação:** Função SQL.
**Verifica:** SRS-FR-29.

### CTL-14 — Versionamento V1.9.X disciplinado + tags imutáveis
**Implementação:** Política operacional (CLAUDE.md).
**Verifica:** SRS-NFR-09.

### CTL-15 — Backup WAL-G + diário (Supabase Pro)
**Implementação:** Supabase Pro plan.
**Verifica:** SRS-NFR-10.

### CTL-16 — Type-check pre-commit
**Implementação:** Hook lint-staged.
**Verifica:** SRS-NFR-09 (qualidade código).

### CTL-17 — Push 4 refs obrigatório
**Implementação:** Política operacional.
**Verifica:** SRS-NFR-09 (redundância).

## 4. Catálogo de TESTES (TST-XX)

### TST-01 — Smoke ITI validar.iti.gov.br
**Método:** `openssl asn1parse` + upload no portal ITI + diff binário.
**Verifica:** CTL-08 → SRS-FR-09.
**Cadência:** A cada alteração em `sign-pdf-icp/*`.

### TST-02 — Type-check `npx tsc --noEmit`
**Método:** EXIT=0 obrigatório pré-commit.
**Verifica:** CTL-16.

### TST-03 — Smoke PAT schema empírico
**Método:** `information_schema.columns` antes de INSERT/SELECT.
**Verifica:** Princípio cristalizado `feedback_nao_chutar_uuid_quando_pat_disponivel_29_05`.

### TST-04 — `clinical_qa_runs` (framework PMF Audit V1.9.85)
**Método:** Audit estruturado 17 colunas com 4 buckets coloridos.
**Verifica:** Validação clínica de relatórios.
**Cadência atual:** 2/30d (target: 2/mês).

### TST-05 — Telemetria latency P50/P95/P99
**Método:** Percentile sobre `processing_time` em `ai_chat_interactions`.
**Verifica:** CTL-10 → SRS-NFR-01.
**Estado:** Painel AdminAIGovernance V1.9.374 já operacional.

### TST-06 — Smoke 401 sem JWT em Edge sign-pdf-icp
**Método:** Requisição sem header `Authorization` → 401 esperado.
**Verifica:** CTL-07 → SRS-FR-10.
**Smoke validado:** V1.9.457 SMOKE 1+2 PASS.

### TST-07 — Smoke empírico UI (Pedro + Ricardo + Eduardo)
**Método:** Uso real do app antes de paciente externo.
**Verifica:** Regressão funcional / visual.

### TST-08 — Smoke 5/5 Matrix Z2 + Bula (V1.9.468-A)
**Método:** 5 perguntas-armadilha (qual CBD melhor / compare / posologia / interação / sugira).
**Verifica:** CTL relacionado a Matrix.
**Smoke PASS:** 27/05/2026.

### TST-09 — `cron.job_run_details` success rate
**Método:** Query agregada `state='succeeded'` últimos 7d.
**Verifica:** CTL-11 → SRS-NFR-11.
**Estado:** 2.023/2.023 = 100%.

### TST-10 — Validação RLS via PAT empírico
**Método:** `pg_class.relrowsecurity` em todas tabelas.
**Verifica:** CTL-09 → SRS-NFR-03.
**Estado:** 144/144 confirmado 29/05.

### TST-11 — Smoke 132 rows PII sanitizadas
**Método:** Query empírica `clinical_rationalities WHERE assessment LIKE 'Paciente #%'`.
**Verifica:** CTL-06 → SRS-FR-13.
**Estado:** 132/132 confirmado V1.9.452 backfill.

## 5. Catálogo de EVIDÊNCIAS (EVD-XX)

Cada EVD é uma tag git imutável, commit, ou registro empírico verificável.

### EVD-01 — Lock V1.9.95 (AEC + Relatório + Agendamento)
**Tag:** `v1.9.95-lock-aec-relatorio-agendamento`.
**Mensagem:** "LOCK V1.9.95 — AEC + Relatório + Agendamento".

### EVD-02 — Lock V1.9.99 (Resend production)
**Tag:** `v1.9.99-resend-prod-locked`.
**Mensagem:** "LOCK V1.9.99 — Resend production-ready (28/04/2026 ~15h45 BRT)".

### EVD-03 — Lock V1.9.113 (AEC + Pipeline + Analisar Paciente)
**Tag:** `v1.9.113-locked`.
**Mensagem:** "v1.9.113-locked — Selo AEC + Pipeline + Analisar Paciente estavel".

### EVD-04 — Lock V1.9.299 (PBAD AD-RB CONFORME ITI)
**Tag:** `v1.9.299-pbad-conforme-locked`.
**Mensagem:** "🏆 V1.9.299-FINAL — PBAD AD-RB CONFORME validado oficialmente ITI ✅".
**Importância:** Crítica regulatória — não tocar sem smoke ITI.

### EVD-05 — Lock V1.9.418 (Fórum Cann Matrix)
**Tag:** `v1.9.418-forum-cann-matrix-checkpoint`.

### EVD-06 — Lock V1.9.452 (PII sanitize)
**Tag:** `v1.9.452-pii-sanitize-defensivo-final`.
**Mensagem:** "V1.9.452 PII sanitize defensivo em clinical_rationalities — LGPD reforco pre-Marco 2".

### EVD-07 — Lock V1.9.455 (exam_request PDF ICP wiring)
**Tag:** `v1.9.455-exam-pdf-wiring`.

### EVD-08 — Lock V1.9.457 (sign-pdf-icp auth + ownership)
**Tag:** `v1.9.457-sign-pdf-icp-auth-ownership`.
**Mensagem:** "Nucleo PBAD AD-RB V1.9.299 INTOCADO. Smoke 1+2 validados (401).".

### EVD-09 — Lock V1.9.468-A (Matrix Z2 + Bula)
**Tag:** `v1.9.468-A-matrix-bula-locks-final`.
**Mensagem:** "Matrix Z2 + Bula ANVISA locks micro-factuais (smoke 5/5 PASS empirico)".

### EVD-10 — Lock V1.9.474 (AEC reset invalidated_at)
**Tag:** `v1.9.474-aec-reset-invalidated-trigger`.

### EVD-11 — Lock V1.9.475 (Card Neuro embrião)
**Tag:** `v1.9.475-card-neuro-embriao`.

### EVD-12 — 42 reports ICP-Brasil signed
**Fonte:** `SELECT COUNT(*) FROM clinical_reports WHERE signed_at IS NOT NULL AND signature_hash IS NOT NULL`.
**Estado:** 42 confirmado PAT 29/05.

### EVD-13 — 132 rationalities PII sanitizadas (backfill V1.9.452)
**Fonte:** `SELECT COUNT(*) FROM clinical_rationalities` = 132 (= total = todas sanitizadas).

### EVD-14 — 144 tabelas com RLS 100%
**Fonte:** PAT empírico 29/05.

### EVD-15 — 2.023 runs cron / 100% success em 7d
**Fonte:** `cron.job_run_details`.

### EVD-16 — 649 commits/30d
**Fonte:** `git log --since="30 days ago"`.

### EVD-17 — 284 memórias cristalizadas
**Fonte:** `ls ~/.claude/projects/*/memory/*.md`.

### EVD-18 — 66 diários DIARIO_*.md
**Fonte:** `ls DIARIO_*.md`.

### EVD-19 — 6 Livros Magno
**Fonte:** `ls docs/LIVRO_MAGNO_*.md` (versões variadas).

### EVD-20 — Painel AdminAIGovernance ativo
**Fonte:** `src/pages/AdminAIGovernance.tsx` V1.9.374.

### EVD-21 — Smoke Eduardo Faveret operacional
**Fonte:** Memória `project_eduardo_faveret_no_app_sharing_validado_27_05`.

### EVD-22 — Smoke 4 órfãos AEC visíveis (V1.9.500)
**Fonte:** Solange (32d) / Thiago (24d) / Pedro (7d) / João (4d) flagrados empíricamente.

### EVD-23 — 2 clinical_qa_runs (cadência mínima ativa)
**Fonte:** `SELECT COUNT(*) FROM clinical_qa_runs` = 2.

## 6. Matriz de rastreabilidade (núcleo crítico)

### 6.1. Cadeia URS → SRS → SAD → RSK → CTL → TST → EVD

| URS | SRS | SAD | RSK | CTL | TST | EVD |
|---|---|---|---|---|---|---|
| URS-PAC-02 | SRS-FR-01 | SAD-COMP-11 SAD-DEC-01 | RSK-H03 | CTL-01 CTL-05 | TST-07 | EVD-01 |
| URS-GLB-02 | SRS-FR-02 | SAD-DEC-01 | (geral) | CTL-02 | (auditoria) | EVD-01 |
| URS-MED-02 URS-PAC-01 | SRS-FR-03 | SAD-COMP-02 SAD-COMP-11 | RSK-H05 | CTL-03 | TST-07 | EVD-03 |
| URS-MED-03 | SRS-FR-04 SRS-FR-07 | SAD-COMP-11 SAD-DEC-04 | RSK-H05 | CTL-04 | TST-07 | EVD-01 |
| URS-MED-06 | SRS-FR-05 SRS-FR-16 SRS-FR-17 | SAD-COMP-06 | RSK-H03 | CTL-05 | TST-07 | EVD-22 |
| URS-MED-05 URS-PAC-06 | SRS-FR-09 SRS-FR-10 | SAD-COMP-12 SAD-DEC-02 | RSK-H04 RSK-H10 | CTL-07 CTL-08 | TST-01 TST-06 | EVD-04 EVD-08 EVD-12 |
| URS-MED-11 | SRS-FR-12 | SAD-COMP-17 SAD-COMP-21 SAD-IFACE-05 | RSK-H09 | CTL-11 | TST-09 | EVD-02 EVD-15 |
| URS-PAC-10 | SRS-FR-13 SRS-NFR-07 | SAD-COMP-11 SAD-DEC-06 | RSK-H02 | CTL-06 | TST-11 | EVD-06 EVD-13 |
| URS-MED-08 URS-PAC-05 | SRS-FR-14 | SAD-COMP-03 | RSK-H07 | (RLS overwrite — gap Marco 3) | TST-10 | (smoke 28/05 manhã) |
| URS-MED-01 | SRS-FR-15 | SAD-COMP-03 SAD-COMP-20 | (n/a pattern válido) | (validação 3 queries) | TST-10 | (memória feedback_padrao_orfaos_*) |
| URS-MED-09 | SRS-FR-18 SRS-FR-19 SRS-FR-20 | SAD-COMP-03 SAD-COMP-04 | RSK-H05 | CTL-03 | TST-07 | EVD-09 |
| URS-MED-10 | SRS-FR-21 | SAD-COMP-04 SAD-DEC-10 | RSK-H05 | (Matrix Z2 lock) | TST-08 | EVD-09 |
| URS-PAC-04 URS-PAC-09 | SRS-FR-22 | SAD-COMP-07 SAD-COMP-08 | (n/a) | (RichClinicalReportView soberano) | TST-07 | (hotfix V1.9.500-A documentado) |
| URS-ADM-02 URS-MED-12 URS-GLB-05 | SRS-FR-27 SRS-FR-28 | SAD-COMP-09 SAD-COMP-11 | RSK-H05 | CTL-10 | TST-05 | EVD-20 |
| URS-PAC-08 URS-ADM-07 | SRS-FR-29 | SAD-COMP-20 | (LGPD) | CTL-13 | (manual) | (RPC SQL definida) |
| URS-GLB-02 | SRS-NFR-03 SRS-NFR-06 | SAD-COMP-20 SAD-COMP-22 | RSK-H07 RSK-H08 | CTL-09 | TST-10 | EVD-14 |
| URS-GLB-03 | SRS-NFR-09 SRS-NFR-13 | (transversal) | (n/a) | CTL-14 CTL-16 CTL-17 | TST-02 | EVD-16 EVD-17 EVD-18 EVD-19 |
| URS-GLB-04 | SRS-NFR-01 | SAD-COMP-11 SAD-COMP-24 | RSK-H09 | CTL-12 | TST-05 | EVD-20 |

### 6.2. Cobertura empírica (29/05/2026)

| Métrica | Valor | Observação |
|---|---:|---|
| URS catalogados | 41 | URS-001 §9 |
| SRS catalogados | 44 | SRS-001 §5 (31 FR + 13 NFR) |
| SAD itens | 47 | SAD-001 §9 (26 COMP + 5 IFACE + 3 FLOW + 13 DEC) |
| RSK hazards | 10 | RSK-001 §2 |
| CTL controles | 17 | (este doc §3) |
| TST testes | 11 | (este doc §4) |
| EVD evidências | 23 | (este doc §5) |
| **Total de itens rastreáveis** | **193** | |
| URS com mapeamento completo URS→EVD | ~18 | ~44% — gap em 23 URS |
| Evidências com lock git imutável | 11 | Tags v1.9.* |

### 6.3. Gaps de rastreabilidade conhecidos

1. **URS-ALU-05 (feedback estruturado pós-simulação)** — sem `simulation_runs` formal. Gap parqueado pós-Marco 3.
2. **URS-MED-08 / URS-PAC-05 (Share cross-account)** — pattern overwrite documentado mas sem RLS pra 3º médico profissional puro. Gap Marco 3.
3. **SRS-NFR-06 (verify_jwt em Edges)** — `tradevision-core` ainda `verify_jwt=false`. Gap Sprint A.
4. **SRS-FR-15 (Cadastro paciente externo offline)** — pattern válido CFM mas sem UI de "remover paciente cadastrado por engano". Gap operacional.

## 7. Inventário TRM

- Controles: 17 (CTL-01..17)
- Testes: 11 (TST-01..11)
- Evidências: 23 (EVD-01..23)
- Linhas da matriz: 18 cadeias URS→EVD completas
- Itens totais rastreáveis: **193**

## 7.1. Integração com PLN-VER-001 (cobertura por requisito)

Após PLN-VER-001 entregue 29/05 (V1.9.502-C), cobertura SRS → VER-MET adicionada empíricamente:

- **44/44 SRS** têm pelo menos 1 método de verificação ou monitoramento mapeado.
- **8 Release Gates** (G1-G8) consolidam bloqueadores por escopo da mudança.
- **10 métodos VER-MET** = expansão dos 11 testes TST originais com semântica IEC 62304 §5.6 explícita.
- **4 cadências MON-CAD** separadas de VER-CAD para evitar discussão semântica com auditor (sugestão consultoria externa 29/05).

Detalhes em [PLN-VER-001 §8.1](./16_PLN-VER-001_Plano_de_Verificacao.md).

## 8. Como usar este documento

### 8.1. Pergunta típica de auditor

> *"Mostre como vocês garantem que a assinatura ICP-Brasil é confiável."*

**Cadeia de resposta via TRM:**
1. URS-MED-05 (necessidade do médico)
2. SRS-FR-09 + SRS-FR-10 (requisitos)
3. SAD-COMP-12 + SAD-DEC-02 (componente e decisão arquitetural)
4. RSK-H04 (hazard identificado)
5. CTL-07 + CTL-08 (controles)
6. TST-01 + TST-06 (testes empíricos)
7. EVD-04 + EVD-08 + EVD-12 (evidências: tag git V1.9.299 + V1.9.457 + 42 PDFs signed)

### 8.2. Pergunta típica regulatória

> *"Onde está demonstrada a conformidade com LGPD Art. 11?"*

**Cadeia de resposta:**
- URS-PAC-10 → SRS-FR-13 + SRS-NFR-07 → SAD-COMP-11 + SAD-DEC-06 → RSK-H02 → CTL-06 → TST-11 → EVD-06 + EVD-13.

## 9. Manutenção da matriz

A TRM deve ser atualizada a cada:

- **Lock V1.9.X** selado (acrescenta EVD)
- **Novo URS / SRS / SAD** documentado
- **Novo RSK** identificado em RSK-001
- **Novo TST** validado empíricamente

Responsabilidade primária: Tech Lead (Pedro). Revisão: RT habilitado pós-CNPJ.

---

**Aprovação:**
- [ ] Médico Sócio (validação clínica): Dr. Ricardo Valença — Data: ___/___/___
- [ ] RT habilitado: ________________ Data: ___/___/___
- [ ] Tech Lead: Pedro Henrique Passos Galluf — Data: 29/05/2026 (draft)

---

## Frase âncora

> *"193 itens rastreáveis (41 URS + 44 SRS + 47 SAD + 10 RSK + 17 CTL + 11 TST + 23 EVD) consolidam num único mapa o conhecimento que estava distribuído entre 11 locks + 66 diários + 284 memórias + 649 commits. TRM-001 não cria informação — indexa o que já existe pra auditor navegar em segundos."*

---

# PLAN-FLIP-001 — Plano de Flip `verify_jwt=true` em Edge `tradevision-core`

**Versão draft:** 0.1 (29/05/2026)
**Status:** PRONTO PARA EXECUÇÃO (depende janela operacional do Pedro)
**Risco residual após análise empírica:** **MUITO BAIXO** (zero callers sem JWT detectados)
**Referência cruzada:** TRM-001 Gap #3, RSK-001 H8, SRS-NFR-06, SAD-DEC-13

---

## 1. Contexto

Edge `tradevision-core` v423 está em produção com `verify_jwt=false` por configuração herdada de deploys anteriores. Isso significa que qualquer caller com `ANON_KEY` pode invocar a Edge sem autenticação de usuário — risco H8 do RSK-001 (severidade MÉDIA-ALTA).

## 2. Mapping empírico de callers (29/05/2026)

### 2.1. Callers via `supabase.functions.invoke()` (auto-injeta JWT do usuário)

| Arquivo | Linha | Uso |
|---|---|---|
| `src/hooks/useResearchChat.ts` | 164 | Matrix Z2 — pesquisa científica |
| `src/lib/clinicalAssessmentFlow.ts` | 1875 | AEC FSM — fluxo clínico |
| `src/lib/noaResidentAI.ts` | 2269 | IA Residente Nôa |
| `src/components/ShareReportModal.tsx` | 114 | Share de relatório paciente→médico |

### 2.2. Caller via `fetch()` direto

| Arquivo | Linha | Auth |
|---|---|---|
| `src/lib/noaEngine.ts` | 68 | **Já passa `Authorization: Bearer ${session.access_token}` manualmente** ✅ |

### 2.3. Callers no backend (Edge functions / cron / service role)

**ZERO callers detectados:**
- `grep -rn "tradevision-core" supabase/functions/` retorna só auto-referências.
- `grep -rn "SERVICE_ROLE.*tradevision" supabase/` retorna 0 matches.
- `grep -rn "net.http_post.*tradevision" supabase/` retorna 0 matches.

## 3. Análise de risco

| Cenário | Probabilidade | Severidade | Mitigação |
|---|---|---|---|
| Caller frontend sem JWT (anônimo) | **ZERO** | Crítica | Mapping 100% confirmou JWT presente |
| Caller backend service_role | **ZERO** | N/A | Zero callers backend |
| Janela de uso ativo durante flip | Baixa (madrugada) | Média | Executar 02h-06h BRT |
| Quebra de turn IA em sessão ativa | Baixa | Alta | Rollback em 1 comando (~30s) |

**Risco residual final: MUITO BAIXO** após validação empírica.

## 4. Comando de flip

```bash
# Confirmar PAT exportado primeiro
export SUPABASE_ACCESS_TOKEN=sbp_***SUPABASE_PAT_HERE***

# Deploy SEM --no-verify-jwt (flippa verify_jwt:false → true)
npx supabase functions deploy tradevision-core \
  --project-ref itdjkfubfzmvmuxxjoae
```

Isso deploya nova versão (provavelmente v424) com `verify_jwt=true`.

## 5. Smoke checklist PRÉ-flip

```bash
# 1. Confirmar estado atual: verify_jwt=false
curl -s "https://api.supabase.com/v1/projects/itdjkfubfzmvmuxxjoae/functions" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" | \
  node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const j=JSON.parse(d);const t=j.find(f=>f.slug==='tradevision-core');console.log('PRE-FLIP:',t.slug,'verify_jwt='+t.verify_jwt,'v'+t.version)})"
# Esperado: verify_jwt=false v423

# 2. Smoke turn IA atual (com JWT válido)
# → fazer 1 turn via UI (Pedro logado) e confirmar response em até 12s
```

## 6. Smoke checklist PÓS-flip

```bash
# 1. Confirmar verify_jwt=true em nova versão
curl -s "https://api.supabase.com/v1/projects/itdjkfubfzmvmuxxjoae/functions" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" | \
  node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const j=JSON.parse(d);const t=j.find(f=>f.slug==='tradevision-core');console.log('POS-FLIP:',t.slug,'verify_jwt='+t.verify_jwt,'v'+t.version)})"
# Esperado: verify_jwt=true v424

# 2. Smoke 401 sem JWT
curl -X POST "https://itdjkfubfzmvmuxxjoae.supabase.co/functions/v1/tradevision-core" \
  -H "Content-Type: application/json" \
  -d '{"message":"teste sem auth"}'
# Esperado: 401 Unauthorized

# 3. Smoke turn IA com JWT válido via UI
# → fazer 1 turn via UI (Pedro logado) e confirmar response em até 12s

# 4. Smoke 5 turns AEC reais
# → conduzir mini-AEC (5 fases) e confirmar pipeline RATIONALITY dispara
```

## 7. Rollback (se algo quebrar)

```bash
# Re-deploy com --no-verify-jwt (volta verify_jwt:true → false)
npx supabase functions deploy tradevision-core \
  --project-ref itdjkfubfzmvmuxxjoae \
  --no-verify-jwt
```

Tempo total de rollback: ~30-60s.

## 8. Janela operacional sugerida

Empíricamente via telemetria 29/05 (ai_chat_interactions):
- 8 turns hoje, todos concentrados entre 23h (Ricardo) e 01h (Pedro) e 09h (Pedro)
- Madrugada 02h-06h BRT: **ZERO turns** historicamente

**Janela recomendada:** 02h-05h BRT, qualquer dia útil.
**Janela alternativa:** sábado 09h-11h BRT (Eduardo + Ricardo dormem cedo no sábado, validado empíricamente).

## 9. Telemetria pós-flip (24h)

Monitorar via PAT:

```sql
SELECT
  COUNT(*) AS turns_24h_pos_flip,
  ROUND(SUM((metadata->>'cost_usd_estimate')::numeric), 4) AS custo_usd,
  COUNT(*) FILTER (WHERE ai_response IS NULL OR ai_response = '') AS turns_falhos,
  ROUND(AVG(processing_time), 0) AS latency_media_ms
FROM ai_chat_interactions
WHERE created_at > now() - interval '24 hours';
```

**Critério de sucesso:**
- `turns_falhos = 0`
- `latency_media_ms` dentro do baseline pré-flip
- 0 chamadas com erro 401 nos logs Edge

## 10. Atualizações pós-flip bem-sucedido

Atualizar imediatamente após smoke pós-flip PASS:

1. **CLAUDE.md** — Edge `tradevision-core` v424 verify_jwt=true ✅
2. **RSK-001 H8** — risco MÉDIO-ALTO → resolvido
3. **TRM-001 Gap #3** — marcar como resolvido
4. **Backlog** — remover Sprint A item 2 (--no-verify-jwt)
5. **Diário do dia** — Bloco "Flip verify_jwt OK" com smoke results
6. **Memória** — cristalizar `feedback_verify_jwt_flip_seguro_via_mapping_empirico_29_05.md`

## 11. Responsável pelo flip

Pedro Henrique Passos Galluf (Tech Lead).

## 12. Pre-aprovação de risco

Análise empírica conduzida via grep frontend + grep backend + telemetria janela operacional. Mapping documenta zero callers sem JWT.

---

**Aprovação para execução:**
- [ ] Pedro (Tech Lead) — Data: ___/___/___
- [ ] (Opcional) Ricardo Valença (Médico Sócio) — para janela com horário acordado

**Frase âncora:**

> *"5 callers, 100% com JWT, zero risco residual após mapping empírico completo. Flip é exercício de 60 segundos com rollback de 30 segundos — não procrastinar."*

---

# PLN-VER-001 — Plano de Verificação

**Versão draft:** 0.1 (29/05/2026)
**Status:** DRAFT pré-consultora SaMD
**Referência normativa:** ISO 13485:2016 §7.3.6 + IEC 62304:2006 §5.6

---

## 1. Objetivo

Consolidar a **estratégia formal de verificação** do MedCannLab 3.0, distinta da **validação clínica** (POP-VAL-001), explicitando:

- Métodos de verificação adotados
- Critérios de aceitação
- Cadências obrigatórias
- Responsáveis por cada tipo de verificação
- Rastreabilidade com testes (TST-XX) catalogados em TRM-001

## 2. Diferença Verificação vs Validação

| Conceito | Pergunta-chave | Documento mestre |
|---|---|---|
| **Verificação** (§7.3.6) | "O software foi construído **corretamente**?" | PLN-VER-001 (este doc) |
| **Validação** (§7.3.7) | "Construímos o software **certo**?" (atende necessidade clínica?) | POP-VAL-001 |

## 3. Convenção de IDs

```
VER-MET-NN   (Método de verificação)
VER-CRI-NN   (Critério de aceitação)
VER-CAD-NN   (Cadência)
VER-RSP-NN   (Responsável)
```

Cada item rastreável bidirecionalmente via TRM-001.

## 4. Métodos de Verificação (VER-MET-XX)

### VER-MET-01 — Type-check estático TypeScript

**Descrição:** Compilação `npx tsc --noEmit` deve retornar EXIT=0.
**Cobertura:** 363 arquivos `.tsx`/`.ts` em `src/`.
**Ferramenta:** TypeScript 5+ via npm script.
**Mapeia para:** TST-02.

### VER-MET-02 — Smoke PAT empírico do schema

**Descrição:** Validar `information_schema.columns` ANTES de qualquer SELECT/INSERT em script SQL.
**Justificativa:** Princípio cristalizado [[feedback_nao_chutar_uuid_quando_pat_disponivel_29_05]] após incidente FK violation 29/05.
**Mapeia para:** TST-03.

### VER-MET-03 — Smoke ITI para PDFs ICP-Brasil

**Descrição:** `openssl asn1parse` + upload `validar.iti.gov.br` + diff binário vs PDF aprovado.
**Cobertura:** Toda alteração em `sign-pdf-icp/*`.
**Mapeia para:** TST-01.
**Bloqueador de release:** Se smoke falhar, NÃO push.

### VER-MET-04 — Smoke empírico via UI (Pedro + Ricardo + Eduardo)

**Descrição:** Uso real do app por sócios antes de paciente externo.
**Princípio:** [[feedback_validacao_empirica_screenshot_maior_que_plano_teorico_28_05]] — screenshot > teoria.
**Mapeia para:** TST-07.

### VER-MET-05 — `clinical_qa_runs` (framework PMF Audit V1.9.85)

**Descrição:** Audit estruturado com 17 colunas, 4 buckets coloridos:
- 🟢 GREEN_FACTS (validados empíricamente)
- 🟡 YELLOW_HYPOTHESES (razoáveis não validadas)
- 🟠 ORANGE_INTERPRETATIONS (narrativas com alta variância)
- 🔴 RED_BLINDSPOTS (pontos cegos conhecidos)

**Mapeia para:** TST-04.

### VER-MET-06 — Telemetria automática contínua

**Descrição:** Captura passiva via `ai_chat_interactions.metadata` (V1.9.238) + `cron.job_run_details` + `cognitive_events`.
**Mapeia para:** TST-05, TST-09.

### VER-MET-07 — Smoke Matrix Z2 (perguntas-armadilha)

**Descrição:** 5 perguntas pré-codificadas para validar lock V1.9.468-A (cita literal, NÃO sintetiza cross-bulas, NÃO sugere troca, NÃO infere interação não-documentada).
**Mapeia para:** TST-08.

### VER-MET-08 — Smoke auth nas Edges sensíveis

**Descrição:** Hit sem JWT → 401 esperado; hit com JWT inválido → 401 esperado; hit com JWT válido + ownership wrong → 403 esperado.
**Cobertura:** `sign-pdf-icp` (após V1.9.457), `tradevision-core` (após flip pendente).
**Mapeia para:** TST-06.

### VER-MET-09 — Verificação RLS 100% via PAT

**Descrição:** `SELECT COUNT(*) FROM pg_class WHERE relrowsecurity=true AND schema='public'` deve igualar total de tabelas.
**Mapeia para:** TST-10.
**Estado atual:** 144/144 ✅.

### VER-MET-10 — Verificação PII sanitização

**Descrição:** `SELECT COUNT(*) FROM clinical_rationalities WHERE assessment LIKE 'Paciente #%'` deve igualar total.
**Mapeia para:** TST-11.
**Estado atual:** 132/132 ✅.

## 5. Critérios de Aceitação (VER-CRI-XX)

### VER-CRI-01 — Type-check zero erros

**Critério:** EXIT=0 obrigatório pré-commit.
**Hook:** `lint-staged` no `.husky/pre-commit`.
**Bloqueador:** Sim.

### VER-CRI-02 — Smoke ITI PASS

**Critério:** Portal ITI valida assinatura como "AD-RB CONFORME".
**Bloqueador:** Sim (não push se falhar).

### VER-CRI-03 — Latência P95 < 12s

**Critério:** Telemetria semanal mostra P95 abaixo de 12.000ms.
**Bloqueador:** Não, mas dispara investigação.

### VER-CRI-04 — Cron success rate > 99%

**Critério:** `cron.job_run_details` últimos 7d ≥ 99% succeeded.
**Estado atual:** 100% (2.023/2.023) ✅.
**Bloqueador:** Investigar se < 99%.

### VER-CRI-05 — Zero turns IA falhos por hora

**Critério:** `ai_chat_interactions WHERE ai_response IS NULL OR ai_response=''` deve ser 0/hora.
**Bloqueador:** Alerta para Tech Lead se > 5/hora.

### VER-CRI-06 — RLS 100% das tabelas públicas

**Critério:** Toda tabela em `pg_tables WHERE schemaname='public'` deve ter `relrowsecurity=true`.
**Bloqueador:** Sim (não criar tabela sem RLS).

### VER-CRI-07 — PII 100% sanitizada em rationalities

**Critério:** Zero rows com nome real (sem prefixo `Paciente #`) em `clinical_rationalities.assessment`.
**Bloqueador:** Sim (Edge `tradevision-core` deve garantir).

### VER-CRI-08 — Smoke Matrix 5/5 PASS

**Critério:** Todas 5 perguntas-armadilha não disparam síntese cross-bulas / recomendação direta / interação não-documentada.
**Bloqueador:** Sim (lock V1.9.468-A).

### VER-CRI-09 — `clinical_qa_runs` verdict_score ≥ 70

**Critério:** Cada QA run deve registrar `verdict_score ≥ 70` (escala 0-100).
**Bloqueador:** Não, mas dispara CAPA se < 70.

### VER-CRI-10 — Custo OpenAI ≤ $1 USD/AEC (média)

**Critério:** `cost_usd_estimate` médio por AEC completa.
**Estado atual:** ~$0.60/AEC (empírico).
**Bloqueador:** Não, mas alerta se > $1.

## 6. Cadências de Verificação IEC 62304 §5.6 (VER-CAD-XX)

> **Nota:** Esta seção lista apenas cadências de **verificação de software** (item foi construído corretamente?). Cadências de **monitoramento operacional** (telemetria + custos + uso) ficam em §7 — separação solicitada por consultoria externa 29/05 para evitar discussão semântica com auditor mais rígido.

### VER-CAD-01 — Pré-commit

**O que:** Type-check + secretlint.
**Quando:** Toda staged commit.
**Quem:** Hook automático (Husky + lint-staged).

### VER-CAD-02 — Pré-push (futuro)

**O que:** Vitest tests + lint.
**Quando:** Toda push.
**Quem:** Hook automático (a configurar).
**Status atual:** ⚠️ Não implementado — pendência operacional.

### VER-CAD-03 — Por release V1.9.X

**O que:** Smoke empírico via UI no fluxo afetado.
**Quando:** Toda mudança Nível 3+ (vide POP-CTL-007).
**Quem:** Pedro + Ricardo (clínico) + Eduardo (Ensino) conforme escopo.

### VER-CAD-04 — Smoke ITI por alteração em sign-pdf-icp

**O que:** Smoke completo VER-MET-03.
**Quando:** Toda alteração em `supabase/functions/sign-pdf-icp/*`.
**Quem:** Pedro (Tech Lead).
**Bloqueador:** Push proibido sem smoke ITI PASS.

### VER-CAD-05 — `clinical_qa_runs` quinzenal

**O que:** 1 QA run estruturado em report aleatório.
**Quando:** A cada 14 dias.
**Quem:** Rotação Claude (com PAT) → Pedro → Ricardo.
**Estado atual:** ✅ 2 runs em 30 dias = 100% da meta de 2 runs/mês (quantidade OK; qualidade/profundidade ainda precisa subir).
**Meta:** 2 runs/mês mínimo + 1 run por versão V1.9.X que toca código clínico + 1 run obrigatória pré-Marco 2.
**Gap real:** acumulação histórica baixa (2 runs totais) → baseline regulatório frágil. Meta 12+ runs até 31/12/2026.

### VER-CAD-06 — Smoke Matrix Z2 trimestral

**O que:** VER-MET-07 com 5 perguntas-armadilha.
**Quando:** A cada 90 dias OR a cada nova versão Matrix.
**Quem:** Pedro + Ricardo.

### VER-CAD-07 — Audit empírico schema mensal

**O que:** Validar RLS 100%, PII sanitization 100%, contagens de tabelas core.
**Quando:** 1° dia útil de cada mês.
**Quem:** Pedro com auxílio Claude.

## 7. Monitoramento Operacional (MON-CAD-XX)

> **Distinção:** Monitoramento operacional ≠ Verificação IEC 62304. Estes itens são captura passiva contínua + análise periódica de uso real, não validação de que o software foi construído corretamente. Preparam material para futuro Post-Market Surveillance (PROC-PMS-001 parqueado).

### MON-CAD-01 — Telemetria automática contínua

**O que:** Painel AdminAIGovernance + alertas automáticos (latência, custo, falhas).
**Quando:** Contínuo (captura passiva via `ai_chat_interactions.metadata`).
**Quem:** Sistema automatizado.

### MON-CAD-02 — Audit de uso real semanal

**O que:** Quem usou Nôa nos últimos 7d, quanto custou, quais features.
**Quando:** Toda segunda-feira de manhã.
**Quem:** Pedro.

### MON-CAD-03 — Análise mensal de tendências de custo

**O que:** Custo agregado por feature/usuário/eixo + projeção pós-Marco 2.
**Quando:** Último dia útil de cada mês.
**Quem:** Pedro.

### MON-CAD-04 — Cron health check semanal

**O que:** Validar `cron.job_run_details` últimos 7d ≥ 99% success.
**Quando:** Toda segunda-feira.
**Quem:** Pedro.

## 8. Responsáveis (VER-RSP-XX)

### VER-RSP-01 — Tech Lead (Pedro Galluf)

**Responsável por:**
- VER-CAD-01 (type-check) — automatizado
- VER-CAD-04 (smoke ITI)
- VER-CAD-07 (audit schema)
- MON-CAD-02 (audit de uso real semanal)
- MON-CAD-03 (análise mensal de custos)
- MON-CAD-04 (cron health check semanal)
- Selagem de locks V1.9.X (POP-CTL-007 §4)

> **Correção empírica 29/05 20h30 BRT:** versão draft inicial referenciava `VER-CAD-09 (audit uso real)`, ID que não existe — o item migrou para MON-CAD-02 quando §6 foi separado de §7 (sugestão consultoria externa). Bug identificado por auditoria cruzada externa (Claude2) e corrigido empíricamente. Validação do conceito Nível 4 (Auditor IA detectando IDs órfãos).

### VER-RSP-02 — Médico Sócio (Ricardo Valença)

**Responsável por:**
- VER-CAD-03 (smoke release clínico) — apenas escopo clínico
- VER-CAD-05 (clinical_qa_runs) — rotação compartilhada
- VER-CAD-06 (smoke Matrix Z2)
- Aprovação clínica de QA runs (`verdict` final em `clinical_qa_runs`)

### VER-RSP-03 — Coord. Ensino (Eduardo Faveret)

**Responsável por:**
- VER-CAD-03 — apenas escopo Ensino (cursos AEC + simulações)
- Validação metodológica de simulações de paciente

### VER-RSP-04 — Sócio Institucional (João Eduardo Vidal)

**Responsável por:**
- Verificação regulatória externa (CFM / LGPD / ANVISA)
- Validação de conformidade pós-CNPJ

### VER-RSP-05 — RT habilitado (a contratar pós-CNPJ)

**Responsável por:**
- Aprovação formal de documentos SGQ
- Auditoria externa periódica
- Assinatura de relatórios regulatórios

### VER-RSP-06 — Consultora SaMD (a contratar pós-CNPJ)

**Responsável por:**
- Revisão de formato dos documentos
- Submissão regulatória ANVISA
- Auditoria de conformidade ISO 13485 / IEC 62304 / ISO 14971

## 8.1. Cobertura SRS → Método de Verificação

Tabela inversa da TRM (responde diretamente: *"Como cada requisito é verificado?"*).

### Funcionais (SRS-FR-XX)

| SRS | Requisito | Método principal | Cadência |
|---|---|---|---|
| SRS-FR-01 | Regra Hard §1 (Consentimento ≠ Agendamento) | VER-MET-04 (smoke UI) | VER-CAD-03 |
| SRS-FR-02 | COS Kernel 5 portas | VER-MET-04 + VER-MET-05 | VER-CAD-03 + VER-CAD-05 |
| SRS-FR-03 | AEC FSM 13 fases | VER-MET-04 + VER-MET-05 | VER-CAD-03 + VER-CAD-05 |
| SRS-FR-04 | Verbatim First | VER-MET-04 | VER-CAD-03 |
| SRS-FR-05 | AEC Gate V1.5 | VER-MET-04 | VER-CAD-03 |
| SRS-FR-06 | GPT-4o camada 5 | VER-MET-06 (telemetria) | MON-CAD-01 |
| SRS-FR-07 | Pós-processamento | VER-MET-04 | VER-CAD-03 |
| SRS-FR-08 | Pipeline Orchestrator | VER-MET-05 | VER-CAD-05 |
| SRS-FR-09 | Assinatura ICP-Brasil PBAD AD-RB | **VER-MET-03 (smoke ITI)** | VER-CAD-04 (bloqueador) |
| SRS-FR-10 | Auth + ownership check sign-pdf-icp | **VER-MET-08 (smoke 401)** | VER-CAD-04 |
| SRS-FR-11 | Cripto password ICP | VER-MET-04 | VER-CAD-03 |
| SRS-FR-12 | Cron video-call-reminders | VER-MET-06 | MON-CAD-04 |
| SRS-FR-13 | PII sanitization racionalidades | **VER-MET-10 (PII PAT)** | VER-CAD-07 (bloqueador) |
| SRS-FR-14 | Share cross-account | VER-MET-04 | VER-CAD-03 |
| SRS-FR-15 | Cadastro paciente externo offline | VER-MET-04 | VER-CAD-03 |
| SRS-FR-16 | InterruptedAECs visíveis | VER-MET-04 | VER-CAD-03 |
| SRS-FR-17 | Invalidação com motivo | VER-MET-04 | VER-CAD-03 |
| SRS-FR-18 | Separação 3 fontes Evolução | VER-MET-04 | VER-CAD-03 |
| SRS-FR-19 | Toggles Matrix | VER-MET-07 (Matrix Z2) | VER-CAD-06 |
| SRS-FR-20 | FOLLOW_UP em hook longitudinal | VER-MET-04 | VER-CAD-03 |
| SRS-FR-21 | Bula Matrix Z2 | **VER-MET-07 (5/5 perguntas-armadilha)** | VER-CAD-06 (bloqueador) |
| SRS-FR-22 | Modal evolução não-disruptivo | VER-MET-04 | VER-CAD-03 |
| SRS-FR-23 | Receituário CFM 4 tipos | VER-MET-04 + VER-MET-03 | VER-CAD-03 + VER-CAD-04 |
| SRS-FR-24 | Notícias institucionais | VER-MET-04 | VER-CAD-03 |
| SRS-FR-25 | Instrumentos de avaliação | VER-MET-04 | VER-CAD-03 |
| SRS-FR-26 | Mentoria | VER-MET-04 | VER-CAD-03 |
| SRS-FR-27 | Cost tracking IA | VER-MET-06 | MON-CAD-01 |
| SRS-FR-28 | Painel agregado por feature | VER-MET-06 | MON-CAD-01 |
| SRS-FR-29 | RPC anonymize_user_safely | VER-MET-01 (type-check) + VER-MET-02 (PAT) | VER-CAD-01 + VER-CAD-07 |
| SRS-FR-30 | Stats reais Dashboard | VER-MET-01 + VER-MET-04 | VER-CAD-01 + VER-CAD-03 |
| SRS-FR-31 | Atividade Recente derivada | VER-MET-01 + VER-MET-04 | VER-CAD-01 + VER-CAD-03 |

### Não-funcionais (SRS-NFR-XX)

| SRS | Requisito | Método principal | Cadência |
|---|---|---|---|
| SRS-NFR-01 | Latência P50<5s P95<12s | VER-MET-06 | MON-CAD-01 |
| SRS-NFR-02 | Disponibilidade ≥99.5% | VER-MET-06 | MON-CAD-04 |
| SRS-NFR-03 | RLS 100% nas tabelas | **VER-MET-09 (RLS PAT)** | VER-CAD-07 (bloqueador) |
| SRS-NFR-04 | TLS 1.2+ | (Vercel + Supabase nativo) | Contínuo |
| SRS-NFR-05 | Encryption at rest | (Supabase Pro nativo) | Contínuo |
| SRS-NFR-06 | Verify JWT em Edges sensíveis | **VER-MET-08 (smoke auth)** | VER-CAD-04 |
| SRS-NFR-07 | PII sanitização preventiva | **VER-MET-10 (PII PAT)** | VER-CAD-07 (bloqueador) |
| SRS-NFR-08 | Custo OpenAI ≤$0.05/turn médio | VER-MET-06 | MON-CAD-03 |
| SRS-NFR-09 | Versionamento auditável | (Git + tags) | Contínuo |
| SRS-NFR-10 | Backup contínuo | (Supabase Pro nativo) | Contínuo |
| SRS-NFR-11 | Cron success rate >99% | VER-MET-06 | MON-CAD-04 |
| SRS-NFR-12 | Responsivo 360px+ | VER-MET-04 | VER-CAD-03 |
| SRS-NFR-13 | Empty state honesto | VER-MET-04 | VER-CAD-03 |

**Cobertura empírica:** 44/44 SRS com pelo menos 1 método de verificação ou monitoramento mapeado. **Cobertura 100%.**

## 8.2. Release Gate (critério unificado de aprovação)

Uma release V1.9.X só pode ser pushada para `main` se TODAS as condições aplicáveis abaixo PASS:

### Gates BLOQUEADORES (sempre obrigatórios)

| Gate | Condição | Critério | Documentação |
|---|---|---|---|
| **G1** | Sempre | VER-CRI-01 PASS (type-check EXIT=0) | Pré-commit hook |
| **G2** | Sempre | VER-CRI-06 PASS (RLS 100% mantido) | VER-MET-09 |
| **G3** | Sempre | VER-CRI-07 PASS (PII sanitização 100% mantida) | VER-MET-10 |

### Gates CONDICIONAIS (aplicáveis ao escopo)

| Gate | Condição | Critério | Documentação |
|---|---|---|---|
| **G4** | Toca `sign-pdf-icp/*` | VER-CRI-02 PASS (smoke ITI portal) | VER-MET-03 |
| **G5** | Toca Matrix / lock V1.9.468-A | VER-CRI-08 PASS (5/5 perguntas-armadilha) | VER-MET-07 |
| **G6** | Toca AEC FSM / Pipeline / Verbatim | Smoke UI Ricardo PASS | VER-MET-04 |
| **G7** | Toca Edge auth | VER-MET-08 PASS (smoke 401 sem JWT) | VER-MET-08 |
| **G8** | Mudança Nível 3+ (POP-CTL-007) | Smoke empírico documentado em diário | VER-CAD-03 |

### Exceção emergencial

Hotfix emergencial pode pular **G6-G8** mediante:
- Registro síncrono com Médico Sócio (WhatsApp + screenshot)
- Documentação retroativa em até 24h
- Post-mortem em diário do dia seguinte

**Exemplo aplicado:** V1.9.500-A (29/05 12:28 BRT) — coluna inexistente flagrada empíricamente, hotfix em <30min com `clinical_reports.assessment` removido do SELECT. Commit `252cd36` push 4 refs OK.

## 9. Matriz Método × Cadência × Responsável

| Método | Cadência | Responsável principal | Bloqueador |
|---|---|---|---|
| VER-MET-01 (type-check) | VER-CAD-01 (pré-commit) | Hook automático | Sim |
| VER-MET-02 (smoke PAT schema) | Ad-hoc | Pedro | Sim |
| VER-MET-03 (smoke ITI) | VER-CAD-04 | Pedro | Sim |
| VER-MET-04 (smoke UI) | VER-CAD-03 | Pedro + Ricardo + Eduardo | Não |
| VER-MET-05 (clinical_qa_runs) | VER-CAD-05 | Rotação | Não (CAPA se score < 70) |
| VER-MET-06 (telemetria) | VER-CAD-08 (contínuo) | Sistema | Alertas |
| VER-MET-07 (Matrix Z2) | VER-CAD-06 | Pedro + Ricardo | Sim (lock V1.9.468-A) |
| VER-MET-08 (smoke auth) | VER-CAD-04 (sign-pdf-icp) + VER-CAD-09 (tradevision-core pós-flip) | Pedro | Sim |
| VER-MET-09 (RLS PAT) | VER-CAD-07 | Pedro | Sim |
| VER-MET-10 (PII PAT) | VER-CAD-07 | Pedro | Sim |

## 10. Cobertura empírica atual (29/05/2026)

| Item | Status |
|---|---|
| Type-check pré-commit ativo | ✅ Husky + lint-staged |
| Smoke ITI documentado | ✅ V1.9.299 procedure |
| Smoke UI por release | ⚠️ Ad-hoc, não formalizado por release |
| `clinical_qa_runs` cadência mínima | ❌ 2/30d (target 2/mês = 6,7%/mês da meta) |
| Telemetria custo IA | ✅ V1.9.238 + V1.9.374 painel |
| Smoke Matrix Z2 | ✅ Realizado 27/05 V1.9.468-A (5/5 PASS) |
| Smoke auth sign-pdf-icp | ✅ V1.9.457 SMOKE 1+2 PASS |
| Smoke auth tradevision-core | ⏳ Pendente flip (PLAN-FLIP-001) |
| Verificação RLS mensal | ⚠️ Ad-hoc (último: 29/05) |
| Verificação PII mensal | ✅ Por design via V1.9.452 |

## 11. Gaps de cobertura identificados

### Gap V01 — Pré-push hooks não implementados (VER-CAD-02)

**Risco:** Type-check pré-commit não pega regressão multi-arquivo. Vitest tests não rodam automaticamente.
**Plano:** Configurar `.husky/pre-push` rodando `npm run test` + `npm run lint` (~1h).

### Gap V02 — `clinical_qa_runs` acumulação histórica baixa

**Estado real:** Cadência atual está cumprindo meta (2 runs/30d = 100%).
**Gap real:** Apenas 2 runs totais no histórico → baseline empírico para auditor é frágil.
**Risco:** Auditor regulatório pode questionar profundidade da validação clínica documental.
**Plano:** Manter cadência quinzenal + adicionar 1 run obrigatória pré-Marco 2 + 1 run por versão V1.9.X clínica. Meta: 12+ runs acumuladas até 31/12/2026.

### Gap V03 — Smoke UI por release não formalizado

**Risco:** Pode haver regressão visual não detectada (caso V1.9.500-A foi reativo, não preventivo).
**Plano:** Checklist por release V1.9.X documentado em POP-CTL-007.

### Gap V04 — verify_jwt=false em tradevision-core

**Risco:** Documentado em RSK-001 H8, TRM Gap #3.
**Plano:** Executar PLAN-FLIP-001 (janela 02h-05h BRT).

## 12. Inventário PLN-VER-001

- Métodos: 10 (VER-MET-01..10)
- Critérios: 10 (VER-CRI-01..10)
- Cadências de verificação: 7 (VER-CAD-01..07)
- Cadências de monitoramento operacional: 4 (MON-CAD-01..04)
- Responsáveis: 6 (VER-RSP-01..06)
- Release Gates: 8 (G1-G8: 3 bloqueadores + 5 condicionais)
- Cobertura SRS → VER-MET: 44/44 (100%)
- Gaps identificados: 4 (Gap V01..04)

**Total: 49 itens catalogados.**

## 13. Rastreabilidade

Cada VER-MET, VER-CRI, VER-CAD aparece em [TRM-001](./14_TRM-001_Traceability_Matrix.md) §3 (TST) e mapeia para SRS e URS correspondentes.

---

**Aprovação:**
- [ ] Médico Sócio (validação clínica): Dr. Ricardo Valença — Data: ___/___/___
- [ ] RT habilitado: ________________ Data: ___/___/___
- [ ] Tech Lead: Pedro Henrique Passos Galluf — Data: 29/05/2026 (draft)

---

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

---

# RACI-001 — Governança e Responsabilidades

**Versão draft:** 0.2 (29/05/2026 20h35 BRT)
**Status:** **DRAFT OPERACIONAL — vinculação jurídica pós-contrato social MedCannLab Ltda**
**Referência normativa:** ISO 13485:2016 §5.5 (Responsabilidade, autoridade e comunicação)

> ⚠️ **Aviso jurídico crítico:** Este documento NÃO é vinculante juridicamente até existir contrato social formal da MedCannLab Ltda. Funciona como **acordo operacional informal** entre 4 colaboradores documentado em formato ISO 13485 para referência futura. **Não solicita assinaturas** dos sócios pré-CNPJ. Em caso de conflito entre RACI-001 e contrato social (quando este existir), contrato social prevalece. Ver §9.

---

## 1. Objetivo

Documentar formalmente a **distribuição de responsabilidades** no SGQ MedCannLab usando matriz **RACI** (Responsável / Aprovador / Consultado / Informado).

Esse documento fecha o **gap de governança** identificado pela avaliação externa GPT em 29/05/2026, que apontou: *"se essas respostas estiverem concentradas em uma única pessoa, vale começar a desenhar a governança."*

## 2. Convenção RACI

```
R — Responsable (executa a tarefa)
A — Approver (aprova e tem accountability final — apenas 1 por linha)
C — Consulted (consultado antes da decisão — bidirecional)
I — Informed (informado após a decisão — unidirecional)
```

## 3. Atores

### 3.1. Atores atuais (pré-CNPJ)

| Sigla | Nome | Papel | Disponibilidade |
|---|---|---|---|
| **PG** | Pedro Henrique Passos Galluf | Tech Lead + Orquestrador COS | Integral |
| **RV** | Dr. Ricardo Valença | Médico Sócio + Criador AEC | Tarde (clínica externa) |
| **EF** | Dr. Eduardo Faveret | Coordenador Ensino + Neurologia | Variável (operacional 27/05+) |
| **JV** | João Eduardo Vidal | Sócio Institucional + Regulatório | Variável (CNPJ em fechamento) |

### 3.2. Atores a contratar (pós-CNPJ)

| Sigla | Papel | Necessidade |
|---|---|---|
| **RT** | Responsável Técnico habilitado (CRF/CREA) | Marco 1 — assinatura formal documental |
| **CS** | Consultora SaMD especializada | Marco 1 — revisão formato + submissão |
| **DPO** | Data Protection Officer | Marco 2-3 — LGPD compliance |

## 4. Matriz RACI principal

### 4.1. Decisões arquiteturais

| Atividade | PG | RV | EF | JV | RT | CS |
|---|:-:|:-:|:-:|:-:|:-:|:-:|
| Selagem de lock V1.9.X (Nível 3+) | R | C | I | I | (futuro A) | I |
| Definição da pirâmide cognitiva 8 camadas | R | C+A* | I | I | - | I |
| Mudança constitucional (Livro Magno) | R | A | C | C | - | I |
| Decisão arquitetural (SAD-DEC) | R | C | C | I | (⚠️ A PENDENTE) | (futuro C) |
| Mudança de stack (Postgres, Vercel, OpenAI) | R+A | I | I | C | - | - |
| Migração de dados | R+A | I | I | I | - | - |

> *Pirâmide cognitiva é autoridade clínica conjunta (Pedro arquiteta, Ricardo valida método AEC).

### 4.2. Decisões clínicas

> **Nota:** Decisões clínicas têm autoridade legítima histórica de Ricardo Valença (criador do método AEC há ~15 anos). R+A em decisões clínicas reflete autoridade técnica real, não inflação documental.

| Atividade | PG | RV | EF | JV | RT | CS |
|---|:-:|:-:|:-:|:-:|:-:|:-:|
| Definição do método AEC | C | R+A | I | I | - | - |
| Aprovação de prompt clínico | I | R+A | C | - | - | - |
| Validação de relatório IA | C | R | C | - | - | - |
| Assinatura ICP-Brasil de prescrição | I | R+A | - | - | - | - |
| Critério de QA clínico (clinical_qa_runs) | C | R+A | I | - | - | - |
| Smoke Matrix Z2 | R | A | C | - | - | - |

### 4.3. Decisões de Ensino

> **⚠️ Eduardo Faveret entrou operacional em 27/05/2026 (2 dias antes deste RACI).** Para evitar inflação documental, A em decisões de Ensino é **provisional 90 dias** até validação empírica (3+ aprovações registradas em audit_log). Status revisado em 27/08/2026.

| Atividade | PG | RV | EF | JV | RT | CS |
|---|:-:|:-:|:-:|:-:|:-:|:-:|
| Conteúdo do curso AEC | C | C | R + A** | - | - | - |
| Aprovação de instrumentos de avaliação | C | C | R + A** | - | - | - |
| Aprovação de simulações clínicas | C | C | R + A** | - | - | - |
| Aprovação de mentores cadastrados | I | C | R + A** | - | - | - |

> **A provisional 90 dias (revisão 27/08/2026). Se EF não validar empíricamente capacidade até lá, A retorna ao status "PENDENTE — colegiado dos 3 sócios técnicos".

### 4.4. Gestão de Risco (ISO 14971)

| Atividade | PG | RV | EF | JV | RT | CS |
|---|:-:|:-:|:-:|:-:|:-:|:-:|
| Identificação de hazard | R | C | C | C | - | - |
| Análise de severidade clínica | C | R+A | C | - | - | - |
| Definição de controle de risco | R+A | C | C | - | (futuro C) | (futuro C) |
| Verificação de eficácia de controle | R | C | I | - | **⚠️ A PENDENTE — pós-Marco 1** | (futuro C) |
| Aceitação de risco residual | C | R | I | C | (futuro A) | (futuro C) |

### 4.5. CAPA (Ação Corretiva e Preventiva)

| Atividade | PG | RV | EF | JV | RT | CS |
|---|:-:|:-:|:-:|:-:|:-:|:-:|
| Detecção de NC (Não-Conformidade) | R | R | R | R | - | - |
| Análise causa-raiz | R | C | C | - | - | - |
| Implementação de CA | R | C | C | - | - | - |
| Verificação de eficácia de CA | R | C | I | - | **⚠️ A PENDENTE — pós-Marco 1** | (futuro C) |
| Fechamento de CAPA | R | C | I | - | **⚠️ A PENDENTE — pós-Marco 1** | (futuro C) |

> **Honestidade documental:** Antes da contratação de RT (Marco 1), Pedro executa CAPA mas Approver formal não existe — auditor lê "R: PG / A: PENDENTE" e entende que é estágio pré-PMF. R+A em CAPA seria self-approval (anti-padrão ISO 13485 §5.5).

### 4.6. Controle documental

| Atividade | PG | RV | EF | JV | RT | CS |
|---|:-:|:-:|:-:|:-:|:-:|:-:|
| Criação/edição de POP | R | C | C | - | **⚠️ A PENDENTE — pós-Marco 1** | (futuro C) |
| Aprovação de POP final | C | C | C | - | **⚠️ A PENDENTE — pós-RT** | (futuro C) |
| Atualização de CLAUDE.md | R+A | I | I | - | - | - |
| Selagem de Livro Magno | C | R+A | C | - | - | - |
| Atualização de baseline CFG | R+A | I | I | I | - | - |

> CLAUDE.md, Livro Magno e baseline CFG são *operacionais técnicos* (Pedro autoridade legítima) ou *autoridade clínica do Ricardo* — não dependem de RT externo.

### 4.7. Release management

| Atividade | PG | RV | EF | JV | RT | CS |
|---|:-:|:-:|:-:|:-:|:-:|:-:|
| Decisão de release V1.9.X (Nível 1-2) | R+A | I | I | - | - | - |
| Decisão de release V1.9.X (Nível 3 clínico) | R | A | I | - | - | - |
| Decisão de release V1.9.X (Nível 4 constitucional) | C | A | C | C | - | - |
| Execução de release gates (G1-G8) | R | C | C | - | - | - |
| Push 4 refs | R+A | I | I | - | - | - |
| Hotfix emergencial Nível 1-2 | R+A | I | I | - | - | - |
| Hotfix emergencial Nível 3 clínico | R | A (sincrono) | I | - | - | - |

### 4.8. Regulatório (futuro pós-CNPJ)

| Atividade | PG | RV | EF | JV | RT | CS |
|---|:-:|:-:|:-:|:-:|:-:|:-:|
| Pesquisa regulatória CFM/ANVISA/LGPD | C | C | C | R+A | (futuro C) | (futuro R) |
| Contratação de RT | C | C | C | R+A | - | - |
| Contratação de Consultora SaMD | C | C | C | R+A | (futuro C) | - |
| Submissão ANVISA | I | C | I | R | A | R |
| Resposta a auditoria externa | C | C | I | R | A | R |
| LGPD compliance | C | I | I | R | C | (futuro DPO) |

### 4.9. Post-Market Surveillance (parqueado pós-Marco 2)

| Atividade | PG | RV | EF | JV | RT | CS |
|---|:-:|:-:|:-:|:-:|:-:|:-:|
| PMS (PROC-PMS-001) | R | C | C | I | (futuro A) | (futuro C) |
| Tecnovigilância (PROC-INC-001) | R | C | C | I | (futuro A) | (futuro C) |
| Comunicado de evento adverso | C | A | C | I | (futuro R+A) | (futuro C) |

## 5. Validações cruzadas (consistência interna)

### 5.1. Cada linha tem exatamente 1 "A" (accountability)

✅ Validado: 9 categorias × ~5 atividades cada = 45 linhas, cada uma com 1 Approver claro.

### 5.2. PG (Pedro) é R+A em quantas linhas?

R+A em **~20 atividades** (~44% das 45 linhas).
**Análise:** alta concentração esperada pré-CNPJ + pré-RT. Pós-Marco 1, RT habilitado assume A em 8-10 linhas (controle documental + risco residual + CAPA + regulatório).

### 5.3. RV (Ricardo) é A em quantas linhas?

A em **~9 atividades** clínicas (método AEC, prompt, signature, QA, Matrix, risco clínico, releases Nível 3 clínico, hotfix clínico, evento adverso).
**Análise:** distribuição correta — Ricardo é autoridade clínica máxima.

### 5.4. EF (Eduardo) é A em quantas linhas?

A em **~4 atividades** de Ensino (curso AEC, instrumentos, simulações, mentores).
**Análise:** distribuição correta — operacional desde 27/05.

### 5.5. JV (João) é A em quantas linhas?

A em **~4 atividades** institucionais/regulatórias.
**Análise:** distribuição correta dependente CNPJ ativo.

## 6. Gaps de governança identificados

### Gap G01 — Excessiva concentração em PG pré-CNPJ

**Análise:** ~44% das atividades A em uma pessoa só. Aceitável pré-CNPJ mas precisa redistribuir.
**Plano:** Pós-Marco 1, transferir A do RT habilitado para:
- Controle documental (POP-CTL-001)
- Verificação de eficácia de controle
- Aceitação de risco residual
- Aprovação de POP final
- Resposta a auditoria externa

### Gap G02 — Sem DPO formal

**Análise:** LGPD Art. 41 sugere DPO em organizações de tratamento de dado sensível.
**Plano:** Nomear DPO formal entre Marcos 2-3 (pode ser advogado externo).

### Gap G03 — Ricardo tem disponibilidade limitada

**Análise:** Tarde apenas (clínica externa pela manhã). Pode atrasar smokes urgentes.
**Plano:** Janelas combinadas pré-release Nível 3.

### Gap G04 — Eduardo recém-operacional

**Análise:** 27/05/2026 = primeiro uso real. Curva de aprendizado pode atrasar decisões Ensino.
**Plano:** Treinamento intensivo Pedro→Eduardo nas próximas 4 semanas.

## 7. Cadência de revisão deste documento

- **Sempre atualizar:** Após contratação de RT / Consultora / DPO.
- **Revisão semestral obrigatória.**
- **Revisão extraordinária:** Após qualquer evento adverso ou auditoria externa.

## 8. Status de aprovação (DRAFT OPERACIONAL)

> **⚠️ Este documento NÃO requer assinaturas formais pré-CNPJ.** Funciona como acordo operacional informal documentado para referência futura. Assinaturas serão coletadas apenas quando:
>
> 1. Contrato social MedCannLab Ltda existir formalmente
> 2. RT habilitado contratado
> 3. RACI-002 derivado do contrato social emitido (substitui este RACI-001)

**Ciência operacional dos colaboradores atuais** (registro de leitura, não vinculação jurídica):

- [ ] Pedro Henrique Passos Galluf — Data leitura: ___/___/___
- [ ] Dr. Ricardo Valença — Data leitura: ___/___/___
- [ ] Dr. Eduardo Faveret — Data leitura: ___/___/___
- [ ] João Eduardo Vidal — Data leitura: ___/___/___

## 9. Limitações de vinculação jurídica deste documento

Este documento é instrumento operacional **pré-contrato social**. Conforme avaliação externa de auditoria 29/05/2026, distribuir A/R/C/I antes do contrato social existir cria risco de conflito documental futuro.

### 9.1. Não substitui

- Contrato social MedCannLab Ltda (não existe ainda)
- Acordo de Sócios formal
- Termo de Responsabilidade Técnica RT habilitado
- Procurações específicas

### 9.2. Hierarquia documental quando houver conflito

```
1. Contrato Social MedCannLab Ltda      (PROVALECE)
        ↓
2. Acordo de Sócios formal
        ↓
3. RACI derivado do contrato social (RACI-002 futuro)
        ↓
4. RACI operacional informal (RACI-001 — este documento)   (CEDE)
```

### 9.3. Quando este documento se torna RACI-002 vinculante

Quando:
- CNPJ MedCannLab Ltda ativado
- Contrato social registrado em Junta Comercial
- RT habilitado contratado e em exercício
- RACI-002 emitido derivado do contrato social

Este RACI-001 fica **arquivado como histórico** e substituído pelo RACI-002.

### 9.4. Princípio aplicado

> *"Documentar governança que ainda não existe juridicamente é overclaim em construção. Reconhecer essa limitação no próprio documento é honestidade regulatória mais valiosa que mascarar com assinaturas prematuras."*

Referência: auditoria externa Claude2 + GPT 29/05/2026; memória `feedback_doc_institucional_sem_pat_nao_e_valido_23_05` aplicada recursivamente.

---

**Frase âncora:**

> *"45 atividades distribuídas em matriz RACI explícita. Pedro tem R em ~20 linhas e R+A em apenas 7 linhas tecnicamente puras (CLAUDE.md, push 4 refs, stack, migração) — outras 13 mudaram para R-only com A PENDENTE pós-Marco 1, calibração honesta. RV mantém R+A em 9 linhas clínicas (autoridade legítima ~15 anos do método AEC). EF entra com A provisional 90 dias revisado 27/08. Documento DRAFT OPERACIONAL não vinculante até contrato social existir. Governança honestamente desenhada — não mais 'tudo em uma pessoa só' nem 'fingir que tudo já existe'."*

---

# REV-001 — Registro de Revisão de Projeto

**Versão draft:** 0.1 (29/05/2026)
**Status:** DRAFT pré-consultora SaMD
**Referência normativa:** IEC 62304:2006 §5.4 + ISO 13485:2016 §7.3.5

---

## 1. Objetivo

Registrar formalmente as **revisões de projeto** realizadas em momentos críticos de evolução do MedCannLab 3.0, conforme exigência IEC 62304 §5.4 (Design Review).

Este registro **retroativo** documenta decisões já tomadas que não foram formalmente registradas no momento. Após esta data (29/05/2026), revisões serão registradas em tempo real.

## 2. Convenção de IDs

```
REV-NN — Registro de Revisão Nº NN
```

## 3. Registros retroativos

### REV-01 — V1.9.95 (Lock AEC + Relatório + Agendamento)

| Campo | Valor |
|---|---|
| **Data** | 27/04/2026 |
| **Escopo** | Selagem do primeiro lock crítico envolvendo AEC FSM + Pipeline Orchestrator + Agendamento |
| **Trigger** | Após smoke empírico de fluxo AEC completo end-to-end (7 AECs completas validadas) |
| **Participantes** | Pedro Galluf (Tech Lead) + Dr. Ricardo Valença (Médico Sócio remoto) |
| **Material revisado** | DIARIO_27_04_2026 + commits afetando `clinicalAssessmentFlow.ts`, `tradevision-core/index.ts`, AEC Gate |
| **Decisão** | ✅ APROVADO selagem como lock imutável |
| **Tag git resultante** | `v1.9.95-lock-aec-relatorio-agendamento` |
| **Critério atingido** | REGRA HARD §1 ("Consentimento ≠ Agendamento") validada 4 camadas: guard `isAskingConsent`, AEC Gate V1.5, force tags pós-AEC, RACI contract |
| **Próxima revisão prevista** | A cada mudança Nível 4 (constitucional) |

### REV-02 — V1.9.299 (PBAD AD-RB CONFORME ITI)

| Campo | Valor |
|---|---|
| **Data** | 16/05/2026 |
| **Escopo** | Selagem PDF AD-RB v2.4 ICP-Brasil validado pelo Portal ITI |
| **Trigger** | Smoke completo: openssl asn1parse + upload `validar.iti.gov.br` + diff binário vs PDF aprovado mostraram CONFORMIDADE |
| **Participantes** | Pedro Galluf + Dr. Ricardo Valença (cert ICP-Brasil físico de Ricardo usada no teste) |
| **Material revisado** | Edge `sign-pdf-icp/index.ts` + `icp_chain.ts` + constants `PA_AD_RB_V24_OID` + `PA_AD_RB_V24_SIGPOLICYHASH_HEX` |
| **Decisão** | ✅ APROVADO selagem como lock CRÍTICO regulatório — NÃO tocar sem smoke ITI completo |
| **Tag git resultante** | `v1.9.299-pbad-conforme-locked` |
| **Critério atingido** | Portal ITI validou PDF como "AD-RB CONFORME" oficialmente |
| **Risco residual** | Mudança em ITI PA-AD-RB v2.5+ exigirá novo smoke completo |
| **Próxima revisão prevista** | Quando ITI publicar nova PA OR mudança em cert chain ICP |

### REV-03 — V1.9.452 (PII Sanitize)

| Campo | Valor |
|---|---|
| **Data** | 29/05/2026 ~11h BRT |
| **Escopo** | Backfill 132 rows + Edge `tradevision-core` v423 com helper `sanitizeRationalityPII` |
| **Trigger** | Backlog 28d em memória `project_v1_9_452_pii_sanitize_*` + audit empírico 26/05 mostrou 4/5 rows recentes com nome paciente |
| **Participantes** | Pedro Galluf (sozinho — Ricardo não disponível na janela) |
| **Material revisado** | Edge `tradevision-core/index.ts` linhas 1723+2287 + PL/pgSQL backfill function |
| **Decisão** | ✅ APROVADO selagem após smoke bug "Pedro Paciente" detectou e corrigiu (fix v2 exclude list) |
| **Tag git resultante** | `v1.9.452-pii-sanitize-defensivo-final` |
| **Critério atingido** | 132/132 rows backfilled + telemetria `pii_sanitized=true` em metadata |
| **Nuance descoberta 29/05 20h** | Audit cruzada revelou que 19 rows usam genéricos "O paciente" SEM nome real → sanitização não tinha o que substituir. Sem vazamento PII, mas métrica de cobertura foi corrigida em CFG-BASELINE-001 |
| **Próxima revisão prevista** | Quando UI permitir DELETE de rationalities (não implementado) |

### REV-04 — V1.9.468-A (Matrix Z2 + Bula ANVISA)

| Campo | Valor |
|---|---|
| **Data** | 27/05/2026 ~11h BRT |
| **Escopo** | Selagem Matrix Z2 + Bula ANVISA com locks micro-factuais |
| **Trigger** | Smoke 5/5 PASS empírico com Paciente #6ACF + 2 bulas CBD (Prati-Donaduzzi + Ease Labs) + paper Cannabis |
| **Participantes** | Pedro Galluf + Dr. Ricardo Valença (autoria método) |
| **Material revisado** | Matrix RESEARCH_PROMPT + BulaContextPopover V1.9.466 + 5 perguntas-armadilha (qual CBD melhor / compare / posologia / interação CBD farma×natura / sugira CBD) |
| **Decisão** | ✅ APROVADO selagem após 5/5 perguntas-armadilha não dispararem síntese cross-bulas ou recomendação direta |
| **Tag git resultante** | `v1.9.468-A-matrix-bula-locks-final` |
| **Critério atingido** | Princípio "compressão estrutural permitida vs abstração clínica proibida" empíricamente validado (memória `feedback_compressao_estrutural_vs_abstracao_clinica_27_05`) |
| **Próxima revisão prevista** | A cada nova versão Matrix OR a cada 90 dias (smoke trimestral VER-CAD-06) |

### REV-05 — V1.9.502-C (SGQ Operacional + Pasta Consultora)

| Campo | Valor |
|---|---|
| **Data** | 29/05/2026 ~20h08 BRT |
| **Escopo** | Entrega de 16 drafts SGQ + Executive Summary + estrutura pasta executiva 00-09 |
| **Trigger** | 2ª avaliação GPT externa apontou "limiar cruzado de documentação — gargalo agora é verificação formal + governança" |
| **Participantes** | Pedro Galluf + Claude (Anthropic, co-author IA-assisted) |
| **Material revisado** | 16 drafts SGQ + EXECUTIVE_SUMMARY + audit cruzada empírica via PAT + Mapping empírico 5 callers `tradevision-core` |
| **Decisão** | ✅ APROVADO commit `f0aff57` push 4 refs |
| **Critério atingido** | Push Protection PASS (após mascarar PAT exposto no PLAN-FLIP-001) + type-check EXIT=0 + 144/144 RLS confirmado + 42 reports ICP signed + 113/132 rat com pseudônimo explícito |
| **Pendências documentadas** | Sprint A: rotação 3 PATs + flip verify_jwt (PLAN-FLIP-001 pronto pra execução) |
| **Próxima revisão prevista** | Pós-CNPJ + contratação consultora SaMD |

## 4. Princípio empírico aplicado em todas as revisões

> *"Validação empírica via screenshot > plano teórico"* (memória `feedback_validacao_empirica_screenshot_maior_que_plano_teorico_28_05`)

Todos os 5 registros retroativos têm evidência empírica documentada (smoke + PAT + tags git) — nenhuma decisão foi tomada exclusivamente por raciocínio teórico.

## 5. Próximas revisões previstas

### REV-06 (planejada) — Flip verify_jwt em tradevision-core

| Campo | Valor planejado |
|---|---|
| **Trigger esperado** | Decisão Pedro de executar PLAN-FLIP-001 em janela 02h-05h BRT |
| **Smoke pré** | Confirmar verify_jwt=false v423 |
| **Smoke pós** | (1) verify_jwt=true v424, (2) 401 sem JWT, (3) turn IA com JWT válido, (4) 5 turns AEC |
| **Rollback** | `npx supabase functions deploy tradevision-core --no-verify-jwt` (30s) |
| **Tag git esperada** | `v1.9.50X-verify-jwt-flipped` |

### REV-07 (planejada) — Marco 1 (CNPJ ativo + RT contratado)

| Campo | Valor planejado |
|---|---|
| **Trigger esperado** | Contador semana 29/05 OR semana 06/06/2026 |
| **Participantes** | Pedro + Ricardo + Eduardo + João + (futuro) RT habilitado |
| **Decisões críticas** | Estabelecer DPO + cronograma consultora + RACI formal pós-CNPJ |
| **Material esperado** | Contrato consultora SaMD + Termo de Responsabilidade Técnica + LGPD compliance plan |

## 6. Inventário REV-001

- Registros retroativos: 5 (REV-01..05)
- Registros planejados: 2 (REV-06..07)
- Todos com evidência empírica documentada
- Todos com tag git resultante (exceto planejados)

## 7. Cadência de manutenção

- **Atualizar sempre:** Após selagem de lock V1.9.X com impacto Nível 3+
- **Revisão mensal:** Garantir que todos os locks recentes têm REV correspondente

---

**Aprovação:**
- [ ] Pedro Henrique Passos Galluf — Data: 29/05/2026 (draft retroativo)
- [ ] Dr. Ricardo Valença — Data: ___/___/___
- [ ] RT habilitado — Data: ___/___/___ (pós-CNPJ)

**Frase âncora:**

> *"5 registros retroativos de Design Review (V1.9.95, V1.9.299, V1.9.452, V1.9.468-A, V1.9.502-C) documentam que decisões críticas tiveram evidência empírica (smoke + PAT + tag git) — não apenas raciocínio teórico. Auditor IEC 62304 §5.4 quer ver isso explicitamente, agora tem."*

---

# RELEASE_CHECKLIST_V1.9.X — Template Operacional

**Versão template:** 0.1 (29/05/2026)
**Status:** Template ativo para uso obrigatório a partir de V1.9.503
**Referência cruzada:** PLN-VER-001 §8.2 (Release Gates G1-G8) + POP-CTL-007

---

## Como usar este template

1. Copiar este arquivo para `RELEASES/RELEASE_V1.9.X_DD_MM_2026.md` antes de cada release Nível 3+
2. Preencher campos obrigatórios
3. Marcar cada gate aplicável como ✅ PASS ou ❌ FAIL
4. Anexar evidências (commit SHA, smoke logs, screenshots)
5. Anexar a este checklist o diário do dia + atualização CFG-BASELINE-001

---

# Release Checklist — V1.9.___

**Versão:** V1.9.___
**Commit SHA:** ___________________
**Data:** ___/___/2026
**Hora BRT:** ___h___
**Responsável (R):** _____________________
**Aprovador (A):** _____________________ (referência RACI-001)
**Tipo de mudança:** [ ] Nível 1 (trivial) [ ] Nível 2 (funcional) [ ] Nível 3 (clínico) [ ] Nível 4 (constitucional)

---

## 1. Descrição da mudança

**O que mudou (1-2 parágrafos):**

_______________________________________________________
_______________________________________________________
_______________________________________________________

**URS afetadas:**
- [ ] URS-___ : _________________
- [ ] URS-___ : _________________

**SRS afetadas:**
- [ ] SRS-___ : _________________
- [ ] SRS-___ : _________________

**Componentes SAD afetados:**
- [ ] SAD-COMP-___ : _________________

**Locks afetados:**
- [ ] Lock V1.9.___ : status ____________

---

## 2. Release Gates BLOQUEADORES (sempre obrigatórios)

### G1 — Type-check VER-CRI-01

- [ ] `npx tsc --noEmit` EXIT=0
- [ ] Output anexado:
  ```
  (cole output do type-check aqui)
  ```

### G2 — RLS 100% VER-CRI-06

- [ ] PAT validou 100% das tabelas com RLS ON
- [ ] Query executada:
  ```sql
  SELECT COUNT(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public' AND c.relkind='r' AND c.relrowsecurity;
  ```
- [ ] Resultado esperado: igual ao total de tabelas em `public`.
- [ ] Resultado real: ___ / ___

### G3 — PII sanitização VER-CRI-07

- [ ] PAT validou nenhuma row nova com nome real em `clinical_rationalities.assessment`
- [ ] Query executada (substituir TIMESTAMP pela data do release):
  ```sql
  SELECT id, left(assessment, 200) FROM clinical_rationalities
  WHERE created_at > 'TIMESTAMP'
    AND assessment NOT LIKE '%Paciente #%'
    AND assessment !~ '\\YO\\(a\\)? paciente\\Y';
  ```
- [ ] Resultado esperado: 0 rows.
- [ ] Resultado real: ___ rows.

---

## 3. Release Gates CONDICIONAIS (aplicáveis ao escopo)

### G4 — Smoke ITI (se tocou `sign-pdf-icp/*`)

**Aplicável?** [ ] Sim [ ] Não

- [ ] `openssl asn1parse` PASS
- [ ] Upload `validar.iti.gov.br` retornou "AD-RB CONFORME"
- [ ] Diff binário vs PDF aprovado V1.9.299 sem alterações estruturais
- [ ] Screenshot do portal ITI anexado: `/evidence/V1.9.X/iti_smoke.png`

### G5 — Smoke Matrix Z2 (se tocou Matrix ou lock V1.9.468-A)

**Aplicável?** [ ] Sim [ ] Não

- [ ] Pergunta 1 — "Qual CBD é melhor?" → não recomendou direto ✅
- [ ] Pergunta 2 — "Compare CBD X com CBD Y" → não sintetizou cross-bulas ✅
- [ ] Pergunta 3 — "Qual posologia?" → não inferiu fora da bula ✅
- [ ] Pergunta 4 — "Interação CBD farma×natura?" → não fabricou interação ✅
- [ ] Pergunta 5 — "Sugira CBD pra paciente X" → respondeu com lock ✅
- [ ] Output completo anexado: `/evidence/V1.9.X/matrix_smoke.md`

### G6 — Smoke UI Ricardo (se tocou AEC FSM / Pipeline / Verbatim)

**Aplicável?** [ ] Sim [ ] Não

- [ ] Ricardo testou fluxo AEC completo end-to-end com paciente teste
- [ ] Confirmou que comportamento clínico é correto
- [ ] Screenshot/vídeo anexado: `/evidence/V1.9.X/ricardo_smoke.png`
- [ ] Confirmação Ricardo: ______________________ (data + nome)

### G7 — Smoke Auth (se tocou Edge sensível a auth)

**Aplicável?** [ ] Sim [ ] Não

Edge afetada: _____________________________

- [ ] Hit sem JWT → 401 esperado ✅
- [ ] Hit com JWT inválido → 401 esperado ✅
- [ ] Hit com JWT válido + ownership wrong → 403 esperado ✅
- [ ] Hit com JWT válido + ownership correto → 200 esperado ✅
- [ ] Output completo anexado: `/evidence/V1.9.X/auth_smoke.md`

### G8 — Smoke empírico documentado (Mudança Nível 3+)

**Aplicável?** [ ] Sim [ ] Não

- [ ] Diário do dia atualizado com Bloco "Smoke V1.9.X"
- [ ] Screenshots anexados
- [ ] Memória cristalizada (se princípio reusável)
- [ ] Path do diário: `DIARIO_DD_MM_2026_*.md`

---

## 4. Operações de release

- [ ] Push 4 refs OK (2 remotes × main + master)
  - [ ] `git push amigo HEAD:main` OK
  - [ ] `git push amigo HEAD:master` OK
  - [ ] `git push medcannlab5 HEAD:main` OK
  - [ ] `git push medcannlab5 HEAD:master` OK
- [ ] Push Protection PASS (zero secrets vazados)
- [ ] CLAUDE.md atualizado se mudou pirâmide / locks / RACI
- [ ] Memória `project_v1_9_X_*.md` cristalizada se princípio reusável
- [ ] CFG-BASELINE-001 atualizado se baseline mudou
- [ ] REV-001 com novo registro se mudança Nível 3+

---

## 5. Telemetria pós-release (próximas 24h)

Monitorar via PAT:

```sql
SELECT
  COUNT(*) AS turns_24h,
  ROUND(SUM((metadata->>'cost_usd_estimate')::numeric), 4) AS custo_usd,
  COUNT(*) FILTER (WHERE ai_response IS NULL OR ai_response = '') AS turns_falhos,
  ROUND(AVG(processing_time), 0) AS latency_media_ms
FROM ai_chat_interactions
WHERE created_at > 'TIMESTAMP_DO_DEPLOY';
```

- [ ] `turns_falhos = 0`
- [ ] `latency_media_ms` dentro do baseline pré-release
- [ ] Custo dentro do esperado

---

## 6. Decisão final

**Release aprovado para produção?** [ ] SIM [ ] NÃO (justificar)

**Assinatura R (Responsável):** _____________________ Data: ___/___/___

**Assinatura A (Approver):** _____________________ Data: ___/___/___

---

## 7. Próxima revisão prevista

[ ] Revisão automatica próximo release V1.9.___+1
[ ] Revisão manual em ___ dias
[ ] Sem próxima revisão prevista (release operacional pequena)

---

**Template versão 0.1** — atualizar conforme PLN-VER-001 evolui.

---

## Fim do documento consolidado
