---
name: project_interop_fhir_doc_e_roadmap_regulatorio_02_06
description: Doc HL7 FHIR R4 (docs/INTEROP_FHIR_MEDCANNLAB_R4.md) auditor-safe + roadmap regulatório 5 frentes. 2 overclaims cravados a NÃO repetir + linguagem defensável + status das diretrizes (RDC 657/SBIS/CFM/LGPD/ICP/RNDS).
metadata: 
  node_type: memory
  type: project
  originSessionId: 33c9058f-295f-4bac-8e8c-3ae05461126b
---

Entrega de 02/06 pra reunião com **Donizete** (ANVISA, ex-dono farmácia/distribuidora, saturado de healthtech). Doc commitado: **`docs/INTEROP_FHIR_MEDCANNLAB_R4.md`** (`4194bd5` + §9 roadmap `bd490c1`). Verificado via 2 workflows multi-agente (PAT+código+regulatório) + 2 reviews externos GPT (9.0→9.5) + re-confirmação ao vivo de TODOS os números.

## 🚫 2 OVERCLAIMS cravados — NUNCA reintroduzir
1. **`clinical_reports` NÃO tem assinatura ICP-Brasil** — é **hash SHA-256 de integridade** (tradevision-core:1713 "content hashing, não é NFT"; populado 47/150). A assinatura **PKCS#7 ICP-Brasil real existe SÓ em `cfm_prescriptions` e `patient_exam_requests`**. Assinar a `Composition`/prontuário = **roadmap**, não estado atual.
2. **NÃO é "não-SaMD"** — baseline interno do SGQ (EXECUTIVE_SUMMARY + POP-LBL-001) é **SaMD Classe IIa** (petição ANVISA Marco 4). O caráter não-decisional ("IA não diagnostica/prescreve/decide") é **argumento de MITIGAÇÃO DE CLASSE**, não exclusão de SaMD. Sempre "sujeito a avaliação formal".

## Linguagem auditor-safe (regra pra material derivado/slides)
- **NUNCA "FHIR Ready"/"RNDS Ready"** → usar "Arquitetura Compatível com FHIR R4" / "Caminho RNDS Definido". (Genspark reintroduziu no slide 15 do deck Donizete → removido via pypdf; deck final 14p.)
- Observation (`ai_assessment_scores` 625 = telemetria FSM, não medição) → "potencialmente exportável, mediante modelagem semântica".
- Consent → "candidato natural a `Consent`+`Provenance`" (recurso é mais rico que hash).
- LOINC `11488-4` = exemplo ilustrativo; RAC = "forte aderência estrutural" (não "mapeia direto").
- NFT "imutável" → "registro criptográfico de integridade (Postgres+hash, não on-chain)".
- CFM **2.454/2026 sem lastro** (só achado de mercado, validar advogado); base CFM consolidada = **2.314/2022**.

## Status das diretrizes (02/06, verificado)
ISO 13485/IEC 62304/ISO 14971 (16 drafts SGQ 🟡) · RDC 657/751 SaMD Classe IIa (🔴 petição Marco 4) · SBIS-CFM (alinhado 🟡) · CFM 2.314 (🟢) · LGPD (RLS **145/145** 🟢, pseudonim ~86% 🟡) · ICP-Brasil CONFORME ITI prescrições/exames (🟢) · FHIR/RNDS (arquitetura compatível 🟡; faltam serializer+terminologia+homologação). "Como saber se estamos de acordo" = gap-analysis formal da consultora SaMD (Fase 1) vs checklist ANVISA. "100%" = submission-ready interno + carimbo externo (consultora+RT+ANVISA+certificadora).

## Roadmap 5 frentes técnicas (atacável SEM CNPJ) — ordem ROI×risco
1. **Serializer FHIR PoC** (clinical_report→Composition+Bundle) — risco ZERO (read-only, não toca lock) ← ATACAR PRIMEIRO
2. Gaps operacionais SGQ (pre-push hooks, cadência QA) — baixo
3. ICP-Brasil no relatório — 🔴 lock V1.9.299, sessão dedicada smoke ITI
4. Binding terminologia (CID-10/LOINC/SNOMED) — alto, precisa Ricardo (maior trabalho)
5. Conformidade br-core — depende do #1
Trilha humana (gargalo-mãe, não-código): **Marco 1 CNPJ+RT** → consultora → Marco 2/2.5 (1º pagante + 2º médico) → Marco 4 petição ANVISA.

## Princípio meta cristalizado
**Verificar doc institucional contra o app empíricamente (PAT+código via workflow) ANTES de cristalizar** — pegou 2 overclaims que reviews de texto (GPT) não pegariam (GPT revisa texto/nuance; PAT verifica fato). Aplicação direta de [[feedback_doc_institucional_sem_pat_nao_e_valido_23_05]] + [[feedback_material_b_pode_contradizer_constituicao_22_05]]. Mapeamento campo-a-campo em [[reference_ricardo_valenca_bio_autoral_mimre_31_05]] (AEC) contexto.

Conexões: [[feedback_noa_matrix_ambiente_clinico_governado_nao_ide_30_05]] · [[reference_lock_v1_9_388_a3_ancoragem_regulatoria_multicamada_27_05]] · EXECUTIVE_SUMMARY (docs/sgq).
