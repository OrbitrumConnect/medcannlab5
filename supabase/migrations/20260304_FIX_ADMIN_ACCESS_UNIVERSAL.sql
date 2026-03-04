-- =====================================================
-- 🔓 FIX: Admin Access para TODOS os admins
-- Problema: RPC e RLS usavam emails hardcoded (phpg69, admin@medcannlab)
-- Fix: Usar is_admin() / has_role() que verificam tabela user_roles
-- =====================================================

BEGIN;

-- 1. RECRIAR RPC admin_get_users_status: usar is_admin() em vez de emails
CREATE OR REPLACE FUNCTION public.admin_get_users_status()
RETURNS TABLE (
    user_id uuid,
    name text,
    email text,
    type text,
    status text,
    payment_status text,
    owner_id uuid,
    last_sign_in_at timestamptz,
    created_at timestamptz,
    is_online boolean
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth 
AS $$
BEGIN
    -- Verificar se é admin via tabela user_roles (função is_admin())
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Acesso Negado: Apenas administradores podem auditar usuários.';
    END IF;

    RETURN QUERY
    SELECT 
        u.id as user_id,
        u.name::text,
        au.email::text,
        u.type::text,
        COALESCE(to_jsonb(u)->>'status', 'active')::text as status,
        COALESCE(to_jsonb(u)->>'payment_status', 'pending')::text as payment_status,
        u.owner_id,
        au.last_sign_in_at,
        u.created_at,
        (au.last_sign_in_at > (now() - interval '15 minutes')) as is_online
    FROM 
        public.users u
    JOIN 
        auth.users au ON u.id = au.id
    ORDER BY 
        au.last_sign_in_at DESC NULLS LAST;

END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_users_status() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_get_users_status() FROM anon;

-- 2. FIX RLS policies na tabela users: usar is_admin()
DROP POLICY IF EXISTS "Users can view own profile or admins view all" ON public.users;
CREATE POLICY "Users can view own profile or admins view all" ON public.users
  FOR SELECT
  USING (
    auth.uid() = id
    OR 
    public.is_admin()
  );

-- 3. FIX RLS policies nas prescriptions: usar is_admin()
DROP POLICY IF EXISTS "Admins and owners can view prescriptions" ON public.cfm_prescriptions;
CREATE POLICY "Admins and owners can view prescriptions" ON public.cfm_prescriptions
  FOR SELECT
  USING (
    auth.uid() = patient_id
    OR
    auth.uid() = professional_id
    OR
    public.is_admin()
  );

-- 4. Garantir que TODOS os admins conhecidos estão na tabela user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'::public.app_role
FROM public.users u
JOIN auth.users au ON u.id = au.id
WHERE au.email IN (
    'phpg69@gmail.com',
    'rrvalenca@gmail.com',
    'eduardoscfaveret@gmail.com',
    'cbdrcpremium@gmail.com',
    'iaianoaesperanza@gmail.com'
)
ON CONFLICT (user_id, role) DO NOTHING;

COMMIT;

SELECT '✅ Admin access universalizado — todos os admins agora veem o mesmo painel.' as status;
