-- V1.9.572: RPC pública de estatísticas para a landing (contadores AO VIVO).
-- Read-only, SECURITY DEFINER (bypass RLS) retornando APENAS agregados COUNT — zero PII.
-- Consumida por src/pages/Landing.tsx (cards "Avaliações no sistema" + "Profissionais especialistas").
-- Substitui números hardcoded ("+90" / "9") por contagem real do banco.
--   avaliacoes            = clinical_reports (total)
--   avaliacoes_assinadas  = clinical_reports com signed_at (ICP)
--   profissionais         = users type=professional COM especialidade registrada (especialistas)
-- Grant a anon (landing é pública, sem login) + authenticated.

CREATE OR REPLACE FUNCTION public.get_public_landing_stats()
RETURNS json
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $func$
  SELECT json_build_object(
    'avaliacoes', (SELECT count(*) FROM clinical_reports),
    'avaliacoes_assinadas', (SELECT count(*) FROM clinical_reports WHERE signed_at IS NOT NULL),
    'profissionais', (SELECT count(*) FROM users WHERE type = 'professional' AND specialty IS NOT NULL AND btrim(specialty) <> '')
  );
$func$;

GRANT EXECUTE ON FUNCTION public.get_public_landing_stats() TO anon, authenticated;
