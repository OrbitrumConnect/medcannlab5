-- V1.9.295: admin_get_users_status — owner_id efetivo
--
-- Antes: RPC retornava só u.owner_id, deixando 11 pacientes vinculados ao
-- Ricardo invisíveis na coluna "Owner (Médico)" do painel (porque só tinham
-- appointments, não owner_id setado).
--
-- Agora: owner_id efetivo = COALESCE(owner_id explícito, invited_by, último
-- professional de appointment). Mesma signature, nenhum caller quebra
-- (ProfessionalMyDashboard só usa name/type/status, não lê owner_id).

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
        (au.last_sign_in_at > (now() - interval '15 minutes'))
    FROM public.users u
    JOIN auth.users au ON u.id = au.id
    ORDER BY au.last_sign_in_at DESC NULLS LAST;
END;
$function$;
