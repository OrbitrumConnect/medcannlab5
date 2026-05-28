---
name: pacientes-reais-vs-testes-clinical-rationalities-27-05
description: "Empírico cristalizado 27/05 ~16h BRT após Pedro confirmar nominalmente cada paciente nas 130 rows clinical_rationalities: apenas 1 paciente externo REAL confirmado (Maria das Dores Pinto Pitoco com 3 rationalities, sob acompanhamento Dr. Ricardo + 1 row sidecar renal V1.9.307) + 1 incerto (Mariana Carvalho — validar Ricardo) = ~3-4 rows reais (2-3%). ~126 rows (~97%) são testes internos: sócios + admin + namorada Pedro + amigos pessoais Pedro. Backfill PII V1.9.452 trivial empíricamente (~3-4 UPDATEs em vez de 115). Implicação Marco 2: validação clínica formal SaMD VAZIA — Marco 2 paciente externo pagante é gatilho ABSOLUTO pra dossiê SaMD ter substância empírica. Gilda Cruz Siqueira existe (paciente real Ricardo cadastrada 19/01/2026) MAS 0 rationalities (só 2 exames) — paciente sem passagem completa fluxo AEC. João Guimarães mencionado em caso V1.9.455 NÃO é conta separada (provavelmente nome em campo livre patient_name)."
metadata:
  node_type: memory
  type: feedback
  originSessionId: 00be2b9f-5dbc-4236-a02e-1459c3f57bd2
---

# 🔍 Pacientes REAIS vs TESTES em clinical_rationalities — empírico 27/05 ~16h BRT

## Contexto

Audit empírico via PAT (`sbp_6ca2f018...`) revelou **130 rows** em `clinical_rationalities` distribuídas entre 12 pacientes únicos. Pedro confirmou nominalmente cada email/nome ao longo da sessão 27/05, permitindo separação **honesta** entre testes internos e pacientes reais.

## 📊 Tabela empírica completa — 12 pacientes únicos

| Email | Nome | Rows | Categoria final confirmada |
|---|---|---|---|
| carolinacampellovalenca@gmail.com | Carolina Campello do Rêgo Valença | **48** | 🔴 TESTE (sócio-família Ricardo — CLAUDE.md confirma) |
| casualmusic2021@gmail.com | Pedro Paciente | **39** | 🔴 TESTE admin (nome "Pedro Paciente" é placeholder) |
| passosmir4@gmail.com | passosmir4 | **11** | 🔴 TESTE Pedro tech lead |
| phpg69@gmail.com | Pedro | **9** | 🔴 TESTE Pedro admin |
| **mariahelenaearp@gmail.com** | **Maria Helena Chaves** | **5** | 🔴 **TESTE — NAMORADA Pedro** (confirmação 27/05) |
| **pontes.cristiano@hotmai.c** | **Cristiano Pontes** | **4** | 🔴 **TESTE — AMIGO Pedro** (confirmação 27/05) |
| cbdrcpremium@gmail.com | João Eduardo Vidal | **3** | 🔴 TESTE sócio (João Vidal) |
| **mariappitoco@gmail.com** | **Maria das Dores Pinto Pitoco** | **3** | ✅ **REAL — PACIENTE Ricardo** (única confirmada; também 1 row sidecar renal V1.9.307) |
| **mateus4812@gmail.com** | **Mateus Chagas** | **3** | 🔴 **TESTE — AMIGO Pedro** (confirmação 27/05) |
| jvbiocann@gmail.com | joao eduardo | **3** | 🔴 TESTE sócio (João Vidal segundo email teste) |
| marianacarvalhomgd@gmail.com | Mariana Carvalho | **1** | 🟡 **INCERTO** (validar com Ricardo no laptop) |
| rrvalenca@gmail.com | Dr. Ricardo Valença | **1** | 🔴 TESTE sócio-médico próprio |

## 🔢 Síntese final

| Categoria | Rows | % | Pessoas |
|---|---|---|---|
| **Testes internos** (sócios + admin + namorada + amigos Pedro) | **126** | **96,9%** | 11 |
| **Pacientes REAIS confirmados** | **3** | **2,3%** | 1 (Maria das Dores Pinto Pitoco) |
| **Incerto** | **1** | **0,8%** | 1 (Mariana Carvalho — pendente Ricardo) |
| **TOTAL** | **130** | 100% | 12 |

## 🎯 Implicações empíricas críticas

### 1. Backfill V1.9.452 é UTLRA-TRIVIAL

Anteriormente estimava 115 UPDATEs cuidadosos com risco mutilação clínica. **Realidade empírica**: apenas **3-4 UPDATEs cirúrgicos** (Maria Pinto + Mariana se for real). Smoke trivial — 15min com aprovação Ricardo.

### 2. Validação clínica formal SaMD está VAZIA

Para certificação SaMD (RDC 657/2022 + ISO 13485 §7.3.6), validação clínica formal exige base empírica com pacientes REAIS. Estado atual: **1 paciente real com 3 rationalities + 1 sidecar renal**. **Insuficiente pra dossiê SaMD substantivo.**

**Implicação**: **Marco 2 (paciente externo pagante)** é gatilho ABSOLUTO. Sem 5-10 pacientes externos pagantes empíricos integrados ao framework `clinical_qa_runs`, dossiê SaMD é fragmentário.

### 3. Pre-PMF declarável é REAL, não retórica

CLAUDE.md já declarava "pré-PMF (zero pacientes externos pagantes)". Confirmação empírica via audit nominal: **VERDADE empírica** — não há paciente externo pagante. Pedro/Ricardo/sócios + namorada/amigos = ecossistema interno.

### 4. Gilda Cruz Siqueira — gap empírico interessante

- Paciente real Ricardo cadastrada **19/01/2026** (gildacscacomanga@gmail.com)
- **0 AEC + 0 reports + 2 exames apenas**
- NÃO tem rationalities (não aparece nas 130 rows)
- **Paciente real sem passagem completa pelo fluxo AEC** — gap clínico empírico

**Implicação produto**: fluxo AEC tem fricção que paciente real Gilda (cadastrada há 4+ meses) não atravessou completamente. Investigar UX.

### 5. João Guimarães — conta separada não existe

Mencionado no caso V1.9.455 (26/05 backfill exam_request PDF ICP). **NÃO é conta separada em `users`** — provavelmente nome em campo livre `patient_name` de prescrição/exame. Não conta nas 130 rows rationalities.

## 🛠️ Ações práticas decorrentes

### Pré-Marco 2 (laptop com Ricardo)

1. **Validar Mariana Carvalho com Ricardo** — paciente real ou amiga/teste? (5min)
2. **Aprovar backfill 3-4 rows reais** (Maria Pinto + eventualmente Mariana) — 15min cirúrgico após Ricardo OK
3. **Investigar gap Gilda** — por que paciente cadastrada 4+ meses não completou AEC? UX issue?

### Marco 2 (gatilho ABSOLUTO certificação SaMD)

1. Integrar 5-10 pacientes externos pagantes formalmente
2. Acompanhar cada um pelo framework `clinical_qa_runs`
3. Documentar validação clínica formal
4. Base empírica pra petição ANVISA

### Para próxima sessão Claude

**Não-redescobrir** este achado. Próxima sessão que tocar:
- Backfill PII histórico → escopo reduzido a ~3-4 rows
- Validação clínica formal → 1 paciente real apenas
- Estimativas pacientes externos → 0 (não "30 patient role")
- Marco 2 prioridade → ABSOLUTA

## 🪶 Frase âncora

> *"96,9% das rows são testes internos. Pré-PMF empírico é VERDADE, não retórica. Marco 2 paciente externo pagante é gatilho ABSOLUTO pra dossiê SaMD substantivo — não há atalho."*

## Conexões com princípios cristalizados

- [[project_supabase_compliance_lgpd_anvisa_e_pacientes_reais_27_05]] — análise compliance Supabase 65% + integra esta correção
- [[feedback_engenharia_perfeita_pode_produzir_semanticamente_inadequado_24_05]] — engenharia pode estar boa, contexto empírico continua escasso
- [[reference_lock_v1_9_388_a3_ancoragem_regulatoria_multicamada_27_05]] — Marco 2 é gatilho regulatório
- `docs/MEDCANNLAB_SGQ_INDICE_PRELIMINAR_27_05.md` — §7.3.6 GAP REAL validação clínica formal mencionado
- `docs/MEDCANNLAB_SGQ_INDICE_AUDITOR_27_05.md` — Seção 6 menciona "1 paciente externa real com 3 racionalidades"

## Anti-padrão a vigiar

- ❌ Declarar publicamente "MedCannLab tem N pacientes acompanhados" usando contagem total `users.type = patient` (31) — esses são predominantemente testes internos
- ❌ Material institucional citar "X racionalidades aplicadas" sem qualificar = testes (130 rows ≠ 130 pacientes reais)
- ❌ Investidor / auditor / ANVISA receber número agregado sem distinção real vs teste = overclaim implícito

**Sempre qualificar empíricamente em comunicação externa**: *"plataforma pré-PMF com 1 paciente externa real acompanhada + ~10 pacientes testes internos completos + ~20 testes internos parciais"*.
