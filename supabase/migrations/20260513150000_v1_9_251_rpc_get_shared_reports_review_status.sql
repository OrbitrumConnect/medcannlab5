-- V1.9.251 — Adiciona review_status, reviewed_by, reviewed_at, signature_hash,
-- doctor_id, professional_id ao RETURNS TABLE da RPC get_shared_reports_for_doctor.
--
-- Bug reportado por Ricardo 13/05 ~14h46 BRT via screenshot WhatsApp: clicou
-- aba "Revisados" no perfil profissional e viu lista vazia, mesmo afirmando ter
-- revisado vários reports. Empírico via PAT confirmou:
--   - clinical_reports: 106 draft + 8 reviewed (Ricardo reviewed_by=2135f0c0-eb5a...)
--   - RPC retornava apenas 9 colunas (id, patient_id, patient_name, report_type,
--     protocol, status, shared_at, generated_at, content) — sem review_status
--   - Frontend ClinicalReports.tsx linha ~441 lia report.review_status → undefined
--     → fallback 'pending' → filtro 'reviewed' sempre vazio
--
-- Fix: recria função (DROP+CREATE necessário pois nao se pode alterar RETURNS
-- TABLE via CREATE OR REPLACE) com 6 colunas adicionais. Frontend nao muda
-- (ja le report.review_status corretamente desde V1.9.225 patch).
--
-- Aplicado direto via Management API em 13/05 ~15h BRT (fix urgente pre-evento
-- quinta). Este arquivo registra a mudanca pra rastreabilidade futura.
-- Lock V1.9.95 intocado.

BEGIN;

DROP FUNCTION IF EXISTS public.get_shared_reports_for_doctor(uuid);

CREATE OR REPLACE FUNCTION public.get_shared_reports_for_doctor(p_doctor_id uuid)
 RETURNS TABLE(
   id text,
   patient_id text,
   patient_name text,
   report_type text,
   protocol text,
   status text,
   shared_at timestamp with time zone,
   generated_at timestamp with time zone,
   content jsonb,
   review_status text,
   reviewed_by uuid,
   reviewed_at timestamp with time zone,
   signature_hash text,
   doctor_id uuid,
   professional_id uuid
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    cr.id,
    cr.patient_id::TEXT,
    cr.patient_name,
    cr.report_type,
    cr.protocol,
    cr.status,
    cr.shared_at,
    cr.generated_at,
    cr.content,
    cr.review_status,
    cr.reviewed_by,
    cr.reviewed_at,
    cr.signature_hash,
    cr.doctor_id,
    cr.professional_id
  FROM clinical_reports cr
  WHERE p_doctor_id = ANY(cr.shared_with)
    AND cr.shared_with IS NOT NULL
    AND array_length(cr.shared_with, 1) > 0
  ORDER BY cr.shared_at DESC NULLS LAST, cr.generated_at DESC;
END;
$function$;

COMMIT;
