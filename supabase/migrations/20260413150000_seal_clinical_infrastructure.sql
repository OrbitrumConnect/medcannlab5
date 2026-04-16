-- Migra├º├úo de Selamento de Infraestrutura Cl├¡nica 5.0 (MODO SEGURO)
-- Data: 13/04/2026
-- Descri├º├úo: Apenas a VIEW patient_doctors (l├│gica original do audit) e a policy de SELECT do f├│rum.

-- 1. Criar a VIEW patient_doctors (L├│gica Pedro + Cast de Seguran├ºa)
DROP VIEW IF EXISTS public.patient_doctors;
CREATE OR REPLACE VIEW public.patient_doctors
WITH (security_invoker = true)
AS
SELECT DISTINCT ON (a.patient_id, COALESCE(a.doctor_id, a.professional_id))
  gen_random_uuid() AS id,
  a.patient_id::uuid,
  COALESCE(a.doctor_id, a.professional_id)::uuid AS doctor_id,
  u_doc.name AS doctor_name,
  u_pat.name AS patient_name,
  u_doc.is_official,
  MAX(a.appointment_date) OVER (PARTITION BY a.patient_id, COALESCE(a.doctor_id, a.professional_id)) AS last_appointment_date,
  COUNT(*) OVER (PARTITION BY a.patient_id, COALESCE(a.doctor_id, a.professional_id)) AS total_appointments
FROM public.appointments a
LEFT JOIN public.users u_doc ON u_doc.id = COALESCE(a.doctor_id, a.professional_id)::uuid
LEFT JOIN public.users u_pat ON u_pat.id = a.patient_id::uuid
WHERE a.patient_id IS NOT NULL 
  AND COALESCE(a.doctor_id, a.professional_id) IS NOT NULL
ORDER BY a.patient_id, COALESCE(a.doctor_id, a.professional_id), a.appointment_date DESC;

GRANT SELECT ON public.patient_doctors TO authenticated;

-- 2. Corrigir Policy de SELECT na tabela forum_posts (O essencial para o dashboard)
DROP POLICY IF EXISTS "read_forum_posts" ON public.forum_posts;
CREATE POLICY "read_forum_posts" ON public.forum_posts
FOR SELECT TO authenticated
USING (true);
