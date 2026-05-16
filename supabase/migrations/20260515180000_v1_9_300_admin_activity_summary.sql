-- ==============================================================================
-- V1.9.300 — admin_get_users_activity_summary (badge "Atividade ao Vivo")
-- ==============================================================================
--
-- Contexto: V1.9.297 deu heartbeat (presença online/offline) mas painel admin
-- só sabe "ONLINE" sem dizer O QUE o usuário está fazendo. Pedro pediu enriquecer
-- coluna STATUS com atividade real ("Em AEC fase X", "Chat com Nôa", etc.).
--
-- Solução: RPC SECURITY DEFINER que pra cada user com noa_logs nos últimos 30min,
-- retorna última fase AEC + tipo de interação. Frontend faz merge no render.
--
-- Anti-regressão:
--   - admin_get_users_status (V1.9.297) INTACTA
--   - RPC nova, sem impacto em queries existentes
--   - SECURITY DEFINER + is_admin() check (só admin vê)
--   - Falha silenciosa se noa_logs indisponível (frontend já tem fallback)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.admin_get_users_activity_summary()
RETURNS TABLE(
  user_id uuid,
  last_phase text,
  last_evt text,
  last_activity_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Acesso Negado: Apenas administradores.';
  END IF;

  RETURN QUERY
  SELECT DISTINCT ON (nl.user_id)
    nl.user_id,
    (nl.payload->>'phase')::text AS last_phase,
    nl.interaction_type::text AS last_evt,
    nl.created_at AS last_activity_at
  FROM public.noa_logs nl
  WHERE nl.created_at > (now() - interval '30 minutes')
    AND nl.user_id IS NOT NULL
  ORDER BY nl.user_id, nl.created_at DESC;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.admin_get_users_activity_summary() TO authenticated;

COMMENT ON FUNCTION public.admin_get_users_activity_summary() IS
  'V1.9.300 — Pra cada user com noa_logs nos últimos 30min, retorna última fase AEC + interaction_type. Frontend faz merge com admin_get_users_status pra enriquecer badge STATUS. Admin-only via is_admin() guard.';
