# Addendum técnico — Observabilidade Narrativa Longitudinal

**MedCannLab → Muhdo Health Ltd (UK)**
Reunião: 08/05/2026 14h BRT / 18h BST
Preparado por: Pedro Henrique Passos Galluf (CTO) com Dr. Ricardo Valença

---

## A categoria

Cardiologia digital mede biomarcadores. Saúde mental digital mede mood scales.
**MedCannLab mede a estrutura da entrevista clínica.**

Não competimos com Apple Health, Whoop, Fitbit ou Doctoralia. Competimos com **a forma como dados clínicos são organizados antes do encontro médico**.

> *"Captura de dados ≠ preservação narrativa. Sintoma é a vida."*
> — Dr. Ricardo Valença, criador do método AEC

A categoria que emerge: **observabilidade narrativa longitudinal**.

---

## 9 KPIs que MedCannLab JÁ MEDE empíricamente

Validados via PostgreSQL Management API em 08/05/2026 ~03h BRT.
Cohort beta intencional pré-PMF: 40 users (22 PAID), ~50 amigos beta.

### Camada 1 — Narrativa

| KPI | O que mede | Hoje |
|---|---|---|
| **Profundidade da escuta** | Completude estrutural da entrevista (10 etapas AEC, Verbatim First, "O que mais?" obrigatório) | Médio score 79/100 (último real) |
| **Coerência clínica longitudinal** | Sintomas consistentes entre encontros, sem drift conceitual | clinical_assessments.consensus_revisions |
| **Densidade clínica** | Riqueza de informação clinicamente relevante por encontro | 1.369 verbatim entries hashed em 30d |

### Camada 2 — Longitudinal

| KPI | O que mede | Hoje |
|---|---|---|
| **Continuidade do cuidado** | Retomada do vínculo clínico, frequência de AECs | 61 AECs / 16 completas (cohort beta intencional) |
| **Aderência longitudinal** | Compareceu, completou, retornou | 245 video_call_requests / 114 accepted (46.5%) |
| **Evolução narrativa** | Delta semântico entre encontros (preserva fala original) | clinical_reports.signed_at distribution |

### Camada 3 — Governança

| KPI | O que mede | Hoje |
|---|---|---|
| **Auditabilidade clínica** | Toda interação rastreável end-to-end | 1.493 ai_chat_interactions/30d com hash |
| **Assinatura ICP-Brasil REAL** | PKCS#7 RFC 3852 verificável em assinador.gov.br | Cert Ricardo (DigitalSign A1) ATIVO |
| **Imutabilidade pós-assinatura** | Trigger CFM 2.314/2022 anti-fraude clínica | trg_cfm_prescriptions_immutability ATIVO |

---

## A arquitetura que sustenta

**Pirâmide de governança em 8 camadas** — onde GPT é o último a falar e o primeiro a ser checado:

```
Camada 0  Constituição §1 (consentimento ≠ agendamento — anti-kevlar §1)
Camada 1  COS Kernel v5.0 (KillSwitch, Trauma, Metabolismo, ReadOnly, Policy)
Camada 2  AEC FSM (19 fases determinísticas)
Camada 3  Verbatim First V1.9.86 (~46% bypass GPT em hard-lock)
Camada 4  AEC Gate V1.5 (bloqueia agendamento durante AEC ativa)
Camada 5  GPT-4o-2024-08-06 / gpt-4o-mini (último a falar)
Camada 6  Pós-processamento (strip tokens, validate UUID, force tags)
Camada 7  Pipeline Orchestrator (REPORT→SCORES→SIGNATURE→AXES→RATIONALITY→DONE)
```

**46% das interações em hard-lock bypassam o LLM.** GPT é commodity acima da camada FSM. Trocar modelo não destrói o sistema.

---

## A linguagem certa

> Não é **score de saúde**.
> É **observabilidade da qualidade estrutural do encontro clínico**.

Distinção crítica regulatoriamente:
- ❌ NÃO classificamos paciente em "saudável" / "doente"
- ✅ Classificamos qualidade da estrutura da entrevista (completude, coerência, organização narrativa)

A interpretação clínica permanece com o profissional. A IA organiza a fala. O médico interpreta.

> *"IMRE pergunta. AEC escuta. O relatório organiza. A clínica interpreta."*
> — Frase canônica do método

---

## Pontos de convergência com Muhdo

Muhdo mede **corpo** (DNA, epigenome, biomarcadores).
MedCannLab mede **voz da clínica** (estrutura narrativa, continuidade, escuta).

```
                  Paciente Muhdo + AEC MedCannLab
                          ↓
                    Perfil 360°
              ┌─────────────────────┐
              │ Genético / epigênico │  ← Muhdo
              │ Biomarcadores         │
              ├─────────────────────┤
              │ Narrativa             │  ← MedCannLab
              │ Continuidade clínica  │
              │ Densidade da escuta   │
              └─────────────────────┘
                          ↓
                  Único em UK e Brasil
```

**Pergunta concreta pra Muhdo:** existe formato de exporte/import que permita biomarcadores Muhdo enriquecerem o `clinical_reports.content` do MedCannLab? E o `clinical_assessments` MedCannLab informarem priorização de painéis Muhdo?

---

## Proof points 30 dias (validados PAT 08/05 ~03h BRT)

```
INFRAESTRUTURA OPERACIONAL
  135 tabelas PostgreSQL
  11 Edge Functions ACTIVE (Deno)
  12 tabelas Realtime
  2 pg_cron jobs (reminders 5min + monthly closing)
  3 triggers críticos ATIVOS (CFM imutabilidade + team consenso)

ATIVIDADE ÚLTIMOS 30 DIAS
  1.493 ai_chat_interactions (49,8/dia)
  1.369 verbatim entries hashed
  245 video_call_requests / 114 accepted (46,5% rate)
  61 AECs (16 completas — 26% conclusion empírica beta)
  102 clinical_reports / 22 com signed_at hash auditável

ICP-BRASIL EMPÍRICO REAL
  1 cert PKCS#12 ativo (Ricardo, DigitalSign A1, válido 2027-05-06)
  1 prescrição com PKCS#7 RFC 3852 REAL (3.552 bytes binário)
  Edge digital-signature v64 dual-mode (REAL ↔ simulação)
  Edge cert-encrypt-password v3 (separação de cifragem)
  Trigger CFM 2.314/2022 imutabilidade pós-assinatura ATIVO

GOVERNANÇA INSTITUCIONAL
  Lock V1.9.95+97+98+99-B intocado em 200+ commits
  Tag estável v1.9.113-locked preservada
  Anti-kevlar §1 (Constituição só muda via nova versão Magno)
```

---

## 4 modelos de colaboração possíveis

### 1. Integração técnica (data-level)
- Muhdo expõe API de biomarcadores
- MedCannLab consome via Edge function dedicada
- Paciente autoriza enriquecimento (LGPD + GDPR)
- Score genético + observabilidade narrativa = perfil dual

### 2. Co-pesquisa longitudinal
- Cohort UK + Brasil pareada
- Muhdo: epigenome quarterly
- MedCannLab: AECs + verbatim mensais
- Paper conjunto: "Biological + narrative intelligence in chronic care"

### 3. White-label cruzado
- Muhdo embute "MedCannLab AEC" em consultas com clientes UK
- MedCannLab embute "Muhdo panel" em pacientes Brasil pré-cannabis
- Co-marca em ambas direções

### 4. Standards working group
- Definir formato comum de "narrative + biological summary"
- Apresentar em FHIR R5 ou OpenEHR
- MedCannLab + Muhdo + 1-2 outros = grupo de trabalho

---

## 3 perguntas pra Muhdo

1. **Volume e cadência:** quantos perfis genéticos/epigenéticos vocês processam mensalmente em UK? Qual cadência de reavaliação biológica recomendam?

2. **Priorização:** quando um paciente apresenta múltiplos sinais narrativos longitudinais (fadiga crônica + dor + alteração de humor), qual painel genético/epigenético vocês priorizariam pra investigar?

3. **Compliance:** vocês têm experiência com integração GDPR + LGPD em pareceria multi-país? Quais salvaguardas vocês recomendariam pra dados clínicos cruzados Brasil-UK?

---

## Não somos um chatbot médico

```
Somos uma camada de observabilidade longitudinal sobre o cuidado.
                           ↓
        Method-first, architecture-grounded, AI-last.
                           ↓
       A cadência da Nôa Esperanza emerge da arquitetura
              de governança, não do modelo.
```

---

*Preparado em 08/05/2026 entre 03h-09h BRT pra reunião 14h BRT / 18h BST. Auditado empiricamente via Supabase Management API. Lock CORE V1.9.95+97+98+99-B preservado em 200+ commits. Pré-PMF empírico transparente: 22 PAID em cohort intencional, 8 ativos últimos 30d, sem inflação de números. Method-first, sempre.*
