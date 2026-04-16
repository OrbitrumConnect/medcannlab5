-- ====================================================================
-- SCRIPT DE PADRONIZAÇÃO DE CONSTRAINT DE GÊNERO (users_gender_check)
-- Alinhando o Banco de Dados com o Frontend (M, F, Outro)
-- ====================================================================

-- 1. Remove a constraint antiga que está causando interrupção no fluxo de cadastro
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_gender_check;

-- 2. Adiciona a nova constraint robusta que aceita os padrões do sistema:
-- M (Masculino), F (Feminino), Outro
-- Também aceita null para pacientes que não informarem.
ALTER TABLE public.users ADD CONSTRAINT users_gender_check 
CHECK (gender IS NULL OR gender = ANY (ARRAY['M'::text, 'F'::text, 'Outro'::text]));

-- 3. Opcional: Migrar dados antigos caso existam rascunhos em minúsculo
UPDATE public.users SET gender = 'M' WHERE LOWER(gender) = 'masculino';
UPDATE public.users SET gender = 'F' WHERE LOWER(gender) = 'feminino';
UPDATE public.users SET gender = 'Outro' WHERE LOWER(gender) = 'outro';

COMMENT ON CONSTRAINT users_gender_check ON public.users IS 'Garante que o gênero siga o padrão do sistema (M/F/Outro)';
