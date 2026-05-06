-- V1.9.173 — Views diagnósticas CFM prescription funnel + stuck drafts
-- ===================================================================
-- READ-ONLY: zero impacto produto/RLS/CORE. Pode ser dropada sem perda.
-- Objetivo: instrumentar gargalo cfm_prescriptions DRAFT 94.6% (35/37 em draft,
-- nenhuma assinatura desde 31/01/2026, ~66 dias de média sem update).
-- Antes de tentar fix, instrumentar — princípio "instrumentação ANTES do teste".

-- 1) Funil agregado por status
CREATE OR REPLACE VIEW public.v_cfm_prescription_funnel WITH (security_invoker = true) AS
SELECT
    status,
    COUNT(*)                                                         AS total,
    ROUND(100.0 * COUNT(*) / NULLIF(SUM(COUNT(*)) OVER (), 0), 1)    AS pct_total,
    MIN(created_at)                                                  AS oldest_created,
    MAX(updated_at)                                                  AS last_update,
    ROUND(AVG(EXTRACT(EPOCH FROM (NOW() - updated_at)) / 3600.0)::numeric, 1) AS avg_hours_since_update,
    COUNT(*) FILTER (WHERE updated_at < NOW() - INTERVAL '7 days')   AS stale_7d,
    COUNT(*) FILTER (WHERE updated_at < NOW() - INTERVAL '30 days')  AS stale_30d,
    COUNT(DISTINCT professional_id)                                  AS distinct_professionals,
    COUNT(DISTINCT patient_id)                                       AS distinct_patients
FROM public.cfm_prescriptions
GROUP BY status;

COMMENT ON VIEW public.v_cfm_prescription_funnel IS
'V1.9.173 — funil de status cfm_prescriptions com tempo médio em cada estágio. Diagnóstico DRAFT 94.6%.';

-- 2) Drafts presos (>7d sem update) com info de quem/quando
CREATE OR REPLACE VIEW public.v_cfm_prescription_stuck_drafts WITH (security_invoker = true) AS
SELECT
    p.id,
    p.created_at,
    p.updated_at,
    ROUND(EXTRACT(EPOCH FROM (NOW() - p.updated_at)) / 86400.0, 1)  AS days_stale,
    p.professional_id,
    p.professional_name,
    p.professional_crm,
    p.patient_id,
    p.patient_name,
    p.prescription_type,
    p.document_level,
    jsonb_array_length(COALESCE(p.medications, '[]'::jsonb))         AS medication_count,
    p.signature_certificate IS NOT NULL                              AS has_certificate,
    p.digital_signature IS NOT NULL                                  AS has_signature,
    p.notes IS NOT NULL AND length(p.notes) > 0                      AS has_notes
FROM public.cfm_prescriptions p
WHERE p.status = 'draft'
  AND p.updated_at < NOW() - INTERVAL '7 days'
ORDER BY p.updated_at DESC;

COMMENT ON VIEW public.v_cfm_prescription_stuck_drafts IS
'V1.9.173 — drafts cfm_prescriptions parados >7d. Identifica gargalo por médico/paciente.';

-- 3) Funnel histórico (últimos 90d): criados, evoluíram, abandonaram
CREATE OR REPLACE VIEW public.v_cfm_prescription_creation_trend WITH (security_invoker = true) AS
SELECT
    date_trunc('day', created_at)::date                              AS day,
    COUNT(*)                                                         AS created,
    COUNT(*) FILTER (WHERE status = 'signed')                        AS reached_signed,
    COUNT(*) FILTER (WHERE status = 'sent')                          AS reached_sent,
    COUNT(*) FILTER (WHERE status = 'draft')                         AS still_draft
FROM public.cfm_prescriptions
WHERE created_at > NOW() - INTERVAL '90 days'
GROUP BY date_trunc('day', created_at)::date
ORDER BY day DESC;

COMMENT ON VIEW public.v_cfm_prescription_creation_trend IS
'V1.9.173 — trend diário de criação cfm_prescriptions e evolução de status (90d).';

-- Grants conservadores: só authenticated (admin/profissional/paciente — RLS de cfm_prescriptions cuida)
-- Views inherit RLS da tabela base, então paciente só vê suas próprias linhas.
GRANT SELECT ON public.v_cfm_prescription_funnel               TO authenticated;
GRANT SELECT ON public.v_cfm_prescription_stuck_drafts         TO authenticated;
GRANT SELECT ON public.v_cfm_prescription_creation_trend       TO authenticated;
