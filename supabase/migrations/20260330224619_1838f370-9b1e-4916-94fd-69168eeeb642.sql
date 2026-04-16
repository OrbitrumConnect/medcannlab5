-- João Eduardo (jevyarok@gmail.com): profissional → paciente
-- Ele NÃO é médico, é paciente

-- 1. Corrigir type na tabela users
UPDATE public.users 
SET type = 'paciente' 
WHERE id = 'b4340e71-5dcb-481c-a34c-dd5f162c51a2' 
  AND email = 'jevyarok@gmail.com';

-- 2. Remover role 'profissional' (incorreta)
DELETE FROM public.user_roles 
WHERE user_id = 'b4340e71-5dcb-481c-a34c-dd5f162c51a2' 
  AND role = 'profissional';

-- 3. Garantir que tem role 'paciente'
INSERT INTO public.user_roles (user_id, role)
VALUES ('b4340e71-5dcb-481c-a34c-dd5f162c51a2', 'paciente')
ON CONFLICT (user_id, role) DO NOTHING;