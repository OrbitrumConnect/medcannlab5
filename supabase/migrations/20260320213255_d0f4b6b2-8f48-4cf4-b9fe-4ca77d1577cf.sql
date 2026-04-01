-- =====================================================
-- CORREÇÃO: Garantir que não-pacientes NUNCA tenham payment_status 'pending'
-- =====================================================

-- 1. Corrigir dados existentes: profissionais, admins e alunos → exempt
UPDATE public.users 
SET payment_status = 'exempt' 
WHERE type IN ('admin', 'profissional', 'professional', 'aluno', 'master')
  AND payment_status != 'exempt';

-- 2. Trigger: Auto-exempt para não-pacientes (proteção futura)
CREATE OR REPLACE FUNCTION public.auto_exempt_non_patients()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se o tipo NÃO é paciente, forçar payment_status = 'exempt'
  IF NEW.type IS NOT NULL AND NEW.type NOT IN ('paciente', 'patient') THEN
    NEW.payment_status := 'exempt';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tg_auto_exempt_non_patients ON public.users;
CREATE TRIGGER tg_auto_exempt_non_patients
  BEFORE INSERT OR UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_exempt_non_patients();