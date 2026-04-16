-- Migration: Agente Corretivo de Infraestrutura Cl├¡nica 6.1 (AUDIT CORRECTION)
-- Data: 14/04/2026
-- Objetivo: Adicionar colunas faltantes identificadas na auditoria e recriar Views.

-- 1. Adicionar coluna is_official se n├úo existir (Hardening da Tabela Base)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_official') THEN
        ALTER TABLE public.users ADD COLUMN is_official BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'is_official') THEN
        ALTER TABLE public.user_profiles ADD COLUMN is_official BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- 2. Recriar a VIEW patient_doctors com a l├│gica correta e o campo is_official garantido
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
  COALESCE(u_doc.is_official, false) as is_official,
  MAX(a.appointment_date) OVER (PARTITION BY a.patient_id, COALESCE(a.doctor_id, a.professional_id)) AS last_appointment_date,
  COUNT(*) OVER (PARTITION BY a.patient_id, COALESCE(a.doctor_id, a.professional_id)) AS total_appointments
FROM public.appointments a
LEFT JOIN public.users u_doc ON u_doc.id = COALESCE(a.doctor_id, a.professional_id)::uuid
LEFT JOIN public.users u_pat ON u_pat.id = a.patient_id::uuid
WHERE a.patient_id IS NOT NULL 
  AND COALESCE(a.doctor_id, a.professional_id) IS NOT NULL
ORDER BY a.patient_id, COALESCE(a.doctor_id, a.professional_id), a.appointment_date DESC;

GRANT SELECT ON public.patient_doctors TO authenticated;

-- 3. Limpeza de tabelas de Desenvolvimento em Produ├º├úo (Claim P2 da Auditoria)
DROP TABLE IF EXISTS public.dev_vivo_audit;
DROP TABLE IF EXISTS public.dev_vivo_changes;
DROP TABLE IF EXISTS public.dev_vivo_diagnostics;
DROP TABLE IF EXISTS public.dev_vivo_sessions;

-- 4. Injetar trigger de seguran├ºa de agendamento (Garantir que appointment_date nunca seja nulo)
ALTER TABLE public.appointments ALTER COLUMN appointment_date SET NOT NULL;

SELECT 'Γ£à INFRAESTRUTURA ALINHADA COM A AUDITORIA (V6.1)' as result;
