-- V1.9.229 — Onboarding profissional completo: trigger persiste council_* + fee + onboarding_completed_at
-- Data: 11/05/2026 19:46 BRT
--
-- Contexto: Auditoria empírica via PAT (11/05) revelou:
--   • Signup V1.9.207 já valida council_type+number+state obrigatórios pra profissional
--   • Signup V1.9.147 já passa specialty na metadata
--   • PORÉM trigger handle_new_user lia APENAS specialty → council_* ignorados silenciosamente
--   • Resultado: 10/10 médicos cadastrados com council_*=NULL no banco mesmo enviando dados
--   • Adicionalmente: consultation_fee_default nunca entrou no signup → 9/10 sem fee
--
-- Fix V1.9.229: trigger estendido para ler todos campos da raw_user_meta_data
-- + setar onboarding_completed_at automaticamente quando profissional E completo.
--
-- Anti-regressão:
--   • CREATE OR REPLACE → idempotente
--   • ON CONFLICT DO UPDATE com COALESCE → preserva valores existentes dos 10 médicos atuais
--   • NULLIF (string vazia → NULL) → comportamento robusto
--   • Parse de fee com BEGIN/EXCEPTION → não quebra se metadata tiver formato inválido
--   • Pacientes não tocados (campos profissionais ficam NULL)
--   • Admins (Ricardo/Eduardo) preservados via COALESCE
--
-- Trigger fires em auth.users INSERT (via trigger on_auth_user_created).

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_type           text;
  v_council_type   text;
  v_council_number text;
  v_council_state  text;
  v_specialty      text;
  v_fee            numeric;
  v_is_complete    boolean;
BEGIN
  v_type           := COALESCE(NEW.raw_user_meta_data->>'type', 'patient');
  v_council_type   := NULLIF(NEW.raw_user_meta_data->>'council_type',   '');
  v_council_number := NULLIF(NEW.raw_user_meta_data->>'council_number', '');
  v_council_state  := NULLIF(NEW.raw_user_meta_data->>'council_state',  '');
  v_specialty      := NULLIF(NEW.raw_user_meta_data->>'specialty',      '');

  -- Parse fee robusto (text → numeric, NULL-safe)
  BEGIN
    v_fee := NULLIF(NEW.raw_user_meta_data->>'consultation_fee_default', '')::numeric;
  EXCEPTION WHEN OTHERS THEN
    v_fee := NULL;
  END;

  -- Onboarding completo = profissional + 5 campos preenchidos
  v_is_complete := (v_type IN ('profissional', 'professional'))
    AND v_council_type   IS NOT NULL
    AND v_council_number IS NOT NULL
    AND v_council_state  IS NOT NULL
    AND v_specialty      IS NOT NULL
    AND v_fee            IS NOT NULL;

  INSERT INTO public.users (
    id, email, name, type,
    council_type, council_number, council_state,
    specialty, consultation_fee_default,
    onboarding_completed_at,
    created_at, updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    v_type,
    v_council_type, v_council_number, v_council_state,
    v_specialty, v_fee,
    CASE WHEN v_is_complete THEN now() ELSE NULL END,
    NEW.created_at,
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email                    = EXCLUDED.email,
    council_type             = COALESCE(public.users.council_type,             EXCLUDED.council_type),
    council_number           = COALESCE(public.users.council_number,           EXCLUDED.council_number),
    council_state            = COALESCE(public.users.council_state,            EXCLUDED.council_state),
    specialty                = COALESCE(public.users.specialty,                EXCLUDED.specialty),
    consultation_fee_default = COALESCE(public.users.consultation_fee_default, EXCLUDED.consultation_fee_default),
    onboarding_completed_at  = COALESCE(public.users.onboarding_completed_at,  EXCLUDED.onboarding_completed_at),
    updated_at               = now();

  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    CASE v_type
      WHEN 'admin'        THEN 'admin'::public.app_role
      WHEN 'profissional' THEN 'profissional'::public.app_role
      WHEN 'professional' THEN 'profissional'::public.app_role
      WHEN 'aluno'        THEN 'aluno'::public.app_role
      ELSE 'paciente'::public.app_role
    END
  )
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$function$;

-- Comentário documental
COMMENT ON FUNCTION public.handle_new_user() IS
  'V1.9.229 — Persiste council_type/number/state + specialty + fee da raw_user_meta_data. Seta onboarding_completed_at se profissional + 5 campos. COALESCE preserva valores existentes (anti-regressão).';
