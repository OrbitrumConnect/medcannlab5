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
