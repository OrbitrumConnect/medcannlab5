---
name: LOCK V1.9.95 — AEC + Relatório + Agendamento (27/04/2026)
description: Cadeado formal aplicado em 27/04/2026 19h BRT após sprint de 11 commits. Tag git v1.9.95-lock-aec-relatorio-agendamento. Validado via Supabase API
type: project
originSessionId: 60cf94b7-b5d3-4df1-974d-c1c92082460c
---
Em 27/04/2026 19h BRT, após sprint diária de 11 commits cirúrgicos (V1.9.85→V1.9.95), foi aplicado **lock formal** em: **AEC + Relatório + Agendamento + Pipeline + Signature**.

**Tag git**: `v1.9.95-lock-aec-relatorio-agendamento` (push em hub + origin).

**Métricas validadas via Supabase Management API (4h, 17:55→21:58 BRT)**:
- 7 AECs completas, 7/7 reports signed_hash (100%), scores 63-75
- 3 appointments criados via widget pós-AEC, UUID real Dr. Ricardo (`2135f0c0`)
- 305 interações Core, 141 Verbatim bypass (46.2% economia GPT)
- 1.396.254 tokens GPT-4o em 4h = **~$5.58 USD** (~$1.40/h, ~$0.60/AEC)
- Verbatim First economiza ~46% (sem ele seria ~$2.60/h)

**Por que o lock**:
- AEC FSM 10 passos funcionando deterministicamente
- Pipeline orchestrator: REPORT → SCORES → SIGNATURE → AXES → RATIONALITY → DONE
- Anti-duplicação `PIPELINE_REDUNDANT_TRIGGER`
- AEC GATE V1.5 reforçado em V1.9.95-A (não bypassa mais quando GPT emite token durante AEC ativa)
- REGRA HARD §1 (consentimento ≠ agendamento) preservada em 4 camadas
- Trigger pós-AEC funciona (V1.9.93-A) com guard isAskingConsent (V1.9.94)
- Action_cards do front são só visuais, não chamam Core (V1.9.95-B)

**Why:** lockar significa "podemos parar de mexer aqui sem medo de regressão". Qualquer dev novo entrando pega isso de pé. Próximo ciclo foca em P0 segurança + escala, não no AEC.

**How to apply:** se aparecer pedido pra mexer em algo dentro do escopo do lock (AEC FSM, pipeline orchestrator, signature, AEC GATE V1.5, trigger pós-AEC, dropdown profissionais, REGRA HARD §1) — primeiro aplicar o método V1.9.85 (logs + DB + código + classificação 🟢🟡🟠🔴 + review humano) e referenciar este lock. Não tocar sem necessidade comprovada de regressão.

**Pendências FORA do lock** (decisão Pedro pós-cadeado):
- 🔴 P0: `users_compatible` view sem RLS (bloqueio go-live externo)
- 🟠 404 `/clinica/paciente/consentimento` (commit pré-existente `88d2281`)
- 🟡 `professional_name` null em appointments (cosmético)
- 🟡 `metadata.system_version` ainda V1.9.33 (cosmético)
- 🟡 Frase confusa "(e o sintoma...)" em COMPLAINT_DETAILS
- 🟡 Compartilhar relatório com mais médicos depois (V1.9.96+)

**Refs**: DIARIO_27_04_2026_AUDITORIA_HONESTA_E_FOCO_ESCALA.md Bloco O. Commits V1.9.85→V1.9.95 (11 cirúrgicos).
