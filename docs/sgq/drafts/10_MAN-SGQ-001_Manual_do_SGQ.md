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
