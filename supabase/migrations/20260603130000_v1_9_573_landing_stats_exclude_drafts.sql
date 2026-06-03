-- V1.9.573: refina get_public_landing_stats — exclui rascunhos AEC incompletos da contagem.
-- Os relatorios com id LIKE 'aec_draft_%' sao snapshots de AEC nao-finalizada (nao assinados,
-- sem medico). Contar como "avaliacoes clinicas ja realizadas" infla o numero publico.
-- Antes: 150 (incluia 11 rascunhos) | Depois: 139 (so relatorios reais finalizados).
-- avaliacoes_assinadas e profissionais inalterados (assinados ja excluem rascunhos por natureza).

CREATE OR REPLACE FUNCTION public.get_public_landing_stats()
RETURNS json
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $func$
  SELECT json_build_object(
    'avaliacoes', (SELECT count(*) FROM clinical_reports WHERE id NOT LIKE 'aec_draft_%'),
    'avaliacoes_assinadas', (SELECT count(*) FROM clinical_reports WHERE signed_at IS NOT NULL),
    'profissionais', (SELECT count(*) FROM users WHERE type = 'professional' AND specialty IS NOT NULL AND btrim(specialty) <> '')
  );
$func$;

GRANT EXECUTE ON FUNCTION public.get_public_landing_stats() TO anon, authenticated;
