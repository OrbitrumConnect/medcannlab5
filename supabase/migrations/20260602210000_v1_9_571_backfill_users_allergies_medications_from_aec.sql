-- V1.9.571 — Backfill: users.allergies/medications a partir do relatório da AEC
--
-- MOTIVO (gap visual Flávia 02/06): a AEC grava alergias/medicações no jsonb do relatório
-- (clinical_reports.content.perguntas_objetivas.{alergias, medicacoes_regulares}) MAS a tela
-- "Visão Geral" (PatientsManagement.tsx) LÊ users.allergies / users.medications — campo canônico
-- que a AEC nunca preenchia. Resultado: pacientes que só passaram pela AEC apareciam SEM
-- alergias/medicações no card (ex: Flávia), enquanto pacientes com users.* preenchido por outro
-- caminho (manual) apareciam OK (ex: Carolina). Mesma classe do consent_given dessincronizado (V1.9.546).
--
-- Princípio (cristalizado): corrigir na FONTE, não patch reativo por view.
--  - Fonte (going-forward): clinicalAssessmentFlow.ts:1749+ agora escreve users.{allergies,medications}
--    na finalização da AEC (com consent). V1.9.571.
--  - Backfill (existentes): este script — popula a partir do ÚLTIMO relatório por paciente.
--
-- SEGURO/IDEMPOTENTE: só preenche onde está NULL (COALESCE preserva valor manual existente —
-- NÃO sobrescreve Carolina). Re-rodar é no-op.

UPDATE users u
SET allergies   = COALESCE(u.allergies, r.alergias),
    medications = COALESCE(u.medications, r.meds),
    updated_at  = now()
FROM (
  SELECT DISTINCT ON (patient_id)
    patient_id,
    content->'perguntas_objetivas'->>'alergias'            AS alergias,
    content->'perguntas_objetivas'->>'medicacoes_regulares' AS meds
  FROM clinical_reports
  WHERE content->'perguntas_objetivas'->>'alergias' IS NOT NULL
     OR content->'perguntas_objetivas'->>'medicacoes_regulares' IS NOT NULL
  ORDER BY patient_id, generated_at DESC
) r
WHERE u.id = r.patient_id
  AND (u.allergies IS NULL OR u.medications IS NULL);

-- Aplicado via PAT 02/06: 11 pacientes preenchidos (incl. Flávia 18ece941). Carolina (manual) intacta.
