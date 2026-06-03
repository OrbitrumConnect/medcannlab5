# MedCannLab → HL7 FHIR R4 — Mapeamento de Interoperabilidade

> Documento técnico-regulatório. Mapeia o modelo de dados real do MedCannLab (Supabase Postgres) para recursos **HL7 FHIR R4**, com vistas a interoperabilidade nacional (**RNDS / DATASUS**) e avaliação preliminar de enquadramento regulatório (ANVISA RDC 657 / SBIS-CFM).
>
> **Data:** 02/06/2026 · **Base:** schema empírico de produção (projeto `itdjkfubfzmvmuxxjoae`, verificado via PAT) · **Arquitetura-alvo de exportação:** estrutura compatível com HL7 FHIR R4, com caminho de conformação aos perfis **br-core** previsto para integração futura à RNDS (serializer/endpoint FHIR ainda não implementado — ver §6).
>
> ⚠️ *As citações regulatórias (RDC 657/2022, RDC 751/2022, CFM 2.454/2026, perfis RNDS) são referência técnica e devem ser confirmadas com especialista regulatório/jurídico antes de uso oficial. A resolução CFM 2.454/2026 (número/data) é achado recente ainda não validado juridicamente. Adicionalmente, os enquadramentos de SaMD/SBIS-CFM e a compatibilidade com FHIR/RNDS descritos neste documento são avaliações preliminares internas — não substituem classificação regulatória formal, certificação SBIS nem homologação RNDS.*

---

## 1. Sumário executivo

- O modelo de dados do MedCannLab encaixa em **~18 recursos FHIR R4**. A adoção de FHIR é uma **camada de exportação/serialização ADITIVA — não uma reescrita**: os dados já estão estruturados.
- **4 encaixes têm relevância regulatória destacada:**
  1. **AEC → `QuestionnaireResponse`** — a escuta clínica estruturada já é, nativamente, um questionário FHIR.
  2. **`clinical_reports` → `Composition`** — documento clínico estruturado com hash de integridade SHA-256, **exportável** como RAC/RES da RNDS (serializer PoC implementado V1.9.563 em `src/lib/fhir/`, validado vs report real; conformação br-core/RNDS = roadmap §6).
  3. **Assinatura ICP-Brasil PBAD AD-RB → `Signature`/`Provenance`** — o FHIR suporta assinatura digital nativa; a nossa foi **validada como conforme pelo validador do ITI** (PBAD AD-RB). Hoje aplicada a **prescrições (`cfm_prescriptions`) e pedidos de exame (`patient_exam_requests`)**; o relatório clínico ainda usa apenas hash de integridade (assinar a `Composition` via ICP-Brasil é roadmap — ver §6).
  4. **Consentimento auditável com registro criptográfico imutável → `Consent`** — cada consentimento é vinculado a um registro com hash de integridade (implementado tecnicamente via `patient_nfts`, assinatura visual determinística em Postgres; não é imutabilidade on-chain/blockchain), **candidato natural a `Consent` + `Provenance`** (o registro serve de prova de integridade; o recurso `Consent` do FHIR é mais rico que um hash — mapeamento fino a modelar).
- **Enquadramento:** o sistema é **não-decisional por construção** (a IA organiza, o médico decide e assina). O caráter não-decisional é **argumento de mitigação de classe de risco** sob RDC 657 — a posição interna de baseline (SGQ POP-LBL-001 / EXECUTIVE_SUMMARY) é **SaMD Classe IIa, sujeita a avaliação por consultora SaMD e petição ANVISA (Marco 4)**. Para o registro/assinatura do prontuário, a arquitetura é **alinhada aos princípios SBIS-CFM (S-RES)**.

---

## 2. Avaliação preliminar de enquadramento regulatório

| Eixo | Posição MedCannLab |
|---|---|
| **SaMD (ANVISA RDC 657/2022)** | Gatilho = software com **finalidade médica autônoma** (diagnóstico/tratamento/prognóstico). A IA **não diagnostica, não prescreve, não decide** → o caráter não-decisional é **argumento de mitigação de classe de risco**. A posição interna de baseline (SGQ) é **SaMD Classe IIa, a confirmar em avaliação regulatória formal** — não se afirma "fora de escopo" como conclusão. As 8 camadas de governança ("GPT é o último a falar e o primeiro a ser checado") são **evidência arquitetural** desse desenho conservador. |
| **SBIS-CFM (S-RES)** | **Alinhado aos princípios SBIS-CFM** para registro eletrônico em saúde: armazenamento de prontuário/registro clínico + **assinatura ICP-Brasil** (hoje em prescrições/exames). A aderência formal depende de avaliação/certificação por entidade certificadora (não realizada). |
| **CFM 2.454/2026** *(número/data a confirmar com especialista regulatório)* | IA como **suporte**; médico mantém **autonomia total**; IA **não comunica diagnóstico/conduta direto ao paciente**. Sistema desenhado para operar de forma **conservadora em relação à norma**. |
| **LGPD** | RLS habilitado em 100% das tabelas públicas (**145/145**, validado via PAT 02/06); pseudonimização de dado clínico em consolidação (~86% das racionalidades sanitizadas, resíduo histórico ~14% em backfill — V1.9.452); consentimento auditável (`Consent`); criptografia em trânsito/repouso conforme infraestrutura Supabase. |
| **RNDS (Ministério/DATASUS)** | Usa **FHIR R4 + br-core**. A interoperabilidade é expectativa de mercado/regulatória; o **caminho de integração à RNDS está definido** e tem o FHIR como destino arquitetural (ainda não integrado/homologado). |

---

## Governança Clínica da IA

A IA da plataforma opera dentro de uma cadeia de governança onde **o profissional habilitado é a autoridade final** em toda decisão clínica. O fluxo é desenhado para que a IA jamais atue como agente médico autônomo:

```
Dados Clínicos          →  Escuta estruturada do paciente (AEC/IMRE), texto-livre, exames
   │
Estruturação            →  FSM determinística organiza a escuta em seções padronizadas
   │                        (clinicalAssessmentFlow.ts — ~15 fases clínicas + estados de controle)
   │
IA Analítica            →  Organiza e sintetiza informação (racionalidades, eixos, scores).
   │                        NÃO diagnostica · NÃO prescreve · NÃO decide conduta
   │                        (Verbatim First · PATIENT_FREE_CHAT_GUARDRAILS · Z2 macro locks)
   │
Validação Metodológica  →  Pirâmide de 8 camadas: "GPT é o último a falar e o
   │                        primeiro a ser checado" (REGRA HARD §1 → COS Kernel → AEC FSM →
   │                        Verbatim → AEC GATE V1.5 → GPT → pós-processamento → pipeline)
   │
Médico                  →  Interpreta, valida, ajusta e assume a decisão terapêutica.
   │                        Autonomia clínica integral (alinhado a CFM 2.314/2022 e ao
   │                        princípio de IA como suporte)
   │
Assinatura ICP-Brasil   →  Documento clínico (prescrição/pedido de exame) assinado
                            digitalmente PBAD AD-RB, validado como conforme pelo ITI.
                            O relatório clínico carrega hash de integridade SHA-256;
                            a assinatura ICP-Brasil da Composition é roadmap (§6).
```

> **A IA apoia a organização e análise das informações. A interpretação clínica, a decisão terapêutica e a assinatura permanecem sob responsabilidade exclusiva do profissional habilitado.**

*Os mecanismos de guardrail acima são auditáveis no código (Verbatim First V1.9.86, AEC GATE V1.5, Z2 macro locks, PATIENT_FREE_CHAT_GUARDRAILS em `tradevision-core/index.ts`). Reconhece-se que organizar a escuta, estruturar racionalidades e gerar scores **influencia o contexto da decisão clínica** (ainda que não a tome) — por isso a classificação SaMD é tratada como **Classe IIa sujeita a avaliação regulatória formal**, e não como isenção.*

---

## 3. Mapeamento recurso-a-recurso (FHIR R4)

Legenda de status (refere-se ao schema de banco, não à conformidade FHIR): 🟢 dado vivo · 🟡 schema modelado, baixo volume · ⚪ schema modelado, ainda sem dados (futuro).

### 3.1 Atores e organização
| FHIR | Fonte (rows) | Mapeamento de campos | Status |
|---|---|---|---|
| **Patient** | `users` (paciente) / `profiles` | `id`→`Patient.id`; `name`→`name`; `cpf`→`identifier` (sistema CPF); `birth_date`→`birthDate`; `gender`→`gender`; `phone`/`email`→`telecom`; `address`→`address`; `blood_type`/`allergies`/`medications`→`AllergyIntolerance`/`MedicationStatement` (ver 3.4) | 🟢 50 (role paciente em `user_roles`; `users` total = 53) |
| **Practitioner** | `users` (profissional) | `name`→`name`; `crm`/`council_number`+`council_state`→`identifier` (CRM UF); `cpf`→`identifier` | 🟢 15 |
| **PractitionerRole** | `user_roles` + `users.specialty` | `role`→`code`; `specialty`→`specialty`; vínculo Practitioner↔Organization | 🟢 71 |
| **Organization / Location** | `clinics` | nome, endereço, CNPJ→`identifier` | 🟡 4 |

### 3.2 Encontro e agenda
| FHIR | Fonte (rows) | Mapeamento | Status |
|---|---|---|---|
| **Encounter** | `appointments` + `video_call_sessions` | `appointment_date`→`period`; `status`→`status`; `is_remote`→`class` (virtual); `patient_id`/`professional_id`→`subject`/`participant` | 🟢 96/134 |
| **Appointment** | `appointments` | `slot_start`/`slot_end`→`start`/`end`; `status`; `specialty` | 🟢 96 |

### 3.3 ⭐ A Avaliação (AEC/IMRE) — o coração
| FHIR | Fonte (rows) | Mapeamento | Status |
|---|---|---|---|
| **Questionnaire** | definição do protocolo AEC 001 (FSM `clinicalAssessmentFlow.ts`) | as 13+ fases (IDENTIFICAÇÃO, QUEIXA, IMRE, HPP, etc.) → `Questionnaire.item` | 🟢 (definição) |
| **QuestionnaireResponse** | `aec_assessment_state` + `clinical_assessments` | `user_id`→`subject`; `data` (jsonb por fase)→`item.answer`; `completed_phases`→itens respondidos; `consent_given`/`consent_at` (fonte confiável a partir de V1.9.546/31-05 + backfill; consent afirmativo em 10/18 estados AEC); `is_complete`→`status` (completed/in-progress); `started_at`→`authored` | 🟢 18/77 |

### 3.4 ⭐ O Relatório Clínico — `clinical_reports` → `Composition`
`clinical_reports.content` (jsonb) modela as seções abaixo → `Composition.section[]`. A cobertura por seção varia entre relatórios (empírico em 150 reports: `identificacao`/`lista_indiciaria` ~114, `rationalities` ~97, `scores` ~93, `recommendations` ~21) — a lista descreve o **schema**, não que todo relatório contém toda seção:

| `content.*` (seção real) | `Composition.section` | Recurso FHIR referenciado |
|---|---|---|
| `identificacao` | Identificação | `Patient` |
| `queixa_principal` | Queixa Principal | texto narrativo (⚠️ **queixa ≠ Condition codificada**) |
| `desenvolvimento_queixa` | História da Doença Atual | texto narrativo |
| `lista_indiciaria` | Lista Indiciária (IMRE) | `Observation` (achados referidos) |
| `historia_patologica_pregressa` | HPP | `Condition`/`Observation` (quando codificado) |
| `historia_familiar` | História Familiar | `FamilyMemberHistory` |
| `habitos_vida` | Hábitos de Vida | `Observation` (social history) |
| `perguntas_objetivas` | Perguntas Objetivas | `Observation` |
| `investigation` | Investigação | `Observation`/`ServiceRequest` |
| `scores` | (metadados clínicos) | **Potencialmente exportável como `Observation` ou recurso derivado específico, mediante modelagem semântica** — `ai_assessment_scores` (625) é **telemetria de conclusão do FSM AEC** (completed/phases_completed/score), não medição clínica LOINC-codificada |
| `rationalities` | Racionalidades | `ClinicalImpression` (`clinical_rationalities`, 141) |
| `recommendations` | Recomendações | `CarePlan` |
| `evolution` | Evolução | `Composition` de follow-up |
| `consenso` / `consent_given` | Consentimento | `Consent` |
| `_aec_layers` / `methodology` / `risk_level` | Proveniência/governança | `Provenance` (extensão) |

**Cabeçalho da `Composition`:** `clinical_reports.id`→`Composition.id`; `report_type`/`protocol`→`type` (código LOINC do documento) + `Composition.title`; `patient_id`→`subject`; `professional_id`→`author`; `generated_at`→`date`; `status`/`review_status`→`status`; `signature_hash`+`signed_at`→ **hash de integridade SHA-256** do conteúdo congelado (presente em ~47/150 reports; mapeia para `Provenance`/integridade, **não** para assinatura ICP-Brasil — ver 3.7). A assinatura ICP-Brasil da `Composition` via `Bundle.signature` é roadmap (§6).

### 3.5 Pedidos, prescrições, laudos
| FHIR | Fonte (rows) | Mapeamento | Status |
|---|---|---|---|
| **MedicationRequest** | `cfm_prescriptions` (52) / `prescriptions` (8) | `medications` (jsonb)→`medicationCodeableConcept`+`dosageInstruction`; `professional_id`→`requester`; `signed_pdf_url`/`iti_validation_code`→`Provenance` | 🟢 52 |
| **ServiceRequest** | `patient_exam_requests` (25) | `content`→`code`/`note`; `status`; assinatura ICP→`Provenance` | 🟢 25 |
| **DiagnosticReport** + **Observation** | `renal_exams` (3) / `patient_lab_results` (⚪) | resultados laboratoriais (LOINC quando codificado) | 🟡/⚪ |
| **Condition** | `patient_conditions` (⚪) + CID-10 do atestado | quando **codificado** (CID-10) | ⚪ |
| **CarePlan** | `patient_therapeutic_plans` (⚪, schema modelado) | plano terapêutico | ⚪ |
| **DocumentReference** | `medical_certificates` (1) / `documents` (43) / `patient_documents` | atestados, PDFs assinados, anexos clínicos | 🟢/🟡 |

### 3.6 ⭐ Consentimento e proveniência
| FHIR | Fonte (rows) | Mapeamento | Status |
|---|---|---|---|
| **Consent** | `aec_assessment_state.consent_given`+`consent_at` (e `data.consentGiven` no jsonb) + `patient_nfts` (37) | `patient_id`→`patient`; `consent_at`→`dateTime`; **registro criptográfico de integridade** (`image_hash` 37/37, `signature_hash` 26/37, implementado via `patient_nfts` — Postgres + hash, não on-chain) → **candidato natural a `Consent` + `Provenance`** (registro serve de prova de integridade via `Consent.verification`/`sourceAttachment`; o recurso `Consent` é mais rico que um hash — a modelar) | 🟢 37 |
| **Provenance** | `signature_confirmations` (12) + `pki_transactions` (12) | quem assinou, quando, hash da versão (`document_version_hash` 12/12), assinatura PKCS#7 real (`signature_value`+`certificate_thumbprint` 12/12). *As colunas `ip_address`/`user_agent` existem porém estão vazias nos 12 registros.* | 🟢 12 |
| **AuditEvent** | `noa_logs` (19.135) + `scheduling_audit_log` (58) + `user_lifecycle_logs` | trilha de auditoria de acesso/ação | 🟢 |

### 3.7 ⭐ Assinatura digital ICP-Brasil → FHIR `Signature`
O FHIR R4 tem o datatype **`Signature`** (e `Bundle.signature` / `Provenance.signature`). Nossa assinatura **PBAD AD-RB ICP-Brasil, validada como conforme pelo validador do ITI** (validar.iti.gov.br), mapeia direto. **Importante:** essa assinatura PKCS#7 ICP-Brasil é aplicada hoje a **prescrições (`cfm_prescriptions`) e pedidos de exame (`patient_exam_requests`)** — o relatório clínico (`clinical_reports`) carrega apenas um **hash de integridade SHA-256**, não uma assinatura ICP-Brasil:

| Origem | FHIR `Signature` / `Provenance` |
|---|---|
| PKCS#7 (`pki_transactions.signature_value`, em prescrições/exames) | `Signature.data` (assinatura em base64) |
| `clinical_reports.signature_hash` (SHA-256 de integridade) | `Provenance` / hash de integridade do documento (**não** é assinatura ICP-Brasil) |
| certificado (`signature_certificate`) | `Signature.who` + `Signature.sigFormat` (`application/pkcs7-signature`) |
| `signed_at` / `signature_timestamp` | `Signature.when` |
| `iti_validation_code`/`url` | `Provenance` / extensão de validação |

→ O **prontuário inteiro** pode ser empacotado como **`Bundle` (type=document)** com a `Composition` na raiz e `Bundle.signature` ICP-Brasil — estrutura **alinhada ao formato de documento assinado previsto pela RNDS**, a validar em homologação. *Hoje a `Composition` carrega hash de integridade; a assinatura ICP-Brasil sobre o relatório clínico ainda não está implementada (ver §6).*

---

## 4. Exemplo concreto — `Composition` FHIR (esqueleto)

```jsonc
{
  "resourceType": "Composition",
  "id": "<clinical_reports.id>",
  "status": "final",
  "type": { "coding": [{ "system": "http://loinc.org", "code": "11488-4", "display": "Consult note" }] },
  "subject": { "reference": "Patient/<patient_id>" },
  "author": [{ "reference": "Practitioner/<professional_id>" }],
  "date": "<generated_at>",
  "title": "Avaliação Clínica Inicial (AEC 001)",
  "section": [
    { "title": "Identificação", "entry": [{ "reference": "Patient/<patient_id>" }] },
    { "title": "Queixa Principal", "text": { "status": "additional", "div": "<queixa_principal>" } },
    { "title": "História da Doença Atual", "text": { "div": "<desenvolvimento_queixa>" } },
    { "title": "Lista Indiciária (IMRE)", "entry": [{ "reference": "Observation/..." }] },
    { "title": "História Patológica Pregressa", "text": { "div": "<historia_patologica_pregressa>" } },
    { "title": "História Familiar", "text": { "div": "<historia_familiar>" } },
    { "title": "Hábitos de Vida", "text": { "div": "<habitos_vida>" } },
    { "title": "Racionalidades", "entry": [{ "reference": "ClinicalImpression/..." }] },
    { "title": "Recomendações", "entry": [{ "reference": "CarePlan/..." }] }
  ]
}
```
→ empacotável em `Bundle (document)` + `Bundle.signature` ICP-Brasil (assinatura da `Composition` = roadmap; hoje hash de integridade).

> *O código LOINC `11488-4 (Consult note)` acima é **exemplo ilustrativo de codificação documental**; o código final dependerá do perfil documental adotado (RAC/RES / br-core) e deverá ser validado caso a caso.*

---

## 5. Caminho RNDS (Ministério da Saúde / DATASUS)

1. **Perfis br-core** (FHIR R4 nacional) — conformar `Patient`, `Practitioner`, `Composition` aos perfis brasileiros.
2. **Documento RAC** (Registro de Atendimento Clínico) — nossa `Composition` da AEC **apresenta forte aderência estrutural** ao modelo RAC/RES (que possui requisitos próprios a conformar).
3. **`Bundle` assinado** — a submissão exige assinatura digital, requisito que a plataforma já atende com **ICP-Brasil (assinatura validada como conforme pelo ITI)** em prescrições/exames; estender a assinatura à `Composition` do prontuário e a submissão à RNDS em si ainda não foram realizadas/homologadas.
4. **Terminologias** — vincular *value sets*: CID-10 (`Condition`), LOINC (`Observation`/laboratório), CIAP-2/SNOMED-CT quando aplicável.

---

## 6. Gaps e roadmap (honesto)

| Gap | Esforço | Observação |
|---|---|---|
| **Serializer FHIR — PoC feito (V1.9.563) ✅; endpoint `/fhir` (V1.9.569) ✅; validado em R4 base (V1.9.575) ✅; falta br-core** | Mapeador `clinical_report→Bundle` em `src/lib/fhir/` (read-only). Bundle sintético: **0 erros** no `$validate` oficial R4. Resta perfis br-core + homologação RNDS | dado já estruturado; não é reescrita |
| **Assinatura ICP-Brasil no relatório clínico** | Estender o fluxo PBAD AD-RB (hoje em prescrições/exames) à `Composition`/`Bundle` do prontuário | `clinical_reports` hoje só tem hash de integridade SHA-256, não assinatura ICP |
| **Consent FHIR — fonte e cobertura** | Mapear de fonte confiável (`data.consentGiven` jsonb + coluna `consent_given` pós-V1.9.546) | coluna íntegra só a partir de 31/05 + backfill; `ip`/`user-agent` de Provenance vazios |
| **Terminologia não-codificada** | Binding de value sets (CID-10/LOINC/SNOMED) | hoje texto-livre/manual; a IA NÃO infere CID-10 (lock) |
| **Conformidade br-core / homologação RNDS** | Validação contra perfis RNDS + homologação | Bundle válido em **R4 base** (0 erros, V1.9.575); falta perfil **br-core** + homologação RNDS |
| **`Condition`/`CarePlan`/lab** | Popular schemas já existentes (`patient_conditions`, `patient_therapeutic_plans`, `patient_lab_results` estão vazios) | |

> ⚠️ **Maior esforço de integração = governança terminológica.** Ter FHIR (estrutura) **≠ interoperabilidade clínica real**. Sem *binding* de **CID-10 / LOINC / SNOMED CT**, os recursos existem mas o significado clínico não trafega de forma interoperável. Hoje a terminologia é **texto-livre** (a IA **NÃO infere CID-10** — lock institucional). Este é, provavelmente, **o maior trabalho da integração** — maior que o próprio serializer.

**Princípio:** FHIR é **próximo passo de arquitetura, não conceitual**. A arquitetura atual (relatório estruturado + hash de integridade + assinatura ICP em prescrições/exames + consentimento auditável) apresenta **estrutura de dados favorável à exportação FHIR**, restando implementar a camada de serialização (§6) e a **governança terminológica**.

---

## 7. Tabela-resumo

| # | FHIR R4 | Fonte | Status |
|---|---|---|---|
| 1 | Patient | `users`/`profiles` | 🟢 |
| 2 | Practitioner | `users` | 🟢 |
| 3 | PractitionerRole | `user_roles` | 🟢 |
| 4 | Organization/Location | `clinics` | 🟡 |
| 5 | Encounter | `appointments`/`video_call_sessions` | 🟢 |
| 6 | Appointment | `appointments` | 🟢 |
| 7 | Questionnaire | AEC FSM | 🟢 |
| 8 | QuestionnaireResponse | `aec_assessment_state`/`clinical_assessments` | 🟢 |
| 9 | Composition | `clinical_reports` | 🟢 |
| 10 | ClinicalImpression | `clinical_rationalities` | 🟢 |
| 11 | Observation | `renal_exams`/`clinical_kpis` (medições) · `ai_assessment_scores`(625)/`clinical_axes`(530) = observações **derivadas/não-codificadas** (telemetria FSM + sumários narrativos de eixo da IA, não LOINC) | 🟡 |
| 12 | MedicationRequest | `cfm_prescriptions`/`prescriptions` | 🟢 |
| 13 | ServiceRequest | `patient_exam_requests` | 🟢 |
| 14 | DiagnosticReport | `renal_exams`/`patient_lab_results` | 🟡 |
| 15 | Condition | `patient_conditions`+CID-10 | ⚪ |
| 16 | CarePlan | `patient_therapeutic_plans` | ⚪ |
| 17 | DocumentReference | `documents`/`patient_documents`/`medical_certificates` | 🟢 |
| 18 | Consent | consentimento AEC + registro criptográfico de integridade (`patient_nfts`) | 🟢 |
| 19 | Provenance + Signature | `signature_confirmations`/`pki_transactions` + ICP-Brasil (prescrições/exames; relatório clínico = hash de integridade) | 🟢 |
| 20 | AuditEvent | `noa_logs`/audit logs | 🟢 |
| 21 | Bundle (document) | prontuário completo (assinatura ICP da Composition = roadmap) | (composição) |

**Conclusão:** 14 recursos com dado vivo, 3 com schema modelado, restando implementar a **camada de serialização FHIR**, o **binding de terminologia** (CID-10/LOINC/SNOMED), a **assinatura ICP-Brasil sobre o relatório clínico** (hoje só hash de integridade; assinatura ICP já existe em prescrições/exames) e a **validação/homologação contra os perfis br-core da RNDS** — trabalho de natureza aditiva sobre arquitetura já estruturada.

---

## 8. Anexo — Ressalvas empíricas (verificação via PAT, 02/06)

Pontos que NÃO devem ser afirmados além do verificado:
- **Serializer FHIR — PoC IMPLEMENTADO (V1.9.563)** em `src/lib/fhir/clinicalReportToFhir.ts` (função pura read-only `clinical_report → Bundle type=document`): 9 testes unit + validado ad-hoc contra 1 report REAL via PAT (7 recursos: Composition/Patient/Practitioner/ClinicalImpression×2/Consent/Provenance; 10 seções; refs 6/6 resolvem; hash de integridade como Provenance/extensão, **não** FHIR Signature). **Endpoint HTTP `/fhir`** existe (Edge `fhir-export`, V1.9.569). **Validação estrutural contra validador FHIR R4 oficial FEITA (V1.9.575)**: Bundle sintético (sem PII) submetido ao `$validate` público (HAPI FHIR R4) → **0 erros estruturais** (corrigidos: `fullUrl` resolvível, `Consent.policyRule` ppc-1, `Bundle.identifier` bdl-9); restam só **warnings esperados** (LOINC não carregado no validador público, CodeSystem custom `aec-section`, `dom-6` narrative best-practice). **Ainda NÃO há**: validação contra perfis **br-core**, homologação RNDS, nem binding de terminologia codificada (CID-10/LOINC). Exportação FHIR **estruturalmente válida em R4 base**, não homologada em perfil nacional.
- **Assinatura ICP-Brasil NÃO cobre o relatório clínico** — `clinical_reports.signature_hash` é SHA-256 de integridade (47/150 reports). PKCS#7 ICP-Brasil real só em `cfm_prescriptions`/`patient_exam_requests`.
- **Classificação SaMD não decidida** — baseline interno SaMD Classe IIa (SGQ); não afirmar "não-SaMD".
- **SBIS-CFM não certificado** — apenas "alinhado aos princípios".
- **RNDS não integrada/homologada** — padrão-alvo, não conformidade alcançada.
- **CFM 2.454/2026** — número/data não verificados; base CFM consolidada usa CFM 2.314/2022.
- **Pseudonimização ~86%** (não 100%); resíduo histórico ~14% em backfill.
- **Validação ITI é jurídica, não operacional** — aceitação por laboratório/RNDS e QR Code visual no PDF são pendências.

---

## 9. Mini Roadmap — Interoperabilidade + Conformidade Regulatória

### 📍 Onde estamos (Fase 0 → 1)
- ✅ Arquitetura **compatível com FHIR R4** · ✅ **Serializer FHIR PoC** (`clinical_report→Bundle`, V1.9.563, validado vs report real) · ✅ **ICP-Brasil CONFORME ITI** (prescrições/exames) · ✅ **SGQ — 16 drafts** (ISO 13485 / IEC 62304 / ISO 14971) · ✅ dados estruturados + **RLS 145/145**
- ❌ Falta: **endpoint HTTP `/fhir`** + validação **br-core** · terminologia codificada · ICP no relatório clínico · homologação RNDS

### 🟢 Atacável AGORA (técnico interno — NÃO depende de CNPJ)
| Ação | Entrega | Esforço |
|---|---|---|
| **Serializer FHIR** — PoC ✅ (V1.9.563, `clinical_report→Bundle`); resta endpoint HTTP `/fhir` + validação br-core | recursos FHIR exportáveis (Bundle do relatório já gera) | médio |
| **Binding de terminologia** (CID-10 / LOINC / SNOMED CT) | semântica interoperável ← **maior trabalho** | alto |
| **ICP-Brasil no relatório clínico** (estender PBAD à `Composition`/`Bundle`) | prontuário assinado | médio |
| **Conformidade br-core** | aderência a perfis RNDS | médio |
| Fechar gaps operacionais (cadência QA, pre-push hooks, WiseCare→produção) | maturidade SGQ | baixo |

### 🔴 Depende de decisão humana (Marco 1 = gargalo-mãe)
1. **Marco 1 — CNPJ + RT (Responsável Técnico)** → destrava consultora, petição, Stripe
2. **Consultora SaMD** (Modelo C-IA, R$ 30-60K) → **gap-analysis formal** contra checklist ANVISA Classe IIa
3. **Marco 2 / 2.5** — 1º paciente externo pagante + 2º médico independente → **validação clínica** (único bloqueador real ANVISA)
4. **Marco 4** — homologação RNDS + petição **ANVISA Classe IIa** + certificação ISO 13485 / SBIS-CFM

### 🛣️ Sequência
```
[AGORA · paralelo, sem depender de ninguém]
   Serializer FHIR  +  Terminologia (CID-10/LOINC/SNOMED)  +  ICP no relatório  +  br-core
        │
Marco 1 (CNPJ + RT)  →  Consultora SaMD (gap-analysis formal = "saber se estamos de acordo")
        │
Marco 2 / 2.5 (1º pagante + 2º médico)  →  validação clínica + PROC-PMS/INC
        │
Homologação RNDS  +  Petição ANVISA Classe IIa (Marco 4)  +  ISO 13485 / SBIS-CFM
```

> **Princípio:** atacamos **JÁ** o técnico (não espera ninguém); o **regulatório formal** e a **validação clínica** destravam com o **Marco 1 (CNPJ)**. "100% conforme" = *submission-ready* internamente + carimbo externo (consultora + RT + ANVISA + entidade certificadora).

### 🏆 Por que viramos referência
Governança 8 camadas (IA não decide) · ICP-Brasil CONFORME ITI · SGQ orgânico (16 drafts) · rastreabilidade radical (649 commits/30d, 11 locks) · anti-overclaim · este doc FHIR auditor-safe. A maioria do healthtech tem produto **sem** SGQ; aqui há SGQ + método autoral (AEC) + evidência empírica.
