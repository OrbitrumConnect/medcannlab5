# Migração de Base Clínica — Spec (roadmap dashboard profissional)

> **Problema concreto que resolve:** *"Tenho meus pacientes em outro sistema e quero começar a usar a MedCannLab amanhã sem cadastrar um por um."*
>
> **Enquadramento (cravado 03/06):** NÃO é "importador do Eduardo" — é **feature de plataforma**. Eduardo, Ricardo, outro neurologista, clínica com 10 mil pacientes → o fluxo é **o mesmo**. Pensar como **"Migração de Base Clínica"**. O export real do Eduardo (1.629 pacientes, volume + estrutura reais) é a **base de validação** da v1.
>
> **Status:** roadmap. Fundação iniciada (V1.9.577 proveniência). Real load **gated** em Marco 1 (CNPJ → DPA/termos).

---

## 1. Por que entra agora no roadmap

Com o **CNPJ entrando este mês**, passa de "ideia futura" para roadmap do dashboard profissional. Destrava o onboarding de médicos com base existente (Marco 2/3) sem cadastro 1-a-1.

---

## 2. Gap map empírico (03/06, via PAT + código)

### ✅ Já existe (reusar)
- Profissional cria paciente manualmente (`/app/new-patient?mode=manual`)
- Importa CSV simples / demografia (`PatientImportModal`, RPC `create_patient_user`)
- Prontuário + documentos (`patient_medical_records`, `patient_documents`)
- Menu **"Novo Paciente"** dentro do `PatientsManagement` (lar da UI)
- Demografia mapeia 1:1 (`users`: name/email/cpf/birth_date/gender/phone/address/blood_type/allergies/medications)

### ❌ Não existe (construir)
1. **Proveniência** ("este dado veio de import externo") — *V1.9.577 RESOLVE* ✅
2. **Visibilidade automática do paciente importado** para o médico sem consulta prévia
3. **Importação de prontuário completo** (pacientes + exames + prescrições + documentos)
4. **Upload ZIP** de export de EMR + **wizard de revisão** antes de gravar
5. **Gate de termos/DPA**

### ⚠️ Achado de schema crítico (anti-regressão)
`patient_doctors` é uma **VIEW** (derivada de appointments), NÃO tabela. A lista de pacientes do profissional (`getAllPatients`, adminPermissions.ts) deriva de **clinical_assessments + appointments** — paciente importado (sem nenhum) seria **invisível**. → **#1 exige TABELA DE VÍNCULO NOVA** (a view não serve).

---

## 3. Fluxo (wizard 6 etapas) — dentro de Pacientes → Novo Paciente → **Importar Prontuário (ZIP)**

| Etapa | O quê | Grava? |
|---|---|---|
| **1. Termos** | *"Declaro que sou o controlador destes dados e possuo base legal para utilização."* Aceite obrigatório. | — |
| **2. Upload** | ZIP Ninsaúde / iClinic / Clínica nas Nuvens / MedCannLab / CSV customizado | — |
| **3. Análise** | Lê o arquivo e mostra contagens (ex: 1.629 pacientes, 537 exames, 7.126 prescrições, 9.437 evoluções, 9.544 documentos) | **NÃO** |
| **4. Mapeamento** | Origem→Destino (Patients→Pacientes, Notes→Evoluções, Prescriptions→Histórico, Files→Documentos, Exams→Exames) | — |
| **5. Preview** | Novos / Duplicados / Para mesclar (dedup por CPF→email→source_external_id) | — |
| **6. Importação** | Cria `users` + vínculo + `patient_medical_records` + `patient_documents` + históricos, marcando `import_batch_id` / `source_system` | **SIM** |

---

## 4. Arquitetura — convergência FHIR (anti-reescrita RNDS)

```
Export ZIP ─┐
            ├─► NÚCLEO FHIR (modelo interno) ─► popula tabelas
RNDS/API  ──┘
```
- **Hoje:** médico sobe ZIP (adaptador arquivo).
- **Amanhã:** sistema conversa por API FHIR/RNDS (adaptador API).
- **Ambos convergem** no mesmo modelo interno → não reescreve quando chegar RNDS. (Serializer FHIR já validado em R4 base, V1.9.575.)

---

## 5. Ordem de construção (fundação primeiro)

1. **#2 Proveniência** — `import_batches` + `import_batch_id`/`source_external_id` (V1.9.577 ✅ aplicado, zero regressão)
2. **#1 Visibilidade** — TABELA DE VÍNCULO nova (`patient_professional_links` ou similar) + wire no `getAllPatients` (UNION assessments + appointments + vínculo). *patient_doctors é view → não serve.*
3. **#3 Motor ZIP** — parser/mapper (CSV EMR → entidades, FHIR-aligned) + dedup + preview. Pure + testes sintéticos (zero PII), como o serializer FHIR.
4. **#4 Arquivos** — ingestão em lote (Files.csv → Storage; 860MB no caso Eduardo) + RLS por patient_id.
5. **#5 Termos/DPA** — aceite + declaração de controlador (depende CNPJ→DPA, advogado saúde digital).
6. **Botão na UI** — só DEPOIS do motor funcionar (precedente anti-overclaim V1.9.440-B: nada de botão fake).

---

## 6. Gates e princípios

- **Real load gated em Marco 1 (CNPJ→DPA).** Modelo = MedCannLab **operadora** do profissional (controlador).
- **Prontuário-only + ativação gota a gota** (sem blast de email — LGPD + reputação de domínio). Ver memória `project_import_emr_eduardo_prontuario_only_risco_03_06`.
- **Isolar do pipeline de IA** (proveniência → Matrix/RAG só lê nativo).
- **Não inflar métricas** (landing/avaliações contam só `import_batch_id IS NULL`).
- **Motor antes do botão** (anti-overclaim).
