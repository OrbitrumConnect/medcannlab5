-- V1.9.176 — Adicionar metadata jsonb em pki_transactions pra registrar modo de assinatura
-- ====================================================================
-- Edge digital-signature v60 (dual-mode) precisa registrar:
--   { signing_mode: 'real' | 'api_stub' | 'simulation', validation_code: '...' }
-- Coluna nullable, default NULL — zero regressão (pki_transactions tem 0 rows hoje).

ALTER TABLE public.pki_transactions
  ADD COLUMN IF NOT EXISTS metadata JSONB;

COMMENT ON COLUMN public.pki_transactions.metadata IS
  'V1.9.176 — meta da transação. Inclui signing_mode (real/api_stub/simulation) pra distinguir assinatura real ICP-Brasil de fallbacks.';

-- View diagnóstica auditável: distribuição de modos
CREATE OR REPLACE VIEW public.v_pki_signing_modes WITH (security_invoker = true) AS
SELECT
  COALESCE(metadata->>'signing_mode', 'unknown') AS signing_mode,
  COUNT(*)                                        AS total,
  MIN(created_at)                                 AS first_seen,
  MAX(created_at)                                 AS last_seen
FROM public.pki_transactions
GROUP BY metadata->>'signing_mode'
ORDER BY total DESC;

COMMENT ON VIEW public.v_pki_signing_modes IS
  'V1.9.176 — distribuição de modos de assinatura (real/api_stub/simulation/unknown).';

GRANT SELECT ON public.v_pki_signing_modes TO authenticated;
