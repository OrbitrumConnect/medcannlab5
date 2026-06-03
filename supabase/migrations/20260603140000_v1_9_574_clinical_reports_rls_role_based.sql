-- V1.9.574: RLS clinical_reports "Reports access" — remove 4 UUIDs hardcoded -> role-based.
-- Gap-analysis 02/06 item #3: a policy listava 4 UUIDs fixos no codigo.
-- Avaliacao empirica (PAT + frontend, 03/06): 3 dos 4 UUIDs sao contas ADMIN
-- (Pedro 17345b36, Joao f62c3f62, Ricardo 99286e6f) ja cobertas por is_admin();
-- o 4o (f4a62265) e a conta PROFISSIONAL do Eduardo (ele tambem tem conta admin
-- 5a9ada8b, coberta por is_admin()).
--
-- Smoke matrix por conta (simulado read-only ANTES de aplicar):
--   Pedro/Ricardo/Joao/Eduardo admin -> 150 -> 150 (is_admin, zero mudanca)
--   Ricardo prof -> 115 -> 115 | Gisele paciente -> 1 -> 1 (zero mudanca)
--   Eduardo prof (f4a62265) -> 150 -> 6 no DB. SEM regressao de UI: a conta
--   profissional ja usa o caminho de profissional no frontend
--   (get_shared_reports_for_doctor = so reports dele), nunca faz "select all".
--   Os 150 do DB eram over-permission morta. Removida = least privilege.
--
-- ALTER POLICY (atomico, sem janela de drop). Locks 8 INTOCADOS.

ALTER POLICY "Reports access" ON public.clinical_reports
  USING (
    is_admin()
    OR (professional_id = auth.uid())
    OR (doctor_id = auth.uid())
    OR (patient_id = auth.uid())
  );
