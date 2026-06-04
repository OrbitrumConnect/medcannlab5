-- V1.9.581: RPC canônica ÚNICA de stats do usuário — fim da divergência Nôa↔UI.
-- Bug empírico (Pedro Paciente d5e01ead): a Nôa dizia "20 avaliações / 125 dias", a UI
-- mostrava "45 AECs / 104 dias", e o prontuário capava em 10 — TRÊS fontes descoordenadas,
-- cada uma com seu cap/cálculo:
--   • buildPatientContext (Nôa): clinical_reports .limit(20) + length  -> capava em 20
--   • prontuário PatientsManagement: clinical_reports .limit(10) + length -> capava em 10
--   • dias: ora public.users.created_at (125, correto), ora latestReport.created_at (errado)
--
-- Fonte ÚNICA e correta (grounded):
--   • dias_no_app = public.users.created_at  (tabela de usuário canônica)
--   • avaliacoes  = COUNT(clinical_reports não-draft)  (mesma regra da landing get_public_landing_stats)
--
-- Consumidores ligados nesta fonte: buildPatientContext (Nôa) + PatientsManagement (prontuário).
-- SECURITY DEFINER (bypass RLS) retornando só agregados (sem PII). GRANT authenticated.
-- Smoke: get_user_stats('d5e01ead...') = {dias_no_app:125, avaliacoes:46, assinadas:14}.

CREATE OR REPLACE FUNCTION public.get_user_stats(p_user_id uuid)
RETURNS json
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $fn$
  SELECT json_build_object(
    'dias_no_app', GREATEST(0, (now()::date - (SELECT created_at::date FROM users WHERE id = p_user_id))),
    'avaliacoes', (SELECT count(*) FROM clinical_reports WHERE patient_id = p_user_id AND id NOT LIKE 'aec_draft_%'),
    'avaliacoes_assinadas', (SELECT count(*) FROM clinical_reports WHERE patient_id = p_user_id AND signed_at IS NOT NULL),
    'ultima_avaliacao', (SELECT max(created_at) FROM clinical_reports WHERE patient_id = p_user_id AND id NOT LIKE 'aec_draft_%')
  );
$fn$;

GRANT EXECUTE ON FUNCTION public.get_user_stats(uuid) TO authenticated;
