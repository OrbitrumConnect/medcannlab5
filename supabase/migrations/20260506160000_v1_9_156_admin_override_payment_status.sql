-- ==============================================================================
-- V1.9.156 — Admin override no trigger auto_exempt_non_patients
-- ==============================================================================
--
-- Trigger original (20260320213255) protegia contra non-patient ficar em
-- 'pending' por engano (paciente real era único que pagava subscription).
--
-- Limitação descoberta empíricamente Pedro 06/05 ~12h BRT:
--   Pedro admin tentou marcar Manoel (professional) como 'paid' via UI Admin Terminal.
--   UPDATE chegava no banco, mas trigger BEFORE UPDATE sobrescrevia
--   payment_status='exempt' SEMPRE (porque type='professional' != paciente).
--   Admin não conseguia override deliberado.
--
-- Fix: detectar admin via has_role() — admin loga e ajusta deliberadamente,
-- trigger respeita. Non-admin continua com proteção original (paciente=pending,
-- non-paciente=exempt automático).
--
-- Aplicado empíricamente em produção 06/05 ~12h BRT via PAT Pedro.
-- Validado: UPDATE Manoel manoelolavo@gmail.com → payment_status='paid' ✓.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.auto_exempt_non_patients()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
BEGIN
  -- V1.9.156: admin override — admin loga e ajusta deliberadamente.
  -- has_role checa via tabela user_roles (single source of truth de permissão).
  IF auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'::app_role) THEN
    RETURN NEW;
  END IF;

  -- Comportamento original: força exempt em non-patients (proteção).
  IF NEW.type IS NOT NULL AND NEW.type NOT IN ('paciente', 'patient') THEN
    NEW.payment_status := 'exempt';
  END IF;

  RETURN NEW;
END;
$func$;

COMMENT ON FUNCTION public.auto_exempt_non_patients() IS
  'V1.9.156 — Admin (has_role) pode override. Non-admin mantém proteção original (paciente=pending, non-paciente=exempt).';
