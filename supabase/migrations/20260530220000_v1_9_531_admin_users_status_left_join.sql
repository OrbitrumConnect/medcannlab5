-- V1.9.531 — Fix admin_get_users_status: INNER JOIN → LEFT JOIN (mostra orfaos public.users)
-- ============================================================
-- BUG REAL identificado empiricamente HOJE 30/05 ~19h50 BRT pos audit Pedro:
--
--   PROBLEMA EMPIRICO (PAT):
--     - public.users total: 51 rows
--     - auth.users total: 44 rows
--     - 9 orfaos public.users SEM auth.users:
--       * Flavia Critstina (HOJE 14:57) - cadastrada por Ricardo Novo Paciente
--       * CArlos Eduardo Olivaira (04/05)
--       * Badhia Waarrak (01/05)
--       * MILTON LUQUETT NETTO (28/04)
--       * Marne Serrano Caldera (27/04)
--       * Joao Vidal SOCIO FUNDADOR (28/01) ⚠️
--       * 3 pacientes anonimizados V1.9.407 (#79700b / #9362c5 / #aee021)
--
--   CAUSA RAIZ:
--     RPC admin_get_users_status() faz INNER JOIN auth.users:
--       FROM public.users u JOIN auth.users au ON u.id = au.id
--     INNER JOIN EXCLUI todo public.users sem correspondente em auth.users.
--     Tela "Base de Usuarios Unificada" (ClinicalGovernanceAdmin.tsx:318)
--     mostra apenas 42 dos 51 users reais. Admin Pedro tem visao FALSA do
--     sistema (nao consegue gerenciar/editar/ativar os 9 orfaos legitimos).
--
--   PATTERN CFM-COMPLIANT documentado em memory feedback_padrao_orfaos_public_users_validos_29_05:
--     "Rows em public.users SEM auth.users NAO sao orfas nem bug por padrao —
--     sao pattern arquitetural valido. CFM 2.314 permite prontuario sem login."
--
-- FIX ELITE ESCALAVEL ZERO REGRESSAO:
--   - INNER JOIN → LEFT JOIN (LEFT JOIN eh superset de INNER, nao remove ninguem)
--   - COALESCE(au.email, u.email) - email do auth se existir, fallback public
--   - COALESCE no is_online com false default - orfaos nunca online
--   - ORDER BY adiciona u.created_at no fallback NULLS LAST
--
-- ANTI-REGRESSAO:
--   - LEFT JOIN garante que TODOS os 42 users com auth continuam visiveis
--   - ADICIONA 9 orfaos invisiveis HOJE
--   - Tipos retornados identicos (RETURNS TABLE intocado)
--   - Frontend ClinicalGovernanceAdmin recebe estrutura igual + 9 rows extras
--   - Filtros existentes (status='banned', payment_status='paid') continuam funcionando
--
-- ROLLBACK 30s:
--   CREATE OR REPLACE FUNCTION admin_get_users_status (versao antiga com INNER JOIN)

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
    -- V1.9.531: COALESCE email auth OU public (orfaos public.users tem email proprio)
    COALESCE(au.email, u.email)::text,
    u.type::text,
    COALESCE(to_jsonb(u)->>'status', 'active')::text,
    COALESCE(to_jsonb(u)->>'payment_status', 'pending')::text,
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
    au.last_sign_in_at,  -- NULL pra orfaos (esperado)
    u.created_at,
    -- V1.9.531: COALESCE com false pra orfaos (nunca foram online)
    COALESCE(
      u.last_seen_at > (now() - interval '2 minutes'),
      au.last_sign_in_at > (now() - interval '15 minutes'),
      false
    ) AS is_online
  FROM public.users u
  -- V1.9.531: LEFT JOIN (era INNER) - inclui orfaos public.users legitimos
  LEFT JOIN auth.users au ON u.id = au.id
  -- V1.9.531: ORDER BY adiciona u.created_at como fallback NULLS LAST
  ORDER BY COALESCE(u.last_seen_at, au.last_sign_in_at, u.created_at) DESC NULLS LAST;
END;
$function$;

COMMENT ON FUNCTION public.admin_get_users_status() IS
  'V1.9.531 - Lista users com LEFT JOIN auth.users (inclui orfaos public.users legitimos CFM 2.314-compliant). Fix do bug empirico identificado 30/05: tela admin escondia 9 orfaos legitimos (incluindo Flavia cadastrada HOJE + Joao Vidal SOCIO). LEFT JOIN garante visibilidade total + zero regressao (superset INNER).';
