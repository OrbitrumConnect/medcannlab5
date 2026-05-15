-- ==============================================================================
-- V1.9.297 — last_seen_at heartbeat (resolve painel "0 ONLINE AGORA" falso)
-- ==============================================================================
--
-- Pedro 15/05 ~10h17 BRT identificou: painel admin mostrava 0 online mesmo com
-- Pedro+Ricardo logados, porque RPC admin_get_users_status usava
-- (au.last_sign_in_at > now() - interval '15 minutes') que só atualiza no login
-- explícito, não enquanto usuário navega.
--
-- Fix: adicionar coluna users.last_seen_at + RPC heartbeat_user_seen (chamada
-- pelo frontend a cada 60s) + atualizar admin_get_users_status pra usar
-- last_seen_at preferencialmente (fallback last_sign_in_at preserva backward
-- compat pra rows sem last_seen_at).
--
-- Anti-regressão:
-- - Coluna nullable (rows antigos não quebram nada)
-- - RPC heartbeat usa SECURITY DEFINER + auth.uid() (não precisa RLS especial)
-- - admin_get_users_status mantém signature idêntica (callers não quebram)
-- - COALESCE garante is_online correto mesmo se last_seen_at for null
-- ==============================================================================

-- 1) Coluna last_seen_at
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz;

-- Índice pra queries de filtro online
CREATE INDEX IF NOT EXISTS idx_users_last_seen_at
  ON public.users(last_seen_at DESC NULLS LAST);

-- 2) RPC heartbeat — SECURITY DEFINER, user só atualiza próprio last_seen_at
CREATE OR REPLACE FUNCTION public.heartbeat_user_seen()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;
  UPDATE public.users
     SET last_seen_at = now()
   WHERE id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION public.heartbeat_user_seen() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.heartbeat_user_seen() FROM anon;

COMMENT ON FUNCTION public.heartbeat_user_seen() IS
  'V1.9.297 — Frontend chama a cada 60s pra atualizar users.last_seen_at do user logado. Usa auth.uid() (security definer). Falha silenciosa se anon.';

-- 3) Atualizar admin_get_users_status pra preferir last_seen_at (fallback preserva backward compat)
CREATE OR REPLACE FUNCTION public.admin_get_users_status()
RETURNS TABLE(
    user_id uuid,
    name text,
    email text,
    type text,
    status text,
    payment_status text,
    owner_id uuid,
    last_sign_in_at timestamp with time zone,
    created_at timestamp with time zone,
    is_online boolean
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
    SELECT
        u.id,
        u.name::text,
        au.email::text,
        u.type::text,
        COALESCE(to_jsonb(u)->>'status','active')::text,
        COALESCE(to_jsonb(u)->>'payment_status','pending')::text,
        COALESCE(
            u.owner_id,
            u.invited_by,
            (SELECT a.professional_id
               FROM public.appointments a
              WHERE a.patient_id = u.id
                AND a.professional_id IS NOT NULL
              ORDER BY a.created_at DESC
              LIMIT 1)
        ) AS owner_id,
        au.last_sign_in_at,
        u.created_at,
        -- V1.9.297: preferir last_seen_at (atividade real, threshold 2min)
        -- Fallback: last_sign_in_at (15min) pra users antigos sem last_seen_at
        COALESCE(
            u.last_seen_at > (now() - interval '2 minutes'),
            au.last_sign_in_at > (now() - interval '15 minutes')
        ) AS is_online
    FROM public.users u
    JOIN auth.users au ON u.id = au.id
    ORDER BY COALESCE(u.last_seen_at, au.last_sign_in_at) DESC NULLS LAST;
END;
$function$;

COMMENT ON FUNCTION public.admin_get_users_status() IS
  'V1.9.297 — is_online agora prefere last_seen_at (heartbeat 60s, threshold 2min). Fallback last_sign_in_at 15min preserva backward compat. Mesma signature de V1.9.295.';
