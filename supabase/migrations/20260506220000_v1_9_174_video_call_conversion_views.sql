-- V1.9.174 — Views diagnósticas video_call_requests conversion (READ-ONLY)
-- ===================================================================
-- Audit empírico 06/05: 239 video_call_requests, 110 accepted (46%), 79 cancelled
-- (33%), 37 expired (15%), 13 rejected (5%). Demanda alta — falta entender padrão
-- de conversão por médico, latência de resposta, e janela horária.
--
-- ZERO impacto produto: views read-only, security_invoker=true (RLS herda),
-- podem ser dropadas sem perda. Não toca CORE.

-- 1) Funil agregado de conversion
CREATE OR REPLACE VIEW public.v_video_call_conversion WITH (security_invoker = true) AS
SELECT
    status,
    COUNT(*)                                                              AS total,
    ROUND(100.0 * COUNT(*) / NULLIF(SUM(COUNT(*)) OVER (), 0), 1)         AS pct_total,
    COUNT(DISTINCT requester_id)                                          AS distinct_requesters,
    COUNT(DISTINCT recipient_id)                                          AS distinct_recipients,
    -- Latência média do response (created → status terminal)
    ROUND(AVG(EXTRACT(EPOCH FROM (
        COALESCE(accepted_at, rejected_at, cancelled_at, expires_at) - created_at
    )) / 60.0)::numeric, 1)                                               AS avg_response_minutes,
    MIN(created_at)                                                       AS oldest,
    MAX(created_at)                                                       AS newest,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days')        AS last_7d,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours')      AS last_24h
FROM public.video_call_requests
GROUP BY status;

COMMENT ON VIEW public.v_video_call_conversion IS
'V1.9.174 — funil de conversão video_call_requests. Latência response, distinct profs/patients, janelas 24h/7d.';

-- 2) Trend diário (90d) com taxa de aceite
CREATE OR REPLACE VIEW public.v_video_call_daily_trend WITH (security_invoker = true) AS
SELECT
    date_trunc('day', created_at)::date                                   AS day,
    COUNT(*)                                                              AS total_requests,
    COUNT(*) FILTER (WHERE status = 'accepted')                           AS accepted,
    COUNT(*) FILTER (WHERE status = 'rejected')                           AS rejected,
    COUNT(*) FILTER (WHERE status = 'cancelled')                          AS cancelled,
    COUNT(*) FILTER (WHERE status = 'expired')                            AS expired,
    ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'accepted')
                / NULLIF(COUNT(*), 0), 1)                                 AS accept_rate_pct,
    COUNT(DISTINCT requester_id)                                          AS distinct_requesters,
    COUNT(DISTINCT recipient_id)                                          AS distinct_recipients
FROM public.video_call_requests
WHERE created_at > NOW() - INTERVAL '90 days'
GROUP BY date_trunc('day', created_at)::date
ORDER BY day DESC;

COMMENT ON VIEW public.v_video_call_daily_trend IS
'V1.9.174 — trend diário 90d com accept_rate por dia. Identifica picos de demanda e dias quietos.';

-- 3) Por recipient (geralmente médico) — taxa de aceite individual
CREATE OR REPLACE VIEW public.v_video_call_recipient_response WITH (security_invoker = true) AS
SELECT
    v.recipient_id,
    u.name                                                                AS recipient_name,
    u.type                                                                AS recipient_type,
    COUNT(*)                                                              AS total_received,
    COUNT(*) FILTER (WHERE v.status = 'accepted')                         AS accepted,
    COUNT(*) FILTER (WHERE v.status = 'rejected')                         AS rejected,
    COUNT(*) FILTER (WHERE v.status = 'expired')                          AS expired,
    COUNT(*) FILTER (WHERE v.status = 'cancelled')                        AS cancelled_by_caller,
    ROUND(100.0 * COUNT(*) FILTER (WHERE v.status = 'accepted')
                / NULLIF(COUNT(*), 0), 1)                                 AS accept_rate_pct,
    ROUND(AVG(EXTRACT(EPOCH FROM (v.accepted_at - v.created_at)) / 60.0)
                FILTER (WHERE v.accepted_at IS NOT NULL)::numeric, 1)     AS avg_accept_latency_min,
    MAX(v.created_at)                                                     AS last_request_at
FROM public.video_call_requests v
LEFT JOIN public.users u ON u.id = v.recipient_id
GROUP BY v.recipient_id, u.name, u.type
HAVING COUNT(*) >= 3
ORDER BY total_received DESC;

COMMENT ON VIEW public.v_video_call_recipient_response IS
'V1.9.174 — taxa de aceite por destinatário (≥3 requests). Identifica médicos lentos/ausentes.';

-- Grants conservadores
GRANT SELECT ON public.v_video_call_conversion          TO authenticated;
GRANT SELECT ON public.v_video_call_daily_trend         TO authenticated;
GRANT SELECT ON public.v_video_call_recipient_response  TO authenticated;
