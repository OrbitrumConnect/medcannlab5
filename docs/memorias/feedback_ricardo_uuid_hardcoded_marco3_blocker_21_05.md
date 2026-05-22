---
name: feedback_ricardo_uuid_hardcoded_marco3_blocker_21_05
description: UUID do Dr. Ricardo (2135f0c0) está hardcoded como fallback em 4 lugares do tradevision-core. Documentado nos diários de abril; vira blocker quando o 2º médico (Marco 3) chegar.
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 6742fef8-9d20-43d8-a8d8-8853df0c89e9
---

O `supabase/functions/tradevision-core/index.ts` tem o UUID do Dr. Ricardo Valença (`2135f0c0-eb5a-43b1-bc00-5f8dfea13561`) hardcoded como fallback em **4 pontos**:
- linha 1237 — `FALLBACK_DOCTOR_ID`
- linha 2703 — `detectedProfessionalUuid` (default)
- linhas 3522 + 3525 — `linkedProfessionalId` (fallback absoluto)

**NÃO é drift não-documentado** (o audit Material B de 21/05 errou ao dizer isso). Está fartamente nos diários de abril — a saga DOCTOR_RESOLUTION: `DIARIO_22_04` (introdução do fix), `DIARIO_24_04` ("handleFinalizeAssessment tem fallback institucional... desde 22/04, 45 reports caíram nesse fallback"), `DIARIO_29_04` ("🔴 FALLBACK HARDCODED: 2135f0c0"), `DIARIO_30_04`. O que faltava era uma memory dedicada + o ângulo Marco 3 — esta memory cobre.

**O blocker:** hoje só o Ricardo é médico ativo, então o fallback nunca dispara errado. Quando o **2º médico** chegar (Marco 3 — Eduardo Faveret, neurologia) e começar a criar pacientes/AECs, se o metadata de profissional não vier no body da request, esses 4 fallbacks vão **linkar paciente do Faveret ao Ricardo automaticamente** — silenciosamente.

**How to apply:**
- Antes do Marco 3, refatorar os 4 pontos: resolução dinâmica do `professional_id` (via role / appointment / preferred) com fallback **configurável**, não um UUID fixo de uma pessoa.
- Trigger: 1º AEC do Faveret OU 2º médico criando paciente. Auditar os 4 pontos ANTES do 2º médico ir a produção.
- (Nota: `src/pages/PatientAppointments.tsx` também hardcoda `2135f0c0` em vários pontos — incluir no mesmo refactor.)

Conecta com [[project_3_marcos_minimos_reprecificacao_valuation_18_05]] (Marco 3) e a saga DOCTOR_RESOLUTION dos diários de abril.
