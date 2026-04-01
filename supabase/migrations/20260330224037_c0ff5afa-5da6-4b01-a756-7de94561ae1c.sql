-- ============================================================
-- CORREÇÃO CIRÚRGICA: Monica → paciente, Dayana → profissional
-- Sem tocar em dados clínicos, agendamentos ou chat
-- ============================================================

-- 1. Monica da Silva Pereira: type 'professional' → 'paciente'
UPDATE public.users 
SET type = 'paciente' 
WHERE id = '480177c8-9324-4360-898f-5066f9117ab4' 
  AND email = 'fisionamedidacerta@gmail.com';

-- 2. Remover role 'profissional' da Monica (ela é paciente)
DELETE FROM public.user_roles 
WHERE user_id = '480177c8-9324-4360-898f-5066f9117ab4' 
  AND role = 'profissional';

-- 3. Dayana Brazão: type 'professional' (EN) → 'profissional' (PT)
UPDATE public.users 
SET type = 'profissional' 
WHERE id = 'd6cfe184-38f9-4248-8dc2-83d4499e29ea' 
  AND email = 'dayanabrazao@gmail.com';

-- 4. Remover role 'paciente' duplicada da Dayana (ela é profissional)
DELETE FROM public.user_roles 
WHERE user_id = 'd6cfe184-38f9-4248-8dc2-83d4499e29ea' 
  AND role = 'paciente';

-- 5. Ativar RLS em noa_logs (única tabela sem proteção)
ALTER TABLE public.noa_logs ENABLE ROW LEVEL SECURITY;

-- Política básica: admins e profissionais podem ver logs
CREATE POLICY "Admins and professionals can view noa_logs"
ON public.noa_logs FOR SELECT
TO authenticated
USING (
  public.is_admin_user(auth.uid())
  OR public.has_role(auth.uid(), 'profissional')
);

-- Inserção permitida para sistema (authenticated)
CREATE POLICY "System can insert noa_logs"
ON public.noa_logs FOR INSERT
TO authenticated
WITH CHECK (true);

-- 6. Limpar role 'paciente' duplicada do Admin Test
DELETE FROM public.user_roles 
WHERE user_id = 'e4114d0a-af04-4c88-8eb6-e02cf024d61f' 
  AND role = 'paciente';